import { z } from "zod";

/**
 * Schema dla odpowiedzi z AI podczas skanowania paragonu
 * Używany do walidacji i typowania odpowiedzi z Gemini API
 */
export const ReceiptScanResponseSchema = z.object({
  purchase_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data musi być w formacie YYYY-MM-DD"),
  store_name: z.string().optional(),
  items: z
    .array(
      z.object({
        name: z.string().min(1, "Nazwa pozycji nie może być pusta"),
        price: z.number().positive("Cena musi być liczbą dodatnią"),
        category_id: z.number().int().positive("category_id musi być liczbą całkowitą dodatnią"),
      })
    )
    .min(1, "Paragon musi zawierać co najmniej jedną pozycję"),
  total: z.number().positive("Suma musi być liczbą dodatnią"),
});

export type ReceiptScanResponse = z.infer<typeof ReceiptScanResponseSchema>;

/**
 * UWAGA: Request body dla /api/receipts/scan to FormData (multipart/form-data), nie JSON.
 *
 * Format request:
 * - Content-Type: multipart/form-data
 * - Body: FormData z polem "file" (File object)
 *
 * Plik jest uploadowany bezpośrednio do Gemini Files API (limit 2GB, storage 48h).
 * Walidacja typu pliku (image/jpeg, image/png) wykonywana jest w endpoincie.
 *
 * Schema powyżej (ReceiptScanResponseSchema) jest używana tylko dla walidacji
 * odpowiedzi z Gemini AI, nie dla request body.
 */
