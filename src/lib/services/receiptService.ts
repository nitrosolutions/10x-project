/* src/lib/services/receiptService.ts */
/* Serwis biznesowy dla operacji na paragonach */

import type { SupabaseClient } from "@/db/supabase.client";
import type { ReceiptListDto } from "@/types";

/**
 * Pobiera uproszczoną listę paragonów dla użytkownika za określony miesiąc.
 *
 * @param supabase - Klient Supabase z kontekstu żądania
 * @param userId - ID uwierzytelnionego użytkownika
 * @param month - Miesiąc w formacie YYYY-MM
 * @returns Tablica paragonów posortowana malejąco według daty zakupu
 * @throws Error jeśli zapytanie do bazy danych się nie powiedzie
 */
export async function getReceiptsForMonth(
  supabase: SupabaseClient,
  userId: string,
  month: string
): Promise<ReceiptListDto[]> {
  // Obliczamy zakres dat dla podanego miesiąca (aby wykorzystać indeks na purchase_date)
  const startDate = `${month}-01`; // Pierwszy dzień miesiąca: YYYY-MM-01

  // Obliczamy pierwszy dzień następnego miesiąca (używamy jako górnej granicy - exclusive)
  const [year, monthNum] = month.split("-").map(Number);
  const nextMonthDate = monthNum === 12 ? `${year + 1}-01-01` : `${year}-${String(monthNum + 1).padStart(2, "0")}-01`;

  // Wykonujemy zapytanie do Supabase
  // RLS zapewnia, że użytkownik może pobrać tylko własne paragony
  const { data, error } = await supabase
    .from("receipts")
    .select("id, purchase_date, store_name, total_amount")
    .eq("user_id", userId)
    .gte("purchase_date", startDate)
    .lt("purchase_date", nextMonthDate)
    .order("purchase_date", { ascending: false });

  // Obsługa błędu zapytania
  if (error) {
    throw new Error(`Failed to fetch receipts: ${error.message}`);
  }

  // Zwracamy dane (mogą być puste, jeśli brak paragonów)
  return data as ReceiptListDto[];
}
