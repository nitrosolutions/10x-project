/* src/lib/services/receipt.service.ts */
/* Business logic dla operacji na paragonach */

import type { SupabaseClient } from "@/db/supabase.client";
import type { CreateReceiptCommand, ReceiptDto, ReceiptItemDto } from "@/types";

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
  // Przygotowanie danych do insercji - ustawienie source: "manual"
  const receiptData = {
    user_id: userId,
    purchase_date: data.purchase_date,
    store_name: data.store_name || null,
    source: "manual" as const,
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
