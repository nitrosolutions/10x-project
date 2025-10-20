# Architektura UI dla PortfelIO

## 1. Przegląd struktury UI

Interfejs użytkownika oparty jest na Astro 5 i React, z wykorzystaniem komponentów shadcn/ui. Projekt jest wdrożony jako progresywna aplikacja webowa (PWA) o responsywnym designie. Główne widoki są zabezpieczone mechanizmami autoryzacji (JWT) oraz zarządzane za pomocą wbudowanych hooków React i Context. Dane pobierane są dynamicznie przez API, a kluczowe informacje prezentowane są za pomocą interaktywnych komponentów, takich jak wykresy czy listy paragonów.

## 2. Lista widoków

- **Ekran Logowania**
  - **Ścieżka widoku:** `/login`
  - **Główny cel:** Umożliwienie użytkownikowi zalogowania się do aplikacji.
  - **Kluczowe informacje:** Formularz logowania (email, hasło), linki do rejestracji i resetu hasła.
  - **Kluczowe komponenty:** Inputy, przycisk logowania, komunikaty walidacyjne.
  - **UX, dostępność i aspekty bezpieczeństwa:** Intuicyjny i responsywny formularz z wyraźnymi komunikatami błędów; pola poprawnie oznaczone dla czytników ekranu; komunikacja zabezpieczona przez Supabase JWT.

- **Ekran Rejestracji**
  - **Ścieżka widoku:** `/register`
  - **Główny cel:** Umożliwienie tworzenia nowego konta.
  - **Kluczowe informacje:** Formularz rejestracji z inputami dla email, hasła i potwierdzenia hasła; wyraźne komunikaty walidacyjne.
  - **Kluczowe komponenty:** Formularz, inputy, przycisk rejestracji.
  - **UX, dostępność i bezpieczeństwo:** Prosty proces rejestracji z walidacją siły hasła; responsywny design; zabezpieczenia po stronie serwera i klienta.

- **Widok Miesięczny (Dashboard)**
  - **Ścieżka widoku:** `/dashboard`
  - **Główny cel:** Przedstawienie przeglądu wydatków za dany miesiąc.
  - **Kluczowe informacje:** Wykres donut prezentujący podział wydatków, lista paragonów posortowanych malejąco (od najnowszych).
  - **Kluczowe komponenty:** Komponent wykresu (Recharts), lista paragonów, nagłówek z nazwą miesiąca i przyciski nawigacyjne dla zmiany miesiąca. FAB (Floating Action Button), bottom sheet z wyborem metody dodania paragonu.
  - **UX, dostępność i bezpieczeństwo:** Interaktywność wykresu (hover, kliknięcia); wsparcie dla urządzeń dotykowych i klawiaturowych; dane zabezpieczone autoryzacją i dynamicznie ładowane.

- **Widok Dodawania Paragonu (Manualny)**
  - **Ścieżka widoku:** `/receipts/new`
  - **Główny cel:** Umożliwienie ręcznego dodania paragonu.
  - **Kluczowe informacje:** Formularz zawierający datę zakupu, opcjonalną nazwę sklepu oraz listę pozycji (nazwa produktu, cena, dropdown z kategoriami).
  - **Kluczowe komponenty:** Date picker, inputy, przycisk "+ Dodaj pozycję", przycisk "Zapisz".
  - **UX, dostępność i bezpieczeństwo:** Formularz z natychmiastową walidacją (np. data nie w przyszłości, co najmniej jedna pozycja); responsywny design bottom sheet; zabezpieczenie komunikacji przez API.

- **Widok Dodawania Paragonu (Ze zdjęcia)**
  - **Ścieżka widoku:** `/receipts/scan`
  - **Główny cel:** Umożliwienie dodania paragonu poprzez zrobienie zdjęcia lub wybór pliku z galerii.
  - **Kluczowe informacje:** Panel wyboru metody (aparat, galeria), komunikat "Analizuję paragon..." w trybie loadera, wyniki analizy przekierowujące do ekranu edycji.
  - **Kluczowe komponenty:** Loader z buttonem instalacji PWA, komponent prezentujący wyniki analizy.
  - **UX, dostępność i bezpieczeństwo:** Dostęp do metod dodania paragonu ze zdjęcia lub galerii; jasny komunikat statusu; walidacja formatu pliku (JPEG/PNG i max 10MB); timeout analizy (60 sekund).

- **Widok Edycji Paragonu**
  - **Ścieżka widoku:** `/receipts/:receiptId/edit`
  - **Główny cel:** Umożliwienie edycji istniejącego paragonu.
  - **Kluczowe informacje:** Formularz edycji zawierający datę, nazwę sklepu i listę pozycji, z dynamiczną aktualizacją sumy paragonu.
  - **Kluczowe komponenty:** Inputy, dropdowny (dla kategorii), przyciski "Zapisz" oraz "Anuluj", modal potwierdzenia usunięcia pozycji.
  - **UX, dostępność i bezpieczeństwo:** Edycja inline umożliwiająca szybkie modyfikacje; komunikaty walidacyjne; potwierdzanie działań krytycznych (np. usunięcia paragonu).

- **Widok Szczegółów Paragonu**
  - **Ścieżka widoku:** `/receipts/:receiptId`
  - **Główny cel:** Prezentacja pełnych informacji o wybranym paragonie.
  - **Kluczowe informacje:** Data zakupu, nazwa sklepu, lista pozycji, suma paragonu, przyciski akcji (edytuj, usuń).
  - **Kluczowe komponenty:** Karta szczegółów, przyciski nawigacyjne, modal do potwierdzenia usunięcia.
  - **UX, dostępność i bezpieczeństwo:** Czytelna prezentacja danych; możliwość łatwego powrotu do listy; zabezpieczenie przed przypadkową modyfikacją lub usunięciem.

- **Widok Resetu Hasła**
  - **Ścieżka widoku:** `/reset-password`
  - **Główny cel:** Umożliwienie użytkownikowi resetu hasła.
  - **Kluczowe informacje:** Formularz podania adresu email oraz komunikat potwierdzający wysłanie linku resetującego.
  - **Kluczowe komponenty:** Input, przycisk wysyłki, komunikaty statusu.
  - **UX, dostępność i bezpieczeństwo:** Prosty, intuicyjny interfejs; zabezpieczenie danych użytkownika; poprawne wsparcie dla czytników ekranu.

- **Widok Ustawień/Usuwania Konta**
  - **Ścieżka widoku:** `/settings`
  - **Główny cel:** Zarządzanie kontem, w tym opcja usunięcia konta.
  - **Kluczowe informacje:** Formularz ustawień, opcje edycji profilu, przycisk usunięcia konta wraz z modalem potwierdzenia.
  - **Kluczowe komponenty:** Formularze, modal potwierdzenia, input do weryfikacji hasła.
  - **UX, dostępność i bezpieczeństwo:** Przejrzysty interfejs zarządzania kontem; wyraźne ostrzeżenia; potwierdzenie krytycznych operacji (usunięcie konta).

## 3. Mapa podróży użytkownika

1. **Autoryzacja:**
   - Użytkownik odwiedza stronę logowania lub rejestracji.
   - Po ukończeniu procesu autoryzacji zostaje przekierowany do widoku Miesięcznego.
2. **Przegląd wydatków:**
   - Na dashboardzie użytkownik przegląda wykres wydatków oraz listę paragonów.
   - Nawigacja między miesiącami odbywa się za pomocą przycisków strzałek.
3. **Dodawanie nowego paragonu:**
   - Użytkownik naciska FAB, który otwiera bottom sheet z wyborem metody dodania (zdjęcie lub ręczne).
   - W przypadku dodawania zdjęciem, użytkownik wykonuje zdjęcie lub wybiera plik, otrzymuje komunikat loadera, a następnie przechodzi do edycji paragonu.
   - W przypadku dodawania ręcznego, użytkownik wypełnia formularz i zapisuje dane.
4. **Edycja i zarządzanie paragonem:**
   - Wybierając konkretny paragon z listy, użytkownik przechodzi do widoku szczegółów.
   - Z widoku szczegółów może przejść do edycji lub usunięcia paragonu.
5. **Zarządzanie kontem:**
   - Użytkownik przechodzi do ustawień, gdzie może dokonać zmian w koncie, zresetować hasło lub usunąć konto (po potwierdzeniu).

## 4. Układ i struktura nawigacji

- **Główna nawigacja:** Umieszczona w nagłówku z elementami odsyłającymi do Dashboardu, Dodawania Paragonu i Ustawień.
- **Nawigacja po miesiącach:** Widoczna w nagłówku Dashboardu, z przyciskami strzałek umożliwiającymi przełączanie między miesiącami.
- **FAB (Floating Action Button):** Stały przycisk w prawym dolnym rogu, umożliwiający szybkie dodanie nowego paragonu.
- **Menu mobilne:** Ikona hamburgera lub rozwijane menu dla łatwego dostępu do ustawień i dodatkowych opcji na urządzeniach mobilnych.

## 5. Kluczowe komponenty

- **Formularze autoryzacyjne:** Zarządzające procesami logowania, rejestracji i resetu hasła.
- **Komponent wykresu:** Do wizualizacji danych wydatków (wykres donut) z obsługą interakcji.
- **Lista paragonów:** Prezentująca paragon w formie karty, umożliwiająca wybór do edycji lub szczegółowego przeglądu.
- **Bottom sheet:** Używane przy dodawaniu paragonu, potwierdzaniu akcji (np. usunięcia) oraz wyborze metody dodania.
- **Komponenty Input i Dropdown:** Dla wprowadzania danych paragonu z natychmiastową walidacją (m.in. data, cena, kategorie).
- **Loader i komunikaty błędów:** Informujące o statusie operacji, np. podczas przetwarzania zdjęcia, walidacji formularzy.
