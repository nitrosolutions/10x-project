# Sesja optymalizacji prompta do skanowania paragonów

**Data:** 2025-10-23
**Plik:** `src/pages/api/receipts/scan.ts`
**Problem:** AI niepoprawnie rozpoznaje paragony LIDL z rabatami

---

## Problem początkowy

### Objawy
Błąd walidacji Zod:
```
ZodError: price must be positive number
Path: items[3].price, items[5].price
```

### Przyczyna
AI tworzy osobne items dla linii rabatowych:
```json
// BŁĘDNIE:
{
  "items": [
    {"name": "MMMAX Czekolada 1", "price": 21.99},
    {"name": "OPUST MMMAX Czekolada 1", "price": -21.98},  // ❌ ujemna cena
    ...
  ]
}
```

### Paragon przykładowy (LIDL)
```
MMMAX Czekolada 1        1 x21.99 21.99A
OPUST MMMAX Czekolada 1  X        -21.98
                                   0.01A
D.Actimel trusk.         1 x21.99 21.99C
OPUST D.Actimel trusk.   F        -5.00
                                  16.99C
Kabanosy Exclus. 90g     2 x6.79  13.58C
OPUST Kabanosy Exclus.   F        -1.40
                                  12.18C
```

**Oczekiwany wynik:** 3 produkty z cenami po rabacie (0.01, 16.99, 12.18)
**Otrzymany wynik:** 6 items, w tym 3 z ujemnymi cenami

---

## Próby rozwiązania

### Próba 1: Wzmocnienie instrukcji w istniejącym promptcie
**Co zrobiono:**
- Dodano słowo kluczowe "OPUST" do listy rabatów
- Dodano ostrzeżenia o ujemnych cenach
- Dodano przykład z "OPUST MMMAX Czekolada"

**Wynik:** ❌ Nadal tworzy items z ujemnymi cenami

---

### Próba 2: Post-processing w kodzie (filtrowanie)
**Co zrobiono:**
```javascript
// Filtruj items - usuń te z ceną <= 0 LUB nazwy z "OPUST"
parsedData.items = parsedData.items.filter((item) => {
  const hasValidPrice = item.price > 0;
  const isDiscountLine = ["OPUST", "RABAT"].some(k =>
    item.name.includes(k)
  );
  return hasValidPrice && !isDiscountLine;
});
```

**Wynik:** ⚠️ Częściowo działa, ale użytkownik chce TYLKO zmiany prompta, nie kodu

---

### Próba 3: Post-processing z scalaniem rabatów
**Co zrobono:**
```javascript
// Scal rabaty z produktami przed filtrowaniem
for (let i = 1; i < items.length; i++) {
  if (isDiscountLine(items[i])) {
    items[i-1].price -= Math.abs(items[i].price);
    markToRemove(i);
  }
}
```

**Wynik:** ✅ Działa, ale ODRZUCONE - wymaganie: tylko prompt, bez logiki

---

### Próba 4: Całkowite przepisanie prompta na algorytmiczny
**Co zrobiono:**
- Skrócono prompt z ~300 do ~60 linii
- Zamieniono "zasady" na "algorytm 4-krokowy"
- Dodano przykład DOBRY vs ZŁY
- Dodano konkretny przykład z paragonu użytkownika

**Wynik:** ❌ Przestał działać dla wcześniejszych przypadków

---

### Próba 5: Odkrycie drugiego problemu - "Czekolada 2"

**Nowy problem:**
```
MMMAX Czekolada 1    21.99    → OPUST → price: 0.01 ✅
MMMAX Czekolada 2    21.99    → BRAK OPUST → price: 21.99 ❌ (AI zwraca 0.01)
```

AI myślała że "Czekolada 2" to kontynuacja rabatu z "Czekolada 1".

**Rozwiązanie:** Dodano instrukcję sprawdzania linii NASTĘPNEJ:
```
KROK 3: SPRAWDŹ linię NASTĘPNĄ po produkcie:
- Czy zaczyna się od "OPUST"?
- Czy zawiera TĘ SAMĄ nazwę?
- Jeśli TAK → rabat
- Jeśli NIE → pełna cena
```

**Wynik:** ⚠️ Rozwiązało problem Czekolady 2, ale...

---

### Próba 6: Trzeci problem - ceny jednostkowe zamiast sum

**Nowy problem:**
```
Kluski na parze    2 x3.90 7.80C
→ AI zwraca: price: 3.90 ❌ (cena jednostkowa)
→ Powinno być: price: 7.80 ✅ (suma)
```

**Rozwiązanie:** Dodano instrukcję:
```
ZAWSZE bierz OSTATNIĄ kwotę z linii (przed literą A/C/F) jako price
```

**Wynik:** ⚠️ Pomogło, ale prompt stał się zbyt długi i chaotyczny

---

### Próba 7: Przywrócenie usuniętych instrukcji

**Problem:** Skracając prompt usunęliśmy instrukcje które działały dla przypadku "Chipsy":
```
L.Chipsy papryka130g     8.29
OPUST L.Chipsy papryka   -8.28
→ AI zwraca: 8.29 (bez rabatu) ❌ + osobny item "OPUST" ❌
```

**Rozwiązanie:** Przywrócono szczegółowe instrukcje + dodano krok-po-kroku przykład.

**Wynik:** ❌ **POGORSZENIE** - prompt zbyt długi, sprzeczne instrukcje, AI się gubi

---

## Wnioski i lekcje

### Co NIE działa:
1. ❌ Iteracyjne dodawanie instrukcji bez usuwania starych
2. ❌ Zbyt długi prompt (>200 linii) - AI traci kontekst
3. ❌ Wiele przykładów pokrywających edge cases - AI się gubi
4. ❌ Instrukcje "zasadowe" (co robić) bez struktury (jak robić)
5. ❌ Polecenia typu "NIGDY", "ZAWSZE", "KRYTYCZNE" bez algorytmu

### Co zaobserwowano:
1. AI źle radzi sobie z wariantami tego samego produktu (Czekolada 1 vs 2)
2. AI ma problem z formatem LIDL: `ilość xcena_jednostkowa SUMA`
3. AI tworzy items dla linii rabatowych mimo jasnych instrukcji
4. Każda poprawka rozwiązywała jeden problem, ale psuła inny

### Dlaczego post-processing był lepszy:
- ✅ Działał niezawodnie dla wszystkich przypadków
- ✅ Prosty kod, łatwy do debugowania
- ✅ Nie zależał od "zrozumienia" AI
- ❌ Ale użytkownik chce rozwiązania tylko przez prompt

---

## Kluczowe przypadki testowe

### Test 1: Podstawowy rabat
```
Produkt A    10.00
OPUST A      -3.00
→ Oczekiwane: [{"name": "Produkt A", "price": 7.00}]
```

### Test 2: Rabat prawie 100%
```
MMMAX Czekolada 1    21.99
OPUST MMMAX Czek...  -21.98
→ Oczekiwane: [{"name": "MMMAX Czekolada 1", "price": 0.01}]
```

### Test 3: Produkt bez rabatu po produkcie z rabatem
```
MMMAX Czekolada 1    21.99
OPUST MMMAX Czek 1   -21.98
MMMAX Czekolada 2    21.99
Mleko                3.59
→ Oczekiwane: [
  {"name": "MMMAX Czekolada 1", "price": 0.01},
  {"name": "MMMAX Czekolada 2", "price": 21.99},  // Pełna cena!
  {"name": "Mleko", "price": 3.59}
]
```

### Test 4: Format ilość×cena=suma
```
Kluski na parze    2 x3.90 7.80C
Chusteczki 2-w.    5 x3.00 15.00A
→ Oczekiwane: [
  {"name": "Kluski na parze", "price": 7.80},      // SUMA, nie 3.90
  {"name": "Chusteczki 2-w.", "price": 15.00}      // SUMA, nie 3.00
]
```

### Test 5: Kombinacja wszystkich problemów
```
L.Chipsy papryka130g     1 x8.29 8.29C
OPUST L.Chipsy papryka   F       -8.28
Chusteczki uni. 2-w.     5 x3.00 15.00A
→ Oczekiwane: [
  {"name": "L.Chipsy papryka130g", "price": 0.01},
  {"name": "Chusteczki uni. 2-w.", "price": 15.00}
]
→ NIE: 3 items, nie 4 (bez "OPUST" jako item)
→ NIE: Chipsy 8.29 (pełna cena bez rabatu)
→ NIE: Chusteczki 3.00 (cena jednostkowa)
```

---

## Format paragonu LIDL - kluczowe wzorce

### Struktura linii produktu:
```
Nazwa produktu    [ilość x cena_jedn.] SUMA_CAŁKOWITA [A/C/F]
```

### Struktura linii rabatu:
```
OPUST Nazwa_prod    [litera]    -kwota_rabatu
                                NOWA_SUMA_PO_RABACIE [A/C/F]
```

### Przykłady:
```
Kabanosy Exclus. 90g  F    2 x6.79 13.58C
OPUST Kabanosy Exclus. 90g  F       -1.40
                                    12.18C
```

### Wzorce nazw:
- Produkty mogą mieć warianty: "MMMAX Czekolada 1", "MMMAX Czekolada 2"
- Rabat zawiera fragment nazwy: "OPUST MMMAX Czekolada 1"
- Rabat dotyczy TYLKO produktu bezpośrednio powyżej

---

## Sugerowany plan działania od nowa

### Krok 1: Analiza
- [ ] Przywróć oryginalny prompt z repo
- [ ] Zidentyfikuj minimalny zestaw instrukcji który działał
- [ ] Przeanalizuj co dokładnie się zepsuło po każdej iteracji

### Krok 2: Nowy prompt - struktura
Zamiast długich instrukcji, spróbuj:

```markdown
STRUKTURA PARAGONU LIDL:
Produkt: [nazwa] [ilość x cena_jedn.] SUMA [litera]
Rabat:   OPUST [nazwa] -kwota
         (następna linia) NOWA_SUMA

ALGORYTM PRZETWARZANIA:
1. Wczytaj wszystkie linie
2. Dla każdej linii NIE zawierającej "OPUST":
   a. Nazwa = tekst przed pierwszą cyfrą/liczbą
   b. Cena = OSTATNIA liczba przed literą A/C/F
3. Sprawdź linię następną:
   - Jeśli "OPUST" + ta sama nazwa → odejmij rabat
   - Jeśli nie → zostaw cenę bez zmian
4. Dodaj do items[], pomiń linie OPUST

PRZYKŁAD (pełny paragon):
[podaj 1-2 KOMPLETNE przykłady, nie fragmenty]

BŁĘDY DO UNIKANIA:
[lista 3-4 najczęstszych błędów]
```

### Krok 3: Testowanie systematyczne
- [ ] Test 1: Podstawowy rabat → PASS/FAIL
- [ ] Test 2: Rabat 100% → PASS/FAIL
- [ ] Test 3: Produkt 1 vs Produkt 2 → PASS/FAIL
- [ ] Test 4: Format ilość×cena → PASS/FAIL
- [ ] Test 5: Kombinacja → PASS/FAIL

### Krok 4: Jeśli prompt nie działa
**Rozważ hybrydowe rozwiązanie:**
- Prompt: instrukcje dla AI (uproszczone)
- Post-processing: safety net (naprawia błędy AI)

**Zalety:**
- Prompt pozostaje czytelny i krótki
- Safety net łapie edge cases
- Łatwiejsze utrzymanie i debugowanie

---

## Kod post-processingu (dla referencji)

Jeśli prompt przestanie działać, ten kod naprawia wszystkie problemy:

```typescript
// Po parsowaniu JSON z AI:
if (Array.isArray(parsedData.items)) {
  const discountKeywords = ["OPUST", "RABAT", "UPUST", "PROMOCJA"];
  const itemsToRemove = new Set<number>();

  // Scal rabaty z produktami
  for (let i = 1; i < parsedData.items.length; i++) {
    const current = parsedData.items[i];
    const previous = parsedData.items[i - 1];

    const isDiscountLine =
      typeof current.name === "string" &&
      discountKeywords.some((k) => current.name.toUpperCase().includes(k));

    if (isDiscountLine && previous) {
      // Odejmij rabat
      const discount = Math.abs(current.price || 0);
      previous.price = Math.max(previous.price - discount, 0.01);
      itemsToRemove.add(i);
    }
  }

  // Usuń linie rabatowe
  parsedData.items = parsedData.items.filter((item, idx) => {
    if (itemsToRemove.has(idx)) return false;
    return typeof item.price === "number" && item.price > 0;
  });
}
```

---

## Podsumowanie sesji

**Czas:** ~2h iteracji
**Ilość prób:** 7 głównych podejść
**Wynik:** ❌ Pogorszenie jakości rozpoznawania
**Główny problem:** Iteracyjne łatanie zamiast przeprojektowania
**Następne kroki:** Reset + systematyczne podejście od początku

---

## Notatki dodatkowe

### Specyfika Gemini AI
- Model dobrze radzi sobie z krótkimi, strukturalnymi instrukcjami
- Przykłady działają lepiej niż zasady
- "NIGDY/ZAWSZE" ignorowane jeśli brak konkretnego algorytmu
- Długie prompty (>150 linii) → strata kontekstu

### Alternatywne podejścia do rozważenia
1. **Few-shot learning:** 5-10 przykładów zamiast instrukcji
2. **Chain-of-thought:** Poproś AI o "myślenie na głos" przed JSON
3. **Structured output:** Użyj schema prompting (jeśli Gemini obsługuje)
4. **Hybrid:** Prosty prompt + post-processing safety net

### Pytania bez odpowiedzi
- Czy Gemini 2.5 Pro ma limit długości promptu który powoduje problemy?
- Czy temperatura 0.1 jest optymalna dla tego zadania?
- Czy warto przetestować inny model (GPT-4, Claude)?
