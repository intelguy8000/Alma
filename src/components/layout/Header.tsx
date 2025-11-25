"use client";

import { useSession } from "next-auth/react";
import { Bell, Search } from "lucide-react";
import { MobileMenuButton, useSidebar } from "./Sidebar";
import { cn } from "@/lib/utils";

export function Header() {
  const { data: session } = useSession();
  const { isExpanded } = useSidebar();

  return (
    <header
      className={cn(
        "h-16 border-b border-gray-200 bg-white flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 transition-all duration-300",
        isExpanded ? "lg:ml-64" : "lg:ml-[72px]"
      )}
    >
      <div className="flex items-center gap-4">
        <MobileMenuButton />

        {/* Search */}
        <div className="hidden sm:flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 w-64 lg:w-80">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar..."
            className="bg-transparent border-none outline-none text-sm w-full placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full" />
        </button>

        {/* User info - visible on desktop */}
        <div className="hidden md:flex items-center gap-3 pl-3 border-l border-gray-200">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">
              {session?.user?.name || "Usuario"}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {session?.user?.role || "admin"}
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
            <span className="text-white font-medium text-sm">
              {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
