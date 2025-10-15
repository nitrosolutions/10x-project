# Dashboard - Widok Listy Paragonów

## Opis

Dashboard to główny widok aplikacji do zarządzania paragonami. Wyświetla listę paragonów użytkownika dla wybranego miesiąca z możliwością nawigacji między miesiącami.

## Funkcjonalności

### ✅ Zaimplementowane

1. **Wyświetlanie listy paragonów**
   - Lista paragonów posortowana malejąco po dacie zakupu
   - Formatowanie daty (DD.MM.YYYY, pl-PL)
   - Formatowanie kwoty (PLN, separator tysięcy)
   - Wyświetlanie nazwy sklepu (opcjonalne)

2. **Nawigacja między miesiącami**
   - Przycisk "poprzedni miesiąc" (zawsze aktywny)
   - Przycisk "następny miesiąc" (zablokowany dla bieżącego/przyszłych miesięcy)
   - Wyświetlanie nazwy miesiąca w formacie "miesiąc rok" (np. "październik 2025")

3. **Stany UI**
   - **Loading:** Spinner z komunikatem podczas pobierania danych
   - **Empty:** Przyjazny komunikat i CTA gdy brak paragonów
   - **Error:** Komunikat błędu z możliwością ponowienia
   - **Success:** Lista paragonów z możliwością kliknięcia

4. **Integracja z API**
   - Endpoint: `GET /api/receipts?month=YYYY-MM`
   - Automatyczne pobieranie danych przy zmianie miesiąca
   - Obsługa błędów API

5. **Nawigacja globalna**
   - Dashboard jako strona główna (/)
   - Link do formularza dodawania paragonu
   - Aktywny stan dla bieżącej strony

6. **Accessibility**
   - Semantic HTML (nav, main, list)
   - ARIA labels i attributes
   - Keyboard navigation (Tab, Enter, Space)
   - Focus indicators

## Struktura Plików

```
src/
├── components/
│   ├── dashboard/
│   │   ├── DashboardView.tsx        # Główny komponent (container)
│   │   ├── MonthNavigator.tsx       # Nawigacja między miesiącami
│   │   ├── ReceiptsList.tsx         # Lista paragonów
│   │   ├── ReceiptListItem.tsx      # Pojedynczy element listy
│   │   └── EmptyState.tsx           # Stan pusty
│   ├── hooks/
│   │   └── useDashboard.ts          # Custom hook (business logic)
│   └── Navigation.astro             # Nawigacja globalna
├── pages/
│   └── index.astro                  # Strona główna (Dashboard)
└── lib/services/
    └── receiptService.ts            # Service layer (API logic)
```

## Użycie

### Uruchomienie w trybie deweloperskim

```bash
# Instalacja zależności (jeśli nie zostało zrobione)
npm install

# Konfiguracja .env (wymagane)
# Skopiuj .env.example do .env i wypełnij wartości

# Uruchomienie serwera deweloperskiego
npm run dev

# Aplikacja dostępna na http://localhost:3000/
```

### Build produkcyjny

```bash
# Build aplikacji
npm run build

# Preview buildu
npm run preview
```

## Konfiguracja

### Zmienne środowiskowe (.env)

```bash
# Supabase Configuration (wymagane)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key

# Dev Mode (opcjonalne - pomija autentykację)
DEV_BYPASS_AUTH=true
DEV_USER_ID=your_test_user_uuid
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Tryb deweloperski (DEV_BYPASS_AUTH)

Dla uproszczenia testowania, ustaw `DEV_BYPASS_AUTH=true` w pliku `.env`:
- Omija autentykację użytkownika
- Używa `DEV_USER_ID` jako ID użytkownika
- Wykorzystuje Service Role Key (omija RLS)

**Uwaga:** Nigdy nie używaj tego w produkcji!

## API

### Endpoint: GET /api/receipts

**Request:**
```
GET /api/receipts?month=2025-10
```

**Query Parameters:**
- `month` (required): Miesiąc w formacie YYYY-MM

**Response (200 OK):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "purchase_date": "2025-10-14",
    "store_name": "Biedronka",
    "total_amount": 123.45
  },
  {
    "id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    "purchase_date": "2025-10-13",
    "store_name": null,
    "total_amount": 50.00
  }
]
```

**Response (400 Bad Request):**
```json
{
  "error": "Validation error",
  "details": ["month: Month must be in YYYY-MM format"]
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized"
}
```

## Komponenty

### DashboardView

Główny komponent kontenera, który:
- Wykorzystuje hook `useDashboard`
- Renderuje warunkowe stany (loading, error, empty, success)
- Zarządza layoutem strony

```tsx
<DashboardView client:load />
```

### MonthNavigator

Komponent nawigacji między miesiącami.

**Props:**
```typescript
{
  currentMonth: Date,
  onPreviousMonth: () => void,
  onNextMonth: () => void,
  isNextDisabled: boolean
}
```

**Przykład użycia:**
```tsx
<MonthNavigator
  currentMonth={new Date()}
  onPreviousMonth={() => {}}
  onNextMonth={() => {}}
  isNextDisabled={false}
/>
```

### ReceiptsList

Komponent listy paragonów.

**Props:**
```typescript
{
  receipts: ReceiptListDto[]
}
```

**Przykład użycia:**
```tsx
<ReceiptsList receipts={receipts} />
```

### ReceiptListItem

Komponent pojedynczego elementu listy.

**Props:**
```typescript
{
  receipt: ReceiptListDto
}
```

**Przykład użycia:**
```tsx
<ReceiptListItem receipt={{
  id: "uuid",
  purchase_date: "2025-10-14",
  store_name: "Biedronka",
  total_amount: 123.45
}} />
```

### EmptyState

Komponent stanu pustego (brak paragonów).

```tsx
<EmptyState />
```

### useDashboard Hook

Custom hook zarządzający stanem Dashboard.

**Zwraca:**
```typescript
{
  currentMonth: Date,
  receipts: ReceiptListDto[],
  isLoading: boolean,
  error: string | null,
  handlePreviousMonth: () => void,
  handleNextMonth: () => void,
  isNextDisabled: boolean
}
```

**Przykład użycia:**
```tsx
const {
  currentMonth,
  receipts,
  isLoading,
  error,
  handlePreviousMonth,
  handleNextMonth,
  isNextDisabled,
} = useDashboard();
```

## Typy

### ReceiptListDto

```typescript
interface ReceiptListDto {
  id: string;                    // UUID paragonu
  purchase_date: string;         // Data zakupu (YYYY-MM-DD)
  store_name: string | null;     // Nazwa sklepu (opcjonalna)
  total_amount: number;          // Kwota całkowita
}
```

## Stylowanie

### Tailwind CSS Classes

Główne klasy używane w Dashboard:

```css
/* Kontener */
.container mx-auto px-4 py-8 max-w-4xl

/* Nawigacja miesięczna */
.flex items-center justify-between gap-4

/* Lista paragonów */
.space-y-3

/* Element listy */
.block p-4 border rounded-lg hover:bg-accent

/* EmptyState */
.flex flex-col items-center justify-center py-12
```

### Komponenty Shadcn/ui

- `Button` (variant: outline, size: icon) - MonthNavigator
- Tailwind utilities - Pozostałe komponenty

## Testowanie

### Testy manualne

Pełny przewodnik testowania dostępny w pliku: `.ai/dashboard-testing-guide.md`

**Szybki checklist:**
- [ ] Strona główna renderuje Dashboard
- [ ] Nawigacja między miesiącami działa
- [ ] EmptyState wyświetla się gdy brak danych
- [ ] Lista paragonów wyświetla się poprawnie
- [ ] Formatowanie dat i kwot jest poprawne
- [ ] Kliknięcie na paragon przekierowuje do szczegółów
- [ ] Loading state działa
- [ ] Error state działa
- [ ] Nawigacja klawiaturą działa

### Uruchomienie testów

```bash
# Linting
npm run lint

# Build (weryfikacja kompilacji)
npm run build
```

## Troubleshooting

### Problem: Strona nie ładuje się

**Możliwe przyczyny:**
1. Brak konfiguracji Supabase (.env)
2. Nieprawidłowy URL lub klucz Supabase
3. Brak połączenia z bazą danych

**Rozwiązanie:**
- Sprawdź plik `.env`
- Zweryfikuj dane logowania do Supabase
- Sprawdź logi w konsoli przeglądarki

### Problem: Błąd 401 Unauthorized

**Możliwe przyczyny:**
1. Użytkownik nie jest zalogowany
2. Token wygasł
3. Middleware nie przekazuje userId

**Rozwiązanie:**
- Ustaw `DEV_BYPASS_AUTH=true` w dev mode
- Sprawdź konfigurację middleware
- Zweryfikuj czy `DEV_USER_ID` jest poprawny

### Problem: Pusta lista pomimo danych w bazie

**Możliwe przyczyny:**
1. Paragony należą do innego użytkownika
2. Paragony są w innym miesiącu
3. RLS blokuje dostęp

**Rozwiązanie:**
- Sprawdź `user_id` w tabeli receipts
- Zweryfikuj daty paragonów
- Sprawdź polityki RLS w Supabase

### Problem: Błąd formatowania daty/kwoty

**Możliwe przyczyny:**
1. Nieprawidłowy format daty w bazie
2. Nieprawidłowy typ kolumny total_amount
3. Problem z Intl.DateTimeFormat/NumberFormat

**Rozwiązanie:**
- Sprawdź typ kolumny `purchase_date` (powinien być DATE)
- Sprawdź typ kolumny `total_amount` (powinien być NUMERIC)
- Zweryfikuj locale w przeglądarce

## Znane Ograniczenia

1. **Brak paginacji** - Wszystkie paragony z miesiąca są ładowane jednocześnie
2. **Brak cache'owania** - Każda zmiana miesiąca wymaga nowego requestu
3. **Brak optymistycznego UI** - Brak instant feedback przy zmianie miesiąca
4. **Brak filtrowania** - Nie ma możliwości filtrowania/sortowania poza datą

## Roadmap / Przyszłe Ulepszenia

### Wersja 1.1
- [ ] Cache miesięcy w stanie (unikanie nadmiarowych requestów)
- [ ] Optymistyczny UI (instant feedback)
- [ ] Paginacja (limit 50-100 paragonów)

### Wersja 1.2
- [ ] Statystyki miesiąca (suma wydatków)
- [ ] Wykres wydatków w czasie
- [ ] Filtrowanie po kwocie/sklepie

### Wersja 2.0
- [ ] Grupoważnie po dniach/tygodniach
- [ ] Export do CSV/PDF
- [ ] Wyszukiwanie pełnotekstowe
- [ ] Offline support (PWA)

## Dokumentacja

### Pliki dokumentacyjne

- **dashboard-implementation-summary.md** - Szczegółowa dokumentacja implementacji
- **dashboard-testing-guide.md** - Przewodnik testowania (18 scenariuszy)
- **dashboard-readme.md** - Ten plik (instrukcje użycia)

### Linki

- [Plan implementacji](.ai/receipts-view-implementation-plan.md)
- [Zasady implementacji](.ai/rules/)
- [CLAUDE.md](../CLAUDE.md) - Zasady projektu

## Wsparcie

Jeśli potrzebujesz pomocy:
1. Sprawdź sekcję Troubleshooting
2. Przejrzyj przewodnik testowania
3. Sprawdź logi w konsoli
4. Zweryfikuj konfigurację .env

## Licencja

Ten projekt jest częścią 10xDevs certification project.

---

**Wersja:** 1.0.0
**Data:** 2025-10-14
**Status:** ✅ Production Ready
