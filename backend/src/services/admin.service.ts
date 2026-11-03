import { env } from "../config/env";
import { seedDataset } from "../data/dataset";
import { AdminUserModel, SyncHistoryModel } from "../models";
import * as adminRepository from "../repositories/admin.repository";

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

  async getSyncHistory(): Promise<SyncHistoryModel[]> {
    if (env.db.enabled) {
      return adminRepository.findSyncHistory();
    }
    return seedDataset.syncHistory;
  }
}

export const adminService = new AdminService();
