# Plan implementacji widoku: Ręczne Dodawanie Paragonu

## 1. Przegląd

Celem tego widoku jest umożliwienie użytkownikom ręcznego dodawania nowego paragonu do systemu. Widok będzie zawierał formularz z polami na datę zakupu, opcjonalną nazwę sklepu oraz dynamiczną listę pozycji paragonu. Formularz będzie walidowany w czasie rzeczywistym i po pomyślnym zapisie przekieruje użytkownika z powrotem do głównego widoku.

## 2. Routing widoku

Widok będzie dostępny pod następującą ścieżką:

- `/receipts/new`

Plik strony zostanie utworzony w lokalizacji `src/pages/receipts/new.astro`.

## 3. Struktura komponentów

Hierarchia komponentów będzie zorganizowana w następujący sposób, z wykorzystaniem komponentów Astro dla struktury strony i React dla interaktywnego formularza.

```
src/pages/receipts/new.astro
└── src/layouts/MainLayout.astro
    └── src/components/receipts/ReceiptForm.tsx (client:load)
        ├── Form (z react-hook-form & Shadcn/ui)
        │   ├── DatePicker (dla daty zakupu)
        │   ├── Input (dla nazwy sklepu)
        │   ├── Wyświetlanie sumy całkowitej
        │   ├── ReceiptItemRow.tsx[] (mapowanie po liście pozycji)
        │   │   ├── Input (dla nazwy produktu)
        │   │   ├── Input (dla ceny)
        │   │   ├── Select (dla kategorii)
        │   │   └── Button (do usunięcia pozycji)
        │   ├── Button ("+ Dodaj pozycję")
        │   └── Button ("Zapisz")
        └── Toaster (do wyświetlania powiadomień)
```

## 4. Szczegóły komponentów

### `ReceiptForm.tsx`

- **Opis komponentu:** Główny komponent React, który zarządza całym stanem formularza, logiką walidacji oraz komunikacją z API. Będzie wykorzystywał bibliotekę `react-hook-form` do zarządzania stanem i walidacją.
- **Główne elementy:** Komponent `<Form>` z Shadcn/ui, `DatePicker` do wyboru daty, `Input` dla nazwy sklepu, dynamicznie renderowana lista komponentów `ReceiptItemRow`, przyciski do dodawania pozycji i zapisu formularza.
- **Obsługiwane interakcje:**
  - Zmiana daty zakupu.
  - Wprowadzanie nazwy sklepu.
  - Dodawanie nowej pozycji do paragonu.
  - Usuwanie istniejącej pozycji.
  - Wysłanie formularza.
- **Obsługiwana walidacja:**
  - Data zakupu nie może być z przyszłości.
  - Musi istnieć co najmniej jedna pozycja na paragonie.
- **Typy:** `ReceiptViewModel`, `Category[]`.
- **Propsy:**
  - `categories: Category[]`: Lista dostępnych kategorii do wyboru, przekazana z komponentu Astro.

### `ReceiptItemRow.tsx`

- **Opis komponentu:** Komponent reprezentujący pojedynczy wiersz pozycji na paragonie. Zawiera pola do wpisania nazwy produktu, ceny, wyboru kategorii oraz przycisk do usunięcia wiersza.
- **Główne elementy:** Trzy pola formularza (`Input` dla nazwy, `Input` dla ceny, `Select` dla kategorii) oraz `Button` z ikoną kosza.
- **Obsługiwane interakcje:**
  - Aktualizacja wartości pól (nazwa, cena, kategoria).
  - Wywołanie funkcji usuwającej pozycję z listy.
- **Obsługiwana walidacja:**
  - Nazwa produktu jest wymagana (nie może być pusta).
  - Cena jest wymagana i musi być liczbą dodatnią.
  - Kategoria musi być wybrana.
- **Typy:** `Category[]`.
- **Propsy:**
  - `index: number`: Indeks pozycji w tablicy formularza.
  - `control: Control`: Obiekt `control` z `react-hook-form`.
  - `remove: (index: number) => void`: Funkcja do usunięcia pozycji.
  - `categories: Category[]`: Lista dostępnych kategorii.

## 5. Typy

Do implementacji widoku wymagane będą następujące typy.

- **DTO (Data Transfer Object) - do komunikacji z API:**

  ```typescript
  // DTO dla pojedynczej pozycji wysyłanej do API
  interface ReceiptItemCreateDto {
    product_name: string;
    price: number;
    category_id: number; // lub string, w zależności od typu ID
  }

  // DTO dla całego paragonu wysyłanego do API
  interface ReceiptCreateDto {
    purchase_date: string; // Format: "YYYY-MM-DD"
    store_name?: string;
    items: ReceiptItemCreateDto[];
  }
  ```

- **ViewModel - do zarządzania stanem w UI:**

  ```typescript
  // ViewModel dla pojedynczej pozycji w formularzu
  interface ReceiptItemViewModel {
    id: string; // Unikalne ID po stronie klienta do renderowania listy
    product_name: string;
    price: string; // Przechowywane jako string dla pola input
    category_id?: number;
  }

  // ViewModel dla całego formularza
  interface ReceiptViewModel {
    purchase_date: Date;
    store_name: string;
    items: ReceiptItemViewModel[];
  }
  ```

- **Typy encji:**
  ```typescript
  // Typ dla kategorii
  interface Category {
    id: number; // lub string
    name: string;
  }
  ```

## 6. Zarządzanie stanem

Zarządzanie stanem formularza zostanie zrealizowane przy użyciu biblioteki `react-hook-form` w połączeniu z `zod` do walidacji.

- **`useForm`:** Główny hook do inicjalizacji formularza, rejestracji pól, obsługi walidacji i procesu wysyłania danych.
- **`useFieldArray`:** Hook z `react-hook-form` do zarządzania dynamiczną listą pozycji paragonu (dodawanie, usuwanie, aktualizacja).
- **`zod`:** Biblioteka do definiowania schematu walidacji, który będzie używany przez `react-hook-form` do sprawdzania poprawności danych w czasie rzeczywistym i przed wysłaniem.
- **Stan ładowania:** Prosty stan `isLoading` (boolean) będzie zarządzany w komponencie `ReceiptForm` do obsługi interfejsu podczas komunikacji z API.

Nie przewiduje się potrzeby tworzenia złożonego, niestandardowego hooka, ponieważ `react-hook-form` dostarcza wszystkie niezbędne narzędzia.

## 7. Integracja API

Integracja z backendem będzie polegała na wysłaniu żądania `POST` na endpoint `/api/receipts`.

- **Endpoint:** `POST /api/receipts`
- **Akcja:** Wywoływana po kliknięciu przycisku "Zapisz" i pomyślnej walidacji formularza.
- **Typ żądania (Request Body):** `ReceiptCreateDto`
- **Obsługa odpowiedzi:**
  - **`201 Created`:** Użytkownik jest informowany o sukcesie (np. za pomocą komponentu Toast) i przekierowywany do widoku miesięcznego.
  - **`400 Bad Request` / `500 Internal Server Error`:** Użytkownikowi wyświetlany jest komunikat o błędzie "Nie udało się zapisać. Spróbuj ponownie.".

Przed wysłaniem, dane z `ReceiptViewModel` zostaną przekształcone do formatu `ReceiptCreateDto` (np. konwersja `Date` na string, parsowanie ceny ze stringa na liczbę).

## 8. Interakcje użytkownika

- **Dodawanie pozycji:** Kliknięcie przycisku "+ Dodaj pozycję" powoduje dodanie nowego, pustego wiersza `ReceiptItemRow` na końcu listy.
- **Usuwanie pozycji:** Kliknięcie ikony kosza w danym wierszu usuwa tę pozycję z formularza.
- **Wypełnianie formularza:** Użytkownik wprowadza dane w polach. Walidacja jest uruchamiana przy zmianie wartości (`onChange`) lub utracie fokusu (`onBlur`).
- **Zapisywanie paragonu:** Kliknięcie przycisku "Zapisz" (aktywnego tylko gdy formularz jest poprawny) uruchamia proces wysyłania danych do API. W trakcie zapisu przycisk jest nieaktywny, a interfejs wskazuje stan ładowania.

## 9. Warunki i walidacja

Walidacja będzie zaimplementowana za pomocą schematu `zod` i `react-hook-form`.

- **Data zakupu:** Musi być datą z przeszłości lub datą dzisiejszą. Komunikat o błędzie pojawi się, jeśli użytkownik wybierze przyszłą datę.
- **Lista pozycji:** Musi zawierać co najmniej jeden element. Przycisk "Zapisz" będzie nieaktywny, jeśli lista jest pusta.
- **Nazwa produktu:** Pole wymagane, nie może być puste.
- **Cena:** Pole wymagane, musi być wartością numeryczną większą od zera.
- **Kategoria:** Pole wymagane, użytkownik musi wybrać jedną z dostępnych opcji.

Przycisk "Zapisz" będzie w stanie `disabled` dopóki wszystkie powyższe warunki nie zostaną spełnione.

## 10. Obsługa błędów

- **Błędy walidacji:** Komunikaty o błędach będą wyświetlane bezpośrednio pod odpowiednimi polami formularza.
- **Błędy API (np. 4xx, 5xx):** Po nieudanej próbie zapisu zostanie wyświetlony globalny komunikat (Toast) z informacją: "Nie udało się zapisać. Spróbuj ponownie.". Formularz pozostanie w edytowalnym stanie, umożliwiając użytkownikowi ponowną próbę.
- **Błąd ładowania kategorii:** Jeśli pobranie listy kategorii nie powiedzie się, formularz zostanie zablokowany, a użytkownik zobaczy komunikat o błędzie uniemożliwiającym dodanie paragonu.

## 11. Kroki implementacji

1.  **Utworzenie pliku strony:** Stworzenie pliku `src/pages/receipts/new.astro`, który będzie renderował główny layout i komponent `ReceiptForm`.
2.  **Pobranie danych początkowych:** W pliku `.astro` zaimplementować logikę pobierania listy kategorii z API i przekazania jej jako props do komponentu React.
3.  **Struktura komponentu `ReceiptForm`:** Zbudowanie szkieletu komponentu `ReceiptForm.tsx`, w tym inicjalizacja `react-hook-form` i `zod` dla schematu walidacji.
4.  **Implementacja pól formularza:** Dodanie komponentów Shadcn/ui (`DatePicker`, `Input`) dla daty zakupu i nazwy sklepu, integrując je z `react-hook-form`.
5.  **Implementacja `ReceiptItemRow`:** Stworzenie komponentu `ReceiptItemRow.tsx` z polami dla nazwy produktu, ceny i kategorii.
6.  **Dynamiczna lista pozycji:** W `ReceiptForm.tsx` użyć hooka `useFieldArray` do renderowania listy komponentów `ReceiptItemRow` oraz zaimplementować funkcje dodawania (`append`) i usuwania (`remove`) pozycji.
7.  **Logika walidacji:** Zdefiniowanie kompletnego schematu walidacji w `zod`, obejmującego wszystkie wymagania z historyjek użytkownika.
8.  **Obliczanie sumy:** Zaimplementować logikę, która na bieżąco oblicza i wyświetla sumę cen wszystkich pozycji.
9.  **Obsługa wysyłania danych:** Stworzenie funkcji `onSubmit`, która transformuje dane z formularza do formatu DTO, wysyła żądanie `POST` do `/api/receipts` i obsługuje stany ładowania.
10. **Obsługa odpowiedzi i błędów:** Zaimplementować logikę obsługi odpowiedzi z API – przekierowanie po sukcesie i wyświetlanie komunikatów o błędach za pomocą komponentu `Toaster`.
11. **Stylowanie i responsywność:** Dopracowanie wyglądu formularza przy użyciu Tailwind CSS, zapewniając jego responsywność i poprawne wyświetlanie na różnych urządzeniach.
12. **Testowanie manualne:** Przeprowadzenie testów w celu weryfikacji wszystkich ścieżek użytkownika, walidacji i obsługi błędów.
