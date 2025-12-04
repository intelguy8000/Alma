"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScorecardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  iconColor?: string;
  bgColor?: string;
  textColor?: string;
  onClick?: () => void;
  clickable?: boolean;
}

export function Scorecard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "bg-[#6B9080]",
  bgColor = "bg-[#CCE3DE]",
  textColor = "text-[#3D5A4C]",
  onClick,
  clickable = false,
}: ScorecardProps) {
  const Component = clickable ? "button" : "div";

  return (
    <Component
      onClick={onClick}
      className={cn(
        "rounded-xl p-5 shadow-sm hover:shadow-md transition-all text-left w-full",
        bgColor,
        clickable && "cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            iconColor
          )}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        {clickable && (
          <span className={cn("text-xs px-2 py-0.5 rounded-full", textColor, "bg-white/50")}>
            Ver detalle
          </span>
        )}
      </div>
      <div>
        <p className={cn("text-2xl font-bold", textColor)}>{value}</p>
        <p className={cn("text-sm", textColor, "opacity-80")}>{title}</p>
        <p className={cn("text-xs mt-1", textColor, "opacity-60")}>{subtitle}</p>
      </div>
    </Component>
  );
}
