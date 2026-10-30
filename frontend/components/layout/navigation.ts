import {
  Award,
  BarChart3,
  Bell,
  Database,
  FileSpreadsheet,
  GitMerge,
  GraduationCap,
  LayoutDashboard,
  LucideIcon,
  Milestone,
  Settings,
  Users,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  aliases?: string[];
  icon: LucideIcon;
}

export interface NavGroup {
  groupLabel: string;
  items: NavItem[];
}

export const NAVIGATION_GROUPS: NavGroup[] = [
  {
    groupLabel: "OVERVIEW",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        aliases: ["/"],
        icon: LayoutDashboard,
      },
    ],
  },
  {
    groupLabel: "STUDENTS",
    items: [
      {
        label: "Students",
        href: "/students",
        icon: Users,
      },
      {
        label: "Student Lifecycle",
        href: "/lifecycle",
        aliases: ["/student-lifecycle"],
        icon: Milestone,
      },
    ],
  },
  {
    groupLabel: "DATA",
    items: [
      {
        label: "Data Sources",
        href: "/data-sources",
        icon: Database,
      },
      {
        label: "Data Integration",
        href: "/integration",
        aliases: ["/data-integration"],
        icon: GitMerge,
      },
    ],
  },
  {
    groupLabel: "ANALYTICS",
    items: [
      {
        label: "Academic Analytics",
        href: "/analytics",
        aliases: ["/academic-analytics"],
        icon: BarChart3,
      },
      {
        label: "Alumni",
        href: "/alumni",
        icon: Award,
      },
    ],
  },
  {
    groupLabel: "REPORTS",
    items: [
      {
        label: "Reports",
        href: "/reports",
        icon: FileSpreadsheet,
      },
    ],
  },
  {
    groupLabel: "SYSTEM",
    items: [
      {
        label: "Notifications",
        href: "/notifications",
        icon: Bell,
      },
      {
        label: "Settings",
        href: "/settings",
        icon: Settings,
      },
    ],
  },
];

export function isNavItemActive(pathname: string, item: NavItem): boolean {
  if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
    return true;
  }
  if (item.aliases?.includes(pathname)) {
    return true;
  }
  return false;
}

export function getPageMeta(pathname: string): { title: string; subtitle: string } {
  if (pathname === "/" || pathname === "/dashboard") {
    return {
      title: "Dashboard",
      subtitle: "1st Semester, AY 2026-2027 · Unified Campus Overview",
    };
  }
  if (pathname === "/students") {
    return {
      title: "Students",
      subtitle: "Unified student directory across SIS, LMS, and Campus Library",
    };
  }
  if (pathname.startsWith("/students/")) {
    return {
      title: "Student Profile",
      subtitle: "Cross-system academic, attendance, LMS, library, and lifecycle record",
    };
  }
  if (pathname === "/lifecycle" || pathname === "/student-lifecycle") {
    return {
      title: "Student Lifecycle",
      subtitle: "Institutional progression from admission to lifelong alumni",
    };
  }
  if (pathname === "/data-sources") {
    return {
      title: "Data Sources",
      subtitle: "Connected university platforms and synchronization status",
    };
  }
  if (pathname === "/integration" || pathname === "/data-integration") {
    return {
      title: "Data Integration",
      subtitle: "Unified data pipeline, schema resolution, and sync history",
    };
  }
  if (pathname === "/analytics" || pathname === "/academic-analytics") {
    return {
      title: "Academic Analytics",
      subtitle: "Campus-wide GPA, attendance, retention, and program outcomes",
    };
  }
  if (pathname === "/alumni") {
    return {
      title: "Alumni",
      subtitle: "Graduate career outcomes, industry placement, and directory",
    };
  }
  if (pathname === "/reports") {
    return {
      title: "Reports",
      subtitle: "Institutional reports, executive summaries, and data exports",
    };
  }
  if (pathname === "/notifications") {
    return {
      title: "Notifications",
      subtitle: "Synchronization alerts, duplicate warnings, and retention notices",
    };
  }
  if (pathname === "/settings") {
    return {
      title: "Settings",
      subtitle: "Platform configuration, sync schedules, and alert thresholds",
    };
  }
  return {
    title: "University DataHub",
    subtitle: "Unified Student Lifecycle & Academic Analytics",
  };
}

export { GraduationCap };
