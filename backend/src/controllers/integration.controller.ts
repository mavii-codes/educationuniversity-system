import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { integrationService } from "../services/integration.service";
import { currentUser } from "../middleware/auth.middleware";
import { ApiError } from "../middleware/error.middleware";

const sourceIdSchema = z.string().trim().min(1).max(32).regex(/^[A-Za-z0-9-]+$/);

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
      const parsedId = sourceIdSchema.safeParse(req.params.id);
      if (!parsedId.success) {
        throw new ApiError(400, "Invalid data source ID.");
      }

      const result = await integrationService.syncDataSource(
        parsedId.data,
        currentUser(res)?.id
      );
      if (!result) {
        throw new ApiError(404, `Data source "${parsedId.data}" not found`);
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

