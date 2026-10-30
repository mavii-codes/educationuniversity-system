import { Router } from "express";
import { alumniController } from "../controllers/alumni.controller";
import { requireRoles } from "../middleware/auth.middleware";

const router = Router();

// GET /api/alumni (legacy compatibility endpoint)
router.get("/alumni", (req, res, next) =>
  alumniController.getAlumni(req, res, next)
);

// GET /api/alumni/integrated (Authorized: Administrator & Registrar)
router.get(
  "/alumni/integrated",
  requireRoles("Administrator", "Registrar"),
  (req, res, next) => alumniController.getIntegratedAlumni(req, res, next)
);

// POST /api/alumni/sync (Authorized: Administrator only)
router.post(
  "/alumni/sync",
  requireRoles("Administrator"),
  (req, res, next) => alumniController.syncAlumniCrm(req, res, next)
);

export default router;
