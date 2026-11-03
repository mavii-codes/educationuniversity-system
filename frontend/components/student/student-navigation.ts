import {
  AlertCircle,
  Bell,
  BookMarked,
  BookOpen,
  Clock,
  Coins,
  History,
  LayoutDashboard,
  LucideIcon,
  User,
} from "lucide-react";

export interface StudentNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badgeKey?: "currentBorrowedCount" | "pendingRequestsCount" | "overdueBooksCount" | "unreadNotificationsCount";
}

export interface StudentNavGroup {
  groupLabel: string;
  items: StudentNavItem[];
}

export const STUDENT_NAVIGATION_GROUPS: StudentNavGroup[] = [
  {
    groupLabel: "Main",
    items: [
      {
        label: "Dashboard",
        href: "/student/dashboard",
        icon: LayoutDashboard,
      },
      {
        label: "Browse Catalog",
        href: "/student/books",
        icon: BookOpen,
      },
    ],
  },
  {
    groupLabel: "My Library Activity",
    items: [
      {
        label: "Borrowing & Requests",
        href: "/student/borrowing",
        icon: BookMarked,
        badgeKey: "currentBorrowedCount",
      },
      {
        label: "Borrowing History",
        href: "/student/history",
        icon: History,
      },
      {
        label: "Fines & Clearances",
        href: "/student/fines",
        icon: Coins,
        badgeKey: "overdueBooksCount",
      },
    ],
  },
  {
    groupLabel: "Account & Updates",
    items: [
      {
        label: "Notifications",
        href: "/student/notifications",
        icon: Bell,
        badgeKey: "unreadNotificationsCount",
      },
      {
        label: "Student Profile",
        href: "/student/profile",
        icon: User,
      },
    ],
  },
];

