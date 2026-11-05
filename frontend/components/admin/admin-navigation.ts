import {
  Bell,
  BookMarked,
  BookOpen,
  FileClock,
  LayoutDashboard,
  LucideIcon,
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

const ADMIN_NAVIGATION_GROUPS: AdminNavGroup[] = [
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
    groupLabel: "Library",
    items: [
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
    ],
  },
  {
    groupLabel: "Members",
    items: [
      {
        label: "Borrower Accounts",
        href: "/admin/students",
        icon: Users,
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
        label: "Audit Logs",
        href: "/admin/audit-logs",
        icon: FileClock,
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

export function getAdminNavigationGroups(isLibraryStaff = false): AdminNavGroup[] {
  const groups = isLibraryStaff
    ? ADMIN_NAVIGATION_GROUPS.filter(
        (group) => group.groupLabel === "Overview" || group.groupLabel === "Library"
      )
    : ADMIN_NAVIGATION_GROUPS;

  return groups.map((group) => ({
    ...group,
    items: group.items.map((item) => {
      if (!isLibraryStaff) return item;
      if (item.href === "/admin/dashboard") {
        return { ...item, href: "/staff/dashboard" };
      }
      if (item.href === "/admin/library") {
        return { ...item, href: "/staff/books" };
      }
      if (item.href === "/admin/library/records") {
        return { ...item, href: "/staff/books" };
      }
      return item;
    }),
  }));
}

export function isAdminNavActive(pathname: string, item: AdminNavItem): boolean {
  if (pathname === item.href) return true;
  if (item.href === "/admin/library" || item.href === "/staff/books") {
    return pathname === item.href;
  }
  return pathname.startsWith(`${item.href}/`);
}

export function getAdminPageMeta(pathname: string): {
  title: string;
  subtitle: string;
} {
  if (pathname === "/admin/dashboard" || pathname === "/staff/dashboard") {
    return {
      title: "Library Dashboard",
      subtitle: "A quick view of your catalog and circulation activity",
    };
  }
  if (pathname === "/admin/library" || pathname === "/staff/books") {
    return {
      title: "Library Management",
      subtitle: "Manage the catalog, borrowing, returns, reservations, and fines",
    };
  }
  if (
    pathname === "/admin/library/records" ||
    pathname === "/staff/books"
  ) {
    return {
      title: "Catalog Records",
      subtitle: "Search and manage library titles, copies, and availability",
    };
  }
  if (pathname === "/admin/students") {
    return {
      title: "Borrower Accounts",
      subtitle: "Manage student library members and their borrower profiles",
    };
  }
  if (pathname.startsWith("/admin/students/")) {
    return {
      title: "Borrower Profile",
      subtitle: "Library membership and circulation activity",
    };
  }
  if (pathname === "/admin/audit-logs") {
    return {
      title: "Audit Logs",
      subtitle: "Review account and library activity",
    };
  }
  if (pathname === "/admin/users") {
    return {
      title: "User Management",
      subtitle: "Manage library staff access and account roles",
    };
  }
  if (pathname === "/admin/notifications") {
    return {
      title: "Notifications",
      subtitle: "Library updates, due-date reminders, and service notices",
    };
  }
  if (pathname === "/admin/settings") {
    return {
      title: "Settings",
      subtitle: "Manage your library system preferences and account security",
    };
  }
  return {
    title: "University Library Management System",
    subtitle: "Library Administration",
  };
}
