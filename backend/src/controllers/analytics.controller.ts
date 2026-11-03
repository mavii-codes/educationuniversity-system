import { NextFunction, Request, Response } from "express";
import { analyticsService } from "../services/analytics.service";

export class AnalyticsController {
  async getAnalytics(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json(await analyticsService.getAnalytics());
    } catch (error) {
      next(error);
    }
  }

  async getDashboard(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json(await analyticsService.getDashboard());
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

  async getPrograms(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json(await analyticsService.getPrograms());
    } catch (error) {
      next(error);
    }
  }

  async getCourses(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json(await analyticsService.getCourses());
    } catch (error) {
      next(error);
    }
  }

  async getReports(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json(await analyticsService.getReports());
    } catch (error) {
      next(error);
    }
  }
}

export const analyticsController = new AnalyticsController();
