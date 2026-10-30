import { NextFunction, Request, Response } from "express";
import { integrationService } from "../services/integration.service";
import { ApiError } from "../middleware/error.middleware";

export class IntegrationController {
  async getDataSources(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sources = await integrationService.getDataSources();
      res.json(sources);
    } catch (error) {
      next(error);
    }
  }

  async syncSource(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await integrationService.syncDataSource(req.params.id);
      if (!result) {
        throw new ApiError(404, `Data source "${req.params.id}" not found`);
      }
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getIntegrations(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = await integrationService.getIntegrationStatus();
      res.json(status);
    } catch (error) {
      next(error);
    }
  }

  async getNotifications(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const notifications = await integrationService.getNotifications();
      res.json(notifications);
    } catch (error) {
      next(error);
    }
  }
}

export const integrationController = new IntegrationController();

