Jesteś doświadczonym menedżerem produktu, którego zadaniem jest stworzenie kompleksowego dokumentu wymagań produktu (PRD) w oparciu o poniższe opisy:

<project_description>
# Aplikacja - PortfelIO (MVP)

## Główny problem

Manualne śledzenie domowych wydatków jest pracochłonne i podatne na błędy. Ręczne wpisywanie każdej pozycji z paragonu do arkusza kalkulacyjnego lub innej aplikacji jest nużące, przez co użytkownicy często rezygnują z regularnego kontrolowania swojego budżetu. Brak łatwego wglądu w strukturę wydatków utrudnia świadome zarządzanie finansami.

## Najmniejszy zestaw funkcjonalności

- Prosty system kont użytkowników do bezpiecznego przechowywania danych o wydatkach.
- Główny widok aplikacji to podsumowanie wydatków z wybranego miesiąca, prezentujące sumy w podziale na kategorie.
- Możliwość przeglądania listy wszystkich paragonów z wybranego miesiąca.
- Dodawanie wydatków poprzez skan paragonu (aparatem lub z pliku) lub ręczne wprowadzanie danych.
- Automatyczna analiza paragonu przez model AI w celu odczytania daty zakupu oraz pozycji (nazwa produktu, cena) i przypisania ich do predefiniowanych kategorii.
- Pełna edycja paragonu: możliwość zmiany daty zakupu, a także poprawy, usunięcia lub dodania nowej pozycji (nazwa, cena, kategoria).
- Aplikacja webowa z pełnym wsparciem RWD (dostosowana do mobile) i PWA (możliwość dodania do ekranu głównego).

## Co NIE wchodzi w zakres MVP

- Zaawansowane funkcje budżetowe (np. ustawianie limitów na kategorie, alerty).
- Możliwość tworzenia i zarządzania własnymi kategoriami wydatków.
- Generowanie szczegółowych raportów i wykresów analizujących wydatki.
- Funkcje związane z gwarancjami, terminami zwrotów czy programami lojalnościowymi.
- Współdzielenie konta/budżetu z innymi użytkownikami.
- Przechowywanie obrazów paragonów po ich analizie (obrazy są natychmiast usuwane).

## Kryteria sukcesu

- 80% nowo dodanych paragonów jest dodawanych za pomocą funkcji skanowania.
- 60% użytkowników dodaje co najmniej 4 paragony w miesiącu.

</project_description>

<project_details>
# Podsumowanie rozmowy - PortfelIO MVP PRD

## Decyzje podjęte przez użytkownika

1. **Typ paragonów**: Standardowe paragony fiskalne (polskie)
2. **Architektura kont**: Jeden portfel na użytkownika
3. **Kategorie wydatków**:
   - Żywność i napoje
   - Transport (paliwo, bilety, parking)
   - Zdrowie i uroda (apteka, kosmetyki)
   - Dom i ogród (wyposażenie, narzędzia)
   - Odzież i obuwie
   - Rozrywka i kultura
   - Elektronika i AGD
   - Usługi i opłaty
   - Inne
   - Przechowywane w dedykowanej tabeli w bazie danych dla łatwej rozszerzalności
4. **Czas przetwarzania AI**: Maksymalnie 1 minuta, z zachętą do instalacji PWA podczas oczekiwania (non-blocking UI)
5. **Kategoryzacja**: Kategoria przypisana do każdej pozycji paragonu osobno
6. **Wizualizacja miesięczna**: Diagram donut z kwotami zsumowanymi dla każdej kategorii, na środku kwota po podświetleniu kategorii (domyślnie suma wszystkich wydatków)
7. **Obsługa błędów OCR**: Użytkownik samodzielnie ocenia i edytuje wyniki AI (dodawanie/edycja/usuwanie pozycji)
8. **Przechowywanie zdjęć**: Brak - zdjęcia używane jednorazowo podczas analizy, przetwarzane "w locie"
9. **Zarządzanie paragonami**: Możliwość dodawania i usuwania całych paragonów oraz pojedynczych pozycji
10. **Duplikaty paragonów**: Brak walidacji, dowolna liczba paragonów; blokada dodawania dat w przyszłości
11. **Model biznesowy**: Aplikacja całkowicie darmowa
12. **Provider AI**: Integracja z OpenAI (GPT-4 Vision/GPT-4o)
13. **Nawigacja między miesiącami**: Strzałki "poprzedni/następny miesiąc"
14. **Lista paragonów**: Domyślnie posortowana po dacie zakupu malejąco, załadowana w całości
15. **Flow dodawania**: Floating Action Button (FAB) z bottom sheet (mobile) / modal (desktop)
16. **Edycja paragonu**: Tylko aktualny stan z bazy danych, bez historii zmian
17. **Nazwa sklepu**: AI wykrywa/sugeruje nazwę lub opis, pole edytowalne i opcjonalne
18. **Tryb offline**: Brak wsparcia w MVP, wymagane połączenie internetowe
19. **Onboarding**: Brak, domyślny widok to aktualny miesiąc
20. **Struktura widoku miesiąca**: Dwa segmenty - wykres na górze, lista paragonów poniżej
21. **Uwierzytelnienie**: Tylko email i hasło (min. 8 znaków, 1 mała litera, 1 duża litera, 1 liczba, 1 znak specjalny)

## Dopasowane rekomendacje

1. **Provider AI**: Azure OpenAI dla zgodności z RODO i hostingu w EU (koszt ~$0.01-0.03 za paragon)
2. **Ikony kategorii**: Dodanie emoji do kategorii dla lepszej czytelności wizualnej (🛒 🚗 💊 🏠 👕 🎬 📱 💼 ❓)
3. **Nawigacja miesięczna**: Header pokazujący nazwę miesiąca z wyraźnymi strzałkami < >
4. **Grupowanie paragonów**: Lista z subtotalami dla lepszej czytelności
5. **FAB umiejscowienie**: Prawy dolny róg z ikoną "+" lub aparatu jako primary action
6. **Edycja pozycji**: Każda pozycja w formie edytowalnego pola z dropdown dla kategorii
7. **Nazwa sklepu**: Automatyczne wypełnianie przez AI na podstawie NIP lub nazwy z paragonu
8. **PWA**: Funkcja "dodaj do ekranu głównego" dla app-like experience bez offline mode
9. **Empty state**: Animowana grafika z przyciskiem "Dodaj pierwszy paragon" dla nowych użytkowników
10. **Supabase Auth**: Wykorzystanie wbudowanych funkcji Supabase dla email/hasło

## Szczegółowe podsumowanie planowania PRD

### 1. Główne wymagania funkcjonalne

#### Autentykacja i bezpieczeństwo
- System logowania email/hasło z walidacją:
  - Minimum 8 znaków
  - Co najmniej 1 mała litera
  - Co najmniej 1 duża litera
  - Co najmniej 1 cyfra
  - Co najmniej 1 znak specjalny
- Wykorzystanie Supabase Auth
- Jeden portfel wydatków na użytkownika

#### Zarządzanie kategoriami
- 9 predefiniowanych kategorii przechowywanych w dedykowanej tabeli DB:
  - Żywność i napoje 🛒
  - Transport 🚗
  - Zdrowie i uroda 💊
  - Dom i ogród 🏠
  - Odzież i obuwie 👕
  - Rozrywka i kultura 🎬
  - Elektronika i AGD 📱
  - Usługi i opłaty 💼
  - Inne ❓
- Kategorie przypisywane na poziomie pojedynczych pozycji paragonu
- Brak możliwości tworzenia własnych kategorii w MVP

#### Dodawanie paragonów
- Trzy metody dodawania:
  1. Zdjęcie aparatem (mobile)
  2. Upload z galerii/pliku
  3. Ręczne wprowadzenie danych
- Floating Action Button (FAB) w prawym dolnym rogu
- Bottom sheet na mobile, modal na desktop
- Obsługa wyłącznie polskich paragonów fiskalnych

#### Analiza AI (OpenAI GPT-4 Vision/GPT-4o)
- Automatyczne rozpoznawanie:
  - Data zakupu
  - Nazwa sklepu (opcjonalnie, na podstawie NIP/nazwy)
  - Pozycje: nazwa produktu, cena
  - Automatyczna kategoryzacja każdej pozycji
- Maksymalny czas przetwarzania: 1 minuta
- Non-blocking UI z zachętą do instalacji PWA podczas oczekiwania
- Zdjęcia przetwarzane "w locie", bez zapisu w bazie
- Koszt szacunkowy: $0.01-0.03 za paragon

#### Edycja paragonów
- Pełna edycja po analizie AI:
  - Zmiana daty zakupu (z blokadą dat przyszłych)
  - Edycja nazwy sklepu
  - Dodawanie nowych pozycji
  - Edycja istniejących pozycji (nazwa, cena, kategoria)
  - Usuwanie pojedynczych pozycji
  - Usuwanie całego paragonu
- Wyświetlanie tylko aktualnego stanu z bazy (bez historii zmian)
- Dropdown do wyboru kategorii dla każdej pozycji

#### Widok miesięczny (główny ekran)
- Struktura dwusegmentowa:
  1. **Górny segment - Wykres donut**:
     - Wizualizacja wydatków podzielona na kategorie
     - Na środku: suma wszystkich wydatków (domyślnie)
     - Po podświetleniu kategorii: kwota dla tej kategorii
  2. **Dolny segment - Lista paragonów**:
     - Sortowanie: data zakupu malejąco (najnowsze na górze)
     - Wszystkie paragony załadowane jednorazowo
     - Każdy paragon z nazwą sklepu, datą i sumą
- Nawigacja: strzałki < > do przełączania między miesiącami
- Header z nazwą aktualnego miesiąca
- Domyślnie: bieżący miesiąc

#### PWA (Progressive Web App)
- Możliwość dodania do ekranu głównego (iOS/Android)
- Brak wsparcia offline w MVP
- Wymagane stałe połączenie internetowe
- App-like experience na urządzeniach mobilnych

#### Onboarding
- Brak dedykowanego onboardingu
- Nowi użytkownicy widzą od razu widok aktualnego miesiąca
- Empty state z grafiką i przyciskiem "Dodaj pierwszy paragon"

### 2. Kluczowe historie użytkownika i ścieżki

#### Historia 1: Dodanie paragonu przez skanowanie (Primary Flow)
```
JAKO użytkownik
CHCĘ zrobić zdjęcie paragonu
ABY automatycznie dodać wydatki bez ręcznego wpisywania

Kroki:
1. Użytkownik klika FAB (ikona + lub aparat)
2. Otwiera się bottom sheet/modal z opcjami
3. Użytkownik wybiera "Zrób zdjęcie" lub "Wybierz z galerii"
4. Robi zdjęcie/wybiera plik
5. Wyświetla się loader z informacją o analizie + zachęta do PWA
6. Po max 1 min wyświetla się ekran edycji z rozpoznanymi danymi:
   - Data zakupu
   - Nazwa sklepu (jeśli wykryta)
   - Lista pozycji (nazwa, cena, kategoria)
7. Użytkownik weryfikuje/edytuje dane
8. Klika "Zapisz"
9. Wraca do widoku miesięcznego z zaktualizowanymi danymi
```

#### Historia 2: Ręczne dodanie paragonu
```
JAKO użytkownik
CHCĘ ręcznie dodać paragon
ABY zarejestrować wydatek bez robienia zdjęcia

Kroki:
1. Użytkownik klika FAB
2. Wybiera "Dodaj ręcznie"
3. Wypełnia formularz:
   - Data zakupu (domyślnie: dzisiaj)
   - Nazwa sklepu (opcjonalne)
   - Dodaje pozycje (przycisk "Dodaj pozycję"):
     - Nazwa produktu
     - Cena
     - Kategoria (dropdown)
4. Klika "Zapisz"
5. Wraca do widoku miesięcznego
```

#### Historia 3: Przeglądanie wydatków z miesiąca
```
JAKO użytkownik
CHCĘ zobaczyć podsumowanie moich wydatków
ABY wiedzieć, na co wydaję najwięcej pieniędzy

Kroki:
1. Użytkownik otwiera aplikację
2. Widzi wykres donut z podziałem na kategorie
3. Na środku wykresu: suma wszystkich wydatków
4. Klika/hover na segment kategorii
5. Na środku wykresu zmienia się kwota na wydatki z tej kategorii
6. Przewija w dół i widzi listę wszystkich paragonów (data malejąco)
7. Może kliknąć paragon, aby zobaczyć szczegóły
```

#### Historia 4: Edycja istniejącego paragonu
```
JAKO użytkownik
CHCĘ poprawić błędnie rozpoznane pozycje
ABY mieć dokładne dane o wydatkach

Kroki:
1. Z listy paragonów użytkownik klika paragon do edycji
2. Widzi szczegóły paragonu w trybie edycji
3. Może:
   - Zmienić datę zakupu
   - Zmienić nazwę sklepu
   - Edytować pozycję (nazwa/cena/kategoria)
   - Usunąć pozycję (X przy pozycji)
   - Dodać nową pozycję (+ Dodaj pozycję)
4. Klika "Zapisz zmiany"
5. Wraca do widoku miesięcznego
```

#### Historia 5: Usunięcie paragonu
```
JAKO użytkownik
CHCĘ usunąć błędnie dodany paragon
ABY mieć czystą listę wydatków

Kroki:
1. Z listy paragonów użytkownik klika/swipe na paragon
2. Wybiera opcję "Usuń" (ikona kosza)
3. Pojawia się potwierdzenie: "Czy na pewno chcesz usunąć?"
4. Klika "Usuń"
5. Paragon znika z listy
6. Wykres donut aktualizuje się automatycznie
```

#### Historia 6: Nawigacja między miesiącami
```
JAKO użytkownik
CHCĘ zobaczyć wydatki z poprzednich miesięcy
ABY porównać swoje nawyki zakupowe

Kroki:
1. W widoku miesięcznym użytkownik klika strzałkę < (poprzedni)
2. Widok zmienia się na poprzedni miesiąc
3. Wykres i lista aktualizują się
4. Header pokazuje nazwę miesiąca (np. "Grudzień 2024")
5. Może dalej nawigować < > między miesiącami
```

### 3. Kryteria sukcesu i metryki

#### Metryki produktowe (z oryginalnego dokumentu)
- **80% adoption skanowania**: 80% nowo dodanych paragonów jest dodawanych za pomocą funkcji skanowania (nie ręcznie)
  - Mierzenie: `(liczba paragonów ze skanowania / całkowita liczba paragonów) * 100`

- **60% aktywnych użytkowników**: 60% użytkowników dodaje co najmniej 4 paragony w miesiącu
  - Mierzenie: `(użytkownicy z ≥4 paragonami w miesiącu / wszyscy użytkownicy) * 100`

#### Dodatkowe metryki techniczne
- **Czas przetwarzania AI**: ≤60 sekund dla 95% paragonów
- **Dokładność rozpoznawania**: ≥85% pozycji rozpoznanych poprawnie (nazwa + cena)
- **Dokładność kategoryzacji**: ≥75% pozycji w poprawnej kategorii
- **Retention rate**: ≥40% użytkowników wraca po 30 dniach
- **PWA install rate**: ≥15% użytkowników instaluje PWA po 3+ dodanych paragonach

#### Metryki UX
- **Time to first receipt**: <2 minuty od rejestracji do dodania pierwszego paragonu
- **Edit rate**: <30% paragonów wymaga edycji po analizie AI
- **Error rate**: <5% niepowodzeń analizy AI wymagających ponownego zdjęcia

### 4. Architektura techniczna

#### Stack technologiczny (z CLAUDE.md)
- **Frontend**: Astro 5 + React 19 + TypeScript 5
- **Styling**: Tailwind CSS 4 + Shadcn/ui
- **Backend**: Supabase (DB + Auth)
- **AI**: OpenAI GPT-4 Vision/GPT-4o (zalecany: Azure OpenAI dla RODO)
- **Hosting**: Azure Static Web Apps
- **PWA**: Service Worker + Manifest

#### Struktura bazy danych (propozycja)
```
users (Supabase Auth)
├── id (uuid)
├── email
└── created_at

categories
├── id (uuid)
├── name (text) - np. "Żywność i napoje"
├── icon (text) - np. "🛒"
├── order (int) - kolejność wyświetlania
└── created_at

receipts
├── id (uuid)
├── user_id (uuid) FK -> users.id
├── purchase_date (date) - data zakupu
├── store_name (text, nullable) - nazwa sklepu
├── total_amount (decimal) - suma paragonu
├── created_at (timestamp)
└── updated_at (timestamp)

receipt_items
├── id (uuid)
├── receipt_id (uuid) FK -> receipts.id
├── category_id (uuid) FK -> categories.id
├── item_name (text) - nazwa produktu
├── price (decimal) - cena
├── created_at (timestamp)
└── updated_at (timestamp)
```

#### API Endpoints (propozycja)
```
POST /api/auth/signup - Rejestracja
POST /api/auth/login - Logowanie
POST /api/auth/logout - Wylogowanie

POST /api/receipts/scan - Analiza zdjęcia paragonu (OpenAI)
POST /api/receipts - Utworzenie paragonu
GET /api/receipts?month=2025-01 - Lista paragonów z miesiąca
GET /api/receipts/:id - Szczegóły paragonu
PUT /api/receipts/:id - Edycja paragonu
DELETE /api/receipts/:id - Usunięcie paragonu

POST /api/receipts/:id/items - Dodanie pozycji
PUT /api/receipts/:id/items/:itemId - Edycja pozycji
DELETE /api/receipts/:id/items/:itemId - Usunięcie pozycji

GET /api/categories - Lista wszystkich kategorii
GET /api/stats/monthly?month=2025-01 - Statystyki miesięczne
```

</project_details>

Wykonaj następujące kroki, aby stworzyć kompleksowy i dobrze zorganizowany dokument:

1. Podziel PRD na następujące sekcje:
   a. Przegląd projektu
   b. Problem użytkownika
   c. Wymagania funkcjonalne
   d. Granice projektu
   e. Historie użytkownika
   f. Metryki sukcesu

2. W każdej sekcji należy podać szczegółowe i istotne informacje w oparciu o opis projektu i odpowiedzi na pytania wyjaśniające. Upewnij się, że:
   - Używasz jasnego i zwięzłego języka
   - W razie potrzeby podajesz konkretne szczegóły i dane
   - Zachowujesz spójność w całym dokumencie
   - Odnosisz się do wszystkich punktów wymienionych w każdej sekcji

3. Podczas tworzenia historyjek użytkownika i kryteriów akceptacji
   - Wymień WSZYSTKIE niezbędne historyjki użytkownika, w tym scenariusze podstawowe, alternatywne i skrajne.
   - Przypisz unikalny identyfikator wymagań (np. US-001) do każdej historyjki użytkownika w celu bezpośredniej identyfikowalności.
   - Uwzględnij co najmniej jedną historię użytkownika specjalnie dla bezpiecznego dostępu lub uwierzytelniania, jeśli aplikacja wymaga identyfikacji użytkownika lub ograniczeń dostępu.
   - Upewnij się, że żadna potencjalna interakcja użytkownika nie została pominięta.
   - Upewnij się, że każda historia użytkownika jest testowalna.

Użyj następującej struktury dla każdej historii użytkownika:
- ID
- Tytuł
- Opis
- Kryteria akceptacji

4. Po ukończeniu PRD przejrzyj go pod kątem tej listy kontrolnej:
   - Czy każdą historię użytkownika można przetestować?
   - Czy kryteria akceptacji są jasne i konkretne?
   - Czy mamy wystarczająco dużo historyjek użytkownika, aby zbudować w pełni funkcjonalną aplikację?
   - Czy uwzględniliśmy wymagania dotyczące uwierzytelniania i autoryzacji (jeśli dotyczy)?

5. Formatowanie PRD:
   - Zachowaj spójne formatowanie i numerację.
   - Nie używaj pogrubionego formatowania w markdown ( ** ).
   - Wymień WSZYSTKIE historyjki użytkownika.
   - Sformatuj PRD w poprawnym markdown.

Przygotuj PRD z następującą strukturą:

```markdown
# Dokument wymagań produktu (PRD) - {{app-name}}
## 1. Przegląd produktu
## 2. Problem użytkownika
## 3. Wymagania funkcjonalne
## 4. Granice produktu
## 5. Historyjki użytkowników
## 6. Metryki sukcesu
```

Pamiętaj, aby wypełnić każdą sekcję szczegółowymi, istotnymi informacjami w oparciu o opis projektu i nasze pytania wyjaśniające. Upewnij się, że PRD jest wyczerpujący, jasny i zawiera wszystkie istotne informacje potrzebne do dalszej pracy nad produktem.

Ostateczny wynik powinien składać się wyłącznie z PRD zgodnego ze wskazanym formatem w markdown, który zapiszesz w pliku .ai/prd.md