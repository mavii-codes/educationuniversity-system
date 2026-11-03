import { env } from "../config/env";
import { seedDataset } from "../data/dataset";
import { CourseModel, LifecycleStageModel, ProgramModel, ReportModel } from "../models";
import * as analyticsRepository from "../repositories/analytics.repository";
import * as studentRepository from "../repositories/student.repository";

export class AnalyticsService {
  async getAnalytics(): Promise<{
    programs: ProgramModel[];
    atRiskStudents: Awaited<ReturnType<typeof studentRepository.findAtRisk>>;
    analytics: Record<string, any>;
  }> {
    if (env.db.enabled) {
      const [programs, atRiskStudents, analytics] = await Promise.all([
        analyticsRepository.findPrograms(),
        studentRepository.findAtRisk(),
        analyticsRepository.getSnapshot("dashboard_analytics"),
      ]);
      return { programs, atRiskStudents, analytics: analytics ?? {} };
    }

    return {
      programs: seedDataset.programs,
      atRiskStudents: seedDataset.students.filter(
        (student) => student.riskLevel === "High" || student.riskLevel === "Medium"
      ),
      analytics: seedDataset.dashboardAnalytics,
    };
  }

  async getDashboard(): Promise<{
    analytics: Record<string, any>;
    recentActivity: Awaited<ReturnType<typeof analyticsRepository.findRecentActivity>>;
  }> {
    if (env.db.enabled) {
      const [analytics, recentActivity] = await Promise.all([
        analyticsRepository.getSnapshot("dashboard_analytics"),
        analyticsRepository.findRecentActivity(),
      ]);
      return { analytics: analytics ?? {}, recentActivity };
    }

    return {
      analytics: seedDataset.dashboardAnalytics,
      recentActivity: seedDataset.activityFeed,
    };
  }

  async getLifecycle(): Promise<{
    overviewStats: Awaited<ReturnType<typeof analyticsRepository.findLifecycleOverviewStats>>;
    stages: LifecycleStageModel[];
  }> {
    if (env.db.enabled) {
      const [overviewStats, stages] = await Promise.all([
        analyticsRepository.findLifecycleOverviewStats(),
        analyticsRepository.findLifecycleStages(),
      ]);
      return { overviewStats, stages };
    }

    return {
      overviewStats: seedDataset.lifecycleOverviewStats,
      stages: seedDataset.lifecycleStages,
    };
  }

  async getPrograms(): Promise<ProgramModel[]> {
    if (env.db.enabled) {
      return analyticsRepository.findPrograms();
    }
    return seedDataset.programs;
  }

  async getCourses(): Promise<CourseModel[]> {
    if (env.db.enabled) {
      return analyticsRepository.findCourses();
    }
    return seedDataset.courses;
  }

  async getReports(): Promise<ReportModel[]> {
    if (env.db.enabled) {
      return analyticsRepository.findReports();
    }
    return seedDataset.reports;
  }
}

export const analyticsService = new AnalyticsService();
