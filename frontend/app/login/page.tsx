import React from "react";
import {
  LoginBrandingPanel,
  LoginSubtleBackground,
} from "@/components/login/LoginBrandingPanel";
import { LoginFormCard } from "@/components/login/LoginFormCard";

export default function AdminLoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC] px-4 py-12 sm:px-6 lg:px-8">
      <LoginSubtleBackground />

      <div className="relative z-10 flex w-full max-w-[440px] flex-col items-center">
        <LoginBrandingPanel />
        <LoginFormCard />
      </div>
    </div>
  );
}
