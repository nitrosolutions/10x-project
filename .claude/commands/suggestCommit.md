---
description: Generuje propozycję nazwy commita zgodnie z Conventional Commits i wykonuje commit
argument-hint: [scope]
---

Jesteś ekspertem od zarządzania historią Git i konwencji Conventional Commits. Twoim zadaniem jest przeanalizowanie wszystkich zmian w repozytorium, zaproponowanie precyzyjnej nazwy commita, a następnie wykonanie commita po akceptacji użytkownika.

## Parametry

- scope (opcjonalny): $1 - Numer zadania z Jira (np. PROJ-123) lub GitHub Issues (np. #42), lub ogólny obszar zmian (np. receipts, auth, api)

## Krok 1: Analiza zmian

Uruchom następujące komendy Git w RÓWNOLEGŁYCH wywołaniach Bash tool:

```bash
git status
git diff --staged
git diff
```

## Krok 2: Analiza kontekstu

Na podstawie wyników z kroku 1, przeanalizuj:
- Które pliki zostały zmodyfikowane, dodane lub usunięte
- Jakie zmiany zostały wprowadzone w kodzie
- Jaki jest zakres i cel tych zmian
- Czy zmiany dotyczą jednego obszaru czy wielu

## Krok 3: Generowanie nazwy commita

Wygeneruj nazwę commita według schematu Conventional Commits:

```
type(scope): description
optional body
```

### Typy commitów

- feat: Nowa funkcjonalność
- fix: Naprawa błędu
- docs: Zmiany w dokumentacji
- style: Formatowanie, brakujące średniki (bez zmian w kodzie)
- refactor: Refaktoryzacja kodu (bez dodawania funkcji ani naprawy błędów)
- perf: Zmiany poprawiające wydajność
- test: Dodanie lub poprawienie testów
- build: Zmiany w systemie budowania lub zależnościach
- ci: Zmiany w konfiguracji CI/CD
- chore: Inne zmiany (np. aktualizacja zależności, konfiguracja)

### Scope

- Jeśli podano parametr $1: Użyj dokładnie tej wartości jako scope
- Jeśli NIE podano parametru: Zaproponuj odpowiedni scope na podstawie analizy zmian (obszar typu: receipts, auth, api, ui, db, workflows)

### Description

- Pisz w trybie rozkazującym, np. add zamiast added lub adds
- Małą literą na początku
- Bez kropki na końcu
- Maksymalnie 100 znaków dla pierwszej linii
- Jeśli potrzebne, dodaj body z dodatkowymi szczegółami (oddzielone pustą linią)

### Breaking changes

Jeśli commit wprowadza breaking change, dodaj wykrzyknik po typie/scope oraz sekcję BREAKING CHANGE: w body.

## Krok 4: Prezentacja propozycji

Przedstaw 2-3 propozycje nazw commitów w czytelnym formacie.

## Krok 5: Pytanie o wybór

Użyj narzędzia AskUserQuestion aby zapytać użytkownika która opcja go interesuje. Pozwól mu wybrać Other aby podać własną wiadomość.

## Krok 6: Wykonanie commita

Po otrzymaniu odpowiedzi od użytkownika:

1. Jeśli użytkownik wybrał jedną z opcji: Użyj odpowiadającej wiadomości commita
2. Jeśli użytkownik wybrał Other: Użyj wiadomości podanej przez użytkownika
3. Sprawdź czy są niestaged zmiany i zapytaj użytkownika czy je dodać
4. Wykonaj git commit -m z wybraną wiadomością
5. Uruchom git log -1 --oneline aby potwierdzić sukces

## Ograniczenia

- Pierwsza linia commit message: maksymalnie 100 znaków
- Całkowita długość (z body): maksymalnie 300 znaków
- Bądź konkretny i opisowy
- Unikaj zbyt ogólnych określeń
- Jeśli zmiany dotyczą wielu niezwiązanych ze sobą obszarów, zasugeruj rozbicie na kilka commitów

## Przykłady użycia

/suggestCommit
/suggestCommit PROJ-123
/suggestCommit #42
/suggestCommit auth
