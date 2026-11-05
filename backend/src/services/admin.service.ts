import crypto from "node:crypto";
import { env } from "../config/env";
import { seedDataset } from "../data/dataset";
import { ApiError } from "../middleware/error.middleware";
import { AdminUserModel, SyncHistoryModel } from "../models";
import * as adminRepository from "../repositories/admin.repository";
import { hashPassword } from "./auth.service";

export class AdminService {
  async getDashboardOverview(): Promise<Record<string, any>> {
    if (env.db.enabled) {
      return (await adminRepository.getDashboardOverview()) ?? {};
    }
    return seedDataset.adminDashboardOverview;
  }

  async getUsers(): Promise<AdminUserModel[]> {
    if (env.db.enabled) {
      return adminRepository.findUsers();
    }
    return seedDataset.adminUsers;
  }

  async createLibraryStaff(input: {
    name: string;
    email: string;
    password: string;
    department: string;
  }): Promise<AdminUserModel> {
    if (!env.db.enabled) {
      throw new ApiError(
        503,
        "Creating staff accounts requires PostgreSQL to be enabled."
      );
    }

    return adminRepository.createLibraryStaffUser({
      id: crypto.randomUUID().replace(/-/g, ""),
      name: input.name,
      email: input.email,
      passwordHash: hashPassword(input.password),
      department: input.department,
    });
  }

  async updateUserStatus(
    userId: string,
    status: AdminUserModel["status"],
    actorUserId: string
  ): Promise<AdminUserModel | null> {
    if (!env.db.enabled) {
      throw new ApiError(
        503,
        "Updating account status requires PostgreSQL to be enabled."
      );
    }
    if (userId === actorUserId && status === "Inactive") {
      throw new ApiError(400, "You cannot deactivate your own administrator account.");
    }
    return adminRepository.updateUserStatus(userId, status);
  }

  async getSettings(userId: string): Promise<adminRepository.AdminSettingsRecord> {
    if (!env.db.enabled) {
      throw new ApiError(503, "Administrator settings require PostgreSQL to be enabled.");
    }
    const settings = await adminRepository.findAdminSettings(userId);
    if (!settings) throw new ApiError(404, "Administrator account not found.");
    return settings;
  }

  async updateSettings(
    userId: string,
    settings: adminRepository.AdminSettingsRecord
  ): Promise<adminRepository.AdminSettingsRecord> {
    if (!env.db.enabled) {
      throw new ApiError(503, "Saving administrator settings requires PostgreSQL to be enabled.");
    }
    const updated = await adminRepository.updateAdminSettings(userId, settings);
    if (!updated) throw new ApiError(404, "Administrator account not found.");
    return updated;
  }

  async getSyncHistory(): Promise<SyncHistoryModel[]> {
    if (env.db.enabled) {
      return adminRepository.findSyncHistory();
    }
    return seedDataset.syncHistory;
  }
}

export const adminService = new AdminService();
