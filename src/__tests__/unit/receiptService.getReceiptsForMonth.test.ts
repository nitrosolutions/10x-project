/**
 * Unit tests dla receiptService.getReceiptsForMonth()
 *
 * Funkcja pobiera listę paragonów dla użytkownika za określony miesiąc.
 *
 * Wymogi biznesowe:
 * - Pobieraj paragony tylko dla określonego miesiąca (YYYY-MM)
 * - Sortuj wyniki malejąco według purchase_date (najnowsze najpierw)
 * - Zwracaj tylko uproszczoną listę (bez items)
 * - Zapewniaj bezpieczeństwo RLS (tylko swoje paragony)
 * - Obsługuj błędy z Supabase
 *
 * Warunki brzegowe:
 * - Styczeń (miesiąc 1)
 * - Grudzień (miesiąc 12)
 * - Przejście roku (np. grudz 2024 -> sty 2025)
 * - Pusta lista paragonów
 * - Błędy Supabase
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@/db/supabase.client";
import { getReceiptsForMonth } from "@/lib/services/receiptService";

/**
 * Mock data dla testów
 */
const MOCK_USER_ID = "550e8400-e29b-41d4-a716-446655440000";

const MOCK_RECEIPT_DATA = [
  {
    id: "receipt-1",
    purchase_date: "2025-01-15",
    store_name: "Tesco",
    total_amount: 45.99,
  },
  {
    id: "receipt-2",
    purchase_date: "2025-01-20",
    store_name: "Walmart",
    total_amount: 120.5,
  },
  {
    id: "receipt-3",
    purchase_date: "2025-01-05",
    store_name: "Carrefour",
    total_amount: 67.3,
  },
];

/**
 * Helper do tworzenia mock Supabase client'a
 */
function createMockSupabaseClient(returnData: any[] | null = null, error: any = null): SupabaseClient {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lt: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: returnData,
                error,
              }),
            }),
          }),
        }),
      }),
    }),
  } as any;
}

describe("receiptService.getReceiptsForMonth()", () => {
  /**
   * Sekcja 1: Obliczanie startDate
   *
   * Wymóg: startDate powinien być pierwszym dniem miesiąca w formacie YYYY-MM-01
   */
  describe("Obliczanie startDate", () => {
    it("powinien ustawić startDate na YYYY-MM-01 dla stycznia", async () => {
      const mockSupabase = createMockSupabaseClient(MOCK_RECEIPT_DATA);

      await getReceiptsForMonth(mockSupabase, MOCK_USER_ID, "2025-01");

      // Sprawdzenie, że gte() był wywołany z '2025-01-01'
      const fromCall = mockSupabase.from("receipts");
      const selectCall = fromCall.select(expect.any(String));
      const eqCall = selectCall.eq("user_id", MOCK_USER_ID);
      const gteCall = eqCall.gte("purchase_date", expect.any(String));

      // Odczytanie argumentu z gte()
      const gteArgs = (eqCall.gte as any).mock.calls[0];
      expect(gteArgs[1]).toBe("2025-01-01");
    });

    it("powinien ustawić startDate na YYYY-MM-01 dla grudnia", async () => {
      const mockSupabase = createMockSupabaseClient(MOCK_RECEIPT_DATA);

      await getReceiptsForMonth(mockSupabase, MOCK_USER_ID, "2024-12");

      const fromCall = mockSupabase.from("receipts");
      const selectCall = fromCall.select(expect.any(String));
      const eqCall = selectCall.eq("user_id", MOCK_USER_ID);
      const gteArgs = (eqCall.gte as any).mock.calls[0];

      expect(gteArgs[1]).toBe("2024-12-01");
    });

    it("powinien obsługiwać miesiące z wiodącymi zerami", async () => {
      const mockSupabase = createMockSupabaseClient(MOCK_RECEIPT_DATA);

      await getReceiptsForMonth(mockSupabase, MOCK_USER_ID, "2025-03");

      const fromCall = mockSupabase.from("receipts");
      const selectCall = fromCall.select(expect.any(String));
      const eqCall = selectCall.eq("user_id", MOCK_USER_ID);
      const gteArgs = (eqCall.gte as any).mock.calls[0];

      expect(gteArgs[1]).toBe("2025-03-01");
    });
  });

  /**
   * Sekcja 2: Obliczanie nextMonthDate
   *
   * Wymóg: nextMonthDate powinien być pierwszym dniem następnego miesiąca
   * Edge case: Grudzień -> następny rok
   */
  describe("Obliczanie nextMonthDate", () => {
    it("powinien obliczyć nextMonthDate dla zwykłego miesiąca", async () => {
      const mockSupabase = createMockSupabaseClient(MOCK_RECEIPT_DATA);

      await getReceiptsForMonth(mockSupabase, MOCK_USER_ID, "2025-01");

      const fromCall = mockSupabase.from("receipts");
      const selectCall = fromCall.select(expect.any(String));
      const eqCall = selectCall.eq("user_id", MOCK_USER_ID);
      const gteCall = eqCall.gte("purchase_date", expect.any(String));
      const ltArgs = (gteCall.lt as any).mock.calls[0];

      expect(ltArgs[1]).toBe("2025-02-01");
    });

    it("powinien obliczyć nextMonthDate dla marca", async () => {
      const mockSupabase = createMockSupabaseClient(MOCK_RECEIPT_DATA);

      await getReceiptsForMonth(mockSupabase, MOCK_USER_ID, "2025-03");

      const fromCall = mockSupabase.from("receipts");
      const selectCall = fromCall.select(expect.any(String));
      const eqCall = selectCall.eq("user_id", MOCK_USER_ID);
      const gteCall = eqCall.gte("purchase_date", expect.any(String));
      const ltArgs = (gteCall.lt as any).mock.calls[0];

      expect(ltArgs[1]).toBe("2025-04-01");
    });

    it("powinien obsługiwać przejście roku - grudzień -> następny rok", async () => {
      const mockSupabase = createMockSupabaseClient(MOCK_RECEIPT_DATA);

      await getReceiptsForMonth(mockSupabase, MOCK_USER_ID, "2024-12");

      const fromCall = mockSupabase.from("receipts");
      const selectCall = fromCall.select(expect.any(String));
      const eqCall = selectCall.eq("user_id", MOCK_USER_ID);
      const gteCall = eqCall.gte("purchase_date", expect.any(String));
      const ltArgs = (gteCall.lt as any).mock.calls[0];

      expect(ltArgs[1]).toBe("2025-01-01");
    });

    it("powinien obsługiwać przejście roku dla przyszłego roku", async () => {
      const mockSupabase = createMockSupabaseClient(MOCK_RECEIPT_DATA);

      await getReceiptsForMonth(mockSupabase, MOCK_USER_ID, "2099-12");

      const fromCall = mockSupabase.from("receipts");
      const selectCall = fromCall.select(expect.any(String));
      const eqCall = selectCall.eq("user_id", MOCK_USER_ID);
      const gteCall = eqCall.gte("purchase_date", expect.any(String));
      const ltArgs = (gteCall.lt as any).mock.calls[0];

      expect(ltArgs[1]).toBe("2100-01-01");
    });

    it("powinien poprawnie sformatować nextMonthDate z wiodącymi zerami", async () => {
      const mockSupabase = createMockSupabaseClient(MOCK_RECEIPT_DATA);

      await getReceiptsForMonth(mockSupabase, MOCK_USER_ID, "2025-09");

      const fromCall = mockSupabase.from("receipts");
      const selectCall = fromCall.select(expect.any(String));
      const eqCall = selectCall.eq("user_id", MOCK_USER_ID);
      const gteCall = eqCall.gte("purchase_date", expect.any(String));
      const ltArgs = (gteCall.lt as any).mock.calls[0];

      expect(ltArgs[1]).toBe("2025-10-01");
    });
  });

  /**
   * Sekcja 3: Złożone edge case'y dla dat
   *
   * Sprawdzanie kombinacji startDate i nextMonthDate
   */
  describe("Edge case'y dla obliczania dat", () => {
    it("powinien poprawnie obsługiwać wszystkie miesiące roku 2025", async () => {
      const months = [
        { input: "2025-01", expectedStart: "2025-01-01", expectedNext: "2025-02-01" },
        { input: "2025-02", expectedStart: "2025-02-01", expectedNext: "2025-03-01" },
        { input: "2025-06", expectedStart: "2025-06-01", expectedNext: "2025-07-01" },
        { input: "2025-12", expectedStart: "2025-12-01", expectedNext: "2026-01-01" },
      ];

      for (const month of months) {
        const mockSupabase = createMockSupabaseClient(MOCK_RECEIPT_DATA);

        await getReceiptsForMonth(mockSupabase, MOCK_USER_ID, month.input);

        const fromCall = mockSupabase.from("receipts");
        const selectCall = fromCall.select(expect.any(String));
        const eqCall = selectCall.eq("user_id", MOCK_USER_ID);
        const gteCall = eqCall.gte("purchase_date", expect.any(String));
        const ltArgs = (gteCall.lt as any).mock.calls[0];

        expect((eqCall.gte as any).mock.calls[0][1]).toBe(month.expectedStart);
        expect(ltArgs[1]).toBe(month.expectedNext);
      }
    });

    it("powinien obsługiwać rok 2000 (edge case dla starego roku)", async () => {
      const mockSupabase = createMockSupabaseClient(MOCK_RECEIPT_DATA);

      await getReceiptsForMonth(mockSupabase, MOCK_USER_ID, "2000-12");

      const fromCall = mockSupabase.from("receipts");
      const selectCall = fromCall.select(expect.any(String));
      const eqCall = selectCall.eq("user_id", MOCK_USER_ID);
      const gteCall = eqCall.gte("purchase_date", expect.any(String));
      const ltArgs = (gteCall.lt as any).mock.calls[0];

      expect(ltArgs[1]).toBe("2001-01-01");
    });
  });

  /**
   * Sekcja 4: Bezpieczeństwo RLS i parametry query
   *
   * Wymóg: Zapewniać, że zapytanie zawsze filtruje po user_id
   */
  describe("Bezpieczeństwo i parametry query", () => {
    it("powinien filtrować po user_id dla bezpieczeństwa RLS", async () => {
      const mockSupabase = createMockSupabaseClient(MOCK_RECEIPT_DATA);

      await getReceiptsForMonth(mockSupabase, MOCK_USER_ID, "2025-01");

      const fromCall = mockSupabase.from("receipts");
      const selectCall = fromCall.select(expect.any(String));
      const eqCall = (selectCall.eq as any).mock.calls[0];

      expect(eqCall[0]).toBe("user_id");
      expect(eqCall[1]).toBe(MOCK_USER_ID);
    });

    it("powinien obsługiwać różne user_id", async () => {
      const differentUserIds = [
        "550e8400-e29b-41d4-a716-446655440001",
        "550e8400-e29b-41d4-a716-446655440002",
        "user-test-id-123",
      ];

      for (const userId of differentUserIds) {
        const mockSupabase = createMockSupabaseClient(MOCK_RECEIPT_DATA);

        await getReceiptsForMonth(mockSupabase, userId, "2025-01");

        const fromCall = mockSupabase.from("receipts");
        const selectCall = fromCall.select(expect.any(String));
        const eqCall = (selectCall.eq as any).mock.calls[0];

        expect(eqCall[1]).toBe(userId);
      }
    });

    it("powinien wybierać poprawne kolumny z bazy", async () => {
      const mockSupabase = createMockSupabaseClient(MOCK_RECEIPT_DATA);

      await getReceiptsForMonth(mockSupabase, MOCK_USER_ID, "2025-01");

      const fromCall = mockSupabase.from("receipts");
      const selectCall = (fromCall.select as any).mock.calls[0];
      const columns = selectCall[0];

      expect(columns).toContain("id");
      expect(columns).toContain("purchase_date");
      expect(columns).toContain("store_name");
      expect(columns).toContain("total_amount");
    });

    it("powinien sortować malejąco po purchase_date", async () => {
      const mockSupabase = createMockSupabaseClient(MOCK_RECEIPT_DATA);

      await getReceiptsForMonth(mockSupabase, MOCK_USER_ID, "2025-01");

      const fromCall = mockSupabase.from("receipts");
      const selectCall = fromCall.select(expect.any(String));
      const eqCall = selectCall.eq("user_id", MOCK_USER_ID);
      const gteCall = eqCall.gte("purchase_date", expect.any(String));
      const ltCall = gteCall.lt("purchase_date", expect.any(String));
      const orderCall = (ltCall.order as any).mock.calls[0];

      expect(orderCall[0]).toBe("purchase_date");
      expect(orderCall[1]).toEqual({ ascending: false });
    });
  });

  /**
   * Sekcja 5: Obsługa danych i transformacja
   *
   * Wymóg: Zwracać dane w formacie ReceiptListDto[]
   */
  describe("Obsługa i transformacja danych", () => {
    it("powinien zwrócić tablicę paragonów", async () => {
      const mockSupabase = createMockSupabaseClient(MOCK_RECEIPT_DATA);

      const result = await getReceiptsForMonth(mockSupabase, MOCK_USER_ID, "2025-01");

      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(MOCK_RECEIPT_DATA);
    });

    it("powinien zwrócić pustą tablicę gdy brak paragonów", async () => {
      const mockSupabase = createMockSupabaseClient([]);

      const result = await getReceiptsForMonth(mockSupabase, MOCK_USER_ID, "2025-01");

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    it("powinien rzutować null data na typ ReceiptListDto[]", async () => {
      const mockSupabase = createMockSupabaseClient(null);

      const result = await getReceiptsForMonth(mockSupabase, MOCK_USER_ID, "2025-01");

      // Funkcja zwraca: data as ReceiptListDto[]
      // Gdy data jest null, wynik będzie null rzutowany na ReceiptListDto[]
      expect(result).toBeNull();
    });

    it("powinien zwracać paragony w formacie ReceiptListDto", async () => {
      const mockSupabase = createMockSupabaseClient(MOCK_RECEIPT_DATA);

      const result = await getReceiptsForMonth(mockSupabase, MOCK_USER_ID, "2025-01");

      result.forEach((receipt) => {
        expect(receipt).toHaveProperty("id");
        expect(receipt).toHaveProperty("purchase_date");
        expect(receipt).toHaveProperty("store_name");
        expect(receipt).toHaveProperty("total_amount");
        expect(typeof receipt.id).toBe("string");
        expect(typeof receipt.purchase_date).toBe("string");
        expect(typeof receipt.total_amount).toBe("number");
      });
    });

    it("powinien poprawnie mapować pola z odpowiedzi Supabase", async () => {
      const customReceipt = {
        id: "custom-id",
        purchase_date: "2025-01-25",
        store_name: "Custom Store",
        total_amount: 999.99,
      };

      const mockSupabase = createMockSupabaseClient([customReceipt]);

      const result = await getReceiptsForMonth(mockSupabase, MOCK_USER_ID, "2025-01");

      expect(result[0]).toEqual(customReceipt);
    });
  });

  /**
   * Sekcja 6: Obsługa błędów z Supabase
   *
   * Wymóg: Rzucać Error z komunikatem w przypadku problemu z bazą
   */
  describe("Obsługa błędów Supabase", () => {
    it("powinien rzucić error gdy Supabase zwróci błąd", async () => {
      const supabaseError = {
        message: "Unauthorized",
        code: "401",
      };

      const mockSupabase = createMockSupabaseClient(null, supabaseError);

      await expect(getReceiptsForMonth(mockSupabase, MOCK_USER_ID, "2025-01")).rejects.toThrow(
        "Failed to fetch receipts: Unauthorized"
      );
    });

    it("powinien zawierać informacje o błędzie w wiadomości", async () => {
      const supabaseError = {
        message: "Connection timeout",
        code: "TIMEOUT",
      };

      const mockSupabase = createMockSupabaseClient(null, supabaseError);

      await expect(getReceiptsForMonth(mockSupabase, MOCK_USER_ID, "2025-01")).rejects.toThrow(/Connection timeout/);
    });

    it("powinien rzucić error dla błędu autoryzacji", async () => {
      const supabaseError = {
        message: "JWT expired",
        code: "PGRST000",
      };

      const mockSupabase = createMockSupabaseClient(null, supabaseError);

      await expect(getReceiptsForMonth(mockSupabase, MOCK_USER_ID, "2025-01")).rejects.toThrow();
    });

    it("powinien rzucić error dla błędu połączenia", async () => {
      const supabaseError = {
        message: "Failed to connect to database",
        code: "PGRST503",
      };

      const mockSupabase = createMockSupabaseClient(null, supabaseError);

      await expect(getReceiptsForMonth(mockSupabase, MOCK_USER_ID, "2025-01")).rejects.toThrow(
        "Failed to fetch receipts"
      );
    });

    it("powinien obsługiwać błędy bez message", async () => {
      const supabaseError = {
        code: "UNKNOWN",
      };

      const mockSupabase = createMockSupabaseClient(null, supabaseError);

      await expect(getReceiptsForMonth(mockSupabase, MOCK_USER_ID, "2025-01")).rejects.toThrow();
    });
  });

  /**
   * Sekcja 7: Integracja - łańcuch operacji
   *
   * Wymóg: Logika dat powinna być spójna na całej ścieżce
   */
  describe("Integracja - pełny łańcuch operacji", () => {
    it("powinien poprawnie построić całe zapytanie dla stycznia", async () => {
      const mockSupabase = createMockSupabaseClient(MOCK_RECEIPT_DATA);

      await getReceiptsForMonth(mockSupabase, MOCK_USER_ID, "2025-01");

      // Weryfikacja całego łańcucha
      expect(mockSupabase.from).toHaveBeenCalledWith("receipts");

      const fromResult = mockSupabase.from("receipts");
      expect(fromResult.select).toHaveBeenCalledWith("id, purchase_date, store_name, total_amount");

      const selectResult = fromResult.select(expect.any(String));
      expect(selectResult.eq).toHaveBeenCalledWith("user_id", MOCK_USER_ID);

      const eqResult = selectResult.eq("user_id", MOCK_USER_ID);
      expect(eqResult.gte).toHaveBeenCalledWith("purchase_date", "2025-01-01");

      const gteResult = eqResult.gte("purchase_date", expect.any(String));
      expect(gteResult.lt).toHaveBeenCalledWith("purchase_date", "2025-02-01");

      const ltResult = gteResult.lt("purchase_date", expect.any(String));
      expect(ltResult.order).toHaveBeenCalledWith("purchase_date", { ascending: false });
    });

    it("powinien poprawnie obsługiwać scenariusz: brak danych w grudniu", async () => {
      const mockSupabase = createMockSupabaseClient([]);

      const result = await getReceiptsForMonth(mockSupabase, MOCK_USER_ID, "2024-12");

      expect(mockSupabase.from).toHaveBeenCalledWith("receipts");
      expect(result).toEqual([]);
    });
  });

  /**
   * Sekcja 8: Typy i struktura danych
   *
   * Wymóg: Zwracane dane muszą być typu ReceiptListDto[]
   */
  describe("Weryfikacja typów zwracanych danych", () => {
    it("zwrócone dane powinny mieć poprawne typy pól", async () => {
      const testData = [
        {
          id: "123e4567-e89b-12d3-a456-426614174000",
          purchase_date: "2025-01-15",
          store_name: "Test Store",
          total_amount: 123.45,
        },
      ];

      const mockSupabase = createMockSupabaseClient(testData);

      const result = await getReceiptsForMonth(mockSupabase, MOCK_USER_ID, "2025-01");

      expect(result[0].id).toBeDefined();
      expect(typeof result[0].id).toBe("string");
      expect(result[0].purchase_date).toBeDefined();
      expect(typeof result[0].purchase_date).toBe("string");
      expect(result[0].total_amount).toBeDefined();
      expect(typeof result[0].total_amount).toBe("number");
    });

    it("powinien obsługiwać store_name = null", async () => {
      const testData = [
        {
          id: "123",
          purchase_date: "2025-01-15",
          store_name: null,
          total_amount: 50.0,
        },
      ];

      const mockSupabase = createMockSupabaseClient(testData);

      const result = await getReceiptsForMonth(mockSupabase, MOCK_USER_ID, "2025-01");

      expect(result[0].store_name).toBeNull();
    });
  });

  /**
   * Sekcja 9: Wydajność i skala
   *
   * Wymóg: Funkcja powinna działać z różnymi rozmiarami danych
   */
  describe("Wydajność i skala danych", () => {
    it("powinien obsługiwać dużą liczbę paragonów", async () => {
      const largeDataSet = Array.from({ length: 1000 }, (_, i) => ({
        id: `receipt-${i}`,
        purchase_date: `2025-01-${(i % 31) + 1}`,
        store_name: `Store ${i}`,
        total_amount: Math.random() * 1000,
      }));

      const mockSupabase = createMockSupabaseClient(largeDataSet);

      const result = await getReceiptsForMonth(mockSupabase, MOCK_USER_ID, "2025-01");

      expect(result).toHaveLength(1000);
      expect(Array.isArray(result)).toBe(true);
    });

    it("powinien obsługiwać małą liczbę paragonów", async () => {
      const smallDataSet = [
        {
          id: "receipt-1",
          purchase_date: "2025-01-15",
          store_name: "Store 1",
          total_amount: 50.0,
        },
      ];

      const mockSupabase = createMockSupabaseClient(smallDataSet);

      const result = await getReceiptsForMonth(mockSupabase, MOCK_USER_ID, "2025-01");

      expect(result).toHaveLength(1);
    });
  });
});
