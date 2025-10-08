# Dokument wymagań produktu (PRD) - PortfelIO

## 1. Przegląd produktu

PortfelIO to progresywna aplikacja webowa (PWA) do automatycznego śledzenia i kategoryzacji wydatków domowych poprzez skanowanie paragonów fiskalnych. Aplikacja wykorzystuje technologię rozpoznawania obrazu AI (OpenAI GPT-4 Vision/GPT-4o) do automatycznego odczytywania i kategoryzowania pozycji z polskich paragonów fiskalnych, eliminując potrzebę ręcznego wprowadzania danych.

Główne możliwości produktu:

- Automatyczna analiza paragonów za pomocą AI
- Trzy metody dodawania wydatków: skanowanie aparatem, upload z galerii, ręczne wprowadzanie
- Wizualizacja miesięcznych wydatków w formie wykresu donut z podziałem na kategorie
- Pełna edycja rozpoznanych danych (data, nazwa sklepu, pozycje, kategorie, ceny)
- Responsywny interfejs z pełnym wsparciem mobile i funkcjonalnością PWA
- Bezpieczne przechowywanie danych z wykorzystaniem Supabase Auth

Stack technologiczny:

- Frontend: Astro 5 + React 19 + TypeScript 5
- Styling: Tailwind CSS 4 + Shadcn/ui
- Backend: Supabase (PostgreSQL + Authentication)
- AI: OpenAI GPT-4 Vision/GPT-4o (zalecany: Azure OpenAI dla zgodności z RODO)
- Hosting: Azure Static Web Apps
- PWA: Service Worker + Web App Manifest

Model biznesowy: Aplikacja całkowicie darmowa (MVP)

## 2. Problem użytkownika

Manualne śledzenie domowych wydatków stanowi znaczące wyzwanie dla osób pragnących świadomie zarządzać swoim budżetem. Kluczowe problemy:

Problem główny:
Ręczne wpisywanie każdej pozycji z paragonu do arkusza kalkulacyjnego lub aplikacji jest czasochłonne (średnio 5-10 minut na paragon) i podatne na błędy przepisywania. Ta bariera powoduje, że użytkownicy rezygnują z regularnego kontrolowania wydatków już po kilku tygodniach.

Problemy szczegółowe:

- Brak czasu i motywacji do codziennego wprowadzania danych o wydatkach
- Ryzyko błędów przy ręcznym przepisywaniu kwot i nazw produktów
- Trudność w utrzymaniu konsekwentnej kategoryzacji wydatków
- Brak szybkiego wglądu w strukturę wydatków i identyfikację obszarów do optymalizacji
- Istniejące rozwiązania są zbyt skomplikowane lub wymagają płatnej subskrypcji

Docelowa grupa użytkowników:

- Osoby fizyczne w Polsce prowadzące gospodarstwo domowe
- Użytkownicy urządzeń mobilnych (smartfony z aparatem)
- Osoby szukające prostego narzędzia do kontroli wydatków bez zaawansowanych funkcji budżetowych
- Użytkownicy preferujący szybkie, automatyczne rozwiązania zamiast ręcznej pracy

Oczekiwany rezultat:
Redukcja czasu potrzebnego na rejestrację paragonu z 5-10 minut do mniej niż 2 minut (włączając weryfikację danych rozpoznanych przez AI). Zwiększenie regularności śledzenia wydatków dzięki eliminacji barier związanych z ręcznym wprowadzaniem danych.

## 3. Wymagania funkcjonalne

### 3.1 Autentykacja i zarządzanie kontem

Wymóg: System rejestracji i logowania użytkowników za pomocą adresu email i hasła

Szczegóły implementacji:

- Wykorzystanie Supabase Auth jako providera autentykacji
- Walidacja hasła przy rejestracji:
  - Minimum 8 znaków
  - Co najmniej 1 mała litera (a-z)
  - Co najmniej 1 duża litera (A-Z)
  - Co najmniej 1 cyfra (0-9)
  - Co najmniej 1 znak specjalny (!@#$%^&\*)
- Architektura: jeden portfel wydatków na użytkownika
- Brak funkcji resetowania hasła w MVP (wykorzystanie standardowej funkcji Supabase)
- Sesja użytkownika zarządzana przez Astro.cookies (server-side)

Kryteria akceptacji:

- Użytkownik może założyć konto podając email i hasło spełniające wymagania
- System wyświetla komunikaty walidacyjne dla niepoprawnego hasła
- Użytkownik może zalogować się używając zarejestrowanych danych
- Sesja jest utrzymywana między odświeżeniami strony
- Użytkownik może się wylogować, co kończy sesję

### 3.2 System kategorii wydatków

Wymóg: Predefiniowany zestaw 9 kategorii przechowywanych w dedykowanej tabeli bazy danych

Lista kategorii z ikonami emoji:

1. Żywność i napoje 🛒
2. Transport 🚗 (paliwo, bilety, parking)
3. Zdrowie i uroda 💊 (apteka, kosmetyki)
4. Dom i ogród 🏠 (wyposażenie, narzędzia)
5. Odzież i obuwie 👕
6. Rozrywka i kultura 🎬
7. Elektronika i AGD 📱
8. Usługi i opłaty 💼
9. Inne ❓

Szczegóły implementacji:

- Kategorie przechowywane w tabeli `categories` z polami: id, name, icon, order
- Kategorie przypisywane na poziomie pojedynczych pozycji paragonu (nie całego paragonu)
- Brak możliwości tworzenia, edycji lub usuwania kategorii przez użytkownika w MVP
- Kategorie zasilone przez migrację SQL podczas deploymentu
- AI automatycznie przypisuje kategorię do każdej pozycji podczas analizy
- Użytkownik może zmienić kategorię poprzez dropdown podczas edycji

Kryteria akceptacji:

- Wszystkie 9 kategorii są dostępne w systemie
- Każda pozycja paragonu musi mieć przypisaną dokładnie jedną kategorię
- Lista kategorii w dropdown jest posortowana według pola `order`
- Emoji są wyświetlane obok nazwy kategorii w całej aplikacji

### 3.3 Dodawanie paragonów

Wymóg: Trzy metody dodawania wydatków z interfejsem dostosowanym do urządzeń mobilnych i desktopowych

Metody dodawania:

1. Zdjęcie aparatem (mobile primary use case)
2. Upload z galerii/systemu plików
3. Ręczne wprowadzenie danych

Szczegóły implementacji:

- Floating Action Button (FAB) w prawym dolnym rogu jako primary action
- FAB z ikoną "+" lub aparatu fotograficznego
- Mobile: bottom sheet z opcjami "Zrób zdjęcie", "Wybierz z galerii", "Dodaj ręcznie"
- Desktop: modal z tymi samymi opcjami
- Obsługa wyłącznie polskich paragonów fiskalnych
- Format obrazu: JPEG, PNG (max rozmiar: 10MB)
- Walidacja formatu pliku po stronie klienta przed przesłaniem

Flow dla skanowania:

1. Użytkownik klika FAB
2. Wybiera metodę (aparat/galeria)
3. Robi zdjęcie lub wybiera plik
4. Obraz jest przesyłany do endpointu `/api/receipts/scan`
5. Wyświetla się loader z informacją "Analizuję paragon..." i zachętą do instalacji PWA (non-blocking UI)
6. Po otrzymaniu odpowiedzi (max 60s) wyświetla się ekran edycji z danymi

Flow dla ręcznego dodawania:

1. Użytkownik klika FAB
2. Wybiera "Dodaj ręcznie"
3. Wyświetla się formularz z polami:
   - Data zakupu (date picker, domyślnie: dzisiaj)
   - Nazwa sklepu (text input, opcjonalne)
   - Sekcja pozycji z przyciskiem "+ Dodaj pozycję"
4. Każda pozycja zawiera: nazwa produktu, cena, kategoria (dropdown)
5. Przycisk "Zapisz" tworzy paragon

Kryteria akceptacji:

- FAB jest widoczny i łatwo dostępny w prawym dolnym rogu
- Na mobile można uruchomić aparat natywny urządzenia
- Można wybrać istniejący plik z galerii/systemu plików
- System akceptuje tylko pliki JPEG i PNG do 10MB
- Ręczne dodanie wymaga co najmniej jednej pozycji
- Data zakupu nie może być w przyszłości
- Po analizie lub ręcznym dodaniu użytkownik trafia do ekranu edycji/weryfikacji

### 3.4 Analiza paragonów przez AI

Wymóg: Automatyczne rozpoznawanie danych z polskich paragonów fiskalnych za pomocą OpenAI GPT-4 Vision

Rozpoznawane elementy:

- Data zakupu
- Nazwa sklepu
- Lista pozycji z każdego paragonu:
  - Nazwa produktu/usługi
  - Cena (format: XX.XX PLN)
- Suma całkowita

Szczegóły implementacji:

- Provider: OpenAI GPT-4 Vision API lub GPT-4o
- Zalecany: Azure OpenAI dla zgodności z RODO i hostingu w EU
- Szacunkowy koszt: $0.01-0.03 za jeden paragon
- Maksymalny czas przetwarzania: 60 sekund
- Obraz przesyłany jako base64 w request do API
- Prompt dla AI zawiera instrukcje dotyczące rozpoznawania polskich paragonów fiskalnych
- AI kategoryzuje każdą pozycję do jednej z 9 predefiniowanych kategorii
- Odpowiedź AI w formacie JSON z ustrukturyzowanymi danymi

Obsługa błędów:

- Timeout po 60 sekundach z komunikatem o błędzie
- Nieczytelny paragon: zwrócenie pustego formularza do ręcznego wypełnienia
- Częściowe rozpoznanie: zwrócenie rozpoznanych danych do weryfikacji
- Użytkownik samodzielnie ocenia poprawność i edytuje wyniki

Przetwarzanie obrazów:

- Obrazy paragonów NIE są przechowywane w bazie danych
- Zdjęcia używane jednorazowo podczas analizy "w locie"
- Po otrzymaniu odpowiedzi z AI obraz jest usuwany z serwera
- Brak opcji ponownej analizy tego samego zdjęcia

Kryteria akceptacji:

- 95% paragonów jest przetwarzanych w czasie ≤60 sekund
- System zwraca ustrukturyzowane dane w formacie JSON
- W przypadku błędu użytkownik otrzymuje czytelny komunikat
- Obrazy NIE są zapisywane w bazie danych po analizie
- Podczas oczekiwania wyświetlany jest loader z zachętą do instalacji PWA

### 3.5 Edycja paragonów

Wymóg: Pełna możliwość weryfikacji i modyfikacji danych rozpoznanych przez AI oraz ręcznie wprowadzonych paragonów

Edytowalne elementy:

- Data zakupu (z blokadą dat przyszłych)
- Nazwa sklepu (text input, opcjonalne)
- Pozycje paragonu:
  - Edycja istniejącej pozycji (nazwa, cena, kategoria)
  - Dodawanie nowych pozycji
  - Usuwanie pojedynczych pozycji
- Możliwość usunięcia całego paragonu

Szczegóły implementacji:

- Ekran edycji wyświetlany bezpośrednio po analizie AI lub po kliknięciu na paragon z listy
- Każda pozycja w formie edytowalnego wiersza z polami:
  - Text input dla nazwy produktu
  - Number input dla ceny (format: XX.XX)
  - Dropdown dla kategorii (z ikonami emoji)
  - Ikona "X" do usunięcia pozycji
- Przycisk "+ Dodaj pozycję" na dole listy
- Automatyczne przeliczanie sumy po każdej zmianie
- Przycisk "Zapisz zmiany" na dole formularza
- Przycisk "Usuń paragon" (ikona kosza) w headerze lub na dole

Walidacja:

- Data nie może być w przyszłości
- Paragon musi zawierać co najmniej jedną pozycję
- Cena musi być liczbą dodatnią (format: XX.XX)
- Każda pozycja musi mieć przypisaną kategorię

Historia zmian:

- Brak historii zmian w MVP
- Wyświetlany jest tylko aktualny stan z bazy danych
- Pole `updated_at` w tabeli `receipts` śledzi ostatnią modyfikację

Usuwanie paragonu:

- Potwierdzenie przez modal: "Czy na pewno chcesz usunąć ten paragon?"
- Przyciski: "Anuluj" i "Usuń"
- Po usunięciu użytkownik wraca do widoku miesięcznego
- Soft delete NIE jest implementowane w MVP (hard delete z bazy)

Kryteria akceptacji:

- Użytkownik może edytować wszystkie pola paragonu
- Można dodać minimum 1, maksimum nieograniczoną liczbę pozycji
- Każda pozycja może być edytowana lub usunięta
- Suma paragonu aktualizuje się automatycznie po zmianie cen
- Data w przyszłości jest zablokowana z komunikatem walidacyjnym
- Paragon bez pozycji nie może być zapisany
- Usunięcie paragonu wymaga potwierdzenia
- Po zapisaniu użytkownik wraca do widoku miesięcznego
- Zmiany są natychmiast widoczne na wykresie i liście

### 3.6 Widok miesięczny (główny ekran)

Wymóg: Centralne miejsce do przeglądania wydatków z wybranego miesiąca w formie wizualizacji i listy paragonów

Struktura widoku (dwusegmentowa):

Segment 1 - Górna część: Wykres donut

- Wizualizacja wydatków podzielona na kategorie
- Każdy segment wykresu w kolorze przypisanym do kategorii
- Środek wykresu (domyślnie): suma wszystkich wydatków z miesiąca
- Po najechaniu/kliknięciu na segment: kwota wydatków dla tej kategorii
- Nie pokazujemych pustych kategorii (0 PLN) na wykresie

Segment 2 - Dolna część: Lista paragonów

- Wszystkie paragony z wybranego miesiąca załadowane jednorazowo
- Domyślne sortowanie: data zakupu malejąco (najnowsze na górze)
- Każdy element listy zawiera:
  - Nazwa sklepu/opis (jeśli podana) lub "Bez nazwy"
  - Data zakupu (format: DD.MM.YYYY)
  - Suma paragonu (format: XX.XX PLN)
  - Ikona ">" wskazująca możliwość rozwinięcia
- Kliknięcie w paragon otwiera widok szczegółów/edycji

Nawigacja między miesiącami:

- Header z nazwą aktualnego miesiąca (format: "Styczeń 2025")
- Strzałki nawigacyjne < > po bokach nazwy miesiąca
- Kliknięcie "<" przełącza na poprzedni miesiąc
- Kliknięcie ">" przełącza na następny miesiąc
- Nie ma limitu cofania się wstecz
- Bieżący miesiąc jest ostatnim dostępnym (nie można przejść do przyszłych miesięcy)
- Ikona powrotu do aktualnego miesiąca

Domyślny widok:

- Po zalogowaniu użytkownik widzi bieżący miesiąc
- Brak dedykowanego onboardingu
- Dla nowych użytkowników: empty state z grafiką i przyciskiem "Dodaj pierwszy paragon"

Szczegóły implementacji:

- Wykres: Biblioteka Chart.js lub Recharts (React)
- Dane do wykresu: endpoint `/api/stats/monthly?month=2025-01`
- Dane do listy: endpoint `/api/receipts?month=2025-01`
- Wszystkie paragony załadowane jednorazowo (brak paginacji w MVP)
- FAB (Floating Action Button) widoczny przez cały czas

Kryteria akceptacji:

- Wykres donut wyświetla wszystkie kategorie z wydatkami >0 PLN
- Suma w środku wykresu jest poprawna (suma wszystkich kategorii)
- Po hover/click na segment wyświetla się kwota dla kategorii
- Lista paragonów jest posortowana od najnowszych
- Można przełączać się między miesiącami za pomocą strzałek
- Header pokazuje poprawną nazwę miesiąca
- Pusty miesiąc wyświetla komunikat empty state
- Kliknięcie na paragon otwiera ekran szczegółów
- FAB jest widoczny i funkcjonalny

### 3.7 Progresywna Aplikacja Webowa (PWA)

Wymóg: Możliwość instalacji aplikacji na urządzeniu mobilnym i desktopowym jako standalone app

Funkcjonalności PWA:

- Możliwość dodania do ekranu głównego (iOS/Android/Desktop)
- App-like experience po instalacji (ukryty pasek adresu przeglądarki)
- Ikona aplikacji na ekranie głównym urządzenia
- Splash screen podczas uruchamiania
- Responsywny design dostosowany do różnych rozdzielczości

Szczegóły implementacji:

- Web App Manifest (`manifest.json` lub `manifest.webmanifest`):
  - name: "PortfelIO"
  - short_name: "PortfelIO"
  - description: "Automatyczne śledzenie wydatków"
  - start_url: "/"
  - display: "standalone"
  - background_color: "#ffffff"
  - theme_color: "#your-brand-color"
  - icons: 192x192, 512x512 (PNG)
- Service Worker dla podstawowej funkcjonalności PWA
- Zachęta do instalacji PWA wyświetlana podczas oczekiwania na analizę AI

Ograniczenia MVP:

- Brak wsparcia dla trybu offline
- Aplikacja wymaga stałego połączenia internetowego
- Brak synchronizacji danych w tle
- Service Worker używany tylko do instalacji PWA, nie do cache'owania

Kryteria akceptacji:

- Aplikacja może być zainstalowana na iOS (Safari), Android (Chrome), Desktop (Chrome/Edge)
- Po instalacji aplikacja otwiera się w trybie standalone
- Ikona aplikacji jest widoczna na ekranie głównym
- Manifest zawiera wszystkie wymagane pola
- Podczas analizy AI wyświetlana jest zachęta do instalacji PWA (dla niezainstalowanych)
- Aplikacja wyświetla komunikat o braku połączenia gdy użytkownik jest offline

### 3.8 Responsywny design (RWD)

Wymóg: Pełne wsparcie dla urządzeń mobilnych, tabletów i desktopów z optymalizacją dla mobile-first

Breakpointy (Tailwind CSS):

- Mobile: <640px (sm)
- Tablet: 640px-1024px (md/lg)
- Desktop: >1024px (xl)

Dostosowania mobile:

- Bottom sheet dla dodawania paragonu
- Większe przyciski touch-friendly (min 44x44px)
- Uproszczona nawigacja (header + FAB)
- Wykres donut responsywny do szerokości ekranu
- Lista paragonów z gestami swipe (opcjonalnie)

Dostosowania desktop:

- Modal zamiast bottom sheet
- Sidebar do nawigacji (opcjonalnie w przyszłości)
- Większy wykres z dodatkowymi informacjami
- Hover states dla interaktywnych elementów

Kryteria akceptacji:

- Aplikacja jest w pełni funkcjonalna na ekranach 320px-2560px
- Wszystkie elementy są touch-friendly na mobile (min 44x44px)
- Tekst jest czytelny bez zoomowania
- Wykres i lista dostosowują się do szerokości ekranu
- Bottom sheet/modal odpowiednio wyświetlane na mobile/desktop

## 4. Granice produktu

### 4.1 Co NIE jest częścią MVP

Funkcje budżetowe:

- Ustawianie limitów wydatków na kategorie
- Alerty i powiadomienia o przekroczeniu budżetu
- Cele oszczędnościowe
- Porównanie wydatków między miesiącami
- Prognozy wydatków

Zarządzanie kategoriami:

- Tworzenie własnych kategorii przez użytkownika
- Edycja nazw i ikon kategorii
- Usuwanie lub ukrywanie kategorii
- Subkategorie lub zagnieżdżone kategorie

Funkcje społecznościowe i współdzielenie:

- Współdzielenie konta z innymi użytkownikami (rodzina, współlokatorzy)
- Udostępnianie raportów wydatków
- Komentarze lub notatki do paragonów

Zaawansowane raporty i analizy:

- Wykresy trendów (liniowe, słupkowe)
- Porównania międzyokresowe
- Eksport danych do CSV/PDF
- Szczegółowe raporty wydatków
- Statystyki i insights (np. "Wydajesz o 20% więcej na transport")

Funkcje związane z paragonami:

- Przechowywanie zdjęć paragonów po analizie
- Śledzenie gwarancji produktów
- Przypomnienia o terminach zwrotów
- Integracja z programami lojalnościowymi
- OCR dla paragonów elektronicznych (e-paragony)

Integracje zewnętrzne:

- Połączenie z kontem bankowym
- Automatyczne importowanie transakcji
- Integracja z innymi aplikacjami finansowymi

Zaawansowane funkcje PWA:

- Tryb offline (brak synchronizacji danych w tle)
- Push notifications
- Udostępnianie przez Web Share API
- Background sync

Inne:

- Multi-language support (tylko polski w MVP)
- Multi-currency support (tylko PLN)
- Różne typy paragonów (tylko fiskalne polskie)
- Historia zmian paragonu (audit log)
- Kosz (soft delete) dla usuniętych paragonów
- Możliwość przywracania usuniętych danych

### 4.2 Ograniczenia techniczne MVP

Obsługa paragonów:

- Tylko polskie paragony fiskalne (format krajowy)
- Tylko obrazy JPEG i PNG (max 10MB)
- Brak walidacji duplikatów paragonów
- Dowolna liczba paragonów może być dodana dla tej samej daty
- Brak limitu liczby paragonów na użytkownika

Zarządzanie danymi:

- Brak eksportu danych
- Brak importu danych z innych źródeł
- Brak kopii zapasowych inicjowanych przez użytkownika
- Hard delete dla usuniętych paragonów (bez możliwości przywrócenia)

Autentykacja:

- Tylko email + hasło (brak OAuth, social login)
- Brak dwuskładnikowej autentykacji (2FA)
- Wykorzystanie standardowej funkcji resetowania hasła Supabase (bez customizacji)
- Możliwość usunięcia konta

Performance:

- Wszystkie paragony z miesiąca załadowane jednorazowo (brak paginacji)
- Brak optymalizacji dla użytkowników z >100 paragonami/miesiąc
- Brak lazy loading dla listy paragonów

Platforma:

- Brak natywnych aplikacji mobilnych (tylko PWA)
- Wymaga nowoczesnej przeglądarki z obsługą ES6+
- Wymaga stałego połączenia internetowego

### 4.3 Przyszłe rozszerzenia (Post-MVP)

Priorytet wysoki:

- Tryb offline z synchronizacją
- Budżety i limity na kategorie
- Własne kategorie użytkownika
- Wykresy trendów i porównania międzyokresowe
- Eksport danych do CSV

Priorytet średni:

- Współdzielenie konta (family mode)
- Śledzenie gwarancji
- Push notifications
- Multi-language support
- Historia zmian paragonu

Priorytet niski:

- Integracja z kontem bankowym
- Programy lojalnościowe
- E-paragony (paragony elektroniczne)
- Social login (Google, Apple)
- Natywne aplikacje mobilne

## 5. Historyjki użytkowników

### US-001: Rejestracja nowego konta

Jako nowy użytkownik
Chcę założyć konto w aplikacji
Aby móc bezpiecznie przechowywać swoje dane o wydatkach

Kryteria akceptacji:

- Formularz rejestracji zawiera pola: email, hasło, powtórz hasło
- System waliduje format email (@ i domena)
- System waliduje siłę hasła w czasie rzeczywistym:
  - Minimum 8 znaków
  - Co najmniej 1 mała litera
  - Co najmniej 1 duża litera
  - Co najmniej 1 cyfra
  - Co najmniej 1 znak specjalny
- Przy niezgodności haseł wyświetlany jest komunikat "Hasła nie są identyczne"
- Po pomyślnej rejestracji użytkownik jest automatycznie zalogowany
- Użytkownik jest przekierowywany do głównego widoku aplikacji (widok miesięczny)
- Dla istniejącego email wyświetlany jest komunikat "Konto z tym adresem już istnieje"

### US-002: Logowanie do aplikacji

Jako zarejestrowany użytkownik
Chcę zalogować się do aplikacji
Aby uzyskać dostęp do moich zapisanych paragonów i wydatków

Kryteria akceptacji:

- Formularz logowania zawiera pola: email, hasło
- Przycisk "Zaloguj" jest aktywny po wypełnieniu obu pól
- Po poprawnym zalogowaniu użytkownik jest przekierowywany do widoku miesięcznego
- Przy błędnych danych wyświetlany jest komunikat "Nieprawidłowy email lub hasło"
- Link "Nie masz konta? Zarejestruj się" kieruje do formularza rejestracji
- Link do resetu hasła
- Po zamknięciu przeglądarki sesja nie wygasa

### US-003: Przeglądanie wydatków z bieżącego miesiąca

Jako użytkownik z zapisanymi paragonami
Chcę zobaczyć podsumowanie moich wydatków z bieżącego miesiąca
Aby szybko ocenić, na co wydaję najwięcej pieniędzy

Kryteria akceptacji:

- Po zalogowaniu widoczny jest widok miesięczny dla bieżącego miesiąca
- Wykres donut wyświetla podział wydatków na kategorie
- Każdy segment wykresu ma inny kolor odpowiadający kategorii
- W środku wykresu wyświetlana jest suma wszystkich wydatków (format: "1,234.56 PLN")
- Pod wykresem znajduje się lista wszystkich paragonów z miesiąca
- Lista jest posortowana od najnowszych (data malejąco)
- Każdy element listy zawiera: nazwę sklepu, datę i sumę paragonu
- Header wyświetla nazwę miesiąca (np. "Styczeń 2025")

### US-004: Robienie zdjęcia paragonu aparatem

Jako użytkownik mobilny
Chcę zrobić zdjęcie paragonu aparatem telefonu
Aby szybko dodać wydatki bez ręcznego wpisywania

Kryteria akceptacji:

- Po wybraniu opcji "Zrób zdjęcie" otwiera się natywny aparat urządzenia
- Użytkownik może zrobić zdjęcie paragonu
- Po zrobieniu zdjęcia użytkownik może je zaakceptować lub powtórzyć
- Po zaakceptowaniu zdjęcia wyświetla się loader z komunikatem "Analizuję paragon..."
- Podczas oczekiwania wyświetlana jest zachęta do instalacji PWA (dla niezainstalowanych)
- Po maksymalnie 60 sekundach użytkownik widzi ekran edycji z rozpoznanymi danymi
- W przypadku błędu analizy wyświetlany jest komunikat z opcją ponownego zdjęcia

### US-005: Wybieranie zdjęcia paragonu z galerii

Jako użytkownik
Chcę przesłać zdjęcie paragonu z galerii lub systemu plików
Aby dodać paragon, którego zdjęcie zrobiłem wcześniej

Kryteria akceptacji:

- Po wybraniu opcji "Wybierz z galerii" otwiera się natywny file picker
- Użytkownik może wybrać plik JPEG lub PNG z urządzenia
- System akceptuje tylko pliki JPEG i PNG do 10MB
- Dla plików przekraczających 10MB wyświetlany jest komunikat "Plik jest za duży (max 10MB)"
- Dla nieobsługiwanych formatów: komunikat "Niewspierany format pliku (tylko JPEG, PNG)"
- Po wybraniu prawidłowego pliku wyświetla się loader "Analizuję paragon..."
- Po maksymalnie 60 sekundach użytkownik widzi ekran edycji z rozpoznanymi danymi

### US-006: Analiza paragonu przez AI

Jako użytkownik, który przesłał zdjęcie paragonu
Chcę aby system automatycznie rozpoznał pozycje z paragonu
Aby zaoszczędzić czas na ręcznym wpisywaniu danych

Kryteria akceptacji:

- Zdjęcie jest przesyłane do endpointu `/api/receipts/scan`
- System analizuje paragon za pomocą OpenAI GPT-4 Vision/GPT-4o
- Podczas analizy wyświetlany jest loader z komunikatem "Analizuję paragon..."
- Maksymalny czas oczekiwania: 60 sekund
- Po analizie system rozpoznaje:
  - Data zakupu
  - Nazwa sklepu (jeśli czytelna)
  - Lista pozycji (nazwa, cena)
  - Kategoria dla każdej pozycji
- Po zakończeniu analizy użytkownik jest przekierowywany do ekranu edycji
- Zdjęcie paragonu NIE jest zapisywane w bazie danych

### US-007: Obsługa błędów analizy AI

Jako użytkownik, którego paragon nie został rozpoznany poprawnie
Chcę otrzymać czytelny komunikat o błędzie i możliwość ponowienia próby
Aby móc dodać paragon pomimo problemów z rozpoznawaniem

Kryteria akceptacji:

- Po timeout (60s) wyświetlany jest komunikat "Analiza trwa zbyt długo. Spróbuj ponownie."
- Dla nieczytelnego paragonu: komunikat "Nie udało się rozpoznać paragonu. Dodaj ręcznie lub zrób lepsze zdjęcie."
- Przyciski: "Spróbuj ponownie" i "Dodaj ręcznie"
- "Spróbuj ponownie" otwiera ponownie menu dodawania (zdjęcie/galeria)
- "Dodaj ręcznie" otwiera formularz ręcznego dodawania
- Dla częściowo rozpoznanego paragonu użytkownik otrzymuje rozpoznane dane do edycji
- W przypadku błędu sieciowego: komunikat "Brak połączenia z internetem"

### US-008: Weryfikacja i edycja rozpoznanego paragonu

Jako użytkownik, który otrzymał wyniki analizy AI
Chcę zweryfikować i poprawić rozpoznane dane przed zapisaniem
Aby upewnić się, że moje wydatki są dokładnie zarejestrowane

Kryteria akceptacji:

- Po analizie AI wyświetlany jest ekran edycji z formularzem
- Formularz zawiera pola:
  - Data zakupu (date picker, prefilled z AI)
  - Nazwa sklepu (text input, prefilled jeśli rozpoznana, opcjonalne)
  - Lista pozycji (każda z: nazwa, cena, kategoria)
- Każda pozycja jest edytowalna w linii (inline editing)
- Dropdown kategorii pokazuje wszystkie 9 kategorii z ikonami emoji
- Suma paragonu jest automatycznie przeliczana przy zmianie cen
- Przycisk "Zapisz" na dole formularza
- Przycisk "Anuluj" anuluje dodawanie i wraca do widoku miesięcznego

### US-009: Zapisanie paragonu po edycji

Jako użytkownik, który zweryfikował dane paragonu
Chcę zapisać paragon do swojego portfela
Aby móc śledzić te wydatki

Kryteria akceptacji:

- Przycisk "Zapisz" jest aktywny gdy wszystkie pola są poprawnie wypełnione
- Walidacja przed zapisaniem:
  - Co najmniej jedna pozycja
  - Wszystkie pozycje mają nazwę, cenę i kategorię
  - Data nie jest w przyszłości
- Po kliknięciu "Zapisz" dane są wysyłane do endpointu `/api/receipts`
- Wyświetla się komunikat "Zapisywanie..."
- Po pomyślnym zapisaniu użytkownik wraca do widoku miesięcznego
- Nowy paragon jest widoczny na liście
- Wykres donut aktualizuje się z nowymi danymi
- W przypadku błędu zapisu wyświetla się komunikat "Nie udało się zapisać. Spróbuj ponownie."

### US-010: Ręczne dodawanie paragonu

Jako użytkownik
Chcę ręcznie wprowadzić dane paragonu
Aby dodać wydatek bez robienia zdjęcia

Kryteria akceptacji:

- Po wybraniu opcji "Dodaj ręcznie" z FAB otwiera się pusty formularz
- Formularz zawiera pola:
  - Data zakupu (date picker, domyślnie: dzisiaj)
  - Nazwa sklepu (text input, opcjonalne)
  - Przycisk "+ Dodaj pozycję"
- Użytkownik musi dodać minimum jedną pozycję przed zapisaniem
- Każda pozycja wymaga: nazwa, cena, kategoria
- Suma paragonu jest automatycznie przeliczana
- Przycisk "Zapisz" jest aktywny po dodaniu minimum 1 pozycji
- Po zapisaniu użytkownik wraca do widoku miesięcznego

### US-011: Przeglądanie szczegółów zapisanego paragonu

Jako użytkownik z zapisanymi paragonami
Chcę zobaczyć szczegóły konkretnego paragonu
Aby sprawdzić, co kupiłem w tym sklepie

Kryteria akceptacji:

- Z listy paragonów użytkownik może kliknąć dowolny paragon
- Otwiera się ekran szczegółów paragonu
- Ekran pokazuje:
  - Data zakupu
  - Nazwa sklepu (lub "Bez nazwy")
  - Lista wszystkich pozycji (nazwa, cena, kategoria z ikoną)
  - Suma paragonu na dole
- Przycisk "Edytuj" przełącza w tryb edycji
- Przycisk "Wstecz" wraca do listy paragonów
- Ikona kosza do usunięcia paragonu

### US-012: Edycja istniejącego paragonu

Jako użytkownik przeglądający szczegóły paragonu
Chcę edytować zapisany paragon
Aby poprawić błędne dane

Kryteria akceptacji:

- Przycisk "Edytuj" zmienia widok szczegółów w tryb edycji
- Wszystkie pola stają się edytowalne (data, nazwa sklepu, pozycje)
- Można dodawać, edytować i usuwać pozycje
- Suma paragonu aktualizuje się automatycznie
- Przycisk "Zapisz zmiany" zapisuje edycję
- Przycisk "Anuluj" przywraca oryginalny stan (wymaga potwierdzenia przy zmianach)
- Po zapisaniu użytkownik wraca do widoku miesięcznego
- Zmiany są natychmiast widoczne na wykresie i liście

### US-013: Usuwanie paragonu

Jako użytkownik
Chcę usunąć błędnie dodany lub niepotrzebny paragon
Aby mieć czystą listę wydatków

Kryteria akceptacji:

- Ikona kosza jest widoczna w widoku szczegółów paragonu
- Kliknięcie ikony kosza wyświetla modal potwierdzenia
- Modal zawiera komunikat: "Czy na pewno chcesz usunąć ten paragon?"
- Przyciski: "Anuluj" i "Usuń"
- Po kliknięciu "Usuń" paragon jest usuwany z bazy danych (hard delete)
- Użytkownik wraca do widoku miesięcznego
- Wykres i lista aktualizują się automatycznie
- Usunięty paragon znika z listy
- Nie ma możliwości przywrócenia usuniętego paragonu

### US-014: Reset hasła

Jako użytkownik, który zapomniał hasła
Chcę zresetować hasło do mojego konta
Aby odzyskać dostęp do aplikacji

Kryteria akceptacji:

- Link "Zapomniałeś hasła?" jest widoczny na stronie logowania
- Po kliknięciu linku użytkownik jest przekierowywany do formularza resetu hasła
- Formularz zawiera pole na adres email
- Po wprowadzeniu email i kliknięciu "Wyślij link" system wysyła wiadomość z linkiem resetującym
- Komunikat potwierdzenia: "Link do resetu hasła został wysłany na podany adres email"
- Email zawiera link ważny przez 24 godziny
- Po kliknięciu linku użytkownik jest przekierowywany do formularza nowego hasła
- Nowe hasło musi spełniać te same wymagania co przy rejestracji (min 8 znaków, litery, cyfry, znaki specjalne)
- Po pomyślnej zmianie hasła użytkownik jest przekierowywany do strony logowania z komunikatem "Hasło zostało zmienione"
- Wykorzystuje standardową funkcjonalność Supabase Auth

### US-015: Usuwanie konta

Jako użytkownik
Chcę usunąć moje konto i wszystkie dane
Aby zaprzestać korzystania z aplikacji i usunąć moje informacje

Kryteria akceptacji:

- Opcja "Usuń konto" jest dostępna w menu użytkownika lub ustawieniach
- Po kliknięciu "Usuń konto" wyświetlany jest modal z ostrzeżeniem
- Komunikat ostrzegawczy: "Czy na pewno chcesz usunąć konto? Ta operacja jest nieodwracalna. Wszystkie twoje paragony i dane zostaną trwale usunięte."
- Użytkownik musi potwierdzić usunięcie wpisując swoje hasło
- Przyciski: "Anuluj" i "Usuń konto na zawsze"
- Po potwierdzeniu wszystkie dane użytkownika są usuwane z bazy danych:
  - Konto użytkownika (tabela auth.users)
  - Wszystkie paragony użytkownika (tabela receipts)
  - Wszystkie pozycje paragonów (tabela receipt_items)
- Użytkownik jest wylogowany i przekierowywany do strony logowania
- Komunikat: "Twoje konto zostało usunięte"
- Brak możliwości przywrócenia konta lub danych po usunięciu

## 6. Metryki sukcesu

### 6.1 Metryki produktowe (KPI)

Metryka 1: Adoption rate skanowania paragonów

- Cel: 80% nowo dodanych paragonów jest dodawanych za pomocą funkcji skanowania (nie ręcznie)
- Pomiar: `(liczba paragonów dodanych przez skan / całkowita liczba paragonów) × 100`
- Źródło danych: Tabela `receipts`, pole `source` (enum: 'scan', 'manual')
- Częstotliwość pomiaru: Co tydzień
- Odpowiedzialny: Product Manager
- Uzasadnienie: Główną wartością produktu jest automatyzacja przez AI, więc wysoka adopcja skanowania wskazuje na sukces core value proposition

Metryka 2: Aktywni użytkownicy (Engagement)

- Cel: 60% użytkowników dodaje co najmniej 4 paragony w miesiącu
- Pomiar: `(użytkownicy z ≥4 paragonami w miesiącu / wszyscy zarejestrowani użytkownicy) × 100`
- Źródło danych: Zapytanie SQL grupujące paragony po `user_id` i miesiącu
- Częstotliwość pomiaru: Co miesiąc
- Odpowiedzialny: Product Manager
- Uzasadnienie: 4 paragony/miesiąc to minimalny próg regularnego użytkowania (średnio 1/tydzień), wskazujący na retencję i wartość dla użytkownika
