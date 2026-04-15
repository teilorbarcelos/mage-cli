import fs from "fs";
import path from "path";
import { resolveFromCwd, fileExists } from "./fs";

const IGNORE_LIST = ["node_modules", ".git", "dist", "build", ".next", "out", "coverage"];

/**
 * Generates a text-based tree of the project.
 */
export function getProjectTree(maxDepth: number = 3, currentPath: string = ".", currentDepth: number = 0): string {
  if (currentDepth >= maxDepth) return "";

  const absolutePath = resolveFromCwd(currentPath);
  if (!fs.existsSync(absolutePath)) return "";

  const entries = fs.readdirSync(absolutePath, { withFileTypes: true })
    .filter(entry => !IGNORE_LIST.includes(entry.name))
    .sort((a, b) => (a.isDirectory() === b.isDirectory() ? a.name.localeCompare(b.name) : a.isDirectory() ? -1 : 1));

  let tree = "";
  for (const entry of entries) {
    const indent = "  ".repeat(currentDepth);
    const prefix = entry.isDirectory() ? "📁 " : "📄 ";
    tree += `${indent}${prefix}${entry.name}\n`;

    if (entry.isDirectory()) {
      tree += getProjectTree(maxDepth, path.join(currentPath, entry.name), currentDepth + 1);
    }
  }

  return tree;
}

/**
 * Reads the content of "essential" files to provide immediate context to the AI.
 */
export function getEssentialFiles(): { path: string; content: string }[] {
  const essentials = [
    "package.json",
    "tsconfig.json",
    "src/App.tsx",
    "src/main.tsx",
    "src/index.tsx",
    "src/App.ts",
    "src/index.ts",
    "src/App.js",
    "src/index.js",
    ".magerc.json"
  ];

  return essentials
    .filter(file => fileExists(resolveFromCwd(file)))
    .map(file => ({
      path: file,
      content: fs.readFileSync(resolveFromCwd(file), "utf-8").substring(0, 5000) // Caps at 5k chars per file
    }));
}

/**
 * Helper to read a specific file content safely.
 */
export function readFileContent(relativePath: string): string | null {
  const absolutePath = resolveFromCwd(relativePath);
  if (fileExists(absolutePath)) {
    return fs.readFileSync(absolutePath, "utf-8");
  }
  return null;
}
