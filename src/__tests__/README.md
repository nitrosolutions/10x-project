# Test Environment Setup

Środowisko testowe projektu zostało przygotowane z obsługą testów jednostkowych (Vitest) i testów E2E (Playwright).

## Struktura katalogów

```
src/__tests__/
├── setup/                  # Konfiguracja i utility
│   ├── vitest.setup.ts    # Setup dla Vitest
│   └── test-utils.tsx     # Utility funkcje do testów React
├── unit/                   # Testy jednostkowe
│   └── example.test.ts    # Przykładowy test
├── e2e/                    # Testy end-to-end
│   ├── pages/             # Page Object Models
│   │   └── BasePage.ts
│   └── example.spec.ts    # Przykładowy test E2E
└── README.md              # Ta dokumentacja
```

## Dostępne skrypty

### Testy jednostkowe (Vitest)

```bash
# Uruchom testy jednostkowe
npm run test

# Obserwaj zmiany i uruchamiaj testy automatycznie
npm run test:watch

# Otwórz UI interfejs Vitest
npm run test:ui

# Generuj raport pokrycia kodu
npm run test:coverage
```

### Testy E2E (Playwright)

```bash
# Uruchom wszystkie testy E2E
npm run test:e2e

# Otwórz UI interfejs Playwright
npm run test:e2e:ui

# Debug testy w trybie krok-po-kroku
npm run test:e2e:debug
```

## Konfiguracja

### Vitest (`vitest.config.ts`)

- **Environment**: jsdom (dla testów React komponentów)
- **Setup file**: `src/__tests__/setup/vitest.setup.ts`
- **Path alias**: `@/*` → `./src/*`
- **Coverage threshold**: 70% dla wszystkich metryk
- **Include pattern**: `src/**/*.{test,spec}.{js,ts,jsx,tsx}`

### Playwright (`playwright.config.ts`)

- **Browser**: Chromium Desktop Chrome
- **Base URL**: http://localhost:3000
- **Test directory**: `src/__tests__/e2e`
- **Reporter**: HTML raport
- **Auto start dev server**: Tak (jeśli nie jest już uruchomiony)

## Pisanie testów

### Test jednostkowy

```typescript
import { describe, it, expect } from 'vitest';

describe('MyFunction', () => {
  it('should return correct result', () => {
    const result = myFunction(2, 3);
    expect(result).toBe(5);
  });
});
```

### Test React komponentu

```typescript
import { render, screen } from '@/__tests__/setup/test-utils';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('should render with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });
});
```

### Test E2E

```typescript
import { test, expect } from '@playwright/test';

test('user can click button', async ({ page }) => {
  await page.goto('/');
  await page.click('button');
  await expect(page.locator('.result')).toContainText('Success');
});
```

## Page Object Model

Dla testów E2E zalecane jest używanie Page Object Model pattern w celu utrzymania czytelności i łatwości konserwacji:

```typescript
import { BasePage } from './pages/BasePage';

class LoginPage extends BasePage {
  async fillUsername(username: string) {
    await this.fillInput('[data-testid="username"]', username);
  }

  async fillPassword(password: string) {
    await this.fillInput('[data-testid="password"]', password);
  }

  async clickLogin() {
    await this.click('[data-testid="login-button"]');
  }
}
```

## Best Practices

### Testy jednostkowe

- Używaj opisowych nazw testów
- Testy powinny być niezależne i powtarzalne
- Preferuj `vi.spyOn()` zamiast `vi.mock()` gdy to możliwe
- Stwórz reusable mocks w plikach setupu
- Utrzymuj pokrycie kodu na poziomie 70%+

### Testy React

- Testuj interakcje użytkownika, nie implementację
- Używaj `@testing-library/user-event` zamiast direct events
- Testuj dostępność (accessibility)
- Unikaj `screen.debug()` w producji

### Testy E2E

- Testy powinny symulować rzeczywiste scenariusze użytkownika
- Używaj Page Object Model pattern
- Unikaj hardcoded waits, używaj `waitForLoadState`
- Dokumentuj złożone scenariusze testów
- Uruchamiaj testy w CI/CD pipeline

## Mocking

### Mockowanie modułów

```typescript
import { vi } from 'vitest';

vi.mock('@/lib/services/api', () => ({
  fetchData: vi.fn().mockResolvedValue({ success: true }),
}));
```

### Mockowanie Supabase

```typescript
const mockSupabase = {
  auth: { getUser: vi.fn() },
  from: vi.fn().mockReturnValue({
    select: vi.fn(),
  }),
};
```

## Troubleshooting

### Błąd: "Cannot find module '@/...'"
- Upewnij się, że `vitest.config.ts` zawiera poprawny `alias` dla `@/`

### Testy E2E się zawieszają
- Sprawdź czy dev server (`npm run dev`) jest uruchomiony
- Zwiększ timeout w konfiguracji Playwright

### Problemy z DOM w Vitest
- Upewnij się, że `environment: 'jsdom'` w konfiguracji
- Sprawdź czy `vitest.setup.ts` jest załadowany

## Zasoby

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [CLAUDE.md Testing Guidelines](../../CLAUDE.md)
