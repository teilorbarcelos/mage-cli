import fs from "fs";
import path from "path";
import { writeFileSafe } from "./fs";

export interface TemplatizeOptions {
  sourceName: string;
  targetDir: string;
  ignorePatterns?: string[];
}

/**
 * Recursively copies a file or directory and templatizes its content and filenames.
 * Replaces occurrences of the sourceName with Handlebars variables.
 */
export function templatizeRecursive(sourcePath: string, options: TemplatizeOptions): string[] {
  const { sourceName, targetDir, ignorePatterns = ["node_modules", ".git", "dist", "build"] } = options;
  const relativeFiles: string[] = [];

  function processPath(currentPath: string, currentRelativePath: string) {
    const stats = fs.statSync(currentPath);
    const basename = path.basename(currentPath);

    // Skip ignored patterns
    if (ignorePatterns.some(p => basename.includes(p))) return;

    // Templatize the relative path (filenames)
    let templatedRelativePath = templatizeString(currentRelativePath, sourceName) + (stats.isFile() ? ".hbs" : "");

    if (stats.isDirectory()) {
      const files = fs.readdirSync(currentPath);
      for (const file of files) {
        processPath(path.join(currentPath, file), path.join(currentRelativePath, file));
      }
    } else {
      let content = fs.readFileSync(currentPath, "utf-8");
      content = templatizeString(content, sourceName);
      
      const outputPath = path.join(targetDir, templatedRelativePath);
      writeFileSafe(outputPath, content);
      relativeFiles.push(templatedRelativePath);
    }
  }

  const baseRelativePath = path.basename(sourcePath);
  processPath(sourcePath, baseRelativePath);

  return relativeFiles;
}

/**
 * Replaces variations of a name (Pascal, Kebab, etc.) with Handlebars equivalents.
 */
export function templatizeString(input: string, name: string): string {
  let output = input;

  // Order matters: longer strings or specific cases first
  
  // PascalCase (e.g., UserCard)
  const pascal = toPascalCase(name);
  output = output.split(pascal).join("{{pascalCase name}}");

  // camelCase (e.g., userCard)
  const camel = toCamelCase(name);
  output = output.split(camel).join("{{camelCase name}}");

  // kebab-case (e.g., user-card)
  const kebab = toKebabCase(name);
  output = output.split(kebab).join("{{kebabCase name}}");

  // snake_case (e.g., user_card)
  const snake = toSnakeCase(name);
  output = output.split(snake).join("{{snakeCase name}}");

  // lowercase (e.g., usercard)
  const lower = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  // Be careful with lowercase replacement as it might replace common words
  // Only replace if it's a dedicated word or matches exactly
  if (name.length > 3) {
      output = output.split(lower).join("{{lowercase name}}");
  }

  return output;
}

function toPascalCase(str: string): string {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase())
    .replace(/[\s-_]+/g, "");
}

function toCamelCase(str: string): string {
  return toPascalCase(str).replace(/^\w/, (c) => c.toLowerCase());
}

function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

function toSnakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[\s-]+/g, "_")
    .toLowerCase();
}
