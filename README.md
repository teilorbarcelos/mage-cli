# ⚡ mage

**Automation and code generation driven by patterns and artificial intelligence.**

Mage is an advanced CLI for developers who want to scale project patterns. It allows you to maintain a centralized repository of patterns (components, hooks, services, etc.) and uses AI to intelligently apply them or generate new autonomous solutions directly in your terminal.

---

## 🚀 Discovery Guide (AI/Agent Protocol)

To test the CLI in sequence, follow these 5 fundamental phases:

### Phase 1: Environment Setup
First, connect the CLI to your patterns repository and configure the AI provider.

```bash
# 1. Configure the patterns repository (automatically detects clone or scaffold)
mage config set repo your-user/your-patterns-repo

# 2. List available models to ensure the exact name (Discovery)
mage config list-ai-models

# 3. Configure AI Provider and API Key
mage config set ai-provider gemini
mage config set ai-model gemini-1.5-flash
mage config set ai-key YOUR_KEY_HERE

# 4. Verify the active configuration
mage config show
```

### Phase 2: Patterns and Branches Management
Mage allows you to isolate patterns in different branches. Use this to organize projects.

```bash
# List existing branches in your remote repository
mage patterns branch list

# Create a new branch for a specific project (copying from main)
mage patterns branch create project-alpha --copy-from main

# Switch to the new branch in your local environment
mage patterns branch switch project-alpha
```

### Phase 3: Synchronization and Patterns
Ensure your local cache is up to date with the patterns defined in the active branch.

```bash
# List available patterns organized by scope (frontend/backend)
mage patterns list

# Force synchronization of manifest.json if you recently edited it on GitHub
mage patterns sync

# Pull or push changes from your local patterns repository
mage patterns pull
mage patterns push
```

### Phase 4: Autonomous Intelligence (The Agent Mode)
This is the most powerful feature. The `do` command decides between using a pattern, generating code, or running system commands.

```bash
# Intelligent Generation Test: AI chooses between a pattern or manual creation
mage do "create a UserProfile component with avatar and bio"

# Terminal Autonomy Test: AI proposes shell commands for you
mage do "initialize a vite project with typescript"
```

### Phase 5: Structured Workflow
Use for fast automation based on known patterns.

```bash
# Direct generation using a specific pattern name
mage generate component Navbar

# Generation with AI assistance to fill variables
mage generate --description "A contact form with Yup validation"
```

---

## 🛠 Command Manual

<!-- START_MAGE_MANUAL -->
### Configuration (`mage config`)
- `set <key> <value>`: Set global configurations (`repo`, `repo-branch`, `repo-token`, `ai-provider`, `ai-model`, `ai-key`).
- `list-ai-models`: List supported models for the current provider.
- `show`: Display the consolidated active configuration (Global + Local).
- `init`: Initialize a local `.magerc.json` file in the project directory.

### Patterns & Git (`mage patterns`)
- `list`: List patterns filtering by scope or framework.
- `add <path>`: Add a local file or folder as a new pattern (with automatic templatization).
- `update <name> [path]`: Update the content of an existing pattern.
- `remove <name>`: Remove a pattern from the repository and manifest.
- `branch list/create/switch/delete`: Full patterns branch management.
- `sync/push/pull`: Keep your patterns repository synchronized with GitHub.

### AI & Automation
- `do [prompt]`: The Intelligent Agent analyzes, decides, and executes.
- `generate [pattern] [name]`: Standard generator with optional AI assistance.
<!-- END_MAGE_MANUAL -->

## 🔒 Security
The `do` command, when suggesting terminal commands (`run_commands`), will **always** prompt for your explicit confirmation before executing any action in the shell.

---
**Tech Stack:** Commander, Inquirer, Handlebars, OpenAI & Google Gemini SDKs, TSUP.
