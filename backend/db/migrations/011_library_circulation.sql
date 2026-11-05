CREATE TABLE IF NOT EXISTS library_borrowing_requests (
  id VARCHAR(64) PRIMARY KEY,
  request_code VARCHAR(48) UNIQUE NOT NULL,
  book_id VARCHAR(32) NOT NULL REFERENCES library_books(id) ON UPDATE CASCADE,
  book_title VARCHAR(255) NOT NULL,
  author VARCHAR(160) NOT NULL,
  isbn VARCHAR(32) NOT NULL,
  category VARCHAR(80) NOT NULL,
  student_id VARCHAR(32) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  student_name VARCHAR(160) NOT NULL,
  program_code VARCHAR(16) NOT NULL,
  request_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status VARCHAR(24) NOT NULL DEFAULT 'Pending'
    CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Cancelled', 'Completed')),
  rejection_reason TEXT,
  reviewed_by VARCHAR(120),
  reviewed_date TIMESTAMPTZ,
  pickup_due_date TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_library_requests_student_date
  ON library_borrowing_requests(student_id, request_date DESC);
CREATE INDEX IF NOT EXISTS idx_library_requests_status_date
  ON library_borrowing_requests(status, request_date DESC);

CREATE TABLE IF NOT EXISTS library_transactions (
  id VARCHAR(64) PRIMARY KEY,
  transaction_code VARCHAR(48) UNIQUE NOT NULL,
  book_id VARCHAR(32) NOT NULL REFERENCES library_books(id) ON UPDATE CASCADE,
  book_title VARCHAR(255) NOT NULL,
  isbn VARCHAR(32) NOT NULL,
  student_id VARCHAR(32) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  student_name VARCHAR(160) NOT NULL,
  program_code VARCHAR(16) NOT NULL,
  borrow_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_date TIMESTAMPTZ NOT NULL,
  return_date TIMESTAMPTZ,
  status VARCHAR(24) NOT NULL DEFAULT 'Borrowed'
    CHECK (status IN ('Borrowed', 'Returned', 'Overdue')),
  fines_accrued NUMERIC(8, 2) NOT NULL DEFAULT 0,
  source_system VARCHAR(80) NOT NULL DEFAULT 'University Library System'
);

CREATE INDEX IF NOT EXISTS idx_library_transactions_student
  ON library_transactions(student_id, borrow_date DESC);

INSERT INTO library_transactions
  (id, transaction_code, book_id, book_title, isbn, student_id, student_name,
   program_code, borrow_date, due_date, return_date, status, fines_accrued,
   source_system)
SELECT md5(loan.student_id || ':' || loan.book_id || ':' ||
           COALESCE(loan.borrowed_date::text, '')),
       'LEGACY-' || upper(substr(md5(loan.student_id || ':' || loan.book_id || ':' ||
                                     COALESCE(loan.borrowed_date::text, '')), 1, 24)),
       book.id,
       book.title,
       book.isbn,
       student.id,
       student.name,
       student.program_code,
       COALESCE(loan.borrowed_date::timestamptz, NOW()),
       COALESCE(loan.due_date::timestamptz, NOW()),
       loan.returned_date::timestamptz,
       CASE
         WHEN loan.returned_date IS NOT NULL THEN 'Returned'
         WHEN loan.due_date < CURRENT_DATE THEN 'Overdue'
         ELSE 'Borrowed'
       END,
       0,
       'Seeded university records'
  FROM library_loans AS loan
  JOIN library_books AS book ON book.id = loan.book_id
  JOIN students AS student ON student.id = loan.student_id
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS library_reservations (
  id VARCHAR(64) PRIMARY KEY,
  reservation_code VARCHAR(48) UNIQUE NOT NULL,
  book_id VARCHAR(32) NOT NULL REFERENCES library_books(id) ON UPDATE CASCADE,
  book_title VARCHAR(255) NOT NULL,
  isbn VARCHAR(32) NOT NULL,
  student_id VARCHAR(32) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  student_name VARCHAR(160) NOT NULL,
  program_code VARCHAR(16) NOT NULL,
  reserved_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expiry_date TIMESTAMPTZ NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'Pending'
    CHECK (status IN ('Pending', 'Ready for Pickup', 'Fulfilled', 'Cancelled', 'Expired'))
);

CREATE INDEX IF NOT EXISTS idx_library_reservations_student
  ON library_reservations(student_id, reserved_date DESC);

CREATE TABLE IF NOT EXISTS library_fines (
  id VARCHAR(64) PRIMARY KEY,
  transaction_id VARCHAR(64) NOT NULL REFERENCES library_transactions(id),
  book_title VARCHAR(255) NOT NULL,
  student_id VARCHAR(32) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  student_name VARCHAR(160) NOT NULL,
  program_code VARCHAR(16) NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  days_overdue INTEGER NOT NULL,
  fine_amount NUMERIC(8, 2) NOT NULL,
  payment_status VARCHAR(24) NOT NULL DEFAULT 'Unpaid'
    CHECK (payment_status IN ('Unpaid', 'Waived', 'Paid'))
);

CREATE INDEX IF NOT EXISTS idx_library_fines_student
  ON library_fines(student_id);

CREATE TABLE IF NOT EXISTS library_notifications (
  id VARCHAR(64) PRIMARY KEY,
  student_id VARCHAR(32) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(24) NOT NULL
    CHECK (type IN ('BorrowRequest', 'DueDate', 'Reservation', 'Fine', 'General')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  action_url VARCHAR(160)
);

CREATE INDEX IF NOT EXISTS idx_library_notifications_student_date
  ON library_notifications(student_id, created_at DESC);
