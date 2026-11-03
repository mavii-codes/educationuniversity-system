import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { analyticsService } from "../services/analytics.service";
import { studentService } from "../services/student.service";
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

      const students = await studentService.findAll(parsed.data);
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
      res.json(student);
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
