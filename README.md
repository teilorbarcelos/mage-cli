# ⚡ mage

**The Centralized Full-Stack Boilerplate Manager.**

## 🎯 The Problem

Every developer knows the pain of starting a new project:
- *"Which framework should I use this time?"*
- *"How do I configure TypeScript and Linter again?"*
- *"Where is that old project of mine so I can copy the database structure and Docker configurations?"*

Configuration Fatigue makes us waste precious hours just preparing the ground, dealing with outdated documentation, and copying and pasting files from previous projects. This generates inconsistency in architecture, delays the start of real development, and demotivates the team.

## 🚀 The Solution: Mage CLI

**Mage CLI** was born to eliminate this friction. It works as a **unified hub for all your boilerplates**, whether they are frontend (React, Vue, Angular) or backend (Node.js, Python, Java, PHP).

Instead of memorizing repository URLs or keeping outdated "base project" folders on your machine, Mage allows you to start any architecture based on solid patterns in seconds, always downloading the latest version directly from the source. Best of all: it already renames the project and prepares the git repository for you!

---

## 💻 How it Works

### 1. Global Configuration (Only once)
Connect Mage to your menu file (where your boilerplates are mapped):

```bash
mage config set menu-url https://raw.githubusercontent.com/user/repo/main/menu.json
```

You can also toggle the wizard animation:
```bash
mage config set show-animation false # to disable
mage config set show-animation true  # to enable (default)
```

To see your current configuration:
```bash
mage config show
```

### Help and Commands
Mage CLI is self-documented. You can always see the available commands and options by running:
```bash
mage --help
# Or for a specific command:
# mage config --help
```

### 2. Starting a New Project
Just run the main command in your terminal:

```bash
mage do
```

Mage will ask friendly and interactive questions:
1. **What do you want me to do?** (You navigate through a menu with arrow keys: *Frontend -> React*, etc.)
2. **What is the name of the new project?**

Once done, Mage clones the boilerplate in real-time, removes the original `.git` history, applies the new configured name to the files, and initializes the clean project for you to start programming immediately.

### 3. Project Commands (Project Scripts)
If you are inside a project that contains the `magerc.json` file, the `mage do` command enters local mode. It reads the project's standardized scripts and displays a quick execution menu, ideal for running workflows without having to remember the exact Makefile or npm commands:

```bash
⚡ mage Project Scripts
──────────────────────────────────────────────────
? What do you want me to do? (Use arrow keys)
❯ Start Development Server (make dev) 
  Run Tests (make test) 
  Generate CRUD (make generate) 
```

---

## ⚙️ How to configure your own Boilerplates

Mage is completely independent. For a boilerplate to take full advantage of the tool, just add a `magerc.json` file to the root of your repository:

Example of `magerc.json`:
```json
{
  "scripts": [
    {
      "name": "Start Development Server",
      "command": "make dev"
    },
    {
      "name": "Run Tests",
      "command": "make test"
    }
  ],
  "replacements": [
    {
      "path": "package.json",
      "pattern": "backend-node"
    }
  ]
}
```
- **`scripts`**: Maps the commands of that boilerplate (Make, npm, composer) to beautiful and navigable options in the menu.
- **`replacements`**: Teaches Mage to find a specific literal string (such as the original name of the boilerplate, `"backend-node"`) in a file and replace it with the name chosen by the user at the time of generation.

### menu.json Structure

To organize your boilerplates, you must create a `menu.json` file. It supports nested categories for easy navigation.

Example of `menu.json`:
```json
{
  "name": "My Boilerplates",
  "items": [
    {
      "name": "Frontend",
      "type": "category",
      "items": [
        {
          "name": "React + Vite",
          "type": "boilerplate",
          "url": "https://github.com/user/react-boilerplate"
        }
      ]
    },
    {
      "name": "Backend",
      "type": "category",
      "items": [
        {
          "name": "Node.js + Clean Architecture",
          "type": "boilerplate",
          "url": "https://github.com/user/node-boilerplate"
        }
      ]
    }
  ]
}
```

---

**Tech Stack:** TypeScript, Commander, Inquirer.
