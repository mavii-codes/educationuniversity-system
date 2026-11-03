"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function AdminRootPage() {
  const router = useRouter();
  const { user, isAuthenticated, isInitializing } = useAuth();

  useEffect(() => {
    if (!isInitializing) {
      if (!isAuthenticated) {
        router.replace("/login");
      } else if (user?.role === "Student") {
        router.replace("/student/dashboard");
      } else {
        router.replace("/admin/dashboard");
      }
    }
  }, [isInitializing, isAuthenticated, user, router]);

  return null;
}
