import {
  BarChart3,
  Bell,
  Database,
  FileSpreadsheet,
  GitMerge,
  History,
  LayoutDashboard,
  LucideIcon,
  Milestone,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";

export interface AdminNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface AdminNavGroup {
  groupLabel: string;
  items: AdminNavItem[];
}

export const ADMIN_NAVIGATION_GROUPS: AdminNavGroup[] = [
  {
    groupLabel: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/admin/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    groupLabel: "Student Data",
    items: [
      {
        label: "Students",
        href: "/admin/students",
        icon: Users,
      },
      {
        label: "Student Lifecycle",
        href: "/admin/lifecycle",
        icon: Milestone,
      },
    ],
  },
  {
    groupLabel: "Data Integration",
    items: [
      {
        label: "Data Sources",
        href: "/admin/data-sources",
        icon: Database,
      },
      {
        label: "Integrations",
        href: "/admin/integrations",
        icon: GitMerge,
      },
      {
        label: "Sync History",
        href: "/admin/sync-history",
        icon: History,
      },
    ],
  },
  {
    groupLabel: "Analytics",
    items: [
      {
        label: "Academic Analytics",
        href: "/admin/analytics",
        icon: BarChart3,
      },
      {
        label: "Reports",
        href: "/admin/reports",
        icon: FileSpreadsheet,
      },
    ],
  },
  {
    groupLabel: "Administration",
    items: [
      {
        label: "User Management",
        href: "/admin/users",
        icon: ShieldCheck,
      },
      {
        label: "Notifications",
        href: "/admin/notifications",
        icon: Bell,
      },
      {
        label: "Settings",
        href: "/admin/settings",
        icon: Settings,
      },
    ],
  },
];

export function isAdminNavActive(pathname: string, item: AdminNavItem): boolean {
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function getAdminPageMeta(pathname: string): {
  title: string;
  subtitle: string;
} {
  if (pathname === "/admin/dashboard") {
    return {
      title: "Admin Dashboard",
      subtitle: "1st Semester, AY 2026-2027 · Institutional Data Integration Hub",
    };
  }
  if (pathname === "/admin/students") {
    return {
      title: "Students",
      subtitle: "Unified student master records across SIS, LMS, and Library",
    };
  }
  if (pathname.startsWith("/admin/students/")) {
    return {
      title: "Student Profile",
      subtitle: "Cross-system academic, attendance, LMS, library, and lifecycle record",
    };
  }
  if (pathname === "/admin/lifecycle") {
    return {
      title: "Student Lifecycle",
      subtitle: "Progression tracking from Enrollment through Learning, Graduation, and Alumni",
    };
  }
  if (pathname === "/admin/data-sources") {
    return {
      title: "Data Sources",
      subtitle: "Connected university systems, health indicators, and connector status",
    };
  }
  if (pathname === "/admin/integrations") {
    return {
      title: "Integrations",
      subtitle: "Unified campus data pipeline, schema mapping, and duplicate resolution",
    };
  }
  if (pathname === "/admin/sync-history") {
    return {
      title: "Sync History",
      subtitle: "Audit trail of scheduled and manual synchronization batches across all systems",
    };
  }
  if (pathname === "/admin/analytics") {
    return {
      title: "Academic Analytics",
      subtitle: "Institutional enrollment, GPA performance, graduation, and risk analytics",
    };
  }
  if (pathname === "/admin/reports") {
    return {
      title: "Reports",
      subtitle: "Executive summaries, institutional compliance exports, and audit reports",
    };
  }
  if (pathname === "/admin/users") {
    return {
      title: "User Management",
      subtitle: "Manage administrative access, data steward roles, and security policies",
    };
  }
  if (pathname === "/admin/notifications") {
    return {
      title: "Notifications",
      subtitle: "System synchronization alerts, identity warnings, and academic notices",
    };
  }
  if (pathname === "/admin/settings") {
    return {
      title: "Settings",
      subtitle: "Administrator profile, account preferences, security, and platform configuration",
    };
  }
  return {
    title: "University Data Integration System",
    subtitle: "Admin Portal",
  };
}

