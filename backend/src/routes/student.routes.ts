import { Router } from "express";
import { studentController } from "../controllers/student.controller";
import { currentUser, requireAuth, requireRoles } from "../middleware/auth.middleware";

const router = Router();
router.use(requireAuth);

// GET /api/students
router.get("/students", requireRoles("Administrator", "Librarian"), (req, res, next) =>
  studentController.getStudents(req, res, next)
);

// GET /api/students/:id
router.get("/students/:id", (req, res, next) => {
  const user = currentUser(res);
  if (
    user?.portalRole !== "Administrator" &&
    user?.portalRole !== "Librarian" &&
    !(user?.portalRole === "Student" && user.id === req.params.id)
  ) {
    res.status(403).json({
      error: "Forbidden",
      message: "You may only view your own student profile.",
    });
    return;
  }
  studentController.getStudentById(req, res, next);
});

// GET /api/lifecycle
router.get("/lifecycle", requireRoles("Administrator", "Librarian"), (req, res, next) =>
  studentController.getLifecycle(req, res, next)
);

export default router;
