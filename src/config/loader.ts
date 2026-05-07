import fs from "fs";
import path from "path";
import { cosmiconfig } from "cosmiconfig";
import { MageConfig, MageProjectConfig } from "./schema";

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

export async function readLocalConfig(): Promise<MageProjectConfig> {
  const explorer = cosmiconfig(MODULE_NAME, {
    searchPlaces: [
      "magerc.json"
    ],
  });

  const result = await explorer.search();
  if (result && !result.isEmpty) {
    return result.config as MageProjectConfig;
  }
  return {};
}

export function getGlobalConfigPath(): string {
  return GLOBAL_CONFIG_PATH;
}

export function getGlobalDir(): string {
  return GLOBAL_CONFIG_DIR;
}
