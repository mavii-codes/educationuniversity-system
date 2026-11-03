import {
  AlertCircle,
  Bell,
  Bookmark,
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
  badgeKey?:
    | "currentBorrowedCount"
    | "pendingRequestsCount"
    | "activeReservationsCount"
    | "overdueBooksCount"
    | "unreadNotificationsCount";
}

export interface StudentNavGroup {
  groupLabel: string;
  items: StudentNavItem[];
}

export const STUDENT_NAVIGATION_GROUPS: StudentNavGroup[] = [
  {
    groupLabel: "Library Overview",
    items: [
      {
        label: "Dashboard",
        href: "/student/dashboard",
        icon: LayoutDashboard,
      },
      {
        label: "Browse Books",
        href: "/student/books",
        icon: BookOpen,
      },
    ],
  },
  {
    groupLabel: "Circulation & Loans",
    items: [
      {
        label: "Borrowing Requests",
        href: "/student/borrowing?tab=requests",
        icon: Clock,
        badgeKey: "pendingRequestsCount",
      },
      {
        label: "My Borrowed Books",
        href: "/student/borrowing?tab=current",
        icon: BookMarked,
        badgeKey: "currentBorrowedCount",
      },
      {
        label: "Reservations",
        href: "/student/borrowing?tab=reservations",
        icon: Bookmark,
        badgeKey: "activeReservationsCount",
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
    groupLabel: "Member Account",
    items: [
      {
        label: "Notifications",
        href: "/student/notifications",
        icon: Bell,
        badgeKey: "unreadNotificationsCount",
      },
      {
        label: "Profile",
        href: "/student/profile",
        icon: User,
      },
    ],
  },
];
