import { Request, Response } from "express";
import { z } from "zod";
import { env } from "../config/env";
import {
  createLibraryBook as createDatabaseBook,
  getLibraryBook as getDatabaseBook,
  listLibraryFinePayments,
  listLibraryBooks,
  markLibraryFinePaid as markDatabaseLibraryFinePaid,
  updateLibraryBook as updateDatabaseBook,
  updateLibraryBookCover,
} from "../repositories/library.repository";
import { libraryETLService } from "../services/library.service";
import { getCoverUrl } from "../utils/getCover";
import {
  getUploadedCoverUrl,
} from "../middleware/book-cover-upload.middleware";
import { removeLocalCover } from "../utils/book-cover-storage";

const bookInputSchema = z
  .object({
    isbn: z.string().trim().max(32),
    title: z.string().trim().min(1).max(200),
    author: z.string().trim().min(1).max(160),
    publisher: z.string().trim().max(160),
    publicationYear: z.coerce.number().int().min(0).max(3000),
    category: z.string().trim().min(1).max(80),
    callNumber: z.string().trim().max(64),
    totalCopies: z.coerce.number().int().min(1),
    availableCopies: z.coerce.number().int().min(0),
    location: z.string().trim().max(80),
    cover_url: z
      .string()
      .trim()
      .max(2048)
      .refine((value) => !value || /^https?:\/\//i.test(value), {
        message: "Cover image URL must use HTTP or HTTPS.",
      })
      .nullable()
      .optional(),
  })
  .refine((book) => book.availableCopies <= book.totalCopies, {
    message: "Available copies cannot exceed total copies.",
    path: ["availableCopies"],
  });

function isValidBookInput(
  body: unknown
): ReturnType<typeof bookInputSchema.safeParse> {
  return bookInputSchema.safeParse(body);
}

export const getLibraryOverview = (_req: Request, res: Response) => {
  try {
    const overview = libraryETLService.getOverview();
    res.json({
      success: true,
      data: overview,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve library overview metrics",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getLibraryBooks = async (req: Request, res: Response) => {
  try {
    const { search, category, status } = req.query as {
      search?: string;
      category?: string;
      status?: string;
    };
    const sourceBooks = env.db.enabled
      ? await listLibraryBooks()
      : libraryETLService.getBooks();
    const query = search?.toLowerCase();
    const books = sourceBooks.filter(
      (book) =>
        (!query ||
          book.title.toLowerCase().includes(query) ||
          book.author.toLowerCase().includes(query) ||
          book.isbn.toLowerCase().includes(query) ||
          book.callNumber.toLowerCase().includes(query)) &&
        (!category || category === "All" || book.category === category) &&
        (!status || status === "All" || book.status === status)
    );
    res.json({
      success: true,
      count: books.length,
      data: books,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve library book records",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const lookupBookCover = async (req: Request, res: Response) => {
  const parsed = z
    .object({
      isbn: z.string().optional(),
      title: z.string().optional(),
      author: z.string().optional(),
    })
    .safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid book details for cover lookup.",
      errors: parsed.error.issues,
    });
  }

  const cover_url = await getCoverUrl(parsed.data);
  return res.json({ success: true, data: { cover_url } });
};

export const createLibraryBook = async (req: Request, res: Response) => {
  const parsed = isValidBookInput(req.body);
  if (!parsed.success) {
    try {
      await removeLocalCover(getUploadedCoverUrl(req));
    } catch (error) {
      console.error("[Library] Failed to remove invalid uploaded cover:", error);
    }
    return res.status(400).json({
      success: false,
      message: "Invalid book details.",
      errors: parsed.error.issues,
    });
  }

  let saved = false;
  try {
    const input = parsed.data;
    const cover_url =
      getUploadedCoverUrl(req) ?? input.cover_url ?? (await getCoverUrl(input));
    const bookInput = {
      ...input,
      cover_url: cover_url || null,
    };
    const book = env.db.enabled
      ? await createDatabaseBook(bookInput)
      : libraryETLService.createBook(bookInput);
    saved = true;
    return res.status(201).json({
      success: true,
      message: "Book added to the library catalog.",
      data: book,
    });
  } catch (error) {
    if (!saved) {
      try {
        await removeLocalCover(getUploadedCoverUrl(req));
      } catch (cleanupError) {
        console.error("[Library] Failed to remove unsaved uploaded cover:", cleanupError);
      }
    }
    return res.status(500).json({
      success: false,
      message: "Failed to add book to the library catalog.",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const editLibraryBook = async (req: Request, res: Response) => {
  const parsed = isValidBookInput(req.body);
  if (!parsed.success) {
    try {
      await removeLocalCover(getUploadedCoverUrl(req));
    } catch (error) {
      console.error("[Library] Failed to remove invalid uploaded cover:", error);
    }
    return res.status(400).json({
      success: false,
      message: "Invalid book details.",
      errors: parsed.error.issues,
    });
  }

  let saved = false;
  let previousCoverUrl: string | null = null;
  try {
    const existing = env.db.enabled
      ? await getDatabaseBook(req.params.id)
      : libraryETLService.getBookById(req.params.id);
    if (!existing) {
      await removeLocalCover(getUploadedCoverUrl(req));
      return res.status(404).json({
        success: false,
        message: "Book record not found.",
      });
    }

    const input = parsed.data;
    previousCoverUrl = existing.cover_url ?? null;
    const identityChanged =
      input.isbn !== existing.isbn ||
      input.title !== existing.title ||
      input.author !== existing.author;
    const uploadedCover = getUploadedCoverUrl(req);
    const suppliedCover = input.cover_url?.trim() || null;
    const coverWasChanged =
      suppliedCover !== null && suppliedCover !== existing.cover_url;
    const cover_url = uploadedCover
      ? uploadedCover
      : coverWasChanged
        ? suppliedCover
        : identityChanged
          ? await getCoverUrl(input)
          : Object.prototype.hasOwnProperty.call(req.body, "cover_url")
            ? suppliedCover
            : existing.cover_url ?? null;

    const bookInput = { ...input, cover_url };
    const book = env.db.enabled
      ? await updateDatabaseBook(req.params.id, bookInput)
      : libraryETLService.updateBook(req.params.id, bookInput);
    if (!book) {
      await removeLocalCover(getUploadedCoverUrl(req));
      return res.status(404).json({
        success: false,
        message: "Book record not found.",
      });
    }
    saved = true;
    if (previousCoverUrl && previousCoverUrl !== book.cover_url) {
      await removeLocalCover(previousCoverUrl);
    }
    return res.json({
      success: true,
      message: "Book details updated.",
      data: book,
    });
  } catch (error) {
    if (!saved) {
      try {
        await removeLocalCover(getUploadedCoverUrl(req));
      } catch (cleanupError) {
        console.error("[Library] Failed to remove unsaved uploaded cover:", cleanupError);
      }
    }
    return res.status(500).json({
      success: false,
      message: "Failed to update book details.",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const deleteLibraryBookCover = async (req: Request, res: Response) => {
  try {
    const book = env.db.enabled
      ? await getDatabaseBook(req.params.id)
      : libraryETLService.getBookById(req.params.id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book record not found.",
      });
    }

    const updatedBook = env.db.enabled
      ? await updateLibraryBookCover(book.id, null)
      : libraryETLService.updateBook(book.id, { ...book, cover_url: null });
    if (!updatedBook) {
      return res.status(404).json({
        success: false,
        message: "Book record not found.",
      });
    }

    await removeLocalCover(book.cover_url);
    return res.json({
      success: true,
      message: "Book cover removed.",
      data: updatedBook,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to remove the book cover.",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const refreshLibraryBookCover = async (req: Request, res: Response) => {
  try {
    const book = env.db.enabled
      ? await getDatabaseBook(req.params.id)
      : libraryETLService.getBookById(req.params.id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book record not found.",
      });
    }

    const cover_url = await getCoverUrl(book);
    const updatedBook = env.db.enabled
      ? await updateLibraryBookCover(book.id, cover_url)
      : libraryETLService.updateBook(book.id, { ...book, cover_url });
    if (!updatedBook) {
      return res.status(404).json({
        success: false,
        message: "Book record not found.",
      });
    }
    return res.json({
      success: true,
      message: cover_url ? "Book cover refreshed." : "No cover was found for this book.",
      data: updatedBook,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to refresh the book cover.",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getLibraryBorrowers = (req: Request, res: Response) => {
  try {
    const { search, program, status } = req.query as {
      search?: string;
      program?: string;
      status?: string;
    };
    const borrowers = libraryETLService.getBorrowers({ search, program, status });
    res.json({
      success: true,
      count: borrowers.length,
      data: borrowers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve student borrower records",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getLibraryTransactions = (req: Request, res: Response) => {
  try {
    const { search, status } = req.query as {
      search?: string;
      status?: string;
    };
    const transactions = libraryETLService.getTransactions({ search, status });
    res.json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve borrowing transactions",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getLibraryReservations = (req: Request, res: Response) => {
  try {
    const { search, status } = req.query as {
      search?: string;
      status?: string;
    };
    const reservations = libraryETLService.getReservations({ search, status });
    res.json({
      success: true,
      count: reservations.length,
      data: reservations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve book reservations",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getLibraryFines = async (req: Request, res: Response) => {
  try {
    const { search, paymentStatus } = req.query as {
      search?: string;
      paymentStatus?: string;
    };
    const paymentStatuses = env.db.enabled
      ? await listLibraryFinePayments()
      : [];
    const paidFineIds = new Set(paymentStatuses.map((payment) => payment.fineId));
    const fines = libraryETLService
      .getFines()
      .map((fine) =>
        paidFineIds.has(fine.id) ? { ...fine, paymentStatus: "Paid" as const } : fine
      )
      .filter((fine) => {
        if (paymentStatus && paymentStatus !== "All" && fine.paymentStatus !== paymentStatus) {
          return false;
        }
        if (!search) return true;
        const query = search.toLowerCase();
        return (
          fine.bookTitle.toLowerCase().includes(query) ||
          fine.studentName.toLowerCase().includes(query) ||
          fine.studentId.toLowerCase().includes(query)
        );
      });
    res.json({
      success: true,
      count: fines.length,
      data: fines,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve overdue and fine records",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const markLibraryFinePaid = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const fine = libraryETLService.getFines().find((item) => item.id === id);
    if (!fine) {
      return res.status(404).json({ success: false, message: "Fine record not found." });
    }
    if (fine.paymentStatus === "Paid") {
      return res.json({ success: true, message: "Fine is already paid." });
    }

    if (env.db.enabled) {
      await markDatabaseLibraryFinePaid(id);
    }
    libraryETLService.markFinePaid(id);
    return res.json({ success: true, message: "Fine payment recorded successfully." });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to record fine payment",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getBookCategories = (_req: Request, res: Response) => {
  try {
    const categories = libraryETLService.getCategories();
    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve library categories",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const runLibraryETLSync = async (req: Request, res: Response) => {
  try {
    const triggeredBy = req.body?.triggeredBy || "Admin Console";
    const log = await libraryETLService.runPipelineSync(triggeredBy);
    res.json({
      success: true,
      message: "Library ETL pipeline executed successfully",
      data: log,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Library ETL pipeline execution encountered an error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getLibraryETLLogs = (_req: Request, res: Response) => {
  try {
    const logs = libraryETLService.getETLLogs();
    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve ETL pipeline execution logs",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getBorrowingRequests = (req: Request, res: Response) => {
  try {
    const { studentId } = req.query as { studentId?: string };
    const requests = libraryETLService.getBorrowingRequests(studentId);
    res.json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve borrowing requests",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const createBorrowingRequest = (req: Request, res: Response) => {
  try {
    const request = libraryETLService.createBorrowingRequest(req.body);
    res.status(201).json({
      success: true,
      message: "Borrowing request submitted",
      data: request,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to submit borrowing request",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const approveBorrowingRequest = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reviewedBy } = req.body;
    const result = libraryETLService.approveBorrowingRequest(id, reviewedBy);
    if (!result.ok) {
      return res.status(400).json({ success: false, message: result.message });
    }
    res.json({ success: true, message: result.message });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to approve borrowing request",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const rejectBorrowingRequest = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason, reviewedBy } = req.body;
    const result = libraryETLService.rejectBorrowingRequest(
      id,
      reason,
      reviewedBy
    );
    if (!result.ok) {
      return res.status(400).json({ success: false, message: result.message });
    }
    res.json({ success: true, message: result.message });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to reject borrowing request",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const confirmBookReturn = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = libraryETLService.confirmReturn(id);
    if (!result.ok) {
      return res.status(400).json({ success: false, message: result.message });
    }
    res.json({
      success: true,
      fineAccrued: result.fineAccrued,
      message: result.message,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to confirm book return",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
