# 🧪 Testing Quick Start Guide

## ⚡ Szybki start

### Zainstaluj zależności (już done!)

```bash
npm install
```

### Uruchom testy

```bash
# Testy jednostkowe
npm run test                 # Uruchom raz
npm run test:watch          # Watch mode
npm run test:ui             # UI interfejs

# Testy E2E
npm run test:e2e            # Uruchom testy
npm run test:e2e:ui         # UI interfejs
npm run test:e2e:debug      # Debug mode

# Pokrycie kodu
npm run test:coverage       # Generuj raport
```

## 📁 Struktura

```
src/__tests__/
├── unit/                  # Testy jednostkowe
│   └── example.test.ts   # Działający przykład ✅
├── e2e/                   # Testy end-to-end
│   ├── pages/
│   │   └── BasePage.ts   # Page Object Model
│   └── example.spec.ts   # Szablon E2E
└── setup/
    ├── vitest.setup.ts   # Vitest config
    └── test-utils.tsx    # React helpers
```

## 📝 Napisz test

### Unit test

```typescript
// src/__tests__/unit/math.test.ts
import { describe, it, expect } from "vitest";

describe("Math", () => {
  it("2 + 2 = 4", () => {
    expect(2 + 2).toBe(4);
  });
});
```

### React component

```typescript
// src/__tests__/unit/Button.test.tsx
import { render, screen } from '@/__tests__/setup/test-utils';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
```

### E2E test

```typescript
// src/__tests__/e2e/homepage.spec.ts
import { test, expect } from "@playwright/test";

test("homepage loads", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/.*/, { timeout: 5000 });
});
```

## 🎯 Best Practices

✅ **DO:**

- Testuj zachowanie użytkownika, nie implementację
- Używaj descriptive nazwy testów
- Mockuj zależności (API, bazy danych)
- Utrzymuj testy małe i fokusem

❌ **DON'T:**

- Nie testuj detali implementacji
- Nie pisz testów bez asercji
- Nie twórz zależności między testami
- Nie używaj `waitForTimeout()` w E2E

## 📊 Pokrycie

Minimum: **70%** dla wszystkich metryk

```bash
npm run test:coverage
```

Raport HTML: `coverage/index.html`

## 🔧 Konfiguracja

| Narzędzie  | Plik                   | Środowisko  |
| ---------- | ---------------------- | ----------- |
| Vitest     | `vitest.config.ts`     | jsdom       |
| Playwright | `playwright.config.ts` | Chromium    |
| Teesting   | `src/__tests__/setup/` | React + DOM |

## 🐛 Debugging

```bash
# Vitest UI
npm run test:ui

# Playwright UI
npm run test:e2e:ui

# Playwright Debug
npm run test:e2e:debug
```

## 📚 Więcej informacji

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/)
- [Playwright Docs](https://playwright.dev/)
- [Szczegółowy przewodnik](./test-environment-setup.md)
- [Wytyczne testowania](./prompts/test-plan-setup.md)

---

**Status:** ✅ Środowisko gotowe do testowania!

Wszystkie narzędzia zainstalowane i skonfigurowane. Możesz już pisać testy.
