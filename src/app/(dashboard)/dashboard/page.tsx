"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, DollarSign, Receipt, TrendingUp, Calendar } from "lucide-react";
import {
  Scorecard,
  PatientsLineChart,
  AppointmentsBarChart,
  UpcomingAppointments,
} from "@/components/dashboard";
import { formatCOP } from "@/lib/utils";

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

const dateRanges = [
  { label: "Última semana", value: "7d" },
  { label: "Último mes", value: "30d" },
  { label: "Últimos 3 meses", value: "90d" },
  { label: "Este año", value: "year" },
];

// Mock data generator based on date range
function getMockData(range: string): DashboardData {
  // This would be replaced with actual API calls
  const multiplier = range === "7d" ? 0.25 : range === "30d" ? 1 : range === "90d" ? 3 : 12;

  return {
    activePatients: Math.round(248 * (range === "7d" ? 0.3 : range === "30d" ? 0.6 : range === "90d" ? 1 : 1.2)),
    activePatientsChange: 12.5,
    totalSales: Math.round(45231000 * multiplier),
    previousSales: Math.round(41200000 * multiplier),
    salesChange: 9.8,
    totalExpenses: Math.round(12450000 * multiplier),
    previousExpenses: Math.round(14100000 * multiplier),
    expensesChange: -11.7,
    profit: Math.round((45231000 - 12450000) * multiplier),
    profitChange: 21.2,
    appointmentsData: [
      { name: "Sem 1", presenciales: 45, virtuales: 20, nuevos: 12, antiguos: 53, terapiaChoque: 8 },
      { name: "Sem 2", presenciales: 52, virtuales: 25, nuevos: 15, antiguos: 62, terapiaChoque: 10 },
      { name: "Sem 3", presenciales: 48, virtuales: 28, nuevos: 10, antiguos: 66, terapiaChoque: 6 },
      { name: "Sem 4", presenciales: 55, virtuales: 30, nuevos: 18, antiguos: 67, terapiaChoque: 12 },
    ],
    patientsData: [
      { day: "Lun", atendidos: 12, cancelados: 2 },
      { day: "Mar", atendidos: 15, cancelados: 1 },
      { day: "Mié", atendidos: 18, cancelados: 3 },
      { day: "Jue", atendidos: 14, cancelados: 2 },
      { day: "Vie", atendidos: 20, cancelados: 1 },
      { day: "Sáb", atendidos: 8, cancelados: 0 },
      { day: "Dom", atendidos: 0, cancelados: 0 },
      { day: "Mañana", atendidos: 16, cancelados: 0, proyeccion: 16 },
    ],
    upcomingAppointments: [
      { id: "1", time: "09:00", patient: "María García López", type: "presencial", status: "confirmada" },
      { id: "2", time: "10:00", patient: "Carlos Rodríguez", type: "virtual", status: "confirmada" },
      { id: "3", time: "11:30", patient: "Ana Martínez", type: "terapia_choque", status: "no_responde" },
      { id: "4", time: "14:00", patient: "José Hernández", type: "presencial", status: "confirmada" },
      { id: "5", time: "15:30", patient: "Laura Sánchez Pérez", type: "virtual", status: "confirmada" },
      { id: "6", time: "17:00", patient: "Pedro González", type: "presencial", status: "reagendada" },
    ],
  };
}

export default function DashboardPage() {
  const [selectedRange, setSelectedRange] = useState("30d");
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300));
    setData(getMockData(selectedRange));
    setIsLoading(false);
  }, [selectedRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const scorecardData = data ? [
    {
      title: "Pacientes Activos",
      value: data.activePatients.toString(),
      subtitle: dateRanges.find(r => r.value === selectedRange)?.label || "",
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
        <div className="flex items-center gap-2 bg-white border border-[#CCE3DE] rounded-lg px-3 py-2 shadow-sm">
          <Calendar className="w-4 h-4 text-[#6B9080]" />
          <select
            value={selectedRange}
            onChange={(e) => setSelectedRange(e.target.value)}
            className="text-sm border-0 bg-transparent focus:outline-none focus:ring-0 text-[#3D5A4C] font-medium cursor-pointer"
          >
            {dateRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
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
