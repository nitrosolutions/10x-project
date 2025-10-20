# Dashboard - Przewodnik Testowania

## Przygotowanie Środowiska Testowego

### Wymagania

- Node.js v22.20.0 (patrz: `.nvmrc`)
- Konfiguracja Supabase (URL, Service Role Key)
- Testowy użytkownik w bazie danych

### Konfiguracja Dev Mode (opcjonalna)

Dla uproszczenia testowania, aplikacja wspiera tryb deweloperski z pominięciem autentykacji:

**Plik `.env`:**

```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Dev Mode (optional - bypasses authentication)
DEV_BYPASS_AUTH=true
DEV_USER_ID=your_test_user_uuid
```

**Uwaga:** Tryb `DEV_BYPASS_AUTH` omija RLS i pozwala na testowanie bez logowania.

### Uruchomienie Serwera Deweloperskiego

```bash
npm run dev
```

Aplikacja uruchomi się na `http://localhost:3000/` (lub innym porcie jeśli 3000 jest zajęty).

## Scenariusze Testowe

### 1. Test Renderowania Strony Głównej

**Cel:** Sprawdzenie czy Dashboard renderuje się poprawnie jako strona główna.

**Kroki:**

1. Otwórz `http://localhost:3000/`
2. Sprawdź czy widoczna jest nawigacja u góry strony
3. Sprawdź czy widoczny jest MonthNavigator (nazwa miesiąca i przyciski)

**Oczekiwany rezultat:**

- ✅ Strona się renderuje bez błędów
- ✅ Nawigacja zawiera linki "Dashboard" i "Dodaj paragon"
- ✅ MonthNavigator wyświetla aktualny miesiąc (np. "październik 2025")
- ✅ Widoczne są przyciski nawigacji (strzałki w lewo i prawo)

---

### 2. Test Nawigacji Między Miesiącami

**Cel:** Sprawdzenie czy użytkownik może nawigować między miesiącami.

**Kroki:**

1. Otwórz Dashboard
2. Zanotuj aktualny miesiąc wyświetlany w MonthNavigator
3. Kliknij przycisk "poprzedni miesiąc" (strzałka w lewo)
4. Sprawdź czy miesiąc się zmienił
5. Kliknij przycisk "następny miesiąc" (strzałka w prawo)
6. Sprawdź czy wróciłeś do poprzedniego miesiąca

**Oczekiwany rezultat:**

- ✅ Kliknięcie "poprzedni" zmienia miesiąc o 1 w tył
- ✅ Kliknięcie "następny" zmienia miesiąc o 1 do przodu
- ✅ Nazwa miesiąca aktualizuje się natychmiast
- ✅ Lista paragonów zmienia się (jeśli są dane)
- ✅ Podczas ładowania widoczny jest spinner

---

### 3. Test Blokady Przyszłych Miesięcy

**Cel:** Sprawdzenie czy aplikacja blokuje nawigację do przyszłych miesięcy.

**Kroki:**

1. Otwórz Dashboard
2. Nawiguj do bieżącego miesiąca (jeśli nie jesteś już w nim)
3. Sprawdź stan przycisku "następny miesiąc"
4. Spróbuj kliknąć przycisk "następny miesiąc"

**Oczekiwany rezultat:**

- ✅ Przycisk "następny miesiąc" jest zablokowany (disabled) dla bieżącego miesiąca
- ✅ Przycisk ma wizualną wskazówkę, że jest nieaktywny (opacity, kursor)
- ✅ Kliknięcie nie powoduje zmiany miesiąca
- ✅ Przycisk "poprzedni miesiąc" pozostaje aktywny

---

### 4. Test Stanu Pustego (EmptyState)

**Cel:** Sprawdzenie czy aplikacja prawidłowo wyświetla komunikat gdy brak paragonów.

**Przygotowanie:**

- Upewnij się, że testujesz na miesiącu bez paragonów (np. nawiguj do przyszłego miesiąca sprzed blokady)
- LUB usuń wszystkie paragony z testowego miesiąca w bazie danych

**Kroki:**

1. Otwórz Dashboard na miesiącu bez paragonów
2. Poczekaj na załadowanie danych

**Oczekiwany rezultat:**

- ✅ Widoczny jest EmptyState z ikoną 📋
- ✅ Nagłówek: "Brak paragonów"
- ✅ Opis wyjaśnia sytuację
- ✅ Widoczny jest przycisk/link "Dodaj pierwszy paragon"
- ✅ Kliknięcie przycisku przekierowuje do `/receipts/new`

---

### 5. Test Listy Paragonów

**Cel:** Sprawdzenie czy lista paragonów wyświetla się poprawnie.

**Przygotowanie:**

- Dodaj kilka testowych paragonów do bieżącego miesiąca
- Upewnij się, że paragony mają różne daty i kwoty

**Kroki:**

1. Otwórz Dashboard na miesiącu z paragonami
2. Poczekaj na załadowanie danych
3. Sprawdź format wyświetlanych danych

**Oczekiwany rezultat:**

- ✅ Widoczna jest lista paragonów (ReceiptsList)
- ✅ Każdy paragon ma format: `[Data • Nazwa sklepu] [Kwota]`
- ✅ Data jest w formacie DD.MM.YYYY (np. "14.10.2025")
- ✅ Kwota jest w formacie PLN (np. "123,45 zł")
- ✅ Jeśli brak nazwy sklepu, wyświetla się tylko data
- ✅ Paragony są posortowane malejąco po dacie zakupu (najnowsze na górze)

---

### 6. Test Hover State na Liście

**Cel:** Sprawdzenie czy interakcje hover działają poprawnie.

**Kroki:**

1. Otwórz Dashboard z listą paragonów
2. Najedź kursorem na dowolny paragon na liście
3. Sprawdź wizualne zmiany

**Oczekiwany rezultat:**

- ✅ Hover zmienia tło elementu (background color)
- ✅ Kursor zmienia się na "pointer" wskazując klikalność
- ✅ Animacja przejścia jest płynna (transition)
- ✅ Focus state działa przy nawigacji klawiaturą (Tab)

---

### 7. Test Przekierowania do Szczegółów Paragonu

**Cel:** Sprawdzenie czy kliknięcie na paragon przekierowuje do widoku szczegółów.

**Kroki:**

1. Otwórz Dashboard z listą paragonów
2. Zanotuj ID jednego z paragonów (opcjonalne - sprawdzić w DevTools)
3. Kliknij na dowolny paragon
4. Sprawdź URL w przeglądarce

**Oczekiwany rezultat:**

- ✅ Kliknięcie przekierowuje do `/receipts/{id}`
- ✅ ID w URL odpowiada ID klikniętego paragonu
- ✅ Przekierowanie działa dla wszystkich paragonów na liście

**Uwaga:** Widok szczegółów paragonu (`/receipts/{id}`) może jeszcze nie być zaimplementowany - w takim przypadku zobaczysz błąd 404, co jest oczekiwane.

---

### 8. Test Integracji z API

**Cel:** Sprawdzenie czy aplikacja poprawnie komunikuje się z API.

**Narzędzia:** DevTools przeglądarki (Network tab)

**Kroki:**

1. Otwórz DevTools → zakładka Network
2. Odśwież stronę Dashboard
3. Poszukaj requestu do `/api/receipts?month=YYYY-MM`
4. Sprawdź parametry i odpowiedź

**Oczekiwany rezultat:**

- ✅ Request jest wysyłany do `/api/receipts?month=YYYY-MM`
- ✅ Parametr `month` ma format YYYY-MM (np. "2025-10")
- ✅ Response ma status 200 OK (przy sukcesie)
- ✅ Response zawiera tablicę paragonów (lub pustą tablicę)
- ✅ Każdy paragon ma strukturę: `{ id, purchase_date, store_name, total_amount }`

---

### 9. Test Stanu Ładowania (Loading State)

**Cel:** Sprawdzenie czy aplikacja pokazuje loading state podczas pobierania danych.

**Kroki:**

1. Otwórz DevTools → zakładka Network
2. Ustaw throttling na "Slow 3G" (symulacja wolnego połączenia)
3. Odśwież stronę Dashboard lub zmień miesiąc
4. Obserwuj ekran podczas ładowania

**Oczekiwany rezultat:**

- ✅ Widoczny jest spinner/loader podczas ładowania
- ✅ Tekst "Ładowanie paragonów..." jest wyświetlany
- ✅ Po załadowaniu danych loading state znika
- ✅ Wyświetla się odpowiedni stan (lista lub EmptyState)

---

### 10. Test Obsługi Błędów API

**Cel:** Sprawdzenie czy aplikacja gracefully obsługuje błędy API.

**Symulacja błędu:**

- Opcja 1: Wyłącz serwer Supabase (jeśli testujesz lokalnie)
- Opcja 2: Zmień URL Supabase w `.env` na nieprawidłowy
- Opcja 3: Użyj DevTools → Network → Blocked Request Patterns

**Kroki:**

1. Symuluj błąd API (jedną z powyższych metod)
2. Odśwież stronę Dashboard
3. Poczekaj na zakończenie requestu

**Oczekiwany rezultat:**

- ✅ Widoczny jest error state (nie loading w nieskończoność)
- ✅ Ikona błędu: ⚠️
- ✅ Nagłówek: "Wystąpił błąd"
- ✅ Komunikat błędu jest wyświetlony
- ✅ Widoczny jest przycisk "Spróbuj ponownie"
- ✅ Kliknięcie "Spróbuj ponownie" przeładowuje stronę

---

### 11. Test Formatowania Daty

**Cel:** Sprawdzenie czy daty są formatowane zgodnie z polskim formatem.

**Przygotowanie:**

- Dodaj paragony z różnymi datami:
  - Początek miesiąca (01.10.2025)
  - Środek miesiąca (15.10.2025)
  - Koniec miesiąca (31.10.2025)

**Kroki:**

1. Otwórz Dashboard z paragonami
2. Sprawdź format daty dla każdego paragonu

**Oczekiwany rezultat:**

- ✅ Format: DD.MM.YYYY (np. "14.10.2025")
- ✅ Dni i miesiące mają leading zero (np. "01" zamiast "1")
- ✅ Wszystkie daty są czytelne i spójne
- ✅ Locale: pl-PL

---

### 12. Test Formatowania Kwoty

**Cel:** Sprawdzenie czy kwoty są formatowane zgodnie z polskim formatem walutowym.

**Przygotowanie:**

- Dodaj paragony z różnymi kwotami:
  - Małe kwoty (np. 5.50 zł)
  - Średnie kwoty (np. 123.45 zł)
  - Duże kwoty (np. 1234.56 zł)
  - Kwoty pełne (np. 100.00 zł)

**Kroki:**

1. Otwórz Dashboard z paragonami
2. Sprawdź format kwoty dla każdego paragonu

**Oczekiwany rezultat:**

- ✅ Format: XX,XX zł (np. "123,45 zł")
- ✅ Separator dziesiętny: przecinek (,)
- ✅ Separator tysięcy: spacja (np. "1 234,56 zł")
- ✅ Symbol waluty: zł
- ✅ Zawsze 2 miejsca po przecinku
- ✅ Locale: pl-PL, currency: PLN

---

### 13. Test Nawigacji Globalnej

**Cel:** Sprawdzenie czy globalna nawigacja działa poprawnie.

**Kroki:**

1. Otwórz Dashboard (/)
2. Sprawdź stan aktywny linku "Dashboard" w nawigacji
3. Kliknij link "Dodaj paragon"
4. Sprawdź czy URL zmienił się na `/receipts/new`
5. Sprawdź stan aktywny linku "Dodaj paragon"
6. Kliknij link "Dashboard"
7. Sprawdź czy wróciłeś do `/`

**Oczekiwany rezultat:**

- ✅ Aktywny link ma inne stylowanie (np. `bg-primary text-primary-foreground`)
- ✅ Kliknięcie linków przekierowuje do odpowiednich stron
- ✅ Stan aktywny aktualizuje się po zmianie strony
- ✅ Nawigacja jest widoczna na wszystkich stronach (poza stroną główną przed zmianą)

---

### 14. Test Accessibility - Klawiatura

**Cel:** Sprawdzenie czy aplikacja jest dostępna dla użytkowników klawiatury.

**Kroki:**

1. Otwórz Dashboard
2. Naciśnij Tab kilkakrotnie
3. Obserwuj fokus przechodzący przez elementy
4. Sprawdź czy przyciski można aktywować używając Enter/Space
5. Sprawdź czy linki można aktywować używając Enter

**Oczekiwany rezultat:**

- ✅ Tab nawiguje przez wszystkie interaktywne elementy
- ✅ Focus indicators są widoczne (ring, outline)
- ✅ Kolejność focusu jest logiczna (góra → dół, lewo → prawo)
- ✅ Enter/Space aktywuje przyciski
- ✅ Enter aktywuje linki
- ✅ Nie ma pułapek klawiatury (keyboard traps)

---

### 15. Test Accessibility - Screen Reader

**Cel:** Sprawdzenie czy aplikacja jest dostępna dla screen readerów.

**Narzędzia:**

- Windows: NVDA (darmowy)
- macOS: VoiceOver (wbudowany)
- Chrome Extension: ChromeVox

**Kroki:**

1. Włącz screen reader
2. Nawiguj po stronie Dashboard
3. Słuchaj jak screen reader ogłasza elementy

**Oczekiwany rezultat:**

- ✅ Nawigacja jest ogłaszana jako "navigation"
- ✅ Lista paragonów jest ogłaszana jako "list"
- ✅ Przyciski mają czytelne labels (np. "Poprzedni miesiąc")
- ✅ Nagłówki są ogłaszane z poziomem (h2, h3)
- ✅ Zmiany stanu są ogłaszane (loading → loaded)
- ✅ ARIA labels są obecne i czytelne

---

### 16. Test Responsywności

**Cel:** Sprawdzenie czy aplikacja działa na różnych rozmiarach ekranu.

**Rozmiary do przetestowania:**

- Mobile: 375px (iPhone SE)
- Tablet: 768px (iPad)
- Desktop: 1440px (laptop)
- Large Desktop: 1920px (monitor)

**Kroki:**

1. Otwórz DevTools → Device Toolbar (Ctrl+Shift+M)
2. Przetestuj każdy rozmiar ekranu
3. Sprawdź layout i czytelność

**Oczekiwany rezultat:**

- ✅ Kontener ma `max-w-4xl` (ograniczenie szerokości)
- ✅ Padding adaptuje się do rozmiaru ekranu (px-4 na mobile)
- ✅ Tekst jest czytelny na wszystkich rozmiarach
- ✅ Przyciski są wystarczająco duże na dotyk (min. 44x44px)
- ✅ Nawigacja działa na mobile (nie przekłada się na hamburger - to OK)
- ✅ Layout nie psuje się na żadnym rozmiarze

---

### 17. Test Wydajności

**Cel:** Sprawdzenie czy aplikacja działa płynnie i szybko.

**Narzędzia:** Chrome DevTools → Lighthouse

**Kroki:**

1. Otwórz Dashboard
2. Otwórz DevTools → Lighthouse
3. Wybierz "Performance" i "Accessibility"
4. Kliknij "Generate report"

**Oczekiwany rezultat:**

- ✅ Performance score: > 90
- ✅ Accessibility score: > 90
- ✅ First Contentful Paint: < 1.5s
- ✅ Time to Interactive: < 3s
- ✅ Bundle size: rozsądny (DashboardView ~6KB gzipped)

---

### 18. Test Edge Cases

**Cel:** Sprawdzenie jak aplikacja radzi sobie z nietypowymi sytuacjami.

#### Edge Case 1: Bardzo długa nazwa sklepu

**Test:** Dodaj paragon z nazwą sklepu > 50 znaków
**Oczekiwany rezultat:** Tekst jest obcięty (truncate) lub zawinięty bez psucia layoutu

#### Edge Case 2: Bardzo duża kwota

**Test:** Dodaj paragon z kwotą > 10,000 zł
**Oczekiwany rezultat:** Kwota jest sformatowana z separatorem tysięcy (np. "10 234,56 zł")

#### Edge Case 3: Bardzo mała kwota

**Test:** Dodaj paragon z kwotą < 1 zł (np. 0.50 zł)
**Oczekiwany rezultat:** Kwota jest poprawnie wyświetlona (np. "0,50 zł")

#### Edge Case 4: Brak nazwy sklepu

**Test:** Dodaj paragon bez nazwy sklepu (store_name = null)
**Oczekiwany rezultat:** Wyświetla się tylko data, bez separatora "•"

#### Edge Case 5: Miesiąc ze 100+ paragonami

**Test:** Dodaj 100+ paragonów do miesiąca
**Oczekiwany rezultat:**

- ✅ Wszystkie paragony się renderują
- ✅ Scrollowanie jest płynne
- ✅ Aplikacja nie zwalnia znacząco

---

## Zgłaszanie Błędów

Jeśli znajdziesz błąd podczas testowania, zgłoś go z następującymi informacjami:

**Szablon zgłoszenia:**

```
### Tytuł błędu
Krótki opis problemu

**Kroki do reprodukcji:**
1. Otwórz...
2. Kliknij...
3. Sprawdź...

**Oczekiwany rezultat:**
Co powinno się wydarzyć

**Faktyczny rezultat:**
Co się rzeczywiście wydarzyło

**Środowisko:**
- Przeglądarka: Chrome 120 / Firefox 121 / Safari 17
- System: Windows 11 / macOS 14 / Linux
- Rozmiar ekranu: 1920x1080

**Screenshots:**
[Załącz screenshot jeśli to możliwe]

**Logi konsoli:**
[Załącz błędy z konsoli jeśli są]
```

---

## Checklist Szybkiego Testu

Użyj tego checklistu dla szybkiego sprawdzenia podstawowej funkcjonalności:

- [ ] ✅ Strona główna (/) renderuje Dashboard
- [ ] ✅ Nawigacja jest widoczna
- [ ] ✅ MonthNavigator wyświetla aktualny miesiąc
- [ ] ✅ Nawigacja "poprzedni" działa
- [ ] ✅ Nawigacja "następny" działa lub jest zablokowana
- [ ] ✅ EmptyState wyświetla się gdy brak danych
- [ ] ✅ Lista paragonów wyświetla się gdy są dane
- [ ] ✅ Daty są w formacie DD.MM.YYYY
- [ ] ✅ Kwoty są w formacie PLN
- [ ] ✅ Kliknięcie na paragon przekierowuje do szczegółów
- [ ] ✅ Loading state działa
- [ ] ✅ Error state działa
- [ ] ✅ Nawigacja klawiaturą działa
- [ ] ✅ Build kompiluje się bez błędów

---

**Powodzenia w testowaniu! 🚀**

Jeśli masz pytania lub napotkasz problemy, sprawdź dokumentację implementacji: `dashboard-implementation-summary.md`
