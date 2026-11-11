import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { analyticsService } from "../services/analytics.service";
import { studentService } from "../services/student.service";
import { studentLifecycleService } from "../services/student-lifecycle.service";
import { ferpaService } from "../services/ferpa.service";
import { currentUser } from "../middleware/auth.middleware";
import { ApiError } from "../middleware/error.middleware";

const studentQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  program: z.string().trim().max(16).optional(),
  yearLevel: z.string().trim().max(24).optional(),
  status: z.string().trim().max(24).optional(),
  riskLevel: z.enum(["Low", "Medium", "High"]).optional(),
});

const idSchema = z.string().trim().min(1).max(32).regex(/^[A-Za-z0-9-]+$/);

export class StudentController {
  async getStudents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = studentQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        throw new ApiError(400, "Invalid student filter parameters.");
      }

      const students = await studentService.findAll(parsed.data, currentUser(res));
      res.json(students);
    } catch (error) {
      next(error);
    }
  }

  async getStudentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsedId = idSchema.safeParse(req.params.id);
      if (!parsedId.success) {
        throw new ApiError(400, "Invalid student ID.");
      }

      const student = await studentService.findById(parsedId.data);
      if (!student) {
        throw new ApiError(404, `Student record "${parsedId.data}" not found`);
      }

      const user = currentUser(res);
      const isStaff =
        user?.portalRole === "Administrator" || user?.portalRole === "Librarian";

      let payload = student;
      if (user?.portalRole === "Librarian") {
        const directoryOptOut = await ferpaService.isDirectoryOptOut(student.id);
        payload = ferpaService.getMaskedStudent(student, {
          ...user,
          directoryOptOut,
        });
      }

      if (isStaff && user) {
        await ferpaService.logStudentAccess({
          studentId: student.id,
          viewer: user,
          action: "VIEW_PROFILE",
        });
      }

      res.json(payload);
    } catch (error) {
      next(error);
    }
  }

  async getStudentLifecycle(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const parsedId = idSchema.safeParse(req.params.id);
      if (!parsedId.success) {
        throw new ApiError(400, "Invalid student ID.");
      }

      const user = currentUser(res);
      if (!user) {
        throw new ApiError(401, "Authentication required.");
      }

      const lifecycle = await studentLifecycleService.getStudentLifecycle(
        parsedId.data,
        user
      );
      if (!lifecycle) {
        throw new ApiError(404, `Student record "${parsedId.data}" not found`);
      }

      if (user.portalRole !== "Student") {
        await ferpaService.logStudentAccess({
          studentId: parsedId.data,
          viewer: user,
          action: "VIEW_LIFECYCLE",
        });
      }

      res.json(lifecycle);
    } catch (error) {
      next(error);
    }
  }

  async getLifecycle(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json(await analyticsService.getLifecycle());
    } catch (error) {
      next(error);
    }
  }
}

export const studentController = new StudentController();
