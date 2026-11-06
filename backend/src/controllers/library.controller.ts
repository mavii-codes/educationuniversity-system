import { Request, Response } from "express";
import { z } from "zod";
import { env } from "../config/env";
import {
  createLibraryBook as createDatabaseBook,
  getLibraryBook as getDatabaseBook,
  listLibraryBookCategories,
  listLibraryBooks,
  updateLibraryBook as updateDatabaseBook,
  updateLibraryBookCover,
} from "../repositories/library.repository";
import { libraryETLService } from "../services/library.service";
import { getCoverUrl } from "../utils/getCover";
import {
  getUploadedCoverUrl,
} from "../middleware/book-cover-upload.middleware";
import { removeLocalCover } from "../utils/book-cover-storage";
import { currentUser } from "../middleware/auth.middleware";
import * as libraryCirculationRepository from "../repositories/library-circulation.repository";

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

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

export const getLibraryOverview = async (_req: Request, res: Response) => {
  try {
    const overview = env.db.enabled
      ? await libraryCirculationRepository.getLibraryProductionOverview()
      : libraryETLService.getOverview();
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
    if (isUniqueViolation(error)) {
      return res.status(409).json({
        success: false,
        message: "A book with that ISBN already exists.",
      });
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

export const getLibraryBorrowers = async (req: Request, res: Response) => {
  try {
    const { search, program, status } = req.query as {
      search?: string;
      program?: string;
      status?: string;
    };
    const sourceBorrowers = env.db.enabled
      ? await libraryCirculationRepository.listLibraryBorrowers()
      : libraryETLService.getBorrowers({ search, program, status });
    const query = search?.toLowerCase();
    const borrowers = sourceBorrowers.filter(
      (borrower) =>
        (!query ||
          borrower.studentName.toLowerCase().includes(query) ||
          borrower.studentId.toLowerCase().includes(query) ||
          borrower.borrowerId.toLowerCase().includes(query)) &&
        (!program || program === "All" || borrower.programCode === program) &&
        (!status || status === "All" || borrower.status === status)
    );
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

export const getLibraryTransactions = async (req: Request, res: Response) => {
  try {
    const user = currentUser(res);
    const { search, status } = req.query as {
      search?: string;
      status?: string;
    };
    const studentId = user?.portalRole === "Student" ? user.id : undefined;
    const sourceTransactions = env.db.enabled
      ? await libraryCirculationRepository.listLibraryTransactions(studentId)
      : libraryETLService.getTransactions({ search, status });
    const query = search?.toLowerCase();
    const transactions = sourceTransactions.filter(
      (transaction) =>
        (!query ||
          transaction.bookTitle.toLowerCase().includes(query) ||
          transaction.studentName.toLowerCase().includes(query) ||
          transaction.studentId.toLowerCase().includes(query) ||
          transaction.transactionCode.toLowerCase().includes(query)) &&
        (!status || status === "All" || transaction.status === status)
    );
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

export const getLibraryReservations = async (req: Request, res: Response) => {
  try {
    const user = currentUser(res);
    const { search, status } = req.query as {
      search?: string;
      status?: string;
    };
    const studentId = user?.portalRole === "Student" ? user.id : undefined;
    const sourceReservations = env.db.enabled
      ? await libraryCirculationRepository.listLibraryReservations(studentId)
      : libraryETLService.getReservations({ search, status });
    const query = search?.toLowerCase();
    const reservations = sourceReservations.filter(
      (reservation) =>
        (!query ||
          reservation.bookTitle.toLowerCase().includes(query) ||
          reservation.studentName.toLowerCase().includes(query) ||
          reservation.studentId.toLowerCase().includes(query) ||
          reservation.reservationCode.toLowerCase().includes(query)) &&
        (!status || status === "All" || reservation.status === status)
    );
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
    const user = currentUser(res);
    const { search, paymentStatus } = req.query as {
      search?: string;
      paymentStatus?: string;
    };
    const studentId = user?.portalRole === "Student" ? user.id : undefined;
    const sourceFines = env.db.enabled
      ? await libraryCirculationRepository.listLibraryFines(studentId)
      : libraryETLService.getFines();
    const fines = sourceFines.filter((fine) => {
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
    const fines = env.db.enabled
      ? await libraryCirculationRepository.listLibraryFines()
      : libraryETLService.getFines();
    const fine = fines.find((item) => item.id === id);
    if (!fine) {
      return res.status(404).json({ success: false, message: "Fine record not found." });
    }
    if (fine.paymentStatus === "Paid") {
      return res.json({ success: true, message: "Fine is already paid." });
    }

    if (env.db.enabled) {
      const updated = await libraryCirculationRepository.markLibraryFinePaid(id);
      if (!updated) {
        return res.status(409).json({
          success: false,
          message: "Fine payment was already recorded or the fine is no longer unpaid.",
        });
      }
    } else {
      libraryETLService.markFinePaid(id);
    }
    return res.json({ success: true, message: "Fine payment recorded successfully." });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to record fine payment",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getBookCategories = async (_req: Request, res: Response) => {
  try {
    const categories = env.db.enabled
      ? await listLibraryBookCategories()
      : libraryETLService.getCategories();
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

export const getBorrowingRequests = async (req: Request, res: Response) => {
  try {
    const user = currentUser(res);
    const requestedStudentId = req.query.studentId;
    const studentId =
      user?.portalRole === "Student"
        ? user.id
        : typeof requestedStudentId === "string"
          ? requestedStudentId
          : undefined;
    const requests = env.db.enabled
      ? await libraryCirculationRepository.listBorrowingRequests(studentId)
      : libraryETLService.getBorrowingRequests(studentId);
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

export const createBorrowingRequest = async (req: Request, res: Response) => {
  try {
    const user = currentUser(res);
    if (!user || user.portalRole !== "Student") {
      return res.status(403).json({
        success: false,
        message: "Only an authenticated student can submit a borrowing request.",
      });
    }

    const request = env.db.enabled
      ? await libraryCirculationRepository.createBorrowingRequest({
          studentId: user.id,
          studentName: user.name,
          bookId: typeof req.body?.bookId === "string" ? req.body.bookId : "",
        })
      : libraryETLService.createBorrowingRequest({
          ...req.body,
          studentId: user.id,
          studentName: user.name,
        });
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

export const cancelBorrowingRequest = async (req: Request, res: Response) => {
  const user = currentUser(res);
  if (!user || user.portalRole !== "Student") {
    return res.status(403).json({ success: false, message: "Student access required." });
  }
  try {
    if (env.db.enabled) {
      const cancelled = await libraryCirculationRepository.cancelBorrowingRequest(
        req.params.id,
        user.id
      );
      if (!cancelled) {
        return res.status(404).json({
          success: false,
          message: "Pending borrowing request not found.",
        });
      }
    } else {
      const request = libraryETLService
        .getBorrowingRequests(user.id)
        .find((item) => item.id === req.params.id && item.status === "Pending");
      if (!request) {
        return res.status(404).json({
          success: false,
          message: "Pending borrowing request not found.",
        });
      }
      if (!libraryETLService.cancelBorrowingRequest(req.params.id, user.id)) {
        return res.status(404).json({
          success: false,
          message: "Pending borrowing request not found.",
        });
      }
    }
    return res.json({ success: true, message: "Borrowing request cancelled." });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to cancel borrowing request.",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const createLibraryReservation = async (req: Request, res: Response) => {
  const user = currentUser(res);
  if (!user || user.portalRole !== "Student") {
    return res.status(403).json({ success: false, message: "Student access required." });
  }
  try {
    if (env.db.enabled) {
      const reservation = await libraryCirculationRepository.createLibraryReservation({
        studentId: user.id,
        studentName: user.name,
        bookId: typeof req.body?.bookId === "string" ? req.body.bookId : "",
      });
      return res.status(201).json({ success: true, data: reservation });
    }
    return res.status(501).json({
      success: false,
      message: "Reservations require the database to be enabled.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to place reservation.";
    const isClientError =
      message ===
      "Book or student not found, or an active reservation already exists.";
    return res.status(isClientError ? 400 : 500).json({
      success: false,
      message,
    });
  }
};

export const cancelLibraryReservation = async (req: Request, res: Response) => {
  const user = currentUser(res);
  if (!user || user.portalRole !== "Student") {
    return res.status(403).json({ success: false, message: "Student access required." });
  }
  try {
    const cancelled = env.db.enabled
      ? await libraryCirculationRepository.cancelLibraryReservation(req.params.id, user.id)
      : false;
    if (!cancelled) {
      return res.status(404).json({
        success: false,
        message: "Active reservation not found.",
      });
    }
    return res.json({ success: true, message: "Reservation cancelled." });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to cancel reservation.",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getLibraryNotifications = async (_req: Request, res: Response) => {
  const user = currentUser(res);
  if (!user) {
    return res.status(401).json({ success: false, message: "Authentication required." });
  }
  try {
    const notifications =
      user.portalRole === "Student" && env.db.enabled
        ? await libraryCirculationRepository.listLibraryNotifications(user.id)
        : [];
    return res.json(notifications);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve library notifications.",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const markLibraryNotificationRead = async (req: Request, res: Response) => {
  const user = currentUser(res);
  if (!user || user.portalRole !== "Student") {
    return res.status(403).json({ success: false, message: "Student access required." });
  }
  try {
    const updated = env.db.enabled
      ? await libraryCirculationRepository.markLibraryNotificationRead(
          req.params.id,
          user.id
        )
      : false;
    if (!updated) {
      return res.status(404).json({ success: false, message: "Notification not found." });
    }
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update notification.",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const markAllLibraryNotificationsRead = async (_req: Request, res: Response) => {
  const user = currentUser(res);
  if (!user || user.portalRole !== "Student") {
    return res.status(403).json({ success: false, message: "Student access required." });
  }
  try {
    if (env.db.enabled) {
      await libraryCirculationRepository.markAllLibraryNotificationsRead(user.id);
    }
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update notifications.",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const approveBorrowingRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const reviewer = currentUser(res);
    const reviewedBy = reviewer?.name || "Library Staff";
    const result = env.db.enabled
      ? await libraryCirculationRepository.approveBorrowingRequest(id, reviewedBy)
      : libraryETLService.approveBorrowingRequest(id, reviewedBy);
    if (!result.ok) {
      const statusCode = result.message === "Request not found." ? 404 : 400;
      return res.status(statusCode).json({ success: false, message: result.message });
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

export const rejectBorrowingRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const reviewer = currentUser(res);
    const reviewedBy = reviewer?.name || "Library Staff";
    const result = env.db.enabled
      ? await libraryCirculationRepository.rejectBorrowingRequest(
          id,
          typeof reason === "string" ? reason : "",
          reviewedBy
        )
      : libraryETLService.rejectBorrowingRequest(id, reason, reviewedBy);
    if (!result.ok) {
      const statusCode =
        result.message === "Request not found." ||
        result.message === "Pending request not found."
          ? 404
          : 400;
      return res.status(statusCode).json({ success: false, message: result.message });
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

export const confirmBookReturn = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = env.db.enabled
      ? await libraryCirculationRepository.confirmLibraryReturn(id)
      : libraryETLService.confirmReturn(id);
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
