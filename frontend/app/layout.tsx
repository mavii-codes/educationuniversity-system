import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { AuthProvider } from "@/lib/auth";
import { LibraryStoreProvider } from "@/lib/library-store";
import { AppShell } from "@/components/layout/AppShell";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "University Data Integration System",
  description:
    "Securely connect, manage, and understand university data integrated with the Library Management System via REST API and ETL pipelines.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className="font-sans antialiased">
        <ToastProvider>
          <AuthProvider>
            <LibraryStoreProvider>
              <AppShell>{children}</AppShell>
            </LibraryStoreProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
