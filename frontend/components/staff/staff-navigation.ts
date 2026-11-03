import {
  Bell,
  Bookmark,
  BookMarked,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Coins,
  History,
  LayoutDashboard,
  LucideIcon,
  RotateCcw,
  Search,
  Users,
} from "lucide-react";

export interface StaffNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badgeKey?: "pendingRequestsCount" | "overdueCount" | "pendingReturnsCount";
}

export interface StaffNavGroup {
  groupLabel: string;
  items: StaffNavItem[];
}

export const STAFF_NAVIGATION_GROUPS: StaffNavGroup[] = [
  {
    groupLabel: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/staff/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    groupLabel: "Library Operations",
    items: [
      {
        label: "Books Catalog",
        href: "/staff/books",
        icon: BookOpen,
      },
      {
        label: "Borrowing Requests",
        href: "/staff/requests",
        icon: BookMarked,
        badgeKey: "pendingRequestsCount",
      },
      {
        label: "Returns & Check-in",
        href: "/staff/returns",
        icon: RotateCcw,
      },
      {
        label: "Reservations",
        href: "/staff/reservations",
        icon: Bookmark,
      },
      {
        label: "Fines & Overdues",
        href: "/staff/fines",
        icon: Coins,
        badgeKey: "overdueCount",
      },
    ],
  },
  {
    groupLabel: "Students & Circulation",
    items: [
      {
        label: "Student Lookup",
        href: "/staff/students",
        icon: Users,
      },
      {
        label: "Notifications",
        href: "/staff/notifications",
        icon: Bell,
      },
    ],
  },
];

