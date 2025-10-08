# API Endpoint Implementation Plan: Create Receipt (Manual)

## 1. Przegląd punktu końcowego

Endpoint `POST /api/receipts` umożliwia użytkownikom ręczne utworzenie nowego paragonu w systemie. Paragon zawiera podstawowe informacje (data zakupu, opcjonalnie nazwa sklepu) oraz opcjonalną listę pozycji zakupowych z cenami i przypisanymi kategoriami. Pole `source` jest automatycznie ustawiane na wartość "manual" w warstwie serwisu, a `total_amount` jest automatycznie obliczane przez trigger bazodanowy po wstawieniu/aktualizacji pozycji paragonu. Endpoint wymaga uwierzytelnienia użytkownika.

## 2. Szczegóły żądania

- **Metoda HTTP**: POST
- **Struktura URL**: `/api/receipts`
- **Content-Type**: `application/json`
- **Uwierzytelnianie**: Wymagany token Supabase Auth (przekazywany przez cookies/headers)

### Parametry

#### Wymagane:

- `purchase_date` (string) - Data zakupu w formacie ISO 8601 (YYYY-MM-DD)

#### Opcjonalne:

- `store_name` (string) - Nazwa sklepu
- `items` (array) - Tablica pozycji paragonu (może być pusta), każda zawiera:
  - `product_name` (string) - Nazwa produktu
  - `price` (number) - Cena produktu (positive, max 2 miejsca po przecinku)
  - `category_id` (number) - ID kategorii (musi istnieć w tabeli `categories`)

### Request Body Example:

```json
{
  "purchase_date": "2025-10-01",
  "store_name": "Optional Store",
  "items": [
    {
      "product_name": "Bread",
      "price": 2.0,
      "category_id": 1
    }
  ]
}
```

## 3. Wykorzystywane typy

Z pliku [src/types.ts](src/types.ts):

### Command Models (Input):

- **CreateReceiptCommand** - struktura żądania dla POST /api/receipts
- **ReceiptItemCommand** - struktura dla każdej pozycji w tablicy items

### DTOs (Output):

- **ReceiptDto** - struktura odpowiedzi zawierająca paragon bez pól wewnętrznych (user_id, source)
- **ReceiptItemDto** - struktura dla pozycji paragonu w odpowiedzi

### Database Types:

- **Database["public"]["Tables"]["receipts"]["Insert"]** - typ dla insercji do tabeli receipts
- **Database["public"]["Tables"]["receipt_items"]["Insert"]** - typ dla insercji do tabeli receipt_items

## 4. Szczegóły odpowiedzi

### Success Response (201 Created):

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "purchase_date": "2025-10-01",
  "store_name": "Optional Store",
  "total_amount": 2.0,
  "items": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "product_name": "Bread",
      "price": 2.0,
      "category_id": 1
    }
  ]
}
```

### Error Responses:

**400 Bad Request** - Błędy walidacji:

```json
{
  "error": "Validation error",
  "details": ["purchase_date is required", "items array cannot be empty"]
}
```

**401 Unauthorized** - Brak autoryzacji:

```json
{
  "error": "Unauthorized"
}
```

**500 Internal Server Error** - Błąd serwera:

```json
{
  "error": "Internal server error"
}
```

## 5. Przepływ danych

### Krok 1: Walidacja wejścia (API Route)

1. Użytkownik wysyła żądanie POST z danymi paragonu
2. API route w [src/pages/api/receipts/index.ts](src/pages/api/receipts/index.ts) waliduje dane z użyciem schematu Zod
3. Weryfikacja tokenu uwierzytelniającego i pobranie `user_id` z `context.locals.supabase`

### Krok 2: Przetwarzanie (Service Layer)

4. Wywołanie service `createReceipt` z [src/lib/services/receipt.service.ts](src/lib/services/receipt.service.ts)
5. Service ustawia `source: "manual"`
6. Rozpoczęcie transakcji bazodanowej w Supabase

### Krok 3: Zapis do bazy danych

7. Wstawienie rekordu do tabeli `receipts` z polami:
   - `user_id` (z sesji)
   - `purchase_date`
   - `store_name` (opcjonalne)
   - `total_amount: 0` (wartość domyślna)
   - `source: "manual"` (ustawione w serwisie)
8. Pobranie wygenerowanego `receipt.id`
9. Wstawienie wszystkich pozycji do tabeli `receipt_items` z `receipt_id` (jeśli items nie jest pusta)
10. **Trigger bazodanowy automatycznie aktualizuje `receipts.total_amount`** po wstawieniu items
11. Zacommitowanie transakcji

### Krok 4: Zwrócenie odpowiedzi

12. Pobranie pełnego paragonu z items z bazy danych
13. Transformacja do formatu `ReceiptDto`
14. Zwrócenie odpowiedzi 201 Created z danymi paragonu

### Diagram przepływu:

```
Request → API Route → Zod Validation → Auth Check → Service Layer
                ↓
         Set source: "manual"
                ↓
         DB Transaction Start
                ↓
         Insert Receipt (total_amount=0) → Get receipt_id → Insert Items (if any)
                ↓
         [DB Trigger auto-updates total_amount] → Commit
                ↓
         Fetch Full Receipt with calculated total_amount
                ↓
         Transform to DTO → Return 201
```

## 6. Względy bezpieczeństwa

### Uwierzytelnianie

- Weryfikacja tokenu Supabase Auth przed przetworzeniem żądania
- Użycie middleware Astro do sprawdzenia `context.locals.supabase.auth.getUser()`
- Zwrócenie 401 Unauthorized jeśli użytkownik nie jest zalogowany

### Autoryzacja

- `user_id` MUSI być brany z sesji użytkownika (`context.locals.supabase.auth.getUser()`)
- NIGDY nie przyjmować `user_id` z request body (zapobieganie tworzeniu paragonów dla innych użytkowników)
- Supabase RLS policies powinny dodatkowo zabezpieczać dostęp do danych

### Walidacja danych wejściowych

**Schema Zod** powinna zawierać:

- `purchase_date`:
  - String w formacie ISO 8601
  - Nie może być w przyszłości
  - Nie może być starszy niż np. 10 lat
- `store_name`:
  - Opcjonalny string
  - Max długość: 255 znaków
  - Trim whitespace
  - Sanityzacja znaków specjalnych
- `items`:
  - Tablica opcjonalna (może być pusta lub nieobecna)
  - Max długość: 100 elementów (zapobieganie DOS)
  - Każdy item:
    - `product_name`: niepusty string, max 255 znaków, trim
    - `price`: dodatnia liczba, min 0.01, max 999999.99
    - `category_id`: dodatnia liczba całkowita

### Sprawdzanie integralności danych

- Weryfikacja czy wszystkie `category_id` istnieją w tabeli `categories` (query przed insert)
- Zapobieganie foreign key constraint errors

### Zabezpieczenie przed atakami

- **SQL Injection**: Automatycznie zabezpieczone przez Supabase SDK
- **XSS**: Sanityzacja stringów (product_name, store_name)
- **DOS**: Limit liczby items (max 100)
- **Overflow**: Walidacja maksymalnych wartości dla price i total_amount

### Rate Limiting

- Rozważenie implementacji rate limiting na poziomie API (np. max 10 żądań/minutę na użytkownika)

## 7. Obsługa błędów

### 400 Bad Request - Błędy walidacji

**Scenariusze**:

1. Brak wymaganych pól (`purchase_date`)
2. Nieprawidłowy format `purchase_date`
3. Data w przyszłości
4. Nieprawidłowe wartości:
   - Ujemne lub zerowe ceny w items
   - Zbyt długie stringi (>255 znaków)
   - Nieprawidłowy typ danych
5. `category_id` nie istnieje w bazie danych
6. Zbyt duża tablica items (>100 elementów)

**Obsługa**:

- Złapanie błędów walidacji Zod
- Zwrócenie szczegółowych komunikatów błędów
- Format odpowiedzi: `{ error: "Validation error", details: [...] }`

### 401 Unauthorized - Błędy autoryzacji

**Scenariusze**:

1. Brak tokenu autoryzacyjnego
2. Nieprawidłowy token
3. Wygasły token
4. Token dla nieaktywnego użytkownika

**Obsługa**:

- Sprawdzenie `context.locals.supabase.auth.getUser()`
- Zwrócenie `{ error: "Unauthorized" }`
- Brak szczegółów błędu (bezpieczeństwo)

### 500 Internal Server Error - Błędy serwera

**Scenariusze**:

1. Błąd połączenia z bazą danych
2. Błąd transakcji (rollback)
3. Niespodziewane błędy aplikacji
4. Przekroczenie limitów bazy danych

**Obsługa**:

- Try-catch w service i API route
- Logowanie szczegółów błędu do console.error (z request ID)
- Rollback transakcji w przypadku błędu
- Zwrócenie ogólnego komunikatu: `{ error: "Internal server error" }`
- NIE zwracanie szczegółów błędów wewnętrznych użytkownikowi

### Logowanie błędów

```typescript
// Przykład logowania
console.error("[POST /api/receipts]", {
  error: err,
  userId: user?.id,
  timestamp: new Date().toISOString(),
  requestBody: safeRequestBody, // bez wrażliwych danych
});
```

## 8. Rozważania dotyczące wydajności

### Optymalizacja zapytań bazodanowych

- **Transakcja**: Użycie pojedynczej transakcji dla insert receipt + items (atomowość i wydajność)
- **Batch insert**: Wstawienie wszystkich items jednym zapytaniem (zamiast pętli)
- **Indeksy**: Upewnienie się, że `receipts.user_id` i `receipt_items.category_id` mają indeksy (foreign keys)

### Walidacja category_id

- Opcja 1: Single query pobierający wszystkie category_id z bazy i sprawdzenie w pamięci
- Opcja 2: Pozwolić bazie danych zwrócić foreign key constraint error i obsłużyć go
- **Rekomendacja**: Opcja 2 jest wydajniejsza (mniej zapytań)

### Kalkulacja total_amount

- **Automatyczne obliczanie przez trigger bazodanowy** po INSERT/UPDATE/DELETE na `receipt_items`
- Trigger zapewnia spójność danych i eliminuje ryzyko błędów zaokrągleń
- Brak potrzeby ręcznych zapytań UPDATE z poziomu aplikacji
- Trigger wykorzystuje natywne możliwości Postgres dla operacji numerycznych z `SUM()` i `COALESCE()`

### Caching

- Brak cachingu dla POST endpoints (każde żądanie tworzy nowy zasób)
- Możliwość cache'owania listy categories (jeśli używamy opcji 1 walidacji)

### Limity

- Max 100 items na paragon (zapobieganie długim transakcjom)
- Timeout dla transakcji bazodanowej (np. 5 sekund)

### Potencjalne wąskie gardła

1. **Duża liczba items**: Może wydłużyć czas transakcji
   - Mitygacja: Limit 100 items
2. **Concurrent inserts**: Wiele użytkowników tworzących paragony jednocześnie
   - Mitygacja: Supabase/Postgres radzi sobie dobrze z concurrent writes
3. **Walidacja category_id**: Dodatkowe query
   - Mitygacja: Poleganie na foreign key constraint

## 9. Etapy wdrożenia

### Krok 1: Przygotowanie schematu walidacji Zod

**Plik**: [src/lib/schemas/receipt.schema.ts](src/lib/schemas/receipt.schema.ts) (nowy)

- Utworzenie schema `CreateReceiptSchema` bazując na `CreateReceiptCommand`
- Walidacja:
  - `purchase_date`: `z.string().date()` + custom validator (nie w przyszłości)
  - `store_name`: `z.string().max(255).trim().optional()`
  - `items`: `z.array().max(100).optional()` (może być pusta lub nieobecna)
    - `product_name`: `z.string().min(1).max(255).trim()`
    - `price`: `z.number().positive().max(999999.99).multipleOf(0.01)`
    - `category_id`: `z.number().int().positive()`

### Krok 2: Utworzenie Receipt Service

**Plik**: [src/lib/services/receipt.service.ts](src/lib/services/receipt.service.ts) (nowy)

Funkcje:

- `createReceipt(supabase: SupabaseClient, userId: string, data: CreateReceiptCommand): Promise<ReceiptDto>`
  - Ustawienie `source: "manual"` w danych paragonu
  - Rozpoczęcie transakcji
  - Insert do `receipts` z `total_amount: 0`
  - Batch insert do `receipt_items` (jeśli items nie jest pusta)
  - Trigger bazodanowy automatycznie zaktualizuje `total_amount`
  - Commit transakcji
  - Pobranie i zwrócenie pełnego paragonu z items (z zaktualizowanym `total_amount`)
  - Obsługa błędów i rollback

### Krok 3: Implementacja API Route

**Plik**: [src/pages/api/receipts/index.ts](src/pages/api/receipts/index.ts) (nowy)

```typescript
export const prerender = false;

export async function POST(context: APIContext) {
  // 1. Sprawdzenie autoryzacji
  // 2. Walidacja body z Zod schema
  // 3. Wywołanie receipt.service.createReceipt()
  // 4. Zwrócenie Response 201 z ReceiptDto
  // 5. Obsługa błędów (400, 401, 500)
}
```

### Krok 4: Testy jednostkowe

**Plik**: [src/lib/services/receipt.service.test.ts](src/lib/services/receipt.service.test.ts) (opcjonalny)

Test cases:

- Pomyślne utworzenie paragonu z jednym item
- Pomyślne utworzenie paragonu z wieloma items
- Pomyślne utworzenie paragonu bez items (pusta tablica)
- Weryfikacja że `source` jest ustawiony na "manual"
- Weryfikacja że `total_amount` jest automatycznie obliczony przez trigger bazodanowy
- Błąd dla nieprawidłowego `category_id`
- Rollback transakcji przy błędzie

### Krok 5: Testy integracyjne API

**Plik**: [tests/api/receipts.test.ts](tests/api/receipts.test.ts) (opcjonalny)

Test cases:

- 201 Created dla prawidłowego requestu
- 400 Bad Request dla nieprawidłowych danych
- 401 Unauthorized dla niezalogowanego użytkownika
- Weryfikacja struktury odpowiedzi

### Krok 6: Dokumentacja

- Aktualizacja [.ai/api-plan.md](.ai/api-plan.md) (dodanie informacji o implementacji)
- Dodanie przykładów użycia w komentarzach JSDoc

### Krok 7: Code Review

- Przegląd kodu pod kątem bezpieczeństwa
- Sprawdzenie zgodności z guidelines ([.ai/rules/shared.md](.ai/rules/shared.md), [.ai/rules/backend.md](.ai/rules/backend.md), [.ai/rules/astro.md](.ai/rules/astro.md))
- Weryfikacja obsługi błędów i edge cases

### Krok 8: Testing w środowisku deweloperskim

- Manualne testy z różnymi scenariuszami
- Testy wydajnościowe (100 items)
- Weryfikacja działania RLS policies w Supabase

### Krok 9: Deployment

- Merge do głównej gałęzi
- Deploy przez Azure Static Web Apps + GitHub Actions
- Weryfikacja w środowisku produkcyjnym
