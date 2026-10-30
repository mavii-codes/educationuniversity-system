import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { verifyDatabaseConnection } from "./config/database";
import { requestLogger } from "./middleware/logger.middleware";
import { optionalAuthContext } from "./middleware/auth.middleware";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import studentRoutes from "./routes/student.routes";
import analyticsRoutes from "./routes/analytics.routes";
import alumniRoutes from "./routes/alumni.routes";
import integrationRoutes from "./routes/integration.routes";

const app = express();

// Global Middleware
app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true,
  })
);
app.use(express.json());
app.use(requestLogger);
app.use(optionalAuthContext);

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
app.use("/api", studentRoutes);
app.use("/api", analyticsRoutes);
app.use("/api", alumniRoutes);
app.use("/api", integrationRoutes);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

