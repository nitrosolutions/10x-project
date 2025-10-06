Jesteś doświadczonym menedżerem produktu, którego zadaniem jest stworzenie kompleksowego dokumentu wymagań produktu (PRD) w oparciu o poniższe opisy:

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

- Mniej niż 15% pozycji na zeskanowanych paragonach wymaga manualnej korekty kategorii lub ceny/nazwy produktu po automatycznej analizie AI.
- 80% nowo dodanych paragonów jest dodawanych za pomocą funkcji skanowania.
- 60% aktywnych użytkowników dodaje co najmniej 4 paragony w miesiącu.

</project_description>

<project_details>
<conversation_summary>
<decisions>

1.  **Uwierzytelnianie**: System będzie oparty wyłącznie na logowaniu przez e-mail i hasło, bez integracji z kontami społecznościowymi (np. Google).
2.  **Kategorie wydatków**: Zostanie wdrożona predefiniowana, stała lista kategorii (Żywność, Mieszkanie, Transport, itp.).
3.  **Analiza AI**: Funkcja skanowania paragonów będzie realizowana poprzez integrację z zewnętrznym modelem AI przez API.
4.  **Zarządzanie paragonem**: Wszystkie operacje na pozycjach paragonu (dodawanie, edycja, usuwanie) będą odbywać się na jednym, dedykowanym widoku.
5.  **Zapis danych**: Nagłówek paragonu (data, opis) jest tworzony jako pierwszy. Następnie każda operacja na pojedynczej pozycji (dodanie, edycja, usunięcie) będzie osobnym, niezależnym wywołaniem API. Użytkownik akceptuje ryzyko częściowego zapisu danych.
6.  **Tryb offline**: Aplikacja nie będzie wspierać trybu offline w ramach MVP.
7.  **Kryterium sukcesu AI**: Błąd modelu AI jest liczony tylko wtedy, gdy użytkownik musi manualnie poprawić _cenę_ odczytanej pozycji.
8.  **Nawigacja**: Przełączanie między miesiącami będzie realizowane za pomocą strzałek obok nazwy miesiąca i roku. Nawigacja między widokiem podsumowania a listą wydatków będzie odbywać się za pomocą dedykowanych linków.
9.  **Zarządzanie kontem**: Użytkownik będzie miał możliwość zmiany hasła oraz trwałego usunięcia konta, co będzie wymagało potwierdzenia hasłem.
10. **PWA**: Monit o dodanie aplikacji do ekranu głównego będzie nieinwazyjny i będzie pokazywany za każdym razem podczas analizy paragonu przez AI, aż do momentu instalacji.
11. **Waluta**: Aplikacja będzie obsługiwać wyłącznie walutę PLN.
12. **Ładowanie danych**: Lista paragonów dla danego miesiąca będzie ładowana w całości, bez implementacji paginacji lub "nieskończonego przewijania".
13. **Polityka haseł**: Wymagane hasło o długości min. 8 znaków, zawierające co najmniej jedną dużą i małą literę, jedną cyfrę i jeden znak specjalny. Walidacja odbędzie się po stronie serwera.
14. **Obsługa dat**: Daty będą przechowywane w bazie danych w formacie UTC, a za poprawne wyświetlanie w strefie czasowej użytkownika będzie odpowiadać biblioteka po stronie frontendu.
15. **Polityka Prywatności**: Projekt MVP nie będzie zawierał Polityki Prywatności.
    </decisions>

<matched_recommendations>

1.  Stworzenie dedykowanego endpointu API (`/api/summary`) do zwracania zagregowanych sum wydatków dla każdej kategorii w celu generowania wykresu.
2.  Zaimplementowanie wykresu typu "donut", który w centralnym punkcie domyślnie wyświetla sumę wszystkich wydatków, a po najechaniu na segment pokazuje sumę dla wybranej kategorii.
3.  Wprowadzenie mechanizmu analitycznego do precyzyjnego śledzenia zdarzeń, takich jak `item_added`, `item_edited`, `item_deleted`, w celu dokładnego mierzenia kryteriów sukcesu.
4.  Zastosowanie RESTful API do operacji na pozycjach paragonu (np. `POST /api/receipts/{id}/items`, `PUT /api/items/{id}`).
5.  Zabezpieczenie procesu usuwania konta poprzez wymóg ponownego wprowadzenia hasła przez użytkownika.
6.  Wprowadzenie walidacji danych wejściowych zarówno po stronie klienta (dla lepszego UX), jak i po stronie serwera (dla bezpieczeństwa i integralności danych).
7.  Zastosowanie długotrwałych sesji użytkownika opartych na tokenach, aby użytkownik pozostawał zalogowany po zamknięciu przeglądarki.
8.  Przechowywanie predefiniowanej listy kategorii w osobnej tabeli w bazie danych w celu ułatwienia przyszłych modyfikacji.
9.  Wyświetlanie na bieżąco aktualizowanej sumy całkowitej w widoku edycji paragonu, aby zapewnić użytkownikowi natychmiastową informację zwrotną.
10. W przypadku niezapisanych zmian, wyświetlanie okna dialogowego z ostrzeżeniem przy próbie opuszczenia widoku edycji.
    </matched_recommendations>

<prd_planning_summary>

### Główne wymagania funkcjonalne produktu

1.  **System Kont Użytkowników**: Rejestracja i logowanie za pomocą adresu e-mail i hasła. Ustawienia konta umożliwiające zmianę hasła i jego trwałe usunięcie.
2.  **Dodawanie Wydatków**: Możliwość dodawania paragonów poprzez skan (aparat/plik) lub ręczne wprowadzanie danych. Zewnętrzne API analizuje obraz, próbując odczytać datę, nazwę sklepu oraz listę pozycji (nazwa, cena).
3.  **Edycja Paragonu**: Dedykowany widok pozwalający na pełną edycję paragonu: zmiana daty, opisu (nazwa sklepu) oraz dodawanie, edycja i usuwanie poszczególnych pozycji (nazwa, cena, kategoria). Każda operacja na pozycji jest osobnym zapisem do bazy danych.
4.  **Podsumowanie Wydatków**: Główny widok aplikacji to podsumowanie dla wybranego miesiąca, prezentowane w formie interaktywnego wykresu kołowego ("donut") pokazującego podział wydatków na kategorie.
5.  **Lista Paragonów**: Osobny widok z listą wszystkich paragonów z wybranego miesiąca, posortowaną malejąco po dacie. Każdy element listy zawiera datę, sumę całkowitą i nazwę sklepu.
6.  **Aplikacja PWA**: Aplikacja webowa z pełnym wsparciem RWD, z możliwością dodania do ekranu głównego urządzenia.

### Kluczowe historie użytkownika i ścieżki korzystania

- **Rejestracja i pierwsze logowanie**: Użytkownik tworzy konto, loguje się i widzi pusty panel główny z zachętą do dodania pierwszego paragonu.
- **Dodawanie paragonu przez skan**: Użytkownik klika "Dodaj wydatek", wybiera opcję skanowania, robi zdjęcie paragonu. Po analizie AI zostaje przeniesiony do widoku edycji z automatycznie uzupełnionymi danymi, gdzie może je zweryfikować, poprawić i zapisać.
- **Przeglądanie wydatków**: Użytkownik wchodzi do aplikacji, widzi podsumowanie wydatków z bieżącego miesiąca na wykresie. Może przełączać się między miesiącami lub przejść do szczegółowej listy paragonów, aby odnaleźć konkretny wydatek.

### Ważne kryteria sukcesu i sposoby ich mierzenia

1.  **Skuteczność AI**: Mniej niż 15% pozycji na zeskanowanych paragonach wymaga manualnej korekty _ceny_. Mierzone przez śledzenie zdarzenia `receipt_price_edited`.
2.  **Adopcja funkcji skanowania**: 80% nowo dodanych paragonów jest dodawanych za pomocą funkcji skanowania. Mierzone przez porównanie liczby zdarzeń `receipt_scan_success` do `receipt_manual_add`.
3.  **Zaangażowanie użytkowników**: 60% aktywnych użytkowników (zalogowani z akcją w ciągu 30 dni) dodaje co najmniej 4 paragony w miesiącu. Mierzone za pomocą analizy kohortowej aktywności użytkowników.

</prd_planning_summary>

<unresolved_issues>

- **Ryzyko niespójności danych**: Przyjęty model zapisu, w którym każda modyfikacja pozycji paragonu jest osobną transakcją, stwarza ryzyko powstania niekompletnych lub częściowo zapisanych paragonów w przypadku błędów sieci lub opuszczenia strony przez użytkownika w trakcie operacji. Mimo akceptacji tego ryzyka, jest to kluczowy obszar techniczny, który może negatywnie wpłynąć na doświadczenie użytkownika i integralność danych.
  </unresolved_issues>
  </conversation_summary>
  </project_details>

Wykonaj następujące kroki, aby stworzyć kompleksowy i dobrze zorganizowany dokument:

1. Podziel PRD na następujące sekcje:
   a. Przegląd projektu
   b. Problem użytkownika
   c. Wymagania funkcjonalne
   d. Granice projektu
   e. Historie użytkownika
   f. Metryki sukcesu

2. W każdej sekcji należy podać szczegółowe i istotne informacje w oparciu o opis projektu i odpowiedzi na pytania wyjaśniające. Upewnij się, że:
   - Używasz jasnego i zwięzłego języka
   - W razie potrzeby podajesz konkretne szczegóły i dane
   - Zachowujesz spójność w całym dokumencie
   - Odnosisz się do wszystkich punktów wymienionych w każdej sekcji

3. Podczas tworzenia historyjek użytkownika i kryteriów akceptacji
   - Wymień WSZYSTKIE niezbędne historyjki użytkownika, w tym scenariusze podstawowe, alternatywne i skrajne.
   - Przypisz unikalny identyfikator wymagań (np. US-001) do każdej historyjki użytkownika w celu bezpośredniej identyfikowalności.
   - Uwzględnij co najmniej jedną historię użytkownika specjalnie dla bezpiecznego dostępu lub uwierzytelniania, jeśli aplikacja wymaga identyfikacji użytkownika lub ograniczeń dostępu.
   - Upewnij się, że żadna potencjalna interakcja użytkownika nie została pominięta.
   - Upewnij się, że każda historia użytkownika jest testowalna.

Użyj następującej struktury dla każdej historii użytkownika:

- ID
- Tytuł
- Opis
- Kryteria akceptacji

4. Po ukończeniu PRD przejrzyj go pod kątem tej listy kontrolnej:
   - Czy każdą historię użytkownika można przetestować?
   - Czy kryteria akceptacji są jasne i konkretne?
   - Czy mamy wystarczająco dużo historyjek użytkownika, aby zbudować w pełni funkcjonalną aplikację?
   - Czy uwzględniliśmy wymagania dotyczące uwierzytelniania i autoryzacji (jeśli dotyczy)?

5. Formatowanie PRD:
   - Zachowaj spójne formatowanie i numerację.
   - Nie używaj pogrubionego formatowania w markdown ( \*\* ).
   - Wymień WSZYSTKIE historyjki użytkownika.
   - Sformatuj PRD w poprawnym markdown.

Przygotuj PRD z następującą strukturą:

```markdown
# Dokument wymagań produktu (PRD) - {{app-name}}

## 1. Przegląd produktu

## 2. Problem użytkownika

## 3. Wymagania funkcjonalne

## 4. Granice produktu

## 5. Historyjki użytkowników

## 6. Metryki sukcesu
```

Pamiętaj, aby wypełnić każdą sekcję szczegółowymi, istotnymi informacjami w oparciu o opis projektu i nasze pytania wyjaśniające. Upewnij się, że PRD jest wyczerpujący, jasny i zawiera wszystkie istotne informacje potrzebne do dalszej pracy nad produktem.

Ostateczny wynik powinien składać się wyłącznie z PRD zgodnego ze wskazanym formatem w markdown, który zapiszesz w pliku .ai/prd.md
