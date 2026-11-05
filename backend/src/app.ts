import path from "node:path";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { env } from "./config/env";
import { verifyDatabaseConnection } from "./config/database";
import { requestLogger } from "./middleware/logger.middleware";
import { attachAuthContext, csrfGuard } from "./middleware/auth.middleware";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import realtimeRoutes from "./routes/realtime.routes";
import { publishRealtimeUpdate } from "./services/realtime.service";
import authRoutes from "./routes/auth.routes";
import studentRoutes from "./routes/student.routes";
import analyticsRoutes from "./routes/analytics.routes";
import integrationRoutes from "./routes/integration.routes";
import adminRoutes from "./routes/admin.routes";
import libraryRoutes from "./routes/library.routes";
import { uploadsDirectory } from "./utils/book-cover-storage";
import * as authRepository from "./repositories/auth.repository";

const app = express();

if (env.isProduction) {
  app.set("trust proxy", 1);
}

// Global Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use("/uploads", express.static(uploadsDirectory, {
  fallthrough: false,
  dotfiles: "deny",
  index: false,
  maxAge: env.isProduction ? "7d" : 0,
}));
app.use(requestLogger);
app.use(attachAuthContext);
app.use(csrfGuard);
app.use((req, res, next) => {
  res.once("finish", () => {
    const isMutation = !["GET", "HEAD", "OPTIONS"].includes(req.method);
    const isAuthRequest = req.path.startsWith("/api/auth/");
    const shouldAudit = isMutation && !isAuthRequest && env.db.enabled;
    const auditWrite = shouldAudit
      ? authRepository
          .writeAudit({
            actorUserId: res.locals.user?.id ?? null,
            action: `api.${req.method.toLowerCase()}`.slice(0, 64),
            entityType: req.path.slice(0, 48),
            metadata: {
              method: req.method,
              path: req.path,
              status:
                res.statusCode < 400
                  ? "Success"
                  : res.statusCode < 500
                    ? "Warning"
                    : "Failure",
              statusCode: res.statusCode,
              ipAddress: req.ip,
            },
          })
          .catch((error: unknown) => {
            console.error(
              "[audit] Failed to record API mutation:",
              error instanceof Error ? error.message : error
            );
          })
      : Promise.resolve();

    if (isMutation && !isAuthRequest && res.statusCode >= 200 && res.statusCode < 300) {
      const clientId = req.header("x-client-id");
      void auditWrite.then(() =>
        publishRealtimeUpdate(
          clientId && /^[a-zA-Z0-9-]{1,64}$/.test(clientId) ? clientId : undefined
        )
      );
    } else {
      void auditWrite;
    }
  });
  next();
});

// API documentation (OpenAPI 3) — development only; never exposed in production.
if (!env.isProduction) {
  app.use(
    "/api/docs",
    express.static(path.resolve(__dirname, "../docs"), {
      setHeaders: (res) => res.setHeader("Content-Type", "text/yaml; charset=utf-8"),
    })
  );
}

// Health Check Endpoint
app.get("/api/health", async (_req, res) => {
  try {
    const dbStatus = await verifyDatabaseConnection();
    res.json({
      status: "ok",
      service: "University Library Management API",
      environment: env.nodeEnv,
      database: dbStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({
      status: "degraded",
      service: "University Library Management API",
      database: "disconnected",
      error: err instanceof Error ? err.message : "Database check failed",
    });
  }
});

// REST API Routes
app.use("/api", authRoutes);
app.use("/api", realtimeRoutes);
app.use("/api", studentRoutes);
app.use("/api", analyticsRoutes);
app.use("/api", integrationRoutes);
app.use("/api", adminRoutes);
app.use("/api", libraryRoutes);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
