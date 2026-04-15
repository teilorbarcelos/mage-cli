import { Command } from "commander";
import * as inquirer from "inquirer";
import { execSync } from "child_process";
import { loadConfig, readGlobalConfig, writeGlobalConfig } from "../config/loader";
import {
  fetchManifest,
  listBranches,
  createBranch,
  deleteBranch,
} from "../github/client";
import { clearCache } from "../github/cache";
import { registerInitRepoCommand } from "./init-repo";
import * as logger from "../utils/logger";
import { runGit, scaffoldOrphanRepo } from "../utils/scaffold";
import { fileExists, resolveFromCwd } from "../utils/fs";
import { templatizeRecursive } from "../utils/extractor";
import { addOrUpdatePatternInManifest, removePatternFromManifest } from "../utils/manifest";
import fs from "fs";
import path from "path";

export function registerPatternsCommand(program: Command): void {
  const patterns = program
    .command("patterns")
    .description("Manage and browse the patterns repository");

  patterns
    .command("add <sourcePath>")
    .description("Add a local file or directory as a new pattern")
    .option("-f, --framework <framework>", "Framework (react, next, node, etc.)")
    .option("-c, --category <category>", "Category (component, page, hook, etc.)")
    .option("-s, --scope <scope>", "Scope (frontend or backend)", "frontend")
    .option("-n, --name <name>", "Name of the pattern (defaults to basename)")
    .action(async (sourcePath: string, options: { framework?: string; category?: string; scope?: "frontend" | "backend"; name?: string }) => {
      const config = await loadConfig();
      if (!config.repository?.localPath) {
        logger.error("Local patterns repository not configured. Run 'mage config set repo' first.");
        process.exit(1);
      }

      const absoluteSource = resolveFromCwd(sourcePath);
      if (!fs.existsSync(absoluteSource)) {
        logger.error(`Source path "${sourcePath}" does not exist.`);
        process.exit(1);
      }

      const prompt = inquirer.createPromptModule();
      const name = options.name || path.basename(sourcePath).split(".")[0];
      
      const answers = await prompt([
        {
          type: "input",
          name: "framework",
          message: "Framework (e.g., react, next):",
          default: options.framework || "react",
          when: !options.framework,
        },
        {
          type: "list",
          name: "category",
          message: "Category:",
          choices: ["component", "page", "hook", "service", "layout", "other"],
          default: options.category || "component",
          when: !options.category,
        },
        {
          type: "input",
          name: "description",
          message: "Pattern description:",
          default: `Pattern for ${name}`,
        },
      ]);

      const framework = options.framework || answers.framework;
      const category = options.category || answers.category;
      const scope: "frontend" | "backend" = (options.scope === "backend" ? "backend" : "frontend");
      const description = answers.description;

      const patternRelativePath = `${scope}/${framework}/${category}/${name}`;
      const patternDestDir = path.join(config.repository.localPath, patternRelativePath);

      if (fs.existsSync(patternDestDir)) {
        logger.warn(`Pattern "${name}" already exists in ${patternRelativePath}. Use 'update' to overwrite.`);
        process.exit(1);
      }

      const spin = logger.spinner(`Extracting pattern "${name}"...`);
      try {
        // 1. Templatize and copy files
        const files = templatizeRecursive(absoluteSource, {
          sourceName: name,
          targetDir: path.join(patternDestDir, "template"),
        });

        // 2. Write pattern.json
        const patternMeta = {
          name,
          description,
          scope,
          framework,
          category,
          variables: [{ name: "name", description: "The resource name", required: true }],
        };
        fs.writeFileSync(path.join(patternDestDir, "pattern.json"), JSON.stringify(patternMeta, null, 2));

        // 3. Update manifest.json
        addOrUpdatePatternInManifest(config.repository.localPath, {
          name,
          description,
          scope,
          framework,
          category,
          path: patternRelativePath,
          files,
        });

        spin.succeed(`Pattern "${name}" added locally at ${patternRelativePath}`);

        // 4. Git Push
        const { push } = await prompt([{ type: "confirm", name: "push", message: "Push change to remote repository?", default: true }]);
        if (push) {
          logger.info("Committing and pushing patterns...");
          runGit(`git add .`, config.repository.localPath);
          runGit(`git commit -m "feat: add pattern ${name}"`, config.repository.localPath);
          runGit(`git push`, config.repository.localPath);
          logger.success("Changes pushed to remote.");
        }
      } catch (err: any) {
        spin.fail(`Failed to add pattern: ${err.message}`);
      }
    });

  patterns
    .command("remove <name>")
    .description("Remove a pattern from the repository")
    .action(async (name: string) => {
      const config = await loadConfig();
      if (!config.repository?.localPath) {
        logger.error("Local patterns repository not configured.");
        process.exit(1);
      }

      const manifest = await fetchManifest(config.repository);
      const pattern = manifest.patterns.find(p => p.name === name);

      if (!pattern) {
        logger.error(`Pattern "${name}" not found in manifest.`);
        process.exit(1);
      }

      const prompt = inquirer.createPromptModule();
      const { confirm } = await prompt([{ type: "confirm", name: "confirm", message: `Are you sure you want to delete pattern "${name}"?`, default: false }]);

      if (confirm) {
        logger.info(`Removing ${pattern.path}...`);
        fs.rmSync(path.join(config.repository.localPath, pattern.path), { recursive: true, force: true });
        
        removePatternFromManifest(config.repository.localPath, pattern.scope, pattern.framework, pattern.category, pattern.name);
        
        logger.success(`Pattern "${name}" removed locally.`);

        const { push } = await prompt([{ type: "confirm", name: "push", message: "Push change to remote repository?", default: true }]);
        if (push) {
          runGit(`git add .`, config.repository.localPath);
          runGit(`git commit -m "feat: remove pattern ${name}"`, config.repository.localPath);
          runGit(`git push`, config.repository.localPath);
          logger.success("Changes pushed to remote.");
        }
      }
    });

  patterns
    .command("update <name> [sourcePath]")
    .description("Update an existing pattern's template content")
    .action(async (name: string, sourcePath: string | undefined) => {
      const config = await loadConfig();
      if (!config.repository?.localPath) {
        logger.error("Local patterns repository not configured.");
        process.exit(1);
      }

      const manifest = await fetchManifest(config.repository);
      const pattern = manifest.patterns.find(p => p.name === name);

      if (!pattern) {
        logger.error(`Pattern "${name}" not found.`);
        process.exit(1);
      }

      const absoluteSource = resolveFromCwd(sourcePath || name);
      if (!fs.existsSync(absoluteSource)) {
        logger.error(`Source path "${absoluteSource}" does not exist.`);
        process.exit(1);
      }

      logger.info(`Updating pattern "${name}" content from ${absoluteSource}...`);
      
      const patternDestDir = path.join(config.repository.localPath, pattern.path);
      
      // Clear existing template
      const templateDir = path.join(patternDestDir, "template");
      fs.rmSync(templateDir, { recursive: true, force: true });

      // Re-extract
      const files = templatizeRecursive(absoluteSource, {
        sourceName: name,
        targetDir: templateDir,
      });

      // Update manifest
      addOrUpdatePatternInManifest(config.repository.localPath, {
        ...pattern,
        files,
      });

      logger.success(`Pattern "${name}" updated successfully.`);
      
      const prompt = inquirer.createPromptModule();
      const { push } = await prompt([{ type: "confirm", name: "push", message: "Push change to remote repository?", default: true }]);
      if (push) {
        runGit(`git add .`, config.repository.localPath);
        runGit(`git commit -m "feat: update pattern ${name}"`, config.repository.localPath);
        runGit(`git push`, config.repository.localPath);
        logger.success("Changes pushed to remote.");
      }
    });


  patterns
    .command("list")
    .description("List all available patterns")
    .option("-f, --framework <framework>", "Filter by framework")
    .option("-s, --scope <scope>", "Filter by scope (frontend or backend)")
    .action(async (options: { framework?: string; scope?: string }) => {
      const config = await loadConfig();

      if (!config.repository) {
        logger.error(
          "No repository configured. Run: mage config set repo owner/name"
        );
        process.exit(1);
      }

      const manifest = await fetchManifest(config.repository);
      let filtered = manifest.patterns;

      if (options.scope) {
        filtered = filtered.filter(
          (p) => p.scope.toLowerCase() === options.scope!.toLowerCase()
        );
      }

      if (options.framework) {
        filtered = filtered.filter(
          (p) => p.framework.toLowerCase() === options.framework!.toLowerCase()
        );
      }

      if (filtered.length === 0) {
        logger.warn("No patterns found");
        return;
      }

      logger.header(`Available Patterns (${filtered.length})`);

      const byScope = new Map<string, Map<string, typeof filtered>>();
      for (const pattern of filtered) {
        if (!byScope.has(pattern.scope)) byScope.set(pattern.scope, new Map());
        const scopeMap = byScope.get(pattern.scope)!;
        if (!scopeMap.has(pattern.framework))
          scopeMap.set(pattern.framework, []);
        scopeMap.get(pattern.framework)!.push(pattern);
      }

      for (const [scope, frameworks] of byScope) {
        console.log();
        logger.info(scope.toUpperCase());
        for (const [framework, pats] of frameworks) {
          logger.dim(`  ${framework}`);
          for (const p of pats) {
            logger.keyValue(`    ${p.category}/${p.name}`, p.description);
          }
        }
      }
    });

  patterns
    .command("sync")
    .description("Force refresh the local patterns cache")
    .action(async () => {
      clearCache();
      logger.success("Cache cleared");

      const config = await loadConfig();
      if (config.repository) {
        await fetchManifest(config.repository);
        logger.success("Patterns re-synced from repository");
      }
    });

  // --- Branch Management ---

  const branch = patterns
    .command("branch")
    .description("Manage repository branches");

  branch
    .command("list")
    .description("List all branches in the repository")
    .action(async () => {
      const config = await loadConfig();
      if (!config.repository) {
        logger.error("Repository not configured.");
        process.exit(1);
      }

      let branches: string[] = [];

      // Priority 1: Local Git (most reliable for auth/private repos)
      if (config.repository.localPath && fileExists(config.repository.localPath)) {
        try {
          runGit("git fetch origin --prune", config.repository.localPath);
          const output = execSync("git branch -a", {
            cwd: config.repository.localPath,
            stdio: "pipe",
          }).toString();

          branches = output
            .split("\n")
            .map((b) => b.replace("*", "").trim())
            .filter((b) => b !== "")
            // Convert "remotes/origin/main" or "origin/main" to just "main"
            .map((b) => b.replace(/^remotes\/origin\//, ""))
            .map((b) => b.replace(/^origin\//, ""))
            // Unique branches
            .filter((v, i, a) => a.indexOf(v) === i);
        } catch (err) {
          logger.warn("Could not list branches via local git. Falling back to GitHub API.");
        }
      }

      // Priority 2: GitHub API (if local git failed or no local path)
      if (branches.length === 0) {
        try {
          branches = await listBranches(config.repository);
        } catch (err: any) {
          if (err.status === 404) {
            logger.error(
              "Repository branches not found (404). If the repo is private, please set a token: mage config set repo-token <token>"
            );
          } else {
            logger.error(`Failed to list branches: ${err.message}`);
          }
          process.exit(1);
        }
      }

      logger.header(`Branches in ${config.repository.owner}/${config.repository.name}`);
      for (const b of branches) {
        if (b === config.repository.branch) {
          logger.success(`* ${b} (active)`);
        } else {
          console.log(`  ${b}`);
        }
      }
    });

  branch
    .command("create <name>")
    .description("Create a new branch")
    .option("--copy-from <branch>", "Branch to copy from")
    .option("--empty", "Create a clean orphan branch with starter patterns")
    .action(async (name: string, options: { copyFrom?: string; empty?: boolean }) => {
      const config = await loadConfig();
      if (!config.repository) {
        logger.error("Repository not configured.");
        process.exit(1);
      }

      const baseBranch = options.copyFrom || config.repository.branch;

      if (options.empty) {
        if (!config.repository.localPath) {
          logger.error("Orphan branches require a synchronized local path. Run 'mage config set repo' again.");
          process.exit(1);
        }
        scaffoldOrphanRepo(config.repository.localPath, name);
        logger.success(`Orphan branch "${name}" created and pushed.`);
      } else {
        // Priority 1: Local Git
        if (config.repository.localPath && fileExists(config.repository.localPath)) {
          try {
            logger.info(`Creating branch "${name}" locally...`);
            runGit(`git checkout -b ${name} ${baseBranch}`, config.repository.localPath);
            runGit(`git push -u origin ${name}`, config.repository.localPath);
            logger.success(`Branch "${name}" created and pushed to origin.`);
          } catch (err: any) {
            logger.error(`Failed to create branch with local git: ${err.message}`);
            process.exit(1);
          }
        } else {
          // Priority 2: GitHub API
          try {
            await createBranch(config.repository, name, baseBranch);
            logger.success(`Branch "${name}" created from "${baseBranch}" via API.`);
          } catch (err: any) {
            if (err.status === 404) {
              logger.error("Repo not found (404). For private repos, set a token: mage config set repo-token <token>");
            } else {
              logger.error(`Failed to create branch: ${err.message}`);
            }
            process.exit(1);
          }
        }
      }
    });

  branch
    .command("delete <name>")
    .description("Delete a branch from the remote")
    .action(async (name: string) => {
      const config = await loadConfig();
      if (!config.repository) {
        logger.error("Repository not configured.");
        process.exit(1);
      }

      if (name === config.repository.branch) {
        logger.error(`Cannot delete the currently active branch: ${name}`);
        process.exit(1);
      }

      const prompt = inquirer.createPromptModule();
      const { confirm } = await prompt([
        {
          type: "confirm",
          name: "confirm",
          message: `Are you sure you want to delete branch "${name}"?`,
          default: false,
        },
      ]);

      if (confirm) {
        // Priority 1: Local Git
        if (config.repository.localPath && fileExists(config.repository.localPath)) {
          try {
            logger.info(`Deleting branch "${name}" locally and from remote...`);
            runGit(`git push origin --delete ${name}`, config.repository.localPath);
            // Try to delete local branch (ignoring failure if it doesn't exist locally)
            try { runGit(`git branch -D ${name}`, config.repository.localPath); } catch (e) {}
            logger.success(`Branch "${name}" deleted.`);
          } catch (err: any) {
            logger.error(`Failed to delete branch with local git: ${err.message}`);
          }
        } else {
          // Priority 2: GitHub API
          try {
            await deleteBranch(config.repository, name);
            logger.success(`Branch "${name}" deleted from remote via API.`);
          } catch (err: any) {
            if (err.status === 404) {
              logger.error("Repo or branch not found (404).");
            } else {
              logger.error(`Failed to delete branch: ${err.message}`);
            }
          }
        }
      }
    });

  branch
    .command("switch <name>")
    .description("Switch to a different branch (updates local config and git)")
    .action(async (name: string) => {
      const config = await loadConfig();
      if (!config.repository) {
        logger.error("Repository not configured.");
        process.exit(1);
      }

      // Update global config
      const globalConfig = readGlobalConfig();
      if (globalConfig.repository) {
        globalConfig.repository.branch = name;
        writeGlobalConfig(globalConfig);
      }

      // Update local git if exists
      if (config.repository.localPath) {
        try {
          runGit(`git checkout ${name}`, config.repository.localPath);
          logger.success(`Local repository switched to ${name}`);
        } catch (err) {
          logger.warn(`Could not checkout branch "${name}" locally. You might need to 'git fetch' first.`);
        }
      }

      clearCache();
      logger.success(`Switched active branch to: ${name}`);
    });

  // --- Synchronization ---

  patterns
    .command("push")
    .description("Push local pattern changes to the remote repository")
    .action(async () => {
      const config = await loadConfig();
      if (!config.repository?.localPath) {
        logger.error("Local repository not configured for synchronization.");
        process.exit(1);
      }

      logger.info(`Pushing changes from ${config.repository.localPath}...`);
      try {
        runGit("git add .", config.repository.localPath);
        runGit('git commit -m "chore: update patterns" --allow-empty', config.repository.localPath);
        runGit("git push", config.repository.localPath);
        logger.success("Changes pushed to remote.");
      } catch (err) {
        logger.error("Failed to push changes. Check for conflicts or permissions.");
      }
    });

  patterns
    .command("pull")
    .description("Pull latest patterns from the remote repository")
    .action(async () => {
      const config = await loadConfig();
      if (!config.repository?.localPath) {
        logger.error("Local repository not configured for synchronization.");
        process.exit(1);
      }

      logger.info(`Pulling changes into ${config.repository.localPath}...`);
      try {
        runGit("git pull", config.repository.localPath);
        clearCache();
        logger.success("Local patterns updated.");
      } catch (err) {
        logger.error("Failed to pull changes. Check for local conflicts.");
      }
    });

  registerInitRepoCommand(patterns);
}
