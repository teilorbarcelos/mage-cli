import { execSync } from "child_process";
import { writeFileSafe } from "./fs";
import * as logger from "./logger";
import path from "path";

export const STARTER_MANIFEST = JSON.stringify(
  {
    version: "1.0.0",
    patterns: [
      {
        name: "component",
        description:
          "React functional component with CSS Modules and TypeScript",
        scope: "frontend",
        framework: "react",
        category: "component",
        path: "frontend/react/component",
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

export const STARTER_PATTERN_JSON = JSON.stringify(
  {
    name: "component",
    description:
      "React functional component with CSS Modules and TypeScript",
    scope: "frontend",
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

export const STARTER_COMPONENT_TEMPLATE = `import styles from './styles.module.css';

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

export const STARTER_STYLES_TEMPLATE = `.container {
  display: flex;
  flex-direction: column;
}
`;

export const STARTER_GITIGNORE = `node_modules
.DS_Store
`;

export const STARTER_README = `# Mage Patterns

Pattern repository for [mage-cli](https://github.com/teilorbarcelos/mage-cli).

## Adding a Pattern

1. Create a directory: \`<framework>/<category>/\`
2. Add \`pattern.json\` with metadata and variables
3. Add a \`template/\` folder with \`.hbs\` files
4. Register the pattern in \`manifest.json\`
`;

export function runGit(command: string, cwd: string): void {
  execSync(command, { cwd, stdio: "pipe" });
}

export function isRemoteEmpty(gitUrl: string): boolean | "error" {
  try {
    const output = execSync(`git ls-remote --heads ${gitUrl}`, { stdio: "pipe" }).toString();
    return output.trim() === "";
  } catch (err) {
    // If it fails (e.g. exit 128), it's a connection/auth error
    return "error";
  }
}

export function scaffoldRepo(resolvedPath: string, gitUrl?: string): void {
  logger.info("Scaffolding starter patterns...");

  writeFileSafe(path.join(resolvedPath, "manifest.json"), STARTER_MANIFEST);
  writeFileSafe(
    path.join(resolvedPath, "frontend/react/component/pattern.json"),
    STARTER_PATTERN_JSON
  );
  writeFileSafe(
    path.join(
      resolvedPath,
      "frontend/react/component/template/{{pascalCase name}}/index.tsx.hbs"
    ),
    STARTER_COMPONENT_TEMPLATE
  );
  writeFileSafe(
    path.join(
      resolvedPath,
      "frontend/react/component/template/{{pascalCase name}}/styles.module.css.hbs"
    ),
    STARTER_STYLES_TEMPLATE
  );
  writeFileSafe(path.join(resolvedPath, ".gitignore"), STARTER_GITIGNORE);
  writeFileSafe(path.join(resolvedPath, "README.md"), STARTER_README);

  if (gitUrl) {
    logger.info("Initializing Git and pushing to remote...");
    runGit("git init", resolvedPath);
    runGit(`git remote add origin ${gitUrl}`, resolvedPath);
    runGit("git add .", resolvedPath);
    runGit('git commit -m "Initial patterns repository"', resolvedPath);
    runGit("git branch -M main", resolvedPath);
    runGit("git push -u origin main", resolvedPath);
  }
}
