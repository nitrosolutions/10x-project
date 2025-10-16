/* src/pages/api/stats/index.ts */
/* API endpoint dla statystyk wydatków */

import type { APIContext } from "astro";
import { z } from "zod";
import { getMonthlyStats } from "@/lib/services/statsService";
import type { StatsDto } from "@/types";

export const prerender = false;

// Uproszczona walidacja query parametru month (format YYYY-MM)
const querySchema = z.object({
  month: z
    .string()
    .min(1, "Parametr 'month' jest wymagany")
    .regex(/^\d{4}-\d{2}$/, "Format miesiąca musi być YYYY-MM"),
});

/**
 * GET /api/stats?month=YYYY-MM
 *
 * Zwraca zagregowane statystyki wydatków dla uwierzytelnionego użytkownika
 * za określony miesiąc. Dane są pogrupowane po kategoriach.
 *
 * @requires Authentication - Użytkownik musi być zalogowany
 * @param month - Query parameter (wymagany): miesiąc w formacie YYYY-MM
 * @returns 200 OK - Zagregowane statystyki (StatsDto) z totalsem per kategoria i grand_total
 * @returns 400 Bad Request - Nieprawidłowy parametr month
 * @returns 401 Unauthorized - Brak autoryzacji
 * @returns 500 Internal Server Error - Błąd serwera lub bazy danych
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
    const validationResult = querySchema.safeParse({ month: monthParam });

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

    const { month } = validationResult.data;

    // Krok 3: Wywołanie service layer do pobrania statystyk
    const stats: StatsDto = await getMonthlyStats(context.locals.supabase, userId, month);

    // Krok 4: Zwrócenie odpowiedzi 200 OK ze statystykami
    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Obsługa błędów po stronie serwera
    if (error instanceof Error) {
      // eslint-disable-next-line no-console
      console.error("[GET /api/stats]", {
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
