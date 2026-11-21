import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { env } from "../config/env";
import { currentUser } from "../middleware/auth.middleware";
import { ApiError } from "../middleware/error.middleware";
import { adminService } from "../services/admin.service";
import {
  getAuditActionLabel,
  getAuditCategory,
  getAuditDetails,
  getAuditDetailsExtra,
  getAuditOutcome,
  getAuditResourceLabel,
} from "../services/audit-labels";
import { findAuditLogs } from "../repositories/audit.repository";

export { getAuditDetails, getAuditOutcome };

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

function getDemoAuditLogs() {
  const now = Date.now();
  const demoEvents = [
    {
      id: "aud-demo-001",
      offsetMinutes: 0,
      actor: "Administrator",
      actorRole: "System Administrator",
      action: "auth.login_succeeded",
      resource: "Admin Portal",
      status: "Success",
      ipAddress: "127.0.0.1",
      details: "Administrator signed in successfully.",
      category: "Authentication",
    },
    {
      id: "aud-demo-002",
      offsetMinutes: 18,
      actor: "Library ETL Service",
      actorRole: "System Service",
      action: "library.etl_synced",
      resource: "Library LMS Connector",
      status: "Success",
      ipAddress: "127.0.0.1",
      details: "Catalog synchronization completed in demo mode.",
      category: "Data Integration",
    },
    {
      id: "aud-demo-003",
      offsetMinutes: 45,
      actor: "Dr. Helena Mendoza",
      actorRole: "Library Staff",
      action: "library.book_updated",
      resource: "Library Catalog",
      status: "Success",
      ipAddress: "127.0.0.1",
      details: "Library catalog record updated.",
      category: "Library",
    },
    {
      id: "aud-demo-004",
      offsetMinutes: 120,
      actor: "Administrator",
      actorRole: "System Administrator",
      action: "admin.settings_updated",
      resource: "System Settings",
      status: "Success",
      ipAddress: "127.0.0.1",
      details: "Institution library settings reviewed.",
      category: "Administration",
    },
  ];

  return demoEvents.map((event) => ({
    id: event.id,
    timestamp: new Date(now - event.offsetMinutes * 60_000).toISOString(),
    actor: event.actor,
    actorRole: event.actorRole,
    action: event.action,
    resource: event.resource,
    status: event.status,
    ipAddress: event.ipAddress,
    details: event.details,
    actionLabel: getAuditActionLabel(
      event.action,
      { ipAddress: event.ipAddress },
      event.resource
    ),
    resourceLabel: getAuditResourceLabel(
      event.resource,
      undefined,
      { ipAddress: event.ipAddress }
    ),
    category: event.category,
    detailsExtra: event.details,
  }));
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
      if (!env.db.enabled) {
        res.json(getDemoAuditLogs());
        return;
      }
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
          actionLabel: getAuditActionLabel(
            row.action,
            row.metadata,
            row.entity_type
          ),
          resourceLabel: getAuditResourceLabel(
            row.entity_type,
            row.entity_id,
            row.metadata
          ),
          category: getAuditCategory(row.action, row.entity_type),
          detailsExtra: getAuditDetailsExtra(row.metadata),
        }))
      );
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
