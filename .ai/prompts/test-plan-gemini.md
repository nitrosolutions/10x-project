# Plan Testów dla Aplikacji "PortfelIO"

## 1. Wprowadzenie i cele testowania

### 1.1 Wprowadzenie
Niniejszy dokument opisuje plan testów dla aplikacji webowej "PortfelIO". Aplikacja ta jest narzędziem do zarządzania finansami osobistymi, którego kluczową funkcjonalnością jest automatyczne śledzenie wydatków poprzez skanowanie paragonów fiskalnych przy użyciu sztucznej inteligencji. Projekt jest zbudowany w oparciu o nowoczesny stos technologiczny, w tym Astro, React, Supabase oraz Google Gemini AI.

### 1.2 Cele testowania
Główne cele procesu testowania to:
*   **Weryfikacja funkcjonalna:** Zapewnienie, że wszystkie funkcje aplikacji działają zgodnie z założeniami, w tym uwierzytelnianie, zarządzanie paragonami, skanowanie i generowanie statystyk.
*   **Zapewnienie jakości:** Identyfikacja i eliminacja błędów w celu dostarczenia stabilnego i niezawodnego produktu.
*   **Weryfikacja bezpieczeństwa:** Upewnienie się, że dane użytkowników są chronione, a dostęp do zasobów jest prawidłowo autoryzowany.
*   **Ocena użyteczności:** Sprawdzenie, czy interfejs użytkownika jest intuicyjny, responsywny i dostępny na różnych urządzeniach.
*   **Weryfikacja integracji:** Potwierdzenie poprawnej komunikacji z usługami zewnętrznymi, takimi jak Supabase i Gemini AI.

## 2. Zakres testów

### 2.1 Funkcjonalności objęte testami (In-Scope)
*   Moduł uwierzytelniania i zarządzania kontem użytkownika.
*   Pełen cykl życia paragonu (tworzenie, odczyt, aktualizacja, usuwanie - CRUD).
*   Funkcjonalność skanowania paragonów z użyciem aparatu i galerii.
*   Proces analizy obrazu przez AI i parsowania danych.
*   Panel główny (Dashboard) z listą paragonów i nawigacją miesięczną.
*   Moduł statystyk z wizualizacją danych.
*   Responsywność interfejsu użytkownika (RWD).
*   Funkcjonalność PWA (Progressive Web App), w tym proces instalacji.
*   Wszystkie endpointy API.

### 2.2 Funkcjonalności wyłączone z testów (Out-of-Scope)
*   Testy obciążeniowe na dużą skalę (ponad 100 jednoczesnych użytkowników).
*   Szczegółowe testy penetracyjne (zakładamy bezpieczeństwo zapewniane przez Supabase, weryfikujemy tylko logikę autoryzacji).
*   Testowanie wewnętrznej logiki modelu Gemini AI (testujemy tylko integrację i obsługę jego odpowiedzi).
*   Testy kompatybilności z niszowymi lub przestarzałymi przeglądarkami (np. Internet Explorer).

## 3. Typy testów do przeprowadzenia

W celu kompleksowego pokrycia aplikacji, przeprowadzone zostaną następujące typy testów:

*   **Testy jednostkowe (Unit Tests):**
    *   **Cel:** Weryfikacja poprawności działania pojedynczych funkcji, komponentów i modułów w izolacji.
    *   **Zakres:** Funkcje pomocnicze (`/lib/utils/`), schematy walidacji Zod (`/lib/schemas/`), proste komponenty React (np. `MonthNavigator`, `EmptyState`), serwisy z zamockowanymi zależnościami (`receiptService`, `statsService`).

*   **Testy integracyjne (Integration Tests):**
    *   **Cel:** Sprawdzenie współpracy pomiędzy różnymi modułami aplikacji.
    *   **Zakres:** Testowanie endpointów API (`/pages/api/`) wraz z ich interakcją z warstwą serwisową i bazą danych (na testowej instancji Supabase). Testowanie komponentów React, które wykonują wywołania API (np. `DashboardView`, `ReceiptForm`).

*   **Testy End-to-End (E2E):**
    *   **Cel:** Symulacja pełnych scenariuszy użytkownika w przeglądarce w celu weryfikacji przepływu danych i interakcji w całej aplikacji.
    *   **Zakres:** Pełne ścieżki użytkownika, takie jak "rejestracja -> logowanie -> zeskanowanie paragonu -> weryfikacja na dashboardzie -> wylogowanie".

*   **Testy API:**
    *   **Cel:** Bezpośrednia weryfikacja kontraktu API (żądań i odpowiedzi) bez udziału interfejsu użytkownika.
    *   **Zakres:** Każdy endpoint w `src/pages/api/` zostanie przetestowany pod kątem poprawnych odpowiedzi (kody statusu, format danych) dla różnych danych wejściowych (przypadki pozytywne i negatywne).

*   **Testy wizualnej regresji:**
    *   **Cel:** Wykrywanie niezamierzonych zmian w wyglądzie interfejsu użytkownika.
    *   **Zakres:** Kluczowe komponenty z biblioteki UI (`/components/ui/`) oraz główne widoki aplikacji (Dashboard, formularze).

*   **Testy bezpieczeństwa (podstawowe):**
    *   **Cel:** Weryfikacja podstawowych mechanizmów bezpieczeństwa.
    *   **Zakres:** Sprawdzenie ochrony tras w `middleware`, weryfikacja, czy użytkownik A nie ma dostępu do danych użytkownika B, walidacja danych wejściowych w API.

*   **Testy użyteczności i dostępności (manualne):**
    *   **Cel:** Ocena, czy aplikacja jest łatwa w obsłudze i dostępna dla osób z niepełnosprawnościami.
    *   **Zakres:** Manualne przeglądy kluczowych widoków, testowanie nawigacji za pomocą klawiatury, weryfikacja kontrastu kolorów.

## 4. Scenariusze testowe dla kluczowych funkcjonalności

Poniżej przedstawiono wysokopoziomowe scenariusze testowe dla najważniejszych modułów aplikacji.

### 4.1 Moduł Uwierzytelniania i Zarządzania Kontem
*   **Rejestracja:** Pomyślna rejestracja z poprawnymi danymi; próba rejestracji z zajętym adresem e-mail; próba rejestracji z niepoprawnym formatem e-mail/hasła; próba rejestracji z różnymi hasłami.
*   **Logowanie:** Pomyślne logowanie z poprawnymi danymi; próba logowania z błędnym hasłem/e-mailem; przekierowanie na stronę główną po zalogowaniu.
*   **Wylogowywanie:** Pomyślne wylogowanie i przekierowanie na stronę logowania.
*   **Resetowanie hasła:** Poprawne wysłanie linku resetującego; obsługa nieistniejącego e-maila (bez ujawniania informacji); pomyślna zmiana hasła po kliknięciu w link.
*   **Usuwanie konta:** Wyświetlenie okna dialogowego z potwierdzeniem; walidacja hasła; pomyślne usunięcie konta i wszystkich powiązanych danych; wylogowanie użytkownika po usunięciu konta.

### 4.2 Moduł Zarządzania Paragonami
*   **Wyświetlanie paragonów:** Poprawne wyświetlanie listy paragonów dla bieżącego miesiąca; wyświetlanie komunikatu "Brak paragonów" (`EmptyState`); nawigacja do poprzedniego/następnego miesiąca i aktualizacja listy.
*   **Dodawanie paragonu (ręczne):** Pomyślne dodanie paragonu z pozycjami i bez; walidacja formularza (np. data z przyszłości, ujemna cena); poprawne obliczanie sumy; przekierowanie do widoku miesiąca po dodaniu.
*   **Edycja paragonu:** Poprawne załadowanie danych paragonu do formularza; pomyślna aktualizacja danych (zmiana daty, nazwy sklepu, dodanie/usunięcie/edycja pozycji); ponowne przeliczenie sumy.
*   **Usuwanie paragonu:** Wyświetlenie okna potwierdzenia; pomyślne usunięcie paragonu z listy po potwierdzeniu.

### 4.3 Moduł Skanowania Paragonów
*   **Przesyłanie obrazu:** Pomyślne przesłanie obrazu z aparatu i z galerii; odrzucenie pliku o nieobsługiwanym formacie (np. PDF); odrzucenie pliku o zbyt dużym rozmiarze (>10MB).
*   **Proces skanowania:** Wyświetlanie stanu ładowania podczas analizy; obsługa pomyślnego przetworzenia przez AI i przekierowanie do formularza edycji z wypełnionymi danymi; obsługa błędu ze strony AI i wyświetlenie stosownego komunikatu.

### 4.4 Moduł Statystyk
*   **Wyświetlanie wykresu:** Poprawne renderowanie wykresu z danymi dla bieżącego miesiąca; wyświetlanie komunikatu o braku danych, gdy nie ma paragonów; zgodność danych na wykresie z sumami wydatków w poszczególnych kategoriach.
*   **Suma całkowita:** Poprawne obliczenie i wyświetlenie sumy całkowitej wydatków w danym miesiącu.
*   **Aktualizacja statystyk:** Automatyczne odświeżenie statystyk po dodaniu, edycji lub usunięciu paragonu.

## 5. Środowisko testowe

*   **Sprzęt:** Testy będą prowadzone na komputerach stacjonarnych (Windows, macOS) oraz urządzeniach mobilnych (iOS, Android).
*   **Przeglądarki:** Google Chrome (najnowsza wersja), Mozilla Firefox (najnowsza wersja), Safari (najnowsza wersja).
*   **Baza danych:** Oddzielna instancja projektu Supabase przeznaczona do celów deweloperskich i testowych (staging), aby uniknąć modyfikacji danych produkcyjnych.
*   **Dane testowe:** Zestaw predefiniowanych użytkowników testowych z różnymi uprawnieniami (jeśli dotyczy), a także zestaw przykładowych obrazów paragonów (dobrej jakości, słabej jakości, z różnymi produktami).

## 6. Narzędzia do testowania

*   **Testy jednostkowe i integracyjne:** Vitest, React Testing Library
*   **Testy E2E:** Playwright
*   **Testy API (manualne i automatyczne):** Postman, Insomnia / testy w ramach frameworka Vitest/Playwright
*   **Testy wizualnej regresji:** Percy lub Chromatic
*   **Testy wydajności:** Google Lighthouse, WebPageTest
*   **Testy dostępności:** Axe DevTools (rozszerzenie do przeglądarki)
*   **CI/CD (automatyzacja testów):** GitHub Actions

## 7. Harmonogram testów

Testowanie będzie procesem ciągłym, zintegrowanym z cyklem rozwoju oprogramowania (CI/CD).
*   **Testy jednostkowe i integracyjne:** Pisane przez deweloperów równolegle z implementacją nowych funkcjonalności. Uruchamiane automatycznie przy każdym pushu do repozytorium.
*   **Testy E2E i API:** Uruchamiane automatycznie przed każdym wdrożeniem na środowisko stagingowe i produkcyjne.
*   **Testy manualne (eksploracyjne, użyteczności):** Przeprowadzane cyklicznie przed wydaniem większych funkcjonalności oraz w ramach regularnych audytów jakości.
*   **Testy regresji:** Pełen zestaw testów automatycznych uruchamiany przed każdym wydaniem produkcyjnym.

## 8. Kryteria akceptacji testów

*   **Kryteria wejścia (rozpoczęcia testów):**
    *   Kod został pomyślnie wdrożony na środowisku testowym.
    *   Wszystkie testy jednostkowe i integracyjne przechodzą pomyślnie.
    *   Dokumentacja dla testowanej funkcjonalności jest dostępna.
*   **Kryteria wyjścia (zakończenia testów i akceptacji wydania):**
    *   Wszystkie zaplanowane scenariusze testowe zostały wykonane.
    *   Co najmniej 95% testów automatycznych (E2E) kończy się sukcesem.
    *   Brak zidentyfikowanych błędów krytycznych i blokujących.
    *   Wszystkie zidentyfikowane błędy o wysokim priorytecie zostały naprawione.
    *   Znane błędy o niskim priorytecie są udokumentowane i zaakceptowane przez Product Ownera.

## 9. Role i odpowiedzialności

*   **Inżynier QA (autor planu):** Odpowiedzialny za tworzenie i utrzymanie planu testów, projektowanie scenariuszy testowych, implementację testów automatycznych (E2E, API), raportowanie błędów i końcową akceptację jakości.
*   **Deweloperzy:** Odpowiedzialni za pisanie testów jednostkowych i integracyjnych dla swojego kodu, naprawę zgłoszonych błędów oraz wsparcie w procesie testowania.
*   **Product Owner:** Odpowiedzialny za zdefiniowanie wymagań, priorytetyzację błędów oraz ostateczną akceptację funkcjonalności.

## 10. Procedury raportowania błędów

Wszystkie zidentyfikowane błędy będą raportowane w systemie do śledzenia zadań (np. GitHub Issues, Jira).

Każdy raport o błędzie musi zawierać następujące informacje:
*   **Tytuł:** Zwięzły i jednoznaczny opis problemu.
*   **Środowisko:** Wersja aplikacji, przeglądarka, system operacyjny.
*   **Kroki do reprodukcji:** Szczegółowa, ponumerowana lista kroków prowadzących do wystąpienia błędu.
*   **Wynik oczekiwany:** Opis, jak aplikacja powinna się zachować.
*   **Wynik aktualny:** Opis, jak aplikacja faktycznie się zachowuje.
*   **Priorytet/Waga:** Określenie wpływu błędu na działanie aplikacji (np. Krytyczny, Wysoki, Średni, Niski).
*   **Załączniki:** Zrzuty ekranu, nagrania wideo, logi z konsoli.