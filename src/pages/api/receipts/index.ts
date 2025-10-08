/* src/pages/api/receipts/index.ts */
/* API endpoint dla operacji na paragonach */

import type { APIContext } from "astro";
import { CreateReceiptSchema } from "@/lib/schemas/receipt.schema";
import { createReceipt } from "@/lib/services/receipt.service";

export const prerender = false;

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
    const userId = context.locals.userId;

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
