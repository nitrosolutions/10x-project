# Test Plan - Wytyczne dla zespołu

## Przegląd

Projekt został wyposażony w kompletne środowisko testowe:
- **Vitest** + **Testing Library** - Testy jednostkowe i komponenty React
- **Playwright** - Testy end-to-end (E2E)

## Standardy testowania

### Konwencja nazewnictwa

#### Pliki testów
- Unit: `*.test.ts` lub `*.test.tsx`
- E2E: `*.spec.ts` lub `*.spec.tsx`

#### Struktura folderów
```
Kod:           Testy:
src/           src/__tests__/
├── lib/       ├── unit/
├── components/├── e2e/
└── pages/     └── setup/
```

### Pisanie testów

#### ✅ DO - Dobre praktyki

**Unit Tests:**
```typescript
import { describe, it, expect } from 'vitest';

describe('calculateTotal', () => {
  it('should sum all prices correctly', () => {
    const prices = [10, 20, 30];
    expect(calculateTotal(prices)).toBe(60);
  });

  it('should handle empty array', () => {
    expect(calculateTotal([])).toBe(0);
  });
});
```

**React Component Tests:**
```typescript
import { render, screen } from '@/__tests__/setup/test-utils';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('should call onClick when clicked', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);

    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

**E2E Tests:**
```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

test('user can login successfully', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('user@example.com', 'password');
  await expect(page).toHaveURL('/dashboard');
});
```

#### ❌ DON'T - Złe praktyki

```typescript
// ❌ Zbyt ogólne testy
it('works', () => {
  expect(result).toBeTruthy();
});

// ❌ Implementation details
it('calls useState three times', () => {
  expect(mockUseState).toHaveBeenCalledTimes(3);
});

// ❌ Hardcoded waits w E2E
await page.waitForTimeout(1000);

// ❌ Brak isolacji testów
let globalState;
it('test 1', () => {
  globalState = 'value';
});
it('test 2', () => {
  expect(globalState).toBeDefined(); // Zależy od test 1!
});
```

## Pokrycie kodu

### Minimalne standardy
- **70%** - Linie
- **70%** - Funkcje
- **70%** - Gałęzie
- **70%** - Wyrażenia

Sprawdzenie pokrycia:
```bash
npm run test:coverage
```

## Mocking

### Supabase
```typescript
import { vi } from 'vitest';

const mockSupabaseClient = {
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
  },
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null }),
  }),
};
```

### HTTP Requests (API)
```typescript
import { vi } from 'vitest';

vi.mock('@/lib/services/api', () => ({
  fetchReceipts: vi.fn().mockResolvedValue([
    { id: 1, name: 'Receipt 1' },
  ]),
}));
```

## Uruchamianie testów

### Development
```bash
# Tryb watch - automatyczne testy na zmianę
npm run test:watch

# UI interfejs
npm run test:ui
```

### Pre-commit (Husky)
```bash
# Testy będą uruchamiania automatycznie przed committem
git commit -m "feat: new feature"
```

### CI/CD
Dodać do GitHub Actions:
```yaml
- name: Run tests
  run: npm run test

- name: Run E2E tests
  run: npm run test:e2e
```

## Debugging

### Vitest
```bash
# Node debugger
npm run test -- --inspect-brk

# Vitest UI
npm run test:ui
```

### Playwright
```bash
# Debug mode
npm run test:e2e:debug

# Trace viewer
npx playwright show-trace trace.zip
```

## Checklist - Przed committem

- [ ] Wszystkie testy przechodzą: `npm run test`
- [ ] E2E testy działają: `npm run test:e2e`
- [ ] Pokrycie kodu >= 70%: `npm run test:coverage`
- [ ] Brak `test.only()` w kodzie
- [ ] Testy są zrozumiałe i utrzymywalne

## Problemy i rozwiązania

### Bład: "Cannot find module '@/...'"
**Rozwiązanie:** Sprawdzić alias w `vitest.config.ts`

### Testy się zawieszają
**Rozwiązanie:** Sprawdzić czy jest `expect.assertions()` lub `await` brakuje

### E2E testy timeout
**Rozwiązanie:** Zwiększyć timeout w `playwright.config.ts`

```typescript
timeout: 30 * 1000, // 30 sekund
```

## Zasoby

- [Vitest Guide](../../src/__tests__/README.md)
- [CLAUDE.md Testing Section](../../CLAUDE.md#testing)
- [Testing Library Best Practices](https://testing-library.com/docs/queries/about)

## Kontakt

Pytania dotyczące testów? Sprawdź `src/__tests__/README.md`
