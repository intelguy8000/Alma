"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Users, DollarSign, Receipt, TrendingUp, Calendar, ChevronDown } from "lucide-react";
import {
  Scorecard,
  PatientsLineChart,
  AppointmentsBarChart,
  UpcomingAppointments,
} from "@/components/dashboard";
import { formatCOP } from "@/lib/utils";
import { format, subDays, startOfYear, subMonths } from "date-fns";
import { es } from "date-fns/locale";

interface DashboardData {
  activePatients: number;
  activePatientsChange: number;
  totalSales: number;
  previousSales: number;
  salesChange: number;
  totalExpenses: number;
  previousExpenses: number;
  expensesChange: number;
  profit: number;
  profitChange: number;
  appointmentsData: {
    name: string;
    presenciales: number;
    virtuales: number;
    nuevos: number;
    antiguos: number;
    terapiaChoque: number;
  }[];
  patientsData: {
    day: string;
    atendidos: number;
    cancelados: number;
    proyeccion?: number;
  }[];
  upcomingAppointments: {
    id: string;
    time: string;
    patient: string;
    type: "presencial" | "virtual" | "terapia_choque";
    status: "confirmada" | "no_responde" | "cancelada" | "reagendada" | "completada";
  }[];
}

interface DateRange {
  startDate: Date;
  endDate: Date;
}

const presetRanges = [
  { label: "Última semana", value: "7d" },
  { label: "Último mes", value: "30d" },
  { label: "Últimos 3 meses", value: "90d" },
  { label: "Este año", value: "year" },
  { label: "Personalizado", value: "custom" },
];

// Helper to get dates from preset
function getDateRangeFromPreset(preset: string): DateRange {
  const today = new Date();
  switch (preset) {
    case "7d":
      return { startDate: subDays(today, 7), endDate: today };
    case "30d":
      return { startDate: subDays(today, 30), endDate: today };
    case "90d":
      return { startDate: subMonths(today, 3), endDate: today };
    case "year":
      return { startDate: startOfYear(today), endDate: today };
    default:
      return { startDate: subDays(today, 30), endDate: today };
  }
}

export default function DashboardPage() {
  const [selectedPreset, setSelectedPreset] = useState("30d");
  const [dateRange, setDateRange] = useState<DateRange>(getDateRangeFromPreset("30d"));
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setShowCustomPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();

      if (selectedPreset === "custom") {
        params.append("startDate", format(dateRange.startDate, "yyyy-MM-dd"));
        params.append("endDate", format(dateRange.endDate, "yyyy-MM-dd"));
      } else {
        params.append("range", selectedPreset);
      }

      const response = await fetch(`/api/dashboard?${params.toString()}`);
      if (response.ok) {
        const dashboardData = await response.json();
        setData(dashboardData);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPreset, dateRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePresetSelect = (preset: string) => {
    if (preset === "custom") {
      setShowCustomPicker(true);
    } else {
      setSelectedPreset(preset);
      setDateRange(getDateRangeFromPreset(preset));
      setShowDropdown(false);
      setShowCustomPicker(false);
    }
  };

  const handleCustomDateChange = (type: "start" | "end", value: string) => {
    const newDate = new Date(value);
    if (type === "start") {
      setDateRange(prev => ({ ...prev, startDate: newDate }));
    } else {
      setDateRange(prev => ({ ...prev, endDate: newDate }));
    }
  };

  const applyCustomRange = () => {
    setSelectedPreset("custom");
    setShowDropdown(false);
    setShowCustomPicker(false);
  };

  const getDisplayLabel = () => {
    if (selectedPreset === "custom") {
      return `${format(dateRange.startDate, "d MMM", { locale: es })} - ${format(dateRange.endDate, "d MMM yyyy", { locale: es })}`;
    }
    return presetRanges.find(r => r.value === selectedPreset)?.label || "";
  };

  const scorecardData = data ? [
    {
      title: "Pacientes Activos",
      value: data.activePatients.toString(),
      subtitle: getDisplayLabel(),
      change: data.activePatientsChange,
      icon: Users,
      iconColor: "bg-[#6B9080]",
      bgColor: "bg-[#CCE3DE]",
      textColor: "text-[#3D5A4C]",
    },
    {
      title: "Ventas",
      value: formatCOP(data.totalSales),
      subtitle: `vs ${formatCOP(data.previousSales)} anterior`,
      change: data.salesChange,
      icon: DollarSign,
      iconColor: "bg-[#84A98C]",
      bgColor: "bg-[#D8E2DC]",
      textColor: "text-[#3D5A4C]",
    },
    {
      title: "Gastos",
      value: formatCOP(data.totalExpenses),
      subtitle: `vs ${formatCOP(data.previousExpenses)} anterior`,
      change: data.expensesChange,
      icon: Receipt,
      iconColor: "bg-[#D4A574]",
      bgColor: "bg-[#F5E6D3]",
      textColor: "text-[#8B6914]",
    },
    {
      title: "Utilidad",
      value: formatCOP(data.profit),
      subtitle: "Ventas - Gastos",
      change: data.profitChange,
      icon: TrendingUp,
      iconColor: "bg-[#81C784]",
      bgColor: "bg-[#E8F5E9]",
      textColor: "text-[#2E7D32]",
    },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Page Header with Global Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2D3D35]">Dashboard</h1>
          <p className="text-[#5C7A6B] mt-1">
            Resumen general del consultorio
          </p>
        </div>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 bg-white border border-[#CCE3DE] rounded-lg px-3 py-2 shadow-sm hover:border-[#6B9080] transition-colors"
          >
            <Calendar className="w-4 h-4 text-[#6B9080]" />
            <span className="text-sm text-[#3D5A4C] font-medium">{getDisplayLabel()}</span>
            <ChevronDown className={`w-4 h-4 text-[#6B9080] transition-transform ${showDropdown ? "rotate-180" : ""}`} />
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 bg-white border border-[#CCE3DE] rounded-lg shadow-lg z-50 min-w-[200px]">
              {/* Preset options */}
              <div className="py-1">
                {presetRanges.map((range) => (
                  <button
                    key={range.value}
                    onClick={() => handlePresetSelect(range.value)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-[#F6FFF8] transition-colors ${
                      selectedPreset === range.value && range.value !== "custom"
                        ? "bg-[#CCE3DE] text-[#3D5A4C] font-medium"
                        : "text-[#5C7A6B]"
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>

              {/* Custom date picker */}
              {showCustomPicker && (
                <div className="border-t border-[#CCE3DE] p-4 space-y-3">
                  <div>
                    <label className="block text-xs text-[#5C7A6B] mb-1">Desde</label>
                    <input
                      type="date"
                      value={format(dateRange.startDate, "yyyy-MM-dd")}
                      onChange={(e) => handleCustomDateChange("start", e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-[#CCE3DE] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B9080] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#5C7A6B] mb-1">Hasta</label>
                    <input
                      type="date"
                      value={format(dateRange.endDate, "yyyy-MM-dd")}
                      onChange={(e) => handleCustomDateChange("end", e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-[#CCE3DE] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B9080] focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={applyCustomRange}
                    className="w-full py-2 bg-[#6B9080] text-white text-sm font-medium rounded-lg hover:bg-[#5a7a6d] transition-colors"
                  >
                    Aplicar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {/* Loading skeleton for scorecards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-[#CCE3DE]/30 rounded-xl animate-pulse" />
            ))}
          </div>
          {/* Loading skeleton for charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-[350px] bg-[#CCE3DE]/30 rounded-xl animate-pulse" />
            <div className="h-[350px] bg-[#CCE3DE]/30 rounded-xl animate-pulse" />
          </div>
        </div>
      ) : data && (
        <>
          {/* Scorecards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {scorecardData.map((card) => (
              <Scorecard
                key={card.title}
                title={card.title}
                value={card.value}
                subtitle={card.subtitle}
                change={card.change}
                icon={card.icon}
                iconColor={card.iconColor}
                bgColor={card.bgColor}
                textColor={card.textColor}
              />
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PatientsLineChart data={data.patientsData} />
            <AppointmentsBarChart data={data.appointmentsData} />
          </div>

          {/* Upcoming Appointments */}
          <UpcomingAppointments appointments={data.upcomingAppointments} />
        </>
      )}
    </div>
  );
}
