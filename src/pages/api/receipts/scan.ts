/* src/pages/api/receipts/scan.ts */
/* API endpoint for scanning receipts using Gemini AI */

import type { APIContext } from "astro";
import { ReceiptScanResponseSchema } from "@/lib/schemas/receipt-scan.schema";
import { GeminiService } from "@/lib/services/geminiService";

export const prerender = false;

/**
 * POST /api/receipts/scan
 *
 * Analizuje obraz paragonu za pomocą Gemini AI
 *
 * @requires Authentication - Użytkownik musi być zalogowany
 * @body FormData - Plik obrazu (multipart/form-data)
 * @returns 200 OK - Rozpoznane dane paragonu (ReceiptScanResponse)
 * @returns 400 Bad Request - Błędy walidacji danych wejściowych
 * @returns 401 Unauthorized - Brak autoryzacji
 * @returns 500 Internal Server Error - Błąd serwera, uploadu lub AI
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

    // Krok 2: Parsowanie FormData z pliku
    let formData: FormData;
    try {
      formData = await context.request.formData();
    } catch (parseError) {
      // eslint-disable-next-line no-console
      console.error("[POST /api/receipts/scan] FormData parsing error:", parseError);
      return new Response(
        JSON.stringify({
          error: "Validation error",
          details: ["Invalid FormData format in request body"],
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Krok 3: Walidacja pliku
    const file = formData.get("file") as File | null;

    if (!file) {
      return new Response(
        JSON.stringify({
          error: "Validation error",
          details: ["Brak pliku w żądaniu"],
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Walidacja typu pliku
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      return new Response(
        JSON.stringify({
          error: "Validation error",
          details: ["Niewspierany format pliku (tylko JPEG, PNG)"],
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // eslint-disable-next-line no-console
    console.log("[POST /api/receipts/scan] File received:", {
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
    });

    // Krok 4: Pobranie kategorii z bazy danych
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

    // Krok 5: Upload pliku do Gemini Files API z retry logic
    const geminiService = new GeminiService();

    let uploadedFile: { uri: string; mimeType: string } | undefined;
    const MAX_RETRIES = 2;
    let lastError: Error | unknown;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        // eslint-disable-next-line no-console
        console.log(`[POST /api/receipts/scan] File upload attempt ${attempt + 1}/${MAX_RETRIES + 1}`);

        // Konwertuj File na Buffer dla Node.js
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload do Gemini Files API
        uploadedFile = await geminiService.uploadFile(buffer, file.type, file.name);

        // eslint-disable-next-line no-console
        console.log("[POST /api/receipts/scan] File uploaded successfully:", {
          uri: uploadedFile.uri,
          mimeType: uploadedFile.mimeType,
        });

        break; // Sukces - wyjdź z pętli retry
      } catch (error) {
        lastError = error;
        // eslint-disable-next-line no-console
        console.error(`[POST /api/receipts/scan] File upload attempt ${attempt + 1} failed:`, error);

        if (attempt < MAX_RETRIES) {
          // Exponential backoff: 1s, 2s
          const delayMs = 1000 * Math.pow(2, attempt);
          // eslint-disable-next-line no-console
          console.log(`[POST /api/receipts/scan] Retrying in ${delayMs}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    if (!uploadedFile) {
      // eslint-disable-next-line no-console
      console.error("[POST /api/receipts/scan] File upload failed after all retries:", lastError);

      return new Response(
        JSON.stringify({
          error: "File Upload Error",
          details: [
            lastError instanceof Error
              ? `Nie udało się przesłać pliku do serwera AI: ${lastError.message}`
              : "Nie udało się przesłać pliku do serwera AI. Spróbuj ponownie.",
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

    // Krok 6: Przygotowanie promptu dla Gemini
    const categoriesList = categories.map((cat) => `${cat.id}: ${cat.name}`).join(", ");

    const prompt = `Jesteś specjalistą od rozpoznawania polskich paragonów fiskalnych i faktur VAT.

KRYTYCZNE: Odpowiedź MUSI być TYLKO czystym JSON. ZAKAZ dodawania tekstu przed, po lub wokół JSON.
Odpowiedź MUSI zaczynać się od { i kończyć na }. ZAKAZ używania markdown, nagłówków, wyjaśnień.

DOSTĘPNE KATEGORIE (id: nazwa):
${categoriesList}

════════════════════════════════════════════════════════════════════════════════
⚠️  ALGORYTM PARSOWANIA - WYKONAJ KROK PO KROKU ⚠️
════════════════════════════════════════════════════════════════════════════════

KROK 1: IDENTYFIKACJA LINII
Przejrzyj paragon od góry do dołu i dla KAŻDEJ linii zdecyduj:

  ✅ CZY TO PRODUKT?
     - Linia zawiera nazwę + cenę dodatnią
     - NIE zaczyna się od słów: "OPUST", "RABAT", "UPUST", "PROMOCJA", "ZNIŻKA"
     - Cena jest po prawej stronie (dodatnia liczba)
     → DODAJ DO LISTY PRODUKTÓW

  ❌ CZY TO ZNIŻKA/RABAT?
     - Linia zawiera ujemną kwotę (ze znakiem minus: -5.00, -8.28, -21.98)
     - LUB zaczyna się od: "OPUST", "RABAT", "UPUST", "PROMOCJA", "ZNIŻKA"
     - LUB zawiera słowo "OPUST"/"RABAT" + nazwę produktu
     → TO NIE JEST PRODUKT! TO ZNIŻKA!
     → NIE DODAWAJ DO items!
     → Zapamiętaj jako zniżkę do produktu powyżej

KROK 2: DOPASOWANIE ZNIŻEK DO PRODUKTÓW
Dla każdej znalezionej zniżki:
  1. Sprawdź czy nazwa zniżki zawiera nazwę produktu (np. "OPUST L.Chipsy" → produkt "L.Chipsy")
  2. Jeśli TAK: znajdź ten produkt na liście i ODEJMIJ wartość zniżki
  3. Jeśli NIE ma nazwy: przypisz zniżkę do OSTATNIEGO produktu powyżej

KROK 3: WERYFIKACJA PRZED ZWRÓCENIEM JSON
Sprawdź listę items:
  ✅ Żaden item NIE ma w nazwie słów: "OPUST", "RABAT", "UPUST", "PROMOCJA"
  ✅ Żaden item NIE ma ujemnej ceny
  ✅ Żaden produkt nie występuje 2 razy z podobną nazwą
  ✅ Kolejność items == kolejność produktów na paragonie (ignorując linie zniżek)

════════════════════════════════════════════════════════════════════════════════

ZASADY EKSTRAKCJI:
1. purchase_date: Data w formacie YYYY-MM-DD (np. "2025-01-15")
2. store_name: Nazwa sklepu/firmy lub null jeśli kompletnie nieczytelna
3. items: Tablica TYLKO produktów (BEZ linii zniżek), każdy z:
   - name: Nazwa produktu/usługi (string)
     * KRYTYCZNE: ZAWSZE wypełnij, nigdy nie zwracaj null
     * Nawet jeśli tekst jest trudno czytelny, wpisz swoje NAJLEPSZE przybliżenie
     * ZAKAZ nazw zawierających: "OPUST", "RABAT", "UPUST", "PROMOCJA", "ZNIŻKA"

   - price: KOŃCOWA CENA po odjęciu zniżki (liczba dodatnia lub 0.01)
     * KRYTYCZNE: Ceny ZAWSZE z PEŁNĄ precyzją (grosze/centy)!
     * Format: 3.59 (nie 3!), 15.00 (nie 15!), 0.01 (nie 0!)
     * ZAKAZ zaokrąglania lub pomijania części dziesiętnej!
     * Na paragonach LIDL format to: "nazwa  |  ilość xCENA_JEDN  SUMA"
       Przykład: "Mleko 3,2% PET  F  1 x3,59  3,59C" → price: 3.59 (ostatnia liczba)
     * Dla PARAGONÓW: kwota za produkt (już zawiera ilość) - liczba po prawej stronie
     * Dla FAKTUR: SUMARYCZNA kwota pozycji (ilość × cena jednostkowa)
     * Jeśli produkt ma zniżkę: cena_początkowa - wartość_zniżki
     * Przykład: Produkt 21.99 + OPUST -21.98 = price: 0.01

   - category_id: ID z listy kategorii powyżej (liczba całkowita)

4. total: Suma całkowita jako liczba (kwota końcowa do zapłaty z paragonu)

════════════════════════════════════════════════════════════════════════════════
🚫 ABSOLUTNY ZAKAZ - PRZECZYTAJ 3 RAZY 🚫
════════════════════════════════════════════════════════════════════════════════

NIGDY, PRZENIGDY nie dodawaj do tablicy items:
  ❌ Linii z nazwą zawierającą "OPUST", "RABAT", "UPUST", "PROMOCJA", "ZNIŻKA"
  ❌ Linii z ujemną ceną
  ❌ Linii z samą ujemną kwotą (np. "-5.00")
  ❌ Duplikatów produktów (jeśli produkt pojawia się 2x z rabatem → to JEDEN item)

Jeśli widzisz:
  Chipsy 8.29
  OPUST Chipsy -8.28

To items zawiera TYLKO:
  [{"name": "Chipsy", "price": 0.01, "category_id": X}]

NIE:
  [{"name": "Chipsy", "price": 8.29, ...}, {"name": "OPUST Chipsy", "price": -8.28, ...}] ← ❌ ŹLE!

════════════════════════════════════════════════════════════════════════════════
📋 PRZYKŁADY LIDL (NAJWAŻNIEJSZE) 📋
════════════════════════════════════════════════════════════════════════════════

PRZYKŁAD A - LIDL Format "OPUST [nazwa produktu]":
Paragon LIDL zawiera:
  MMMAX Czekolada 1        1 x21.99  21.99
  OPUST MMMAX Czekolada 1             -21.98
  D.Actimel trusk.         1 x21.99  21.99
  OPUST D.Actimel trusk.              -5.00
  Kabanosy Exclus. 90g     2 x6.79   13.58
  OPUST Kabanosy Exclus.              -1.40

JSON OUTPUT (3 produkty, 0 linii OPUST):
{
  "purchase_date": "2025-01-15",
  "store_name": "LIDL",
  "items": [
    {"name": "MMMAX Czekolada 1", "price": 0.01, "category_id": 1},
    {"name": "D.Actimel trusk.", "price": 16.99, "category_id": 1},
    {"name": "Kabanosy Exclus. 90g", "price": 12.18, "category_id": 1}
  ],
  "total": 29.18
}

PRZYKŁAD B - LIDL Format z "OPUST" w nazwie:
Paragon LIDL zawiera:
  L.Chipsy papryka130g     1 x8.29   8.29
  OPUST L.Chipsy papryka130g         -8.28
  Chusteczki uni. 2-w.     5 x3.00   15.00

JSON OUTPUT (2 produkty, 0 linii OPUST):
{
  "purchase_date": "2025-01-15",
  "store_name": "LIDL",
  "items": [
    {"name": "L.Chipsy papryka130g", "price": 0.01, "category_id": 1},
    {"name": "Chusteczki uni. 2-w.", "price": 15.00, "category_id": 1}
  ],
  "total": 15.01
}

PRZYKŁAD C - Rabat bez słowa "OPUST" (tylko ujemna kwota):
Paragon zawiera:
  Herbata Lipton           10.00
  -2.00
  Chleb pszenny            5.00

JSON OUTPUT (ujemna kwota -2.00 to zniżka na Herbatę):
{
  "purchase_date": "2025-01-15",
  "store_name": "Sklep",
  "items": [
    {"name": "Herbata Lipton", "price": 8.00, "category_id": 1},
    {"name": "Chleb pszenny", "price": 5.00, "category_id": 1}
  ],
  "total": 13.00
}

PRZYKŁAD D - Faktura VAT (bez zniżek):
{
  "purchase_date": "2025-01-20",
  "store_name": "Firma ABC Sp. z o.o.",
  "items": [
    {"name": "Usługa konsultingowa", "price": 1500.00, "category_id": 5},
    {"name": "Materiały biurowe", "price": 250.00, "category_id": 3}
  ],
  "total": 1750.00
}

════════════════════════════════════════════════════════════════════════════════
✅ CHECKLIST PRZED ZWRÓCENIEM JSON ✅
════════════════════════════════════════════════════════════════════════════════

Przed wysłaniem odpowiedzi sprawdź:
  ☑ Czy ŻADEN item nie ma w nazwie słów: OPUST, RABAT, UPUST, PROMOCJA?
  ☑ Czy ŻADEN item nie ma ujemnej ceny?
  ☑ Czy items zawiera tylko produkty (nie linie zniżek)?
  ☑ Czy ceny produktów są PO odjęciu zniżek?
  ☑ Czy kolejność items odpowiada kolejności produktów na paragonie?
  ☑ Czy suma prices == total z paragonu?

════════════════════════════════════════════════════════════════════════════════

Przeanalizuj ten dokument KROK PO KROKU zgodnie z algorytmem powyżej i zwróć TYLKO JSON:`;

    // Krok 7: Wywołanie Gemini API z uploadowanym plikiem
    let geminiResponse;
    try {
      // Przygotowanie zawartości multimodal (fileUri + tekst)
      const contents = [
        {
          fileData: {
            fileUri: uploadedFile.uri,
            mimeType: uploadedFile.mimeType,
          },
        },
        {
          text: prompt,
        },
      ];

      // eslint-disable-next-line no-console
      console.log("[POST /api/receipts/scan] Calling Gemini API with file URI");

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

    // Krok 10: Logowanie pomyślnej odpowiedzi z AI (dla debugowania cenami)
    // eslint-disable-next-line no-console
    console.log("[POST /api/receipts/scan] AI Response (full JSON):", JSON.stringify(scanValidation.data, null, 2));

    // Krok 11: Zwrócenie odpowiedzi 200 OK z rozpoznanymi danymi
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
