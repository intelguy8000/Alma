"use client";

import { MobileMenuButton, useSidebar } from "./Sidebar";
import { cn } from "@/lib/utils";

export function Header() {
  const { isExpanded } = useSidebar();

  return (
    <header
      className={cn(
        "h-14 border-b border-gray-200 bg-white flex items-center px-4 lg:px-6 sticky top-0 z-30 transition-all duration-300",
        isExpanded ? "lg:ml-64" : "lg:ml-[72px]"
      )}
    >
      {/* Only show mobile menu button on mobile */}
      <MobileMenuButton />
    </header>
  );
}
