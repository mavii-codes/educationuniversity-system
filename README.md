# University Data Integration System (University DataHub)

A modern, unified **Student Lifecycle & Academic Analytics** platform structured with a strictly separated **Next.js Frontend** and **Express.js Backend**, prepared for **PostgreSQL**.

## Project Architecture

```text
EducationUniversitySystems/
├── frontend/          # Next.js 14 + TypeScript + Tailwind CSS + Recharts + Lucide React
│   ├── app/           # App Router pages (dashboard, students, lifecycle, data-sources, integration, analytics, alumni, reports, notifications, settings)
│   ├── components/    # Modular UI (layout, dashboard, students, lifecycle, integration, analytics, alumni, ui)
│   ├── data/          # Separated realistic mock data (mock-data.ts)
│   ├── lib/           # REST API client (api.ts) & formatting helpers (utils.ts)
│   ├── types/         # Shared frontend TypeScript models (index.ts)
│   └── .env.example   # Frontend environment configuration template
│
├── backend/           # Node.js + Express.js + TypeScript REST API foundation
│   ├── src/
│   │   ├── config/        # Environment & PostgreSQL pool setup (database.ts)
│   │   ├── controllers/   # Request handlers (student, analytics, alumni, integration)
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
```

### Authentication

All data endpoints require a session. Authentication uses JWT access tokens plus rotating refresh tokens stored in `HttpOnly` cookies.

| Endpoint | Method | Notes |
| --- | --- | --- |
| `/api/auth/login` | POST | Body: `{ identifier, password, rememberMe? }` |
| `/api/auth/forgot-password` | POST | Body: `{ email }`; sends a one-time reset link with Resend |
| `/api/auth/reset-password` | POST | Body: `{ token, password }`; reset links expire after 30 minutes |
| `/api/auth/refresh` | POST | Rotates the refresh token; reuse revokes the session family |
| `/api/auth/logout` | POST | Revokes the refresh token and clears cookies |
| `/api/auth/me` | GET | Returns the current session user |

Seeded demo accounts (passwords come from `SEED_ADMIN_PASSWORD` / `SEED_REGISTRAR_PASSWORD`):

- `admin@university.edu` — System Administrator (portal role: Administrator)
- `h.mendoza@university.edu` — University Registrar Admin (portal role: Registrar)

Mutations require a CSRF token. The server sets a readable `udis_csrf` cookie and the client must echo it in the `X-CSRF-Token` header. Send cookies with `credentials: "include"`.

Relevant environment variables: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL_DAYS`, `JWT_REFRESH_TTL_DAYS_REMEMBER`, `COOKIE_SECURE`, `COOKIE_DOMAIN`, `COOKIE_SAMESITE`.

Password reset email requires `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (a sender verified with Resend), and `FRONTEND_URL` (the deployed frontend origin). Apply the database migrations after deploying this feature so the password-reset token table exists.

The OpenAPI 3 specification is served at `http://localhost:5000/api/docs/openapi.yaml`.
