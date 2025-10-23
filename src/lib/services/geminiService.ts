import { GoogleGenAI } from "@google/genai";
import type { GenerateContentResponse, ContentUnion } from "@google/genai";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

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

  /**
   * Przesyła plik do Gemini Files API
   *
   * Gemini Files API pozwala na upload plików do 2GB i przechowuje je przez 48h.
   * Każdy projekt może przechowywać do 20GB plików łącznie.
   *
   * @param fileBuffer - Buffer z zawartością pliku (otrzymany z File.arrayBuffer())
   * @param mimeType - Typ MIME pliku (image/jpeg lub image/png)
   * @param fileName - Nazwa pliku (opcjonalna, używana jako displayName w Gemini)
   * @returns Promise z obiektem { uri: string, mimeType: string } do użycia w generateContent()
   * @throws Error jeśli upload się nie powiedzie lub plik jest nieprawidłowy
   *
   * @example
   * ```typescript
   * const file = await request.formData().get("file") as File;
   * const arrayBuffer = await file.arrayBuffer();
   * const buffer = Buffer.from(arrayBuffer);
   *
   * const uploadedFile = await geminiService.uploadFile(buffer, file.type, file.name);
   * // uploadedFile.uri można użyć w generateContent()
   * ```
   */
  async uploadFile(
    fileBuffer: Buffer,
    mimeType: string,
    fileName?: string
  ): Promise<{ uri: string; mimeType: string }> {
    // Walidacja parametrów
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error("File buffer nie może być pusty");
    }

    if (!["image/jpeg", "image/png"].includes(mimeType)) {
      throw new Error(`Niewspierany typ pliku: ${mimeType} (tylko image/jpeg, image/png)`);
    }

    // Gemini SDK wymaga ścieżki do pliku, więc zapisujemy Buffer tymczasowo
    const tempFileName = fileName || `receipt-${Date.now()}.jpg`;
    const tempFilePath = path.join(os.tmpdir(), tempFileName);

    try {
      // Krok 1: Zapisz Buffer do tymczasowego pliku
      await fs.promises.writeFile(tempFilePath, fileBuffer);

      // eslint-disable-next-line no-console
      console.log("[GeminiService] Temporary file created:", {
        path: tempFilePath,
        size: fileBuffer.length,
      });

      // Krok 2: Upload do Gemini Files API
      // API zwraca obiekt z polami: name, uri, mimeType, createTime, updateTime, state, sizeBytes (output-only), etc.
      const uploadResult = await this.#client.files.upload({
        file: tempFilePath,
        config: {
          mimeType,
          displayName: fileName || `receipt-${Date.now()}`,
        },
      });

      // Krok 3: Usuń tymczasowy plik
      await fs.promises.unlink(tempFilePath);

      // eslint-disable-next-line no-console
      console.log("[GeminiService] Temporary file deleted:", tempFilePath);

      // Walidacja odpowiedzi z API
      if (!uploadResult || !uploadResult.uri) {
        throw new Error("Gemini Files API nie zwróciło URI pliku");
      }

      // eslint-disable-next-line no-console
      console.log("[GeminiService] File uploaded successfully:", {
        uri: uploadResult.uri,
        name: uploadResult.name,
        displayName: fileName,
        mimeType: uploadResult.mimeType,
        sizeBytes: uploadResult.sizeBytes,
      });

      return {
        uri: uploadResult.uri,
        mimeType: uploadResult.mimeType || mimeType,
      };
    } catch (error) {
      // Cleanup: Usuń tymczasowy plik w razie błędu
      try {
        if (fs.existsSync(tempFilePath)) {
          await fs.promises.unlink(tempFilePath);
          // eslint-disable-next-line no-console
          console.log("[GeminiService] Temporary file deleted after error:", tempFilePath);
        }
      } catch (cleanupError) {
        // eslint-disable-next-line no-console
        console.warn("[GeminiService] Failed to delete temporary file:", cleanupError);
      }

      // Logowanie szczegółów błędu
      // eslint-disable-next-line no-console
      console.error("[GeminiService] File upload error:", {
        error: error instanceof Error ? error.message : String(error),
        fileName,
        mimeType,
        bufferSize: fileBuffer.length,
      });

      // Rzuć szczegółowy błąd
      if (error instanceof Error) {
        throw new Error(`Gemini Files upload failed: ${error.message}`);
      }
      throw new Error("Gemini Files upload failed: Unknown error");
    }
  }
}
