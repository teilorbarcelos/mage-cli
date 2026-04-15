import { Command } from "commander";
import path from "path";
import os from "os";
import { execSync } from "child_process";
import * as inquirer from "inquirer";
import { writeFileSafe, fileExists } from "../utils/fs";
import * as logger from "../utils/logger";

const STARTER_MANIFEST = JSON.stringify(
  {
    version: "1.0.0",
    patterns: [
      {
        name: "component",
        description:
          "React functional component with CSS Modules and TypeScript",
        framework: "react",
        category: "component",
        path: "react/component",
        files: [
          "{{pascalCase name}}/index.tsx.hbs",
          "{{pascalCase name}}/styles.module.css.hbs",
        ],
      },
    ],
  },
  null,
  2
);

const STARTER_PATTERN_JSON = JSON.stringify(
  {
    name: "component",
    description:
      "React functional component with CSS Modules and TypeScript",
    framework: "react",
    category: "component",
    variables: [
      {
        name: "name",
        description: "Component name (e.g. UserCard)",
        required: true,
      },
    ],
  },
  null,
  2
);

const STARTER_COMPONENT_TEMPLATE = `import styles from './styles.module.css';

interface {{pascalCase name}}Props {
  children?: React.ReactNode;
}

export function {{pascalCase name}}({ children }: {{pascalCase name}}Props) {
  return (
    <div className={styles.container} id="{{lowercase name}}">
      {children}
    </div>
  );
}
`;

const STARTER_STYLES_TEMPLATE = `.container {
  display: flex;
  flex-direction: column;
}
`;

const STARTER_GITIGNORE = `node_modules
.DS_Store
`;

const STARTER_README = `# Mage Patterns

Pattern repository for [mage-cli](https://github.com/teilorbarcelos/mage-cli).

## Adding a Pattern

1. Create a directory: \`<framework>/<category>/\`
2. Add \`pattern.json\` with metadata and variables
3. Add a \`template/\` folder with \`.hbs\` files
4. Register the pattern in \`manifest.json\`

## Template Helpers

| Helper | Input | Output |
|--------|-------|--------|
| \`{{pascalCase name}}\` | \`user card\` | \`UserCard\` |
| \`{{camelCase name}}\` | \`user card\` | \`userCard\` |
| \`{{lowercase name}}\` | \`UserCard\` | \`usercard\` |
| \`{{uppercase name}}\` | \`user\` | \`USER\` |
| \`{{capitalize name}}\` | \`user\` | \`User\` |
`;

function extractRepoName(gitUrl: string): string {
  const match = gitUrl.match(/\/([^/]+?)(?:\.git)?$/);
  if (!match) {
    throw new Error(`Could not extract repository name from: ${gitUrl}`);
  }
  return match[1];
}

function run(command: string, cwd: string): void {
  execSync(command, { cwd, stdio: "pipe" });
}

export function registerInitRepoCommand(parent: Command): void {
  parent
    .command("init <git-url>")
    .description(
      "Create a local patterns repository connected to a remote git URL"
    )
    .action(async (gitUrl: string) => {
      const repoName = extractRepoName(gitUrl);
      const defaultPath = path.join(os.homedir(), repoName);

      const prompt = inquirer.createPromptModule();
      const { repoPath } = await prompt<{ repoPath: string }>([
        {
          type: "input",
          name: "repoPath",
          message: "Where should the patterns repository be created?",
          default: defaultPath,
        },
      ]);

      const resolvedPath = path.resolve(repoPath);

      if (fileExists(resolvedPath)) {
        logger.error(`Directory already exists: ${resolvedPath}`);
        process.exit(1);
      }

      logger.header("Creating patterns repository");

      writeFileSafe(
        path.join(resolvedPath, "manifest.json"),
        STARTER_MANIFEST
      );
      logger.success("manifest.json");

      writeFileSafe(
        path.join(resolvedPath, "react/component/pattern.json"),
        STARTER_PATTERN_JSON
      );
      logger.success("react/component/pattern.json");

      writeFileSafe(
        path.join(
          resolvedPath,
          "react/component/template/{{pascalCase name}}/index.tsx.hbs"
        ),
        STARTER_COMPONENT_TEMPLATE
      );
      writeFileSafe(
        path.join(
          resolvedPath,
          "react/component/template/{{pascalCase name}}/styles.module.css.hbs"
        ),
        STARTER_STYLES_TEMPLATE
      );
      logger.success("react/component/template/ (starter pattern)");

      writeFileSafe(path.join(resolvedPath, ".gitignore"), STARTER_GITIGNORE);
      writeFileSafe(path.join(resolvedPath, "README.md"), STARTER_README);
      logger.success(".gitignore + README.md");

      try {
        run("git init", resolvedPath);
        run(`git remote add origin ${gitUrl}`, resolvedPath);
        run("git add .", resolvedPath);
        run('git commit -m "Initial patterns repository"', resolvedPath);
        logger.success(`Git initialized with remote: ${gitUrl}`);
      } catch (err) {
        logger.error(
          "Git setup failed. Make sure git is installed and configured."
        );
        throw err;
      }

      console.log();
      logger.info(`Repository ready at ${resolvedPath}`);
      logger.dim("Next steps:");
      logger.dim("  1. cd " + resolvedPath);
      logger.dim("  2. Add more patterns to manifest.json");
      logger.dim("  3. git push -u origin main");
    });
}
