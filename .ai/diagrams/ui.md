<architecture_analysis>
Na podstawie dostarczonych plików `auth-spec.md` i `prd.md` oraz analizy struktury projektu, zidentyfikowano następujące komponenty i przepływy dla modułu autentykacji.

### 1. Lista Komponentów i Stron

**Layouty (Astro):**
- `Layout.astro` (Modyfikacja): Główny layout aplikacji. Będzie warunkowo renderować nawigację w zależności od stanu zalogowania użytkownika (sesja z `Astro.locals.session`).
- `AuthLayout.astro` (Nowy): Specjalny layout dla stron formularzy logowania, rejestracji itp., zapewniający spójny, wycentrowany wygląd.

**Strony (Astro):**
- `login.astro`: Strona logowania, renderuje `LoginForm.tsx`.
- `register.astro`: Strona rejestracji, renderuje `RegisterForm.tsx`.
- `reset-password.astro`: Strona do inicjowania resetu hasła, renderuje `ResetPasswordForm.tsx`.
- `update-password.astro`: Strona do ustawiania nowego hasła po resecie.
- `account.astro`: Strona zarządzania kontem, renderuje `AccountView.tsx`.

**Komponenty (React):**
- `LoginForm.tsx`: Formularz logowania z polami email i hasło.
- `RegisterForm.tsx`: Formularz rejestracji z walidacją siły hasła.
- `ResetPasswordForm.tsx`: Formularz do wysyłania prośby o reset hasła.
- `UpdatePasswordForm.tsx`: Formularz do ustawienia nowego hasła.
- `AccountView.tsx`: Komponent do zarządzania kontem (wylogowanie, usunięcie konta).
- `DeleteAccountDialog.tsx`: Modal potwierdzający usunięcie konta.

**Endpointy API (Astro):**
- `POST /api/auth/login`: Logowanie użytkownika.
- `POST /api/auth/register`: Rejestracja nowego użytkownika.
- `POST /api/auth/logout`: Wylogowanie użytkownika.
- `POST /api/auth/reset-password`: Inicjowanie resetu hasła.
- `POST /api/auth/delete-account`: Usunięcie konta użytkownika.

**Logika serwerowa:**
- `middleware/index.ts`: Przechwytuje każde żądanie, zarządza sesją Supabase i chroni trasy.

### 2. Główne Strony i Ich Komponenty

- **Strona Logowania (`login.astro`):** Używa `AuthLayout.astro` i renderuje komponent `LoginForm.tsx`.
- **Strona Rejestracji (`register.astro`):** Używa `AuthLayout.astro` i renderuje `RegisterForm.tsx`.
- **Strona Zarządzania Kontem (`account.astro`):** Używa głównego `Layout.astro` i renderuje `AccountView.tsx`.

### 3. Przepływ Danych

1.  Użytkownik wchodzi na stronę chronioną (np. `/`).
2.  `middleware/index.ts` sprawdza brak sesji i przekierowuje na `/login`.
3.  Strona `login.astro` wewnątrz `AuthLayout.astro` renderuje `LoginForm.tsx`.
4.  Użytkownik wypełnia formularz, a dane są wysyłane do endpointu `POST /api/auth/login`.
5.  Endpoint komunikuje się z Supabase Auth, a w przypadku sukcesu biblioteka `@supabase/ssr` ustawia ciasteczka sesji.
6.  Aplikacja przekierowuje użytkownika z powrotem na stronę główną (`/`).
7.  `middleware/index.ts` rozpoznaje sesję i pozwala na dostęp, a `Layout.astro` renderuje nawigację dla zalogowanego użytkownika.

### 4. Opis Funkcjonalności Komponentów

- **`Layout.astro`**: Główna struktura wizualna aplikacji, dostosowuje UI na podstawie sesji.
- **`AuthLayout.astro`**: Minimalistyczny layout dla formularzy, skupiający uwagę użytkownika na procesie autentykacji.
- **`LoginForm.tsx`**: Interaktywny formularz do wprowadzania danych logowania i komunikacji z API.
- **`RegisterForm.tsx`**: Formularz do tworzenia konta z walidacją danych w czasie rzeczywistym.
- **`AccountView.tsx`**: Interfejs do zarządzania podstawowymi akcjami na koncie, jak wylogowanie czy zainicjowanie usunięcia.
- **`middleware/index.ts`**: Strażnik aplikacji, który zarządza sesją i kontroluje dostęp do poszczególnych stron po stronie serwera.

</architecture_analysis>

<mermaid_diagram>
```mermaid
flowchart TD
    classDef page fill:#E1F5FE,stroke:#0277BD,stroke-width:2px;
    classDef component fill:#FFF3E0,stroke:#EF6C00,stroke-width:2px;
    classDef layout fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px;
    classDef api fill:#FCE4EC,stroke:#AD1457,stroke-width:2px;
    classDef logic fill:#EDE7F6,stroke:#5E35B1,stroke-width:2px;
    classDef external fill:#ECEFF1,stroke:#37474F,stroke-width:2px;

    subgraph "Użytkownik Niezalogowany"
        direction LR
        U1(Użytkownik) --> MW_CHECK1{Middleware: Brak sesji?};
        MW_CHECK1 -- Tak --> P_LOGIN[login.astro];
    end

    subgraph "Proces Logowania i Rejestracji"
        direction TD
        P_LOGIN:::page --> AL[AuthLayout.astro];
        P_REG[register.astro]:::page --> AL;
        P_RESET[reset-password.astro]:::page --> AL;
        P_UPDATE[update-password.astro]:::page --> AL;

        AL[AuthLayout.astro]:::layout -- Renderuje --> C_LOGIN[LoginForm.tsx];
        AL -- Renderuje --> C_REG[RegisterForm.tsx];
        AL -- Renderuje --> C_RESET[ResetPasswordForm.tsx];
        AL -- Renderuje --> C_UPDATE[UpdatePasswordForm.tsx];

        C_LOGIN[LoginForm.tsx]:::component -- Dane logowania --> API_LOGIN[POST /api/auth/login];
        C_REG[RegisterForm.tsx]:::component -- Dane rejestracji --> API_REG[POST /api/auth/register];
        C_RESET[ResetPasswordForm.tsx]:::component -- Email --> API_RESET[POST /api/auth/reset-password];
    end

    subgraph "Logika Backendowa (Astro API)"
        direction TD
        API_LOGIN:::api -- signInWithPassword() --> SB_AUTH;
        API_REG:::api -- signUp() --> SB_AUTH;
        API_RESET:::api -- resetPasswordForEmail() --> SB_AUTH;
        API_LOGOUT[POST /api/auth/logout]:::api -- signOut() --> SB_AUTH;
        API_DELETE[POST /api/auth/delete-account]:::api -- deleteUser() --> SB_AUTH;
        
        SB_AUTH[Supabase Auth]:::external;
    end

    subgraph "Użytkownik Zalogowany"
        direction TD
        API_LOGIN -- Sukces --> MW_CHECK2{Middleware: Sesja OK};
        MW_CHECK2 -- Przekierowanie --> P_DASHBOARD[/ (Panel Główny)];
        P_DASHBOARD:::page --> L[Layout.astro];
        L:::layout -- Renderuje --> NAV[Navigation.astro];
        NAV -- Link do konta --> P_ACC[account.astro];
        
        P_ACC[account.astro]:::page -- Używa --> L;
        L -- Renderuje --> C_ACC[AccountView.tsx];
        C_ACC[AccountView.tsx]:::component -- Wyloguj --> API_LOGOUT;
        C_ACC -- Usuń konto --> C_DEL_DIALOG[DeleteAccountDialog.tsx];
        C_DEL_DIALOG[DeleteAccountDialog.tsx]:::component -- Potwierdź z hasłem --> API_DELETE;
    end

    subgraph "Centralna Logika Aplikacji"
        MW[middleware/index.ts]:::logic -- Na każde żądanie --> SB_SSR[Odtworzenie sesji @supabase/ssr];
        SB_SSR --> SET_LOCALS[Zapis w Astro.locals];
        SET_LOCALS --> L;
        SET_LOCALS --> P_ACC;
    end

```
</mermaid_diagram>
