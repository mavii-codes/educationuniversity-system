"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { UserX } from "lucide-react";
import { getStudentById } from "@/lib/api";
import { Student } from "@/types";
import { StudentProfile } from "@/components/students/StudentProfile";
import { ProfileSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";

export default function AdminStudentProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const studentId = params?.id || "";

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadStudent = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getStudentById(studentId);
      setStudent(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadStudent();
  }, [loadStudent]);

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (error) {
    return (
      <ErrorState
        title="We couldn't load this student profile."
        description="Please try again in a moment."
        onRetry={loadStudent}
      />
    );
  }

  if (!student) {
    return (
      <EmptyState
        icon={UserX}
        title="Student record not found"
        description={`No unified student record matched ID "${studentId}".`}
        actionLabel="Return to Students Directory"
        onAction={() => router.push("/admin/students")}
      />
    );
  }

  return <StudentProfile student={student} />;
}

