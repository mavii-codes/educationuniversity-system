import {
  BarChart3,
  Bell,
  BookMarked,
  BookOpen,
  Database,
  FileSpreadsheet,
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
  badge?: string;
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
    groupLabel: "Library Integration",
    items: [
      {
        label: "Library Integration",
        href: "/admin/library",
        icon: BookOpen,
      },
      {
        label: "Integrated Records",
        href: "/admin/library/records",
        icon: BookMarked,
      },
    ],
  },
  {
    groupLabel: "Data Management",
    items: [
      {
        label: "Data Sources",
        href: "/admin/data-sources",
        icon: Database,
      },
      {
        label: "Sync History",
        href: "/admin/sync-history",
        icon: History,
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
    groupLabel: "Analytics & Reports",
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
  if (pathname === item.href) return true;
  if (item.href === "/admin/library") {
    return pathname === "/admin/library";
  }
  return pathname.startsWith(`${item.href}/`);
}

export function getAdminPageMeta(pathname: string): {
  title: string;
  subtitle: string;
} {
  if (pathname === "/admin/dashboard") {
    return {
      title: "Admin Dashboard",
      subtitle: "1st Semester, AY 2026-2027 · University Library Data Integration Hub",
    };
  }
  if (pathname === "/admin/library") {
    return {
      title: "Library Integration",
      subtitle: "External Library Management System REST API & Circulation Ledger",
    };
  }
  if (pathname === "/admin/etl" || pathname === "/admin/integrations") {
    return {
      title: "Data Processing (ETL/ELT)",
      subtitle: "Automated 9-stage extraction, schema validation, deduplication, and student matching",
    };
  }
  if (pathname === "/admin/library/records") {
    return {
      title: "Integrated Library Records",
      subtitle: "Centralized university catalog, circulation holdings, and shelf locations",
    };
  }
  if (pathname === "/admin/data-sources") {
    return {
      title: "Data Sources",
      subtitle: "Configured Library Management System REST API connector",
    };
  }
  if (pathname === "/admin/sync-history") {
    return {
      title: "Synchronization History",
      subtitle: "Audit trail of scheduled and manual ETL synchronization batches for library data",
    };
  }
  if (pathname === "/admin/students") {
    return {
      title: "Students",
      subtitle: "Unified student master records matched with library borrower accounts",
    };
  }
  if (pathname.startsWith("/admin/students/")) {
    return {
      title: "Student Profile",
      subtitle: "Cross-system academic, attendance, library borrowing, and lifecycle record",
    };
  }
  if (pathname === "/admin/lifecycle") {
    return {
      title: "Student Lifecycle",
      subtitle: "Progression tracking from Admission to Enrollment, Learning, and Graduation",
    };
  }
  if (pathname === "/admin/analytics") {
    return {
      title: "Academic Analytics",
      subtitle: "Institutional enrollment, GPA performance, library correlation, and retention analytics",
    };
  }
  if (pathname === "/admin/reports") {
    return {
      title: "Reports",
      subtitle: "Library integration summaries, student borrower reports, and audit logs",
    };
  }
  if (pathname === "/admin/audit-logs") {
    return {
      title: "Audit Logs",
      subtitle: "System security, ETL data pipeline executions, and FERPA/GDPR compliance event log",
    };
  }
  if (pathname === "/admin/users") {
    return {
      title: "User Management",
      subtitle: "Manage administrative access, library data steward roles, and security policies",
    };
  }
  if (pathname === "/admin/notifications") {
    return {
      title: "Notifications",
      subtitle: "Library synchronization alerts, overdue warnings, and integration notices",
    };
  }
  if (pathname === "/admin/settings") {
    return {
      title: "Settings",
      subtitle: "Administrator profile, Library API credentials, data fabric policies, and privacy controls",
    };
  }
  return {
    title: "University Data Integration System",
    subtitle: "Admin Portal",
  };
}
