import { Command } from "commander";
import * as inquirer from "inquirer";
import { execSync } from "child_process";
import { loadConfig } from "../config/loader";
import { fetchManifest } from "../github/client";
import { askAIAgent } from "../ai/client";
import { writeFileSafe, resolveFromCwd } from "../utils/fs";
import { buildFilesFromPattern, resolveDestinationDir } from "../commands/generate";
import { writeGeneratedFiles } from "../generator/writer";
import { detectProjectStack } from "../utils/stack";
import { getProjectTree, getEssentialFiles, readFileContent } from "../utils/explorer";
import * as logger from "../utils/logger";
import path from "path";
import fs from "fs";

export function registerDoCommand(program: Command): void {
  program
    .command("do [prompt...]")
    .description("Ask Mage Agent to perform a task (natural language)")
    .action(async (promptParts: string[]) => {
      let userInput = promptParts.join(" ");
      const config = await loadConfig();

      if (!userInput) {
        const prompt = inquirer.createPromptModule();
        const { input } = await prompt<{ input: string }>([
          {
            type: "input",
            name: "input",
            message: "What do you want Mage to do?",
            validate: (val) => val.trim().length > 0 || "Please enter a task",
          },
        ]);
        userInput = input;
      }

      if (!config.ai) {
        logger.error("AI not configured. Run: mage config set ai-key <key>");
        process.exit(1);
      }

      // 1. Initial Project Context
      const projectContext = detectProjectStack();
      const treeDepth = config.treeDepth || 3;
      const projectTree = getProjectTree(treeDepth);
      let essentialFiles = getEssentialFiles();
      
      let patterns: any[] = [];
      if (config.repository) {
        try {
          const manifest = await fetchManifest(config.repository);
          patterns = manifest.patterns;
        } catch (err) {
          logger.warn("Could not fetch patterns, proceeding with code generation only.");
        }
      }

      let decision: any;
      let loopCount = 0;
      const MAX_LOOPS = 3;

      while (loopCount < MAX_LOOPS) {
        decision = await askAIAgent(config.ai, userInput, patterns, projectContext, projectTree, essentialFiles);
        logger.info(`Reasoning: ${decision.reasoning}`);

        if (decision.decision === "read_files") {
          if (!decision.requestedFiles || decision.requestedFiles.length === 0) {
            logger.error("AI requested to read files but provided no paths.");
            break;
          }

          logger.header("Reading files for context...");
          for (const filePath of decision.requestedFiles) {
            const content = readFileContent(filePath);
            if (content) {
              logger.info(`  📄 Read: ${filePath}`);
              // Avoid duplicates
              if (!essentialFiles.some(f => f.path === filePath)) {
                essentialFiles.push({ path: filePath, content });
              }
            } else {
              logger.warn(`  ✖ Could not read: ${filePath}`);
            }
          }
          loopCount++;
          continue;
        }
        
        // If not read_files, we are ready to execute or the AI is done exploring
        break;
      }

      // 3. Execute based on final decision
      const prompt = inquirer.createPromptModule();

      switch (decision.decision) {
        case "use_pattern":
          if (decision.patternIndex === undefined) {
            logger.error("AI selected use_pattern but no pattern index was provided.");
            process.exit(1);
          }
          const selectedPattern = patterns[decision.patternIndex - 1];
          if (!selectedPattern) {
            logger.error(`Invalid pattern index: ${decision.patternIndex}`);
            process.exit(1);
          }
          logger.header(`Applying pattern: ${selectedPattern.name}`);
          const patternFiles = await buildFilesFromPattern(config, selectedPattern, decision.variables || {});
          const destDir = resolveDestinationDir(config, selectedPattern.category);
          writeGeneratedFiles(patternFiles, destDir);
          break;

        case "create_new":
          if (!decision.files || decision.files.length === 0) {
            logger.error("AI returned create_new but no files provided.");
            process.exit(1);
          }
          logger.header("Generating new files...");
          for (const file of decision.files) {
            const fullPath = resolveFromCwd(file.relativePath);
            writeFileSafe(fullPath, file.content);
            logger.success(`Created: ${file.relativePath}`);
          }
          break;

        case "modify_files":
          if (!decision.files || decision.files.length === 0) {
            logger.error("AI returned modify_files but no files provided.");
            process.exit(1);
          }
          logger.header("Proposed Refactoring:");
          for (const file of decision.files) {
            logger.info(`  ✏️ Modify: ${file.relativePath}`);
          }

          const { confirmModify } = await prompt<{ confirmModify: boolean }>([
            {
              type: "confirm",
              name: "confirmModify",
              message: "Do you want to apply these changes to your existing files?",
              default: false,
            },
          ]);

          if (confirmModify) {
            for (const file of decision.files) {
              const fullPath = resolveFromCwd(file.relativePath);
              writeFileSafe(fullPath, file.content);
              logger.success(`Updated: ${file.relativePath}`);
            }
          } else {
            logger.warn("Refactoring cancelled by user.");
          }
          break;

        case "delete_files":
          if (!decision.requestedFiles || decision.requestedFiles.length === 0) {
            logger.error("AI returned delete_files but no files provided.");
            process.exit(1);
          }
          logger.header("Proposed Deletions:");
          for (const filePath of decision.requestedFiles) {
            logger.info(`  🗑️ Delete: ${filePath}`);
          }

          const { confirmDelete } = await prompt<{ confirmDelete: boolean }>([
            {
              type: "confirm",
              name: "confirmDelete",
              message: "Are you sure you want to delete these files? This cannot be undone.",
              default: false,
            },
          ]);

          if (confirmDelete) {
            for (const filePath of decision.requestedFiles) {
              try {
                const fullPath = resolveFromCwd(filePath);
                if (fs.existsSync(fullPath)) {
                  fs.unlinkSync(fullPath);
                  logger.success(`Deleted: ${filePath}`);
                }
              } catch (err) {
                logger.error(`Failed to delete ${filePath}`);
              }
            }
          } else {
            logger.warn("Deletions cancelled by user.");
          }
          break;

        case "run_commands":
          if (!decision.commands || decision.commands.length === 0) {
            logger.error("AI returned run_commands but no commands provided.");
            process.exit(1);
          }

          logger.header("Proposed Commands:");
          decision.commands.forEach((cmd: string) => logger.info(`  $ ${cmd}`));

          const { confirmCmd } = await prompt<{ confirmCmd: boolean }>([
            {
              type: "confirm",
              name: "confirmCmd",
              message: "Do you want to execute these commands?",
              default: false,
            },
          ]);

          if (confirmCmd) {
            for (const cmd of decision.commands) {
              try {
                logger.info(`Executing: ${cmd}...`);
                execSync(cmd, { stdio: "inherit" });
              } catch (err) {
                logger.error(`Command failed: ${cmd}`);
                process.exit(1);
              }
            }
            logger.success("All commands executed successfully.");
          } else {
            logger.warn("Commands cancelled by user.");
          }
          break;

        case "read_files":
          logger.warn("AI reached exploration limit without a final decision. Try being more specific.");
          break;

        default:
          logger.error(`Unknown agent decision: ${decision.decision}`);
      }
    });
}
