# Test Environment Setup - Summary

Data: 2025-10-17

## Zainstalowane narzędzia

### Vitest (Testy jednostkowe)

- `vitest@^3.2.4` - Framework do testów jednostkowych
- `@vitest/ui@^3.2.4` - UI interfejs do Vitest
- `@vitest/coverage-v8@^3.2.4` - Raport pokrycia kodu

### Testing Library (Testy React)

- `@testing-library/react@^16.3.0` - Utilities do testowania komponentów React
- `@testing-library/jest-dom@^6.9.1` - Custom matchers dla DOM
- `@testing-library/user-event@^14.6.1` - Symulacja interakcji użytkownika

### Playwright (Testy E2E)

- `@playwright/test@^1.56.1` - Framework do testów end-to-end

### Dodatkowe

- `jsdom@^27.0.0` - DOM environment dla Vitest

## Pliki konfiguracyjne

### `vitest.config.ts`

- Environment: jsdom (dla React testów)
- Setup file: `src/__tests__/setup/vitest.setup.ts`
- Path alias: `@/*` → `./src/*`
- Coverage threshold: 70% dla wszystkich metryk
- Test pattern: `src/**/*.{test,spec}.{js,ts,jsx,tsx}` (excludes E2E)

### `playwright.config.ts`

- Browser: Chromium (Desktop Chrome)
- Base URL: http://localhost:3000
- Test directory: `src/__tests__/e2e`
- Reporter: HTML
- Auto-start dev server: Enabled
- Retries: 2 (CI), 0 (local)

## Struktura katalogów

```
src/__tests__/
├── setup/
│   ├── vitest.setup.ts       # Global setup dla Vitest
│   ├── test-utils.tsx        # React render utility
│   └── (inne setup files)
├── unit/
│   ├── example.test.ts       # Przykładowy test
│   └── (testy jednostkowe)
├── e2e/
│   ├── pages/
│   │   └── BasePage.ts       # Page Object Model base
│   ├── example.spec.ts       # Przykładowy test E2E
│   └── (testy E2E)
└── README.md                 # Dokumentacja testów
```

## Dostępne skrypty

### Testy jednostkowe

```bash
npm run test              # Uruchom testy
npm run test:watch       # Watch mode
npm run test:ui          # UI interfejs
npm run test:coverage    # Raport pokrycia
```

### Testy E2E

```bash
npm run test:e2e         # Uruchom testy E2E
npm run test:e2e:ui      # UI interfejs
npm run test:e2e:debug   # Debug mode
```

## Wstępna konfiguracja

### ✅ Setup Vitest

- [x] Zainstalowana biblioteka
- [x] Stworzony `vitest.config.ts`
- [x] Stworzony `src/__tests__/setup/vitest.setup.ts`
- [x] Stworzony `src/__tests__/setup/test-utils.tsx`
- [x] Dodane skrypty do `package.json`
- [x] Testy jednostkowe działają poprawnie

### ✅ Setup Playwright

- [x] Zainstalowana biblioteka
- [x] Stworzony `playwright.config.ts`
- [x] Stworzony `src/__tests__/e2e/pages/BasePage.ts`
- [x] Dodane skrypty E2E do `package.json`

### ✅ Struktura katalogów

- [x] Stworzeni katalogi `src/__tests__/{unit,e2e,setup}`
- [x] Stworzony `src/__tests__/README.md` z dokumentacją

### ✅ Przykłady

- [x] `src/__tests__/unit/example.test.ts` - Działający test
- [x] `src/__tests__/e2e/example.spec.ts` - Szablon testu E2E

## Następne kroki

1. **Rozwinąć przykłady testów**
   - Napisać testy dla istniejących komponentów
   - Stworzyć Page Objects dla aplikacji

2. **Integracja z CI/CD**
   - Dodać testy do GitHub Actions workflow
   - Konfiguracja automatycznego uruchamiania testów na PR

3. **Best Practices**
   - Dodać pre-commit hooks dla testów
   - Ustanowić standardy pisania testów w zespole

## Linki do dokumentacji

- [Vitest Docs](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro)
- [Playwright Docs](https://playwright.dev/)
- [Test Guidelines](../CLAUDE.md) - Sekcja TESTING

## Weryfikacja

Konfiguracja została zweryfikowana:

- ✅ `npm run test` - 4 testy przechodzą
- ✅ Brak błędów konfiguracyjnych
- ✅ Wszystkie zależności zainstalowane pomyślnie
