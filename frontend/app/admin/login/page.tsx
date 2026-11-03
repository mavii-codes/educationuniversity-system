import React from "react";
import { StudentLoginBackground } from "@/components/login/StudentLoginBackground";
import { AdminBrandShowcase } from "@/components/login/AdminBrandShowcase";
import { AdminLoginFormCard } from "@/components/login/AdminLoginFormCard";

export default function AdminLoginPage() {
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center bg-[#F8FAFC] px-4 py-8 sm:px-6 sm:py-12 lg:px-8 overflow-x-hidden">
      {/* Subtle creative background composition */}
      <StudentLoginBackground />

      {/* Responsive two-column administrative portal layout */}
      <div className="relative z-10 mx-auto w-full max-w-5xl">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
          {/* Left Column: Library Administration Experience */}
          <div className="w-full lg:col-span-7">
            <AdminBrandShowcase />
          </div>

          {/* Right Column: Elevated Login Card */}
          <div className="flex w-full justify-center lg:col-span-5 lg:justify-end">
            <AdminLoginFormCard />
          </div>
        </div>
      </div>
    </main>
  );
}
