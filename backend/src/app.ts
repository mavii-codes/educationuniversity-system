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
import authRoutes from "./routes/auth.routes";
import studentRoutes from "./routes/student.routes";
import analyticsRoutes from "./routes/analytics.routes";
import alumniRoutes from "./routes/alumni.routes";
import integrationRoutes from "./routes/integration.routes";
import adminRoutes from "./routes/admin.routes";

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
app.use(requestLogger);
app.use(attachAuthContext);
app.use(csrfGuard);

// API documentation (OpenAPI 3)
app.use(
  "/api/docs",
  express.static(path.resolve(__dirname, "../docs"), {
    setHeaders: (res) => res.setHeader("Content-Type", "text/yaml; charset=utf-8"),
  })
);

// Health Check Endpoint
app.get("/api/health", async (_req, res) => {
  try {
    const dbStatus = await verifyDatabaseConnection();
    res.json({
      status: "ok",
      service: "University DataHub API",
      environment: env.nodeEnv,
      database: dbStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({
      status: "degraded",
      service: "University DataHub API",
      database: "disconnected",
      error: err instanceof Error ? err.message : "Database check failed",
    });
  }
});

// REST API Routes
app.use("/api", authRoutes);
app.use("/api", studentRoutes);
app.use("/api", analyticsRoutes);
app.use("/api", alumniRoutes);
app.use("/api", integrationRoutes);
app.use("/api", adminRoutes);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

