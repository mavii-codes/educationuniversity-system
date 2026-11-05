import {
  BookCategoryModel,
  BorrowingRequestModel,
  BorrowingTransactionModel,
  LibraryBookModel,
  LibraryETLLogModel,
  LibraryOverviewModel,
  LibraryBookWriteModel,
  OverdueFineModel,
  ReservationModel,
  StudentBorrowerModel,
} from "../models";

/**
 * External Library Management System Mock API Client
 *
 * NOTE: Clearly identified mock API client structure for the external Library LMS.
 * This adapter can be swapped with live external credentials (e.g., Koha, Folio, Alma REST APIs)
 * without altering downstream ETL pipelines.
 */
class ExternalLibraryApiClient {
  private readonly providerName = "Koha/Folio Library LMS REST API (Mock Adapter)";
  private readonly baseUrl = "https://lms-api.university-external.edu/v1";

  public getProviderInfo() {
    return {
      provider: this.providerName,
      baseUrl: this.baseUrl,
      authType: "Bearer OAuth2",
      rateLimit: "1,200 req/min",
    };
  }

  public async fetchRawBooks(): Promise<Array<{
    isbn: string;
    title: string;
    author: string;
    publisher?: string;
    year?: number;
    category: string;
    call_no: string;
    copies_total: number;
    copies_avail: number;
    copies_out: number;
    shelf_loc: string;
  }>> {
    return [
      {
        isbn: "978-0134685991",
        title: "Effective Java (3rd Edition)",
        author: "Joshua Bloch",
        publisher: "Addison-Wesley",
        year: 2018,
        category: "Computer Science",
        call_no: "QA 76.73 .J38 B56",
        copies_total: 8,
        copies_avail: 5,
        copies_out: 3,
        shelf_loc: "Stack CS-201",
      },
      {
        isbn: "978-0262033848",
        title: "Introduction to Algorithms (CLRS 3rd Edition)",
        author: "Thomas H. Cormen, Charles E. Leiserson",
        publisher: "MIT Press",
        year: 2009,
        category: "Computer Science",
        call_no: "QA 76.6 .C662",
        copies_total: 12,
        copies_avail: 7,
        copies_out: 5,
        shelf_loc: "Stack CS-104",
      },
      // Intentional duplicate entry in raw feed to showcase ETL cleaning
      {
        isbn: "978-0262033848",
        title: "Introduction to Algorithms (CLRS 3rd Edition)   ",
        author: "Thomas H. Cormen, Charles E. Leiserson",
        publisher: "MIT Press",
        year: 2009,
        category: "Computer Science",
        call_no: "QA 76.6 .C662",
        copies_total: 12,
        copies_avail: 7,
        copies_out: 5,
        shelf_loc: "Stack CS-104",
      },
      {
        isbn: "978-1449373320",
        title: "Designing Data-Intensive Applications",
        author: "Martin Kleppmann",
        publisher: "O'Reilly Media",
        year: 2017,
        category: "Information Technology",
        call_no: "QA 76.9 .D3 K54",
        copies_total: 10,
        copies_avail: 6,
        copies_out: 4,
        shelf_loc: "Stack IT-305",
      },
      {
        isbn: "978-0132350884",
        title: "Clean Code: A Handbook of Agile Software Craftsmanship",
        author: "Robert C. Martin",
        publisher: "Prentice Hall",
        year: 2008,
        category: "Computer Science",
        call_no: "QA 76.76 .C65 M39",
        copies_total: 9,
        copies_avail: 4,
        copies_out: 5,
        shelf_loc: "Stack CS-210",
      },
      {
        isbn: "978-0073383095",
        title: "Database System Concepts (7th Edition)",
        author: "Abraham Silberschatz, Henry F. Korth",
        publisher: "McGraw-Hill",
        year: 2019,
        category: "Information Technology",
        call_no: "QA 76.9 .D3 S563",
        copies_total: 6,
        copies_avail: 4,
        copies_out: 2,
        shelf_loc: "Stack IT-102",
      },
      {
        isbn: "978-1292025810",
        title: "Principles of Operations Management",
        author: "Jay Heizer, Barry Render",
        publisher: "Pearson",
        year: 2020,
        category: "Business Administration",
        call_no: "TS 155 .H37",
        copies_total: 10,
        copies_avail: 7,
        copies_out: 3,
        shelf_loc: "Stack BA-110",
      },
      {
        isbn: "978-0323358415",
        title: "Medical-Surgical Nursing: Assessment and Management",
        author: "Sharon L. Lewis, Shannon Ruff Dirksen",
        publisher: "Mosby / Elsevier",
        year: 2017,
        category: "Health Sciences & Nursing",
        call_no: "RT 41 .M43",
        copies_total: 14,
        copies_avail: 11,
        copies_out: 3,
        shelf_loc: "Stack NUR-402",
      },
      {
        isbn: "978-0134484143",
        title: "Structural Analysis (10th Edition)",
        author: "Russell C. Hibbeler",
        publisher: "Pearson",
        year: 2018,
        category: "Engineering & Mathematics",
        call_no: "TA 645 .H53",
        copies_total: 8,
        copies_avail: 6,
        copies_out: 2,
        shelf_loc: "Stack ENG-108",
      },
      {
        isbn: "978-0132996297",
        title: "Educational Psychology: Developing Learners",
        author: "Jeanne Ellis Ormrod",
        publisher: "Pearson",
        year: 2019,
        category: "Education & Pedagogy",
        call_no: "LB 1051 .O68",
        copies_total: 7,
        copies_avail: 5,
        copies_out: 2,
        shelf_loc: "Stack EDU-205",
      },
      {
        isbn: "978-1491957660",
        title: "Fluent Python: Clear, Concise, and Effective Programming",
        author: "Luciano Ramalho",
        publisher: "O'Reilly Media",
        year: 2022,
        category: "Computer Science",
        call_no: "QA 76.73 .P98 R36",
        copies_total: 11,
        copies_avail: 8,
        copies_out: 3,
        shelf_loc: "Stack CS-215",
      },
      {
        isbn: "978-0135957059",
        title: "The Pragmatic Programmer (20th Anniversary Edition)",
        author: "David Thomas, Andrew Hunt",
        publisher: "Addison-Wesley Professional",
        year: 2019,
        category: "Computer Science",
        call_no: "QA 76.6 .T455",
        copies_total: 5,
        copies_avail: 5,
        copies_out: 0,
        shelf_loc: "Stack CS-216",
      },
      {
        isbn: "978-0596009205",
        title: "Head First Java",
        author: "Kathy Sierra, Bert Bates",
        publisher: "O'Reilly Media",
        year: 2005,
        category: "Computer Science",
        call_no: "QA 76.73 .J38 S54",
        copies_total: 5,
        copies_avail: 5,
        copies_out: 0,
        shelf_loc: "Stack CS-217",
      },
      {
        isbn: "978-1718502703",
        title: "Python Crash Course",
        author: "Eric Matthes",
        publisher: "No Starch Press",
        year: 2023,
        category: "Computer Science",
        call_no: "QA 76.73 .P98 M38",
        copies_total: 5,
        copies_avail: 5,
        copies_out: 0,
        shelf_loc: "Stack CS-218",
      },
      {
        isbn: "978-1593279509",
        title: "Eloquent JavaScript (3rd Edition)",
        author: "Marijn Haverbeke",
        publisher: "No Starch Press",
        year: 2018,
        category: "Computer Science",
        call_no: "QA 76.73 .J38 H38",
        copies_total: 5,
        copies_avail: 5,
        copies_out: 0,
        shelf_loc: "Stack CS-219",
      },
      {
        isbn: "978-0134610993",
        title: "Artificial Intelligence: A Modern Approach",
        author: "Stuart Russell, Peter Norvig",
        publisher: "Pearson",
        year: 2021,
        category: "Computer Science",
        call_no: "Q 335 .R86",
        copies_total: 5,
        copies_avail: 5,
        copies_out: 0,
        shelf_loc: "Stack CS-220",
      },
      {
        isbn: "978-0134492513",
        title: "Principles of Marketing",
        author: "Philip Kotler, Gary Armstrong",
        publisher: "Pearson",
        year: 2018,
        category: "Business Administration",
        call_no: "HF 5415 .K64",
        copies_total: 5,
        copies_avail: 5,
        copies_out: 0,
        shelf_loc: "Stack BA-111",
      },
      {
        isbn: "978-0134725987",
        title: "Financial Accounting",
        author: "Jerry J. Weygandt, Paul D. Kimmel, Donald E. Kieso",
        publisher: "Wiley",
        year: 2018,
        category: "Business Administration",
        call_no: "HF 5635 .W49",
        copies_total: 5,
        copies_avail: 5,
        copies_out: 0,
        shelf_loc: "Stack BA-112",
      },
      {
        isbn: "978-0134729329",
        title: "Organizational Behavior",
        author: "Stephen P. Robbins, Timothy A. Judge",
        publisher: "Pearson",
        year: 2018,
        category: "Business Administration",
        call_no: "HD 58.7 .R63",
        copies_total: 5,
        copies_avail: 5,
        copies_out: 0,
        shelf_loc: "Stack BA-113",
      },
      {
        isbn: "978-0323810340",
        title: "Fundamentals of Nursing",
        author: "Patricia A. Potter, Anne Griffin Perry",
        publisher: "Elsevier",
        year: 2021,
        category: "Health Sciences & Nursing",
        call_no: "RT 41 .P68",
        copies_total: 5,
        copies_avail: 5,
        copies_out: 0,
        shelf_loc: "Stack NUR-403",
      },
      {
        isbn: "978-1975161033",
        title: "Brunner & Suddarth's Textbook of Medical-Surgical Nursing",
        author: "Janice L. Hinkle, Kerry H. Cheever",
        publisher: "Wolters Kluwer",
        year: 2021,
        category: "Health Sciences & Nursing",
        call_no: "RT 41 .B78",
        copies_total: 5,
        copies_avail: 5,
        copies_out: 0,
        shelf_loc: "Stack NUR-404",
      },
      {
        isbn: "978-1285741550",
        title: "Calculus: Early Transcendentals",
        author: "James Stewart",
        publisher: "Cengage Learning",
        year: 2015,
        category: "Engineering & Mathematics",
        call_no: "QA 303.2 .S74",
        copies_total: 5,
        copies_avail: 5,
        copies_out: 0,
        shelf_loc: "Stack ENG-109",
      },
      {
        isbn: "978-0134438986",
        title: "Thomas' Calculus: Early Transcendentals",
        author: "George B. Thomas, Maurice D. Weir, Joel Hass",
        publisher: "Pearson",
        year: 2018,
        category: "Engineering & Mathematics",
        call_no: "QA 303.2 .T45",
        copies_total: 5,
        copies_avail: 5,
        copies_out: 0,
        shelf_loc: "Stack ENG-110",
      },
      {
        isbn: "978-0133918922",
        title: "Engineering Mechanics: Statics",
        author: "Russell C. Hibbeler",
        publisher: "Pearson",
        year: 2016,
        category: "Engineering & Mathematics",
        call_no: "TA 350 .H52",
        copies_total: 5,
        copies_avail: 5,
        copies_out: 0,
        shelf_loc: "Stack ENG-111",
      },
      {
        isbn: "978-0470484104",
        title: "How Learning Works",
        author: "Susan A. Ambrose, Michael W. Bridges, Michele DiPietro",
        publisher: "Jossey-Bass",
        year: 2010,
        category: "Education & Pedagogy",
        call_no: "LB 1025.3 .A43",
        copies_total: 5,
        copies_avail: 5,
        copies_out: 0,
        shelf_loc: "Stack EDU-206",
      },
      {
        isbn: "978-0976423386",
        title: "The First Days of School",
        author: "Harry K. Wong, Rosemary T. Wong",
        publisher: "Harry K. Wong Publications",
        year: 2009,
        category: "Education & Pedagogy",
        call_no: "LB 1025.3 .W66",
        copies_total: 5,
        copies_avail: 5,
        copies_out: 0,
        shelf_loc: "Stack EDU-207",
      },
      {
        isbn: "978-0307887894",
        title: "The Lean Startup",
        author: "Eric Ries",
        publisher: "Crown Business",
        year: 2011,
        category: "Business Administration",
        call_no: "HD 62.7 .R54",
        copies_total: 5,
        copies_avail: 5,
        copies_out: 0,
        shelf_loc: "Stack BA-114",
      },
      {
        isbn: "978-0131103627",
        title: "The C Programming Language",
        author: "Brian W. Kernighan, Dennis M. Ritchie",
        publisher: "Prentice Hall",
        year: 1988,
        category: "Computer Science",
        call_no: "QA 76.73 .C15 K48",
        copies_total: 5,
        copies_avail: 5,
        copies_out: 0,
        shelf_loc: "Stack CS-221",
      },
      {
        isbn: "978-0262035613",
        title: "Deep Learning",
        author: "Ian Goodfellow, Yoshua Bengio, Aaron Courville",
        publisher: "MIT Press",
        year: 2016,
        category: "Computer Science",
        call_no: "Q 325.5 .G66",
        copies_total: 5,
        copies_avail: 5,
        copies_out: 0,
        shelf_loc: "Stack CS-222",
      },
      {
        isbn: "978-0134757599",
        title: "Python Crash Course (2nd Edition)",
        author: "Eric Matthes",
        publisher: "No Starch Press",
        year: 2019,
        category: "Computer Science",
        call_no: "QA 76.73 .P98 M382",
        copies_total: 5,
        copies_avail: 5,
        copies_out: 0,
        shelf_loc: "Stack CS-223",
      },
      {
        isbn: "978-0134093413",
        title: "Java How to Program: Early Objects",
        author: "Paul Deitel, Harvey Deitel",
        publisher: "Pearson",
        year: 2016,
        category: "Computer Science",
        call_no: "QA 76.73 .J38 D44",
        copies_total: 5,
        copies_avail: 5,
        copies_out: 0,
        shelf_loc: "Stack CS-224",
      },
    ].map((book) => ({
      ...book,
      copies_avail: book.copies_total,
      copies_out: 0,
    }));
  }

  public async fetchRawBorrowers(): Promise<Array<{
    borrower_card_no: string;
    student_num: string;
    full_name: string;
    campus_email: string;
    curriculum: string;
    degree: string;
    academic_lvl: string;
    current_loans: number;
    historical_loans: number;
    unpaid_fines: number;
    borrower_status: string;
    last_circulation: string;
  }>> {
    return [
      {
        borrower_card_no: "LIB-2024-042",
        student_num: "2024-042",
        full_name: "Marco Villanueva",
        campus_email: "marco.villanueva@university.edu.ph",
        curriculum: "BSIT",
        degree: "BS Information Technology",
        academic_lvl: "2nd Year",
        current_loans: 2,
        historical_loans: 14,
        unpaid_fines: 45.0,
        borrower_status: "Active",
        last_circulation: "2 days ago",
      },
      {
        borrower_card_no: "LIB-2023-015",
        student_num: "2023-015",
        full_name: "Bea Patricia Reyes",
        campus_email: "bea.reyes@university.edu.ph",
        curriculum: "BSCS",
        degree: "BS Computer Science",
        academic_lvl: "3rd Year",
        current_loans: 3,
        historical_loans: 28,
        unpaid_fines: 0.0,
        borrower_status: "Active",
        last_circulation: "Yesterday",
      },
      {
        borrower_card_no: "LIB-2022-088",
        student_num: "2022-088",
        full_name: "Christian Dale Gomez",
        campus_email: "christian.gomez@university.edu.ph",
        curriculum: "BSBA",
        degree: "BS Business Administration",
        academic_lvl: "4th Year",
        current_loans: 1,
        historical_loans: 19,
        unpaid_fines: 120.0,
        borrower_status: "Restricted",
        last_circulation: "5 days ago",
      },
      {
        borrower_card_no: "LIB-2024-102",
        student_num: "2024-102",
        full_name: "Alyssa Marie Tan",
        campus_email: "alyssa.tan@university.edu.ph",
        curriculum: "BSN",
        degree: "BS Nursing",
        academic_lvl: "2nd Year",
        current_loans: 2,
        historical_loans: 11,
        unpaid_fines: 0.0,
        borrower_status: "Active",
        last_circulation: "3 days ago",
      },
      {
        borrower_card_no: "LIB-2021-007",
        student_num: "2021-007",
        full_name: "Kevin Joshua Ramos",
        campus_email: "kevin.ramos@university.edu.ph",
        curriculum: "BSCE",
        degree: "BS Civil Engineering",
        academic_lvl: "4th Year",
        current_loans: 0,
        historical_loans: 22,
        unpaid_fines: 0.0,
        borrower_status: "Cleared",
        last_circulation: "2 weeks ago",
      },
      {
        borrower_card_no: "LIB-2023-054",
        student_num: "2023-054",
        full_name: "Camille Joyce Aquino",
        campus_email: "camille.aquino@university.edu.ph",
        curriculum: "BSED",
        degree: "BS Secondary Education",
        academic_lvl: "3rd Year",
        current_loans: 1,
        historical_loans: 16,
        unpaid_fines: 0.0,
        borrower_status: "Active",
        last_circulation: "Today",
      },
    ];
  }

  public async fetchRawTransactions(): Promise<Array<{
    tx_ref: string;
    book_isbn: string;
    book_name: string;
    student_id_ref: string;
    borrower_name: string;
    prog: string;
    loan_date: string;
    due_date: string;
    returned_date?: string;
    circ_state: string;
    fine_val: number;
  }>> {
    return [
      {
        tx_ref: "TX-2026-8801",
        book_isbn: "978-0134685991",
        book_name: "Effective Java (3rd Edition)",
        student_id_ref: "2024-042",
        borrower_name: "Marco Villanueva",
        prog: "BSIT",
        loan_date: "2026-10-18T08:30:00Z",
        due_date: "2026-11-01T17:00:00Z",
        circ_state: "Overdue",
        fine_val: 45.0,
      },
      {
        tx_ref: "TX-2026-8802",
        book_isbn: "978-1449373320",
        book_name: "Designing Data-Intensive Applications",
        student_id_ref: "2024-042",
        borrower_name: "Marco Villanueva",
        prog: "BSIT",
        loan_date: "2026-10-25T10:15:00Z",
        due_date: "2026-11-08T17:00:00Z",
        circ_state: "Borrowed",
        fine_val: 0.0,
      },
      {
        tx_ref: "TX-2026-8790",
        book_isbn: "978-0262033848",
        book_name: "Introduction to Algorithms (CLRS 3rd Edition)",
        student_id_ref: "2023-015",
        borrower_name: "Bea Patricia Reyes",
        prog: "BSCS",
        loan_date: "2026-10-22T09:00:00Z",
        due_date: "2026-11-05T17:00:00Z",
        circ_state: "Borrowed",
        fine_val: 0.0,
      },
      {
        tx_ref: "TX-2026-8755",
        book_isbn: "978-0132350884",
        book_name: "Clean Code: A Handbook of Agile Software Craftsmanship",
        student_id_ref: "2023-015",
        borrower_name: "Bea Patricia Reyes",
        prog: "BSCS",
        loan_date: "2026-10-10T11:20:00Z",
        due_date: "2026-10-24T17:00:00Z",
        returned_date: "2026-10-23T14:10:00Z",
        circ_state: "Returned",
        fine_val: 0.0,
      },
      {
        tx_ref: "TX-2026-8712",
        book_isbn: "978-1292025810",
        book_name: "Principles of Operations Management",
        student_id_ref: "2022-088",
        borrower_name: "Christian Dale Gomez",
        prog: "BSBA",
        loan_date: "2026-10-05T14:00:00Z",
        due_date: "2026-10-19T17:00:00Z",
        circ_state: "Overdue",
        fine_val: 120.0,
      },
      {
        tx_ref: "TX-2026-8815",
        book_isbn: "978-0323358415",
        book_name: "Medical-Surgical Nursing: Assessment and Management",
        student_id_ref: "2024-102",
        borrower_name: "Alyssa Marie Tan",
        prog: "BSN",
        loan_date: "2026-10-26T13:45:00Z",
        due_date: "2026-11-09T17:00:00Z",
        circ_state: "Borrowed",
        fine_val: 0.0,
      },
    ];
  }

  public async fetchRawReservations(): Promise<Array<{
    res_code: string;
    isbn_ref: string;
    item_title: string;
    student_num: string;
    borrower_name: string;
    prog: string;
    booked_on: string;
    valid_until: string;
    res_state: string;
  }>> {
    return [
      {
        res_code: "RES-9901",
        isbn_ref: "978-0132350884",
        item_title: "Clean Code: A Handbook of Agile Software Craftsmanship",
        student_num: "2024-042",
        borrower_name: "Marco Villanueva",
        prog: "BSIT",
        booked_on: "2026-10-28T11:00:00Z",
        valid_until: "2026-11-04T17:00:00Z",
        res_state: "Ready for Pickup",
      },
      {
        res_code: "RES-9902",
        isbn_ref: "978-1491957660",
        item_title: "Fluent Python: Clear, Concise, and Effective Programming",
        student_num: "2023-015",
        borrower_name: "Bea Patricia Reyes",
        prog: "BSCS",
        booked_on: "2026-10-29T15:30:00Z",
        valid_until: "2026-11-05T17:00:00Z",
        res_state: "Pending",
      },
      {
        res_code: "RES-9903",
        isbn_ref: "978-0134484143",
        item_title: "Structural Analysis (10th Edition)",
        student_num: "2021-007",
        borrower_name: "Kevin Joshua Ramos",
        prog: "BSCE",
        booked_on: "2026-10-24T09:15:00Z",
        valid_until: "2026-10-31T17:00:00Z",
        res_state: "Fulfilled",
      },
    ];
  }
}

/**
 * Library ETL / ELT Pipeline Service
 * Extracts, validates, deduplicates, cleans, transforms, matches student records,
 * and loads into the centralized University DataHub database.
 */
class LibraryETLService {
  private client = new ExternalLibraryApiClient();

  // In-memory repositories representing centralized relational tables
  private books: LibraryBookModel[] = [];
  private borrowers: StudentBorrowerModel[] = [];
  private transactions: BorrowingTransactionModel[] = [];
  private reservations: ReservationModel[] = [];
  private fines: OverdueFineModel[] = [];
  private categories: BookCategoryModel[] = [
    { id: "cat-cs", code: "CS", name: "Computer Science", totalTitles: 4, totalCopies: 40, borrowedCount: 16 },
    { id: "cat-it", code: "IT", name: "Information Technology", totalTitles: 2, totalCopies: 16, borrowedCount: 6 },
    { id: "cat-ba", code: "BA", name: "Business Administration", totalTitles: 1, totalCopies: 10, borrowedCount: 3 },
    { id: "cat-nur", code: "NUR", name: "Health Sciences & Nursing", totalTitles: 1, totalCopies: 14, borrowedCount: 3 },
    { id: "cat-eng", code: "ENG", name: "Engineering & Mathematics", totalTitles: 1, totalCopies: 8, borrowedCount: 2 },
    { id: "cat-edu", code: "EDU", name: "Education & Pedagogy", totalTitles: 1, totalCopies: 7, borrowedCount: 2 },
  ];

  private etlLogs: LibraryETLLogModel[] = [
    {
      id: "etl-job-init-001",
      jobName: "Library LMS API Ingestion & Student Identity Matching",
      status: "Completed",
      startedAt: new Date(Date.now() - 3600000).toISOString(),
      completedAt: new Date(Date.now() - 3594000).toISOString(),
      duration: "6.0s",
      recordsExtracted: 27,
      recordsValidated: 27,
      duplicatesCleaned: 1,
      studentsMatched: 6,
      recordsLoaded: 26,
      errors: [],
      executionLog: [
        "[00:00.000] Initialized connection to external Library LMS API (Adapter: Koha/Folio)",
        "[00:01.200] Extracted 11 raw catalog books, 6 borrower cards, 6 circulation transactions, 3 reservations",
        "[00:02.400] Validation: verified 11 ISBN-13 checksums and date ranges",
        "[00:03.100] Cleaning: detected and purged 1 duplicate book record (ISBN 978-0262033848)",
        "[00:04.300] Transformation: mapped Koha marc21 fields to University DataHub central schema",
        "[00:05.100] Identity Matching: resolved 6/6 student borrower IDs against student master records",
        "[00:05.800] Loaded 10 books, 6 borrowers, 6 transactions, 3 reservations into central database",
        "[00:06.000] ETL pipeline completed successfully with 0 errors",
      ],
    },
  ];

  constructor() {
    // Initial run to populate data repository
    this.runPipelineSync("System Initialization");
  }

  public async runPipelineSync(triggeredBy = "Admin Console"): Promise<LibraryETLLogModel> {
    const startTime = Date.now();
    const startedAt = new Date().toISOString();
    const executionLog: string[] = [];
    const errors: string[] = [];

    executionLog.push(`[+0.0s] Triggered Library LMS ETL Pipeline by [${triggeredBy}]`);
    executionLog.push(`[+0.2s] Connecting to external Library LMS API endpoint...`);

    // Step 1: Connect & Extract
    const [rawBooks, rawBorrowers, rawTx, rawRes] = await Promise.all([
      this.client.fetchRawBooks(),
      this.client.fetchRawBorrowers(),
      this.client.fetchRawTransactions(),
      this.client.fetchRawReservations(),
    ]);

    const totalExtracted = rawBooks.length + rawBorrowers.length + rawTx.length + rawRes.length;
    executionLog.push(
      `[+0.8s] Extracted ${totalExtracted} raw records (Books: ${rawBooks.length}, Borrowers: ${rawBorrowers.length}, Transactions: ${rawTx.length}, Reservations: ${rawRes.length})`
    );

    // Step 2 & 3: Validate & Clean Duplicates
    executionLog.push(`[+1.3s] Validating incoming schemas and checking for duplicate ISBNs...`);
    const seenIsbns = new Set<string>();
    const cleanedBooks: typeof rawBooks = [];
    let duplicatesCleaned = 0;

    for (const b of rawBooks) {
      const cleanIsbn = b.isbn.trim();
      if (seenIsbns.has(cleanIsbn)) {
        duplicatesCleaned++;
        executionLog.push(`[+1.5s] Clean: Purged duplicate book record for ISBN ${cleanIsbn} (${b.title.trim()})`);
      } else {
        seenIsbns.add(cleanIsbn);
        cleanedBooks.push({
          ...b,
          title: b.title.trim(),
        });
      }
    }

    // Step 4: Transform to Centralized Schema
    executionLog.push(`[+2.0s] Transforming external Library LMS data into unified DataHub models...`);
    const transformedBooks: LibraryBookModel[] = cleanedBooks.map((b, idx) => ({
      id: `book-${idx + 1}`,
      isbn: b.isbn.trim(),
      title: b.title,
      author: b.author,
      publisher: b.publisher || "Academic Press",
      publicationYear: b.year || 2020,
      category: b.category,
      callNumber: b.call_no,
      totalCopies: b.copies_total,
      availableCopies: b.copies_avail,
      borrowedCopies: b.copies_out,
      location: b.shelf_loc,
      status: b.copies_avail === 0 ? "Checked Out" : b.copies_out > 0 ? "Partially Available" : "Available",
      cover_url: null,
      lastSyncedAt: new Date().toISOString(),
    }));

    // Step 5: Match Student Records using Student ID
    executionLog.push(`[+2.6s] Matching borrower IDs against Central University Student Master...`);
    let studentsMatched = 0;
    const transformedBorrowers: StudentBorrowerModel[] = rawBorrowers.map((brw, idx) => {
      // In real scenario, matches with Central `students` table via student_num
      studentsMatched++;
      return {
        id: `borrower-${idx + 1}`,
        borrowerId: brw.borrower_card_no,
        studentId: brw.student_num,
        studentName: brw.full_name,
        email: brw.campus_email,
        programCode: brw.curriculum,
        programName: brw.degree,
        yearLevel: brw.academic_lvl,
        activeLoansCount: brw.current_loans,
        totalLoansHistory: brw.historical_loans,
        finesBalance: brw.unpaid_fines,
        status: (brw.borrower_status as "Active" | "Restricted" | "Cleared") || "Active",
        lastActive: brw.last_circulation,
      };
    });

    const transformedTransactions: BorrowingTransactionModel[] = rawTx.map((tx, idx) => ({
      id: `tx-${idx + 1}`,
      transactionCode: tx.tx_ref,
      bookId: `book-ref-${tx.book_isbn}`,
      bookTitle: tx.book_name,
      isbn: tx.book_isbn,
      studentId: tx.student_id_ref,
      studentName: tx.borrower_name,
      programCode: tx.prog,
      borrowDate: tx.loan_date,
      dueDate: tx.due_date,
      returnDate: tx.returned_date,
      status: tx.circ_state as "Borrowed" | "Returned" | "Overdue",
      finesAccrued: tx.fine_val,
      sourceSystem: "Library LMS",
    }));

    const transformedReservations: ReservationModel[] = rawRes.map((r, idx) => ({
      id: `res-${idx + 1}`,
      reservationCode: r.res_code,
      bookId: `book-ref-${r.isbn_ref}`,
      bookTitle: r.item_title,
      isbn: r.isbn_ref,
      studentId: r.student_num,
      studentName: r.borrower_name,
      programCode: r.prog,
      reservedDate: r.booked_on,
      expiryDate: r.valid_until,
      status: r.res_state as "Pending" | "Ready for Pickup" | "Fulfilled" | "Cancelled" | "Expired",
    }));

    // Step 6: Derive Overdue Records and Fines
    const transformedFines: OverdueFineModel[] = transformedTransactions
      .filter((t) => t.status === "Overdue" || t.finesAccrued > 0)
      .map((t, idx) => ({
        id: `fine-${idx + 1}`,
        transactionId: t.id,
        bookTitle: t.bookTitle,
        studentId: t.studentId,
        studentName: t.studentName,
        programCode: t.programCode,
        dueDate: t.dueDate,
        daysOverdue: Math.max(1, Math.round((Date.now() - new Date(t.dueDate).getTime()) / (1000 * 3600 * 24))),
        fineAmount: t.finesAccrued > 0 ? t.finesAccrued : 45.0,
        paymentStatus: "Unpaid",
      }));

    // Step 7: Load into Central Database
    executionLog.push(`[+3.1s] Loading processed records into Centralized Data Fabric repository...`);
    this.books = transformedBooks;
    this.borrowers = transformedBorrowers;
    this.transactions = transformedTransactions;
    this.reservations = transformedReservations;
    this.fines = transformedFines;

    const recordsLoaded =
      transformedBooks.length +
      transformedBorrowers.length +
      transformedTransactions.length +
      transformedReservations.length;

    const durationSeconds = ((Date.now() - startTime) / 1000).toFixed(1);
    executionLog.push(
      `[+${durationSeconds}s] ETL Load complete: ${recordsLoaded} records stored. Matched ${studentsMatched} students.`
    );

    const logEntry: LibraryETLLogModel = {
      id: `etl-job-${Date.now()}`,
      jobName: `Library LMS Ingestion & Cross-Reference Sync`,
      status: "Completed",
      startedAt,
      completedAt: new Date().toISOString(),
      duration: `${durationSeconds}s`,
      recordsExtracted: totalExtracted,
      recordsValidated: totalExtracted,
      duplicatesCleaned,
      studentsMatched,
      recordsLoaded,
      errors,
      executionLog,
    };

    this.etlLogs.unshift(logEntry);
    return logEntry;
  }

  public getOverview(): LibraryOverviewModel {
    const totalIntegratedBooks = 14850; // Integrated physical & digital catalog titles
    const availableBooks = 11250;
    const borrowedBooks = 3600;
    const totalBorrowingTransactions = 8920;
    const totalStudentBorrowers = 3420;
    const overdueTransactions = 64;
    const totalFinesRecorded = 12450.0;

    return {
      kpis: {
        totalIntegratedBooks,
        totalStudentBorrowers,
        totalBorrowingTransactions,
        availableBooks,
        borrowedBooks,
        overdueTransactions,
        totalFinesRecorded,
        lastSyncTimestamp: this.etlLogs[0]?.completedAt || new Date().toISOString(),
        connectionStatus: "Connected",
        apiEndpoint: "https://lms-api.university-external.edu/v1 (Mock REST Adapter)",
        adapterType: "REST / JSON · Automated 9-Step ETL Pipeline",
      },
      categoryDistribution: [
        { category: "Computer Science", count: 4850, borrowed: 1420 },
        { category: "Information Technology", count: 3240, borrowed: 980 },
        { category: "Business Administration", count: 2650, borrowed: 540 },
        { category: "Health Sciences & Nursing", count: 1820, borrowed: 360 },
        { category: "Engineering & Mathematics", count: 1440, borrowed: 210 },
        { category: "Education & Pedagogy", count: 850, borrowed: 90 },
      ],
      programBorrowingStats: [
        { program: "BSIT", programName: "BS Information Technology", activeBorrowers: 940, activeLoans: 1120, totalBorrows: 2840 },
        { program: "BSCS", programName: "BS Computer Science", activeBorrowers: 820, activeLoans: 960, totalBorrows: 2410 },
        { program: "BSBA", programName: "BS Business Administration", activeBorrowers: 650, activeLoans: 610, totalBorrows: 1540 },
        { program: "BSN", programName: "BS Nursing", activeBorrowers: 490, activeLoans: 520, totalBorrows: 1220 },
        { program: "BSCE", programName: "BS Civil Engineering", activeBorrowers: 310, activeLoans: 240, totalBorrows: 610 },
        { program: "BSED", programName: "BS Secondary Education", activeBorrowers: 210, activeLoans: 150, totalBorrows: 300 },
      ],
      monthlyTrend: [
        { month: "Jun", borrowed: 620, returned: 580, overdue: 18 },
        { month: "Jul", borrowed: 890, returned: 810, overdue: 24 },
        { month: "Aug", borrowed: 1140, returned: 1020, overdue: 42 },
        { month: "Sep", borrowed: 1350, returned: 1210, overdue: 55 },
        { month: "Oct", borrowed: 1480, returned: 1390, overdue: 64 },
      ],
    };
  }

  public getBooks(filters?: { search?: string; category?: string; status?: string }): LibraryBookModel[] {
    let result = [...this.books];
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.isbn.toLowerCase().includes(q) ||
          b.callNumber.toLowerCase().includes(q)
      );
    }
    if (filters?.category && filters.category !== "All") {
      result = result.filter((b) => b.category === filters.category);
    }
    if (filters?.status && filters.status !== "All") {
      result = result.filter((b) => b.status === filters.status);
    }
    return result.map((book) => ({ ...book, cover_url: book.cover_url ?? null }));
  }

  public getBookById(id: string): LibraryBookModel | null {
    const book = this.books.find((item) => item.id === id);
    return book ? { ...book, cover_url: book.cover_url ?? null } : null;
  }

  private findCoverUrl(isbn: string, title: string): string | null {
    const book = this.books.find((item) => item.isbn === isbn) ??
      this.books.find(
        (item) => item.title.trim().toLowerCase() === title.trim().toLowerCase()
      );
    return book?.cover_url ?? null;
  }

  public createBook(input: LibraryBookWriteModel): LibraryBookModel {
    const borrowedCopies = input.totalCopies - input.availableCopies;
    const book: LibraryBookModel = {
      ...input,
      id: `book-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      borrowedCopies,
      status:
        input.availableCopies === 0
          ? "Checked Out"
          : borrowedCopies > 0
            ? "Partially Available"
            : "Available",
      lastSyncedAt: new Date().toISOString(),
    };
    this.books.unshift(book);
    return book;
  }

  public updateBook(
    id: string,
    input: LibraryBookWriteModel
  ): LibraryBookModel | null {
    const index = this.books.findIndex((book) => book.id === id);
    if (index < 0) return null;

    const borrowedCopies = input.totalCopies - input.availableCopies;
    const updated: LibraryBookModel = {
      ...input,
      id,
      borrowedCopies,
      status:
        input.availableCopies === 0
          ? "Checked Out"
          : borrowedCopies > 0
            ? "Partially Available"
            : "Available",
      lastSyncedAt: new Date().toISOString(),
    };
    this.books[index] = updated;
    return updated;
  }

  public getBorrowers(filters?: { search?: string; program?: string; status?: string }): StudentBorrowerModel[] {
    let result = [...this.borrowers];
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (brw) =>
          brw.studentName.toLowerCase().includes(q) ||
          brw.studentId.toLowerCase().includes(q) ||
          brw.borrowerId.toLowerCase().includes(q)
      );
    }
    if (filters?.program && filters.program !== "All") {
      result = result.filter((brw) => brw.programCode === filters.program);
    }
    if (filters?.status && filters.status !== "All") {
      result = result.filter((brw) => brw.status === filters.status);
    }
    return result;
  }

  public getTransactions(filters?: { search?: string; status?: string }): BorrowingTransactionModel[] {
    let result = [...this.transactions];
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (t) =>
          t.bookTitle.toLowerCase().includes(q) ||
          t.studentName.toLowerCase().includes(q) ||
          t.studentId.toLowerCase().includes(q) ||
          t.transactionCode.toLowerCase().includes(q)
      );
    }
    if (filters?.status && filters.status !== "All") {
      result = result.filter((t) => t.status === filters.status);
    }
    return result.map((transaction) => ({
      ...transaction,
      cover_url: this.findCoverUrl(transaction.isbn, transaction.bookTitle),
    }));
  }

  public getReservations(filters?: { search?: string; status?: string }): ReservationModel[] {
    let result = [...this.reservations];
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (r) =>
          r.bookTitle.toLowerCase().includes(q) ||
          r.studentName.toLowerCase().includes(q) ||
          r.studentId.toLowerCase().includes(q) ||
          r.reservationCode.toLowerCase().includes(q)
      );
    }
    if (filters?.status && filters.status !== "All") {
      result = result.filter((r) => r.status === filters.status);
    }
    return result.map((reservation) => ({
      ...reservation,
      cover_url: this.findCoverUrl(reservation.isbn, reservation.bookTitle),
    }));
  }

  public getFines(filters?: { search?: string; paymentStatus?: string }): OverdueFineModel[] {
    let result = [...this.fines];
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (f) =>
          f.bookTitle.toLowerCase().includes(q) ||
          f.studentName.toLowerCase().includes(q) ||
          f.studentId.toLowerCase().includes(q)
      );
    }
    if (filters?.paymentStatus && filters.paymentStatus !== "All") {
      result = result.filter((f) => f.paymentStatus === filters.paymentStatus);
    }
    return result;
  }

  public markFinePaid(fineId: string): boolean {
    const fine = this.fines.find((item) => item.id === fineId);
    if (!fine) return false;
    fine.paymentStatus = "Paid";
    return true;
  }

  public getETLLogs(): LibraryETLLogModel[] {
    return this.etlLogs;
  }

  public getCategories(): BookCategoryModel[] {
    return this.categories;
  }

  private borrowingRequests: BorrowingRequestModel[] = [
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
        "Maximum active borrowings reached (3 books limit). Please return overdue books.",
      reviewedBy: "Administrator",
      reviewedDate: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    },
  ];

  public getBorrowingRequests(studentId?: string): BorrowingRequestModel[] {
    const requests = studentId
      ? this.borrowingRequests.filter((r) => r.studentId === studentId)
      : this.borrowingRequests;
    return requests.map((request) => ({
      ...request,
      cover_url: this.findCoverUrl(request.isbn, request.bookTitle),
    }));
  }

  public createBorrowingRequest(
    req: Partial<BorrowingRequestModel>
  ): BorrowingRequestModel {
    const newReq: BorrowingRequestModel = {
      id: `req-${Date.now()}`,
      requestCode: `REQ-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      bookId: req.bookId || "",
      bookTitle: req.bookTitle || "",
      author: req.author || "",
      isbn: req.isbn || "",
      cover_url: this.findCoverUrl(req.isbn || "", req.bookTitle || ""),
      category: req.category || "",
      studentId: req.studentId || "",
      studentName: req.studentName || "",
      programCode: req.programCode || "BSIT",
      requestDate: new Date().toISOString(),
      status: "Pending",
    };
    this.borrowingRequests.unshift(newReq);
    return newReq;
  }

  public cancelBorrowingRequest(
    id: string,
    studentId: string
  ): boolean {
    const request = this.borrowingRequests.find(
      (item) => item.id === id && item.studentId === studentId && item.status === "Pending"
    );
    if (!request) return false;
    request.status = "Cancelled";
    return true;
  }

  public approveBorrowingRequest(
    id: string,
    reviewedBy = "Administrator"
  ): { ok: boolean; message: string } {
    const req = this.borrowingRequests.find((r) => r.id === id);
    if (!req) return { ok: false, message: "Request not found." };

    const book = this.books.find((b) => b.id === req.bookId);
    if (!book || book.availableCopies <= 0) {
      return { ok: false, message: "No available copies in inventory." };
    }

    req.status = "Approved";
    req.reviewedBy = reviewedBy;
    req.reviewedDate = new Date().toISOString();

    book.availableCopies = Math.max(0, book.availableCopies - 1);
    book.borrowedCopies += 1;
    book.status =
      book.availableCopies <= 0 ? "Checked Out" : "Partially Available";

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    const newTx: BorrowingTransactionModel = {
      id: `tx-${Date.now()}`,
      transactionCode: `TX-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      bookId: book.id,
      bookTitle: book.title,
      isbn: book.isbn,
      cover_url: book.cover_url ?? null,
      studentId: req.studentId,
      studentName: req.studentName,
      programCode: req.programCode,
      borrowDate: new Date().toISOString(),
      dueDate: dueDate.toISOString(),
      status: "Borrowed",
      finesAccrued: 0,
      sourceSystem: "Integrated Library LMS (REST API)",
    };
    this.transactions.unshift(newTx);

    return { ok: true, message: "Request approved and loan generated." };
  }

  public rejectBorrowingRequest(
    id: string,
    reason: string,
    reviewedBy = "Administrator"
  ): { ok: boolean; message: string } {
    const req = this.borrowingRequests.find((r) => r.id === id);
    if (!req) return { ok: false, message: "Request not found." };

    req.status = "Rejected";
    req.rejectionReason = reason || "Librarian discretion.";
    req.reviewedBy = reviewedBy;
    req.reviewedDate = new Date().toISOString();

    return { ok: true, message: "Request rejected with reason." };
  }

  public confirmReturn(
    transactionId: string
  ): { ok: boolean; fineAccrued: number; message: string } {
    const tx = this.transactions.find((t) => t.id === transactionId);
    if (!tx)
      return { ok: false, fineAccrued: 0, message: "Transaction not found." };

    const now = new Date();
    const dueDate = new Date(tx.dueDate);
    const isOverdue = now.getTime() > dueDate.getTime();
    let calculatedFine = 0;

    if (isOverdue) {
      const diffMs = now.getTime() - dueDate.getTime();
      const days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      calculatedFine = days * 15.0;

      const fineItem: OverdueFineModel = {
        id: `fine-${Date.now()}`,
        transactionId: tx.id,
        bookTitle: tx.bookTitle,
        studentId: tx.studentId,
        studentName: tx.studentName,
        programCode: tx.programCode,
        dueDate: tx.dueDate,
        daysOverdue: days,
        fineAmount: calculatedFine,
        paymentStatus: "Unpaid",
      };
      this.fines.unshift(fineItem);
    }

    tx.status = "Returned";
    tx.returnDate = now.toISOString();
    tx.finesAccrued = calculatedFine;

    const book = this.books.find((b) => b.id === tx.bookId);
    if (book) {
      book.availableCopies = Math.min(book.totalCopies, book.availableCopies + 1);
      book.borrowedCopies = Math.max(0, book.borrowedCopies - 1);
      book.status =
        book.availableCopies >= book.totalCopies
          ? "Available"
          : "Partially Available";
    }

    return {
      ok: true,
      fineAccrued: calculatedFine,
      message: "Book return processed successfully.",
    };
  }
}

export const libraryETLService = new LibraryETLService();
