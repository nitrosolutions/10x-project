# Schemat bazy danych PortfelIO

## 1. Tabele

### categories

- id SERIAL PRIMARY KEY
- name TEXT NOT NULL
- icon TEXT NOT NULL
- order INTEGER NOT NULL

### receipts

- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
- purchase_date DATE NOT NULL
- store_name TEXT
- total_amount NUMERIC(12,2) NOT NULL DEFAULT 0
- source receipt_source_enum NOT NULL

### receipt_items

- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE
- product_name TEXT NOT NULL
- price NUMERIC(12,2) NOT NULL
- category_id INTEGER NOT NULL REFERENCES categories(id)

## 2. Relacje między tabelami

- auth.users 1 → \* receipts (user_id FK → auth.users.id)
- receipts 1 → \* receipt_items (receipt_id FK → receipts.id)
- categories 1 → \* receipt_items (category_id FK → categories.id)

## 3. Indeksy

```sql
CREATE INDEX idx_receipts_user_purchase ON receipts(user_id, purchase_date);
CREATE INDEX idx_receipt_items_receipt_category ON receipt_items(receipt_id, category_id);
```

## 4. Zasady PostgreSQL (RLS)

```sql
-- Włączenie RLS
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_items ENABLE ROW LEVEL SECURITY;

-- Polityka dla receipts
CREATE POLICY receipts_rls
  ON receipts
  FOR ALL
  USING (user_id = auth.uid());

-- Polityki dla receipt_items
CREATE POLICY receipt_items_select
  ON receipt_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM receipts
      WHERE receipts.id = receipt_items.receipt_id
        AND receipts.user_id = auth.uid()
    )
  );

CREATE POLICY receipt_items_modify
  ON receipt_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM receipts
      WHERE receipts.id = receipt_items.receipt_id
        AND receipts.user_id = auth.uid()
    )
  );
```

## 5. Dodatkowe uwagi i wyjaśnienia

- Typ enum dla źródła dodania:
  ```sql
  CREATE TYPE receipt_source_enum AS ENUM ('scan','manual');
  ```
- Trigger do automatycznego przeliczenia `total_amount` w tabeli `receipts`:

  ```sql
  CREATE FUNCTION recalc_total_amount() RETURNS TRIGGER AS $$
  BEGIN
    UPDATE receipts
    SET total_amount = (
      SELECT COALESCE(SUM(price),0)
      FROM receipt_items
      WHERE receipt_id = NEW.receipt_id
    )
    WHERE id = NEW.receipt_id;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  CREATE TRIGGER trg_recalc_total
    AFTER INSERT OR UPDATE OR DELETE ON receipt_items
    FOR EACH ROW
    EXECUTE FUNCTION recalc_total_amount();
  ```

- Wszystkie wartości walutowe używają typu `NUMERIC(12,2)` zgodnie z wymaganiami.
- Statyczne dane do `categories` powinny być seedowane w migracji SQL.
