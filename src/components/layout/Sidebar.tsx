"use client";

import { useState, createContext, useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  DollarSign,
  Receipt,
  Truck,
  Package,
  Users,
  TrendingUp,
  Plug,
  UserCog,
  Settings,
  ChevronLeft,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarContextType {
  isExpanded: boolean;
  setIsExpanded: (value: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (value: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <SidebarContext.Provider
      value={{ isExpanded, setIsExpanded, isMobileOpen, setIsMobileOpen }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

const menuItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Calendario", href: "/calendario", icon: Calendar },
  { name: "Citas", href: "/citas", icon: ClipboardList },
  { name: "Ventas", href: "/ventas", icon: DollarSign },
  { name: "Compras & Gastos", href: "/gastos", icon: Receipt },
  { name: "Proveedores", href: "/proveedores", icon: Truck },
  { name: "Inventario", href: "/inventario", icon: Package },
  { name: "Pacientes", href: "/pacientes", icon: Users },
  { name: "P&G", href: "/reportes", icon: TrendingUp },
  { name: "Integraciones", href: "/integraciones", icon: Plug },
  { name: "Usuarios", href: "/usuarios", icon: UserCog },
  { name: "Configuración", href: "/configuracion", icon: Settings },
];

function SidebarContent() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { isExpanded, setIsExpanded, setIsMobileOpen } = useSidebar();

  const handleLinkClick = () => {
    setIsMobileOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#0f0f0f] text-white">
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          <span
            className={cn(
              "font-semibold text-base whitespace-nowrap transition-all duration-300",
              isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"
            )}
          >
            Medicina del Alma
          </span>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="hidden lg:flex p-1.5 rounded-lg hover:bg-white/10 transition-colors"
        >
          <ChevronLeft
            className={cn(
              "w-5 h-5 transition-transform duration-300",
              !isExpanded && "rotate-180"
            )}
          />
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  onClick={handleLinkClick}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                    isActive
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-500 rounded-r-full" />
                  )}
                  <Icon
                    className={cn(
                      "w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110",
                      isActive && "text-emerald-400"
                    )}
                  />
                  <span
                    className={cn(
                      "whitespace-nowrap transition-all duration-300",
                      isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"
                    )}
                  >
                    {item.name}
                  </span>
                  {!isExpanded && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg">
                      {item.name}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="border-t border-white/10 p-3">
        <div
          className={cn(
            "flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer",
            !isExpanded && "justify-center"
          )}
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-medium text-sm">
              {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
            </span>
          </div>
          <div
            className={cn(
              "flex-1 overflow-hidden transition-all duration-300",
              isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"
            )}
          >
            <p className="text-sm font-medium text-white truncate">
              {session?.user?.name || "Usuario"}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {session?.user?.role || "admin"}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className={cn(
            "flex items-center gap-3 w-full mt-2 p-2 rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors",
            !isExpanded && "justify-center"
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span
            className={cn(
              "whitespace-nowrap transition-all duration-300",
              isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"
            )}
          >
            Cerrar sesión
          </span>
        </button>
      </div>
    </div>
  );
}

export function Sidebar() {
  const { isExpanded, isMobileOpen, setIsMobileOpen } = useSidebar();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col fixed left-0 top-0 h-screen z-40 transition-all duration-300 ease-in-out",
          isExpanded ? "w-64" : "w-[72px]"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen w-64 z-50 lg:hidden transition-transform duration-300 ease-in-out",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={() => setIsMobileOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 text-white z-10"
        >
          <X className="w-5 h-5" />
        </button>
        <SidebarContent />
      </aside>
    </>
  );
}

export function MobileMenuButton() {
  const { setIsMobileOpen } = useSidebar();

  return (
    <button
      onClick={() => setIsMobileOpen(true)}
      className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
    >
      <Menu className="w-6 h-6" />
    </button>
  );
}
