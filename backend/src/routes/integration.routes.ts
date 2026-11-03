import { Router } from "express";
import { integrationController } from "../controllers/integration.controller";
import { requireAuth, requireRoles } from "../middleware/auth.middleware";

const router = Router();
router.use(requireAuth);

// GET /api/data-sources
router.get("/data-sources", (req, res, next) =>
  integrationController.getDataSources(req, res, next)
);

// POST /api/data-sources/:id/sync (Administrator only)
router.post(
  "/data-sources/:id/sync",
  requireRoles("Administrator"),
  (req, res, next) => integrationController.syncSource(req, res, next)
);

// GET /api/integrations
router.get("/integrations", (req, res, next) =>
  integrationController.getIntegrations(req, res, next)
);

// GET /api/notifications
router.get("/notifications", (req, res, next) =>
  integrationController.getNotifications(req, res, next)
);

export default router;
