import { Command } from "commander";
import inquirer from "inquirer";
import {
  readGlobalConfig,
  writeGlobalConfig,
  getGlobalConfigPath,
} from "../config/loader";
import { MageConfig } from "../config/schema";
import * as logger from "../utils/logger";

export function registerConfigCommand(program: Command): void {
  const config = program
    .command("config")
    .description("Manage mage global configuration");

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
    .description("Show the active configuration")
    .action(async () => {
      const globalConfig = readGlobalConfig();
      logger.header("Active Configuration");

      if (globalConfig.menuUrl) {
        logger.keyValue("Menu URL", globalConfig.menuUrl);
      } else {
        logger.dim("Menu URL: (not configured)");
      }

      logger.keyValue("Show Animation", globalConfig.showAnimation === false ? "false" : "true");

      console.log();
      logger.dim(`Global config: ${getGlobalConfigPath()}`);
    });
}

async function handleConfigSet(
  config: MageConfig,
  key: string,
  value: string
): Promise<void> {
  switch (key) {
    case "menu-url": {
      let finalUrl = value;
      // Convert GitHub blob URL to raw URL automatically
      if (finalUrl.includes("github.com") && finalUrl.includes("/blob/")) {
        finalUrl = finalUrl.replace("github.com", "raw.githubusercontent.com").replace("/blob/", "/");
        logger.info(`Auto-converted GitHub URL to Raw URL: ${finalUrl}`);
      }
      config.menuUrl = finalUrl;
      logger.success(`Global config updated: menuUrl = ${finalUrl}`);
      break;
    }
    case "show-animation": {
      const isTrue = value.toLowerCase() === "true";
      config.showAnimation = isTrue;
      logger.success(`Global config updated: showAnimation = ${isTrue}`);
      break;
    }
    default:
      logger.error(
        `Unknown config key: "${key}". Valid keys: menu-url, show-animation`
      );
      process.exit(1);
  }
}
