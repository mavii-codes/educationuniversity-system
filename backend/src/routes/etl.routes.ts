import { Router } from "express";
import { etlController } from "../controllers/etl.controller";
import { requireAuth, requireRoles } from "../middleware/auth.middleware";

const router = Router();

router.get(
  "/etl/sources",
  requireAuth,
  requireRoles("Administrator", "Librarian"),
  (req, res, next) => etlController.getSources(req, res, next),
);

router.post(
  "/etl/sync",
  requireAuth,
  requireRoles("Administrator"),
  (req, res, next) => etlController.runSync(req, res, next),
);

router.get(
  "/etl/runs",
  requireAuth,
  requireRoles("Administrator", "Librarian"),
  (req, res, next) => etlController.getRuns(req, res, next),
);

export default router;
