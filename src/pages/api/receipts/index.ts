/* src/pages/api/receipts/index.ts */
/* API endpoint dla operacji na paragonach */

import type { APIContext } from "astro";
import { z } from "zod";
import { CreateReceiptSchema } from "@/lib/schemas/receipt.schema";
import { createReceipt, getReceiptsForMonth } from "@/lib/services/receiptService";
import type { ReceiptListDto } from "@/types";

export const prerender = false;

// Schema walidacji dla parametru query "month" (format YYYY-MM)
const monthQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, {
    message: "Month must be in YYYY-MM format",
  }),
});

/**
 * POST /api/receipts
 *
 * Tworzy nowy paragon w systemie (źródło: manual)
 *
 * @requires Authentication - Użytkownik musi być zalogowany
 * @body CreateReceiptCommand - Dane paragonu (purchase_date, store_name?, items?)
 * @returns 201 Created - Utworzony paragon z pozycjami (ReceiptDto)
 * @returns 400 Bad Request - Błędy walidacji danych wejściowych
 * @returns 401 Unauthorized - Brak autoryzacji
 * @returns 500 Internal Server Error - Błąd serwera
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
    const validationResult = CreateReceiptSchema.safeParse(requestBody);

    if (!validationResult.success) {
      // Ekstrakcja szczegółowych komunikatów błędów z Zod
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

    const validatedData = validationResult.data;

    // Krok 4: Wywołanie service layer do utworzenia paragonu
    const receipt = await createReceipt(context.locals.supabase, userId, validatedData);

    // Krok 5: Zwrócenie odpowiedzi 201 Created z utworzonym paragonem
    return new Response(JSON.stringify(receipt), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Obsługa specyficznych błędów z service layer
    if (error instanceof Error) {
      // Błędy związane z category_id
      if (error.message.includes("category IDs do not exist")) {
        return new Response(
          JSON.stringify({
            error: "Validation error",
            details: [error.message],
          }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

      // Logowanie szczegółów błędu (bez wrażliwych danych)
      // eslint-disable-next-line no-console
      console.error("[POST /api/receipts]", {
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

/**
 * GET /api/receipts?month=YYYY-MM
 *
 * Zwraca uproszczoną listę paragonów (bez pozycji) dla uwierzytelnionego użytkownika
 * za określony miesiąc, posortowaną malejąco według daty zakupu.
 *
 * @requires Authentication - Użytkownik musi być zalogowany
 * @param month - Query parameter: miesiąc w formacie YYYY-MM
 * @returns 200 OK - Tablica ReceiptListDto
 * @returns 400 Bad Request - Nieprawidłowy parametr month
 * @returns 401 Unauthorized - Brak autoryzacji
 * @returns 500 Internal Server Error - Błąd serwera
 */
export async function GET(context: APIContext): Promise<Response> {
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

    // Krok 2: Walidacja parametru query "month"
    const monthParam = context.url.searchParams.get("month");
    const validationResult = monthQuerySchema.safeParse({ month: monthParam });

    if (!validationResult.success) {
      // Ekstrakcja szczegółowych komunikatów błędów z Zod
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

    const { month } = validationResult.data;

    // Krok 3: Wywołanie service layer do pobrania paragonów
    const receipts: ReceiptListDto[] = await getReceiptsForMonth(context.locals.supabase, userId, month);

    // Krok 4: Zwrócenie odpowiedzi 200 OK z listą paragonów (happy path)
    return new Response(JSON.stringify(receipts), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Obsługa błędów po stronie serwera (np. problem z bazą danych)
    if (error instanceof Error) {
      // eslint-disable-next-line no-console
      console.error("[GET /api/receipts]", {
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
