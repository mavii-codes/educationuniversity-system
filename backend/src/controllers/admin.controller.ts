import { NextFunction, Request, Response } from "express";
import { adminService } from "../services/admin.service";

export class AdminController {
  async getDashboard(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json(await adminService.getDashboardOverview());
    } catch (error) {
      next(error);
    }
  }

  async getUsers(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json(await adminService.getUsers());
    } catch (error) {
      next(error);
    }
  }

  async getSyncHistory(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json(await adminService.getSyncHistory());
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
