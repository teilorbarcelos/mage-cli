import { PatternManifestEntry } from "../config/schema";
import { MAGE_CLI_CAPABILITIES } from "./capabilities";

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

export function buildAgentPrompt(
  userInput: string,
  availablePatterns: PatternManifestEntry[],
  projectContext: string = "",
  projectTree: string = "",
  essentialFiles: { path: string; content: string }[] = []
): string {
  const patternList = availablePatterns
    .map(
      (p, i) =>
        `  ${i + 1}. [${p.scope}] "${p.name}" (${p.framework}/${p.category}): ${p.description}`
    )
    .join("\n");

  const filesContext = essentialFiles
    .map(f => `FILE: ${f.path}\n\`\`\`\n${f.content}\n\`\`\``)
    .join("\n\n");

  return `You are a senior web developer assistant integrated into the "mage" CLI tool.
The user wants you to perform the following task: "${userInput}"

### PROJECT STRUCTURE:
${projectTree || "No tree available."}

### ESSENTIAL FILES CONTEXT:
${filesContext || "No essential files read yet."}

### TECH STACK DETECTED:
${projectContext}

### MAGE CLI CAPABILITIES:
You can use the following commands and patterns to fulfill the request:
${MAGE_CLI_CAPABILITIES}

### YOUR DECISION OPTIONS:
1. "use_pattern": If one of the available patterns matches the user's intent perfectly.
2. "create_new": To generate COMPLETELY NEW files.
3. "modify_files": To REFACTOR or MODIFY existing files identified in the project structure.
4. "delete_files": To REMOVE obsolete or redundant files from the project.
5. "read_files": If you need to see the content of specific files in the tree before deciding.
6. "run_commands": For environment setup (npm, git, etc.) or CLI configuration.

### STRICT GUIDELINES:
1. **Context Awareness**: Use the detected tech stack. If TailwindCSS is detected, use utility classes. 
2. **Refactoring**: When using "modify_files", provide the ENTIRE content of the file. No placeholders or partial snippets.
3. **Exploration**: If you are unsure which file to modify, use "read_files" first.
4. **No Recursion**: NEVER suggest running "mage do" or "mage generate" via "run_commands". 

Available patterns:
${patternList || "  (No patterns available)"}

Respond in STRICT JSON format (no markdown, no explanation outside JSON):
{
  "decision": "use_pattern" | "create_new" | "run_commands" | "read_files" | "modify_files",
  "reasoning": "<brief explanation of why you chose this path>",
  "patternIndex": <number (1-based) if use_pattern, otherwise omit>,
  "variables": { "<name>": "<value>" } (if use_pattern),
  "files": [ { "relativePath": "<path>", "content": "<entire content>" } ] (for create_new and modify_files),
  "commands": [ "<command1>" ] (for run_commands),
  "requestedFiles": [ "<path1>", "<path2>" ] (for read_files)
}`;
}
