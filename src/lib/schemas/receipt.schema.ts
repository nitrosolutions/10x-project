/* src/lib/schemas/receipt.schema.ts */
/* Schematy walidacji Zod dla operacji na paragonach */

import { z } from "zod";

/**
 * Schema dla pojedynczej pozycji paragonu (ReceiptItemCommand)
 */
export const ReceiptItemSchema = z.object({
  product_name: z
    .string()
    .trim()
    .min(1, "Product name is required")
    .max(255, "Product name must not exceed 255 characters"),
  price: z
    .number()
    .positive("Price must be positive")
    .max(999999.99, "Price must not exceed 999999.99")
    .multipleOf(0.01, "Price must have at most 2 decimal places"),
  category_id: z.number().int("Category ID must be an integer").positive("Category ID must be positive"),
});

/**
 * Custom validator dla purchase_date:
 * - Data nie może być w przyszłości
 * - Data nie może być starsza niż 10 lat
 */
const purchaseDateValidator = z
  .string()
  .refine((dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(now.getFullYear() - 10);

    // Sprawdzenie czy data jest w przyszłości
    if (date > now) {
      return false;
    }

    // Sprawdzenie czy data jest starsza niż 10 lat
    if (date < tenYearsAgo) {
      return false;
    }

    return true;
  }, "Purchase date must not be in the future and not older than 10 years")
  .refine((dateStr) => {
    // Sprawdzenie formatu ISO 8601 (YYYY-MM-DD)
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    return isoDateRegex.test(dateStr);
  }, "Purchase date must be in ISO 8601 format (YYYY-MM-DD)");

/**
 * Schema dla CreateReceiptCommand (POST /api/receipts)
 *
 * Waliduje:
 * - purchase_date: wymagane, ISO 8601, nie w przyszłości, nie starsze niż 10 lat
 * - store_name: opcjonalne, max 255 znaków, trim whitespace
 * - items: opcjonalna tablica, max 100 elementów, każdy element walidowany przez ReceiptItemSchema
 */
export const CreateReceiptSchema = z.object({
  purchase_date: purchaseDateValidator,
  store_name: z.string().trim().max(255, "Store name must not exceed 255 characters").optional(),
  items: z.array(ReceiptItemSchema).max(100, "Cannot add more than 100 items per receipt").optional(),
});

/**
 * Type inference dla CreateReceiptCommand z Zod schema
 */
export type CreateReceiptInput = z.infer<typeof CreateReceiptSchema>;
