-- ============================================================================
-- migration: create portfelio schema
-- description: creates the core schema for portfelio receipt management system
-- tables affected: categories, receipts, receipt_items
-- features: rls policies, automatic total calculation trigger, indexes
-- author: database migration
-- created: 2025-10-08
-- ============================================================================

-- ============================================================================
-- 1. create custom types
-- ============================================================================

-- type for tracking how a receipt was added to the system
create type receipt_source_enum as enum ('scan', 'manual');

-- ============================================================================
-- 2. create tables
-- ============================================================================

-- ----------------------------------------------------------------------------
-- categories table: predefined categories for receipt items
-- this table stores static category data that will be seeded during migration
-- ----------------------------------------------------------------------------
create table categories (
  id serial primary key,
  name text not null,
  icon text not null,
  "order" integer not null
);

-- add comment to the table
comment on table categories is 'predefined categories for classifying receipt items';
comment on column categories.name is 'display name of the category';
comment on column categories.icon is 'icon identifier for ui display';
comment on column categories."order" is 'display order for sorting categories in ui';

-- ----------------------------------------------------------------------------
-- receipts table: stores receipt header information
-- each receipt belongs to a user and contains summary information
-- ----------------------------------------------------------------------------
create table receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  purchase_date date not null,
  store_name text,
  total_amount numeric(12,2) not null default 0,
  source receipt_source_enum not null
);

-- add comments to the table
comment on table receipts is 'receipt header information for each purchase';
comment on column receipts.user_id is 'reference to the user who owns this receipt';
comment on column receipts.purchase_date is 'date when the purchase was made';
comment on column receipts.store_name is 'name of the store where purchase was made';
comment on column receipts.total_amount is 'calculated total of all items (auto-updated by trigger)';
comment on column receipts.source is 'indicates if receipt was scanned or manually entered';

-- ----------------------------------------------------------------------------
-- receipt_items table: individual items on each receipt
-- each item is categorized and contributes to the receipt total
-- ----------------------------------------------------------------------------
create table receipt_items (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references receipts(id) on delete cascade,
  product_name text not null,
  price numeric(12,2) not null,
  category_id integer not null references categories(id)
);

-- add comments to the table
comment on table receipt_items is 'individual items listed on each receipt';
comment on column receipt_items.receipt_id is 'reference to parent receipt';
comment on column receipt_items.product_name is 'name of the purchased product';
comment on column receipt_items.price is 'price of this individual item';
comment on column receipt_items.category_id is 'category classification for this item';

-- ============================================================================
-- 3. create indexes for performance optimization
-- ============================================================================

-- index for filtering receipts by user and sorting by date
-- this supports common queries that fetch user receipts ordered by purchase date
create index idx_receipts_user_purchase on receipts(user_id, purchase_date);

-- index for joining receipt items with their receipt and filtering by category
-- this supports analytics queries that group items by category
create index idx_receipt_items_receipt_category on receipt_items(receipt_id, category_id);

-- ============================================================================
-- 4. create function for automatic total calculation
-- ============================================================================

-- function to recalculate receipt total when items are added, updated, or deleted
-- this ensures total_amount in receipts table is always accurate
create function recalc_total_amount() returns trigger as $$
begin
  -- handle delete operations (old.receipt_id)
  if (tg_op = 'DELETE') then
    update receipts
    set total_amount = (
      select coalesce(sum(price), 0)
      from receipt_items
      where receipt_id = old.receipt_id
    )
    where id = old.receipt_id;
    return old;
  end if;

  -- handle insert and update operations (new.receipt_id)
  update receipts
  set total_amount = (
    select coalesce(sum(price), 0)
    from receipt_items
    where receipt_id = new.receipt_id
  )
  where id = new.receipt_id;

  return new;
end;
$$ language plpgsql;

-- add comment to the function
comment on function recalc_total_amount() is 'automatically recalculates receipt total when items change';

-- ============================================================================
-- 5. create trigger for automatic total calculation
-- ============================================================================

-- trigger that fires after any change to receipt_items
-- this keeps the receipt total_amount field synchronized
create trigger trg_recalc_total
  after insert or update or delete on receipt_items
  for each row
  execute function recalc_total_amount();

-- ============================================================================
-- 6. enable row level security (rls)
-- ============================================================================

-- enable rls on receipts table
-- users should only access their own receipts
alter table receipts enable row level security;

-- enable rls on receipt_items table
-- users should only access items from their own receipts
alter table receipt_items enable row level security;

-- categories table does not need rls as it contains public reference data
-- all users need to access categories for categorizing their items

-- ============================================================================
-- 7. create rls policies for receipts table
-- ============================================================================

-- policy: authenticated users can select their own receipts
create policy receipts_select_authenticated
  on receipts
  for select
  to authenticated
  using (user_id = auth.uid());

-- policy: anonymous users cannot select receipts
create policy receipts_select_anon
  on receipts
  for select
  to anon
  using (false);

-- policy: authenticated users can insert their own receipts
create policy receipts_insert_authenticated
  on receipts
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- policy: anonymous users cannot insert receipts
create policy receipts_insert_anon
  on receipts
  for insert
  to anon
  with check (false);

-- policy: authenticated users can update their own receipts
create policy receipts_update_authenticated
  on receipts
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- policy: anonymous users cannot update receipts
create policy receipts_update_anon
  on receipts
  for update
  to anon
  using (false);

-- policy: authenticated users can delete their own receipts
create policy receipts_delete_authenticated
  on receipts
  for delete
  to authenticated
  using (user_id = auth.uid());

-- policy: anonymous users cannot delete receipts
create policy receipts_delete_anon
  on receipts
  for delete
  to anon
  using (false);

-- ============================================================================
-- 8. create rls policies for receipt_items table
-- ============================================================================

-- policy: authenticated users can select items from their own receipts
create policy receipt_items_select_authenticated
  on receipt_items
  for select
  to authenticated
  using (
    exists (
      select 1
      from receipts
      where receipts.id = receipt_items.receipt_id
        and receipts.user_id = auth.uid()
    )
  );

-- policy: anonymous users cannot select receipt items
create policy receipt_items_select_anon
  on receipt_items
  for select
  to anon
  using (false);

-- policy: authenticated users can insert items to their own receipts
create policy receipt_items_insert_authenticated
  on receipt_items
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from receipts
      where receipts.id = receipt_items.receipt_id
        and receipts.user_id = auth.uid()
    )
  );

-- policy: anonymous users cannot insert receipt items
create policy receipt_items_insert_anon
  on receipt_items
  for insert
  to anon
  with check (false);

-- policy: authenticated users can update items from their own receipts
create policy receipt_items_update_authenticated
  on receipt_items
  for update
  to authenticated
  using (
    exists (
      select 1
      from receipts
      where receipts.id = receipt_items.receipt_id
        and receipts.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from receipts
      where receipts.id = receipt_items.receipt_id
        and receipts.user_id = auth.uid()
    )
  );

-- policy: anonymous users cannot update receipt items
create policy receipt_items_update_anon
  on receipt_items
  for update
  to anon
  using (false);

-- policy: authenticated users can delete items from their own receipts
create policy receipt_items_delete_authenticated
  on receipt_items
  for delete
  to authenticated
  using (
    exists (
      select 1
      from receipts
      where receipts.id = receipt_items.receipt_id
        and receipts.user_id = auth.uid()
    )
  );

-- policy: anonymous users cannot delete receipt items
create policy receipt_items_delete_anon
  on receipt_items
  for delete
  to anon
  using (false);

-- ============================================================================
-- 9. seed categories table with initial data
-- ============================================================================

-- insert predefined categories
-- these categories will be used to classify receipt items
insert into categories (name, icon, "order") values
  ('Żywność', '🍎', 1),
  ('Transport', '🚗', 2),
  ('Rozrywka', '🎮', 3),
  ('Zdrowie', '💊', 4),
  ('Odzież', '👕', 5),
  ('Dom', '🏠', 6),
  ('Edukacja', '📚', 7),
  ('Technologia', '💻', 8),
  ('Inne', '📦', 9);

-- ============================================================================
-- end of migration
-- ============================================================================
