import { randomUUID } from "node:crypto";
import { queryDb } from "../config/database";
import { LibraryBookModel, LibraryBookWriteModel } from "../models";

interface LibraryBookRow {
  id: string;
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  publication_year: number;
  category: string;
  call_number: string;
  total_copies: number;
  available_copies: number;
  borrowed_copies: number;
  location: string;
  status: LibraryBookModel["status"];
  cover_url: string | null;
  last_synced_at: Date | null;
}

const BOOK_COLUMNS = `
  id, isbn, title, author, publisher, publication_year, category, call_number,
  total_copies, available_copies, borrowed_copies, location, status, cover_url,
  updated_at AS last_synced_at
`;

function mapBook(row: LibraryBookRow): LibraryBookModel {
  return {
    id: row.id,
    isbn: row.isbn,
    title: row.title,
    author: row.author,
    publisher: row.publisher,
    publicationYear: row.publication_year,
    category: row.category,
    callNumber: row.call_number,
    totalCopies: row.total_copies,
    availableCopies: row.available_copies,
    borrowedCopies: row.borrowed_copies,
    location: row.location,
    status: row.status,
    cover_url: row.cover_url,
    lastSyncedAt: row.last_synced_at?.toISOString() ?? new Date(0).toISOString(),
  };
}

export async function listLibraryBooks(): Promise<LibraryBookModel[]> {
  const { rows } = await queryDb<LibraryBookRow>(
    `SELECT ${BOOK_COLUMNS} FROM library_books ORDER BY title`
  );
  return rows.map(mapBook);
}

export async function getLibraryBook(
  id: string
): Promise<LibraryBookModel | null> {
  const { rows } = await queryDb<LibraryBookRow>(
    `SELECT ${BOOK_COLUMNS} FROM library_books WHERE id = $1`,
    [id]
  );
  return rows[0] ? mapBook(rows[0]) : null;
}

export async function createLibraryBook(
  book: LibraryBookWriteModel
): Promise<LibraryBookModel> {
  const id = `book-${randomUUID().replace(/-/g, "").slice(0, 20)}`;
  const borrowedCopies = book.totalCopies - book.availableCopies;
  const status =
    book.availableCopies === 0
      ? "Checked Out"
      : borrowedCopies > 0
        ? "Partially Available"
        : "Available";
  const { rows } = await queryDb<LibraryBookRow>(
    `INSERT INTO library_books
       (id, isbn, title, author, publisher, publication_year, category,
        call_number, total_copies, available_copies, borrowed_copies, location,
        status, cover_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     RETURNING ${BOOK_COLUMNS}`,
    [
      id,
      book.isbn,
      book.title,
      book.author,
      book.publisher,
      book.publicationYear,
      book.category,
      book.callNumber,
      book.totalCopies,
      book.availableCopies,
      borrowedCopies,
      book.location,
      status,
      book.cover_url,
    ]
  );
  return mapBook(rows[0]);
}

export async function updateLibraryBook(
  id: string,
  book: LibraryBookWriteModel
): Promise<LibraryBookModel | null> {
  const borrowedCopies = book.totalCopies - book.availableCopies;
  const status =
    book.availableCopies === 0
      ? "Checked Out"
      : borrowedCopies > 0
        ? "Partially Available"
        : "Available";
  const { rows } = await queryDb<LibraryBookRow>(
    `UPDATE library_books
        SET isbn = $2, title = $3, author = $4, publisher = $5,
            publication_year = $6, category = $7, call_number = $8,
            total_copies = $9, available_copies = $10, borrowed_copies = $11,
            location = $12, status = $13, cover_url = $14, updated_at = NOW()
      WHERE id = $1
      RETURNING ${BOOK_COLUMNS}`,
    [
      id,
      book.isbn,
      book.title,
      book.author,
      book.publisher,
      book.publicationYear,
      book.category,
      book.callNumber,
      book.totalCopies,
      book.availableCopies,
      borrowedCopies,
      book.location,
      status,
      book.cover_url,
    ]
  );
  return rows[0] ? mapBook(rows[0]) : null;
}

export async function updateLibraryBookCover(
  id: string,
  coverUrl: string | null
): Promise<LibraryBookModel | null> {
  const { rows } = await queryDb<LibraryBookRow>(
    `UPDATE library_books
        SET cover_url = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING ${BOOK_COLUMNS}`,
    [id, coverUrl]
  );
  return rows[0] ? mapBook(rows[0]) : null;
}

export async function listLibraryFinePayments(): Promise<
  { fineId: string; paymentStatus: "Paid" }[]
> {
  const { rows } = await queryDb<{ fine_id: string; payment_status: "Paid" }>(
    "SELECT fine_id, payment_status FROM library_fine_payments"
  );
  return rows.map((row) => ({
    fineId: row.fine_id,
    paymentStatus: row.payment_status,
  }));
}

export async function markLibraryFinePaid(fineId: string): Promise<void> {
  await queryDb(
    `INSERT INTO library_fine_payments (fine_id, payment_status, paid_at)
     VALUES ($1, 'Paid', NOW())
     ON CONFLICT (fine_id) DO UPDATE
       SET payment_status = 'Paid', paid_at = NOW()`,
    [fineId]
  );
}
