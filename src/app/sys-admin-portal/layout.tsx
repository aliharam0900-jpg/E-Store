import * as React from "react";
import type { Metadata } from "next";
import { AdminSidebar } from "@/components/admin/layout/admin-sidebar";
import { AdminHeader } from "@/components/admin/layout/admin-header";

export const metadata: Metadata = {
  title: "Admin Portal | Enterprise Control Plane",
  description: "Secure administrative management console",
  robots: "noindex, nofollow",
};

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex md:w-60 lg:w-64 shrink-0 flex-col h-screen sticky top-0">
        <AdminSidebar />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
