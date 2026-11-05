import app from "./app";
import { env } from "./config/env";
import { getDbPool, verifyDatabaseConnection } from "./config/database";
import { startRealtimeListener, stopRealtimeListener } from "./services/realtime.service";

async function startServer() {
  try {
    const dbStatus = await verifyDatabaseConnection();
    await startRealtimeListener();
    const server = app.listen(env.port, () => {
      console.log(
        `[University Library Backend] Server running on port ${env.port} (${env.nodeEnv})`
      );
      console.log(`[University Library Backend] Database mode: ${dbStatus}`);
    });

    const shutdown = async () => {
      console.log("[University Library Backend] Shutting down gracefully...");
      stopRealtimeListener();
      server.close(async () => {
        const pool = getDbPool();
        if (pool) {
          await pool.end();
        }
        process.exit(0);
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("[University Library Backend] Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
