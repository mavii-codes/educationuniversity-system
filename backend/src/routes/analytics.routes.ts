import { Router } from "express";
import { analyticsController } from "../controllers/analytics.controller";

const router = Router();

// GET /api/analytics
router.get("/analytics", (req, res, next) =>
  analyticsController.getAnalytics(req, res, next)
);

// GET /api/analytics/dashboard
router.get("/analytics/dashboard", (req, res, next) =>
  analyticsController.getAnalytics(req, res, next)
);

// GET /api/programs
router.get("/programs", (req, res, next) =>
  analyticsController.getPrograms(req, res, next)
);

// GET /api/reports
router.get("/reports", (req, res, next) =>
  analyticsController.getReports(req, res, next)
);

export default router;

