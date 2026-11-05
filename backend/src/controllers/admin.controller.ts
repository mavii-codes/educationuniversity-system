import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { currentUser } from "../middleware/auth.middleware";
import { ApiError } from "../middleware/error.middleware";
import { adminService } from "../services/admin.service";
import { findAuditLogs } from "../repositories/audit.repository";

const createLibraryStaffSchema = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(160),
  password: z.string().min(12).max(200),
  department: z.string().trim().min(2).max(160),
});

const accountStatusSchema = z.object({
  status: z.enum(["Active", "Inactive"]),
});

const adminSettingsSchema = z.object({
  profile: z.object({
    name: z.string().trim().min(2).max(160),
    email: z.string().trim().email().max(160),
    department: z.string().trim().min(2).max(160),
  }),
  library: z.object({
    libraryName: z.string().trim().min(2).max(160),
    officeLocation: z.string().trim().min(2).max(160),
    dueDateReminders: z.boolean(),
    fineNotifications: z.boolean(),
  }),
});

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

function getAuditDetails(
  action: string,
  metadata: Record<string, unknown> | null
): string {
  if (!metadata) return action.replace(/[._]/g, " ");
  if (typeof metadata.details === "string") return metadata.details;

  const details = [action.replace(/[._]/g, " ")];
  if (typeof metadata.path === "string") details.push(metadata.path);
  if (typeof metadata.statusCode === "number") {
    details.push(`HTTP ${metadata.statusCode}`);
  }
  if (typeof metadata.recordsProcessed === "number") {
    details.push(`${metadata.recordsProcessed} records processed`);
  }
  if (typeof metadata.duration === "string") {
    details.push(`Duration ${metadata.duration}`);
  }
  return details.join(" · ");
}

function getAuditOutcome(
  action: string,
  metadata: Record<string, unknown> | null
): "Success" | "Warning" | "Failure" {
  if (metadata?.status === "Warning" || metadata?.status === "Failure") {
    return metadata.status;
  }
  if (/failed|blocked|reuse_detected/i.test(action)) return "Failure";
  return "Success";
}

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

  async createLibraryStaff(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const parsed = createLibraryStaffSchema.safeParse(req.body);
    if (!parsed.success) {
      next(
        new ApiError(
          400,
          "Enter a valid name, email, department, and password with at least 12 characters."
        )
      );
      return;
    }

    try {
      const user = await adminService.createLibraryStaff({
        ...parsed.data,
        email: parsed.data.email.toLowerCase(),
      });
      res.status(201).json(user);
    } catch (error) {
      if (
        (error instanceof Error && error.name === "DuplicateUserAccountError") ||
        isUniqueViolation(error)
      ) {
        next(new ApiError(409, "An account already exists for that email address."));
        return;
      }
      next(error);
    }
  }

  async updateUserStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const parsed = accountStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      next(new ApiError(400, "Account status must be Active or Inactive."));
      return;
    }
    const user = currentUser(res);
    if (!user) {
      next(new ApiError(401, "Authentication required."));
      return;
    }

    try {
      const updated = await adminService.updateUserStatus(
        req.params.id,
        parsed.data.status,
        user.id
      );
      if (!updated) {
        next(new ApiError(404, "Administrator or staff account not found."));
        return;
      }
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }

  async getSettings(_req: Request, res: Response, next: NextFunction): Promise<void> {
    const user = currentUser(res);
    if (!user) {
      next(new ApiError(401, "Authentication required."));
      return;
    }
    try {
      res.json(await adminService.getSettings(user.id));
    } catch (error) {
      next(error);
    }
  }

  async updateSettings(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const parsed = adminSettingsSchema.safeParse(req.body);
    if (!parsed.success) {
      next(new ApiError(400, "Enter valid administrator profile and library settings."));
      return;
    }
    const user = currentUser(res);
    if (!user) {
      next(new ApiError(401, "Authentication required."));
      return;
    }
    try {
      res.json(
        await adminService.updateSettings(user.id, {
          ...parsed.data,
          profile: {
            ...parsed.data.profile,
            email: parsed.data.profile.email.toLowerCase(),
          },
        })
      );
    } catch (error) {
      if (
        (error instanceof Error && error.name === "DuplicateUserEmailError") ||
        isUniqueViolation(error)
      ) {
        next(new ApiError(409, "That email address is already in use."));
        return;
      }
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

  async getAuditLogs(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rows = await findAuditLogs();
      res.json(
        rows.map((row) => ({
          id: row.id,
          timestamp: row.created_at.toISOString(),
          actor: row.actor_name ?? (row.actor_user_id ? "Unknown user" : "Unauthenticated"),
          actorRole: row.actor_role ?? "System",
          action: row.action,
          resource: row.entity_id
            ? `${row.entity_type} (${row.entity_id})`
            : row.entity_type,
          status: getAuditOutcome(row.action, row.metadata),
          ipAddress:
            typeof row.metadata?.ipAddress === "string"
              ? row.metadata.ipAddress
              : "—",
          details: getAuditDetails(row.action, row.metadata),
        }))
      );
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
