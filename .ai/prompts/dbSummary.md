<conversation_summary>
<decisions>

1. Nie rozszerzamy tabeli użytkowników o dodatkowe atrybuty poza Supabase Auth.
2. Tabela receipts zawiera kolumnę total_amount obliczaną automatycznie przez trigger.
3. Kolumna price i total_amount używają typu numeric(12,2).
4. Relacja 1-do-wielu: receipts → receipt_items z kluczem obcym receipt_id i ON DELETE CASCADE.
5. Tabela categories seedowana statycznie w migracji, bez CRUD dla użytkownika.
6. Relacja 1-do-wielu: users (auth.users) → receipts z kluczem user_id.
7. Brak partycjonowania tabel w MVP.
8. Indeks na (user_id, category_id, purchase_date) w tabelach receipts/receipt_items.
9. RLS na tabelach receipts i receipt_items: user_id = auth.uid().
10. Brak pól audytowych (created_at / updated_at).
11. W tabeli receipts dodajemy kolumnę source (enum: 'scan','manual') bez indeksu.
12. Pomijamy materializowane widoki i agregacje SQL.
13. Usuwanie kaskadowe (cascade) przy kasowaniu konta użytkownika.
14. Brak walidacji duplikatów paragonów na poziomie bazy.
15. Brak constraintów na purchase_date i amount w DB (walidacja tylko na UI).
16. Tabela receipts zawiera kolumnę store_name typu text z nazwą sklepu/opisem.  
    </decisions>

<matched_recommendations>

1. Zapisanie total_amount w tabeli receipts z triggerem do automatycznego przeliczenia.
2. Użycie typu numeric(12,2) dla precyzji wartości walutowych.
3. Klucz obcy receipt_id w receipt_items z ON DELETE CASCADE.
4. Seedowanie statycznej tabeli categories w migracji SQL.
5. Indeks na (user_id, category_id, purchase_date) dla wydajnych zapytań.
6. Włączenie RLS: warunek user_id = auth.uid() w obu tabelach.
7. Dodanie kolumny source w tabeli receipts jako enum źródła.
8. Usuwanie kaskadowe rekordów powiązanych przy kasowaniu użytkownika.  
   </matched_recommendations>

<database_planning_summary>
Schemat oparty na Supabase Auth (tabela auth.users) powiązanym z tabelą receipts:

- receipts (id PK, user_id FK → auth.users.id, purchase_date date, store_name text, total_amount numeric(12,2), source receipt_source_enum)
- receipt_items (id PK, receipt_id FK → receipts.id, product_name text, price numeric(12,2), category_id FK → categories.id)
- categories (id PK, name text, icon text, order integer) seedowane przez migrację SQL

Kluczowe relacje:

- auth.users 1→\* receipts
- receipts 1→\* receipt_items

Zabezpieczenia:

- RLS na receipts i receipt_items z regułą user_id = auth.uid()

Wydajność i skalowalność:

- Indeks na (user_id, category_id, purchase_date) przyspieszający filtrowanie miesięczne i raporty
- Brak partycjonowania w MVP, w razie potrzeby można w przyszłości dodać partition BY RANGE(purchase_date)

Usuwanie danych:

- ON DELETE CASCADE dla receipt_items
- Cascade delete powiązanych rekordów przy usunięciu użytkownika

Ograniczenia i walidacja:

- Walidacja purchase_date i amount odbywa się po stronie UI
- Brak walidacji duplikatów i audytu w warstwie bazy w MVP  
  </database_planning_summary>

<unresolved_issues>
Brak nierozwiązanych kwestii – wszystkie punkty zostały omówione i zatwierdzone.
</unresolved_issues>
</conversation_summary>
