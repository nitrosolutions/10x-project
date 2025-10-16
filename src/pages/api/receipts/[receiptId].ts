/* src/pages/api/receipts/[receiptId].ts */
/* API endpoint dla operacji na pojedynczym paragonie */

import type { APIContext } from "astro";
import { z } from "zod";
import { getReceiptById, updateReceipt, deleteReceipt } from "@/lib/services/receiptService";
import { CreateReceiptSchema } from "@/lib/schemas/receipt.schema";

export const prerender = false;

// Schema walidacji dla parametru ścieżki receiptId (musi być UUID)
const receiptIdSchema = z.string().uuid({
  message: "receiptId must be a valid UUID",
});

/**
 * GET /api/receipts/{receiptId}
 *
 * Zwraca szczegółowe informacje o pojedynczym paragonie wraz z jego pozycjami.
 * Użytkownik może pobrać tylko własne paragony.
 *
 * @requires Authentication - Użytkownik musi być zalogowany
 * @param receiptId - Parametr ścieżki: UUID paragonu
 * @returns 200 OK - Obiekt ReceiptDto ze szczegółami paragonu i pozycjami
 * @returns 400 Bad Request - Nieprawidłowy format UUID
 * @returns 401 Unauthorized - Brak autoryzacji
 * @returns 404 Not Found - Paragon nie istnieje lub nie należy do użytkownika
 * @returns 500 Internal Server Error - Błąd serwera
 */
export async function GET(context: APIContext): Promise<Response> {
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

    // Krok 2: Walidacja parametru ścieżki receiptId
    const receiptId = context.params.receiptId;
    const validationResult = receiptIdSchema.safeParse(receiptId);

    if (!validationResult.success) {
      // Ekstrakcja szczegółowych komunikatów błędów z Zod
      const errorDetails = validationResult.error.errors.map((err) => err.message);

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

    const validatedReceiptId = validationResult.data;

    // Krok 3: Wywołanie service layer do pobrania szczegółów paragonu
    const receipt = await getReceiptById(context.locals.supabase, validatedReceiptId, userId);

    // Krok 4: Obsługa braku wyniku (paragon nie istnieje lub nie należy do użytkownika)
    if (!receipt) {
      return new Response(
        JSON.stringify({
          error: "Not found",
        }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Krok 5: Zwrócenie odpowiedzi 200 OK z danymi paragonu (happy path)
    return new Response(JSON.stringify(receipt), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Obsługa błędów po stronie serwera (np. problem z bazą danych)
    if (error instanceof Error) {
      // eslint-disable-next-line no-console
      console.error("[GET /api/receipts/:receiptId]", {
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
 * PUT /api/receipts/{receiptId}
 *
 * Aktualizuje istniejący paragon wraz z jego pozycjami.
 * Użytkownik może aktualizować tylko własne paragony.
 *
 * @requires Authentication - Użytkownik musi być zalogowany
 * @param receiptId - Parametr ścieżki: UUID paragonu
 * @body CreateReceiptCommand - Dane paragonu do aktualizacji (purchase_date, store_name?, items?)
 * @returns 200 OK - Zaktualizowany paragon z pozycjami (ReceiptDto)
 * @returns 400 Bad Request - Nieprawidłowy format UUID lub błędy walidacji
 * @returns 401 Unauthorized - Brak autoryzacji
 * @returns 404 Not Found - Paragon nie istnieje lub nie należy do użytkownika
 * @returns 500 Internal Server Error - Błąd serwera
 */
export async function PUT(context: APIContext): Promise<Response> {
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

    // Krok 2: Walidacja parametru ścieżki receiptId
    const receiptId = context.params.receiptId;
    const idValidationResult = receiptIdSchema.safeParse(receiptId);

    if (!idValidationResult.success) {
      const errorDetails = idValidationResult.error.errors.map((err) => err.message);

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

    const validatedReceiptId = idValidationResult.data;

    // Krok 3: Parsowanie request body
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

    // Krok 4: Walidacja danych wejściowych z użyciem Zod schema
    const validationResult = CreateReceiptSchema.safeParse(requestBody);

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

    const validatedData = validationResult.data;

    // Krok 5: Wywołanie service layer do aktualizacji paragonu
    const updatedReceipt = await updateReceipt(context.locals.supabase, validatedReceiptId, userId, validatedData);

    // Krok 6: Obsługa braku wyniku (paragon nie istnieje lub nie należy do użytkownika)
    if (!updatedReceipt) {
      return new Response(
        JSON.stringify({
          error: "Not found",
        }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Krok 7: Zwrócenie odpowiedzi 200 OK z zaktualizowanym paragonem (happy path)
    return new Response(JSON.stringify(updatedReceipt), {
      status: 200,
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

      // Logowanie szczegółów błędu
      // eslint-disable-next-line no-console
      console.error("[PUT /api/receipts/:receiptId]", {
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
 * DELETE /api/receipts/{receiptId}
 *
 * Usuwa istniejący paragon wraz z jego pozycjami.
 * Użytkownik może usuwać tylko własne paragony.
 *
 * @requires Authentication - Użytkownik musi być zalogowany
 * @param receiptId - Parametr ścieżki: UUID paragonu
 * @returns 200 OK - Paragon został pomyślnie usunięty
 * @returns 400 Bad Request - Nieprawidłowy format UUID
 * @returns 401 Unauthorized - Brak autoryzacji
 * @returns 404 Not Found - Paragon nie istnieje lub nie należy do użytkownika
 * @returns 500 Internal Server Error - Błąd serwera
 */
export async function DELETE(context: APIContext): Promise<Response> {
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

    // Krok 2: Walidacja parametru ścieżki receiptId
    const receiptId = context.params.receiptId;
    const validationResult = receiptIdSchema.safeParse(receiptId);

    if (!validationResult.success) {
      // Ekstrakcja szczegółowych komunikatów błędów z Zod
      const errorDetails = validationResult.error.errors.map((err) => err.message);

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

    const validatedReceiptId = validationResult.data;

    // Krok 3: Wywołanie service layer do usunięcia paragonu
    const success = await deleteReceipt(context.locals.supabase, validatedReceiptId, userId);

    // Krok 4: Obsługa braku wyniku (paragon nie istnieje lub nie należy do użytkownika)
    if (!success) {
      return new Response(
        JSON.stringify({
          error: "Not found",
        }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Krok 5: Zwrócenie odpowiedzi 200 OK z komunikatem o powodzeniu (happy path)
    return new Response(
      JSON.stringify({
        message: "Receipt deleted successfully",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    // Obsługa błędów po stronie serwera (np. problem z bazą danych)
    if (error instanceof Error) {
      // eslint-disable-next-line no-console
      console.error("[DELETE /api/receipts/:receiptId]", {
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
