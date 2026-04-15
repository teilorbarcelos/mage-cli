import fs from "fs";
import path from "path";
import { resolveFromCwd, fileExists } from "./fs";

export interface ProjectStack {
  framework?: string;
  styling?: string;
  typescript: boolean;
  dependencies: string[];
}

/**
 * Detects the project's tech stack by analyzing package.json and config files.
 */
export function detectProjectStack(): string {
  const pkgPath = resolveFromCwd("package.json");
  
  if (!fileExists(pkgPath)) {
    return "Unknown project (no package.json found). Default to modern TypeScript and clean CSS.";
  }

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    const deps = { 
      ...pkg.dependencies, 
      ...pkg.devDependencies 
    };
    
    const stackParts: string[] = [];

    // 1. Core Framework/Tooling
    if (deps["next"]) stackParts.push("Next.js");
    else if (deps["vite"]) stackParts.push("Vite");
    else if (deps["express"]) stackParts.push("Express");

    // 2. Styling
    if (deps["tailwindcss"] || fileExists(resolveFromCwd("tailwind.config.js")) || fileExists(resolveFromCwd("tailwind.config.ts"))) {
      stackParts.push("TailwindCSS (Priority styling method)");
    } else if (deps["styled-components"]) {
      stackParts.push("Styled Components");
    } else if (deps["@emotion/react"]) {
      stackParts.push("Emotion");
    } else {
      stackParts.push("CSS Modules (Fallback styling method)");
    }

    // 3. Language
    if (deps["typescript"] || fileExists(resolveFromCwd("tsconfig.json"))) {
      stackParts.push("TypeScript");
    } else {
      stackParts.push("JavaScript");
    }

    // 4. Important UI Libs
    if (deps["framer-motion"]) stackParts.push("Framer Motion (for animations)");
    if (deps["lucide-react"]) stackParts.push("Lucide React (for icons)");

    return `Project Stack detected: ${stackParts.join(", ")}.`;
  } catch (err) {
    return "Error detecting stack from package.json. Default to modern TypeScript.";
  }
}
