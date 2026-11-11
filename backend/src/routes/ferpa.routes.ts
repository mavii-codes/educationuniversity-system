import { Router } from "express";
import { ferpaController } from "../controllers/ferpa.controller";
import { requireAuth, requireRoles } from "../middleware/auth.middleware";

const router = Router();
router.use(requireAuth);

// GET /api/ferpa/overview
router.get("/ferpa/overview", requireRoles("Administrator"), (req, res, next) =>
  ferpaController.getOverview(req, res, next)
);

// GET /api/ferpa/consents?studentId=
router.get(
  "/ferpa/consents",
  requireRoles("Administrator", "Librarian"),
  (req, res, next) => ferpaController.getConsents(req, res, next)
);

// POST /api/ferpa/consents
router.post("/ferpa/consents", requireRoles("Administrator"), (req, res, next) =>
  ferpaController.createConsent(req, res, next)
);

// GET /api/ferpa/access-log?limit=
router.get("/ferpa/access-log", requireRoles("Administrator"), (req, res, next) =>
  ferpaController.getAccessLog(req, res, next)
);

// GET /api/ferpa/directory-settings
router.get(
  "/ferpa/directory-settings",
  requireRoles("Administrator", "Librarian"),
  (req, res, next) => ferpaController.getDirectorySettings(req, res, next)
);

// PATCH /api/ferpa/directory-settings/:studentId
router.patch(
  "/ferpa/directory-settings/:studentId",
  requireRoles("Administrator"),
  (req, res, next) => ferpaController.updateDirectorySetting(req, res, next)
);

// GET /api/ferpa/my-consents
router.get("/ferpa/my-consents", requireRoles("Student"), (req, res, next) =>
  ferpaController.getMyConsents(req, res, next)
);

export default router;
