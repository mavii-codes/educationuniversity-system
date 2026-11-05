import {
  Bell,
  BookMarked,
  BookOpen,
  LayoutDashboard,
  LucideIcon,
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
    groupLabel: "LIBRARY",
    items: [
      {
        label: "Dashboard",
        href: "/admin/dashboard",
        aliases: ["/"],
        icon: LayoutDashboard,
      },
      {
        label: "Library Management",
        href: "/admin/library",
        icon: BookOpen,
      },
      {
        label: "Catalog Records",
        href: "/admin/library/records",
        icon: BookMarked,
      },
      {
        label: "Borrower Accounts",
        href: "/admin/students",
        icon: Users,
      },
    ],
  },
  {
    groupLabel: "ACCOUNT",
    items: [
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

export function isNavItemActive(pathname: string, item: NavItem): boolean {
  if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
    return true;
  }
  return item.aliases?.includes(pathname) ?? false;
}

export function getPageMeta(pathname: string): {
  title: string;
  subtitle: string;
} {
  if (pathname === "/" || pathname === "/dashboard") {
    return {
      title: "Library Dashboard",
      subtitle: "A quick view of your catalog and circulation activity",
    };
  }
  if (pathname === "/students") {
    return {
      title: "Borrower Accounts",
      subtitle: "Manage library members and their borrower profiles",
    };
  }
  if (pathname.startsWith("/students/")) {
    return {
      title: "Borrower Profile",
      subtitle: "Library membership and circulation activity",
    };
  }
  if (pathname === "/reports") {
    return {
      title: "Library Reports",
      subtitle: "Reports for library operations and circulation",
    };
  }
  if (pathname === "/notifications") {
    return {
      title: "Notifications",
      subtitle: "Library updates, due-date reminders, and service notices",
    };
  }
  if (pathname === "/settings") {
    return {
      title: "Settings",
      subtitle: "Manage library system preferences and account security",
    };
  }
  return {
    title: "University Library Management System",
    subtitle: "Library Services",
  };
}

export { BookOpen };
