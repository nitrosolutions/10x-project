# API Endpoint Implementation Plan: GET /api/stats/monthly

## 1. Przegląd punktu końcowego
Celem tego punktu końcowego jest dostarczenie zagregowanych danych o wydatkach użytkownika w danym miesiącu. Dane będą pogrupowane według kategorii, co umożliwi wizualizację statystyk, np. w formie wykresu. Endpoint będzie dostępny tylko dla zalogowanych użytkowników.

## 2. Szczegóły żądania
- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/stats/monthly?month=YYYY-MM`
- **Parametry**:
  - **Wymagane**:
    - `month` (query param): Miesiąc i rok w formacie `YYYY-MM`, dla którego mają zostać obliczone statystyki.
  - **Opcjonalne**: Brak.
- **Request Body**: Brak.

## 3. Wykorzystywane typy
- **DTO (Data Transfer Object)**:
  - `StatsDto` z `src/types.ts` zostanie użyty do strukturyzacji odpowiedzi.
    ```typescript
    export interface StatsDto {
      month: string;
      totals: {
        category_id: number;
        amount: number;
      }[];
      grand_total: number;
    }
    ```

## 4. Szczegóły odpowiedzi
- **Odpowiedź sukcesu (200 OK)**:
  ```json
  {
    "month": "2025-10",
    "totals": [
      { "category_id": 1, "amount": 50.00 },
      { "category_id": 2, "amount": 150.00 }
    ],
    "grand_total": 200.00
  }
  ```
- **Odpowiedzi błędu**:
  - `400 Bad Request`: Gdy parametr `month` jest nieprawidłowy.
  - `401 Unauthorized`: Gdy użytkownik nie jest uwierzytelniony.
  - `500 Internal Server Error`: W przypadku problemów z serwerem lub bazą danych.

## 5. Przepływ danych
1. Użytkownik wysyła żądanie `GET` na adres `/api/stats/monthly` z parametrem `month`.
2. Middleware Astro (`src/middleware/index.ts`) przechwytuje żądanie, weryfikuje sesję użytkownika i udostępnia jego dane w `context.locals`. Jeśli sesja jest nieprawidłowa, zwraca `401`.
3. Handler endpointu (`src/pages/api/stats/monthly.ts`) parsuje i waliduje parametr `month` przy użyciu schemy Zod. W przypadku błędu walidacji zwraca `400`.
4. Handler wywołuje funkcję z serwisu `statsService` (np. `getMonthlyStats`), przekazując `supabaseClient`, `userId` oraz zwalidowany miesiąc.
5. `statsService` wykonuje zapytanie SQL do bazy danych Supabase, które:
   - Łączy tabele `receipts` i `receipt_items`.
   - Filtruje rekordy na podstawie `user_id` oraz daty (`purchase_date`) pasującej do podanego miesiąca i roku.
   - Grupuje wyniki po `category_id`.
   - Oblicza sumę `price` dla każdej kategorii oraz sumę całkowitą.
6. Serwis zwraca przetworzone dane do handlera.
7. Handler formatuje dane zgodnie z `StatsDto` i wysyła odpowiedź `200 OK` w formacie JSON.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Dostęp do endpointu musi być ograniczony tylko do zalogowanych użytkowników. Middleware Astro jest odpowiedzialne za weryfikację tokenu sesji.
- **Autoryzacja**: Wszystkie zapytania do bazy danych muszą być ściśle powiązane z `user_id` aktualnie zalogowanego użytkownika, aby zapobiec dostępowi do danych innych osób. Warunek `WHERE user_id = :userId` jest obowiązkowy.
- **Walidacja danych wejściowych**: Parametr `month` musi być walidowany, aby zapobiec błędom zapytań SQL i potencjalnym atakom (np. SQL Injection, chociaż Supabase SDK minimalizuje to ryzyko).

## 7. Obsługa błędów
- **Brak lub niepoprawny parametr `month`**: Zwróć `400 Bad Request` z komunikatem o błędzie.
- **Brak sesji użytkownika**: Middleware powinno zwrócić `401 Unauthorized`.
- **Błąd bazy danych**: Złap wyjątek z Supabase, zaloguj szczegóły błędu po stronie serwera i zwróć `500 Internal Server Error` z ogólnym komunikatem dla klienta.

## 8. Rozważania dotyczące wydajności
- Zapytanie do bazy danych jest kluczowe dla wydajności. Należy upewnić się, że na kolumnach `receipts.user_id` i `receipts.purchase_date` istnieją indeksy, aby przyspieszyć filtrowanie.
- Wolumen danych nie powinien być duży dla pojedynczego użytkownika, więc pojedyncze zapytanie agregujące jest optymalnym podejściem.

## 9. Etapy wdrożenia
1. **Utworzenie schemy walidacji Zod**:
   - W nowym pliku `src/lib/schemas/stats.schema.ts` zdefiniuj schemę do walidacji parametru `month`.
2. **Implementacja serwisu**:
   - Utwórz nowy plik `src/lib/services/statsService.ts`.
   - Dodaj funkcję `getMonthlyStats(supabase: SupabaseClient, userId: string, month: string)`, która będzie zawierać logikę zapytania do bazy danych.
   - Zaimplementuj zapytanie SQL lub użyj buildera z Supabase SDK do agregacji danych.
3. **Implementacja endpointu API**:
   - Utwórz plik `src/pages/api/stats/monthly.ts`.
   - Dodaj `export const prerender = false;`.
   - Zaimplementuj handler `GET`, który:
     - Pobiera `supabase` i `session` z `context.locals`.
     - Sprawdza, czy sesja istnieje.
     - Waliduje parametr `month` przy użyciu przygotowanej schemy Zod.
     - Wywołuje serwis `statsService.getMonthlyStats`.
     - Obsługuje potencjalne błędy i zwraca odpowiednie kody statusu.
     - Zwraca dane w formacie `StatsDto` z kodem `200 OK`.
4. **Testowanie**:
   - Przygotuj dane testowe w bazie danych (paragony z różnymi kategoriami i datami).
   - Wykonaj ręczne testy endpointu przy użyciu narzędzia typu cURL lub klienta API (np. Postman, Thunder Client w VS Code).
   - Przetestuj scenariusze sukcesu oraz przypadki błędów (brak parametru, zły format, brak autoryzacji).
