# API Endpoint Implementation Plan: List Receipts (Simplified)

## 1. Przegląd punktu końcowego
Celem tego punktu końcowego jest dostarczenie uproszczonej listy paragonów dla uwierzytelnionego użytkownika za określony miesiąc. Odpowiedź będzie zawierać tylko podstawowe dane paragonów (bez pozycji), posortowane malejąco według daty zakupu.

## 2. Szczegóły żądania
- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/receipts`
- **Parametry**:
  - **Wymagane**:
    - `month` (Query Parameter): Miesiąc, dla którego mają być pobrane paragony. Musi być w formacie `YYYY-MM`.
- **Request Body**: Brak.

## 3. Wykorzystywane typy
- `ReceiptListDto` (`src/types.ts`): Nowy, uproszczony DTO dla paragonu na liście, bez zagnieżdżonych pozycji. Będzie to alias typu dla `Omit<Database["public"]["Tables"]["receipts"]["Row"], "user_id" | "source">`.

## 4. Szczegóły odpowiedzi
- **Sukces (200 OK)**:
  - `Content-Type: application/json`
  - **Body**: Tablica obiektów `ReceiptListDto`.
    ```json
    [
      {
        "id": "uuid-goes-here",
        "purchase_date": "2025-10-14",
        "store_name": "Example Store",
        "total_amount": "150.75"
      },
      {
        "id": "another-uuid",
        "purchase_date": "2025-10-11",
        "store_name": "Another Store",
        "total_amount": "80.00"
      }
    ]
    ```
- **Błąd**:
  - `Content-Type: application/json`
  - **Body**: `{"error": "Komunikat o błędzie"}`

## 5. Przepływ danych
1.  Klient wysyła żądanie `GET` na adres `/api/receipts?month=YYYY-MM`.
2.  Middleware Astro weryfikuje sesję użytkownika.
3.  Handler trasy API w `src/pages/api/receipts.ts` waliduje parametr `month` przy użyciu Zod.
4.  Handler wywołuje funkcję serwisową `receiptService.getReceiptsForMonth(supabase, user.id, month)`.
5.  Funkcja serwisowa w `src/lib/services/receiptService.ts` wykonuje zapytanie do Supabase, aby pobrać paragony (`receipts`). Zapytanie będzie:
    - Filtrować paragony na podstawie `user_id`.
    - Filtrować paragony, gdzie `purchase_date` mieści się w podanym miesiącu (przy użyciu obliczonego zakresu dat dla optymalnego wykorzystania indeksu).
    - Sortować wyniki malejąco według `purchase_date`.
6.  Serwis zwraca listę paragonów do handlera.
7.  Handler API zwraca dane jako odpowiedź JSON ze statusem `200 OK`.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Dostęp jest chroniony i wymaga aktywnej sesji użytkownika.
- **Autoryzacja**: Supabase Row Level Security (RLS) zapewnia, że użytkownicy mogą pobierać tylko własne paragony.
- **Walidacja danych wejściowych**: Parametr `month` jest walidowany, aby zapobiec błędom i atakom.

## 7. Obsługa błędów
- **`400 Bad Request`**: Nieprawidłowy lub brakujący parametr `month`.
- **`401 Unauthorized`**: Użytkownik nie jest uwierzytelniony.
- **`500 Internal Server Error`**: Błąd po stronie serwera, np. problem z bazą danych.

## 8. Rozważania dotyczące wydajności
- **Indeksowanie bazy danych**: Zapytanie wykorzysta istniejący indeks `idx_receipts_user_purchase` na kolumnach `(user_id, purchase_date)`, co jest kluczowe dla wydajności.
- **Filtrowanie po stronie bazy danych**: Użycie zakresu dat (`>=` i `<`) jest bardziej wydajne niż używanie funkcji na kolumnie daty, ponieważ pozwala na pełne wykorzystanie indeksu.

## 9. Etapy wdrożenia
1.  **Aktualizacja typów**: W pliku `src/types.ts` dodaj nowy typ `ReceiptListDto`.
2.  **Utworzenie serwisu**: Stwórz plik `src/lib/services/receiptService.ts` z funkcją `getReceiptsForMonth`, która będzie zawierać logikę pobierania danych z Supabase.
3.  **Implementacja trasy API**: Stwórz plik `src/pages/api/receipts.ts` z handlerem `GET`, który będzie walidował dane wejściowe, wywoływał serwis i zwracał odpowiedź.