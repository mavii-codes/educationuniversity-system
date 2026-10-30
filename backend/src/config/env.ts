import dotenv from "dotenv";

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  corsOrigin: process.env.CORS_ORIGIN || "*",
  db: {
    enabled: process.env.DB_ENABLED === "true",
    host: process.env.DB_HOST || "",
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || "",
    user: process.env.DB_USER || "",
    password: process.env.DB_PASSWORD || "",
    ssl: process.env.DB_SSL === "true",
  },
};

