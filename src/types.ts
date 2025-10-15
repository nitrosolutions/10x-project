/* src/types.ts */
/* Definicje typów DTO i Command Modeli wygenerowane na podstawie modeli bazy danych oraz planu API */

import type { Database } from "./db/database.types";

// DTO dla kategorii - odwzorowuje tabelę "categories"
export type CategoryDto = Database["public"]["Tables"]["categories"]["Row"];

// DTO dla pozycji paragonu - odwzorowuje tabelę "receipt_items"
export type ReceiptItemDto = Database["public"]["Tables"]["receipt_items"]["Row"];

// DTO dla paragonu zwracanego przez API, zawiera dodatkowe pole "items"
export interface ReceiptDto extends Omit<Database["public"]["Tables"]["receipts"]["Row"], "user_id" | "source"> {
  // Lista elementów paragonu
  items: ReceiptItemDto[];
}

// DTO dla uproszczonej listy paragonów (bez pozycji) - używane w GET /api/receipts
export type ReceiptListDto = Omit<Database["public"]["Tables"]["receipts"]["Row"], "user_id" | "source">;

// Command Model dla skanowania paragonu przez API (POST /api/receipts/scan)
// Pole "image" zawiera obraz w formacie base64
export interface ScanReceiptCommand {
  image: string;
}

// Command Model dla tworzenia paragonu ręcznie (POST /api/receipts)
// Pole "store_name" jest opcjonalne, a "source" ustawiane jest wewnętrznie na "manual" lub "scan"
export interface CreateReceiptCommand {
  purchase_date: string;
  store_name?: string;
  // Lista pozycji paragonu, każda zgodna z ReceiptItemCommand (opcjonalna)
  items?: ReceiptItemCommand[];
  // Opcjonalne źródło paragonu - jeśli nie podane, domyślnie "manual"
  source?: "manual" | "scan";
}

// Command Model dla aktualizacji paragonu (PUT /api/receipts/{receiptId})
// Używamy Partial, aby umożliwić częściową aktualizację pól
export type UpdateReceiptCommand = Partial<
  Pick<Database["public"]["Tables"]["receipts"]["Update"], "purchase_date" | "store_name">
>;

// Command Model dla dodawania lub aktualizacji pozycji paragonu (POST/PUT /api/receipts/{receiptId}/items)
// Odpowiada strukturze wymaganej przez tabelę "receipt_items", z pominięciem generowanego "id"
export interface ReceiptItemCommand {
  product_name: string;
  price: number;
  category_id: number;
}

// DTO dla statystyk miesięcznych (GET /api/stats/monthly)
export interface StatsDto {
  month: string;
  // Tablica agregatów wydatków per kategoria
  totals: {
    category_id: number;
    amount: number;
  }[];
  grand_total: number;
}
