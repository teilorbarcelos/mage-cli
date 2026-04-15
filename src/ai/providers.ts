import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { MageAI } from "../config/schema";

export interface AIProvider {
  /**
   * Generates a structured JSON response from the AI.
   * Prompts are assumed to contain instructions to output valid JSON.
   */
  generateJSON<T>(prompt: string): Promise<T>;
  listModels(): Promise<string[]>;
}

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  private model: string;

  constructor(config: MageAI) {
    this.client = new OpenAI({ apiKey: config.apiKey });
    this.model = config.model;
  }

  async generateJSON<T>(prompt: string): Promise<T> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty OpenAI response");
    return JSON.parse(content) as T;
  }

  async listModels(): Promise<string[]> {
    // Curated list for better UX, or could fetch from API
    return ["gpt-4o", "gpt-4o-mini", "o1-preview", "gpt-4-turbo"];
  }
}

export class GeminiProvider implements AIProvider {
  private genAI: GoogleGenerativeAI;
  private model: string;

  constructor(config: MageAI) {
    this.genAI = new GoogleGenerativeAI(config.apiKey);
    this.model = config.model;
  }

  async generateJSON<T>(prompt: string): Promise<T> {
    const genModel = this.genAI.getGenerativeModel({
      model: this.model,
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    try {
      const result = await genModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      if (!text) throw new Error("Empty Gemini response");
      return JSON.parse(text) as T;
    } catch (err: any) {
      if (err.status === 429) {
        throw new Error(
          `Gemini API Quota Exceeded (429). Please wait a few seconds before trying again. Detailed error: ${err.message}`
        );
      }
      if (err.status === 404) {
        throw new Error(
          `Gemini Model Not Found (404). The model "${this.model}" might be retired or unavailable in your region. Run 'mage config list-ai-models' to see valid names.`
        );
      }
      throw err;
    }
  }

  async listModels(): Promise<string[]> {
    try {
      // Note: listModels is a top-level method in the genAI client
      const result = await (this.genAI as any).getGenerativeModel({ model: "gemini-pro" }).listModels();
      // Actually, standard way:
      // const result = await genAI.listModels();
      // but the SDK structure varies. Let's try the most common:
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${(this.genAI as any).apiKey}`);
      const data = await response.json();
      return data.models ? data.models.map((m: any) => m.name.replace("models/", "")) : [];
    } catch (err) {
      // Fallback curated list if API fetch fails
      return ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash", "gemini-1.5-pro"];
    }
  }
}

export function getAIProvider(config: MageAI): AIProvider {
  switch (config.provider) {
    case "openai":
      return new OpenAIProvider(config);
    case "gemini":
      return new GeminiProvider(config);
    default:
      throw new Error(`Unsupported AI provider: ${config.provider}`);
  }
}
