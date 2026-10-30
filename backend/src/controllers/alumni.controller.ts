import { NextFunction, Request, Response } from "express";
import { alumniService } from "../services/alumni.service";

export class AlumniController {
  async getAlumni(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await alumniService.getAlumniOverview();
      res.json(data);
    } catch (error) {
      next(error);
    }
  }
}

export const alumniController = new AlumniController();

