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
import { SessionUser, useAuth } from "./auth";
import {
  API_CONFIG,
  approveLibraryRequest,
  cancelLibraryRequest,
  cancelLibraryReservation,
  createLibraryReservation,
  createLibraryRequest as createLiveLibraryRequest,
  getLibraryBooks,
  getLibraryFines,
  getLibraryNotifications,
  getLibraryRequests,
  getLibraryReservations,
  getLibraryTransactions,
  payLibraryFine,
  markAllLibraryNotificationsRead as markAllLiveLibraryNotificationsRead,
  markLibraryNotificationRead as markLiveLibraryNotificationRead,
  rejectLibraryRequest,
  returnLibraryTransaction,
} from "./api";

type LibraryLoadState = "loading" | "ready" | "error";

interface LibraryStoreContextValue {
  // Live API load status. Always "ready" when the demo store is in use.
  loadState: LibraryLoadState;
  loadError?: string;
  refreshData: () => Promise<void>;

  books: LibraryBook[];
  upsertBook: (book: LibraryBook) => void;
  borrowingRequests: BorrowingRequest[];
  transactions: BorrowingTransaction[];
  reservations: ReservationRecord[];
  fines: OverdueFineRecord[];
  settleFine: (fineId: string) => Promise<{ ok: boolean; message: string }>;
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

function addMockCoverUrl(book: LibraryBook): LibraryBook {
  const needsEducationCoverRepair =
    book.id === "bk-009" && book.isbn === "978-0134444581";
  if (book.cover_url && !needsEducationCoverRepair) return book;
  const isbn = (needsEducationCoverRepair ? "978-0132996297" : book.isbn).replace(
    /[-\s]/g,
    ""
  );
  return {
    ...book,
    ...(needsEducationCoverRepair ? { isbn: "978-0132996297" } : {}),
    cover_url: isbn
      ? `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(isbn)}-M.jpg?default=false`
      : null,
  };
}

function mergeStoredBooksWithCatalog(storedBooks: LibraryBook[]): LibraryBook[] {
  const storedIds = new Set(storedBooks.map((book) => book.id));
  return [
    ...storedBooks.map(addMockCoverUrl),
    ...LIBRARY_BOOKS.filter((book) => !storedIds.has(book.id)).map(addMockCoverUrl),
  ];
}

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
  const { isAuthenticated } = useAuth();

  const [books, setBooks] = useState<LibraryBook[]>(() => {
    // Live mode starts empty and is populated by the authenticated fetch;
    // localStorage seeds are only meaningful for the mock demo store.
    if (API_CONFIG.useLiveApi) return [];
    if (typeof window === "undefined") return LIBRARY_BOOKS;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEYS.BOOKS);
      return stored
        ? mergeStoredBooksWithCatalog(JSON.parse(stored) as LibraryBook[])
        : LIBRARY_BOOKS.map(addMockCoverUrl);
    } catch {
      return LIBRARY_BOOKS.map(addMockCoverUrl);
    }
  });

  const [borrowingRequests, setBorrowingRequests] = useState<
    BorrowingRequest[]
  >(() => {
    if (API_CONFIG.useLiveApi) return [];
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
      if (API_CONFIG.useLiveApi) return [];
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
    if (API_CONFIG.useLiveApi) return [];
    if (typeof window === "undefined") return RESERVATIONS;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEYS.RESERVATIONS);
      return stored ? JSON.parse(stored) : RESERVATIONS;
    } catch {
      return RESERVATIONS;
    }
  });

  const [fines, setFines] = useState<OverdueFineRecord[]>(() => {
    if (API_CONFIG.useLiveApi) return [];
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
    if (API_CONFIG.useLiveApi) return [];
    if (typeof window === "undefined") return INITIAL_NOTIFICATIONS;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return stored ? JSON.parse(stored) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  // Load status is only meaningful for the live API. The demo store always
  // reports "ready" so degradation UI can never appear in demo mode.
  const [loadState, setLoadState] = useState<LibraryLoadState>(() =>
    API_CONFIG.useLiveApi ? "loading" : "ready"
  );
  const [loadError, setLoadError] = useState<string | undefined>(undefined);

  const refreshLiveLibraryData = useCallback(
    async ({ showLoading = false }: { showLoading?: boolean } = {}) => {
      if (!API_CONFIG.useLiveApi) {
        setLoadState("ready");
        setLoadError(undefined);
        return;
      }

      if (showLoading) {
        setLoadState("loading");
        setLoadError(undefined);
      }

      const results = await Promise.allSettled([
        getLibraryBooks(),
        getLibraryFines(),
        getLibraryRequests(),
        getLibraryTransactions(),
        getLibraryReservations(),
        getLibraryNotifications(),
      ]);
      const [
        catalogResult,
        finesResult,
        requestsResult,
        transactionsResult,
        reservationsResult,
        notificationsResult,
      ] = results;

      let successCount = 0;
      let firstFailure: unknown;

      if (catalogResult.status === "fulfilled") {
        successCount += 1;
        setBooks(catalogResult.value.map(addMockCoverUrl));
      } else {
        if (firstFailure === undefined) firstFailure = catalogResult.reason;
        console.error("[Library] Failed to load catalog from the live API:", catalogResult.reason);
      }
      if (finesResult.status === "fulfilled") {
        successCount += 1;
        setFines(finesResult.value);
      } else {
        if (firstFailure === undefined) firstFailure = finesResult.reason;
        console.error("[Library] Failed to load fines from the live API:", finesResult.reason);
      }
      if (requestsResult.status === "fulfilled") {
        successCount += 1;
        setBorrowingRequests(requestsResult.value);
      } else {
        if (firstFailure === undefined) firstFailure = requestsResult.reason;
        console.error(
          "[Library] Failed to load borrowing requests from the live API:",
          requestsResult.reason
        );
      }
      if (transactionsResult.status === "fulfilled") {
        successCount += 1;
        setTransactions(transactionsResult.value);
      } else {
        if (firstFailure === undefined) firstFailure = transactionsResult.reason;
        console.error(
          "[Library] Failed to load transactions from the live API:",
          transactionsResult.reason
        );
      }
      if (reservationsResult.status === "fulfilled") {
        successCount += 1;
        setReservations(reservationsResult.value);
      } else {
        if (firstFailure === undefined) firstFailure = reservationsResult.reason;
        console.error(
          "[Library] Failed to load reservations from the live API:",
          reservationsResult.reason
        );
      }
      if (notificationsResult.status === "fulfilled") {
        successCount += 1;
        setNotifications(notificationsResult.value);
      } else {
        if (firstFailure === undefined) firstFailure = notificationsResult.reason;
        console.error(
          "[Library] Failed to load notifications from the live API:",
          notificationsResult.reason
        );
      }

      // Any successful slice proves the service is reachable; only a wholly
      // failed batch degrades the store to "error".
      if (successCount === 0) {
        setLoadState("error");
        setLoadError(
          firstFailure instanceof Error && firstFailure.message
            ? firstFailure.message
            : "The library service did not return any data."
        );
        return;
      }
      setLoadState("ready");
      setLoadError(undefined);
    },
    []
  );

  // Explicit retry (surfaced by the shell banner) shows the loading state;
  // mutation-triggered refreshes keep the current status to avoid flashing.
  const refreshData = useCallback(async () => {
    await refreshLiveLibraryData({ showLoading: true });
  }, [refreshLiveLibraryData]);

  useEffect(() => {
    // Authenticated endpoints must never fire from the public login page.
    if (!API_CONFIG.useLiveApi || !isAuthenticated) return;
    let active = true;
    const loadLibraryData = async () => {
      await refreshLiveLibraryData({ showLoading: true });
    };
    void loadLibraryData();
    const reloadFines = () => {
      if (document.visibilityState !== "visible") return;
      getLibraryFines()
        .then((liveFines) => {
          if (active) setFines(liveFines);
        })
        .catch((error: unknown) => {
          console.error("[Library] Failed to refresh fines from the live API:", error);
        });
    };
    window.addEventListener("focus", reloadFines);
    document.addEventListener("visibilitychange", reloadFines);
    return () => {
      active = false;
      window.removeEventListener("focus", reloadFines);
      document.removeEventListener("visibilitychange", reloadFines);
    };
  }, [refreshLiveLibraryData, isAuthenticated]);

  // Drop cached live records on sign-out so a different account never sees
  // the previous session's data.
  useEffect(() => {
    if (!API_CONFIG.useLiveApi || isAuthenticated) return;
    setBooks([]);
    setBorrowingRequests([]);
    setTransactions([]);
    setReservations([]);
    setFines([]);
    setNotifications([]);
    // A signed-out store has not attempted a load yet; drop any stale status.
    setLoadState("loading");
    setLoadError(undefined);
  }, [isAuthenticated]);

  useEffect(() => {
    if (API_CONFIG.useLiveApi) return;

    const syncStoredValue = (key: string, value: string | null) => {
      try {
        switch (key) {
          case STORAGE_KEYS.BOOKS:
            setBooks(
              value
                ? mergeStoredBooksWithCatalog(JSON.parse(value) as LibraryBook[])
                : LIBRARY_BOOKS.map(addMockCoverUrl)
            );
            break;
          case STORAGE_KEYS.REQUESTS:
            setBorrowingRequests(
              value
                ? (JSON.parse(value) as BorrowingRequest[])
                : INITIAL_BORROWING_REQUESTS
            );
            break;
          case STORAGE_KEYS.TRANSACTIONS:
            setTransactions(
              value
                ? (JSON.parse(value) as BorrowingTransaction[])
                : BORROWING_TRANSACTIONS
            );
            break;
          case STORAGE_KEYS.RESERVATIONS:
            setReservations(
              value
                ? (JSON.parse(value) as ReservationRecord[])
                : RESERVATIONS
            );
            break;
          case STORAGE_KEYS.FINES:
            setFines(
              value
                ? (JSON.parse(value) as OverdueFineRecord[])
                : OVERDUE_FINES
            );
            break;
          case STORAGE_KEYS.NOTIFICATIONS:
            setNotifications(
              value
                ? (JSON.parse(value) as StudentNotificationItem[])
                : INITIAL_NOTIFICATIONS
            );
            break;
        }
      } catch (error) {
        console.error(`[Library] Failed to sync stored data for ${key}:`, error);
      }
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.storageArea !== window.localStorage) return;

      if (event.key === null) {
        Object.values(STORAGE_KEYS).forEach((key) =>
          syncStoredValue(key, window.localStorage.getItem(key))
        );
        return;
      }

      syncStoredValue(event.key, event.newValue);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    const findCover = (isbn: string, title: string) => {
      const byIsbn = books.find((book) => book.isbn === isbn);
      const matchingBook =
        byIsbn ??
        books.find(
          (book) =>
            book.title.trim().toLowerCase() === title.trim().toLowerCase()
        );
      return matchingBook ? matchingBook.cover_url ?? null : undefined;
    };
    setBorrowingRequests((previous) =>
      previous.map((request) => {
        const cover = findCover(request.isbn, request.bookTitle);
        return cover === undefined || cover === request.cover_url
          ? request
          : { ...request, cover_url: cover };
      })
    );
    setTransactions((previous) =>
      previous.map((transaction) => {
        const cover = findCover(transaction.isbn, transaction.bookTitle);
        return cover === undefined || cover === transaction.cover_url
          ? transaction
          : { ...transaction, cover_url: cover };
      })
    );
    setReservations((previous) =>
      previous.map((reservation) => {
        const cover = findCover(reservation.isbn, reservation.bookTitle);
        return cover === undefined || cover === reservation.cover_url
          ? reservation
          : { ...reservation, cover_url: cover };
      })
    );
  }, [books]);

  // Sync state changes to localStorage (mock demo mode only; live data must
  // not be mirrored locally or deleted rows can resurrect from stale cache).
  useEffect(() => {
    if (API_CONFIG.useLiveApi) return;
    try {
      window.localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
    } catch {}
  }, [books]);

  useEffect(() => {
    if (API_CONFIG.useLiveApi) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.REQUESTS,
        JSON.stringify(borrowingRequests)
      );
    } catch {}
  }, [borrowingRequests]);

  useEffect(() => {
    if (API_CONFIG.useLiveApi) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.TRANSACTIONS,
        JSON.stringify(transactions)
      );
    } catch {}
  }, [transactions]);

  useEffect(() => {
    if (API_CONFIG.useLiveApi) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.RESERVATIONS,
        JSON.stringify(reservations)
      );
    } catch {}
  }, [reservations]);

  useEffect(() => {
    if (API_CONFIG.useLiveApi) return;
    try {
      window.localStorage.setItem(STORAGE_KEYS.FINES, JSON.stringify(fines));
    } catch {}
  }, [fines]);

  useEffect(() => {
    if (API_CONFIG.useLiveApi) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.NOTIFICATIONS,
        JSON.stringify(notifications)
      );
    } catch {}
  }, [notifications]);

  // Submit a Borrow Request
  const upsertBook = useCallback((book: LibraryBook) => {
    setBooks((previous) => {
      const exists = previous.some((item) => item.id === book.id);
      return exists
        ? previous.map((item) => (item.id === book.id ? book : item))
        : [book, ...previous];
    });
  }, []);

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
        cover_url: book.cover_url ?? null,
        category: book.category,
        studentId,
        studentName: user.name,
        programCode: user.programCode || "BSIT",
        requestDate: new Date().toISOString(),
        status: "Pending",
      };

      if (API_CONFIG.useLiveApi) {
        try {
          const createdRequest = await createLiveLibraryRequest({
            bookId: book.id,
            bookTitle: book.title,
            author: book.author,
            isbn: book.isbn,
            category: book.category,
            programCode: user.programCode || "BSIT",
          });
          setBorrowingRequests((prev) => [createdRequest, ...prev]);
        } catch (error) {
          return {
            ok: false,
            message:
              error instanceof Error
                ? error.message
                : "Failed to submit borrowing request.",
          };
        }
      } else {
        setBorrowingRequests((prev) => [newRequest, ...prev]);
      }

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
      if (API_CONFIG.useLiveApi) {
        try {
          const result = await cancelLibraryRequest(requestId);
          await refreshLiveLibraryData();
          return { ok: result.success, message: result.message };
        } catch (error) {
          return {
            ok: false,
            message: error instanceof Error ? error.message : "Failed to cancel request.",
          };
        }
      }
      setBorrowingRequests((prev) =>
        prev.map((r) =>
          r.id === requestId && r.status === "Pending"
            ? { ...r, status: "Cancelled" }
            : r
        )
      );
      return { ok: true, message: "Borrowing request cancelled." };
    },
    [refreshLiveLibraryData]
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
        cover_url: book.cover_url ?? null,
        studentId,
        studentName: user.name,
        programCode: user.programCode || "BSIT",
        reservedDate: new Date().toISOString(),
        expiryDate: expiry.toISOString(),
        status: "Pending",
      };

      if (API_CONFIG.useLiveApi) {
        try {
          const reservation = await createLibraryReservation(bookId);
          setReservations((prev) => [reservation, ...prev]);
        } catch (error) {
          return {
            ok: false,
            message:
              error instanceof Error ? error.message : "Failed to place reservation.",
          };
        }
      } else {
        setReservations((prev) => [newReservation, ...prev]);
      }

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
      if (API_CONFIG.useLiveApi) {
        try {
          const result = await cancelLibraryReservation(reservationId);
          await refreshLiveLibraryData();
          return { ok: result.success, message: result.message };
        } catch (error) {
          return {
            ok: false,
            message:
              error instanceof Error ? error.message : "Failed to cancel reservation.",
          };
        }
      }
      setReservations((prev) =>
        prev.map((r) =>
          r.id === reservationId ? { ...r, status: "Cancelled" } : r
        )
      );
      return { ok: true, message: "Reservation cancelled." };
    },
    [refreshLiveLibraryData]
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

      if (API_CONFIG.useLiveApi) {
        try {
          const result = await approveLibraryRequest(requestId);
          await refreshLiveLibraryData();
          return { ok: result.success, message: result.message };
        } catch (error) {
          return {
            ok: false,
            message: error instanceof Error ? error.message : "Failed to approve request.",
          };
        }
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
        cover_url: book.cover_url ?? null,
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
    [books, borrowingRequests, refreshLiveLibraryData]
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

      if (API_CONFIG.useLiveApi) {
        try {
          const result = await rejectLibraryRequest(requestId, reason);
          await refreshLiveLibraryData();
          return { ok: result.success, message: result.message };
        } catch (error) {
          return {
            ok: false,
            message: error instanceof Error ? error.message : "Failed to reject request.",
          };
        }
      }

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
    [borrowingRequests, refreshLiveLibraryData]
  );

  // Admin confirms return of a book
  const confirmBookReturn = useCallback(
    async (
      transactionId: string
    ): Promise<{ ok: boolean; fineAccrued: number; message: string }> => {
      const tx = transactions.find((t) => t.id === transactionId);
      if (!tx) return { ok: false, fineAccrued: 0, message: "Transaction not found." };

      if (API_CONFIG.useLiveApi) {
        try {
          const result = await returnLibraryTransaction(transactionId);
          await refreshLiveLibraryData();
          return {
            ok: result.success,
            fineAccrued: result.fineAccrued,
            message: result.message,
          };
        } catch (error) {
          return {
            ok: false,
            fineAccrued: 0,
            message:
              error instanceof Error ? error.message : "Failed to confirm return.",
          };
        }
      }

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
    [refreshLiveLibraryData, transactions]
  );

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    if (API_CONFIG.useLiveApi) {
      void markLiveLibraryNotificationRead(id).catch((error: unknown) => {
        console.error("[Library] Failed to mark notification as read:", error);
      });
    }
  }, []);

  const markAllNotificationsRead = useCallback((studentId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.studentId === studentId ? { ...n, read: true } : n))
    );
    if (API_CONFIG.useLiveApi) {
      void markAllLiveLibraryNotificationsRead().catch((error: unknown) => {
        console.error("[Library] Failed to mark notifications as read:", error);
      });
    }
  }, []);

  const settleFine = useCallback(
    async (fineId: string): Promise<{ ok: boolean; message: string }> => {
      const fine = fines.find((item) => item.id === fineId);
      if (!fine) return { ok: false, message: "Fine record not found." };
      if (fine.paymentStatus === "Paid") {
        return { ok: true, message: "Fine is already paid." };
      }

      // Never fake a payment against the demo store: no live endpoint means
      // there is nowhere to persist the settlement.
      if (!API_CONFIG.useLiveApi) {
        return {
          ok: false,
          message:
            "Demo mode cannot record fine payments. Connect the live API to settle fines at the circulation desk.",
        };
      }

      try {
        const result = await payLibraryFine(fineId);
        if (!result.success) {
          return { ok: false, message: result.message || "Unable to record fine payment." };
        }
        setFines((current) =>
          current.map((item) =>
            item.id === fineId ? { ...item, paymentStatus: "Paid" } : item
          )
        );
        return { ok: true, message: result.message };
      } catch (error) {
        return {
          ok: false,
          message:
            error instanceof Error ? error.message : "Unable to record fine payment.",
        };
      }
    },
    [fines]
  );

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
        loadState,
        loadError,
        refreshData,
        books,
        upsertBook,
        borrowingRequests,
        transactions,
        reservations,
        fines,
        settleFine,
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
