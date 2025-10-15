/* src/lib/services/receiptService.ts */
/* Serwis biznesowy dla operacji na paragonach */

import type { SupabaseClient } from "@/db/supabase.client";
import type { ReceiptListDto, ReceiptDto, CreateReceiptCommand, ReceiptItemDto } from "@/types";

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

/**
 * Pobiera szczegółowe informacje o pojedynczym paragonie wraz z jego pozycjami.
 *
 * @param supabase - Klient Supabase z kontekstu żądania
 * @param receiptId - ID paragonu (UUID)
 * @param userId - ID uwierzytelnionego użytkownika
 * @returns Obiekt ReceiptDto ze szczegółami paragonu i listą pozycji, lub null jeśli nie znaleziono
 * @throws Error jeśli zapytanie do bazy danych się nie powiedzie
 */
export async function getReceiptById(
  supabase: SupabaseClient,
  receiptId: string,
  userId: string
): Promise<ReceiptDto | null> {
  // Wykonujemy zapytanie do Supabase z zagnieżdżonym zapytaniem dla pozycji paragonu
  // RLS zapewnia, że użytkownik może pobrać tylko własne paragony
  const { data, error } = await supabase
    .from("receipts")
    .select(
      `
      id,
      purchase_date,
      store_name,
      total_amount,
      receipt_items (
        id,
        receipt_id,
        product_name,
        price,
        category_id
      )
    `
    )
    .eq("id", receiptId)
    .eq("user_id", userId)
    .single();

  // Obsługa błędu zapytania
  if (error) {
    // Jeśli błąd to PGRST116 (brak danych), zwracamy null zamiast rzucać wyjątek
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to fetch receipt: ${error.message}`);
  }

  // Jeśli nie znaleziono danych, zwracamy null
  if (!data) {
    return null;
  }

  // Mapujemy wynik na typ ReceiptDto
  // receipt_items z zapytania zagnieżdżonego jest już tablicą
  return {
    id: data.id,
    purchase_date: data.purchase_date,
    store_name: data.store_name,
    total_amount: data.total_amount,
    items: data.receipt_items || [],
  } as ReceiptDto;
}

/**
 * Tworzy nowy paragon w systemie wraz z opcjonalnymi pozycjami
 *
 * @param supabase - Klient Supabase z kontekstu użytkownika
 * @param userId - ID zalogowanego użytkownika (z sesji)
 * @param data - Dane paragonu (CreateReceiptCommand)
 * @returns Promise<ReceiptDto> - Utworzony paragon z pozycjami i obliczonym total_amount
 * @throws Error - W przypadku błędu bazy danych lub naruszenia integralności
 */
export async function createReceipt(
  supabase: SupabaseClient,
  userId: string,
  data: CreateReceiptCommand
): Promise<ReceiptDto> {
  // Przygotowanie danych do insercji - ustawienie source (domyślnie "manual")
  const receiptData = {
    user_id: userId,
    purchase_date: data.purchase_date,
    store_name: data.store_name || null,
    source: data.source || ("manual" as const),
    total_amount: 0, // Wartość domyślna, trigger bazodanowy zaktualizuje po dodaniu items
  };

  try {
    // Krok 1: Insert paragonu do tabeli receipts
    // Zwracamy pełne dane paragonu zamiast tylko ID
    const { data: insertedReceipt, error: receiptError } = await supabase
      .from("receipts")
      .insert(receiptData)
      .select("*")
      .single();

    if (receiptError) {
      // eslint-disable-next-line no-console
      console.error("[createReceipt] Error inserting receipt:", receiptError);
      throw new Error(`Failed to create receipt: ${receiptError.message}`);
    }

    if (!insertedReceipt) {
      throw new Error("Failed to retrieve created receipt ID");
    }

    const receiptId = insertedReceipt.id;

    // Krok 2: Insert pozycji paragonu (jeśli items nie jest pusta)
    if (data.items && data.items.length > 0) {
      // Przygotowanie tablicy pozycji do batch insert
      const itemsData = data.items.map((item) => ({
        receipt_id: receiptId,
        product_name: item.product_name,
        price: item.price,
        category_id: item.category_id,
      }));

      const { error: itemsError } = await supabase.from("receipt_items").insert(itemsData);

      if (itemsError) {
        // eslint-disable-next-line no-console
        console.error("[createReceipt] Error inserting receipt items:", itemsError);

        // Jeśli to foreign key constraint error dla category_id
        if (itemsError.code === "23503" && itemsError.message.includes("category_id")) {
          throw new Error("One or more category IDs do not exist");
        }

        throw new Error(`Failed to create receipt items: ${itemsError.message}`);
      }
    }

    // Krok 3: Pobranie pełnego paragonu z items i zaktualizowanym total_amount
    // Trigger bazodanowy już zaktualizował total_amount po insert items
    // Dodajemy maybeSingle() zamiast single() i cache-busting poprzez dodanie timestamp
    const { data: fullReceipt, error: fetchError } = await supabase
      .from("receipts")
      .select(
        `
        id,
        purchase_date,
        store_name,
        total_amount,
        receipt_items (
          id,
          product_name,
          price,
          category_id,
          receipt_id
        )
      `
      )
      .eq("id", receiptId)
      .maybeSingle();

    if (fetchError || !fullReceipt) {
      // eslint-disable-next-line no-console
      console.error("[createReceipt] Error fetching created receipt:", fetchError);
      throw new Error("Failed to retrieve created receipt");
    }

    // Krok 4: Transformacja do ReceiptDto (bez user_id i source)
    const receiptDto: ReceiptDto = {
      id: fullReceipt.id,
      purchase_date: fullReceipt.purchase_date,
      store_name: fullReceipt.store_name,
      total_amount: fullReceipt.total_amount,
      items: (fullReceipt.receipt_items || []) as ReceiptItemDto[],
    };

    return receiptDto;
  } catch (error) {
    // Logowanie szczegółów błędu
    // eslint-disable-next-line no-console
    console.error("[createReceipt] Unexpected error:", {
      error,
      userId,
      timestamp: new Date().toISOString(),
    });

    // Re-throw error dla obsługi w API route
    throw error;
  }
}

/**
 * Aktualizuje istniejący paragon wraz z jego pozycjami
 *
 * @param supabase - Klient Supabase z kontekstu użytkownika
 * @param receiptId - UUID paragonu do zaktualizowania
 * @param userId - ID zalogowanego użytkownika (dla autoryzacji)
 * @param data - Dane paragonu (CreateReceiptCommand)
 * @returns Promise<ReceiptDto | null> - Zaktualizowany paragon lub null jeśli nie znaleziono
 * @throws Error - W przypadku błędu bazy danych lub naruszenia integralności
 */
export async function updateReceipt(
  supabase: SupabaseClient,
  receiptId: string,
  userId: string,
  data: CreateReceiptCommand
): Promise<ReceiptDto | null> {
  try {
    // Krok 1: Weryfikacja, czy paragon istnieje i należy do użytkownika
    const { data: existingReceipt, error: checkError } = await supabase
      .from("receipts")
      .select("id")
      .eq("id", receiptId)
      .eq("user_id", userId)
      .single();

    if (checkError || !existingReceipt) {
      // Paragon nie istnieje lub nie należy do użytkownika
      return null;
    }

    // Krok 2: Aktualizacja podstawowych danych paragonu
    const receiptUpdateData = {
      purchase_date: data.purchase_date,
      store_name: data.store_name || null,
    };

    const { error: updateError } = await supabase
      .from("receipts")
      .update(receiptUpdateData)
      .eq("id", receiptId)
      .eq("user_id", userId);

    if (updateError) {
      // eslint-disable-next-line no-console
      console.error("[updateReceipt] Error updating receipt:", updateError);
      throw new Error(`Failed to update receipt: ${updateError.message}`);
    }

    // Krok 3: Aktualizacja pozycji paragonu (delete + insert)
    // Najpierw usuwamy wszystkie istniejące pozycje
    const { error: deleteError } = await supabase.from("receipt_items").delete().eq("receipt_id", receiptId);

    if (deleteError) {
      // eslint-disable-next-line no-console
      console.error("[updateReceipt] Error deleting old receipt items:", deleteError);
      throw new Error(`Failed to delete receipt items: ${deleteError.message}`);
    }

    // Jeśli są nowe pozycje, dodajemy je
    if (data.items && data.items.length > 0) {
      const itemsData = data.items.map((item) => ({
        receipt_id: receiptId,
        product_name: item.product_name,
        price: item.price,
        category_id: item.category_id,
      }));

      const { error: itemsError } = await supabase.from("receipt_items").insert(itemsData);

      if (itemsError) {
        // eslint-disable-next-line no-console
        console.error("[updateReceipt] Error inserting receipt items:", itemsError);

        // Jeśli to foreign key constraint error dla category_id
        if (itemsError.code === "23503" && itemsError.message.includes("category_id")) {
          throw new Error("One or more category IDs do not exist");
        }

        throw new Error(`Failed to create receipt items: ${itemsError.message}`);
      }
    }

    // Krok 4: Pobranie zaktualizowanego paragonu z items i przeliczonym total_amount
    // Trigger bazodanowy zaktualizował total_amount po operacji na items
    const { data: updatedReceipt, error: fetchError } = await supabase
      .from("receipts")
      .select(
        `
        id,
        purchase_date,
        store_name,
        total_amount,
        receipt_items (
          id,
          product_name,
          price,
          category_id,
          receipt_id
        )
      `
      )
      .eq("id", receiptId)
      .maybeSingle();

    if (fetchError || !updatedReceipt) {
      // eslint-disable-next-line no-console
      console.error("[updateReceipt] Error fetching updated receipt:", fetchError);
      throw new Error("Failed to retrieve updated receipt");
    }

    // Krok 5: Transformacja do ReceiptDto
    const receiptDto: ReceiptDto = {
      id: updatedReceipt.id,
      purchase_date: updatedReceipt.purchase_date,
      store_name: updatedReceipt.store_name,
      total_amount: updatedReceipt.total_amount,
      items: (updatedReceipt.receipt_items || []) as ReceiptItemDto[],
    };

    return receiptDto;
  } catch (error) {
    // Logowanie szczegółów błędu
    // eslint-disable-next-line no-console
    console.error("[updateReceipt] Unexpected error:", {
      error,
      receiptId,
      userId,
      timestamp: new Date().toISOString(),
    });

    // Re-throw error dla obsługi w API route
    throw error;
  }
}
