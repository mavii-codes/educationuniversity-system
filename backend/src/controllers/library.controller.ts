import { Request, Response } from "express";
import { libraryETLService } from "../services/library.service";

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

export const getLibraryBooks = (req: Request, res: Response) => {
  try {
    const { search, category, status } = req.query as {
      search?: string;
      category?: string;
      status?: string;
    };
    const books = libraryETLService.getBooks({ search, category, status });
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

export const getLibraryFines = (req: Request, res: Response) => {
  try {
    const { search, paymentStatus } = req.query as {
      search?: string;
      paymentStatus?: string;
    };
    const fines = libraryETLService.getFines({ search, paymentStatus });
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

