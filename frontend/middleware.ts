import { NextRequest, NextResponse } from "next/server";

const retiredUniversityModulePaths = [
  "/academic-analytics",
  "/admin/analytics",
  "/admin/data-sources",
  "/admin/integrations",
  "/admin/reports",
  "/admin/sync-history",
  "/analytics",
  "/dashboard",
  "/data-integration",
  "/data-sources",
  "/integration",
  "/lifecycle",
  "/notifications",
  "/reports",
  "/settings",
  "/student-lifecycle",
  "/students",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/registrar/login") {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  if (pathname.startsWith("/registrar")) {
    const destination =
      pathname === "/registrar/dashboard"
        ? "/staff/dashboard"
        : pathname.startsWith("/registrar/library")
          ? "/staff/books"
          : "/staff/dashboard";
    return NextResponse.redirect(new URL(destination, request.url));
  }
  if (pathname.startsWith("/admin/students/")) {
    return NextResponse.redirect(new URL("/admin/students", request.url));
  }

  const isRetiredModule = retiredUniversityModulePaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (!isRetiredModule) return NextResponse.next();

  const destination =
    pathname === "/students" || pathname.startsWith("/students/")
      ? `/admin${pathname}`
      : pathname === "/notifications"
        ? "/admin/notifications"
        : pathname === "/settings"
          ? "/admin/settings"
          : "/admin/dashboard";

  return NextResponse.redirect(new URL(destination, request.url));
}

export const config = {
  matcher: [
    "/registrar/:path*",
    "/admin/students/:path*",
    "/academic-analytics/:path*",
    "/admin/analytics/:path*",
    "/admin/data-sources/:path*",
    "/admin/integrations/:path*",
    "/admin/reports/:path*",
    "/admin/sync-history/:path*",
    "/analytics/:path*",
    "/dashboard/:path*",
    "/data-integration/:path*",
    "/data-sources/:path*",
    "/integration/:path*",
    "/lifecycle/:path*",
    "/notifications/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/student-lifecycle/:path*",
    "/students/:path*",
  ],
};
