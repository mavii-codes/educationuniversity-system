import { Router } from "express";
import {
  approveBorrowingRequest,
  confirmBookReturn,
  createBorrowingRequest,
  getBookCategories,
  getBorrowingRequests,
  getLibraryBooks,
  getLibraryBorrowers,
  getLibraryETLLogs,
  getLibraryFines,
  getLibraryOverview,
  getLibraryReservations,
  getLibraryTransactions,
  rejectBorrowingRequest,
  runLibraryETLSync,
} from "../controllers/library.controller";

const router = Router();

// Library Overview & KPIs
router.get("/library/overview", getLibraryOverview);

// Books & Categories
router.get("/library/books", getLibraryBooks);
router.get("/library/categories", getBookCategories);

// Borrowers, Transactions, Returns, Reservations, and Fines
router.get("/library/borrowers", getLibraryBorrowers);
router.get("/library/transactions", getLibraryTransactions);
router.get("/library/reservations", getLibraryReservations);
router.get("/library/fines", getLibraryFines);

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
