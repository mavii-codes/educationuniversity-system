import { NextFunction, Request, Response } from "express";
import { analyticsService } from "../services/analytics.service";

export class AnalyticsController {
  async getAnalytics(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const [dashboard, programs] = await Promise.all([
        analyticsService.getDashboardMetrics(),
        analyticsService.getPrograms(),
      ]);
      res.json({
        ...dashboard,
        programs,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPrograms(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const programs = await analyticsService.getPrograms();
      res.json(programs);
    } catch (error) {
      next(error);
    }
  }

  async getReports(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reports = await analyticsService.getReportsCatalog();
      res.json(reports);
    } catch (error) {
      next(error);
    }
  }
}

export const analyticsController = new AnalyticsController();

