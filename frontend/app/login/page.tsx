import React from "react";
import { LoginBrandingPanel } from "@/components/login/LoginBrandingPanel";
import { LoginFormCard } from "@/components/login/LoginFormCard";

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] lg:grid lg:grid-cols-12">
      {/* Left Branding & Architectural Visual */}
      <div className="lg:col-span-6 xl:col-span-6">
        <LoginBrandingPanel />
      </div>

      {/* Right Sign-In Card */}
      <div className="flex items-center justify-center px-4 py-10 sm:px-6 lg:col-span-6 lg:px-10 xl:col-span-6">
        <LoginFormCard />
      </div>
    </div>
  );
}

