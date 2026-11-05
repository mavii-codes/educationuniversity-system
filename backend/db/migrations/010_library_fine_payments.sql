CREATE TABLE IF NOT EXISTS library_fine_payments (
  fine_id VARCHAR(64) PRIMARY KEY,
  payment_status VARCHAR(16) NOT NULL CHECK (payment_status IN ('Paid')),
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
