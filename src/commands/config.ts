import { Command } from "commander";
import {
  loadConfig,
  readGlobalConfig,
  writeGlobalConfig,
  writeLocalConfig,
  getGlobalConfigPath,
} from "../config/loader";
import { MageConfig } from "../config/schema";
import * as logger from "../utils/logger";

export function registerConfigCommand(program: Command): void {
  const config = program
    .command("config")
    .description("Manage mage configuration (global and local)");

  config
    .command("set <key> <value>")
    .description("Set a global configuration value")
    .action((key: string, value: string) => {
      const current = readGlobalConfig();
      setConfigValue(current, key, value);
      writeGlobalConfig(current);
      logger.success(`Global config updated: ${key} = ${value}`);
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

function setConfigValue(config: MageConfig, key: string, value: string): void {
  switch (key) {
    case "repo": {
      const [owner, name] = value.split("/");
      if (!owner || !name) {
        logger.error('Repository must be in "owner/name" format');
        process.exit(1);
      }
      config.repository = {
        owner,
        name,
        branch: config.repository?.branch || "main",
        token: config.repository?.token,
      };
      break;
    }
    case "repo-branch":
      if (!config.repository) {
        logger.error("Set repo first: mage config set repo owner/name");
        process.exit(1);
      }
      config.repository.branch = value;
      break;
    case "repo-token":
      if (!config.repository) {
        logger.error("Set repo first: mage config set repo owner/name");
        process.exit(1);
      }
      config.repository.token = value;
      break;
    case "ai-key":
      config.ai = {
        provider: config.ai?.provider || "openai",
        model: config.ai?.model || "gpt-4o",
        apiKey: value,
      };
      break;
    case "ai-model":
      if (!config.ai) {
        logger.error("Set AI key first: mage config set ai-key <key>");
        process.exit(1);
      }
      config.ai.model = value;
      break;
    default:
      logger.error(
        `Unknown config key: "${key}". Valid keys: repo, repo-branch, repo-token, ai-key, ai-model`
      );
      process.exit(1);
  }
}
