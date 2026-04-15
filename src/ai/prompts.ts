import { PatternManifestEntry } from "../config/schema";

export function buildPatternSelectionPrompt(
  resourceName: string,
  resourceDescription: string,
  availablePatterns: PatternManifestEntry[]
): string {
  const patternList = availablePatterns
    .map(
      (p, i) =>
        `  ${i + 1}. [${p.scope}] "${p.name}" (${p.framework}/${p.category}): ${p.description}`
    )
    .join("\n");

  return `You are a senior web developer assistant integrated into the "mage" CLI tool.
The user wants to generate a resource called "${resourceName}".
${resourceDescription ? `User description: "${resourceDescription}"` : ""}

Available patterns from the repository:
${patternList}

Your task:
1. Analyze the user's request and the available patterns.
2. Decide: is there a pattern that fits well, or should you create something from scratch?

Respond in STRICT JSON format (no markdown, no explanation outside JSON):
{
  "decision": "use_pattern" | "create_new",
  "patternIndex": <number (1-based) if use_pattern, null if create_new>,
  "reasoning": "<brief explanation of your decision>",
  "variables": { "<variable_name>": "<value>" } (if use_pattern, fill the template variables),
  "files": [ { "relativePath": "<path>", "content": "<full file content>" } ] (if create_new, provide complete files)
}`;
}

export function buildCodeGenerationPrompt(
  resourceName: string,
  resourceDescription: string,
  framework: string
): string {
  return `You are a senior web developer. Generate production-ready code for a ${framework} resource.

Resource name: "${resourceName}"
${resourceDescription ? `Description: "${resourceDescription}"` : ""}

Requirements:
- Use TypeScript
- Follow modern best practices for ${framework}
- Include proper typing (no "any")
- Include CSS module styles if applicable
- Make the code clean, production-ready, and well-structured

Respond in STRICT JSON format (no markdown, no explanation outside JSON):
{
  "files": [
    {
      "relativePath": "<path relative to destination>",
      "content": "<complete file content>"
    }
  ]
}`;
}
