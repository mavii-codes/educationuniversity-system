import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { currentUser } from "../middleware/auth.middleware";
import { ApiError } from "../middleware/error.middleware";
import { AuthContext } from "../services/auth.service";
import { ferpaService } from "../services/ferpa.service";

const studentIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(32)
  .regex(/^[A-Za-z0-9-]+$/);

const consentQuerySchema = z.object({
  studentId: studentIdSchema.optional(),
});

const createConsentSchema = z.object({
  studentId: studentIdSchema,
  consentType: z.enum([
    "RECORDS_RELEASE",
    "DIRECTORY_INFO",
    "THIRD_PARTY",
    "RESEARCH_USE",
  ]),
  granted: z.boolean(),
  note: z.string().trim().max(2000).optional(),
  expiresAt: z.string().trim().min(1).max(64).optional(),
});

const accessLogQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

const directorySettingSchema = z.object({
  directoryOptOut: z.boolean(),
});

function viewerOrThrow(res: Response): AuthContext {
  const user = currentUser(res);
  if (!user) {
    throw new ApiError(401, "Authentication required.");
  }
  return user;
}

export class FerpaController {
  async getOverview(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json(await ferpaService.getOverview());
    } catch (error) {
      next(error);
    }
  }

  async getConsents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = consentQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        throw new ApiError(400, "Invalid consent filter parameters.");
      }
      res.json({ consents: await ferpaService.listConsents(parsed.data.studentId) });
    } catch (error) {
      next(error);
    }
  }

  async createConsent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = createConsentSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ApiError(400, "Invalid consent payload.");
      }

      const consent = await ferpaService.createConsent({
        ...parsed.data,
        viewer: viewerOrThrow(res),
      });
      if (!consent) {
        throw new ApiError(
          404,
          `Student record "${parsed.data.studentId}" not found`
        );
      }
      res.status(201).json({ consent });
    } catch (error) {
      next(error);
    }
  }

  async getAccessLog(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = accessLogQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        throw new ApiError(400, "Invalid access-log query parameters.");
      }
      res.json({ events: await ferpaService.listAccessLog(parsed.data.limit ?? 100) });
    } catch (error) {
      next(error);
    }
  }

  async getDirectorySettings(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      res.json({ settings: await ferpaService.listDirectorySettings() });
    } catch (error) {
      next(error);
    }
  }

  async updateDirectorySetting(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const parsedId = studentIdSchema.safeParse(req.params.studentId);
      if (!parsedId.success) {
        throw new ApiError(400, "Invalid student ID.");
      }
      const parsedBody = directorySettingSchema.safeParse(req.body);
      if (!parsedBody.success) {
        throw new ApiError(400, "Invalid directory setting payload.");
      }

      const setting = await ferpaService.updateDirectorySetting(
        parsedId.data,
        parsedBody.data.directoryOptOut,
        viewerOrThrow(res)
      );
      if (!setting) {
        throw new ApiError(404, `Student record "${parsedId.data}" not found`);
      }
      res.json({ setting });
    } catch (error) {
      next(error);
    }
  }

  async getMyConsents(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = viewerOrThrow(res);
      if (user.portalRole !== "Student") {
        throw new ApiError(403, "This endpoint is only available to students.");
      }
      res.json({ consents: await ferpaService.listConsents(user.id) });
    } catch (error) {
      next(error);
    }
  }
}

export const ferpaController = new FerpaController();
