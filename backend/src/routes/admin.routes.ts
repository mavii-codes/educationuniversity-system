import { Router } from "express";
import { adminController } from "../controllers/admin.controller";
import { requireRoles } from "../middleware/auth.middleware";

const router = Router();
// Scoped to this router's own paths: an unscoped router.use() mounted at
// /api would also run for requests handled by routers mounted AFTER this
// one (e.g. /api/library/*), locking non-admins out of them entirely.
router.use("/admin", requireRoles("Administrator"));
router.use("/audit-logs", requireRoles("Administrator"));

// GET /api/admin/dashboard
router.get("/admin/dashboard", (req, res, next) =>
  adminController.getDashboard(req, res, next)
);

// GET /api/admin/users
router.get("/admin/users", (req, res, next) =>
  adminController.getUsers(req, res, next)
);
router.post("/admin/users", (req, res, next) =>
  adminController.createLibraryStaff(req, res, next)
);
router.patch("/admin/users/:id/status", (req, res, next) =>
  adminController.updateUserStatus(req, res, next)
);
router.get("/admin/settings", (req, res, next) =>
  adminController.getSettings(req, res, next)
);
router.put("/admin/settings", (req, res, next) =>
  adminController.updateSettings(req, res, next)
);

// GET /api/admin/sync-history
router.get("/admin/sync-history", (req, res, next) =>
  adminController.getSyncHistory(req, res, next)
);

router.get("/audit-logs", (req, res, next) =>
  adminController.getAuditLogs(req, res, next)
);

export default router;
