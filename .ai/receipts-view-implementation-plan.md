# Plan implementacji widoku Dashboard

## 1. Przegląd

Widok Dashboard (`/dashboard`) jest głównym ekranem aplikacji po zalogowaniu. Jego celem jest dostarczenie użytkownikowi szybkiego przeglądu wydatków z wybranego miesiąca. W tej fazie implementacji widok będzie składał się z listy wszystkich paragonów z danego okresu, posortowanej od najnowszych, oraz nawigacji pozwalającej na zmianę miesiąca.

## 2. Routing widoku

Widok będzie dostępny pod ścieżką `/dashboard`. Dostęp do tej ścieżki powinien być chroniony i wymagać uwierzytelnienia użytkownika.

## 3. Struktura komponentów

Struktura będzie oparta o stronę Astro renderującą jeden główny, interaktywny komponent React.

```
src/
├── pages/
│   └── dashboard.astro         # Plik strony Astro
└── components/
    └── dashboard/
        ├── DashboardView.tsx   # Główny komponent React (kontener)
        ├── MonthNavigator.tsx  # Komponent do nawigacji między miesiącami
        ├── ReceiptsList.tsx    # Komponent listy paragonów
        ├── ReceiptListItem.tsx # Pojedynczy element listy paragonów
        └── EmptyState.tsx      # Komponent dla stanu pustego (brak danych)
```

**Hierarchia:**

- `dashboard.astro`
  - `DashboardView.tsx` (z `client:load`)
    - `MonthNavigator.tsx`
    - `ReceiptsList.tsx` (renderowany warunkowo)
      - `ReceiptListItem.tsx` (mapowany)
    - `EmptyState.tsx` (renderowany warunkowo)

## 4. Szczegóły komponentów

### `DashboardView.tsx`

- **Opis komponentu:** Główny kontener widoku, odpowiedzialny za zarządzanie stanem, pobieranie danych z API oraz koordynację komponentów podrzędnych.
- **Główne elementy:** Wykorzystuje hook `useDashboard` do logiki. Warunkowo renderuje `ReceiptsList` (gdy są dane), `EmptyState` (gdy brak danych) lub komponent ładujący (gdy dane są pobierane).
- **Obsługiwane interakcje:** Przekazuje funkcje do zmiany miesiąca do `MonthNavigator`.
- **Obsługiwana walidacja:** Oblicza, czy przycisk "następny miesiąc" powinien być zablokowany.
- **Typy:** `ReceiptListDto`.
- **Propsy:** Brak.

### `MonthNavigator.tsx`

- **Opis komponentu:** Wyświetla nagłówek z nazwą aktualnie wybranego miesiąca oraz przyciski do nawigacji w przód i w tył.
- **Główne elementy:** `div` zawierający `h2` z nazwą miesiąca oraz dwa komponenty `Button` (z biblioteki Shadcn/ui) dla nawigacji.
- **Obsługiwane interakcje:** Kliknięcie przycisków nawigacyjnych.
- **Obsługiwana walidacja:** Przycisk "następny miesiąc" jest nieaktywny (`disabled`), jeśli nawigacja w przyszłość jest zablokowana.
- **Typy:** Brak.
- **Propsy:**
  - `currentMonth: Date`
  - `onPreviousMonth: () => void`
  - `onNextMonth: () => void`
  - `isNextDisabled: boolean`

### `ReceiptsList.tsx`

- **Opis komponentu:** Renderuje listę paragonów dla wybranego miesiąca.
- **Główne elementy:** `ul` lub `div` w którym mapowane są paragony do komponentów `ReceiptListItem`.
- **Obsługiwane interakcje:** Kliknięcie w element listy (przekierowanie do szczegółów paragonu).
- **Obsługiwana walidacja:** Brak.
- **Typy:** `ReceiptListDto`.
- **Propsy:**
  - `receipts: ReceiptListDto[]`

## 5. Typy

### Typy DTO (z API)

- **`ReceiptListDto`**: Uproszczony obiekt paragonu na potrzeby listy.
  ```typescript
  // Zgodny z src/types.ts
  type ReceiptListDto = {
    id: string;
    purchase_date: string;
    store_name: string | null;
    total_amount: number;
  };
  ```

## 6. Zarządzanie stanem

Cała logika biznesowa i zarządzanie stanem widoku zostanie zamknięta w niestandardowym hooku `useDashboard`, który zostanie umieszczony w `src/components/hooks/useDashboard.ts`.

**Hook `useDashboard` będzie zarządzał:**

- `currentMonth: Date`: Aktualnie wybrany miesiąc, inicjalizowany bieżącą datą.
- `receipts: ReceiptListDto[]`: Lista paragonów pobrana z API.
- `isLoading: boolean`: Flaga informująca o stanie ładowania danych.
- `error: string | null`: Komunikat błędu w przypadku niepowodzenia.

**Hook będzie eksportował:**

- Wszystkie powyższe stany.
- Funkcje `handlePreviousMonth` i `handleNextMonth` do modyfikacji `currentMonth`.

`useEffect` wewnątrz hooka będzie reagował na zmianę `currentMonth` i uruchamiał pobieranie nowej listy paragonów.

## 7. Integracja API

Widok będzie korzystał z jednego punktu końcowego API:

1.  **`GET /api/receipts?month=YYYY-MM`**
    - **Cel:** Pobranie listy paragonów dla danego miesiąca.
    - **Typ odpowiedzi:** `ReceiptListDto[]`

Zapytanie będzie wykonywane z poziomu hooka `useDashboard` po każdej zmianie miesiąca.

## 8. Interakcje użytkownika

- **Ładowanie widoku:** Użytkownik wchodzi na `/dashboard`. Wyświetlany jest wskaźnik ładowania. Hook `useDashboard` pobiera dane dla bieżącego miesiąca. Po załadowaniu danych, wskaźnik znika i pojawia się lista paragonów.
- **Zmiana miesiąca:** Użytkownik klika przycisk `<` lub `>`. Wywoływana jest funkcja `handlePreviousMonth` lub `handleNextMonth`. Stan `currentMonth` się zmienia, co powoduje ponowne pobranie danych dla nowego miesiąca i aktualizację UI.
- **Przejście do szczegółów:** Użytkownik klika element na liście paragonów. Następuje przekierowanie na stronę szczegółów danego paragonu (np. `/receipts/{id}`).

## 9. Warunki i walidacja

- **Warunek:** Nawigacja do przyszłych miesięcy jest niemożliwa.
- **Walidacja:** W komponencie `DashboardView` logika porównuje `currentMonth` z aktualną datą systemową. Jeśli `currentMonth` jest równy lub późniejszy niż bieżący miesiąc, prop `isNextDisabled` przekazywany do `MonthNavigator` jest ustawiany na `true`, co blokuje przycisk nawigacji w przód.
- **Warunek:** Parametr `month` w zapytaniu API musi mieć format `YYYY-MM`.
- **Walidacja:** Hook `useDashboard` jest odpowiedzialny za poprawne sformatowanie obiektu `Date` do wymaganego stringa przed wykonaniem zapytania.

## 10. Obsługa błędów

- **Błąd API:** Jeśli zapytanie do API zakończy się niepowodzeniem, hook `useDashboard` ustawi stan `error` na odpowiedni komunikat. Komponent `DashboardView` wyświetli ten komunikat zamiast danych, informując użytkownika o problemie (np. "Nie udało się załadować danych. Spróbuj ponownie później.").
- **Brak danych:** Jeśli API zwróci pustą tablicę paragonów (miesiąc bez wydatków), komponent `DashboardView` wykryje ten stan (`receipts.length === 0`) i zamiast listy, wyrenderuje komponent `EmptyState` z informacją i zachętą do dodania pierwszego paragonu.

## 11. Kroki implementacji

1.  **Struktura plików:** Utworzenie struktury folderów i plików zgodnie z sekcją 3.
2.  **Hook `useDashboard`:** Implementacja logiki zarządzania stanem i komunikacji z API w `src/components/hooks/useDashboard.ts`.
3.  **Komponenty UI:** Stworzenie komponentów `MonthNavigator`, `ReceiptsList`, `ReceiptListItem` i `EmptyState`.
4.  **Główny komponent `DashboardView`:** Zintegrowanie hooka `useDashboard` z komponentami UI. Przekazanie stanów i funkcji jako propsy. Implementacja logiki warunkowego renderowania (ładowanie, błąd, stan pusty, stan z danymi).
5.  **Strona Astro:** Utworzenie pliku `src/pages/dashboard.astro`, który zaimportuje i wyrenderuje `DashboardView.tsx` z dyrektywą `client:load`.
6.  **Stylowanie:** Ostylowanie wszystkich komponentów przy użyciu Tailwind CSS i komponentów Shadcn/ui.
7.  **Testowanie:** Ręczne przetestowanie wszystkich interakcji użytkownika, obsługi błędów i przypadków brzegowych (np. miesiąc z danymi i bez danych).
