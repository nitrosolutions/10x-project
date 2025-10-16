/* src/pages/api/receipts/scan.ts */
/* API endpoint for scanning receipts using Gemini AI */

import type { APIContext } from "astro";
import { ScanReceiptRequestSchema, ReceiptScanResponseSchema } from "@/lib/schemas/receipt-scan.schema";
import { GeminiService } from "@/lib/services/geminiService";

export const prerender = false;

// Maksymalny rozmiar obrazu w bajtach (10MB)
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

/**
 * POST /api/receipts/scan
 *
 * Analizuje obraz paragonu za pomocą Gemini AI
 *
 * @requires Authentication - Użytkownik musi być zalogowany
 * @body ScanReceiptRequest - Obraz w base64 i typ MIME
 * @returns 200 OK - Rozpoznane dane paragonu (ReceiptScanResponse)
 * @returns 400 Bad Request - Błędy walidacji danych wejściowych
 * @returns 401 Unauthorized - Brak autoryzacji
 * @returns 413 Payload Too Large - Obraz przekracza 10MB
 * @returns 500 Internal Server Error - Błąd serwera lub AI
 */
export async function POST(context: APIContext): Promise<Response> {
  try {
    // Krok 1: Sprawdzenie autoryzacji użytkownika
    const userId = context.locals.user?.id;

    if (!userId) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Krok 2: Parsowanie request body
    let requestBody;
    try {
      requestBody = await context.request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: "Validation error",
          details: ["Invalid JSON format in request body"],
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Krok 3: Walidacja danych wejściowych z użyciem Zod schema
    const validationResult = ScanReceiptRequestSchema.safeParse(requestBody);

    if (!validationResult.success) {
      const errorDetails = validationResult.error.errors.map((err) => {
        const path = err.path.join(".");
        return path ? `${path}: ${err.message}` : err.message;
      });

      return new Response(
        JSON.stringify({
          error: "Validation error",
          details: errorDetails,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { image, mimeType } = validationResult.data;

    // Krok 4: Sprawdzenie rozmiaru obrazu (base64 -> bajty)
    // Base64 zwiększa rozmiar o ~33%, więc obliczamy rzeczywisty rozmiar
    const base64Length = image.length;
    const estimatedSizeBytes = (base64Length * 3) / 4;

    if (estimatedSizeBytes > MAX_IMAGE_SIZE) {
      return new Response(
        JSON.stringify({
          error: "Payload Too Large",
          details: ["Plik jest za duży (max 10MB)"],
        }),
        {
          status: 413,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Krok 5: Pobranie kategorii z bazy danych
    const supabase = context.locals.supabase;
    const { data: categories, error: categoriesError } = await supabase
      .from("categories")
      .select("id, name")
      .order("order", { ascending: true });

    if (categoriesError || !categories) {
      // eslint-disable-next-line no-console
      console.error("[POST /api/receipts/scan] Error fetching categories:", categoriesError);

      return new Response(
        JSON.stringify({
          error: "Internal server error",
          details: ["Nie udało się pobrać kategorii"],
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Krok 6: Przygotowanie promptu dla Gemini
    const categoriesList = categories.map((cat) => `${cat.id}: ${cat.name}`).join(", ");

    const prompt = `Jesteś specjalistą od rozpoznawania polskich paragonów fiskalnych.

KRYTYCZNE: Odpowiedź MUSI być TYLKO czystym JSON. ZAKAZ dodawania tekstu przed, po lub wokół JSON.
Odpowiedź MUSI zaczynać się od { i kończyć na }. ZAKAZ używania markdown, nagłówków, wyjaśnień.

DOSTĘPNE KATEGORIE (id: nazwa):
${categoriesList}

ZASADY EKSTRAKCJI:
1. purchase_date: Data w formacie YYYY-MM-DD (np. "2025-01-15")
2. store_name: Nazwa sklepu lub null jeśli kompletnie nieczytelna
3. items: Tablica produktów, każdy z:
   - name: Nazwa produktu (string) - KRYTYCZNE: ZAWSZE wypełnij, nigdy nie zwracaj null. Nawet jeśli tekst jest trudno czytelny, wpisz swoje NAJLEPSZE przybliżenie/interpretację
   - price: Cena jako liczba (np. 12.99, nie "12.99 zł")
   - category_id: ID z listy kategorii powyżej (liczba całkowita)
4. total: Suma całkowita jako liczba

WAŻNE INSTRUKCJE:
- Zwróć WSZYSTKIE produkty ze paragonu - nie pomijaj żadnych
- Każdy produkt MUSI mieć wypełnioną nazwę (name)
- Jeśli nazwa jest niejasna, częściowo nieczytelna lub rozmyta - wpisz ZAWSZE swoje najlepsze przybliżenie
- Akceptowalne są interpretacje/szacowania - lepiej przybliżona nazwa niż brak
- Jeśli widzisz fragment tekstu - napisz co widzisz + [interpretacja] jeśli potrzebna

PRZYKŁAD POPRAWNEJ ODPOWIEDZI (z trudno czytelnym produktem):
{
  "purchase_date": "2025-01-15",
  "store_name": "Biedronka",
  "items": [
    {"name": "Mleko 2%", "price": 4.59, "category_id": 1},
    {"name": "Masło [tekst rozmyty - interpretacja]", "price": 8.99, "category_id": 1},
    {"name": "Chleb pszenny", "price": 3.99, "category_id": 1}
  ],
  "total": 17.57
}

PAMIĘTAJ: Zwróć TYLKO JSON bez żadnego innego tekstu!

Przeanalizuj ten paragon fiskalny i wyciągnij wszystkie dane zgodnie z powyższymi instrukcjami:`;

    // Krok 7: Wywołanie Gemini API z obrazem
    const geminiService = new GeminiService();

    let geminiResponse;
    try {
      // Przygotowanie zawartości multimodal (obraz + tekst)
      const contents = [
        {
          inlineData: {
            data: image,
            mimeType,
          },
        },
        {
          text: prompt,
        },
      ];

      geminiResponse = await geminiService.generateContent(contents, {
        temperature: 0.1, // Niska temperatura dla precyzji
        maxOutputTokens: 2048,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[POST /api/receipts/scan] Gemini API error:", error);

      return new Response(
        JSON.stringify({
          error: "AI Processing Error",
          details: [
            error instanceof Error
              ? error.message
              : "Nie udało się przetworzyć paragonu. Spróbuj ponownie lub dodaj ręcznie.",
          ],
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Krok 8: Parsowanie odpowiedzi z Gemini
    let parsedData;
    try {
      let responseText = geminiResponse.text;

      if (!responseText) {
        throw new Error("Gemini nie zwróciło treści tekstowej");
      }

      // eslint-disable-next-line no-console
      console.log("[POST /api/receipts/scan] Raw response length:", responseText.length);
      // eslint-disable-next-line no-console
      console.log("[POST /api/receipts/scan] Raw response preview:", responseText.substring(0, 200));

      // Wyciągnij JSON z odpowiedzi (model może dodawać markdown lub tekst)
      // Próba 1: Usuń markdown code blocks
      if (responseText.includes("```json")) {
        const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          responseText = jsonMatch[1].trim();
          // eslint-disable-next-line no-console
          console.log("[POST /api/receipts/scan] Extracted from markdown code block");
        }
      } else if (responseText.includes("```")) {
        const codeMatch = responseText.match(/```\s*([\s\S]*?)\s*```/);
        if (codeMatch) {
          responseText = codeMatch[1].trim();
          // eslint-disable-next-line no-console
          console.log("[POST /api/receipts/scan] Extracted from code block");
        }
      }

      // Próba 2: Wyciągnij JSON przez szukanie { i }
      const firstBrace = responseText.indexOf("{");
      const lastBrace = responseText.lastIndexOf("}");

      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        responseText = responseText.substring(firstBrace, lastBrace + 1);
        // eslint-disable-next-line no-console
        console.log("[POST /api/receipts/scan] Extracted JSON by braces");
      }

      // eslint-disable-next-line no-console
      console.log("[POST /api/receipts/scan] Cleaned response length:", responseText.length);
      // eslint-disable-next-line no-console
      console.log("[POST /api/receipts/scan] Cleaned response preview:", responseText.substring(0, 200));

      parsedData = JSON.parse(responseText);

      // eslint-disable-next-line no-console
      console.log("[POST /api/receipts/scan] Successfully parsed JSON");
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[POST /api/receipts/scan] JSON parsing error:", error);
      // eslint-disable-next-line no-console
      console.error("[POST /api/receipts/scan] Full response text:", geminiResponse.text);

      return new Response(
        JSON.stringify({
          error: "AI Response Error",
          details: ["AI nie zwróciło poprawnego JSON. Spróbuj ponownie lub dodaj ręcznie."],
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Krok 9: Walidacja odpowiedzi z Gemini
    const scanValidation = ReceiptScanResponseSchema.safeParse(parsedData);

    if (!scanValidation.success) {
      // eslint-disable-next-line no-console
      console.error("[POST /api/receipts/scan] Response validation error:", scanValidation.error);

      return new Response(
        JSON.stringify({
          error: "AI Response Error",
          details: ["Rozpoznane dane są niepełne. Spróbuj lepsze zdjęcie lub dodaj ręcznie."],
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Krok 10: Zwrócenie odpowiedzi 200 OK z rozpoznanymi danymi
    return new Response(JSON.stringify(scanValidation.data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Obsługa nieoczekiwanych błędów
    if (error instanceof Error) {
      // eslint-disable-next-line no-console
      console.error("[POST /api/receipts/scan]", {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
    }

    // Ogólny błąd serwera
    return new Response(
      JSON.stringify({
        error: "Internal server error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
