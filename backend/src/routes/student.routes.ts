import { Router } from "express";
import { studentController } from "../controllers/student.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();
router.use(requireAuth);

// GET /api/students
router.get("/students", (req, res, next) =>
  studentController.getStudents(req, res, next)
);

// GET /api/students/:id
router.get("/students/:id", (req, res, next) =>
  studentController.getStudentById(req, res, next)
);

// GET /api/lifecycle
router.get("/lifecycle", (req, res, next) =>
  studentController.getLifecycle(req, res, next)
);

export default router;
