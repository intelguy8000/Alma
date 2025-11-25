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
}

export function Scorecard({
  title,
  value,
  subtitle,
  change,
  icon: Icon,
  iconColor = "bg-emerald-500",
}: ScorecardProps) {
  const isPositive = change >= 0;

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
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
              ? "text-emerald-700 bg-emerald-50"
              : "text-red-700 bg-red-50"
          )}
        >
          {isPositive ? "+" : ""}
          {change}%
        </span>
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
      </div>
    </div>
  );
}
