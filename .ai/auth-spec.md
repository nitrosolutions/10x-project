# Specyfikacja Techniczna: Moduł Autentykacji Użytkowników

## Wprowadzenie

Niniejszy dokument opisuje architekturę i implementację modułu rejestracji, logowania, odzyskiwania hasła i zarządzania kontem użytkownika w aplikacji PortfelIO. Specyfikacja bazuje na wymaganiach zdefiniowanych w PRD (US-001, US-002, US-014, US-015) oraz na ustalonym stosie technologicznym (Astro, React, Supabase).

## 1. Architektura Interfejsu Użytkownika (Frontend)

### 1.1. Strony i Layouty (Astro)

Architektura będzie oparta o centralny `Layout.astro`, który będzie zarządzał widokiem dla zalogowanych i niezalogowanych użytkowników, oraz dedykowane strony dla procesów autentykacji.

-   **`src/layouts/Layout.astro` (Modyfikacja)**
    -   Layout zostanie rozszerzony o logikę warunkowego renderowania elementów nawigacji na podstawie sesji użytkownika pobranej z `Astro.locals.session`.
    -   Dla użytkownika niezalogowanego, nawigacja będzie zawierać linki do `/login` i `/register`.
    -   Dla użytkownika zalogowanego, nawigacja wyświetli menu użytkownika z opcjami prowadzącymi do `/account` oraz akcją wylogowania.

-   **`src/layouts/AuthLayout.astro` (Nowy)**
    -   Specjalny layout dla stron formularzy autentykacji (`/login`, `/register`, etc.).
    -   Będzie zawierał logo aplikacji i wycentrowany kontener na komponenty formularzy, zapewniając spójny wygląd.

-   **Nowe strony (w `src/pages/`)**
    -   `login.astro`: Publiczna strona logowania, renderująca komponent `LoginForm.tsx` wewnątrz `AuthLayout.astro`. Przekierowuje do `/` jeśli użytkownik jest już zalogowany.
    -   `register.astro`: Publiczna strona rejestracji, renderująca `RegisterForm.tsx`.
    -   `reset-password.astro`: Publiczna strona do inicjowania procesu resetu hasła, renderująca `ResetPasswordForm.tsx`.
    -   `update-password.astro`: Strona, na którą trafia użytkownik z linku w mailu resetującym. Będzie ona częścią przepływu Supabase, a my dostarczymy odpowiedni interfejs z komponentem `UpdatePasswordForm.tsx`.
    -   `account.astro`: Prywatna strona zarządzania kontem, dostępna tylko po zalogowaniu. Będzie renderować komponent `AccountView.tsx`.

### 1.2. Komponenty Interaktywne (React)

Wszystkie formularze i elementy interaktywne zostaną zaimplementowane jako komponenty React z wykorzystaniem biblioteki `shadcn/ui`, `react-hook-form` do zarządzania stanem formularzy oraz `zod` do walidacji.

-   **`src/components/auth/LoginForm.tsx`**
    -   Formularz z polami na email i hasło.
    -   Zawiera linki do stron rejestracji i resetowania hasła.
    -   Komunikuje się z endpointem `POST /api/auth/login`.
    -   Obsługuje stany ładowania i wyświetla błędy zwrócone z API.

-   **`src/components/auth/RegisterForm.tsx`**
    -   Formularz z polami na email, hasło i jego powtórzenie.
    -   Implementuje walidację siły hasła po stronie klienta w czasie rzeczywistym.
    -   Komunikuje się z endpointem `POST /api/auth/register`.

-   **`src/components/auth/ResetPasswordForm.tsx`**
    -   Prosty formularz z polem na adres email.
    -   Po wysłaniu wyświetla komunikat o powodzeniu.
    -   Komunikuje się z `POST /api/auth/reset-password`.

-   **`src/components/auth/UpdatePasswordForm.tsx`**
    -   Formularz do ustawienia nowego hasła, dostępny z tokenu resetującego.
    -   Będzie wykorzystywał współdzielony schemat walidacji `zod` do weryfikacji siły nowego hasła.
    -   Komunikuje się bezpośrednio z Supabase po stronie klienta w celu aktualizacji hasła.

-   **`src/components/account/AccountView.tsx`**
    -   Wyświetla informacje o zalogowanym użytkowniku (np. email).
    -   Zawiera przycisk "Wyloguj", który wywołuje akcję na `POST /api/auth/logout`.
    -   Zawiera przycisk "Usuń konto", który otwiera komponent `DeleteAccountDialog.tsx`.

-   **`src/components/account/DeleteAccountDialog.tsx`**
    -   Modal potwierdzający usunięcie konta.
    -   Zawiera pole do wpisania hasła w celu weryfikacji.
    -   Komunikuje się z `POST /api/auth/delete-account`.

### 1.3. Walidacja i Obsługa Błędów

-   **Schematy Walidacji**: Zostanie utworzony plik `src/lib/schemas/auth.schema.ts`, który będzie eksportował schematy `zod` dla wszystkich formularzy. Schematy te będą współdzielone między frontendem (walidacja w czasie rzeczywistym) a backendem (walidacja w endpointach API).
-   **Komunikaty**: Błędy walidacji będą wyświetlane bezpośrednio pod polami formularzy. Błędy globalne (np. "Nieprawidłowe dane logowania") będą wyświetlane za pomocą komponentu `Sonner` z `shadcn/ui`.

## 2. Logika Backendowa

### 2.1. Endpointy API

Endpointy zostaną zaimplementowane jako Astro API Routes (`src/pages/api/**/*.ts`) z `export const prerender = false;`. Będą one bezstanowe i będą komunikować się z Supabase za pomocą klienta administracyjnego.

-   **`POST /api/auth/login`**:
    -   Waliduje `email` i `password` przy użyciu schemy Zod.
    -   Wywołuje `supabase.auth.signInWithPassword()`.
    -   W przypadku sukcesu, biblioteka `@supabase/ssr` automatycznie zarządza ustawieniem ciasteczek sesji.
    -   Zwraca status 200 OK lub błąd 401/400.

-   **`POST /api/auth/register`**:
    -   Waliduje `email` i `password`.
    -   Wywołuje `supabase.auth.signUp()`.
    -   Zwraca dane nowej sesji lub błąd (np. jeśli użytkownik już istnieje).

-   **`POST /api/auth/logout`**:
    -   Wywołuje `supabase.auth.signOut()`.
    -   Czyści ciasteczka sesji.
    -   Zwraca status 200 i przekierowanie (obsługiwane po stronie klienta).

-   **`POST /api/auth/reset-password`**:
    -   Waliduje `email`.
    -   Wywołuje `supabase.auth.resetPasswordForEmail()`.
    -   Zawsze zwraca status 200, aby zapobiec wyciekowi informacji o istnieniu kont.

-   **`POST /api/auth/delete-account`**:
    -   Endpoint chroniony, wymaga aktywnej sesji.
    -   Weryfikuje tożsamość użytkownika poprzez ponowne sprawdzenie hasła.
    -   Jeśli hasło jest poprawne, wykonuje transakcję w celu usunięcia wszystkich danych użytkownika (`receipt_items`, `receipts`).
    -   Wywołuje `supabase.auth.admin.deleteUser()` w celu usunięcia konta z systemu Supabase.

### 2.2. Modele Danych i Row Level Security (RLS)

-   Nie ma potrzeby tworzenia nowych tabel. Wykorzystana zostanie tabela `auth.users` z Supabase.
-   Istniejące tabele `receipts` i `receipt_items` muszą być zabezpieczone za pomocą RLS.
-   **Migracja SQL (`supabase/migrations/`)**: Zostanie dodana nowa migracja lub zmodyfikowana istniejąca, aby:
    1.  Włączyć RLS na tabeli `receipts`.
    2.  Dodać polityki `SELECT`, `INSERT`, `UPDATE`, `DELETE`, które pozwalają użytkownikowi na operacje wyłącznie na własnych danych (`USING (auth.uid() = user_id)`).

## 3. System Autentykacji

### 3.1. Integracja z Supabase Auth

-   Projekt będzie wykorzystywał oficjalny pakiet `@supabase/ssr` do integracji z Astro.
-   **Konfiguracja Klienta**: W `src/db/supabase.client.ts` zostanie utworzona funkcja do inicjalizacji klienta Supabase, która będzie mogła być używana zarówno po stronie serwera (w middleware, na stronach Astro), jak i po stronie klienta (w komponentach React).
-   **Zmienne Środowiskowe**: Aplikacja będzie korzystać z `.env` do przechowywania kluczy Supabase: `SUPABASE_URL`, `SUPABASE_ANON_KEY` (dla klienta) oraz `SUPABASE_SERVICE_ROLE_KEY` (dla operacji administracyjnych na serwerze).

### 3.2. Middleware

Plik `src/middleware/index.ts` będzie centralnym punktem logiki uwierzytelniania po stronie serwera.

-   **Odpowiedzialność**:
    1.  Przy każdym żądaniu, odczytuje ciasteczka i odtwarza sesję użytkownika za pomocą `@supabase/ssr`.
    2.  Udostępnia obiekt sesji i klienta Supabase w `context.locals`, dzięki czemu są one dostępne na każdej stronie i w każdym endpoincie API.
    3.  Implementuje logikę ochrony tras:
        -   Przekierowuje niezalogowanych użytkowników z chronionych stron (np. `/`, `/receipts/*`) na stronę `/login`.
        -   Przekierowuje zalogowanych użytkowników ze stron autentykacji (np. `/login`, `/register`) na stronę główną (`/`).

Ten model zapewnia solidne bezpieczeństwo, ponieważ weryfikacja dostępu odbywa się po stronie serwera przed wyrenderowaniem jakiejkolwiek chronionej treści.
