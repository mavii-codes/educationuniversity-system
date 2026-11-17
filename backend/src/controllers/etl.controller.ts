import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { ApiError } from "../middleware/error.middleware";
import { universityETLService } from "../etl/university-etl.service";

const syncSchema = z.object({
  sourceIds: z
    .array(z.enum(["SIS", "LMS", "HR", "ALUMNI_CRM", "LIBRARY"]))
    .max(5)
    .optional(),
});

const runsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export class EtlController {
  async getSources(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json({ sources: await universityETLService.getSources() });
    } catch (error) {
      next(error);
    }
  }

  async runSync(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = syncSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        throw new ApiError(400, "Invalid ETL sync payload.");
      }
      const triggeredBy =
        typeof res.locals.user?.name === "string" && res.locals.user.name.trim().length > 0
          ? res.locals.user.name
          : "Admin Console";
      res.json(
        await universityETLService.runSync({
          sourceIds: parsed.data.sourceIds,
          triggeredBy,
        }),
      );
    } catch (error) {
      next(error);
    }
  }

  async getRuns(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = runsQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        throw new ApiError(400, "Invalid ETL runs query.");
      }
      res.json({ runs: await universityETLService.getRuns(parsed.data.limit) });
    } catch (error) {
      next(error);
    }
  }
}

export const etlController = new EtlController();
