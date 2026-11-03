import { NextFunction, Request, Response } from "express";
import { currentUser } from "../middleware/auth.middleware";
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

  async getIntegratedAlumni(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const role = currentUser(res)?.portalRole ?? "Administrator";
      const data = await alumniService.getIntegratedAlumni(role);
      res.json(data);
    } catch (error) {
      next(error);
    }
  }

  async syncAlumniCrm(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await alumniService.triggerCrmSync(currentUser(res)?.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const alumniController = new AlumniController();
