import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth.middleware";
import {
  loginRateLimit,
  passwordResetRateLimit,
} from "../middleware/rate-limit.middleware";

const router = Router();

router.post("/auth/forgot-password", passwordResetRateLimit, (req, res, next) =>
  authController.forgotPassword(req, res, next)
);

router.post("/auth/reset-password", passwordResetRateLimit, (req, res, next) =>
  authController.resetPassword(req, res, next)
);

// POST /api/auth/login
router.post("/auth/login", loginRateLimit, (req, res, next) =>
  authController.login(req, res, next)
);

// POST /api/auth/refresh
router.post("/auth/refresh", (req, res, next) =>
  authController.refresh(req, res, next)
);

// POST /api/auth/logout
router.post("/auth/logout", (req, res, next) =>
  authController.logout(req, res, next)
);

// GET /api/auth/me
router.get("/auth/me", requireAuth, (req, res, next) =>
  authController.me(req, res, next)
);

export default router;
