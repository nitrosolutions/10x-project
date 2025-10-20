# Instrukcje generowania ikon PWA

Aby aplikacja PWA działała poprawnie, potrzebne są ikony w następujących rozmiarach:

## Wymagane rozmiary

- `pwa-192x192.png` - ikona 192x192 pikseli
- `pwa-512x512.png` - ikona 512x512 pikseli

## Opcje generowania

### Opcja 1: Użyj narzędzia online

1. Wejdź na https://realfavicongenerator.net/
2. Prześlij plik `favicon.svg`
3. Skonfiguruj opcje dla Android/Chrome
4. Pobierz wygenerowane pliki
5. Umieść `pwa-192x192.png` i `pwa-512x512.png` w folderze `public/`

### Opcja 2: Użyj PWA Asset Generator

```bash
npx @vite-pwa/assets-generator --preset minimal public/favicon.svg
```

### Opcja 3: Ręczne stworzenie w edytorze graficznym

1. Otwórz `favicon.svg` w Inkscape, Figma lub Adobe Illustrator
2. Wyeksportuj jako PNG w rozmiarach 192x192 i 512x512
3. Zapisz pliki jako `pwa-192x192.png` i `pwa-512x512.png` w folderze `public/`

### Opcja 4: Użyj ImageMagick (jeśli zainstalowany)

```bash
# Zainstaluj ImageMagick z https://imagemagick.org/script/download.php
magick convert -background none -resize 192x192 public/favicon.svg public/pwa-192x192.png
magick convert -background none -resize 512x512 public/favicon.svg public/pwa-512x512.png
```

## Uwagi

- Ikony powinny mieć przezroczyste tło lub białe tło
- Format PNG z obsługą przezroczystości (PNG-32)
- Ikony będą używane jako app icon na ekranie głównym urządzeń mobilnych
