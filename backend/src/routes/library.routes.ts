import { Router } from "express";
import {
  approveBorrowingRequest,
  cancelBorrowingRequest,
  cancelLibraryReservation,
  confirmBookReturn,
  createLibraryReservation,
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
  getLibraryNotifications,
  getLibraryOverview,
  getLibraryReservations,
  getLibraryTransactions,
  lookupBookCover,
  markLibraryFinePaid,
  markAllLibraryNotificationsRead,
  markLibraryNotificationRead,
  rejectBorrowingRequest,
  refreshLibraryBookCover,
  runLibraryETLSync,
} from "../controllers/library.controller";
import { requireAuth, requireRoles } from "../middleware/auth.middleware";
import { uploadBookCover } from "../middleware/book-cover-upload.middleware";

const router = Router();

// Library Overview & KPIs
router.get(
  "/library/overview",
  requireAuth,
  requireRoles("Administrator", "Librarian"),
  getLibraryOverview
);

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
router.get("/library/books", requireAuth, getLibraryBooks);
router.get("/library/categories", requireAuth, getBookCategories);

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
router.get(
  "/library/borrowers",
  requireAuth,
  requireRoles("Administrator", "Librarian"),
  getLibraryBorrowers
);
router.get("/library/transactions", requireAuth, getLibraryTransactions);
router.get("/library/reservations", requireAuth, getLibraryReservations);
router.get("/library/fines", requireAuth, getLibraryFines);
router.get("/library/notifications", requireAuth, getLibraryNotifications);
router.post(
  "/library/notifications/read-all",
  requireAuth,
  requireRoles("Student"),
  markAllLibraryNotificationsRead
);
router.post(
  "/library/notifications/:id/read",
  requireAuth,
  requireRoles("Student"),
  markLibraryNotificationRead
);
router.put(
  "/library/fines/:id/pay",
  requireAuth,
  requireRoles("Administrator", "Librarian"),
  markLibraryFinePaid
);

// Student Borrowing Requests & Returns
router.get("/library/requests", requireAuth, getBorrowingRequests);
router.post(
  "/library/requests",
  requireAuth,
  requireRoles("Student"),
  createBorrowingRequest
);
router.post(
  "/library/requests/:id/cancel",
  requireAuth,
  requireRoles("Student"),
  cancelBorrowingRequest
);
router.post(
  "/library/requests/:id/approve",
  requireAuth,
  requireRoles("Administrator", "Librarian"),
  approveBorrowingRequest
);
router.post(
  "/library/requests/:id/reject",
  requireAuth,
  requireRoles("Administrator", "Librarian"),
  rejectBorrowingRequest
);
router.post(
  "/library/reservations",
  requireAuth,
  requireRoles("Student"),
  createLibraryReservation
);
router.post(
  "/library/reservations/:id/cancel",
  requireAuth,
  requireRoles("Student"),
  cancelLibraryReservation
);
router.post(
  "/library/returns/:id",
  requireAuth,
  requireRoles("Administrator", "Librarian"),
  confirmBookReturn
);

// ETL / ELT Pipeline Ingestion & Logs
router.post(
  "/library/etl/sync",
  requireAuth,
  requireRoles("Administrator", "Librarian"),
  runLibraryETLSync
);
router.get(
  "/library/etl/logs",
  requireAuth,
  requireRoles("Administrator", "Librarian"),
  getLibraryETLLogs
);

export default router;
