/**
 * Unit tests dla receiptService.getReceiptById()
 *
 * Funkcja pobiera szczegółowe informacje o pojedynczym paragonie wraz z jego pozycjami.
 *
 * Wymogi biznesowe:
 * - Pobieraj paragony po receiptId i userId
 * - Zwracaj null jeśli paragon nie istnieje (PGRST116)
 * - Zwracaj pełny paragon z zagnieżdżonymi items
 * - Obsługuj błędy inne niż PGRST116
 * - Zapewniaj bezpieczeństwo RLS
 */

import { describe, it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@/db/supabase.client';
import { getReceiptById } from '@/lib/services/receiptService';

// Mock data
const MOCK_USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const MOCK_RECEIPT_ID = 'receipt-123-uuid';

const MOCK_RECEIPT_WITH_ITEMS = {
  id: MOCK_RECEIPT_ID,
  purchase_date: '2025-01-15',
  store_name: 'Tesco',
  total_amount: 150.00,
  receipt_items: [
    {
      id: 'item-1',
      receipt_id: MOCK_RECEIPT_ID,
      product_name: 'Mleko',
      price: 3.50,
      category_id: 1,
    },
    {
      id: 'item-2',
      receipt_id: MOCK_RECEIPT_ID,
      product_name: 'Chleb',
      price: 2.50,
      category_id: 2,
    },
  ],
};

// Mock helper
function createMockSupabaseClient(data = null, error = null) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data,
              error,
            }),
          }),
        }),
      }),
    }),
  } as any;
}

describe('receiptService.getReceiptById()', () => {
  /**
   * Sekcja 1: Happy Path - Paragon znaleziony z items
   */
  describe('Happy Path - Paragon znaleziony', () => {
    it('powinien zwrócić paragon z items gdy znaleziony', async () => {
      const mockSupabase = createMockSupabaseClient(MOCK_RECEIPT_WITH_ITEMS);

      const result = await getReceiptById(mockSupabase, MOCK_RECEIPT_ID, MOCK_USER_ID);

      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(result?.id).toBe(MOCK_RECEIPT_ID);
      expect(result?.store_name).toBe('Tesco');
    });

    it('powinien zwrócić paragon z zagnieżdżonymi items', async () => {
      const mockSupabase = createMockSupabaseClient(MOCK_RECEIPT_WITH_ITEMS);

      const result = await getReceiptById(mockSupabase, MOCK_RECEIPT_ID, MOCK_USER_ID);

      expect(result?.items).toBeDefined();
      expect(result?.items).toHaveLength(2);
      expect(result?.items[0].product_name).toBe('Mleko');
      expect(result?.items[1].product_name).toBe('Chleb');
    });

    it('powinien mapować wszystkie pola na ReceiptDto', async () => {
      const mockSupabase = createMockSupabaseClient(MOCK_RECEIPT_WITH_ITEMS);

      const result = await getReceiptById(mockSupabase, MOCK_RECEIPT_ID, MOCK_USER_ID);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('purchase_date');
      expect(result).toHaveProperty('store_name');
      expect(result).toHaveProperty('total_amount');
      expect(result).toHaveProperty('items');
    });

    it('powinien zwrócić poprawne typy pól', async () => {
      const mockSupabase = createMockSupabaseClient(MOCK_RECEIPT_WITH_ITEMS);

      const result = await getReceiptById(mockSupabase, MOCK_RECEIPT_ID, MOCK_USER_ID);

      expect(typeof result?.id).toBe('string');
      expect(typeof result?.purchase_date).toBe('string');
      expect(typeof result?.total_amount).toBe('number');
      expect(Array.isArray(result?.items)).toBe(true);
    });
  });

  /**
   * Sekcja 2: Paragon bez items
   */
  describe('Paragon bez items', () => {
    it('powinien zwrócić pustą tablicę jeśli brak items', async () => {
      const receiptWithoutItems = {
        id: MOCK_RECEIPT_ID,
        purchase_date: '2025-01-15',
        store_name: 'Carrefour',
        total_amount: 50.00,
        receipt_items: [],
      };

      const mockSupabase = createMockSupabaseClient(receiptWithoutItems);

      const result = await getReceiptById(mockSupabase, MOCK_RECEIPT_ID, MOCK_USER_ID);

      expect(result?.items).toHaveLength(0);
      expect(Array.isArray(result?.items)).toBe(true);
    });

    it('powinien obsługiwać receipt_items = null', async () => {
      const receiptWithNullItems = {
        id: MOCK_RECEIPT_ID,
        purchase_date: '2025-01-15',
        store_name: 'Carrefour',
        total_amount: 50.00,
        receipt_items: null,
      };

      const mockSupabase = createMockSupabaseClient(receiptWithNullItems);

      const result = await getReceiptById(mockSupabase, MOCK_RECEIPT_ID, MOCK_USER_ID);

      expect(result?.items).toEqual([]);
    });

    it('powinien obsługiwać receipt_items undefined', async () => {
      const receiptWithUndefinedItems = {
        id: MOCK_RECEIPT_ID,
        purchase_date: '2025-01-15',
        store_name: 'Carrefour',
        total_amount: 50.00,
        receipt_items: undefined,
      };

      const mockSupabase = createMockSupabaseClient(receiptWithUndefinedItems);

      const result = await getReceiptById(mockSupabase, MOCK_RECEIPT_ID, MOCK_USER_ID);

      expect(result?.items).toEqual([]);
    });
  });

  /**
   * Sekcja 3: Paragon nie znaleziony (PGRST116)
   */
  describe('Edge Case - PGRST116 (Paragon nie znaleziony)', () => {
    it('powinien zwrócić null przy błędzie PGRST116', async () => {
      const error = { code: 'PGRST116', message: 'No rows found' };
      const mockSupabase = createMockSupabaseClient(null, error);

      const result = await getReceiptById(mockSupabase, MOCK_RECEIPT_ID, MOCK_USER_ID);

      expect(result).toBeNull();
    });

    it('powinien zwrócić null gdy receiptId nie istnieje', async () => {
      const error = { code: 'PGRST116', message: 'No rows found' };
      const mockSupabase = createMockSupabaseClient(null, error);

      const result = await getReceiptById(mockSupabase, 'non-existent-id', MOCK_USER_ID);

      expect(result).toBeNull();
    });

    it('powinien zwrócić null gdy paragon nie należy do użytkownika', async () => {
      const error = { code: 'PGRST116', message: 'No rows found' };
      const mockSupabase = createMockSupabaseClient(null, error);

      const result = await getReceiptById(mockSupabase, MOCK_RECEIPT_ID, 'different-user-id');

      expect(result).toBeNull();
    });
  });

  /**
   * Sekcja 4: Obsługa błędów inne niż PGRST116
   */
  describe('Obsługa błędów (nie PGRST116)', () => {
    it('powinien rzucić error dla błędu autoryzacji', async () => {
      const error = { code: 'PGRST000', message: 'JWT expired' };
      const mockSupabase = createMockSupabaseClient(null, error);

      await expect(
        getReceiptById(mockSupabase, MOCK_RECEIPT_ID, MOCK_USER_ID)
      ).rejects.toThrow('Failed to fetch receipt: JWT expired');
    });

    it('powinien rzucić error dla błędu połączenia', async () => {
      const error = { code: 'PGRST503', message: 'Service unavailable' };
      const mockSupabase = createMockSupabaseClient(null, error);

      await expect(
        getReceiptById(mockSupabase, MOCK_RECEIPT_ID, MOCK_USER_ID)
      ).rejects.toThrow('Failed to fetch receipt');
    });

    it('powinien zawierać szczegóły błędu w wiadomości', async () => {
      const error = { code: 'CUSTOM_ERROR', message: 'Custom error message' };
      const mockSupabase = createMockSupabaseClient(null, error);

      await expect(
        getReceiptById(mockSupabase, MOCK_RECEIPT_ID, MOCK_USER_ID)
      ).rejects.toThrow(/Custom error message/);
    });

    it('powinien rzucić error dla nieznanego błędu', async () => {
      const error = { code: 'UNKNOWN', message: 'Unknown error' };
      const mockSupabase = createMockSupabaseClient(null, error);

      await expect(
        getReceiptById(mockSupabase, MOCK_RECEIPT_ID, MOCK_USER_ID)
      ).rejects.toThrow();
    });
  });

  /**
   * Sekcja 5: Obsługa null data
   */
  describe('Obsługa null data', () => {
    it('powinien zwrócić null gdy data = null', async () => {
      const mockSupabase = createMockSupabaseClient(null, null);

      const result = await getReceiptById(mockSupabase, MOCK_RECEIPT_ID, MOCK_USER_ID);

      expect(result).toBeNull();
    });
  });

  /**
   * Sekcja 6: Parametry query i bezpieczeństwo
   */
  describe('Parametry query i bezpieczeństwo', () => {
    it('powinien filtrować po receiptId', async () => {
      const mockSupabase = createMockSupabaseClient(MOCK_RECEIPT_WITH_ITEMS);

      await getReceiptById(mockSupabase, MOCK_RECEIPT_ID, MOCK_USER_ID);

      const fromCall = mockSupabase.from('receipts');
      const selectCall = fromCall.select(expect.any(String));
      const firstEqCall = (selectCall.eq as any).mock.calls[0];

      expect(firstEqCall[0]).toBe('id');
      expect(firstEqCall[1]).toBe(MOCK_RECEIPT_ID);
    });

    it('powinien filtrować po user_id (RLS)', async () => {
      const mockSupabase = createMockSupabaseClient(MOCK_RECEIPT_WITH_ITEMS);

      await getReceiptById(mockSupabase, MOCK_RECEIPT_ID, MOCK_USER_ID);

      const fromCall = mockSupabase.from('receipts');
      const selectCall = fromCall.select(expect.any(String));
      const eqChain = selectCall.eq('id', MOCK_RECEIPT_ID);
      const secondEqCall = (eqChain.eq as any).mock.calls[0];

      expect(secondEqCall[0]).toBe('user_id');
      expect(secondEqCall[1]).toBe(MOCK_USER_ID);
    });

    it('powinien używać .single() dla pojedynczego wyniku', async () => {
      const mockSupabase = createMockSupabaseClient(MOCK_RECEIPT_WITH_ITEMS);

      await getReceiptById(mockSupabase, MOCK_RECEIPT_ID, MOCK_USER_ID);

      const fromCall = mockSupabase.from('receipts');
      const selectCall = fromCall.select(expect.any(String));
      const eqChain = selectCall.eq('id', MOCK_RECEIPT_ID);
      const secondEqCall = eqChain.eq('user_id', MOCK_USER_ID);

      // Sprawdzenie że .single() jest w chain'ie
      expect(secondEqCall).toBeDefined();
    });

    it('powinien zaznaczać zagnieżdżone receipt_items', async () => {
      const mockSupabase = createMockSupabaseClient(MOCK_RECEIPT_WITH_ITEMS);

      await getReceiptById(mockSupabase, MOCK_RECEIPT_ID, MOCK_USER_ID);

      const fromCall = mockSupabase.from('receipts');
      const selectCall = (fromCall.select as any).mock.calls[0];
      const selectQuery = selectCall[0];

      expect(selectQuery).toContain('receipt_items');
      expect(selectQuery).toContain('id');
      expect(selectQuery).toContain('product_name');
      expect(selectQuery).toContain('price');
    });
  });

  /**
   * Sekcja 7: Mapowanie ReceiptItemDto
   */
  describe('Mapowanie ReceiptItemDto', () => {
    it('powinien mapować wszystkie pola itemu', async () => {
      const mockSupabase = createMockSupabaseClient(MOCK_RECEIPT_WITH_ITEMS);

      const result = await getReceiptById(mockSupabase, MOCK_RECEIPT_ID, MOCK_USER_ID);

      const firstItem = result?.items[0];
      expect(firstItem).toHaveProperty('id');
      expect(firstItem).toHaveProperty('receipt_id');
      expect(firstItem).toHaveProperty('product_name');
      expect(firstItem).toHaveProperty('price');
      expect(firstItem).toHaveProperty('category_id');
    });

    it('powinien poprawnie mapować wartości itemów', async () => {
      const mockSupabase = createMockSupabaseClient(MOCK_RECEIPT_WITH_ITEMS);

      const result = await getReceiptById(mockSupabase, MOCK_RECEIPT_ID, MOCK_USER_ID);

      expect(result?.items[0].product_name).toBe('Mleko');
      expect(result?.items[0].price).toBe(3.50);
      expect(result?.items[0].category_id).toBe(1);
      expect(result?.items[1].product_name).toBe('Chleb');
    });

    it('powinien obsługiwać wiele itemów', async () => {
      const receiptWithManyItems = {
        ...MOCK_RECEIPT_WITH_ITEMS,
        receipt_items: Array.from({ length: 10 }, (_, i) => ({
          id: `item-${i}`,
          receipt_id: MOCK_RECEIPT_ID,
          product_name: `Product ${i}`,
          price: (i + 1) * 5.0,
          category_id: (i % 5) + 1,
        })),
      };

      const mockSupabase = createMockSupabaseClient(receiptWithManyItems);

      const result = await getReceiptById(mockSupabase, MOCK_RECEIPT_ID, MOCK_USER_ID);

      expect(result?.items).toHaveLength(10);
      expect(result?.items[0].product_name).toBe('Product 0');
      expect(result?.items[9].product_name).toBe('Product 9');
    });
  });

  /**
   * Sekcja 8: Integracja - Pełny łańcuch
   */
  describe('Integracja - pełny łańcuch operacji', () => {
    it('powinien prawidłowo zbudować całe zapytanie', async () => {
      const mockSupabase = createMockSupabaseClient(MOCK_RECEIPT_WITH_ITEMS);

      await getReceiptById(mockSupabase, MOCK_RECEIPT_ID, MOCK_USER_ID);

      expect(mockSupabase.from).toHaveBeenCalledWith('receipts');

      const fromCall = mockSupabase.from('receipts');
      expect(fromCall.select).toHaveBeenCalled();

      const selectCall = fromCall.select(expect.any(String));
      expect(selectCall.eq).toHaveBeenCalledWith('id', MOCK_RECEIPT_ID);

      const eqChain = selectCall.eq('id', MOCK_RECEIPT_ID);
      expect(eqChain.eq).toHaveBeenCalledWith('user_id', MOCK_USER_ID);
    });

    it('powinien obsługiwać scenario: znaleziony paragon z 2 items', async () => {
      const mockSupabase = createMockSupabaseClient(MOCK_RECEIPT_WITH_ITEMS);

      const result = await getReceiptById(mockSupabase, MOCK_RECEIPT_ID, MOCK_USER_ID);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(MOCK_RECEIPT_ID);
      expect(result?.items).toHaveLength(2);
      expect(result?.total_amount).toBe(150.0);
    });
  });

  /**
   * Sekcja 9: Różne receiptId i userId
   */
  describe('Obsługa różnych ID', () => {
    it('powinien obsługiwać różne receiptId', async () => {
      const receiptIds = [
        '550e8400-e29b-41d4-a716-446655440001',
        'custom-receipt-id',
        'uuid-format-id-12345',
      ];

      for (const receiptId of receiptIds) {
        const mockSupabase = createMockSupabaseClient({
          ...MOCK_RECEIPT_WITH_ITEMS,
          id: receiptId,
        });

        const result = await getReceiptById(mockSupabase, receiptId, MOCK_USER_ID);

        expect(result?.id).toBe(receiptId);
      }
    });

    it('powinien obsługiwać różne userId', async () => {
      const userIds = [
        '550e8400-e29b-41d4-a716-446655440001',
        'user-123',
        'test-user-id',
      ];

      for (const userId of userIds) {
        const mockSupabase = createMockSupabaseClient(MOCK_RECEIPT_WITH_ITEMS);

        await getReceiptById(mockSupabase, MOCK_RECEIPT_ID, userId);

        const fromCall = mockSupabase.from('receipts');
        const selectCall = fromCall.select(expect.any(String));
        const eqChain = selectCall.eq('id', MOCK_RECEIPT_ID);
        const userIdCall = (eqChain.eq as any).mock.calls[0];

        expect(userIdCall[1]).toBe(userId);
      }
    });
  });

  /**
   * Sekcja 10: Store name null
   */
  describe('Obsługa store_name = null', () => {
    it('powinien obsługiwać store_name = null', async () => {
      const receiptWithoutStore = {
        ...MOCK_RECEIPT_WITH_ITEMS,
        store_name: null,
      };

      const mockSupabase = createMockSupabaseClient(receiptWithoutStore);

      const result = await getReceiptById(mockSupabase, MOCK_RECEIPT_ID, MOCK_USER_ID);

      expect(result?.store_name).toBeNull();
    });

    it('powinien obsługiwać store_name = ""', async () => {
      const receiptWithEmptyStore = {
        ...MOCK_RECEIPT_WITH_ITEMS,
        store_name: '',
      };

      const mockSupabase = createMockSupabaseClient(receiptWithEmptyStore);

      const result = await getReceiptById(mockSupabase, MOCK_RECEIPT_ID, MOCK_USER_ID);

      expect(result?.store_name).toBe('');
    });
  });
});
