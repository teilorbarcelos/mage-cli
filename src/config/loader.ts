import fs from "fs";
import path from "path";
import { cosmiconfig } from "cosmiconfig";
import { MageConfig } from "./schema";

const MODULE_NAME = "mage";
const GLOBAL_CONFIG_DIR = path.join(
  process.env.HOME || process.env.USERPROFILE || "~",
  ".mage"
);
const GLOBAL_CONFIG_PATH = path.join(GLOBAL_CONFIG_DIR, "config.json");

function ensureGlobalDir(): void {
  if (!fs.existsSync(GLOBAL_CONFIG_DIR)) {
    fs.mkdirSync(GLOBAL_CONFIG_DIR, { recursive: true });
  }
}

export function readGlobalConfig(): MageConfig {
  ensureGlobalDir();
  if (!fs.existsSync(GLOBAL_CONFIG_PATH)) {
    return {};
  }
  const raw = fs.readFileSync(GLOBAL_CONFIG_PATH, "utf-8");
  return JSON.parse(raw) as MageConfig;
}

export function writeGlobalConfig(config: MageConfig): void {
  ensureGlobalDir();
  fs.writeFileSync(GLOBAL_CONFIG_PATH, JSON.stringify(config, null, 2));
}

export async function readLocalConfig(): Promise<MageConfig> {
  const explorer = cosmiconfig(MODULE_NAME, {
    searchPlaces: [
      ".magerc.json",
      ".magerc.yaml",
      ".magerc.yml",
      ".magerc.js",
      ".magerc.cjs",
    ],
  });

  const result = await explorer.search();
  if (result && !result.isEmpty) {
    return result.config as MageConfig;
  }
  return {};
}

export function writeLocalConfig(config: MageConfig): void {
  const filePath = path.join(process.cwd(), ".magerc.json");
  fs.writeFileSync(filePath, JSON.stringify(config, null, 2));
}

export async function loadConfig(): Promise<MageConfig> {
  const globalConfig = readGlobalConfig();
  const localConfig = await readLocalConfig();

  return mergeConfigs(globalConfig, localConfig);
}

function mergeConfigs(global: MageConfig, local: MageConfig): MageConfig {
  return {
    repository: local.repository ?? global.repository,
    ai: local.ai ?? global.ai,
    paths: {
      ...(global.paths || {}),
      ...(local.paths || {}),
    } as MageConfig["paths"],
  };
}

export function getGlobalConfigPath(): string {
  return GLOBAL_CONFIG_PATH;
}

export function getGlobalDir(): string {
  return GLOBAL_CONFIG_DIR;
}
