import { env } from "../config/env";
import { seedDataset } from "../data/dataset";
import {
  CourseModel,
  LifecycleStageModel,
  ProgramModel,
  ReportModel,
} from "../models";
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
        (student) =>
          student.riskLevel === "High" || student.riskLevel === "Medium"
      ),
      analytics: seedDataset.dashboardAnalytics,
    };
  }

  async getDashboard(): Promise<{
    analytics: Record<string, any>;
    recentActivity: Awaited<
      ReturnType<typeof analyticsRepository.findRecentActivity>
    >;
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
    overviewStats: Awaited<
      ReturnType<typeof analyticsRepository.findLifecycleOverviewStats>
    >;
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

  async getDashboardMetrics() {
    return {
      summary: {
        totalStudents: 5240,
        activeStudents: 4820,
        atRiskStudents: 142,
        facultyStaff: 386,
        graduates: 850,
        libraryHoldings: 14850,
        studentBorrowers: 3420,
      },
      campusAverageGpa: 3.31,
      passingRate: 94.2,
      failingRate: 5.8,
      attendanceRate: 92.4,
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

  async getReportsCatalog() {
    return [
      {
        id: "rep-enrollment",
        title: "Student Enrollment Report",
        category: "Enrollment",
      },
      {
        id: "rep-performance",
        title: "Academic Performance Report",
        category: "Academic",
      },
      {
        id: "rep-attendance",
        title: "Attendance Report",
        category: "Attendance",
      },
      {
        id: "rep-risk",
        title: "At-Risk Student Report",
        category: "Retention",
      },
      {
        id: "rep-graduation",
        title: "Graduation Report",
        category: "Graduation",
      },
      {
        id: "rep-library-circulation",
        title: "Library Circulation & Borrowing Report",
        category: "Library",
      },
      {
        id: "rep-integration",
        title: "Data Integration Report",
        category: "Integration",
      },
    ];
  }
}

export const analyticsService = new AnalyticsService();
