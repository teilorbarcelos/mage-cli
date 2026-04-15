import { MageAI, PatternManifestEntry, GeneratedFile, AIDecision } from "../config/schema";
import {
  buildPatternSelectionPrompt,
  buildCodeGenerationPrompt,
  buildAgentPrompt,
} from "./prompts";
import * as logger from "../utils/logger";
import { getAIProvider } from "./providers";

export async function askAIForDecision(
  config: MageAI,
  resourceName: string,
  resourceDescription: string,
  patterns: PatternManifestEntry[]
): Promise<AIDecision> {
  const provider = getAIProvider(config);
  const prompt = buildPatternSelectionPrompt(
    resourceName,
    resourceDescription,
    patterns
  );

  const spin = logger.spinner(`AI (${config.provider}) is analyzing patterns...`);

  try {
    const decision = await provider.generateJSON<AIDecision>(prompt);
    
    spin.succeed(
      `AI decided: ${decision.decision === "use_pattern" ? "use existing pattern" : "create from scratch"}`
    );
    logger.dim(`Reasoning: ${decision.reasoning}`);

    return decision;
  } catch (err) {
    spin.fail(`AI (${config.provider}) analysis failed`);
    throw err;
  }
}

export async function askAIToGenerate(
  config: MageAI,
  resourceName: string,
  resourceDescription: string,
  framework: string
): Promise<GeneratedFile[]> {
  const provider = getAIProvider(config);
  const prompt = buildCodeGenerationPrompt(
    resourceName,
    resourceDescription,
    framework
  );

  const spin = logger.spinner(`AI (${config.provider}) is generating code...`);

  try {
    const result = await provider.generateJSON<{ files: GeneratedFile[] }>(prompt);
    spin.succeed(`AI generated ${result.files.length} file(s)`);
    return result.files;
  } catch (err) {
    spin.fail(`AI (${config.provider}) code generation failed`);
    throw err;
  }
}

export async function askAIAgent(
  ai: MageAI,
  userInput: string,
  availablePatterns: PatternManifestEntry[],
  projectContext: string = "",
  projectTree: string = "",
  essentialFiles: { path: string; content: string }[] = []
): Promise<AIDecision> {
  const provider = getAIProvider(ai);
  const prompt = buildAgentPrompt(userInput, availablePatterns, projectContext, projectTree, essentialFiles);

  const spin = logger.spinner(`Mage Agent (${ai.provider}) is thinking...`);

  try {
    const decision = await provider.generateJSON<AIDecision>(prompt);
    
    if (!decision || !decision.decision) {
      spin.fail("Agent returned an invalid response structure.");
      throw new Error("AI Agent decision is missing from response.");
    }

    spin.succeed(`Agent decision: ${decision.decision.replace("_", " ")}`);
    return decision;
  } catch (err) {
    spin.fail("Agent failed to process request");
    throw err;
  }
}
