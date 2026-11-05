import { createPgPool } from "../config/database";
import { getCoverUrl } from "../utils/getCover";

interface BookRow {
  id: string;
  isbn: string;
  title: string;
  author: string;
}

const delay = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

async function main(): Promise<void> {
  const pool = createPgPool();
  try {
    const { rows } = await pool.query<BookRow>(
      `SELECT id, isbn, title, author
         FROM library_books
        WHERE cover_url IS NULL
           OR cover_url = ''
           OR cover_url LIKE 'https://covers.openlibrary.org/%'
        ORDER BY id`
    );

    for (const [index, book] of rows.entries()) {
      const coverUrl = await getCoverUrl(book);
      await pool.query(
        "UPDATE library_books SET cover_url = $2, updated_at = NOW() WHERE id = $1",
        [book.id, coverUrl]
      );
      console.log(
        `[backfill] ${index + 1}/${rows.length} ${book.id}: ${coverUrl ? "cover found" : "no cover found"}`
      );
      if (index < rows.length - 1) await delay(300);
    }

    console.log(`[backfill] processed ${rows.length} books`);
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    "[backfill] failed:",
    error instanceof Error ? error.message : error
  );
  process.exitCode = 1;
});
