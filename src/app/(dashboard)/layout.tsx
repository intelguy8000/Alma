"use client";

import { Sidebar, SidebarProvider, MobileMenuButton, useSidebar, InactivityTimeout } from "@/components/layout";
import TabataChat from "@/components/chat/TabataChat";
import { cn } from "@/lib/utils";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isExpanded } = useSidebar();

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      {/* Mobile menu button - only visible on mobile */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <MobileMenuButton />
      </div>
      <div
        className={cn(
          "flex flex-col min-h-screen transition-all duration-300",
          isExpanded ? "lg:ml-64" : "lg:ml-[72px]"
        )}
      >
        <main className="flex-1 p-4 pt-16 lg:p-6 lg:pt-6">{children}</main>
      </div>
      <TabataChat />
      <InactivityTimeout />
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <DashboardContent>{children}</DashboardContent>
    </SidebarProvider>
  );
}
