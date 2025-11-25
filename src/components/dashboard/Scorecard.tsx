"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScorecardProps {
  title: string;
  value: string;
  subtitle: string;
  change: number;
  icon: LucideIcon;
  iconColor?: string;
  bgColor?: string;
  textColor?: string;
}

export function Scorecard({
  title,
  value,
  subtitle,
  change,
  icon: Icon,
  iconColor = "bg-[#6B9080]",
  bgColor = "bg-[#CCE3DE]",
  textColor = "text-[#3D5A4C]",
}: ScorecardProps) {
  const isPositive = change >= 0;

  return (
    <div className={cn("rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow", bgColor)}>
      <div className="flex items-center justify-between mb-3">
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            iconColor
          )}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span
          className={cn(
            "text-sm font-medium px-2 py-0.5 rounded-full",
            isPositive
              ? "text-[#2E7D32] bg-[#E8F5E9]"
              : "text-[#C65D3B] bg-[#FFE4D6]"
          )}
        >
          {isPositive ? "+" : ""}
          {change}%
        </span>
      </div>
      <div>
        <p className={cn("text-2xl font-bold", textColor)}>{value}</p>
        <p className={cn("text-sm", textColor, "opacity-80")}>{title}</p>
        <p className={cn("text-xs mt-1", textColor, "opacity-60")}>{subtitle}</p>
      </div>
    </div>
  );
}
