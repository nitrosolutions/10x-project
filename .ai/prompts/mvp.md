# Aplikacja - PortfelIO (MVP)

## Główny problem

Manualne śledzenie domowych wydatków jest pracochłonne i podatne na błędy. Ręczne wpisywanie każdej pozycji z paragonu do arkusza kalkulacyjnego lub innej aplikacji jest nużące, przez co użytkownicy często rezygnują z regularnego kontrolowania swojego budżetu. Brak łatwego wglądu w strukturę wydatków utrudnia świadome zarządzanie finansami.

## Najmniejszy zestaw funkcjonalności

- Prosty system kont użytkowników do bezpiecznego przechowywania danych o wydatkach.
- Główny widok aplikacji to podsumowanie wydatków z wybranego miesiąca, prezentujące sumy w podziale na kategorie.
- Możliwość przeglądania listy wszystkich paragonów z wybranego miesiąca.
- Dodawanie wydatków poprzez skan paragonu (aparatem lub z pliku) lub ręczne wprowadzanie danych.
- Automatyczna analiza paragonu przez model AI w celu odczytania daty zakupu oraz pozycji (nazwa produktu, cena) i przypisania ich do predefiniowanych kategorii.
- Pełna edycja paragonu: możliwość zmiany daty zakupu, a także poprawy, usunięcia lub dodania nowej pozycji (nazwa, cena, kategoria).
- Aplikacja webowa z pełnym wsparciem RWD (dostosowana do mobile) i PWA (możliwość dodania do ekranu głównego).

## Co NIE wchodzi w zakres MVP

- Zaawansowane funkcje budżetowe (np. ustawianie limitów na kategorie, alerty).
- Możliwość tworzenia i zarządzania własnymi kategoriami wydatków.
- Generowanie szczegółowych raportów i wykresów analizujących wydatki.
- Funkcje związane z gwarancjami, terminami zwrotów czy programami lojalnościowymi.
- Współdzielenie konta/budżetu z innymi użytkownikami.
- Przechowywanie obrazów paragonów po ich analizie (obrazy są natychmiast usuwane).

## Kryteria sukcesu

- Mniej niż 15% pozycji na zeskanowanych paragonach wymaga manualnej korekty kategorii lub ceny/nazwy produktu po automatycznej analizie AI.
- 80% nowo dodanych paragonów jest dodawanych za pomocą funkcji skanowania.
- 60% aktywnych użytkowników dodaje co najmniej 4 paragony w miesiącu.
