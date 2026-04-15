# ⚡ mage

**AI-assisted code generation driven by your own patterns.**

Mage is a CLI that combines user-defined code patterns with AI to accelerate web development. You maintain a GitHub repository of reusable templates — components, pages, hooks, services, anything — and Mage uses AI to intelligently select and apply them, or generate entirely new code when no pattern fits.

### Advantages

- **You own the patterns** — your templates live in a GitHub repo you control, not locked inside the CLI. Update once, every project benefits instantly.
- **AI decides, you save tokens** — instead of generating every file from scratch, AI picks from your existing patterns when one fits. Templates are rendered locally at zero token cost.
- **Works with or without AI** — no API key configured? Mage falls back to an interactive pattern picker. AI enhances the workflow, it doesn't gate it.
- **Framework agnostic** — React, Next.js, Node, or anything else. Patterns are organized by framework, and you define the structure.
- **Zero boilerplate, one command** — `mage generate component UserCard` handles everything: pattern selection, variable prompts, file creation.

## Install

```bash
npm install -g mage-cli
```

## Quick Start

```bash
# 1. Point Mage to your patterns repository
mage config set repo your-username/your-patterns-repo

# 2. (Optional) Add an AI key for intelligent pattern selection
mage config set ai-key sk-your-openai-key

# 3. Generate code
mage generate component UserCard
```

## Commands

### `mage config`

Manage global and project-level configuration.

```bash
# Set the patterns repository (owner/name format)
mage config set repo teilorbarcelos/mage-patterns

# Set the repository branch (defaults to "main")
mage config set repo-branch develop

# Set a GitHub token (required for private repos)
mage config set repo-token ghp_xxxxxxxxxxxx

# Set an OpenAI API key for AI-assisted generation
mage config set ai-key sk-xxxxxxxxxxxx

# Set the AI model (defaults to "gpt-4o")
mage config set ai-model gpt-4o-mini

# Show the active merged configuration
mage config show

# Create a local .magerc.json in the current project
mage config init
```

### `mage generate`

Generate code from patterns or with AI assistance. Aliased as `mage g`.

```bash
# AI decides the best approach (requires ai-key)
mage generate component LoginForm

# Filter by framework
mage generate component Header --framework react

# Add a description to help AI make better decisions
mage generate hook Auth --description "handles JWT authentication with refresh tokens"

# Without AI key — interactive pattern picker
mage generate
```

**How it works:**

| Scenario | What happens | Tokens used |
|----------|-------------|-------------|
| AI key set + pattern matches | AI picks pattern, Handlebars renders it | ~300 |
| AI key set + no pattern fits | AI generates code from scratch | ~1000+ |
| No AI key | You pick a pattern from an interactive list | 0 |

### `mage patterns`

Browse, manage, and initialize patterns repositories.

```bash
# List all available patterns
mage patterns list

# Manage branches
mage patterns branch list                     # List all branches
mage patterns branch create feature-patterns  # Create from active branch
mage patterns branch create new-project --empty # Create clean orphan branch
mage patterns branch switch feature-patterns  # Change active branch
mage patterns branch delete old-branch        # Remove branch from remote

# Synchronize local clone (requires localPath)
mage patterns pull   # Update local patterns from GitHub
mage patterns push   # Send local pattern changes to GitHub

# Force refresh the local generation cache
mage patterns sync
```

The `init` command (or setting a repository via `config set repo`):
1. Asks where to create the repository (defaults to `~/repo-name`)
2. Scaffolds the full patterns structure with a starter example
3. Initializes git with the remote already configured
4. You just need to `git push -u origin main` to publish

## Configuration

Mage uses a hierarchical configuration system. Settings are merged in order of priority:

```
CLI flags  →  Local .magerc.json  →  Global ~/.mage/config.json
(highest)                              (lowest)
```

### Global Config

Stored at `~/.mage/config.json`. Set via `mage config set <key> <value>`.

**Setting up your patterns repository:**
When you set your repository, Mage will guide you through the local setup:

```bash
mage config set repo teilorbarcelos/mage-patterns
```

Mage will:
1. Ask for a local path (defaults to `~/mage-cli-config/mage-patterns`)
2. Check if the remote repository is empty or has content.
3. Automatically **clone** (if content exists) or **scaffold** (if empty) the local repository.
4. Initialize and connect the local git to your remote.

### Local Config

Created with `mage config init`. Generates a `.magerc.json` in your project root:

```json
{
  "repository": {
    "owner": "your-username",
    "name": "your-patterns-repo",
    "branch": "main"
  },
  "ai": {
    "provider": "openai",
    "apiKey": "sk-...",
    "model": "gpt-4o"
  },
  "paths": {
    "components": "src/components",
    "pages": "src/pages",
    "hooks": "src/hooks",
    "services": "src/services",
    "lib": "src/lib"
  }
}
```

> **Tip:** Add `.magerc.json` to your `.gitignore` if it contains API keys.

## Patterns Repository

Mage reads patterns from any GitHub repository that follows this structure:

```
your-patterns-repo/
├── manifest.json
├── frontend/
│   ├── react/
│   │   ├── component/
│   │   │   ├── pattern.json
│   │   │   └── template/
│   │   │       ├── {{pascalCase name}}/
│   │   │       │   ├── index.tsx.hbs
│   │   │       │   └── styles.module.css.hbs
│   │   ├── hook/
│   │   └── service/
│   └── next/
│       ├── component/
│       └── page/
└── backend/
    └── nodejs/
        └── controller/
            ├── pattern.json
            └── template/
                └── {{camelCase name}}Controller.ts.hbs
```

### manifest.json

An index of every available pattern:

```json
{
  "version": "1.0.0",
  "patterns": [
    {
      "name": "component",
      "description": "React functional component with CSS Modules and TypeScript",
      "scope": "frontend",
      "framework": "react",
      "category": "component",
      "path": "frontend/react/component",
      "files": ["{{pascalCase name}}/index.tsx.hbs", "{{pascalCase name}}/styles.module.css.hbs"]
    }
  ]
}
```

### pattern.json

Metadata and variables for each pattern. This is what the AI reads to make decisions:

```json
{
  "name": "component",
  "description": "React functional component with CSS Modules and TypeScript",
  "scope": "frontend",
  "framework": "react",
  "category": "component",
  "variables": [
    {
      "name": "name",
      "description": "Component name (e.g. UserCard)",
      "required": true
    }
  ]
}
```

### Template Helpers

Templates use [Handlebars](https://handlebarsjs.com/) with built-in helpers:

| Helper | Input | Output |
|--------|-------|--------|
| `{{pascalCase name}}` | `user card` | `UserCard` |
| `{{camelCase name}}` | `user card` | `userCard` |
| `{{lowercase name}}` | `UserCard` | `usercard` |
| `{{uppercase name}}` | `user` | `USER` |
| `{{capitalize name}}` | `user` | `User` |

## Development

```bash
# Clone the repo
git clone https://github.com/teilorbarcelos/mage-cli.git
cd mage-cli

# Install dependencies
npm install

# Run in dev mode (TypeScript, no build step)
npm run dev -- --help
npm run dev -- config show
npm run dev -- generate component TestButton

# Type check
npm run typecheck

# Build
npm run build

# Install globally for local testing (no sudo required)
npm run link:local

# Now use it anywhere
mage --help
```

### Scripts Reference

| Script | Description |
|--------|-------------|
| `npm run dev` | Run CLI directly from TypeScript source |
| `npm run build` | Bundle with tsup |
| `npm run typecheck` | Validate types without emitting |
| `npm run test` | Run tests with Vitest |
| `npm run link:local` | Build + install globally via npm link |
| `npm run bump:patch` | Bump patch version (2.0.0 → 2.0.1) |
| `npm run bump:minor` | Bump minor version (2.0.0 → 2.1.0) |
| `npm run bump:major` | Bump major version (2.0.0 → 3.0.0) |
| `npm run release` | Bump patch + publish to npm |

## Tech Stack

- **[Commander](https://github.com/tj/commander.js)** — CLI framework
- **[Inquirer](https://github.com/SBoudrias/Inquirer.js)** — Interactive prompts
- **[Handlebars](https://handlebarsjs.com/)** — Template engine
- **[@octokit/rest](https://github.com/octokit/rest.js)** — GitHub API client
- **[OpenAI SDK](https://github.com/openai/openai-node)** — AI integration
- **[Cosmiconfig](https://github.com/cosmiconfig/cosmiconfig)** — Configuration loader
- **[Chalk](https://github.com/chalk/chalk)** + **[Ora](https://github.com/sindresorhus/ora)** — Terminal styling
- **[tsup](https://github.com/egoist/tsup)** — Bundler
- **[tsx](https://github.com/privatenumber/tsx)** — TypeScript execution
- **[Vitest](https://vitest.dev/)** — Test framework

## License

MIT © [Teilor Barcelos](https://github.com/teilorbarcelos)
