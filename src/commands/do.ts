import { execSync } from "child_process";
import { Command } from "commander";
import fs from "fs";
import http from "http";
import https from "https";
import inquirer from "inquirer";
import path from "path";
import { readGlobalConfig, readLocalConfig } from "../config/loader";
import * as logger from "../utils/logger";

function fetchUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    client.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP status ${res.statusCode}`));
        }
      });
    }).on("error", reject);
  });
}

async function fetchMenu(menuUrl: string): Promise<any> {
  let finalUrl = menuUrl;
  if (finalUrl.includes("github.com") && finalUrl.includes("/blob/")) {
    finalUrl = finalUrl.replace("github.com", "raw.githubusercontent.com").replace("/blob/", "/");
  }

  if (finalUrl.startsWith("http://") || finalUrl.startsWith("https://")) {
    const data = await fetchUrl(finalUrl);
    return JSON.parse(data);
  } else {
    let filePath = finalUrl;
    if (filePath.startsWith("file://")) {
      filePath = new URL(filePath).pathname;
    }
    const data = fs.readFileSync(path.resolve(filePath), "utf-8");
    return JSON.parse(data);
  }
}

async function navigateMenu(menuData: any): Promise<any> {
  const prompt = inquirer.createPromptModule();
  let currentOptions = menuData.items;

  while (true) {
    const choices: any[] = currentOptions.map((item: any, index: number) => ({
      name: item.name,
      value: index,
    }));
    choices.push(new inquirer.Separator());
    choices.push({ name: "Exit", value: -1 });

    const { selected } = await prompt<{ selected: number }>([
      {
        type: "list",
        name: "selected",
        message: "What do you want me to do?",
        choices,
        pageSize: 10,
      },
    ]);

    if (selected === -1) {
      process.exit(0);
    }

    const item = currentOptions[selected];
    if (item.type === "category") {
      currentOptions = item.items;
    } else if (item.type === "boilerplate") {
      return item;
    }
  }
}

function applyReplacements(destDir: string, projectName: string) {
  const magercPath = path.join(destDir, "magerc.json");
  if (fs.existsSync(magercPath)) {
    const magerc = JSON.parse(fs.readFileSync(magercPath, "utf-8"));
    if (magerc.replacements && Array.isArray(magerc.replacements)) {
      for (const rule of magerc.replacements) {
        const filePath = path.join(destDir, rule.path);
        if (fs.existsSync(filePath)) {
          let content = fs.readFileSync(filePath, "utf-8");
          // Replace all occurrences of rule.pattern with projectName literally
          content = content.split(rule.pattern).join(projectName);
          fs.writeFileSync(filePath, content, "utf-8");
          logger.info(`Updated project name in ${rule.path}`);
        }
      }
      return;
    }
  }

  // Fallback to default replacement if no magerc or no replacements array
  const packageJsonPath = path.join(destDir, "package.json");
  if (fs.existsSync(packageJsonPath)) {
    let content = fs.readFileSync(packageJsonPath, "utf-8");
    content = content.replace(/"name":\s*"[^"]+"/, `"name": "${projectName}"`);
    fs.writeFileSync(packageJsonPath, content, "utf-8");
    logger.info("Updated package.json name");
  }
}

function toSshUrl(url: string): string {
  if (url.includes("github.com") && url.startsWith("https://")) {
    return url.replace("https://github.com/", "git@github.com:").replace(/\/$/, "") + ".git";
  }
  return url;
}

export function registerDoCommand(program: Command): void {
  program
    .command("do")
    .description("Show the Mage CLI boilerplate menu or project commands")
    .action(async () => {
      try {
        const localConfig = await readLocalConfig();

        if (localConfig && localConfig.scripts && localConfig.scripts.length > 0) {
          logger.header("Project Scripts");
          const prompt = inquirer.createPromptModule();
          
          const choices: any[] = localConfig.scripts.map((script, index) => ({
            name: `${script.name} (${script.command})`,
            value: index,
          }));
          choices.push(new inquirer.Separator());
          choices.push({ name: "Exit", value: -1 });

          const { selected } = await prompt<{ selected: number }>([
            {
              type: "list",
              name: "selected",
              message: "What do you want me to do?",
              choices,
            },
          ]);

          if (selected === -1) {
            process.exit(0);
          }

          const script = localConfig.scripts[selected];
          const globalConfig = readGlobalConfig();
          if (globalConfig.showAnimation !== false) {
            await logger.showWizardAnimation();
          }
          logger.info(`Executing: ${script.command}`);
          try {
            execSync(script.command, { stdio: "inherit" });
            logger.success("Command executed successfully.");
          } catch (e) {
            logger.error("Command failed.");
          }
          return;
        }

        // Global Flow
        const globalConfig = readGlobalConfig();
        if (!globalConfig.menuUrl) {
          logger.error("Menu URL not configured. Run: mage config set menu-url <url>");
          process.exit(1);
        }

        logger.info(`Fetching menu from ${globalConfig.menuUrl}...`);
        const menuData = await fetchMenu(globalConfig.menuUrl);

        const boilerplate = await navigateMenu(menuData);
        if (!boilerplate) {
          process.exit(0);
        }

        const prompt = inquirer.createPromptModule();
        const { projectName } = await prompt<{ projectName: string }>([
          {
            type: "input",
            name: "projectName",
            message: "What is the name of your new project?",
            validate: (val) => val.trim().length > 0 || "Project name is required",
          },
        ]);

        const destDir = path.join(process.cwd(), projectName);
        if (fs.existsSync(destDir)) {
          logger.error(`Directory ${projectName} already exists.`);
          process.exit(1);
        }

        const repoUrl = toSshUrl(boilerplate.url);
        if (globalConfig.showAnimation !== false) {
          await logger.showWizardAnimation();
        }
        logger.info(`Cloning ${repoUrl} into ${projectName}...`);
        execSync(`git clone ${repoUrl} ${projectName}`, { stdio: "inherit" });

        logger.info("Initializing new git repository...");
        const gitDir = path.join(destDir, ".git");
        if (fs.existsSync(gitDir)) {
          fs.rmSync(gitDir, { recursive: true, force: true });
        }
        
        applyReplacements(destDir, projectName);

        execSync("git init", { cwd: destDir });
        
        logger.success(`Boilerplate ${boilerplate.name} generated at ./${projectName}`);
        logger.info(`Run 'cd ${projectName}' to get started.`);

      } catch (err: any) {
        logger.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
