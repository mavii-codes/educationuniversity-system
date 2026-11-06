import { Router } from "express";
import { analyticsController } from "../controllers/analytics.controller";
import { requireRoles } from "../middleware/auth.middleware";

const router = Router();
// Scoped to this router's own paths: an unscoped router.use() mounted at
// /api would also run for requests handled by routers mounted AFTER this
// one (e.g. /api/library/*), blocking students and staff from the catalog.
const staffOnly = requireRoles("Administrator", "Librarian");
router.use("/analytics", staffOnly);
router.use("/programs", staffOnly);
router.use("/courses", staffOnly);
router.use("/reports", staffOnly);

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
