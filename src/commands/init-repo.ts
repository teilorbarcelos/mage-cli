import { Command } from "commander";
import path from "path";
import { execSync } from "child_process";
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
    .option(
      "-d, --dir <directory>",
      "Directory name to create (defaults to repo name from URL)"
    )
    .action((gitUrl: string, options: { dir?: string }) => {
      const repoName = options.dir || extractRepoName(gitUrl);
      const repoPath = path.resolve(process.cwd(), repoName);

      if (fileExists(repoPath)) {
        logger.error(`Directory "${repoName}" already exists`);
        process.exit(1);
      }

      logger.header("Creating patterns repository");

      writeFileSafe(
        path.join(repoPath, "manifest.json"),
        STARTER_MANIFEST
      );
      logger.success("manifest.json");

      writeFileSafe(
        path.join(repoPath, "react/component/pattern.json"),
        STARTER_PATTERN_JSON
      );
      logger.success("react/component/pattern.json");

      writeFileSafe(
        path.join(
          repoPath,
          "react/component/template/{{pascalCase name}}/index.tsx.hbs"
        ),
        STARTER_COMPONENT_TEMPLATE
      );
      writeFileSafe(
        path.join(
          repoPath,
          "react/component/template/{{pascalCase name}}/styles.module.css.hbs"
        ),
        STARTER_STYLES_TEMPLATE
      );
      logger.success("react/component/template/ (starter pattern)");

      writeFileSafe(path.join(repoPath, ".gitignore"), STARTER_GITIGNORE);
      writeFileSafe(path.join(repoPath, "README.md"), STARTER_README);
      logger.success(".gitignore + README.md");

      try {
        run("git init", repoPath);
        run(`git remote add origin ${gitUrl}`, repoPath);
        run("git add .", repoPath);
        run('git commit -m "Initial patterns repository"', repoPath);
        logger.success(`Git initialized with remote: ${gitUrl}`);
      } catch (err) {
        logger.error(
          "Git setup failed. Make sure git is installed and configured."
        );
        throw err;
      }

      console.log();
      logger.info(`Repository ready at ./${repoName}`);
      logger.dim("Next steps:");
      logger.dim("  1. cd " + repoName);
      logger.dim("  2. Add more patterns to manifest.json");
      logger.dim("  3. git push -u origin main");
      logger.dim(
        `  4. mage config set repo <owner>/${repoName}`
      );
    });
}
