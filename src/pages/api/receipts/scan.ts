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

    let uploadedFile: { uri: string; mimeType: string };
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

ZASADY EKSTRAKCJI:
1. purchase_date: Data w formacie YYYY-MM-DD (np. "2025-01-15")
2. store_name: Nazwa sklepu/firmy lub null jeśli kompletnie nieczytelna
3. items: Tablica produktów/pozycji, każdy z:
   - name: Nazwa produktu/usługi (string) - KRYTYCZNE: ZAWSZE wypełnij, nigdy nie zwracaj null. Nawet jeśli tekst jest trudno czytelny, wpisz swoje NAJLEPSZE przybliżenie/interpretację
   - price: CAŁKOWITA KWOTA ZA POZYCJĘ jako liczba (np. 12.99, nie "12.99 zł")
     * Dla PARAGONÓW: kwota za produkt (już zawiera ilość jeśli występuje)
     * Dla FAKTUR: SUMARYCZNA kwota pozycji (ilość × cena jednostkowa), NIE cena jednostkowa!
     * OBSŁUGA ZNIŻEK: Jeśli pod pozycją jest linia z UJEMNĄ KWOTĄ (ze znakiem minus), to jest ZNIŻKA/RABAT na poprzedni produkt
     * Ujemne kwoty mogą mieć opis ("Rabat", "UPUST", "Promocja") LUB być samą liczbą ujemną ("-5.00")
     * Jeśli linia zawiera słowo kluczowe rabatu AND zawiera nazwę produktu z linii wyżej, to na pewno rabat na ten produkt
     * ZAWSZE odejmij ujemną kwotę od ceny produktu powyżej (nie dodawaj jako osobny item)
     * KRYTYCZNE: NIGDY nie dodawaj zniżki/rabatu jako osobnego item w tablicy items!
     * KRYTYCZNE: Nie duplikuj produktów - jeśli widzisz tę samą nazwę z rabatem, to ONE item, nie dwa!
   - category_id: ID z listy kategorii powyżej (liczba całkowita)
4. total: Suma całkowita jako liczba (kwota końcowa do zapłaty)

WAŻNE INSTRUKCJE:
- Zwróć WSZYSTKIE produkty z paragonu/faktury - nie pomijaj żadnych
- KRYTYCZNE: Zachowaj ORYGINALNĄ KOLEJNOŚĆ produktów z paragonu - zwracaj items w dokładnie tej samej kolejności, w jakiej pojawiają się na dokumentu
- Każdy produkt MUSI mieć wypełnioną nazwę (name)
- Jeśli nazwa jest niejasna, częściowo nieczytelna lub rozmyta - wpisz ZAWSZE swoje najlepsze przybliżenie
- Akceptowalne są interpretacje/szacowania - lepiej przybliżona nazwa niż brak
- Jeśli widzisz fragment tekstu - napisz co widzisz + [interpretacja] jeśli potrzebna

OBSŁUGA FAKTUR VAT:
- Na fakturze często są kolumny: nazwa, ilość, cena jedn., wartość (lub kwota)
- DO POLA "price" wpisz WARTOŚĆ/KWOTĘ pozycji (ilość × cena jedn.), NIE cenę jednostkową
- Przykład: "Usługa serwisowa | 3 szt. | 100 zł/szt. | 300 zł" → price: 300 (nie 100!)

OBSŁUGA ZNIŻEK/RABATÓW - BARDZO WAŻNE:
- Zniżki/rabaty NIE są produktami i NIGDY nie powinny być dodawane jako osobne items
- KLUCZOWE: Szukaj UJEMNYCH KWOT (ze znakiem minus) - to zawsze zniżka/rabat, niezależnie czy zawiera słowo "rabat"
- Rozpoznawaj SŁOWA KLUCZOWE rabatów: "Rabat", "RABAT", "UPUST", "Promocja", "Discount", "-", nawet jeśli są samotne
- Zniżka może być oznaczona jako: "Rabat -3.00", "-3.00", "Promocja -10%", "UPUST -8.28", lub samo "-5.00" bez dodatkowego opisu
- KRYTYCZNE: Jeśli linia zawiera słowo rabatu i pojawia się tuż pod produktem, sprawdź czy zawiera tę SAMĄ NAZWĘ produktu - to jest rabat na ten produkt
- ZAWSZE gdy widzisz ujemną kwotę pod produktem, odejmij ją od ceny tego produktu
- Przykład 1: "Kawa 15.00" + "Rabat -3.00" → price: 12.00
- Przykład 2: "Kawa 15.00" + "-3.00" → price: 12.00 (nawet bez słowa "rabat"!)
- Przykład 3: "Chipsy 8.29" + "UPUST Chipsy -8.28" → price: 0.01 (to JEDEN produkt, nie dwa!)
- Zniżka ma być UWZGLĘDNIONA w cenie produktu, ale NIGDY nie powinna być osobnym itemem

PRZYKŁAD 1 - Paragon z rabatem (ze słowem "Rabat"):
Paragon zawiera:
  Kawa 15.00
  Rabat -3.00
  Mleko 8.00

POWINNO BYĆ W JSON:
{
  "purchase_date": "2025-01-15",
  "store_name": "Cafe Shop",
  "items": [
    {"name": "Kawa", "price": 12.00, "category_id": 1},
    {"name": "Mleko", "price": 8.00, "category_id": 1}
  ],
  "total": 20.00
}

PRZYKŁAD 1B - Paragon z rabatem (TYLKO ujemna kwota, bez słowa "rabat"):
Paragon zawiera:
  Herbata 10.00
  -2.00
  Chleb 5.00

POWINNO BYĆ W JSON (ujemna kwota -2.00 to zniżka na Herbatę!):
{
  "purchase_date": "2025-01-15",
  "store_name": "Cafe Shop",
  "items": [
    {"name": "Herbata", "price": 8.00, "category_id": 1},
    {"name": "Chleb", "price": 5.00, "category_id": 1}
  ],
  "total": 13.00
}

PRZYKŁAD 1C - Paragon z rabatem (UPUST ze SAMĄ NAZWĄ produktu - to JEDEN item!):
Paragon zawiera (w tej kolejności):
  1. L.Chipsy papryka 130g    8.29
  2. UPUST L.Chipsy papryka   -8.28
  3. Mleko 2L               5.00

POWINNO BYĆ W JSON:
- Linia z "UPUST Chipsy" to rabat na Chipsy, nie oddzielny produkt!
- Zachowuj ORYGINALNĄ KOLEJNOŚĆ: Chipsy są pierwsze na paragonie → Chipsy pierwsze w items
- Obliczenie ceny: 8.29 - 8.28 = 0.01
{
  "purchase_date": "2025-01-15",
  "store_name": "Supermarket",
  "items": [
    {"name": "L.Chipsy papryka 130g", "price": 0.01, "category_id": 1},
    {"name": "Mleko 2L", "price": 5.00, "category_id": 1}
  ],
  "total": 5.01
}

PRZYKŁAD 2 - Paragon ze zniżką:
{
  "purchase_date": "2025-01-15",
  "store_name": "Biedronka",
  "items": [
    {"name": "Mleko 2%", "price": 4.59, "category_id": 1},
    {"name": "Masło", "price": 6.99, "category_id": 1},
    {"name": "Chleb pszenny", "price": 3.99, "category_id": 1}
  ],
  "total": 15.57
}

PRZYKŁAD 3 - Faktura VAT:
{
  "purchase_date": "2025-01-20",
  "store_name": "Firma ABC Sp. z o.o.",
  "items": [
    {"name": "Usługa konsultingowa", "price": 1500.00, "category_id": 5},
    {"name": "Materiały biurowe", "price": 250.00, "category_id": 3}
  ],
  "total": 1750.00
}

PAMIĘTAJ:
- KOLEJNOŚĆ: Items w JSON MUSZĄ być w tej samej kolejności co na paragonie/fakturze (od góry do dołu)
- Dla faktur: price = sumaryczna kwota pozycji (ilość × cena jedn.)
- Dla zniżek: ZAWSZE odejmij od ceny produktu, NIGDY nie dodawaj jako osobny item
- DEDUPLICACJA: Jeśli widzisz tę samą nazwę produktu 2x (raz jako produkt, raz w linii rabatu), to JEDEN item z obliczoną ceną
  * Rozpoznaj wzorce: "Produkt 10.00" + "UPUST/Rabat Produkt -5.00" = {"name": "Produkt", "price": 5.00}
  * Pozycja rabatu w linie pomiędzy innymi produktami - pozycja rabatu zostaje "ukryta" a cena została obliczona dla produktu
- Zwróć TYLKO JSON bez żadnego innego tekstu!

Przeanalizuj ten dokument (paragon lub fakturę) i wyciągnij wszystkie dane zgodnie z powyższymi instrukcjami:`;

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
