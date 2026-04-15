import { Command } from "commander";
import * as inquirer from "inquirer";
import { loadConfig } from "../config/loader";
import {
  fetchManifest,
  fetchPatternMeta,
  fetchTemplateFile,
} from "../github/client";
import { askAIForDecision } from "../ai/client";
import { renderTemplate } from "../generator/template";
import { writeGeneratedFiles } from "../generator/writer";
import {
  MageConfig,
  PatternManifestEntry,
  GeneratedFile,
  PatternMeta,
} from "../config/schema";
import * as logger from "../utils/logger";

export function registerGenerateCommand(program: Command): void {
  program
    .command("generate [pattern] [name]")
    .alias("g")
    .description("Generate code from a pattern or with AI assistance")
    .option("-d, --description <desc>", "Describe what you want to generate")
    .option("-f, --framework <framework>", "Filter patterns by framework")
    .option("-s, --scope <scope>", "Filter by scope (frontend or backend)")
    .action(
      async (
        pattern: string | undefined,
        name: string | undefined,
        options: { description?: string; framework?: string; scope?: string }
      ) => {
        const config = await loadConfig();

        if (!config.repository) {
          logger.error(
            'No repository configured. Run: mage config set repo owner/name'
          );
          process.exit(1);
        }

        const manifest = await fetchManifest(config.repository);
        let availablePatterns = manifest.patterns;

        if (options.scope) {
          availablePatterns = availablePatterns.filter(
            (p) => p.scope.toLowerCase() === options.scope!.toLowerCase()
          );
        }

        if (options.framework) {
          availablePatterns = availablePatterns.filter(
            (p) =>
              p.framework.toLowerCase() === options.framework!.toLowerCase()
          );
        }

        if (config.ai?.apiKey && availablePatterns.length > 0) {
          await generateWithAI(
            config,
            availablePatterns,
            name || pattern || "",
            options.description || ""
          );
        } else {
          await generateFromPattern(
            config,
            availablePatterns,
            pattern,
            name
          );
        }
      }
    );
}

async function generateWithAI(
  config: MageConfig,
  patterns: PatternManifestEntry[],
  name: string,
  description: string
): Promise<void> {
  logger.header("AI-Assisted Generation");

  const decision = await askAIForDecision(
    config.ai!,
    name,
    description,
    patterns
  );

  if (decision.decision === "use_pattern") {
    const selectedPattern = patterns[decision.patternIndex - 1];
    if (!selectedPattern) {
      logger.error("AI selected an invalid pattern index");
      process.exit(1);
    }

    logger.info(
      `Using pattern: ${selectedPattern.framework}/${selectedPattern.category}/${selectedPattern.name}`
    );

    const files = await buildFilesFromPattern(
      config,
      selectedPattern,
      decision.variables
    );
    const destDir = resolveDestinationDir(config, selectedPattern.category);
    writeGeneratedFiles(files, destDir);
  } else {
    logger.info("AI is creating custom code...");
    const destDir = config.paths?.components || "src";
    writeGeneratedFiles(decision.files, destDir);
  }
}

async function generateFromPattern(
  config: MageConfig,
  patterns: PatternManifestEntry[],
  patternArg: string | undefined,
  nameArg: string | undefined
): Promise<void> {
  logger.header("Pattern-Based Generation");

  if (patterns.length === 0) {
    logger.error("No patterns available");
    process.exit(1);
  }

  let selectedPattern: PatternManifestEntry;

  if (patternArg) {
    const found = patterns.find(
      (p) =>
        p.name.toLowerCase() === patternArg.toLowerCase() ||
        `${p.category}/${p.name}`.toLowerCase() ===
          patternArg.toLowerCase()
    );

    if (!found) {
      logger.error(`Pattern "${patternArg}" not found`);
      logger.dim(
        "Run 'mage patterns list' to see available patterns"
      );
      process.exit(1);
    }
    selectedPattern = found;
  } else {
    const choices = patterns.map((p) => ({
      name: `[${p.scope}] ${p.framework}/${p.category}/${p.name} — ${p.description}`,
      value: p,
    }));

    const prompt = inquirer.createPromptModule();
    const answer = await prompt<{ pattern: PatternManifestEntry }>([
      {
        type: "list",
        name: "pattern",
        message: "Select a pattern:",
        choices,
      },
    ]);
    selectedPattern = answer.pattern;
  }

  const meta = await fetchPatternMeta(
    config.repository!,
    selectedPattern.path
  );

  const variables = await collectVariables(meta, nameArg);

  const files = await buildFilesFromPattern(config, selectedPattern, variables);
  const destDir = resolveDestinationDir(config, selectedPattern.category);
  writeGeneratedFiles(files, destDir);
}

async function collectVariables(
  meta: PatternMeta,
  nameArg: string | undefined
): Promise<Record<string, string>> {
  const variables: Record<string, string> = {};

  const questions = meta.variables
    .filter((v) => !(v.name === "name" && nameArg))
    .map((v) => ({
      type: "input" as const,
      name: v.name,
      message: v.description,
      default: v.default,
    }));

  if (nameArg) {
    variables.name = nameArg;
  }

  if (questions.length > 0) {
    const prompt = inquirer.createPromptModule();
    const answers = await prompt(questions);
    Object.assign(variables, answers);
  }

  return variables;
}

async function buildFilesFromPattern(
  config: MageConfig,
  pattern: PatternManifestEntry,
  variables: Record<string, string>
): Promise<GeneratedFile[]> {
  const files: GeneratedFile[] = [];

  for (const fileName of pattern.files) {
    const templatePath = `${pattern.path}/template/${fileName}`;
    const rawTemplate = await fetchTemplateFile(
      config.repository!,
      templatePath
    );
    const rendered = renderTemplate(rawTemplate, variables);

    const outputFileName = fileName.replace(/\.hbs$/, "");
    files.push({
      relativePath: renderTemplate(outputFileName, variables),
      content: rendered,
    });
  }

  return files;
}

function resolveDestinationDir(
  config: MageConfig,
  category: string
): string {
  if (config.paths && config.paths[category]) {
    return config.paths[category];
  }

  const defaultPaths: Record<string, string> = {
    component: "src/components",
    page: "src/pages",
    hook: "src/hooks",
    service: "src/services",
  };

  return defaultPaths[category] || "src";
}
