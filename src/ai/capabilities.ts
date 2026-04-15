/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * This file is synchronized from README.md via scripts/sync-capabilities.ts
 */

export const MAGE_CLI_CAPABILITIES = `
### Configuration (\`mage config\`)
- \`set <key> <value>\`: Set global configurations (\`repo\`, \`repo-branch\`, \`repo-token\`, \`ai-provider\`, \`ai-model\`, \`ai-key\`).
- \`list-ai-models\`: List supported models for the current provider.
- \`show\`: Display the consolidated active configuration (Global + Local).
- \`init\`: Initialize a local \`.magerc.json\` file in the project directory.

### Patterns & Git (\`mage patterns\`)
- \`list\`: List patterns filtering by scope or framework.
- \`add <path>\`: Add a local file or folder as a new pattern (with automatic templatization).
- \`update <name> [path]\`: Update the content of an existing pattern.
- \`remove <name>\`: Remove a pattern from the repository and manifest.
- \`branch list/create/switch/delete\`: Full patterns branch management.
- \`sync/push/pull\`: Keep your patterns repository synchronized with GitHub.

### AI & Automation
- \`do [prompt]\`: The Intelligent Agent analyzes, decides, and executes.
- \`generate [pattern] [name]\`: Standard generator with optional AI assistance.
`;
