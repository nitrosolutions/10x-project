/* src/lib/services/statsService.ts */
/* Serwis biznesowy dla operacji na statystykach wydatków */

import type { SupabaseClient } from "@/db/supabase.client";
import type { StatsDto } from "@/types";

/**
 * Pobiera zagregowane statystyki wydatków dla użytkownika za określony miesiąc.
 *
 * Funkcja wykonuje zapytanie SQL, które:
 * - Łączy tabele receipts i receipt_items
 * - Filtruje rekordy na podstawie user_id i daty (purchase_date) pasującej do miesiąca
 * - Grupuje wyniki po category_id
 * - Oblicza sumę price dla każdej kategorii oraz sumę całkowitą
 *
 * @param supabase - Klient Supabase z kontekstu żądania
 * @param userId - ID uwierzytelnionego użytkownika
 * @param month - Miesiąc w formacie YYYY-MM
 * @returns Promise<StatsDto> - Zagregowane statystyki z totalsem per kategoria i grand_total
 * @throws Error jeśli zapytanie do bazy danych się nie powiedzie
 */
export async function getMonthlyStats(supabase: SupabaseClient, userId: string, month: string): Promise<StatsDto> {
  // Obliczamy zakres dat dla podanego miesiąca (aby wykorzystać indeks na purchase_date)
  const startDate = `${month}-01`; // Pierwszy dzień miesiąca: YYYY-MM-01

  // Obliczamy pierwszy dzień następnego miesiąca (używamy jako górnej granicy - exclusive)
  const [year, monthNum] = month.split("-").map(Number);
  const nextMonthDate = monthNum === 12 ? `${year + 1}-01-01` : `${year}-${String(monthNum + 1).padStart(2, "0")}-01`;

  try {
    // Wykonujemy zapytanie do Supabase, które agreguje wydatki per kategoria
    // RLS zapewnia, że użytkownik może pobrać tylko własne dane
    const { data, error } = await supabase
      .from("receipt_items")
      .select(
        `
        category_id,
        price,
        receipts!inner(
          user_id,
          purchase_date
        )
      `
      )
      .eq("receipts.user_id", userId)
      .gte("receipts.purchase_date", startDate)
      .lt("receipts.purchase_date", nextMonthDate);

    // Obsługa błędu zapytania
    if (error) {
      // eslint-disable-next-line no-console
      console.error("[getMonthlyStats] Error fetching stats:", error);
      throw new Error(`Failed to fetch monthly stats: ${error.message}`);
    }

    // Przetwarzamy surowe dane do formatu wymaganego przez StatsDto
    // Grupujemy po category_id i sumujemy price
    const categoryMap = new Map<number, number>();
    let grandTotal = 0;

    if (data && data.length > 0) {
      // Agregujemy dane - grupujemy po category_id i sumujemy price
      for (const item of data) {
        const categoryId = item.category_id;
        const price = item.price || 0;

        if (!categoryMap.has(categoryId)) {
          categoryMap.set(categoryId, 0);
        }

        const currentTotal = categoryMap.get(categoryId);
        const newTotal = (currentTotal || 0) + price;
        categoryMap.set(categoryId, newTotal);
        grandTotal += price;
      }
    }

    // Konwertujemy Map na tablicę totals, sortując po category_id
    const totals = Array.from(categoryMap.entries())
      .map(([category_id, amount]) => ({
        category_id,
        amount: Math.round(amount * 100) / 100, // Zaokrąglenie do 2 miejsc po przecinku
      }))
      .sort((a, b) => a.category_id - b.category_id); // Sortowanie po category_id

    // Zaokrąglenie grand_total do 2 miejsc po przecinku
    const roundedGrandTotal = Math.round(grandTotal * 100) / 100;

    // Zwracamy dane w formacie StatsDto
    return {
      month,
      totals,
      grand_total: roundedGrandTotal,
    };
  } catch (error) {
    // Logowanie szczegółów błędu
    // eslint-disable-next-line no-console
    console.error("[getMonthlyStats] Unexpected error:", {
      error,
      userId,
      month,
      timestamp: new Date().toISOString(),
    });

    // Re-throw error dla obsługi w API route
    throw error;
  }
}
