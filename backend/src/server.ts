import app from "./app";
import { env } from "./config/env";
import { getDbPool, verifyDatabaseConnection } from "./config/database";

async function startServer() {
  try {
    const dbStatus = await verifyDatabaseConnection();
    const server = app.listen(env.port, () => {
      console.log(
        `[University DataHub Backend] Server running on port ${env.port} (${env.nodeEnv})`
      );
      console.log(`[University DataHub Backend] Database mode: ${dbStatus}`);
    });

    const shutdown = async () => {
      console.log("[University DataHub Backend] Shutting down gracefully...");
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
    console.error("[University DataHub Backend] Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

