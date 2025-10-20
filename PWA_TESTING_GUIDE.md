# Przewodnik testowania PWA

## ⚠️ Ważna informacja o trybie deweloperskim

**Event `beforeinstallprompt` NIE DZIAŁA w trybie deweloperskim (`npm run dev`)!**

### Dlaczego przycisk instalacji nie pokazuje się w Chrome podczas developmentu?

Chrome (i inne przeglądarki) wymagają spełnienia **kryteriów instalacji PWA**:

1. ✅ **Manifest** - musi być poprawnie załadowany
2. ✅ **HTTPS** - strona musi działać na HTTPS (lub localhost)
3. ❌ **Service Worker** - **musi być zarejestrowany i aktywny**
4. ❌ **Kryteria zaangażowania** - użytkownik musi odwiedzić stronę więcej niż raz

**Problem**: W trybie `npm run dev`, vite-plugin-pwa nie generuje w pełni funkcjonalnego Service Workera, więc `beforeinstallprompt` nigdy nie jest wywoływany.

## ✅ Jak poprawnie przetestować instalację PWA?

### Opcja 1: Build produkcyjny + podgląd lokalny (ZALECANE)

```bash
# 1. Zbuduj aplikację dla produkcji
npm run build

# 2. Podgląd buildu produkcyjnego
npm run preview
```

Aplikacja będzie dostępna na `http://localhost:4321` (lub inny port).

**Teraz:**

1. Otwórz Chrome/Edge
2. Przejdź do strony dodawania paragonu
3. Rozpocznij skanowanie (wybierz zdjęcie)
4. **Przycisk instalacji PWA powinien się pojawić!**
5. Kliknij przycisk i zainstaluj aplikację

### Opcja 2: Deploy na Vercel i testowanie produkcji

```bash
# Deploy na Vercel
vercel --prod
```

Aplikacja będzie dostępna na HTTPS (np. `https://10x-project.vercel.app`).

**Vercel automatycznie:**

- Używa HTTPS
- Rejestruje Service Worker
- Spełnia wszystkie kryteria PWA

### Opcja 3: Testowanie w Chrome DevTools (symulacja)

Możesz **wymusić** pokazanie przycisku instalacji w Chrome DevTools:

1. Otwórz `http://localhost:3000` w Chrome
2. Otwórz DevTools (F12)
3. Przejdź do zakładki **Application**
4. W lewym menu wybierz **Manifest**
5. Kliknij przycisk **"Update on reload"**
6. W sekcji Service Workers, zarejestruj manual SW (jeśli dostępny)
7. Odśwież stronę

**Uwaga**: To może nie zadziałać jeśli SW nie jest dostępny w dev mode.

## 🔍 Debugowanie PWA

### Sprawdź konsolę przeglądarki

Aplikacja loguje informacje o PWA:

```
[PWA] Detected platform: desktop
[PWA] Is installed: false
[PWA] Desktop detected - showing install button (waiting for beforeinstallprompt)
```

Jeśli widzisz:

- `[PWA] beforeinstallprompt event fired!` - ✅ Wszystko OK
- Brak tego loga - ❌ Service Worker nie działa lub kryteria nie są spełnione

### Sprawdź czy aplikacja jest już zainstalowana

Chrome nie pokazuje promptu instalacji jeśli aplikacja **jest już zainstalowana**.

**Jak sprawdzić:**

1. Otwórz `chrome://apps` w Chrome
2. Szukaj "PortfelIO"
3. Jeśli jest zainstalowana - odinstaluj ją
4. Odśwież stronę

**Lub** sprawdź Chrome menu:

- Chrome → Więcej narzędzi → Zainstalowane aplikacje PWA

### Sprawdź Application w DevTools

1. Otwórz DevTools (F12)
2. Zakładka **Application**
3. Sprawdź:
   - **Manifest**: Czy jest załadowany poprawnie
   - **Service Workers**: Czy są zarejestrowane
   - **Storage**: Czy ikony są dostępne

## 📱 Testowanie na różnych platformach

### Desktop Chrome/Edge (Windows/Mac/Linux)

**Wymagania:**

- Chrome 90+ lub Edge 90+
- Service Worker zarejestrowany
- Manifest poprawnie skonfigurowany

**Oczekiwane zachowanie:**

1. Przycisk instalacji pojawia się podczas skanowania
2. Kliknięcie pokazuje natywny prompt Chrome
3. Po instalacji - ikona w menu aplikacji Windows/Mac

### Android Chrome

**Wymagania:**

- Chrome 90+ na Androidzie
- Service Worker zarejestrowany
- Manifest z ikonami

**Oczekiwane zachowanie:**

1. Przycisk instalacji pojawia się podczas skanowania
2. Kliknięcie pokazuje natywny prompt Android
3. Po instalacji - ikona na ekranie głównym

**Testowanie:**

- Użyj Chrome Remote Debugging
- Lub deploy na Vercel i testuj na prawdziwym urządzeniu

### iOS Safari

**Wymagania:**

- Safari 16.4+ na iOS
- Manifest poprawnie skonfigurowany

**Oczekiwane zachowanie:**

1. Przycisk instalacji pojawia się podczas skanowania
2. Kliknięcie pokazuje **modal z instrukcjami**
3. Użytkownik wykonuje ręczne kroki
4. Po wykonaniu kroków - ikona na ekranie głównym iOS

**Uwaga**: iOS **nigdy** nie wywołuje `beforeinstallprompt`. Instrukcje są zawsze pokazywane.

## 🐛 Typowe problemy

### Problem: Przycisk się nie pokazuje w Chrome Desktop

**Przyczyny:**

1. ❌ Tryb deweloperski (`npm run dev`) - Service Worker nie działa
2. ❌ Aplikacja już zainstalowana - Chrome nie pokazuje promptu
3. ❌ Przeglądarka nie wspiera PWA (np. Firefox)

**Rozwiązania:**

1. ✅ Użyj `npm run build && npm run preview`
2. ✅ Odinstaluj aplikację z `chrome://apps`
3. ✅ Użyj Chrome lub Edge

### Problem: Service Worker 404

**Przyczyna:**

- vite-plugin-pwa nie generuje SW w trybie dev

**Rozwiązanie:**

- Testuj tylko w build mode (`npm run preview`)

### Problem: Manifest 404

**Przyczyna:**

- Problem z konfiguracją vite-plugin-pwa

**Rozwiązanie:**

- Sprawdź czy `http://localhost:3000/manifest.webmanifest` zwraca JSON
- Jeśli 404 - sprawdź `astro.config.mjs`

## ✅ Checklist przed testowaniem

- [ ] Zainstalowano `vite-plugin-pwa`
- [ ] Wygenerowano ikony PWA (pwa-192x192.png, pwa-512x512.png)
- [ ] Skonfigurowano manifest w `astro.config.mjs`
- [ ] Zbudowano aplikację (`npm run build`)
- [ ] Uruchomiono preview (`npm run preview`)
- [ ] Otwarto Chrome/Edge
- [ ] Sprawdzono czy aplikacja NIE jest już zainstalowana
- [ ] Przeszedłem do strony skanowania paragonu
- [ ] Wybrałem zdjęcie aby rozpocząć skanowanie
- [ ] Przycisk instalacji **powinien się pojawić**

## 📝 Podsumowanie

**Kluczowa zasada:**

> **PWA instalacja działa TYLKO w build mode lub na deployed version (Vercel)!**
>
> NIE testuj w trybie `npm run dev` - to nie zadziała!

**Najszybsza metoda testowania:**

```bash
npm run build && npm run preview
```

Następnie otwórz `http://localhost:4321` w Chrome i testuj!
