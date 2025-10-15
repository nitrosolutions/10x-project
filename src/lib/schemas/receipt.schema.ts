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
 * - Data nie może być więcej niż 1 dzień w przyszłości (tolerancja dla stref czasowych)
 */
const purchaseDateValidator = z
  .string()
  .refine((dateStr) => {
    // Parse input date string directly as UTC date (YYYY-MM-DD)
    const inputDate = new Date(dateStr + "T00:00:00Z");

    // Get current date in UTC, set to midnight
    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    // Allow up to 1 day in the future to handle timezone differences
    // (users in UTC+X timezones may be on "tomorrow" relative to server)
    const tomorrowUTC = new Date(todayUTC);
    tomorrowUTC.setUTCDate(todayUTC.getUTCDate() + 1);

    // Sprawdzenie czy data jest więcej niż 1 dzień w przyszłości
    if (inputDate > tomorrowUTC) {
      return false;
    }

    return true;
  }, "Purchase date cannot be more than 1 day in the future")
  .refine((dateStr) => {
    // Sprawdzenie formatu ISO 8601 (YYYY-MM-DD)
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    return isoDateRegex.test(dateStr);
  }, "Purchase date must be in ISO 8601 format (YYYY-MM-DD)");

/**
 * Schema dla CreateReceiptCommand (POST /api/receipts)
 *
 * Waliduje:
 * - purchase_date: wymagane, ISO 8601, max 1 dzień w przyszłości (tolerancja stref czasowych)
 * - store_name: opcjonalne, max 255 znaków, trim whitespace
 * - items: opcjonalna tablica, max 100 elementów, każdy element walidowany przez ReceiptItemSchema
 * - source: opcjonalne, "manual" lub "scan" (domyślnie "manual")
 */
export const CreateReceiptSchema = z.object({
  purchase_date: purchaseDateValidator,
  store_name: z.string().trim().max(255, "Store name must not exceed 255 characters").optional(),
  items: z.array(ReceiptItemSchema).max(100, "Cannot add more than 100 items per receipt").optional(),
  source: z.enum(["manual", "scan"]).optional(),
});

/**
 * Type inference dla CreateReceiptCommand z Zod schema
 */
export type CreateReceiptInput = z.infer<typeof CreateReceiptSchema>;
