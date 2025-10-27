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
   - Wykrywa platformę (iOS, Android, Desktop)
   - Sprawdza czy aplikacja może być zainstalowana
   - Sprawdza czy aplikacja jest już zainstalowana
   - Obsługuje natywny prompt instalacji (Chrome/Edge Desktop i Android)
   - Zwraca informacje o wsparciu dla natywnego promptu

2. **src/components/pwa/IOSInstallInstructions.tsx** - Modal z instrukcjami instalacji dla iOS
   - Krokowa instrukcja jak dodać aplikację na iOS Safari
   - Wykorzystuje shadcn/ui Dialog component
   - Wyświetlana automatycznie dla użytkowników iOS

3. **src/pwa.d.ts** - Definicje TypeScript dla virtual modules PWA
   - Typy dla `virtual:pwa-info`
   - Typy dla `virtual:pwa-register`

4. **public/PWA_ICONS_INSTRUCTIONS.md** - Instrukcje generowania ikon PWA

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
   - Zaimportowano hook `usePWAInstall` i komponent `IOSInstallInstructions`
   - Dodano handler `handleInstallPWA` z obsługą różnych platform
   - Dodano duży, centralny przycisk instalacji z gradientem i animacją pulse
   - Button widoczny tylko podczas skanowania (`isScanning === true`)
   - Button wyświetlany tylko gdy aplikacja jest instalowalna (`isInstallable === true`)
   - Automatyczne wykrywanie platformy i dostosowanie zachowania:
     - **Desktop Chrome/Edge, Android**: Natywny prompt instalacji
     - **iOS Safari**: Modal z instrukcjami krok po kroku

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

#### Desktop Chrome/Edge oraz Android Chrome

1. Użytkownik dodaje nowy paragon poprzez aparat/galerię
2. Podczas analizy AI pojawia się duży, centralny przycisk instalacji z gradientem i animacją
3. Kliknięcie buttona wywołuje natywny prompt instalacji przeglądarki
4. Po instalacji aplikacja jest dostępna na ekranie głównym

#### iOS Safari

1. Użytkownik dodaje nowy paragon poprzez aparat/galerię
2. Podczas analizy AI pojawia się duży, centralny przycisk instalacji
3. Kliknięcie buttona otwiera modal z instrukcjami krok po kroku:
   - Naciśnij przycisk "Udostępnij" (ikona Share)
   - Wybierz "Dodaj do ekranu początkowego"
   - Potwierdź dodanie
4. Po wykonaniu kroków aplikacja jest dostępna na ekranie głównym

### Hook `usePWAInstall`

```typescript
import { usePWAInstall } from "@/hooks/usePWAInstall";

function MyComponent() {
  const {
    isInstallable,      // Czy aplikacja może być zainstalowana
    isInstalled,        // Czy aplikacja jest już zainstalowana
    platform,           // "ios" | "android" | "desktop" | "unknown"
    promptInstall,      // Funkcja do wywołania promptu instalacji
    supportsNativePrompt // Czy przeglądarka wspiera natywny prompt
  } = usePWAInstall();

  const handleInstall = async () => {
    // Dla iOS pokaż instrukcje, dla innych platform wywołaj natywny prompt
    if (platform === "ios" && !supportsNativePrompt) {
      // Pokaż modal z instrukcjami
      setShowInstructions(true);
      return;
    }

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

#### Na Desktop (Chrome/Edge)

1. Przejdź do strony dodawania paragonu
2. Wybierz zdjęcie (aparat lub galeria)
3. Podczas analizy sprawdź czy pojawia się duży przycisk instalacji (gradient niebieski-cyjan, animacja pulse)
4. Kliknij przycisk - pojawi się natywny prompt instalacji
5. Potwierdź instalację
6. Sprawdź czy ikona aplikacji pojawiła się w menu Start/Application folder

#### Na Android (Chrome)

1. Przejdź do strony dodawania paragonu
2. Wybierz zdjęcie (aparat lub galeria)
3. Podczas analizy sprawdź czy pojawia się duży przycisk instalacji
4. Kliknij przycisk - pojawi się natywny prompt instalacji Android
5. Potwierdź instalację
6. Sprawdź czy ikona aplikacji pojawiła się na ekranie głównym

#### Na iOS (Safari)

1. Przejdź do strony dodawania paragonu (używając Safari!)
2. Wybierz zdjęcie (aparat lub galeria)
3. Podczas analizy sprawdź czy pojawia się duży przycisk instalacji
4. Kliknij przycisk - pojawi się modal z instrukcjami
5. Wykonaj kroki opisane w modalu:
   - Naciśnij przycisk "Udostępnij" na pasku Safari
   - Przewiń w dół i wybierz "Dodaj do ekranu początkowego"
   - Potwierdź dodanie
6. Sprawdź czy ikona aplikacji pojawiła się na ekranie głównym iOS

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

- iOS Safari **nie wspiera** `beforeinstallprompt` API
- Aplikacja automatycznie wykrywa iOS i wyświetla modal z instrukcjami zamiast natywnego promptu
- Użytkownicy iOS widzą krok po kroku instrukcje jak dodać aplikację przez menu "Udostępnij"
- Przycisk instalacji pojawia się również na iOS podczas skanowania paragonu

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
