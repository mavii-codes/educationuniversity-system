import { Router } from "express";
import { analyticsController } from "../controllers/analytics.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();
router.use(requireAuth);

// GET /api/analytics
router.get("/analytics", (req, res, next) =>
  analyticsController.getAnalytics(req, res, next)
);

// GET /api/analytics/dashboard
router.get("/analytics/dashboard", (req, res, next) =>
  analyticsController.getDashboard(req, res, next)
);

// GET /api/programs
router.get("/programs", (req, res, next) =>
  analyticsController.getPrograms(req, res, next)
);

// GET /api/courses
router.get("/courses", (req, res, next) =>
  analyticsController.getCourses(req, res, next)
);

// GET /api/reports
router.get("/reports", (req, res, next) =>
  analyticsController.getReports(req, res, next)
);

export default router;
