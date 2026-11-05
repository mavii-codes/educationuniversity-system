import { Router } from "express";
import {
  approveBorrowingRequest,
  confirmBookReturn,
  createLibraryBook,
  deleteLibraryBookCover,
  createBorrowingRequest,
  editLibraryBook,
  getBookCategories,
  getBorrowingRequests,
  getLibraryBooks,
  getLibraryBorrowers,
  getLibraryETLLogs,
  getLibraryFines,
  getLibraryOverview,
  getLibraryReservations,
  getLibraryTransactions,
  lookupBookCover,
  markLibraryFinePaid,
  rejectBorrowingRequest,
  refreshLibraryBookCover,
  runLibraryETLSync,
} from "../controllers/library.controller";
import { requireAuth, requireRoles } from "../middleware/auth.middleware";
import { uploadBookCover } from "../middleware/book-cover-upload.middleware";

const router = Router();

// Library Overview & KPIs
router.get("/library/overview", getLibraryOverview);

// Books & Categories
router.post(
  "/library/books/cover-lookup",
  requireAuth,
  requireRoles("Administrator", "Librarian"),
  lookupBookCover
);
router.post(
  "/library/books",
  requireAuth,
  requireRoles("Administrator", "Librarian"),
  uploadBookCover,
  createLibraryBook
);
router.put(
  "/library/books/:id",
  requireAuth,
  requireRoles("Administrator", "Librarian"),
  uploadBookCover,
  editLibraryBook
);
router.delete(
  "/library/books/:id/cover",
  requireAuth,
  requireRoles("Administrator", "Librarian"),
  deleteLibraryBookCover
);
router.post(
  "/library/books/:id/refresh-cover",
  requireAuth,
  requireRoles("Administrator", "Librarian"),
  refreshLibraryBookCover
);
router.get("/library/books", getLibraryBooks);
router.get("/library/categories", getBookCategories);

router.post(
  "/books",
  requireAuth,
  requireRoles("Administrator", "Librarian"),
  uploadBookCover,
  createLibraryBook
);
router.put(
  "/books/:id",
  requireAuth,
  requireRoles("Administrator", "Librarian"),
  uploadBookCover,
  editLibraryBook
);
router.delete(
  "/books/:id/cover",
  requireAuth,
  requireRoles("Administrator", "Librarian"),
  deleteLibraryBookCover
);

// Borrowers, Transactions, Returns, Reservations, and Fines
router.get("/library/borrowers", getLibraryBorrowers);
router.get("/library/transactions", getLibraryTransactions);
router.get("/library/reservations", getLibraryReservations);
router.get("/library/fines", getLibraryFines);
router.put(
  "/library/fines/:id/pay",
  requireAuth,
  requireRoles("Administrator", "Librarian"),
  markLibraryFinePaid
);

// Student Borrowing Requests & Returns
router.get("/library/requests", getBorrowingRequests);
router.post("/library/requests", createBorrowingRequest);
router.post("/library/requests/:id/approve", approveBorrowingRequest);
router.post("/library/requests/:id/reject", rejectBorrowingRequest);
router.post("/library/returns/:id", confirmBookReturn);

// ETL / ELT Pipeline Ingestion & Logs
router.post("/library/etl/sync", runLibraryETLSync);
router.get("/library/etl/logs", getLibraryETLLogs);

export default router;
