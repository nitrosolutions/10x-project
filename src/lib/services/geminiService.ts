import { GoogleGenAI } from "@google/genai";
import type { GenerateContentResponse, ContentUnion } from "@google/genai";

/**
 * GeminiService - Wrapper dla Google Gemini AI API
 * Wykorzystuje oficjalne SDK @google/genai
 */
export class GeminiService {
  #client: GoogleGenAI;
  #model: string;

  constructor(apiKey?: string, model = "gemini-2.5-flash-lite") {
    const key = apiKey ?? import.meta.env.GEMINI_API_KEY;

    if (!key) {
      throw new Error("GEMINI_API_KEY nie jest ustawiony w zmiennych środowiskowych.");
    }

    this.#client = new GoogleGenAI({ apiKey: key });
    this.#model = model;
  }

  /**
   * Generuje treść tekstową na podstawie promptu
   * @param contents - Zawartość zapytania (string lub ContentUnion dla multimodal)
   * @param options - Opcjonalne parametry (systemInstruction, temperature, maxOutputTokens)
   * @returns Odpowiedź z wygenerowanym tekstem
   */
  async generateContent(
    contents: ContentUnion,
    options?: {
      systemInstruction?: string;
      temperature?: number;
      maxOutputTokens?: number;
    }
  ): Promise<GenerateContentResponse> {
    if (typeof contents === "string" && (!contents || contents.trim().length === 0)) {
      throw new Error("Prompt nie może być pusty");
    }

    // Prepare config object
    const config: Record<string, unknown> = {};

    if (options) {
      if (options.temperature !== undefined) {
        config.temperature = options.temperature;
      }

      if (options.maxOutputTokens !== undefined) {
        config.maxOutputTokens = options.maxOutputTokens;
      }

      if (options.systemInstruction) {
        config.systemInstruction = options.systemInstruction;
      }
    }

    const response = await this.#client.models.generateContent({
      model: this.#model,
      contents,
      config: Object.keys(config).length > 0 ? config : undefined,
    });

    return response;
  }
}
