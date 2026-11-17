ALTER TABLE library_books
  ADD COLUMN IF NOT EXISTS book_price NUMERIC(10, 2) NOT NULL DEFAULT 0
    CHECK (book_price >= 0);

ALTER TABLE library_transactions
  ADD COLUMN IF NOT EXISTS book_price_at_borrow NUMERIC(10, 2)
    CHECK (book_price_at_borrow >= 0);

ALTER TABLE library_fines
  ADD COLUMN IF NOT EXISTS fine_rate_per_day NUMERIC(10, 2) NOT NULL DEFAULT 15
    CHECK (fine_rate_per_day >= 0);

ALTER TABLE library_transactions
  ALTER COLUMN fines_accrued TYPE NUMERIC(12, 2);

ALTER TABLE library_fines
  ALTER COLUMN fine_amount TYPE NUMERIC(12, 2);

ALTER TABLE students
  ALTER COLUMN library_fines_balance TYPE NUMERIC(12, 2);
