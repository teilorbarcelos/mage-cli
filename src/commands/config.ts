import { Command } from "commander";
import path from "path";
import os from "os";
import * as inquirer from "inquirer";
import {
  loadConfig,
  readGlobalConfig,
  writeGlobalConfig,
  writeLocalConfig,
  getGlobalConfigPath,
} from "../config/loader";
import { MageConfig, MageAI } from "../config/schema";
import * as logger from "../utils/logger";
import { fileExists } from "../utils/fs";
import { isRemoteEmpty, scaffoldRepo, runGit } from "../utils/scaffold";
import { getAIProvider } from "../ai/providers";

export function registerConfigCommand(program: Command): void {
  const config = program
    .command("config")
    .description("Manage mage configuration (global and local)");

  config
    .command("list-ai-models")
    .description("List available AI models for the current provider")
    .action(async () => {
      const merged = await loadConfig();
      if (!merged.ai) {
        logger.error("AI not configured.");
        process.exit(1);
      }
      const provider = getAIProvider(merged.ai);
      if ("listModels" in provider) {
        const spin = logger.spinner("Fetching available models...");
        try {
          const models = await (provider as any).listModels();
          spin.stop();
          logger.header(`Available Models (${merged.ai.provider})`);
          models.forEach((m: string) => console.log(`  - ${m}`));
        } catch (err: any) {
          spin.fail(`Failed to list models: ${err.message}`);
        }
      } else {
        logger.warn(`Model listing not supported for ${merged.ai.provider} yet.`);
      }
    });

  config
    .command("set <key> <value>")
    .description("Set a global configuration value")
    .action(async (key: string, value: string) => {
      const current = readGlobalConfig();
      await handleConfigSet(current, key, value);
      writeGlobalConfig(current);
    });

  config
    .command("show")
    .description("Show the merged active configuration")
    .action(async () => {
      const merged = await loadConfig();
      logger.header("Active Configuration (global + local merged)");

      if (merged.repository) {
        logger.keyValue(
          "Repository",
          `${merged.repository.owner}/${merged.repository.name}`
        );
        logger.keyValue("Branch", merged.repository.branch);
        logger.keyValue(
          "Token",
          merged.repository.token ? "••••••••" : "(not set)"
        );
        logger.keyValue("Local Path", merged.repository.localPath || "(not set)");
      } else {
        logger.dim("Repository: (not configured)");
      }

      console.log();

      if (merged.ai) {
        logger.keyValue("AI Provider", merged.ai.provider);
        logger.keyValue("AI Model", merged.ai.model);
        logger.keyValue(
          "AI Key",
          merged.ai.apiKey ? "••••••••" : "(not set)"
        );
      } else {
        logger.dim("AI: (not configured)");
      }

      console.log();

      if (merged.paths && Object.keys(merged.paths).length > 0) {
        for (const [key, val] of Object.entries(merged.paths)) {
          logger.keyValue(key, val);
        }
      } else {
        logger.dim("Paths: (using defaults)");
      }

      console.log();
      logger.dim(`Global config: ${getGlobalConfigPath()}`);
    });

  config
    .command("init")
    .description("Create a local .magerc.json in the current directory")
    .action(async () => {
      const localConfig: MageConfig = {
        paths: {
          components: "src/components",
          pages: "src/pages",
          hooks: "src/hooks",
          services: "src/services",
          lib: "src/lib",
        },
      };

      writeLocalConfig(localConfig);
      logger.success("Created .magerc.json in current directory");
      logger.dim(
        "This file overrides global config. Add repo/AI settings here for project-specific config."
      );
    });
}

async function handleConfigSet(
  config: MageConfig,
  key: string,
  value: string
): Promise<void> {
  const prompt = inquirer.createPromptModule();

  switch (key) {
    case "repo": {
      const [owner, name] = value.split("/");
      if (!owner || !name) {
        logger.error('Repository must be in "owner/name" format');
        process.exit(1);
      }

      const gitUrl = `git@github.com:${owner}/${name}.git`;
      const defaultPath = path.join(os.homedir(), "mage-cli-config", name);

      const { localPath } = await prompt<{ localPath: string }>([
        {
          type: "input",
          name: "localPath",
          message: "Where should the patterns repository be synced locally?",
          default: defaultPath,
        },
      ]);

      const resolvedPath = path.resolve(localPath);

      if (!fileExists(resolvedPath)) {
        logger.info(`Setting up repository at ${resolvedPath}...`);

        const remoteStatus = isRemoteEmpty(gitUrl);

        if (remoteStatus === "error") {
          logger.warn("Could not reach remote repository (connection or auth error).");
          logger.info("Initializing local git anyway, you might need to push/pull manually later.");
          runGit("git init", resolvedPath);
          runGit(`git remote add origin ${gitUrl}`, resolvedPath);
          logger.success("Local repository initialized and connected.");
        } else if (remoteStatus === true) {
          const { shouldScaffold } = await prompt<{ shouldScaffold: boolean }>([
            {
              type: "confirm",
              name: "shouldScaffold",
              message: "Remote repository seems empty. Scaffold starter patterns?",
              default: true,
            },
          ]);

          if (shouldScaffold) {
            scaffoldRepo(resolvedPath, gitUrl);
            logger.success("Starter patterns scaffolded and pushed to main.");
          } else {
            runGit("git init", resolvedPath);
            runGit(`git remote add origin ${gitUrl}`, resolvedPath);
            logger.success("Empty local repository initialized.");
          }
        } else {
          logger.info("Remote repository has content. Cloning...");
          try {
            const parentDir = path.dirname(resolvedPath);
            if (!fileExists(parentDir)) {
              runGit(`mkdir -p ${parentDir}`, parentDir === resolvedPath ? os.homedir() : path.dirname(parentDir));
              // Note: actual mkdir logic needs to be careful, but mkdir -p is safe
            }
            runGit(`git clone ${gitUrl} ${resolvedPath}`, path.dirname(resolvedPath));
            logger.success("Repository cloned successfully.");
          } catch (err) {
            logger.error("Clone failed. Check your SSH access and repository URL.");
            throw err;
          }
        }
      } else {
        logger.warn(`Directory ${resolvedPath} already exists. Skipping sync.`);
      }

      config.repository = {
        owner,
        name,
        branch: config.repository?.branch || "main",
        token: config.repository?.token,
        localPath: resolvedPath,
      };
      logger.success(`Global config updated: repo = ${owner}/${name}`);
      logger.success(`Local sync path: ${resolvedPath}`);
      break;
    }
    case "repo-branch":
      if (!config.repository) {
        logger.error("Set repo first: mage config set repo owner/name");
        process.exit(1);
      }
      config.repository.branch = value;
      logger.success(`Global config updated: repo-branch = ${value}`);
      break;
    case "repo-token":
      if (!config.repository) {
        logger.error("Set repo first: mage config set repo owner/name");
        process.exit(1);
      }
      config.repository.token = value;
      logger.success(`Global config updated: repo-token = (set)`);
      break;
    case "ai-key":
      config.ai = {
        provider: config.ai?.provider || "openai",
        model: config.ai?.model || "gpt-4o",
        apiKey: value,
      };
      logger.success(`Global config updated: ai-key = (set)`);
      break;
    case "ai-model":
      if (!config.ai) {
        logger.error("Set AI key first: mage config set ai-key <key>");
        process.exit(1);
      }
      config.ai.model = value;
      logger.success(`Global config updated: ai-model = ${value}`);
      break;
    case "ai-provider":
      const provider = value.toLowerCase() as "openai" | "gemini";
      if (provider !== "openai" && provider !== "gemini") {
        logger.error('AI provider must be either "openai" or "gemini"');
        process.exit(1);
      }
      config.ai = {
        provider,
        apiKey: config.ai?.apiKey || "",
        model: config.ai?.model || (provider === "openai" ? "gpt-4o" : "gemini-2.5-flash"),
      };
      logger.success(`Global config updated: ai-provider = ${provider}`);
      break;
    default:
      logger.error(
        `Unknown config key: "${key}". Valid keys: repo, repo-branch, repo-token, ai-key, ai-model, ai-provider`
      );
      process.exit(1);
  }
}

export async function listAIModels(config: MageAI): Promise<string[]> {
  const provider = getAIProvider(config);
  if ("listModels" in provider) {
    return (provider as any).listModels();
  }
  return [];
}
