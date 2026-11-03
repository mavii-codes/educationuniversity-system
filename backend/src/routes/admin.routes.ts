import { Router } from "express";
import { adminController } from "../controllers/admin.controller";
import { requireRoles } from "../middleware/auth.middleware";

const router = Router();
router.use(requireRoles("Administrator"));

// GET /api/admin/dashboard
router.get("/admin/dashboard", (req, res, next) =>
  adminController.getDashboard(req, res, next)
);

// GET /api/admin/users
router.get("/admin/users", (req, res, next) =>
  adminController.getUsers(req, res, next)
);

// GET /api/admin/sync-history
router.get("/admin/sync-history", (req, res, next) =>
  adminController.getSyncHistory(req, res, next)
);

export default router;
