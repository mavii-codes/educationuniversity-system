import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import {
  BorrowingRequestModel,
  BorrowingTransactionModel,
  OverdueFineModel,
  ReservationModel,
  StudentBorrowerModel,
  StudentNotificationModel,
} from "../models";
import { queryDb, withTransaction } from "../config/database";

type RequestRow = {
  id: string;
  request_code: string;
  book_id: string;
  book_title: string;
  author: string;
  isbn: string;
  cover_url: string | null;
  category: string;
  student_id: string;
  student_name: string;
  program_code: string;
  request_date: Date;
  status: BorrowingRequestModel["status"];
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_date: Date | null;
  pickup_due_date: Date | null;
};

type TransactionRow = {
  id: string;
  transaction_code: string;
  book_id: string;
  book_title: string;
  isbn: string;
  cover_url: string | null;
  student_id: string;
  student_name: string;
  program_code: string;
  borrow_date: Date;
  due_date: Date;
  return_date: Date | null;
  status: BorrowingTransactionModel["status"];
  fines_accrued: number | string;
  source_system: string;
};

type ReservationRow = {
  id: string;
  reservation_code: string;
  book_id: string;
  book_title: string;
  isbn: string;
  cover_url: string | null;
  student_id: string;
  student_name: string;
  program_code: string;
  reserved_date: Date;
  expiry_date: Date;
  status: ReservationModel["status"];
};

type FineRow = {
  id: string;
  transaction_id: string;
  book_title: string;
  student_id: string;
  student_name: string;
  program_code: string;
  due_date: Date;
  days_overdue: number;
  fine_amount: number | string;
  payment_status: OverdueFineModel["paymentStatus"];
};

type NotificationRow = {
  id: string;
  student_id: string;
  title: string;
  message: string;
  type: StudentNotificationModel["type"];
  created_at: Date;
  is_read: boolean;
  action_url: string | null;
};

async function insertStudentNotification(
  client: PoolClient,
  input: Pick<
    StudentNotificationModel,
    "studentId" | "title" | "message" | "type" | "actionUrl"
  >
): Promise<void> {
  await client.query(
    `INSERT INTO library_notifications
       (id, student_id, title, message, type, action_url)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      `notif-${randomUUID()}`,
      input.studentId,
      input.title,
      input.message,
      input.type,
      input.actionUrl ?? null,
    ]
  );
}

const REQUEST_COLUMNS = `
  r.id, r.request_code, r.book_id, r.book_title, r.author, r.isbn,
  b.cover_url, r.category, r.student_id, r.student_name, r.program_code,
  r.request_date, r.status, r.rejection_reason, r.reviewed_by, r.reviewed_date,
  r.pickup_due_date
`;

const TRANSACTION_COLUMNS = `
  t.id, t.transaction_code, t.book_id, t.book_title, t.isbn, b.cover_url,
  t.student_id, t.student_name, t.program_code, t.borrow_date, t.due_date,
  t.return_date,
  CASE WHEN t.status = 'Borrowed' AND t.due_date < NOW() THEN 'Overdue'
       ELSE t.status END AS status,
  t.fines_accrued, t.source_system
`;

const RESERVATION_COLUMNS = `
  r.id, r.reservation_code, r.book_id, r.book_title, r.isbn, b.cover_url,
  r.student_id, r.student_name, r.program_code, r.reserved_date,
  r.expiry_date, r.status
`;

function mapRequest(row: RequestRow): BorrowingRequestModel {
  return {
    id: row.id,
    requestCode: row.request_code,
    bookId: row.book_id,
    bookTitle: row.book_title,
    author: row.author,
    isbn: row.isbn,
    cover_url: row.cover_url,
    category: row.category,
    studentId: row.student_id,
    studentName: row.student_name,
    programCode: row.program_code,
    requestDate: row.request_date.toISOString(),
    status: row.status,
    rejectionReason: row.rejection_reason ?? undefined,
    reviewedBy: row.reviewed_by ?? undefined,
    reviewedDate: row.reviewed_date?.toISOString(),
    pickupDueDate: row.pickup_due_date?.toISOString(),
  };
}

function mapTransaction(row: TransactionRow): BorrowingTransactionModel {
  return {
    id: row.id,
    transactionCode: row.transaction_code,
    bookId: row.book_id,
    bookTitle: row.book_title,
    isbn: row.isbn,
    cover_url: row.cover_url,
    studentId: row.student_id,
    studentName: row.student_name,
    programCode: row.program_code,
    borrowDate: row.borrow_date.toISOString(),
    dueDate: row.due_date.toISOString(),
    returnDate: row.return_date?.toISOString(),
    status: row.status,
    finesAccrued: Number(row.fines_accrued),
    sourceSystem: row.source_system,
  };
}

function mapReservation(row: ReservationRow): ReservationModel {
  return {
    id: row.id,
    reservationCode: row.reservation_code,
    bookId: row.book_id,
    bookTitle: row.book_title,
    isbn: row.isbn,
    cover_url: row.cover_url,
    studentId: row.student_id,
    studentName: row.student_name,
    programCode: row.program_code,
    reservedDate: row.reserved_date.toISOString(),
    expiryDate: row.expiry_date.toISOString(),
    status: row.status,
  };
}

function mapFine(row: FineRow): OverdueFineModel {
  return {
    id: row.id,
    transactionId: row.transaction_id,
    bookTitle: row.book_title,
    studentId: row.student_id,
    studentName: row.student_name,
    programCode: row.program_code,
    dueDate: row.due_date.toISOString(),
    daysOverdue: row.days_overdue,
    fineAmount: Number(row.fine_amount),
    paymentStatus: row.payment_status,
  };
}

export async function listBorrowingRequests(
  studentId?: string
): Promise<BorrowingRequestModel[]> {
  const { rows } = await queryDb<RequestRow>(
    `SELECT ${REQUEST_COLUMNS}
       FROM library_borrowing_requests AS r
       JOIN library_books AS b ON b.id = r.book_id
      WHERE ($1::varchar IS NULL OR r.student_id = $1)
      ORDER BY r.request_date DESC`,
    [studentId ?? null]
  );
  return rows.map(mapRequest);
}

export async function createBorrowingRequest(input: {
  studentId: string;
  studentName: string;
  bookId: string;
}): Promise<BorrowingRequestModel> {
  return withTransaction(async (client) => {
    const { rows: books } = await client.query<{
      id: string;
      title: string;
      author: string;
      isbn: string;
      category: string;
      available_copies: number;
    }>(
      `SELECT id, title, author, isbn, category, available_copies
         FROM library_books WHERE id = $1 FOR UPDATE`,
      [input.bookId]
    );
    const book = books[0];
    if (!book) throw new Error("Book record not found in catalog.");
    if (book.available_copies <= 0) {
      throw new Error("No copies currently available. You may place a reservation instead.");
    }

    const { rows: students } = await client.query<{ program_code: string }>(
      "SELECT program_code FROM students WHERE id = $1",
      [input.studentId]
    );
    if (!students[0]) throw new Error("Student profile not found.");

    const { rows: duplicates } = await client.query(
      `SELECT 1 FROM library_borrowing_requests
        WHERE student_id = $1 AND book_id = $2 AND status IN ('Pending', 'Approved')
       UNION ALL
       SELECT 1 FROM library_transactions
        WHERE student_id = $1 AND book_id = $2 AND status IN ('Borrowed', 'Overdue')
       LIMIT 1`,
      [input.studentId, input.bookId]
    );
    if (duplicates.length) throw new Error("You already have an active request or loan for this book.");

    const { rows: activeLoans } = await client.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM library_transactions
        WHERE student_id = $1 AND status IN ('Borrowed', 'Overdue')`,
      [input.studentId]
    );
    if (Number(activeLoans[0]?.count ?? 0) >= 3) {
      throw new Error("Borrowing limit reached. Students can hold up to 3 active books concurrently.");
    }

    const id = `req-${randomUUID()}`;
    const requestCode = `REQ-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
    const { rows } = await client.query<RequestRow>(
      `INSERT INTO library_borrowing_requests
         (id, request_code, book_id, book_title, author, isbn, category,
          student_id, student_name, program_code)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, request_code, book_id, book_title, author, isbn, category,
                 student_id, student_name, program_code, request_date, status,
                 rejection_reason, reviewed_by, reviewed_date, pickup_due_date`,
      [
        id,
        requestCode,
        book.id,
        book.title,
        book.author,
        book.isbn,
        book.category,
        input.studentId,
        input.studentName,
        students[0].program_code,
      ]
    );
    await insertStudentNotification(client, {
      studentId: input.studentId,
      title: "Borrowing Request Submitted",
      message: `Your request for "${book.title}" (${requestCode}) has been sent for Librarian review.`,
      type: "BorrowRequest",
      actionUrl: "/student/borrowing",
    });
    return mapRequest({ ...rows[0], cover_url: null });
  });
}

export async function cancelBorrowingRequest(
  requestId: string,
  studentId: string
): Promise<boolean> {
  const { rowCount } = await queryDb(
    `UPDATE library_borrowing_requests
        SET status = 'Cancelled'
      WHERE id = $1 AND student_id = $2 AND status = 'Pending'`,
    [requestId, studentId]
  );
  return rowCount === 1;
}

export async function approveBorrowingRequest(
  requestId: string,
  reviewedBy: string
): Promise<{ ok: boolean; message: string }> {
  return withTransaction(async (client) => {
    const { rows } = await client.query<RequestRow>(
      `SELECT ${REQUEST_COLUMNS}
         FROM library_borrowing_requests AS r
         JOIN library_books AS b ON b.id = r.book_id
        WHERE r.id = $1
        FOR UPDATE OF r`,
      [requestId]
    );
    const request = rows[0];
    if (!request) return { ok: false, message: "Request not found." };
    if (request.status !== "Pending") {
      return { ok: false, message: "Only pending requests can be approved." };
    }

    const { rows: books } = await client.query<{
      available_copies: number;
      total_copies: number;
    }>(
      `SELECT available_copies, total_copies
         FROM library_books WHERE id = $1 FOR UPDATE`,
      [request.book_id]
    );
    const book = books[0];
    if (!book || book.available_copies <= 0) {
      return { ok: false, message: "No available copies in inventory." };
    }
    await client.query("SELECT id FROM students WHERE id = $1 FOR UPDATE", [
      request.student_id,
    ]);
    const { rows: activeLoans } = await client.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM library_transactions
        WHERE student_id = $1 AND status IN ('Borrowed', 'Overdue')`,
      [request.student_id]
    );
    if (Number(activeLoans[0]?.count ?? 0) >= 3) {
      return {
        ok: false,
        message: "The student has reached the limit of 3 active books.",
      };
    }

    const reviewedDate = new Date();
    const pickupDueDate = new Date(reviewedDate.getTime() + 2 * 86400000);
    const dueDate = new Date(reviewedDate.getTime() + 14 * 86400000);
    const transactionId = randomUUID().replace(/-/g, "");
    const transactionCode = `TX-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;

    await client.query(
      `UPDATE library_borrowing_requests
          SET status = 'Approved', reviewed_by = $2, reviewed_date = $3,
              pickup_due_date = $4
        WHERE id = $1`,
      [requestId, reviewedBy, reviewedDate, pickupDueDate]
    );
    const availableCopies = book.available_copies - 1;
    await client.query(
      `UPDATE library_books
          SET available_copies = $2, borrowed_copies = borrowed_copies + 1,
              status = CASE WHEN $2 = 0 THEN 'Checked Out' ELSE 'Partially Available' END,
              updated_at = NOW()
        WHERE id = $1`,
      [request.book_id, availableCopies]
    );
    await client.query(
      `INSERT INTO library_transactions
         (id, transaction_code, book_id, book_title, isbn, student_id,
          student_name, program_code, borrow_date, due_date, status, fines_accrued,
          source_system)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Borrowed', 0,
               'University Library System')`,
      [
        transactionId,
        transactionCode,
        request.book_id,
        request.book_title,
        request.isbn,
        request.student_id,
        request.student_name,
        request.program_code,
        reviewedDate,
        dueDate,
      ]
    );
    await client.query(
      `INSERT INTO library_loans
         (student_id, book_id, borrowed_date, due_date, returned_date, status)
       VALUES ($1, $2, $3::date, $4::date, NULL, 'Borrowed')
       ON CONFLICT (student_id, book_id, borrowed_date) DO UPDATE
         SET due_date = EXCLUDED.due_date,
             returned_date = NULL,
             status = 'Borrowed'`,
      [request.student_id, request.book_id, reviewedDate, dueDate]
    );
    await client.query(
      `UPDATE students
          SET library_total_borrowed = library_total_borrowed + 1,
              library_current_borrowed = library_current_borrowed + 1
        WHERE id = $1`,
      [request.student_id]
    );
    await insertStudentNotification(client, {
      studentId: request.student_id,
      title: "Borrowing Request Approved",
      message: `Your request for "${request.book_title}" was approved by ${reviewedBy}. The loan is due ${dueDate.toLocaleDateString()}.`,
      type: "BorrowRequest",
      actionUrl: "/student/borrowing",
    });
    return { ok: true, message: "Request approved and loan generated." };
  });
}

export async function rejectBorrowingRequest(
  requestId: string,
  reason: string,
  reviewedBy: string
): Promise<{ ok: boolean; message: string }> {
  return withTransaction(async (client) => {
    const { rows } = await client.query<{
      student_id: string;
      book_title: string;
    }>(
      `UPDATE library_borrowing_requests
          SET status = 'Rejected', rejection_reason = $2, reviewed_by = $3,
              reviewed_date = NOW()
        WHERE id = $1 AND status = 'Pending'
        RETURNING student_id, book_title`,
      [requestId, reason || "Librarian discretion.", reviewedBy]
    );
    const request = rows[0];
    if (!request) return { ok: false, message: "Pending request not found." };
    await insertStudentNotification(client, {
      studentId: request.student_id,
      title: "Borrowing Request Rejected",
      message: `Your request for "${request.book_title}" was rejected. Reason: ${reason || "Librarian discretion."}`,
      type: "BorrowRequest",
      actionUrl: "/student/borrowing",
    });
    return { ok: true, message: "Request rejected with reason." };
  });
}

export async function listLibraryTransactions(
  studentId?: string
): Promise<BorrowingTransactionModel[]> {
  const { rows } = await queryDb<TransactionRow>(
    `SELECT ${TRANSACTION_COLUMNS}
       FROM library_transactions AS t
       JOIN library_books AS b ON b.id = t.book_id
      WHERE ($1::varchar IS NULL OR t.student_id = $1)
      ORDER BY t.borrow_date DESC`,
    [studentId ?? null]
  );
  return rows.map(mapTransaction);
}

export async function listLibraryBorrowers(): Promise<StudentBorrowerModel[]> {
  const { rows } = await queryDb<{
    id: string;
    student_id: string;
    student_name: string;
    email: string;
    program_code: string;
    program_name: string;
    year_level: string;
    active_loans_count: number;
    total_loans_history: number;
    fines_balance: number | string;
    last_active: string | null;
  }>(
    `SELECT s.id,
            s.id AS student_id,
            s.name AS student_name,
            s.email,
            s.program_code,
            p.name AS program_name,
            s.year_level,
            COALESCE(loan_stats.active_loans_count, 0)::int AS active_loans_count,
            COALESCE(loan_stats.total_loans_history, 0)::int AS total_loans_history,
            COALESCE(fine_stats.fines_balance, 0) AS fines_balance,
            loan_stats.last_active::text AS last_active
       FROM students AS s
       JOIN programs AS p ON p.code = s.program_code
       LEFT JOIN LATERAL (
         SELECT COUNT(*) FILTER (
                  WHERE t.status IN ('Borrowed', 'Overdue')
                ) AS active_loans_count,
                COUNT(*) AS total_loans_history,
                MAX(t.borrow_date) AS last_active
           FROM library_transactions AS t
          WHERE t.student_id = s.id
       ) AS loan_stats ON TRUE
       LEFT JOIN LATERAL (
         SELECT SUM(f.fine_amount) AS fines_balance
           FROM library_fines AS f
          WHERE f.student_id = s.id AND f.payment_status = 'Unpaid'
       ) AS fine_stats ON TRUE
      ORDER BY s.name`
  );
  return rows.map((row) => ({
    id: row.id,
    borrowerId: row.student_id,
    studentId: row.student_id,
    studentName: row.student_name,
    email: row.email,
    programCode: row.program_code,
    programName: row.program_name,
    yearLevel: row.year_level,
    activeLoansCount: row.active_loans_count,
    totalLoansHistory: row.total_loans_history,
    finesBalance: Number(row.fines_balance),
    status: row.fines_balance && Number(row.fines_balance) > 0 ? "Restricted" : "Active",
    lastActive: row.last_active ?? "Never",
  }));
}

export async function listLibraryReservations(
  studentId?: string
): Promise<ReservationModel[]> {
  const { rows } = await queryDb<ReservationRow>(
    `SELECT ${RESERVATION_COLUMNS}
       FROM library_reservations AS r
       JOIN library_books AS b ON b.id = r.book_id
      WHERE ($1::varchar IS NULL OR r.student_id = $1)
      ORDER BY r.reserved_date DESC`,
    [studentId ?? null]
  );
  return rows.map(mapReservation);
}

export async function createLibraryReservation(input: {
  studentId: string;
  studentName: string;
  bookId: string;
}): Promise<ReservationModel> {
  const id = randomUUID().replace(/-/g, "");
  const code = `RES-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
  return withTransaction(async (client) => {
  const { rows } = await client.query<ReservationRow>(
    `INSERT INTO library_reservations
       (id, reservation_code, book_id, book_title, isbn, student_id,
        student_name, program_code, expiry_date, status)
     SELECT $1, $2, b.id, b.title, b.isbn, s.id, s.name, s.program_code,
            NOW() + INTERVAL '7 days', 'Pending'
       FROM library_books AS b
       JOIN students AS s ON s.id = $4
      WHERE b.id = $3
        AND NOT EXISTS (
          SELECT 1 FROM library_reservations AS r
           WHERE r.book_id = b.id AND r.student_id = s.id
             AND r.status IN ('Pending', 'Ready for Pickup')
        )
     RETURNING id, reservation_code, book_id, book_title, isbn, student_id,
               student_name, program_code, reserved_date, expiry_date, status`,
    [id, code, input.bookId, input.studentId]
  );
  if (!rows[0]) throw new Error("Book or student not found, or an active reservation already exists.");
  await insertStudentNotification(client, {
    studentId: input.studentId,
    title: "Reservation Placed",
    message: `You are on the reservation queue for "${rows[0].book_title}". You will be notified when a copy is available.`,
    type: "Reservation",
    actionUrl: "/student/borrowing",
  });
  return mapReservation({ ...rows[0], cover_url: null });
  });
}

export async function cancelLibraryReservation(
  reservationId: string,
  studentId: string
): Promise<boolean> {
  const { rowCount } = await queryDb(
    `UPDATE library_reservations SET status = 'Cancelled'
      WHERE id = $1 AND student_id = $2 AND status IN ('Pending', 'Ready for Pickup')`,
    [reservationId, studentId]
  );
  return rowCount === 1;
}

export async function confirmLibraryReturn(
  transactionId: string
): Promise<{ ok: boolean; fineAccrued: number; message: string }> {
  return withTransaction(async (client) => {
    const { rows } = await client.query<TransactionRow>(
      `SELECT ${TRANSACTION_COLUMNS}
         FROM library_transactions AS t
         JOIN library_books AS b ON b.id = t.book_id
        WHERE t.id = $1
        FOR UPDATE OF t`,
      [transactionId]
    );
    const transaction = rows[0];
    if (!transaction) {
      return { ok: false, fineAccrued: 0, message: "Transaction not found." };
    }
    if (transaction.return_date || transaction.status === "Returned") {
      return { ok: false, fineAccrued: 0, message: "This book has already been returned." };
    }

    const now = new Date();
    const overdueDays = Math.max(
      0,
      Math.ceil((now.getTime() - transaction.due_date.getTime()) / 86400000)
    );
    const fineAccrued = overdueDays * 15;
    await client.query(
      `UPDATE library_transactions
          SET status = 'Returned', return_date = $2, fines_accrued = $3
        WHERE id = $1`,
      [transactionId, now, fineAccrued]
    );
    await client.query(
      `UPDATE library_books
          SET available_copies = LEAST(total_copies, available_copies + 1),
              borrowed_copies = GREATEST(0, borrowed_copies - 1),
              status = CASE
                WHEN LEAST(total_copies, available_copies + 1) >= total_copies THEN 'Available'
                ELSE 'Partially Available'
              END,
              updated_at = NOW()
        WHERE id = $1`,
      [transaction.book_id]
    );
    await client.query(
      `UPDATE library_borrowing_requests
          SET status = 'Completed'
        WHERE id = (
          SELECT id FROM library_borrowing_requests
           WHERE book_id = $1 AND student_id = $2 AND status = 'Approved'
             AND reviewed_date = $3
           ORDER BY id
           LIMIT 1
        )`,
      [transaction.book_id, transaction.student_id, transaction.borrow_date]
    );
    await client.query(
      `UPDATE library_loans
          SET returned_date = $3::date, status = 'Returned'
        WHERE student_id = $1 AND book_id = $2 AND returned_date IS NULL
          AND borrowed_date = (
            SELECT MAX(borrowed_date) FROM library_loans
             WHERE student_id = $1 AND book_id = $2 AND returned_date IS NULL
          )`,
      [transaction.student_id, transaction.book_id, now]
    );
    await client.query(
      `UPDATE students
          SET library_current_borrowed = GREATEST(0, library_current_borrowed - 1),
              library_returned_count = library_returned_count + 1,
              library_fines_balance = library_fines_balance + $2
        WHERE id = $1`,
      [transaction.student_id, fineAccrued]
    );
    if (fineAccrued > 0) {
      await client.query(
        `INSERT INTO library_fines
           (id, transaction_id, book_title, student_id, student_name,
            program_code, due_date, days_overdue, fine_amount, payment_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Unpaid')`,
        [
          randomUUID().replace(/-/g, ""),
          transaction.id,
          transaction.book_title,
          transaction.student_id,
          transaction.student_name,
          transaction.program_code,
          transaction.due_date,
          overdueDays,
          fineAccrued,
        ]
      );
    }
    await insertStudentNotification(client, {
      studentId: transaction.student_id,
      title: fineAccrued > 0 ? "Overdue Return Fine Incurred" : "Book Return Confirmed",
      message:
        fineAccrued > 0
          ? `A fine of ₱${fineAccrued.toFixed(2)} has been recorded for "${transaction.book_title}".`
          : `Your return of "${transaction.book_title}" has been recorded.`,
      type: fineAccrued > 0 ? "Fine" : "General",
      actionUrl: fineAccrued > 0 ? "/student/fines" : "/student/history",
    });
    return {
      ok: true,
      fineAccrued,
      message: fineAccrued
        ? `Book return confirmed. Overdue fine of ₱${fineAccrued.toFixed(2)} applied.`
        : "Book return confirmed.",
    };
  });
}

export async function listLibraryFines(
  studentId?: string
): Promise<OverdueFineModel[]> {
  const { rows } = await queryDb<FineRow>(
    `SELECT f.id, f.transaction_id, f.book_title, f.student_id,
            f.student_name, f.program_code, f.due_date, f.days_overdue,
            f.fine_amount, COALESCE(p.payment_status, f.payment_status) AS payment_status
       FROM library_fines AS f
       LEFT JOIN library_fine_payments AS p ON p.fine_id = f.id
      WHERE ($1::varchar IS NULL OR f.student_id = $1)
      ORDER BY f.due_date DESC`,
    [studentId ?? null]
  );
  return rows.map(mapFine);
}

export async function markLibraryFinePaid(fineId: string): Promise<boolean> {
  return withTransaction(async (client) => {
    const { rows: fines } = await client.query<{
      student_id: string;
      book_title: string;
      fine_amount: number | string;
    }>(
      "SELECT student_id, book_title, fine_amount FROM library_fines WHERE id = $1 FOR UPDATE",
      [fineId]
    );
    const fine = fines[0];
    if (!fine) return false;
    const { rowCount } = await client.query(
      `UPDATE library_fines SET payment_status = 'Paid'
        WHERE id = $1 AND payment_status = 'Unpaid'`,
      [fineId]
    );
    if (!rowCount) return false;
    await client.query(
      `INSERT INTO library_fine_payments (fine_id, payment_status, paid_at)
       VALUES ($1, 'Paid', NOW())
       ON CONFLICT (fine_id) DO UPDATE
         SET payment_status = 'Paid', paid_at = NOW()`,
      [fineId]
    );
    await client.query(
      `UPDATE students
          SET library_fines_balance = GREATEST(
                0, library_fines_balance - $2
              )
        WHERE id = $1`,
      [fine.student_id, fine.fine_amount]
    );
    await insertStudentNotification(client, {
      studentId: fine.student_id,
      title: "Fine Payment Recorded",
      message: `Your payment for the fine on "${fine.book_title}" has been recorded.`,
      type: "Fine",
      actionUrl: "/student/fines",
    });
    return true;
  });
}

export async function listLibraryNotifications(
  studentId: string
): Promise<StudentNotificationModel[]> {
  const { rows } = await queryDb<NotificationRow>(
    `SELECT id, student_id, title, message, type, created_at, is_read, action_url
       FROM library_notifications
      WHERE student_id = $1
      ORDER BY created_at DESC`,
    [studentId]
  );
  return rows.map((row) => ({
    id: row.id,
    studentId: row.student_id,
    title: row.title,
    message: row.message,
    type: row.type,
    timestamp: row.created_at.toISOString(),
    read: row.is_read,
    actionUrl: row.action_url ?? undefined,
  }));
}

export async function markLibraryNotificationRead(
  notificationId: string,
  studentId: string
): Promise<boolean> {
  const { rowCount } = await queryDb(
    `UPDATE library_notifications SET is_read = TRUE
      WHERE id = $1 AND student_id = $2`,
    [notificationId, studentId]
  );
  return rowCount === 1;
}

export async function markAllLibraryNotificationsRead(
  studentId: string
): Promise<void> {
  await queryDb(
    "UPDATE library_notifications SET is_read = TRUE WHERE student_id = $1 AND is_read = FALSE",
    [studentId]
  );
}
