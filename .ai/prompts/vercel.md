# Vercel Deployment - Astro SSR z CI/CD

## 📋 Podsumowanie wymaganych modyfikacji dla Vercel + CI/CD z testami

### **Pliki do UTWORZENIA:**

#### **1. `.github/workflows/vercel-deploy.yml`**

```yaml
name: Vercel Deploy with Tests

on:
  push:
    branches: [master]
  pull_request:
    branches: [master]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run format check
        run: npx prettier --check .

      - name: Build application
        run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/master'
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel Production
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: "--prod"

  deploy-preview:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel Preview
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

**Co robi:**

- ✅ Uruchamia się na push do `master` i na każdy PR
- ✅ Job `test`: instaluje deps → lint → format check → build
- ✅ Job `deploy`: deploy do produkcji (tylko master)
- ✅ Job `deploy-preview`: deploy preview dla PR-ów
- ✅ Deploy wykonuje się **tylko jeśli testy przejdą**

---

#### **2. `vercel.json`** (opcjonalny, ale rekomendowany)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "astro",
  "regions": ["fra1"],
  "functions": {
    "src/pages/**/*.ts": {
      "maxDuration": 10
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

**Co robi:**

- Region: Frankfurt (EU) dla niskiej latencji w Polsce
- Max duration: 10s (Free tier) - dla API routes
- Security headers (XSS protection, clickjacking protection)

---

#### **3. `src/pages/test-ssr.astro`** (przykład testowy)

```astro
---
const serverTime = new Date().toISOString();
const nodeVersion = process.version;
---

<html lang="pl">
  <head>
    <meta charset="UTF-8" />
    <title>Test SSR - PortfelIO</title>
  </head>
  <body>
    <h1>✅ Astro SSR działa!</h1>
    <p><strong>Czas serwera:</strong> {serverTime}</p>
    <p><strong>Node.js version:</strong> {nodeVersion}</p>
    <p><em>Odśwież stronę - timestamp powinien się zmieniać (SSR)</em></p>
  </body>
</html>
```

**Po co:**

- Weryfikacja że SSR działa poprawnie na Vercel
- Timestamp zmienia się przy każdym żądaniu = SSR ✅

---

#### **4. `src/pages/api/hello.ts`** (przykład API route)

```typescript
import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      message: "API route działa!",
      timestamp: new Date().toISOString(),
      environment: import.meta.env.MODE,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
};
```

**Po co:**

- Weryfikacja że API routes działają jako serverless functions
- Test: `curl https://twoj-projekt.vercel.app/api/hello`

---

### **Pliki do MODYFIKACJI:**

#### **5. `astro.config.mjs`**

```diff
// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
+import vercel from "@astrojs/vercel";

// https://astro.build/config
export default defineConfig({
-  output: "static",
+  output: "server", // lub "hybrid"
+  adapter: vercel({
+    webAnalytics: { enabled: true },
+    imageService: true,
+  }),
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  vite: {
    plugins: [tailwindcss()],
  },
});
```

**Zmiana:**

- `output: "static"` → `"server"` (full SSR)
- Dodanie `adapter: vercel()` z opcjami

---

#### **6. `package.json`**

```diff
{
  "dependencies": {
    "@astrojs/node": "^9.4.4",
    "@astrojs/react": "^4.4.0",
    "@astrojs/sitemap": "^3.6.0",
+   "@astrojs/vercel": "^8.0.0",
    // ... reszta dependencies
  }
}
```

**Instalacja:**

```bash
npm install @astrojs/vercel
```

---

#### **7. `CLAUDE.md`** (aktualizacja dokumentacji)

Dodaj sekcję:

````markdown
## Deployment - Vercel

### Build Modes

- **Development:** `npm run dev` (local dev server)
- **Production:** `npm run build` → `dist/` (SSR serverless functions)
- **Preview:** `npm run preview` (test production build locally)

### Vercel Configuration

- **Output mode:** `server` (full SSR)
- **Region:** Frankfurt (EU) - `fra1`
- **Node.js version:** 22.x (from `.nvmrc`)
- **Max function duration:** 10s (Free tier) / 60s (Pro tier)

### CI/CD Pipeline (GitHub Actions)

Workflow: `.github/workflows/vercel-deploy.yml`

**On Push to `master`:**

1. Run linter (`npm run lint`)
2. Run format check (`prettier --check`)
3. Build application (`npm run build`)
4. Deploy to production (if tests pass)

**On Pull Request:**

1. Run tests (same as above)
2. Deploy preview environment
3. Comment PR with preview URL

### Manual Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```
````

### Environment Variables (Vercel Dashboard)

Set in: Vercel Dashboard → Project Settings → Environment Variables

Required for production:

- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY` (or Azure OpenAI credentials)

````

---

### **Pliki do USUNIĘCIA:**

#### **8. `.github/workflows/azure-staticwebapp.yml`**
```bash
git rm .github/workflows/azure-staticwebapp.yml
````

**Dlaczego:**

- Nie używamy już Azure Static Web Apps
- Workflow jest niepotrzebny dla Vercel

---

## 🔐 **GitHub Secrets do dodania:**

W GitHub repo → Settings → Secrets and variables → Actions:

1. **`VERCEL_TOKEN`**
   - Źródło: [vercel.com/account/tokens](https://vercel.com/account/tokens)
   - Utwórz nowy token z scope: `Full Access`

2. **`VERCEL_ORG_ID`**
   - Uruchom lokalnie: `vercel link`
   - Sprawdź plik: `.vercel/project.json` → pole `orgId`

3. **`VERCEL_PROJECT_ID`**
   - J.w. → pole `projectId`

**Jak zdobyć ORG_ID i PROJECT_ID:**

```bash
# W katalogu projektu
npm install -g vercel
vercel login
vercel link

# Plik .vercel/project.json:
{
  "orgId": "team_xxxxx",
  "projectId": "prj_xxxxx"
}
```

---

## 📦 **Instalacja zależności:**

```bash
npm install @astrojs/vercel
```

---

## 🚀 **Kroki deployment (po zmianach):**

### **1. Lokalne testy:**

```bash
# Test buildu
npm run build

# Test linta
npm run lint

# Test formatowania
npx prettier --check .

# Test lokalnie z Vercel emulation (opcjonalnie)
npx vercel dev
```

### **2. Commit i push:**

```bash
git add .
git commit -m "feat: configure Vercel SSR deployment with CI/CD"
git push origin master
```

### **3. Konfiguracja Vercel Dashboard:**

1. Wejdź na [vercel.com](https://vercel.com)
2. Kliknij "Add New Project"
3. Importuj repo `10x-project`
4. Pozostaw domyślne ustawienia (Vercel wykryje Astro)
5. **(WAŻNE) Wyłącz automatyczny deploy:**
   - Settings → Git → **"Ignored Build Step"**
   - Wpisz: `exit 1`
   - **Dlaczego?** Bo GitHub Actions będzie zarządzać deployami

### **4. Dodaj GitHub Secrets:**

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

### **5. Push do master → GitHub Actions:**

- Workflow uruchomi się automatycznie
- Sprawdź: GitHub → Actions tab
- Po przejściu testów → deploy na Vercel

---

## ✅ **Weryfikacja po deployment:**

### **Test 1: SSR działa**

```bash
# Odwiedź kilka razy (timestamp powinien się zmieniać)
curl https://10x-project.vercel.app/test-ssr
```

### **Test 2: API route działa**

```bash
curl https://10x-project.vercel.app/api/hello
# Powinien zwrócić JSON z timestamp
```

### **Test 3: Logi funkcji serverless**

- Vercel Dashboard → Project → Functions → Logs
- Sprawdź czy są requesty do `/test-ssr` i `/api/hello`

### **Test 4: Preview deployment (PR)**

1. Utwórz branch: `git checkout -b test-feature`
2. Zrób zmianę i push
3. Utwórz PR na GitHub
4. GitHub Actions utworzy preview deployment
5. URL preview: `https://10x-project-git-test-feature-username.vercel.app`

---

## 📊 **Podsumowanie zmian:**

| Plik                                       | Akcja          | Opis                                     |
| ------------------------------------------ | -------------- | ---------------------------------------- |
| `astro.config.mjs`                         | ✏️ Modyfikacja | `output: "server"` + `adapter: vercel()` |
| `package.json`                             | ✏️ Modyfikacja | Dodanie `@astrojs/vercel`                |
| `.github/workflows/vercel-deploy.yml`      | ➕ Nowy        | GitHub Actions workflow z testami        |
| `vercel.json`                              | ➕ Nowy        | Konfiguracja Vercel (region, headers)    |
| `src/pages/test-ssr.astro`                 | ➕ Nowy        | Test SSR                                 |
| `src/pages/api/hello.ts`                   | ➕ Nowy        | Test API route                           |
| `CLAUDE.md`                                | ✏️ Modyfikacja | Dokumentacja deployment                  |
| `.github/workflows/azure-staticwebapp.yml` | ❌ Usunięcie   | Stary workflow Azure                     |

**GitHub Secrets:**

- ➕ `VERCEL_TOKEN`
- ➕ `VERCEL_ORG_ID`
- ➕ `VERCEL_PROJECT_ID`

**NPM packages:**

- ➕ `@astrojs/vercel`

---

## 🎯 **Flow po implementacji:**

```
Push do master
    ↓
GitHub Actions triggered
    ↓
Job: test
  ├─ npm ci
  ├─ npm run lint ✓
  ├─ prettier --check ✓
  └─ npm run build ✓
    ↓
Job: deploy (tylko jeśli test ✓)
  └─ vercel --prod
    ↓
Deployment ready
  └─ https://10x-project.vercel.app
```

**Dla Pull Requests:**

```
PR created
    ↓
GitHub Actions: test + deploy-preview
    ↓
Preview URL: https://10x-project-git-branch.vercel.app
    ↓
Bot komentuje PR z linkiem preview
```

---

## 🧪 **Różnice: Static vs Server vs Hybrid**

### **Static (obecna konfiguracja):**

```js
output: "static";
```

- ✅ Wszystko generowane podczas build
- ✅ Najszybsze (pure HTML/CSS/JS)
- ❌ Brak SSR, brak API routes
- ❌ Nie działa z Supabase Auth przez `context.locals`

### **Server (rekomendowane dla PortfelIO):**

```js
output: "server";
adapter: vercel();
```

- ✅ Pełne SSR dla wszystkich stron
- ✅ API routes działają jako serverless functions
- ✅ Supabase Auth przez `context.locals`
- ⚠️ Każde żądanie = wywołanie funkcji (wyższe koszty)

### **Hybrid (optymalne dla produkcji):**

```js
output: "hybrid";
adapter: vercel();
```

- ✅ SSG domyślnie (szybkie)
- ✅ SSR tylko tam gdzie potrzeba (`export const prerender = false`)
- ✅ API routes SSR
- ✅ Landing page statyczny (SEO + speed)
- ✅ Dashboard/auth SSR

**Przykład hybrid:**

```astro
---
// src/pages/index.astro (landing page)
export const prerender = true; // SSG - statyczna strona
---

--- // src/pages/dashboard.astro export const prerender = false; // SSR - wymaga auth --- --- //
src/pages/api/receipts/scan.ts export const prerender = false; // SSR - API route (WYMAGANE) ---
```

---

## 💰 **Koszty Vercel**

### **Free tier (Hobby):**

- ✅ Unlimited projects
- ✅ 100GB bandwidth/miesiąc
- ✅ 100 GB-hours serverless execution/miesiąc
- ✅ 1000 Edge Middleware invocations/dzień
- ⚠️ Limit: **10s max execution time** (za mało dla skanowania paragonów!)

### **Pro ($20/miesiąc/użytkownik):**

- ✅ 1TB bandwidth
- ✅ 1000 GB-hours serverless
- ✅ **60s max execution time** (zgodne z PRD!)
- ✅ Team collaboration
- ✅ Vercel Analytics

**Dla PortfelIO MVP:**

- **Start:** Free tier (testy, development)
- **Produkcja:** Pro tier ($20/m) - **wymagane dla 60s timeout AI scanning**

---

## 📝 **Checklist implementacji:**

### **Przed implementacją:**

- [ ] Backup projektu (git commit)
- [ ] Node.js 22 zainstalowany
- [ ] Konto na Vercel utworzone

### **Instalacja:**

- [ ] `npm install @astrojs/vercel`
- [ ] Modyfikacja `astro.config.mjs`
- [ ] Utworzenie `.github/workflows/vercel-deploy.yml`
- [ ] Utworzenie `vercel.json`
- [ ] Utworzenie `src/pages/test-ssr.astro`
- [ ] Utworzenie `src/pages/api/hello.ts`
- [ ] Aktualizacja `CLAUDE.md`
- [ ] Usunięcie `.github/workflows/azure-staticwebapp.yml`

### **Testy lokalne:**

- [ ] `npm run build` (bez błędów)
- [ ] `npm run lint` (bez błędów)
- [ ] `npx prettier --check .` (bez błędów)
- [ ] `npx vercel dev` (opcjonalnie - test lokalny)

### **Konfiguracja Vercel:**

- [ ] Połączenie repo z Vercel Dashboard
- [ ] Wyłączenie automatycznego deploy w Vercel
- [ ] Zdobycie `VERCEL_TOKEN`, `ORG_ID`, `PROJECT_ID`
- [ ] Dodanie GitHub Secrets

### **Deployment:**

- [ ] Push do `master`
- [ ] GitHub Actions przeszły ✅
- [ ] Vercel deployment sukces ✅

### **Weryfikacja:**

- [ ] Test SSR: `/test-ssr` (timestamp zmienia się)
- [ ] Test API: `/api/hello` (zwraca JSON)
- [ ] Test preview: Utwórz PR → sprawdź preview URL
- [ ] Sprawdź logi w Vercel Dashboard

---

## 🔧 **Troubleshooting**

### **Problem: Build fails na Vercel**

```
Error: Cannot find module '@astrojs/vercel'
```

**Rozwiązanie:**

```bash
npm install @astrojs/vercel
git add package.json package-lock.json
git commit -m "fix: add @astrojs/vercel dependency"
git push
```

### **Problem: GitHub Actions nie uruchamia się**

**Rozwiązanie:**

1. Sprawdź ścieżkę: `.github/workflows/vercel-deploy.yml` (nie `workflow`)
2. Sprawdź YAML syntax (użyj [yamllint.com](https://www.yamllint.com/))
3. Sprawdź GitHub Actions tab → czy są błędy

### **Problem: Deployment fails - "Missing secrets"**

```
Error: VERCEL_TOKEN not found
```

**Rozwiązanie:**

- GitHub repo → Settings → Secrets and variables → Actions
- Dodaj: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

### **Problem: SSR nie działa (timestamp się nie zmienia)**

**Rozwiązanie:**

1. Sprawdź `astro.config.mjs`: czy `output: "server"`?
2. Sprawdź `vercel.json`: czy region jest ustawiony?
3. Sprawdź logi Vercel: Functions → Logs (czy są requesty?)

### **Problem: API route zwraca 404**

**Rozwiązanie:**

1. Sprawdź ścieżkę: `src/pages/api/hello.ts` (nie `src/api/`)
2. Sprawdź czy plik ma `export const GET` lub `export const POST`
3. Dla hybrid: Dodaj `export const prerender = false` na początku pliku

---

## 📚 **Dokumentacja**

- [Astro Deployment - Vercel](https://docs.astro.build/en/guides/deploy/vercel/)
- [Vercel Docs - Astro](https://vercel.com/docs/frameworks/astro)
- [GitHub Actions - Vercel Action](https://github.com/amondnet/vercel-action)
- [Astro SSR Adapters](https://docs.astro.build/en/guides/server-side-rendering/)
