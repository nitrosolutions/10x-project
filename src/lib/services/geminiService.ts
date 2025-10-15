import { GoogleGenAI } from "@google/genai";
import type { GenerateContentRequest, GenerateContentResult, Content } from "@google/genai";

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
   * @param contents - Zawartość zapytania (string lub Content dla multimodal)
   * @param options - Opcjonalne parametry (systemInstruction, temperature, maxOutputTokens)
   * @returns Odpowiedź z wygenerowanym tekstem
   */
  async generateContent(
    contents: string | Content,
    options?: {
      systemInstruction?: string;
      temperature?: number;
      maxOutputTokens?: number;
    }
  ): Promise<GenerateContentResult> {
    if (typeof contents === "string" && (!contents || contents.trim().length === 0)) {
      throw new Error("Prompt nie może być pusty");
    }

    const request: GenerateContentRequest = {
      model: this.#model,
      contents,
    };

    // Dodaj opcjonalne parametry
    if (options) {
      const generationConfig: Record<string, unknown> = {};

      if (options.temperature !== undefined) {
        generationConfig.temperature = options.temperature;
      }

      if (options.maxOutputTokens !== undefined) {
        generationConfig.maxOutputTokens = options.maxOutputTokens;
      }

      if (Object.keys(generationConfig).length > 0) {
        request.generationConfig = generationConfig;
      }

      if (options.systemInstruction) {
        request.systemInstruction = options.systemInstruction;
      }
    }

    const response = await this.#client.models.generateContent(request);
    return response;
  }
}
