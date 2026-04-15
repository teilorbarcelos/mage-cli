import { Command } from "commander";
import path from "path";
import os from "os";
import * as inquirer from "inquirer";
import { fileExists } from "../utils/fs";
import * as logger from "../utils/logger";
import { scaffoldRepo } from "../utils/scaffold";

function extractRepoName(gitUrl: string): string {
  const match = gitUrl.match(/\/([^/]+?)(?:\.git)?$/);
  if (!match) {
    throw new Error(`Could not extract repository name from: ${gitUrl}`);
  }
  return match[1];
}

export function registerInitRepoCommand(parent: Command): void {
  parent
    .command("init <git-url>")
    .description(
      "Create a local patterns repository connected to a remote git URL"
    )
    .action(async (gitUrl: string) => {
      const repoName = extractRepoName(gitUrl);
      const defaultPath = path.join(os.homedir(), "mage-cli-config", repoName);

      const prompt = inquirer.createPromptModule();
      const { repoPath } = await prompt<{ repoPath: string }>([
        {
          type: "input",
          name: "repoPath",
          message: "Where should the patterns repository be created?",
          default: defaultPath,
        },
      ]);

      const resolvedPath = path.resolve(repoPath);

      if (fileExists(resolvedPath)) {
        logger.error(`Directory already exists: ${resolvedPath}`);
        process.exit(1);
      }

      logger.header("Creating patterns repository");

      try {
        scaffoldRepo(resolvedPath, gitUrl);
        logger.success("Starter patterns scaffolded");
        logger.success(`Git initialized with remote: ${gitUrl}`);
      } catch (err) {
        logger.error(
          "Setup failed. Make sure git is installed and configured."
        );
        throw err;
      }

      console.log();
      logger.info(`Repository ready at ${resolvedPath}`);
      logger.dim("Next steps:");
      logger.dim("  1. cd " + resolvedPath);
      logger.dim("  2. Add more patterns to manifest.json");
      logger.dim("  3. git push -u origin main");
    });
}
