import { Router } from "express";
import { alumniController } from "../controllers/alumni.controller";

const router = Router();

// GET /api/alumni
router.get("/alumni", (req, res, next) =>
  alumniController.getAlumni(req, res, next)
);

export default router;

