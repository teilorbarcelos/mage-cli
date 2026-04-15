import OpenAI from "openai";
import { MageAI, PatternManifestEntry, GeneratedFile } from "../config/schema";
import {
  buildPatternSelectionPrompt,
  buildCodeGenerationPrompt,
} from "./prompts";
import * as logger from "../utils/logger";

interface AIDecisionUsePattern {
  decision: "use_pattern";
  patternIndex: number;
  reasoning: string;
  variables: Record<string, string>;
}

interface AIDecisionCreateNew {
  decision: "create_new";
  patternIndex: null;
  reasoning: string;
  files: GeneratedFile[];
}

type AIDecision = AIDecisionUsePattern | AIDecisionCreateNew;

function createOpenAIClient(config: MageAI): OpenAI {
  return new OpenAI({ apiKey: config.apiKey });
}

export async function askAIForDecision(
  config: MageAI,
  resourceName: string,
  resourceDescription: string,
  patterns: PatternManifestEntry[]
): Promise<AIDecision> {
  const client = createOpenAIClient(config);
  const prompt = buildPatternSelectionPrompt(
    resourceName,
    resourceDescription,
    patterns
  );

  const spin = logger.spinner("AI is analyzing available patterns...");

  try {
    const response = await client.chat.completions.create({
      model: config.model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty AI response");

    const decision = JSON.parse(content) as AIDecision;
    spin.succeed(
      `AI decided: ${decision.decision === "use_pattern" ? "use existing pattern" : "create from scratch"}`
    );
    logger.dim(`Reasoning: ${decision.reasoning}`);

    return decision;
  } catch (err) {
    spin.fail("AI analysis failed");
    throw err;
  }
}

export async function askAIToGenerate(
  config: MageAI,
  resourceName: string,
  resourceDescription: string,
  framework: string
): Promise<GeneratedFile[]> {
  const client = createOpenAIClient(config);
  const prompt = buildCodeGenerationPrompt(
    resourceName,
    resourceDescription,
    framework
  );

  const spin = logger.spinner("AI is generating code...");

  try {
    const response = await client.chat.completions.create({
      model: config.model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty AI response");

    const result = JSON.parse(content) as { files: GeneratedFile[] };
    spin.succeed(`AI generated ${result.files.length} file(s)`);
    return result.files;
  } catch (err) {
    spin.fail("AI code generation failed");
    throw err;
  }
}
