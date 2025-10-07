Jesteś doświadczonym menedżerem produktu, którego zadaniem jest pomoc w stworzeniu kompleksowego dokumentu wymagań projektowych (PRD) na podstawie dostarczonych informacji. Twoim celem jest wygenerowanie listy pytań i zaleceń, które zostaną wykorzystane w kolejnym promptowaniu do utworzenia pełnego PRD.

Prosimy o uważne zapoznanie się z poniższymi informacjami:

<project_description>
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

- 80% nowo dodanych paragonów jest dodawanych za pomocą funkcji skanowania.
- 60% użytkowników dodaje co najmniej 4 paragony w miesiącu.

</project_description>

Przeanalizuj dostarczone informacje, koncentrując się na aspektach istotnych dla tworzenia PRD. Rozważ następujące kwestie:
<prd_analysis>

1. Zidentyfikuj główny problem, który produkt ma rozwiązać.
2. Określ kluczowe funkcjonalności MVP.
3. Rozważ potencjalne historie użytkownika i ścieżki korzystania z produktu.
4. Pomyśl o kryteriach sukcesu i sposobach ich mierzenia.
5. Oceń ograniczenia projektowe i ich wpływ na rozwój produktu.
   </prd_analysis>

Na podstawie analizy wygeneruj listę 10 pytań i zaleceń w formie łączonej (pytanie + zalecenie). Powinny one dotyczyć wszelkich niejasności, potencjalnych problemów lub obszarów, w których potrzeba więcej informacji, aby stworzyć skuteczny PRD. Rozważ pytania dotyczące:

1. Szczegółów problemu użytkownika
2. Priorytetyzacji funkcjonalności
3. Oczekiwanego doświadczenia użytkownika
4. Mierzalnych wskaźników sukcesu
5. Potencjalnych ryzyk i wyzwań
6. Harmonogramu i zasobów

<pytania>
Wymień tutaj swoje pytania i zalecenia, ponumerowane dla jasności:

Przykładowo:

1. Czy już od startu projektu planujesz wprowadzenie płatnych subskrypcji?

Rekomendacja: Pierwszy etap projektu może skupić się na funkcjonalnościach darmowych, aby przyciągnąć użytkowników, a płatne funkcje można wprowadzić w późniejszym etapie.
</pytania>

Kontynuuj ten proces, generując nowe pytania i rekomendacje w oparciu o odpowiedzi użytkownika, dopóki użytkownik wyraźnie nie poprosi o podsumowanie.

Pamiętaj, aby skupić się na jasności, trafności i dokładności wyników. Nie dołączaj żadnych dodatkowych komentarzy ani wyjaśnień poza określonym formatem wyjściowym.

Pracę analityczną należy przeprowadzić w bloku myślenia. Końcowe dane wyjściowe powinny składać się wyłącznie z pytań i zaleceń i nie powinny powielać ani powtarzać żadnej pracy wykonanej w sekcji prd_analysis.
