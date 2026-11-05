# University Library Management System

A library system for managing the book catalog, student member accounts, borrowing, reservations, returns, and fines. It uses a **Next.js frontend**, an **Express.js API**, and **PostgreSQL**.

## Project Architecture

```text
EducationUniversitySystems/
├── frontend/          # Next.js 14 + TypeScript + Tailwind CSS + Recharts + Lucide React
│   ├── app/           # App Router pages for the catalog, member accounts, circulation, and administration
│   ├── components/    # Modular library, dashboard, account, and shared UI components
│   ├── data/          # Separated realistic mock data (mock-data.ts)
│   ├── lib/           # REST API client (api.ts) & formatting helpers (utils.ts)
│   ├── types/         # Shared frontend TypeScript models (index.ts)
│   └── .env.example   # Frontend environment configuration template
│
├── backend/           # Node.js + Express.js + TypeScript REST API foundation
│   ├── src/
│   │   ├── config/        # Environment & PostgreSQL pool setup (database.ts)
│   │   ├── controllers/   # Request handlers for authentication, members, and library operations
│   │   ├── services/      # Business logic layer ready for PostgreSQL queries
│   │   ├── routes/        # Modular Express REST endpoints (/api/*)
│   │   ├── middleware/    # Logger, auth foundation, and centralized error handling
│   │   ├── models/        # Domain models & PostgreSQL DDL schema (schema.sql)
│   │   ├── app.ts         # Express app configuration
│   │   └── server.ts      # Server entry point
│   └── .env.example   # Backend environment configuration template
│
└── README.md
```

## Running Independently

### 1. Frontend (`/frontend`)

```bash
cd frontend
npm install
npm run dev
```

Configure the Vercel project with these environment variables to connect to the live Express API:

```text
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
NEXT_PUBLIC_USE_LIVE_API=true
```

Redeploy the frontend after changing these values. In live API mode, failed or invalid
backend responses are surfaced instead of silently replaced with mock data.

### 2. Backend (`/backend`)

```bash
cd backend
npm install
npm run dev
```

Configure the Render backend with `PORT`, `NODE_ENV=production`, `CORS_ORIGIN` (the exact Vercel site origin), separate strong `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` values, and PostgreSQL connection settings (`DB_ENABLED=true` and `DATABASE_URL`, or the discrete `DB_*` values). Set `COOKIE_SECURE=true` and `COOKIE_SAMESITE=none` for cross-site cookie authentication. The authenticated `/api/events` Server-Sent Events endpoint broadcasts successful API mutations to connected clients; PostgreSQL `LISTEN/NOTIFY` shares those events across backend instances.

Realtime events refresh other authenticated sessions after successful backend API mutations. Features that still use frontend mock data or browser `localStorage` are not yet shared across users and must be moved to backend APIs before those specific workflows are live.

Apply the schema and seed the demo dataset:

```bash
npm run db:migrate
npm run db:seed
npm run db:backfill-book-covers
```

The library migration adds persistent catalog metadata and `cover_url`. The
backfill looks up covers for existing PostgreSQL books, waiting 300 ms between
books. Administrator and Registrar book edits are available from Library Management;
PostgreSQL must be enabled for changes to persist across
sessions. Student, Administrator, and Registrar book views use the same catalog
cover URLs. The built-in catalog contains 30 titles with all copies available.
After adding these seed records to an existing database, run the three commands
above; the backfill also replaces old unvalidated Open Library cover links.

Administrator and Registrar book forms also accept JPG/JPEG, PNG, and WebP
cover uploads up to 2 MB. Files are stored under `backend/uploads/covers` and
served from `/uploads`; the existing `NEXT_PUBLIC_API_URL` must point to the
backend API (for example `http://localhost:5000/api`) and `CORS_ORIGIN` must
allow the frontend origin. On hosted deployments, mount persistent storage at
`backend/uploads` so uploaded covers survive restarts and are shared by all
backend instances.

### Authentication

All data endpoints require a session. Authentication uses JWT access tokens plus rotating refresh tokens stored in `HttpOnly` cookies.

| Endpoint | Method | Notes |
| --- | --- | --- |
| `/api/auth/register` | POST | Body: `{ studentId, name, email, password, programCode, yearLevel }`; creates a student account (password must be at least 12 characters) |
| `/api/auth/login` | POST | Body: `{ identifier, password, rememberMe? }` |
| `/api/auth/forgot-password` | POST | Body: `{ email }`; sends a one-time reset link with Resend |
| `/api/auth/reset-password` | POST | Body: `{ token, password }`; reset links expire after 30 minutes |
| `/api/auth/refresh` | POST | Rotates the refresh token; reuse revokes the session family |
| `/api/auth/logout` | POST | Revokes the refresh token and clears cookies |
| `/api/auth/me` | GET | Returns the current session user |

Student self-registration creates an active student account and profile, then signs the student in. It requires PostgreSQL to be enabled and the programs seeded; run `npm run db:migrate` and `npm run db:seed` in `backend`. Registration currently does not verify email ownership.

Seeded demo accounts (passwords come from `SEED_ADMIN_PASSWORD` / `SEED_REGISTRAR_PASSWORD`):

- `admin@university.edu` — System Administrator (portal role: Administrator)
- `h.mendoza@university.edu` — University Registrar Admin (portal role: Registrar)

Mutations require a CSRF token. The server sets a readable `udis_csrf` cookie and the client must echo it in the `X-CSRF-Token` header. Send cookies with `credentials: "include"`.

Relevant environment variables: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL_DAYS`, `JWT_REFRESH_TTL_DAYS_REMEMBER`, `COOKIE_SECURE`, `COOKIE_DOMAIN`, `COOKIE_SAMESITE`.

Password reset email requires `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (a sender verified with Resend), and `FRONTEND_URL` (the deployed frontend origin). Apply the database migrations after deploying this feature so the password-reset token table exists.

The OpenAPI 3 specification is served at `http://localhost:5000/api/docs/openapi.yaml`.
