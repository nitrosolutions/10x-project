# Guide: Pisanie Testów Jednostkowych dla Services

**Bazowane na:** `receiptService.getReceiptsForMonth()` test suite
**Wzór do:** Innych funkcji w `receiptService` i `statsService`

---

## 🎯 Struktura Testu (Szablon)

```typescript
import { describe, it, expect, vi } from 'vitest';
import { myFunction } from '@/lib/services/myService';

// 1. Mock data
const MOCK_USER_ID = 'user-123';
const MOCK_DATA = [{ id: 1, name: 'Test' }];

// 2. Mock helper
function createMockClient(returnData = null, error = null) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        /* chain dalej */
      }),
    }),
  };
}

// 3. Test suite
describe('myFunction', () => {
  describe('Sekcja 1: Logika biznesowa', () => {
    it('powinien zrobić coś konkretnego', async () => {
      // Arrange
      const mock = createMockClient(MOCK_DATA);

      // Act
      const result = await myFunction(mock, MOCK_USER_ID);

      // Assert
      expect(result).toEqual(MOCK_DATA);
    });
  });
});
```

---

## 📋 Checklist: Co Testować w Service'u

### ✅ MUSI MIEĆ:

- [ ] **Logika biznesowa** - Główny przepływ funkcji
- [ ] **Edge case'y** - Graniczne wartości, przejścia
- [ ] **Error handling** - Jak funkcja reaguje na błędy
- [ ] **Typy danych** - Czy dane mają poprawny format
- [ ] **Bezpieczeństwo** - RLS filtering, authorization
- [ ] **Parametry query** - Czy zapytanie jest zbudowane poprawnie

### ⭐ POWINNO MIEĆ:

- [ ] **Transformacja danych** - Input → Output format
- [ ] **Obsługa null/undefined** - Wartości opcjonalne
- [ ] **Integracja** - Pełny łańcuch operacji
- [ ] **Wydajność** - Testy ze skalą (1, 1000, 10000)

### 📚 OPCJONALNIE:

- [ ] **Performance benchmarks** - Czasowe limity
- [ ] **Memory usage** - Dla dużych zbiorów
- [ ] **Concurrent calls** - Race conditions

---

## 🏗️ 9-Sekcyjny Szablon

Bazowany na `getReceiptsForMonth()` - adaptowalny do innych funkcji:

### Sekcja 1: Logika Podstawowa (2-5 testów)
**Co:** Główny happy path i wariacje
```typescript
describe('Logika podstawowa', () => {
  it('powinien zwrócić dane gdy wszystko OK', async () => {
    // típowy scenariusz
  });

  it('powinien obsługiwać wariacje wejścia', async () => {
    // różne inputy, ten sam output
  });
});
```

### Sekcja 2: Obliczenia/Transformacje (2-5 testów)
**Co:** Jeśli są obliczenia (daty, matematyka, parsing)
```typescript
describe('Obliczenia daty', () => {
  it('powinien obliczyć startDate', async () => {
    // weryfikacja math/parsing
  });

  it('powinien obsługiwać edge case startDate', async () => {
    // granice, przejścia
  });
});
```

### Sekcja 3: Edge Case'y (2-5 testów)
**Co:** Graniczne przypadki
```typescript
describe('Edge case\'y', () => {
  it('powinien obsługiwać wszystkie granice', async () => {
    // min, max, granice dziedziny
  });

  it('powinien obsługiwać rok przejście', async () => {
    // specjalne przejścia (rok, typ, etc)
  });
});
```

### Sekcja 4: Bezpieczeństwo (2-4 testy)
**Co:** RLS, authorization, filtry
```typescript
describe('Bezpieczeństwo', () => {
  it('powinien filtrować po user_id', async () => {
    // zawsze user_id = current_user
  });

  it('powinien obsługiwać różne user_id', async () => {
    // każdy użytkownik widzi tylko swoje
  });
});
```

### Sekcja 5: Dane (2-5 testów)
**Co:** Format zwracanych danych
```typescript
describe('Obsługa danych', () => {
  it('powinien zwrócić poprawny format', async () => {
    // shape, properties, types
  });

  it('powinien obsługiwać null fields', async () => {
    // opcjonalne pola
  });
});
```

### Sekcja 6: Błędy (2-5 testów)
**Co:** Error handling
```typescript
describe('Błędy', () => {
  it('powinien rzucić error przy Supabase error', async () => {
    // error propagation
  });

  it('powinien zawierać info o błędzie', async () => {
    // descriptive messages
  });
});
```

### Sekcja 7: Integracja (1-3 testy)
**Co:** Pełny przepływ razem
```typescript
describe('Integracja', () => {
  it('powinien prawidłowo zbudować query', async () => {
    // cały łańcuch mock calls
  });
});
```

### Sekcja 8: Typy (1-3 testy)
**Co:** TypeScript safety
```typescript
describe('Typy', () => {
  it('zwracane dane mają poprawne typy', async () => {
    // typeof, interface compliance
  });
});
```

### Sekcja 9: Skala (1-3 testy)
**Co:** Performance, różne rozmiary
```typescript
describe('Skala', () => {
  it('powinien obsługiwać dużą skalę', async () => {
    // 1000, 10000 items
  });

  it('powinien obsługiwać małą skalę', async () => {
    // 0, 1 items
  });
});
```

---

## 🎓 Wzory Mocking'u

### Pattern 1: Fluent API (Supabase)
```typescript
// Mock builder
const mockSupabase = {
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        gte: vi.fn().mockReturnValue({
          lt: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: MOCK_DATA,
              error: null,
            }),
          }),
        }),
      }),
    }),
  }),
};

// Użycie w teście
const result = await getReceiptsForMonth(mockSupabase, userId, month);

// Weryfikacja
expect(mockSupabase.from).toHaveBeenCalledWith('receipts');
```

### Pattern 2: Prosty Mock
```typescript
const mockService = {
  fetch: vi.fn().mockResolvedValue(MOCK_DATA),
  delete: vi.fn().mockResolvedValue(true),
};

const result = await myFunction(mockService);
expect(mockService.fetch).toHaveBeenCalled();
```

### Pattern 3: Mock Factory (Reusable)
```typescript
function createMockSupabaseClient(
  returnData = null,
  error = null
) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          // ... chain dalej
          mockResolvedValue({ data: returnData, error }),
        }),
      }),
    }),
  };
}

// Użycie
const mockSuccess = createMockSupabaseClient(MOCK_DATA);
const mockError = createMockSupabaseClient(null, { message: 'Error' });
```

---

## 📝 Pisanie Deskrypcji Testów

### ✅ DOBRA PRAKTYKA:
```typescript
// Describes WHAT, not HOW
it('powinien zwrócić paragony dla stycznia', () => { });

it('powinien filtrować po user_id dla bezpieczeństwa', () => { });

it('powinien rzucić error gdy Supabase zwróci błąd', () => { });

it('powinien obsługiwać przejście roku - grudzień → następny rok', () => { });
```

### ❌ ZŁA PRAKTYKA:
```typescript
// Describes HOW or is too vague
it('works', () => { });

it('returns stuff', () => { });

it('calls supabase from', () => { }); // Too implementation-focused

it('should test month', () => { }); // Too vague
```

---

## 🧪 Arrange-Act-Assert Pattern

Każdy test powinien mieć 3 części:

```typescript
it('powinien zwrócić paragony gdy miesiąc OK', async () => {
  // ==================== ARRANGE ====================
  // Setup: Mock data, inputs, dependencies
  const mockSupabase = createMockSupabaseClient(MOCK_RECEIPT_DATA);
  const userId = 'user-123';
  const month = '2025-01';

  // ==================== ACT ====================
  // Działanie: Wykonaj funkcję
  const result = await getReceiptsForMonth(mockSupabase, userId, month);

  // ==================== ASSERT ====================
  // Asercja: Sprawdź rezultat
  expect(result).toHaveLength(3);
  expect(result[0].purchase_date).toBe('2025-01-15');
});
```

---

## 🔧 Zaawansowane Techniki

### 1. Parametrized Tests (Wiele przypadków)
```typescript
it('powinien obsługiwać wszystkie miesiące roku', async () => {
  const months = [
    { input: '2025-01', expected: '2025-02-01' },
    { input: '2025-12', expected: '2026-01-01' },
    { input: '2025-06', expected: '2025-07-01' },
  ];

  for (const month of months) {
    const result = await getReceiptsForMonth(
      mockSupabase,
      userId,
      month.input
    );
    expect(/* assert */).toBe(month.expected);
  }
});
```

### 2. Spy on Method Calls
```typescript
it('powinien filtrować po user_id', async () => {
  const mockSupabase = createMockSupabaseClient(MOCK_DATA);

  await getReceiptsForMonth(mockSupabase, userId, '2025-01');

  // Weryfikuj, że eq() został wywołany z user_id
  const eqCall = (mockSupabase.from().select().eq as any).mock.calls[0];
  expect(eqCall[0]).toBe('user_id');
  expect(eqCall[1]).toBe(userId);
});
```

### 3. Error Testing
```typescript
it('powinien rzucić error przy Supabase error', async () => {
  const supabaseError = { message: 'Connection failed' };
  const mockSupabase = createMockSupabaseClient(null, supabaseError);

  await expect(
    getReceiptsForMonth(mockSupabase, userId, '2025-01')
  ).rejects.toThrow('Failed to fetch receipts: Connection failed');
});
```

### 4. Async/Await Testing
```typescript
it('powinien asynchronicznie pobierać dane', async () => {
  const mockSupabase = {
    from: () => ({
      select: () => ({
        eq: () => ({
          gte: () => ({
            lt: () => ({
              order: vi.fn().mockResolvedValue({
                data: MOCK_DATA,
                error: null,
              }),
            }),
          }),
        }),
      }),
    }),
  };

  const result = await getReceiptsForMonth(mockSupabase, userId, '2025-01');
  expect(result).toBeDefined();
});
```

---

## 🚀 Running & Debugging

### Uruchomienie testów
```bash
# Wszystkie testy
npm run test

# Konkretny plik
npm run test -- src/__tests__/unit/receiptService.test.ts

# Konkretny test
npm run test -- -t "powinien obsługiwać przejście roku"

# Watch mode
npm run test:watch

# UI mode
npm run test:ui

# Z pokryciem
npm run test:coverage
```

### Debugging
```bash
# Wyświetl szczegóły testu
npm run test -- --reporter=verbose

# Debuguj w Node Inspector
npm run test -- --inspect-brk

# Uruchom jeden test
npm run test -- -t "konkretny test".only
```

---

## ✅ Checklist Przed Committem

- [ ] Wszystkie testy przechodzą: `npm run test`
- [ ] Brak `test.only()` w kodzie
- [ ] Brak `console.log()` / `console.debug()`
- [ ] Descriptive nazwy testów
- [ ] AAA pattern (Arrange-Act-Assert)
- [ ] Mocks zamiast prawdziwych API calls
- [ ] Pokrycie ≥ 70% funkcji
- [ ] Error handling testowany
- [ ] Edge case'y testowane

---

## 📚 Zasoby

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/)
- [Example Tests](../src/__tests__/unit/receiptService.getReceiptsForMonth.test.ts)
- [Testing Best Practices](./test-plan-setup.md)

---

## 🎯 Następne Kroki

Po zapoznaniu się z tym guide:

1. **Przeczytaj** testy dla `getReceiptsForMonth()`
2. **Zaadaptuj** szablon do innej funkcji
3. **Napisz** testy dla `getReceiptById()`
4. **Rozszerz** na `createReceipt()`, `updateReceipt()`, `deleteReceipt()`
5. **Dodaj** testy dla `statsService`

---

**Zaproponowano:** 2025-10-17
**Autor:** Claude Code
**Wersja:** 1.0
