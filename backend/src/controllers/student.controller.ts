import { NextFunction, Request, Response } from "express";
import { studentService } from "../services/student.service";
import { ApiError } from "../middleware/error.middleware";

export class StudentController {
  async getStudents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const students = await studentService.findAll({
        search: typeof req.query.search === "string" ? req.query.search : undefined,
        program: typeof req.query.program === "string" ? req.query.program : undefined,
        yearLevel: typeof req.query.yearLevel === "string" ? req.query.yearLevel : undefined,
        status: typeof req.query.status === "string" ? req.query.status : undefined,
        riskLevel: typeof req.query.riskLevel === "string" ? req.query.riskLevel : undefined,
      });
      res.json(students);
    } catch (error) {
      next(error);
    }
  }

  async getStudentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const student = await studentService.findById(req.params.id);
      if (!student) {
        throw new ApiError(404, `Student record "${req.params.id}" not found`);
      }
      res.json(student);
    } catch (error) {
      next(error);
    }
  }

  async getLifecycle(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const lifecycle = await studentService.getLifecycleSummary();
      res.json(lifecycle);
    } catch (error) {
      next(error);
    }
  }
}

export const studentController = new StudentController();

