# Implementacja PWA w PortfelIO

## Przegląd

Projekt został zaktualizowany o pełne wsparcie Progressive Web App (PWA) z użyciem `vite-plugin-pwa`. Główne cechy:

- **Instalacja PWA**: Użytkownicy mogą zainstalować aplikację na ekranie głównym urządzenia
- **FAB Button**: Przycisk instalacji pojawia się tylko podczas analizy paragonu przez AI
- **Service Worker**: Automatyczna rejestracja i aktualizacja
- **Manifest**: Pełna konfiguracja web app manifest
- **Ikony**: Wygenerowane ikony w różnych rozmiarach dla wszystkich platform

## Zainstalowane pakiety

```json
{
  "vite-plugin-pwa": "^latest",
  "workbox-window": "^latest"
}
```

## Struktura plików

### Nowe pliki

1. **src/hooks/usePWAInstall.ts** - Hook React do obsługi instalacji PWA
   - Wykrywa czy aplikacja może być zainstalowana
   - Sprawdza czy aplikacja jest już zainstalowana
   - Obsługuje prompt instalacji

2. **src/pwa.d.ts** - Definicje TypeScript dla virtual modules PWA
   - Typy dla `virtual:pwa-info`
   - Typy dla `virtual:pwa-register`

3. **public/PWA_ICONS_INSTRUCTIONS.md** - Instrukcje generowania ikon PWA

### Wygenerowane ikony

Wszystkie ikony zostały automatycznie wygenerowane z `public/favicon.svg`:

- `public/pwa-64x64.png`
- `public/pwa-192x192.png`
- `public/pwa-512x512.png`
- `public/maskable-icon-512x512.png`
- `public/apple-touch-icon-180x180.png`
- `public/favicon.ico`

### Zaktualizowane pliki

1. **astro.config.mjs**
   - Dodano import `vite-plugin-pwa`
   - Skonfigurowano manifest aplikacji
   - Ustawiono service worker z Workbox
   - Włączono tryb deweloperski dla PWA

2. **src/layouts/Layout.astro**
   - Dodano metatagi PWA (theme-color, viewport, description)
   - Dodano linki do manifestu i ikon
   - Zaimportowano i użyto `virtual:pwa-info`
   - Dodano automatyczną rejestrację service workera

3. **src/components/receipts/ReceiptScanner.tsx**
   - Zaimportowano hook `usePWAInstall`
   - Dodano handler `handleInstallPWA`
   - Dodano FAB button z ikoną Download
   - Button widoczny tylko podczas skanowania (`isScanning === true`)
   - Button wyświetlany tylko gdy aplikacja jest instalowalna (`isInstallable === true`)

## Konfiguracja PWA

### Manifest (astro.config.mjs)

```javascript
manifest: {
  name: "PortfelIO",
  short_name: "PortfelIO",
  description: "Automatyczne śledzenie wydatków przez skanowanie paragonów",
  start_url: "/",
  display: "standalone",
  background_color: "#ffffff",
  theme_color: "#0ea5e9",
  lang: "pl",
  icons: [
    // 5 różnych rozmiarów ikon
  ]
}
```

### Service Worker

- **Typ rejestracji**: `autoUpdate` - automatyczne aktualizacje w tle
- **Workbox**: Cache dla statycznych zasobów i Google Fonts
- **Dev mode**: Włączony dla testowania w środowisku deweloperskim

## Użycie

### Instalacja aplikacji

1. Użytkownik dodaje nowy paragon poprzez aparat/galerię
2. Podczas analizy AI pojawia się FAB button z ikoną pobierania
3. Kliknięcie buttona wywołuje natywny prompt instalacji przeglądarki
4. Po instalacji aplikacja jest dostępna na ekranie głównym

### Hook `usePWAInstall`

```typescript
import { usePWAInstall } from "@/hooks/usePWAInstall";

function MyComponent() {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();

  const handleInstall = async () => {
    const installed = await promptInstall();
    if (installed) {
      console.log("Aplikacja zainstalowana!");
    }
  };

  return (
    <>
      {isInstallable && !isInstalled && (
        <button onClick={handleInstall}>Zainstaluj</button>
      )}
    </>
  );
}
```

## Testowanie

### Środowisko deweloperskie

```bash
npm run dev
```

Aplikacja dostępna na `http://localhost:3000` (lub inny port)

### Testowanie PWA

1. Otwórz aplikację w przeglądarce Chrome/Edge
2. Otwórz DevTools (F12)
3. Przejdź do zakładki "Application"
4. Sprawdź:
   - **Manifest**: Czy manifest jest poprawnie załadowany
   - **Service Workers**: Czy SW jest zarejestrowany
   - **Storage**: Czy ikony są cache'owane

### Testowanie instalacji

1. Przejdź do strony dodawania paragonu
2. Wybierz zdjęcie (aparat lub galeria)
3. Podczas analizy sprawdź czy pojawia się FAB button
4. Kliknij button i potwierdź instalację
5. Sprawdź czy ikona aplikacji pojawiła się na ekranie głównym

## Build produkcyjny

```bash
npm run build
```

Service Worker i manifest będą automatycznie wygenerowane podczas buildu.

## Wspierane platformy

- ✅ **Desktop**: Chrome, Edge, Firefox (z ograniczeniami)
- ✅ **Android**: Chrome, Edge, Samsung Internet
- ✅ **iOS/iPadOS**: Safari 16.4+ (z ograniczeniami)

### Uwagi dla iOS

- iOS Safari ma ograniczone wsparcie dla `beforeinstallprompt`
- Użytkownicy iOS muszą używać "Add to Home Screen" z menu Safari
- FAB button może nie działać na iOS (wykrycie instalacji może być niemożliwe)

## Zgodność z PRD

Implementacja spełnia wymagania z dokumentów:
- ✅ **README.md** - Sekcja PWA Features
- ✅ **.ai/prd.md** - Sekcja 3.7 (Progresywna Aplikacja Webowa)

### Zaimplementowane funkcjonalności (zgodnie z PRD)

- ✅ Możliwość dodania do ekranu głównego (iOS/Android/Desktop)
- ✅ App-like experience po instalacji (tryb standalone)
- ✅ Ikona aplikacji na ekranie głównym
- ✅ Splash screen podczas uruchamiania
- ✅ Responsywny design
- ✅ Web App Manifest z wszystkimi wymaganymi polami
- ✅ Service Worker dla podstawowej funkcjonalności PWA
- ✅ Zachęta do instalacji PWA podczas analizy AI

### Ograniczenia MVP (zgodnie z PRD)

- ❌ Brak wsparcia dla trybu offline
- ❌ Aplikacja wymaga stałego połączenia internetowego
- ❌ Brak synchronizacji danych w tle
- ℹ️ Service Worker używany tylko do instalacji PWA i cache podstawowych zasobów

## Dodatkowe notatki

### Regeneracja ikon

Jeśli potrzebujesz regenerować ikony (np. po zmianie logo):

```bash
npx @vite-pwa/assets-generator --preset minimal-2023 public/favicon.svg
```

### Aktualizacja Service Workera

Service Worker automatycznie aktualizuje się po każdym deploymencie. Użytkownicy otrzymają nową wersję przy następnym odświeżeniu aplikacji.

### Debugging

W razie problemów:
1. Sprawdź konsolę przeglądarki
2. Sprawdź zakładkę Application > Manifest w DevTools
3. Sprawdź zakładkę Application > Service Workers
4. Wyczyść cache i odinstaluj SW jeśli coś nie działa

## Kolejne kroki (opcjonalne)

Post-MVP rozszerzenia mogą obejmować:
- Push notifications
- Offline mode z synchronizacją
- Background sync dla dodawania paragonów
- Share API dla eksportowania danych
