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
 * Schema dla request body do endpointu /api/receipts/scan
 */
export const ScanReceiptRequestSchema = z.object({
  image: z.string().min(1, "Obraz nie może być pusty"),
  mimeType: z.enum(["image/jpeg", "image/png"], {
    errorMap: () => ({ message: "Niewspierany format pliku (tylko JPEG, PNG)" }),
  }),
});

export type ScanReceiptRequest = z.infer<typeof ScanReceiptRequestSchema>;
