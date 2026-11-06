-- Enforce one active borrowing request/reservation per student per book.
--
-- Active request statuses mirror createBorrowingRequest's duplicate guard:
--   ('Pending', 'Approved') where Approved means awaiting pickup.
-- Active reservation statuses mirror createLibraryReservation's duplicate guard:
--   ('Pending', 'Ready for Pickup').
--
-- Any pre-existing active duplicates are cancelled (keeping the earliest row
-- by creation timestamp, then id) before the unique indexes are created.

DO $$
DECLARE
  duplicate_request_groups INTEGER;
  duplicate_reservation_groups INTEGER;
  deduplicated_requests INTEGER := 0;
  deduplicated_reservations INTEGER := 0;
BEGIN
  SELECT COUNT(*) INTO duplicate_request_groups
    FROM (
      SELECT student_id, book_id
        FROM library_borrowing_requests
       WHERE status IN ('Pending', 'Approved')
       GROUP BY student_id, book_id
      HAVING COUNT(*) > 1
    ) AS duplicate_requests;

  SELECT COUNT(*) INTO duplicate_reservation_groups
    FROM (
      SELECT student_id, book_id
        FROM library_reservations
       WHERE status IN ('Pending', 'Ready for Pickup')
       GROUP BY student_id, book_id
      HAVING COUNT(*) > 1
    ) AS duplicate_reservations;

  RAISE NOTICE 'Active duplicate groups before dedup: requests=%, reservations=%',
    duplicate_request_groups, duplicate_reservation_groups;

  WITH ranked AS (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY student_id, book_id
             ORDER BY request_date ASC, id ASC
           ) AS row_number
      FROM library_borrowing_requests
     WHERE status IN ('Pending', 'Approved')
  )
  UPDATE library_borrowing_requests AS r
     SET status = 'Cancelled'
    FROM ranked
   WHERE r.id = ranked.id
     AND ranked.row_number > 1;
  GET DIAGNOSTICS deduplicated_requests = ROW_COUNT;

  WITH ranked AS (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY student_id, book_id
             ORDER BY reserved_date ASC, id ASC
           ) AS row_number
      FROM library_reservations
     WHERE status IN ('Pending', 'Ready for Pickup')
  )
  UPDATE library_reservations AS r
     SET status = 'Cancelled'
    FROM ranked
   WHERE r.id = ranked.id
     AND ranked.row_number > 1;
  GET DIAGNOSTICS deduplicated_reservations = ROW_COUNT;

  RAISE NOTICE 'Deduplicated active rows: requests=%, reservations=%',
    deduplicated_requests, deduplicated_reservations;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_library_requests_active_unique
  ON library_borrowing_requests (student_id, book_id)
  WHERE status IN ('Pending', 'Approved');

CREATE UNIQUE INDEX IF NOT EXISTS idx_library_reservations_active_unique
  ON library_reservations (student_id, book_id)
  WHERE status IN ('Pending', 'Ready for Pickup');
