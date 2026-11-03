"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  BorrowingRequest,
  BorrowingRequestStatus,
  BorrowingTransaction,
  LibraryBook,
  OverdueFineRecord,
  ReservationRecord,
  StudentLibraryDashboardSummary,
  StudentNotificationItem,
} from "@/types";
import {
  BORROWING_TRANSACTIONS,
  LIBRARY_BOOKS,
  OVERDUE_FINES,
  RESERVATIONS,
} from "@/data/mock-data";
import { SessionUser } from "./auth";

interface LibraryStoreContextValue {
  books: LibraryBook[];
  borrowingRequests: BorrowingRequest[];
  transactions: BorrowingTransaction[];
  reservations: ReservationRecord[];
  fines: OverdueFineRecord[];
  notifications: StudentNotificationItem[];

  // Student Actions
  submitBorrowRequest: (
    bookId: string,
    user: SessionUser
  ) => Promise<{ ok: boolean; message: string }>;
  cancelBorrowRequest: (
    requestId: string
  ) => Promise<{ ok: boolean; message: string }>;
  submitReservation: (
    bookId: string,
    user: SessionUser
  ) => Promise<{ ok: boolean; message: string }>;
  cancelReservation: (
    reservationId: string
  ) => Promise<{ ok: boolean; message: string }>;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: (studentId: string) => void;

  // Admin Actions
  approveBorrowRequest: (
    requestId: string,
    adminName: string
  ) => Promise<{ ok: boolean; message: string }>;
  rejectBorrowRequest: (
    requestId: string,
    reason: string,
    adminName: string
  ) => Promise<{ ok: boolean; message: string }>;
  confirmBookReturn: (
    transactionId: string
  ) => Promise<{ ok: boolean; fineAccrued: number; message: string }>;

  // Query Helpers
  getStudentSummary: (studentId: string) => StudentLibraryDashboardSummary;
  getStudentTransactions: (studentId: string) => BorrowingTransaction[];
  getStudentRequests: (studentId: string) => BorrowingRequest[];
  getStudentReservations: (studentId: string) => ReservationRecord[];
  getStudentFines: (studentId: string) => OverdueFineRecord[];
  getStudentNotifications: (studentId: string) => StudentNotificationItem[];
}

const STORAGE_KEYS = {
  BOOKS: "udis_library_books",
  REQUESTS: "udis_library_requests",
  TRANSACTIONS: "udis_library_transactions",
  RESERVATIONS: "udis_library_reservations",
  FINES: "udis_library_fines",
  NOTIFICATIONS: "udis_student_notifications",
};

// Initial default borrowing requests
const INITIAL_BORROWING_REQUESTS: BorrowingRequest[] = [
  {
    id: "req-101",
    requestCode: "REQ-2026-0091",
    bookId: "bk-003",
    bookTitle: "Database System Concepts (7th Edition)",
    author: "Abraham Silberschatz, Henry F. Korth",
    isbn: "978-0078022159",
    category: "Database Systems",
    studentId: "2024-042",
    studentName: "Marco Villanueva",
    programCode: "BSIT",
    requestDate: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    status: "Pending",
  },
  {
    id: "req-102",
    requestCode: "REQ-2026-0082",
    bookId: "bk-006",
    bookTitle: "Computer Networking: A Top-Down Approach (8th Edition)",
    author: "James Kurose, Keith Ross",
    isbn: "978-0136681557",
    category: "Computer Networks",
    studentId: "2024-042",
    studentName: "Marco Villanueva",
    programCode: "BSIT",
    requestDate: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    status: "Approved",
    reviewedBy: "Administrator",
    reviewedDate: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    pickupDueDate: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
  },
  {
    id: "req-103",
    requestCode: "REQ-2026-0064",
    bookId: "bk-004",
    bookTitle: "Artificial Intelligence: A Modern Approach (4th Edition)",
    author: "Stuart Russell, Peter Norvig",
    isbn: "978-0134610993",
    category: "Artificial Intelligence",
    studentId: "2024-042",
    studentName: "Marco Villanueva",
    programCode: "BSIT",
    requestDate: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    status: "Rejected",
    rejectionReason:
      "Maximum allowed active borrowings reached (3 books limit). Please return overdue books.",
    reviewedBy: "Administrator",
    reviewedDate: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
  },
];

const INITIAL_NOTIFICATIONS: StudentNotificationItem[] = [
  {
    id: "notif-001",
    studentId: "2024-042",
    title: "Overdue Loan Reminder",
    message:
      "Effective Java (3rd Edition) was due on Nov 1, 2026. A daily overdue fine of ₱15.00 has accrued. Please return to the library desk.",
    type: "Fine",
    timestamp: "1 day ago",
    read: false,
    actionUrl: "/student/fines",
  },
  {
    id: "notif-002",
    studentId: "2024-042",
    title: "Reservation Ready for Pickup",
    message:
      "Your reservation for 'Clean Code: A Handbook of Agile Software Craftsmanship' is ready at the Reserve Desk until Nov 4, 2026.",
    type: "Reservation",
    timestamp: "2 days ago",
    read: false,
    actionUrl: "/student/borrowing",
  },
  {
    id: "notif-003",
    studentId: "2024-042",
    title: "Borrowing Request Approved",
    message:
      "Your borrowing request REQ-2026-0082 for 'Computer Networking' was approved. Please claim at Circulation Counter within 48 hours.",
    type: "BorrowRequest",
    timestamp: "3 days ago",
    read: true,
    actionUrl: "/student/borrowing",
  },
];

const LibraryStoreContext = createContext<LibraryStoreContextValue | undefined>(
  undefined
);

export function LibraryStoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [books, setBooks] = useState<LibraryBook[]>(() => {
    if (typeof window === "undefined") return LIBRARY_BOOKS;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEYS.BOOKS);
      return stored ? JSON.parse(stored) : LIBRARY_BOOKS;
    } catch {
      return LIBRARY_BOOKS;
    }
  });

  const [borrowingRequests, setBorrowingRequests] = useState<
    BorrowingRequest[]
  >(() => {
    if (typeof window === "undefined") return INITIAL_BORROWING_REQUESTS;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEYS.REQUESTS);
      return stored ? JSON.parse(stored) : INITIAL_BORROWING_REQUESTS;
    } catch {
      return INITIAL_BORROWING_REQUESTS;
    }
  });

  const [transactions, setTransactions] = useState<BorrowingTransaction[]>(
    () => {
      if (typeof window === "undefined") return BORROWING_TRANSACTIONS;
      try {
        const stored = window.localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
        return stored ? JSON.parse(stored) : BORROWING_TRANSACTIONS;
      } catch {
        return BORROWING_TRANSACTIONS;
      }
    }
  );

  const [reservations, setReservations] = useState<ReservationRecord[]>(() => {
    if (typeof window === "undefined") return RESERVATIONS;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEYS.RESERVATIONS);
      return stored ? JSON.parse(stored) : RESERVATIONS;
    } catch {
      return RESERVATIONS;
    }
  });

  const [fines, setFines] = useState<OverdueFineRecord[]>(() => {
    if (typeof window === "undefined") return OVERDUE_FINES;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEYS.FINES);
      return stored ? JSON.parse(stored) : OVERDUE_FINES;
    } catch {
      return OVERDUE_FINES;
    }
  });

  const [notifications, setNotifications] = useState<
    StudentNotificationItem[]
  >(() => {
    if (typeof window === "undefined") return INITIAL_NOTIFICATIONS;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return stored ? JSON.parse(stored) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  // Sync state changes to localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
    } catch {}
  }, [books]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.REQUESTS,
        JSON.stringify(borrowingRequests)
      );
    } catch {}
  }, [borrowingRequests]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.TRANSACTIONS,
        JSON.stringify(transactions)
      );
    } catch {}
  }, [transactions]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.RESERVATIONS,
        JSON.stringify(reservations)
      );
    } catch {}
  }, [reservations]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.FINES, JSON.stringify(fines));
    } catch {}
  }, [fines]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.NOTIFICATIONS,
        JSON.stringify(notifications)
      );
    } catch {}
  }, [notifications]);

  // Submit a Borrow Request
  const submitBorrowRequest = useCallback(
    async (
      bookId: string,
      user: SessionUser
    ): Promise<{ ok: boolean; message: string }> => {
      const book = books.find((b) => b.id === bookId);
      if (!book) {
        return { ok: false, message: "Book record not found in catalog." };
      }

      if (book.availableCopies <= 0) {
        return {
          ok: false,
          message:
            "No copies currently available. You may place a reservation instead.",
        };
      }

      const studentId = user.studentId || user.id;

      // Check if already requested or currently borrowed
      const existingRequest = borrowingRequests.find(
        (r) =>
          r.studentId === studentId &&
          r.bookId === bookId &&
          (r.status === "Pending" || r.status === "Approved")
      );
      if (existingRequest) {
        return {
          ok: false,
          message:
            "You already have an active or pending request for this title.",
        };
      }

      const currentLoans = transactions.filter(
        (t) =>
          t.studentId === studentId &&
          (t.status === "Borrowed" || t.status === "Overdue")
      );
      if (currentLoans.length >= 3) {
        return {
          ok: false,
          message:
            "Borrowing limit reached. Students can hold up to 3 active books concurrently.",
        };
      }

      const newRequest: BorrowingRequest = {
        id: `req-${Date.now()}`,
        requestCode: `REQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        bookId: book.id,
        bookTitle: book.title,
        author: book.author,
        isbn: book.isbn,
        category: book.category,
        studentId,
        studentName: user.name,
        programCode: user.programCode || "BSIT",
        requestDate: new Date().toISOString(),
        status: "Pending",
      };

      setBorrowingRequests((prev) => [newRequest, ...prev]);

      // Add Notification
      const newNotif: StudentNotificationItem = {
        id: `notif-${Date.now()}`,
        studentId,
        title: "Borrowing Request Submitted",
        message: `Your request for "${book.title}" (${newRequest.requestCode}) has been sent for Librarian review.`,
        type: "BorrowRequest",
        timestamp: "Just now",
        read: false,
        actionUrl: "/student/borrowing",
      };
      setNotifications((prev) => [newNotif, ...prev]);

      return {
        ok: true,
        message:
          "Borrowing request submitted successfully. A Librarian will review your request.",
      };
    },
    [books, borrowingRequests, transactions]
  );

  // Cancel Pending Borrow Request
  const cancelBorrowRequest = useCallback(
    async (requestId: string): Promise<{ ok: boolean; message: string }> => {
      setBorrowingRequests((prev) =>
        prev.map((r) =>
          r.id === requestId && r.status === "Pending"
            ? { ...r, status: "Cancelled" }
            : r
        )
      );
      return { ok: true, message: "Borrowing request cancelled." };
    },
    []
  );

  // Submit Reservation
  const submitReservation = useCallback(
    async (
      bookId: string,
      user: SessionUser
    ): Promise<{ ok: boolean; message: string }> => {
      const book = books.find((b) => b.id === bookId);
      if (!book) {
        return { ok: false, message: "Book record not found." };
      }

      const studentId = user.studentId || user.id;

      // Check if already reserved
      const existing = reservations.find(
        (r) =>
          r.studentId === studentId &&
          r.bookId === bookId &&
          (r.status === "Pending" || r.status === "Ready for Pickup")
      );
      if (existing) {
        return {
          ok: false,
          message: "You already have an active reservation for this book.",
        };
      }

      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 7);

      const newReservation: ReservationRecord = {
        id: `res-${Date.now()}`,
        reservationCode: `RES-2026-${Math.floor(100 + Math.random() * 900)}`,
        bookId: book.id,
        bookTitle: book.title,
        isbn: book.isbn,
        studentId,
        studentName: user.name,
        programCode: user.programCode || "BSIT",
        reservedDate: new Date().toISOString(),
        expiryDate: expiry.toISOString(),
        status: "Pending",
      };

      setReservations((prev) => [newReservation, ...prev]);

      const newNotif: StudentNotificationItem = {
        id: `notif-${Date.now()}`,
        studentId,
        title: "Reservation Placed",
        message: `You are on the reservation queue for "${book.title}". You will be notified when a copy is checked in.`,
        type: "Reservation",
        timestamp: "Just now",
        read: false,
        actionUrl: "/student/borrowing",
      };
      setNotifications((prev) => [newNotif, ...prev]);

      return {
        ok: true,
        message: "Reservation recorded. You will be alerted when available.",
      };
    },
    [books, reservations]
  );

  // Cancel Reservation
  const cancelReservation = useCallback(
    async (
      reservationId: string
    ): Promise<{ ok: boolean; message: string }> => {
      setReservations((prev) =>
        prev.map((r) =>
          r.id === reservationId ? { ...r, status: "Cancelled" } : r
        )
      );
      return { ok: true, message: "Reservation cancelled." };
    },
    []
  );

  // Admin approves borrowing request
  const approveBorrowRequest = useCallback(
    async (
      requestId: string,
      adminName: string
    ): Promise<{ ok: boolean; message: string }> => {
      const request = borrowingRequests.find((r) => r.id === requestId);
      if (!request) return { ok: false, message: "Request not found." };

      const book = books.find((b) => b.id === request.bookId);
      if (!book || book.availableCopies <= 0) {
        return {
          ok: false,
          message: "Cannot approve: no copies available in inventory.",
        };
      }

      const pickupDue = new Date();
      pickupDue.setDate(pickupDue.getDate() + 2); // 48h pickup window

      const loanDue = new Date();
      loanDue.setDate(loanDue.getDate() + 14); // 14 days loan period

      // 1. Update request status to Approved
      setBorrowingRequests((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? {
                ...r,
                status: "Approved",
                reviewedBy: adminName,
                reviewedDate: new Date().toISOString(),
                pickupDueDate: pickupDue.toISOString(),
              }
            : r
        )
      );

      // 2. Decrement available copies & increment borrowed copies
      setBooks((prev) =>
        prev.map((b) =>
          b.id === book.id
            ? {
                ...b,
                availableCopies: Math.max(0, b.availableCopies - 1),
                borrowedCopies: b.borrowedCopies + 1,
                status:
                  b.availableCopies - 1 <= 0 ? "Checked Out" : "Partially Available",
              }
            : b
        )
      );

      // 3. Create active borrowing transaction
      const newTx: BorrowingTransaction = {
        id: `tx-${Date.now()}`,
        transactionCode: `TX-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        bookId: book.id,
        bookTitle: book.title,
        isbn: book.isbn,
        studentId: request.studentId,
        studentName: request.studentName,
        programCode: request.programCode,
        borrowDate: new Date().toISOString(),
        dueDate: loanDue.toISOString(),
        status: "Borrowed",
        finesAccrued: 0,
        sourceSystem: "Integrated Library LMS (REST API)",
      };
      setTransactions((prev) => [newTx, ...prev]);

      // 4. Notify student
      const notif: StudentNotificationItem = {
        id: `notif-${Date.now()}`,
        studentId: request.studentId,
        title: "Borrowing Request Approved!",
        message: `Your request for "${book.title}" was approved by ${adminName}. Please pick up at the Circulation Counter. Due date: ${loanDue.toLocaleDateString()}.`,
        type: "BorrowRequest",
        timestamp: "Just now",
        read: false,
        actionUrl: "/student/borrowing",
      };
      setNotifications((prev) => [notif, ...prev]);

      return {
        ok: true,
        message: `Request approved. Active loan generated for ${request.studentName}.`,
      };
    },
    [books, borrowingRequests]
  );

  // Admin rejects borrowing request
  const rejectBorrowRequest = useCallback(
    async (
      requestId: string,
      reason: string,
      adminName: string
    ): Promise<{ ok: boolean; message: string }> => {
      const request = borrowingRequests.find((r) => r.id === requestId);
      if (!request) return { ok: false, message: "Request not found." };

      setBorrowingRequests((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? {
                ...r,
                status: "Rejected",
                rejectionReason: reason || "Unspecified librarian discretion.",
                reviewedBy: adminName,
                reviewedDate: new Date().toISOString(),
              }
            : r
        )
      );

      const notif: StudentNotificationItem = {
        id: `notif-${Date.now()}`,
        studentId: request.studentId,
        title: "Borrowing Request Rejected",
        message: `Your request for "${request.bookTitle}" was rejected. Reason: ${reason}`,
        type: "BorrowRequest",
        timestamp: "Just now",
        read: false,
        actionUrl: "/student/borrowing",
      };
      setNotifications((prev) => [notif, ...prev]);

      return { ok: true, message: "Request rejected with reason." };
    },
    [borrowingRequests]
  );

  // Admin confirms return of a book
  const confirmBookReturn = useCallback(
    async (
      transactionId: string
    ): Promise<{ ok: boolean; fineAccrued: number; message: string }> => {
      const tx = transactions.find((t) => t.id === transactionId);
      if (!tx) return { ok: false, fineAccrued: 0, message: "Transaction not found." };

      const now = new Date();
      const dueDate = new Date(tx.dueDate);
      const isOverdue = now.getTime() > dueDate.getTime();
      let calculatedFine = 0;

      if (isOverdue) {
        const diffMs = now.getTime() - dueDate.getTime();
        const daysOverdue = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        const finePerDay = 15.0; // standard ₱15 / day library policy
        calculatedFine = daysOverdue * finePerDay;

        // Create overdue fine record
        const newFine: OverdueFineRecord = {
          id: `fine-${Date.now()}`,
          transactionId: tx.id,
          bookTitle: tx.bookTitle,
          studentId: tx.studentId,
          studentName: tx.studentName,
          programCode: tx.programCode,
          dueDate: tx.dueDate,
          daysOverdue,
          fineAmount: calculatedFine,
          paymentStatus: "Unpaid",
        };
        setFines((prev) => [newFine, ...prev]);

        // Notify student about overdue fine
        const fineNotif: StudentNotificationItem = {
          id: `notif-${Date.now()}`,
          studentId: tx.studentId,
          title: "Overdue Return Fine Incurred",
          message: `Returned "${tx.bookTitle}" was overdue by ${daysOverdue} day(s). A fine of ₱${calculatedFine.toFixed(2)} has been recorded on your student account.`,
          type: "Fine",
          timestamp: "Just now",
          read: false,
          actionUrl: "/student/fines",
        };
        setNotifications((prev) => [fineNotif, ...prev]);
      }

      // 1. Mark transaction as Returned
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === transactionId
            ? {
                ...t,
                status: "Returned",
                returnDate: now.toISOString(),
                finesAccrued: calculatedFine,
              }
            : t
        )
      );

      // 2. Increment book available copies
      setBooks((prev) =>
        prev.map((b) =>
          b.id === tx.bookId
            ? {
                ...b,
                availableCopies: Math.min(b.totalCopies, b.availableCopies + 1),
                borrowedCopies: Math.max(0, b.borrowedCopies - 1),
                status:
                  b.availableCopies + 1 >= b.totalCopies
                    ? "Available"
                    : "Partially Available",
              }
            : b
        )
      );

      // 3. Complete associated borrowing request if any
      setBorrowingRequests((prev) =>
        prev.map((r) =>
          r.bookId === tx.bookId && r.studentId === tx.studentId && r.status === "Approved"
            ? { ...r, status: "Completed" }
            : r
        )
      );

      return {
        ok: true,
        fineAccrued: calculatedFine,
        message: isOverdue
          ? `Book return confirmed. Overdue fine of ₱${calculatedFine.toFixed(2)} applied.`
          : `Book return confirmed. Inventory restored to Available.`,
      };
    },
    [transactions]
  );

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllNotificationsRead = useCallback((studentId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.studentId === studentId ? { ...n, read: true } : n))
    );
  }, []);

  // Summary helper
  const getStudentSummary = useCallback(
    (studentId: string): StudentLibraryDashboardSummary => {
      const activeBorrowed = transactions.filter(
        (t) =>
          t.studentId === studentId &&
          (t.status === "Borrowed" || t.status === "Overdue")
      );
      const pendingReqs = borrowingRequests.filter(
        (r) => r.studentId === studentId && r.status === "Pending"
      );
      const activeRes = reservations.filter(
        (r) =>
          r.studentId === studentId &&
          (r.status === "Pending" || r.status === "Ready for Pickup")
      );
      const overdueLoans = activeBorrowed.filter((t) => t.status === "Overdue");
      const studentFines = fines.filter(
        (f) => f.studentId === studentId && f.paymentStatus === "Unpaid"
      );
      const unpaidTotal = studentFines.reduce(
        (acc, curr) => acc + curr.fineAmount,
        0
      );
      const unreadNotifs = notifications.filter(
        (n) => n.studentId === studentId && !n.read
      ).length;

      const availableBooks = books.filter((b) => b.availableCopies > 0).length;

      return {
        availableBooksCount: availableBooks,
        currentBorrowedCount: activeBorrowed.length,
        pendingRequestsCount: pendingReqs.length,
        activeReservationsCount: activeRes.length,
        overdueBooksCount: overdueLoans.length,
        outstandingFinesTotal: unpaidTotal,
        unreadNotificationsCount: unreadNotifs,
      };
    },
    [books, borrowingRequests, transactions, reservations, fines, notifications]
  );

  const getStudentTransactions = useCallback(
    (studentId: string) => transactions.filter((t) => t.studentId === studentId),
    [transactions]
  );

  const getStudentRequests = useCallback(
    (studentId: string) =>
      borrowingRequests.filter((r) => r.studentId === studentId),
    [borrowingRequests]
  );

  const getStudentReservations = useCallback(
    (studentId: string) => reservations.filter((r) => r.studentId === studentId),
    [reservations]
  );

  const getStudentFines = useCallback(
    (studentId: string) => fines.filter((f) => f.studentId === studentId),
    [fines]
  );

  const getStudentNotifications = useCallback(
    (studentId: string) =>
      notifications.filter((n) => n.studentId === studentId),
    [notifications]
  );

  return (
    <LibraryStoreContext.Provider
      value={{
        books,
        borrowingRequests,
        transactions,
        reservations,
        fines,
        notifications,
        submitBorrowRequest,
        cancelBorrowRequest,
        submitReservation,
        cancelReservation,
        markNotificationRead,
        markAllNotificationsRead,
        approveBorrowRequest,
        rejectBorrowRequest,
        confirmBookReturn,
        getStudentSummary,
        getStudentTransactions,
        getStudentRequests,
        getStudentReservations,
        getStudentFines,
        getStudentNotifications,
      }}
    >
      {children}
    </LibraryStoreContext.Provider>
  );
}

export function useLibraryStore() {
  const ctx = useContext(LibraryStoreContext);
  if (!ctx) {
    throw new Error(
      "useLibraryStore must be used within a LibraryStoreProvider"
    );
  }
  return ctx;
}

