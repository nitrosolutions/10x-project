# Dokument wymagań produktu (PRD) - PortfelIO

## 1. Przegląd produktu

PortfelIO to progresywna aplikacja webowa (PWA) zaprojektowana w celu uproszczenia procesu śledzenia domowych wydatków. Umożliwia użytkownikom szybkie dodawanie paragonów poprzez skanowanie (za pomocą aparatu urządzenia lub z pliku) lub ręczne wprowadzanie danych. Zintegrowany model AI automatycznie analizuje zeskanowane paragony, odczytując datę, pozycje oraz ceny, a następnie przypisuje je do predefiniowanych kategorii. Głównym elementem interfejsu jest pulpit nawigacyjny z interaktywnym wykresem kołowym, który prezentuje podsumowanie wydatków z wybranego miesiąca, ułatwiając użytkownikom zrozumienie struktury swoich finansów. Aplikacja jest w pełni responsywna, zapewniając komfortowe użytkowanie zarówno na urządzeniach mobilnych, jak i stacjonarnych.

## 2. Problem użytkownika

Manualne śledzenie wydatków domowych jest procesem żmudnym, czasochłonnym i podatnym na błędy. Konieczność ręcznego przepisywania każdej pozycji z paragonu do arkusza kalkulacyjnego lub aplikacji finansowej jest nużąca i często prowadzi do zaniechania regularnego monitorowania budżetu. W rezultacie użytkownicy nie mają łatwego i szybkiego wglądu w strukturę swoich wydatków, co znacząco utrudnia świadome i efektywne zarządzanie finansami osobistymi.

## 3. Wymagania funkcjonalne

- FR-01: System Kont Użytkowników: Uwierzytelnianie oparte wyłącznie na adresie e-mail i haśle. System zapewnia obsługę rejestracji, logowania oraz długotrwałych sesji użytkownika. Ustawienia konta pozwalają na zmianę hasła oraz bezpieczne, trwałe usunięcie konta.
- FR-02: Dodawanie Wydatków: Aplikacja umożliwia dodawanie paragonów dwiema metodami: poprzez skanowanie (z wykorzystaniem aparatu lub pliku) z automatyczną analizą AI przez zewnętrzne API oraz poprzez w pełni manualne wprowadzanie danych.
- FR-03: Zarządzanie Paragonem: Dedykowany widok pozwala na pełną edycję danych paragonu, w tym daty, opisu (np. nazwy sklepu) oraz poszczególnych pozycji (nazwa, cena, kategoria). Każda modyfikacja pozycji jest osobną, niezależną transakcją. Widok edycji na bieżąco aktualizuje sumę całkowitą paragonu i ostrzega użytkownika przed opuszczeniem strony w przypadku niezapisanych zmian.
- FR-04: Podsumowanie Wydatków: Główny widok aplikacji prezentuje podsumowanie wydatków dla wybranego miesiąca w formie interaktywnego wykresu kołowego ("donut"). Wykres pokazuje podział na predefiniowane kategorie, a w jego centrum wyświetlana jest suma wszystkich wydatków.
- FR-05: Lista Paragonów: Dostępny jest osobny widok z listą wszystkich paragonów z wybranego miesiąca, posortowaną chronologicznie (od najnowszych). Każdy element listy zawiera datę, sumę całkowitą i opis paragonu.
- FR-06: Aplikacja PWA: Aplikacja jest w pełni responsywna (RWD) i oferuje możliwość instalacji na ekranie głównym urządzenia. Monit o instalację jest nieinwazyjny i wyświetlany w kontekście operacji wymagających dłuższego oczekiwania (np. analiza AI).
- FR-07: Bezpieczeństwo i Walidacja: Wdrożona jest walidacja danych wejściowych zarówno po stronie klienta (dla poprawy UX), jak i serwera (dla zapewnienia integralności danych). Obowiązuje polityka haseł (min. 8 znaków, mała i duża litera, cyfra, znak specjalny).

## 4. Granice produktu

Następujące funkcje i cechy nie wchodzą w zakres wersji MVP produktu:

- Zaawansowane funkcje budżetowe, takie jak ustawianie limitów na kategorie czy alerty o ich przekroczeniu.
- Możliwość tworzenia, edycji lub usuwania własnych kategorii wydatków przez użytkownika.
- Generowanie zaawansowanych raportów, analiz i wykresów historycznych.
- Funkcjonalności związane z zarządzaniem gwarancjami, terminami zwrotów czy programami lojalnościowymi.
- Opcja współdzielenia konta lub budżetu z innymi użytkownikami.
- Przechowywanie obrazów paragonów po zakończeniu procesu analizy AI (obrazy są natychmiast usuwane).
- Integracja z zewnętrznymi dostawcami tożsamości (np. logowanie przez Google, Facebook).
- Wsparcie dla trybu offline.
- Obsługa wielu walut (aplikacja obsługuje wyłącznie PLN).
- Paginacja lub mechanizm "nieskończonego przewijania" na liście paragonów.
- Dokumentacja taka jak Polityka Prywatności czy Regulamin serwisu.

## 5. Historyjki użytkowników

- ID: US-001
- Tytuł: Rejestracja nowego użytkownika
- Opis: Jako nowy użytkownik, chcę móc założyć konto w aplikacji przy użyciu mojego adresu e-mail i hasła, aby móc rozpocząć śledzenie swoich wydatków.
- Kryteria akceptacji:
  - Formularz rejestracji zawiera pola na adres e-mail, hasło i potwierdzenie hasła.
  - Walidacja po stronie klienta sprawdza, czy podany e-mail ma poprawny format i czy hasła w obu polach są identyczne.
  - Walidacja po stronie serwera sprawdza, czy adres e-mail nie jest już zarejestrowany.
  - Hasło musi spełniać zdefiniowaną politykę bezpieczeństwa.
  - Po pomyślnej rejestracji użytkownik jest automatycznie zalogowany i przekierowany do głównego pulpitu.

- ID: US-002
- Tytuł: Logowanie do aplikacji
- Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się do aplikacji przy użyciu mojego adresu e-mail i hasła, aby uzyskać dostęp do moich danych.
- Kryteria akceptacji:
  - Formularz logowania zawiera pola na adres e-mail i hasło.
  - Po pomyślnym zalogowaniu użytkownik jest przekierowany do głównego pulpitu.
  - W przypadku podania błędnych danych uwierzytelniających, wyświetlany jest stosowny komunikat o błędzie.
  - Sesja użytkownika jest utrzymywana po zamknięciu i ponownym otwarciu przeglądarki.

- ID: US-003
- Tytuł: Wylogowanie z aplikacji
- Opis: Jako zalogowany użytkownik, chcę móc się wylogować z aplikacji, aby zabezpieczyć dostęp do moich danych.
- Kryteria akceptacji:
  - W interfejsie aplikacji znajduje się wyraźnie oznaczony przycisk lub link "Wyloguj".
  - Po kliknięciu przycisku sesja użytkownika jest kończona.
  - Użytkownik jest przekierowywany na stronę logowania.

- ID: US-004
- Tytuł: Zmiana hasła
- Opis: Jako zalogowany użytkownik, chcę mieć możliwość zmiany mojego hasła, aby zabezpieczyć swoje konto.
- Kryteria akceptacji:
  - W ustawieniach konta dostępny jest formularz zmiany hasła.
  - Formularz wymaga podania starego hasła, nowego hasła i jego potwierdzenia.
  - Nowe hasło musi spełniać zdefiniowaną politykę bezpieczeństwa.
  - Po pomyślnej zmianie hasła użytkownik otrzymuje potwierdzenie.

- ID: US-005
- Tytuł: Usunięcie konta
- Opis: Jako użytkownik, chcę mieć możliwość trwałego usunięcia mojego konta i wszystkich powiązanych z nim danych.
- Kryteria akceptacji:
  - W ustawieniach konta znajduje się opcja usunięcia konta.
  - Proces usunięcia wymaga potwierdzenia operacji poprzez ponowne wprowadzenie hasła.
  - Po potwierdzeniu, wszystkie dane użytkownika (konto, paragony, pozycje) są trwale usuwane z bazy danych.
  - Użytkownik jest wylogowywany i informowany o pomyślnym usunięciu konta.

- ID: US-006
- Tytuł: Przeglądanie podsumowania wydatków
- Opis: Jako użytkownik, po zalogowaniu chcę widzieć graficzne podsumowanie moich wydatków z bieżącego miesiąca, aby szybko zorientować się w strukturze moich finansów.
- Kryteria akceptacji:
  - Główny widok aplikacji wyświetla wykres kołowy ("donut") dla aktualnie wybranego miesiąca.
  - Wykres przedstawia procentowy udział poszczególnych kategorii w sumie wydatków.
  - W centrum wykresu widoczna jest łączna suma wydatków w danym miesiącu.
  - Po najechaniu kursorem na segment wykresu, wyświetlana jest nazwa kategorii i suma wydatków w tej kategorii.
  - Jeśli w danym miesiącu nie ma żadnych wydatków, wyświetlany jest komunikat zachęcający do dodania pierwszego paragonu.

- ID: US-007
- Tytuł: Nawigacja między miesiącami
- Opis: Jako użytkownik, chcę móc łatwo przełączać widok podsumowania i listy paragonów na poprzednie lub następne miesiące, aby analizować swoje wydatki w czasie.
- Kryteria akceptacji:
  - W widoku podsumowania i listy paragonów widoczna jest nazwa bieżącego miesiąca i rok.
  - Obok nazwy miesiąca znajdują się strzałki lub przyciski do nawigacji "wstecz" i "dalej".
  - Kliknięcie strzałki powoduje załadowanie i wyświetlenie danych dla odpowiedniego miesiąca.

- ID: US-008
- Tytuł: Przeglądanie listy paragonów
- Opis: Jako użytkownik, chcę mieć dostęp do listy wszystkich paragonów z wybranego miesiąca, aby móc odnaleźć konkretny wydatek.
- Kryteria akceptacji:
  - Dostępny jest dedykowany widok listy paragonów.
  - Lista jest posortowana malejąco według daty zakupu.
  - Każdy element na liście zawiera datę, opis (np. nazwę sklepu) i sumę całkowitą paragonu.
  - Kliknięcie na element listy przenosi do widoku edycji tego paragonu.

- ID: US-009
- Tytuł: Dodawanie paragonu przez skan
- Opis: Jako użytkownik, chcę móc dodać nowy paragon poprzez zrobienie zdjęcia lub wybranie pliku z obrazem, aby zautomatyzować proces wprowadzania danych.
- Kryteria akceptacji:
  - Użytkownik może zainicjować proces skanowania z głównego interfejsu.
  - Aplikacja prosi o dostęp do aparatu lub pozwala wybrać plik z galerii.
  - Po przesłaniu obrazu, jest on wysyłany do zewnętrznego API w celu analizy.
  - Po zakończeniu analizy, użytkownik jest przenoszony do widoku edycji paragonu z polami wstępnie wypełnionymi przez AI (data, opis, pozycje z cenami i przypisanymi kategoriami).
  - Użytkownik może zweryfikować i poprawić wszystkie odczytane dane przed finalnym zapisem.

- ID: US-010
- Tytuł: Dodawanie paragonu ręcznie
- Opis: Jako użytkownik, chcę mieć możliwość ręcznego dodania nowego paragonu, jeśli skanowanie nie jest możliwe lub wygodne.
- Kryteria akceptacji:
  - Użytkownik może wybrać opcję ręcznego dodawania paragonu.
  - Po wybraniu tej opcji, tworzony jest nowy, pusty paragon z nagłówkiem (data, opis).
  - Użytkownik jest przenoszony do widoku edycji, gdzie może ręcznie dodać poszczególne pozycje.

- ID: US-011
- Tytuł: Edycja danych nagłówka paragonu
- Opis: Jako użytkownik w widoku edycji paragonu, chcę móc zmienić datę zakupu i opis (np. nazwę sklepu), aby poprawić ewentualne błędy lub uzupełnić brakujące informacje.
- Kryteria akceptacji:
  - W widoku edycji paragonu pola daty i opisu są edytowalne.
  - Zmiana wartości w tych polach i ich zapisanie powoduje aktualizację danych w bazie.

- ID: US-012
- Tytuł: Dodawanie nowej pozycji do paragonu
- Opis: Jako użytkownik w widoku edycji paragonu, chcę móc dodać nową pozycję (nazwa, cena, kategoria), aby uzupełnić paragon o brakujące elementy.
- Kryteria akceptacji:
  - W widoku edycji znajduje się przycisk "Dodaj pozycję".
  - Po jego kliknięciu pojawia się formularz do wprowadzenia nazwy produktu, ceny i wyboru kategorii z predefiniowanej listy.
  - Zapisanie nowej pozycji powoduje jej dodanie do listy i aktualizację sumy całkowitej paragonu.

- ID: US-013
- Tytuł: Edycja istniejącej pozycji na paragonie
- Opis: Jako użytkownik w widoku edycji paragonu, chcę móc poprawić nazwę, cenę lub kategorię istniejącej pozycji, aby skorygować błędy analizy AI lub własne pomyłki.
- Kryteria akceptacji:
  - Każda pozycja na liście w widoku edycji jest edytowalna.
  - Użytkownik może zmienić nazwę, cenę i kategorię dla każdej pozycji.
  - Zapisanie zmian aktualizuje dane pozycji w bazie i sumę całkowitą paragonu.

- ID: US-014
- Tytuł: Usuwanie pozycji z paragonu
- Opis: Jako użytkownik w widoku edycji paragonu, chcę móc usunąć pojedynczą pozycję, aby pozbyć się błędnie dodanych lub nieistotnych wpisów.
- Kryteria akceptacji:
  - Przy każdej pozycji na liście znajduje się przycisk "Usuń".
  - Kliknięcie przycisku powoduje usunięcie pozycji z bazy danych.
  - Lista pozycji oraz suma całkowita paragonu są natychmiast aktualizowane.

- ID: US-015
- Tytuł: Ostrzeżenie przed utratą zmian
- Opis: Jako użytkownik, który dokonał zmian w widoku edycji paragonu, chcę otrzymać ostrzeżenie przy próbie opuszczenia strony bez zapisania, aby uniknąć przypadkowej utraty danych.
- Kryteria akceptacji:
  - Aplikacja śledzi stan zmian w formularzu edycji paragonu.
  - Jeśli istnieją niezapisane zmiany, próba nawigacji poza widok edycji (np. przez kliknięcie linku lub zamknięcie karty) wywołuje natywne okno dialogowe przeglądarki z ostrzeżeniem.

- ID: US-016
- Tytuł: Instalacja aplikacji PWA
- Opis: Jako użytkownik mobilny, chcę otrzymać sugestię dodania aplikacji do ekranu głównego, aby mieć do niej szybki i łatwy dostęp.
- Kryteria akceptacji:
  - Aplikacja spełnia techniczne wymagania PWA (manifest, service worker).
  - Podczas operacji trwającej dłużej (np. analiza AI), wyświetlany jest nieinwazyjny komunikat zachęcający do instalacji aplikacji.
  - Komunikat nie jest wyświetlany, jeśli aplikacja jest już zainstalowana lub użytkownik korzysta z przeglądarki desktopowej nieobsługującej tej funkcji.

## 6. Metryki sukcesu

- SM-01: Skuteczność analizy AI
  - Cel: Mniej niż 15% pozycji na zeskanowanych paragonach wymaga manualnej korekty ceny przez użytkownika.
  - Sposób mierzenia: Śledzenie zdarzenia analitycznego `item_price_edited` dla pozycji pochodzących ze skanu. Metryka będzie obliczana jako stosunek liczby tych zdarzeń do całkowitej liczby pozycji dodanych za pomocą funkcji skanowania w danym okresie.

- SM-02: Adopcja funkcji skanowania
  - Cel: 80% wszystkich nowo dodanych paragonów jest tworzonych za pomocą funkcji skanowania.
  - Sposób mierzenia: Porównanie liczby paragonów utworzonych przez skan (zdarzenie `receipt_scan_added`) do liczby paragonów dodanych ręcznie (zdarzenie `receipt_manual_added`).

- SM-03: Zaangażowanie użytkowników
  - Cel: 60% aktywnych użytkowników dodaje co najmniej 4 paragony w ciągu miesiąca.
  - Definicja aktywnego użytkownika: Użytkownik, który zalogował się i wykonał co najmniej jedną akcję (np. dodał paragon, edytował pozycję) w ciągu ostatnich 30 dni.
  - Sposób mierzenia: Analiza kohortowa aktywności użytkowników, śledzenie liczby dodanych paragonów na aktywnego użytkownika w cyklach miesięcznych.
