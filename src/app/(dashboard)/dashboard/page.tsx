"use client";

import { Users, DollarSign, Receipt, TrendingUp } from "lucide-react";
import {
  Scorecard,
  PatientsLineChart,
  AppointmentsBarChart,
  UpcomingAppointments,
} from "@/components/dashboard";

// Mock data for scorecards
const scorecardData = [
  {
    title: "Pacientes Activos",
    value: "248",
    subtitle: "Últimos 90 días",
    change: 12.5,
    icon: Users,
    iconColor: "bg-blue-500",
  },
  {
    title: "Ventas del Mes",
    value: "$45,231",
    subtitle: "vs $41,200 mes anterior",
    change: 9.8,
    icon: DollarSign,
    iconColor: "bg-emerald-500",
  },
  {
    title: "Gastos del Mes",
    value: "$12,450",
    subtitle: "vs $14,100 mes anterior",
    change: -11.7,
    icon: Receipt,
    iconColor: "bg-amber-500",
  },
  {
    title: "Utilidad del Mes",
    value: "$32,781",
    subtitle: "Ventas - Gastos",
    change: 21.2,
    icon: TrendingUp,
    iconColor: "bg-violet-500",
  },
];

// Mock data for line chart (last 7 days + projection)
const lineChartData = [
  { day: "Lun", atendidos: 12, cancelados: 2 },
  { day: "Mar", atendidos: 15, cancelados: 1 },
  { day: "Mié", atendidos: 18, cancelados: 3 },
  { day: "Jue", atendidos: 14, cancelados: 2 },
  { day: "Vie", atendidos: 20, cancelados: 1 },
  { day: "Sáb", atendidos: 8, cancelados: 0 },
  { day: "Dom", atendidos: 0, cancelados: 0 },
  { day: "Mañana", atendidos: 16, cancelados: 0, proyeccion: 16 },
];

// Mock data for bar chart
const barChartData = [
  {
    name: "Semana 1",
    presenciales: 45,
    virtuales: 20,
    nuevos: 12,
    antiguos: 53,
    terapiaChoque: 8,
  },
  {
    name: "Semana 2",
    presenciales: 52,
    virtuales: 25,
    nuevos: 15,
    antiguos: 62,
    terapiaChoque: 10,
  },
  {
    name: "Semana 3",
    presenciales: 48,
    virtuales: 28,
    nuevos: 10,
    antiguos: 66,
    terapiaChoque: 6,
  },
  {
    name: "Semana 4",
    presenciales: 55,
    virtuales: 30,
    nuevos: 18,
    antiguos: 67,
    terapiaChoque: 12,
  },
];

// Mock data for upcoming appointments (tomorrow)
const upcomingAppointments = [
  {
    id: "1",
    time: "09:00",
    patient: "María García López",
    type: "presencial" as const,
    status: "confirmada" as const,
  },
  {
    id: "2",
    time: "10:00",
    patient: "Carlos Rodríguez",
    type: "virtual" as const,
    status: "confirmada" as const,
  },
  {
    id: "3",
    time: "11:30",
    patient: "Ana Martínez",
    type: "terapia_choque" as const,
    status: "no_responde" as const,
  },
  {
    id: "4",
    time: "14:00",
    patient: "José Hernández",
    type: "presencial" as const,
    status: "confirmada" as const,
  },
  {
    id: "5",
    time: "15:30",
    patient: "Laura Sánchez Pérez",
    type: "virtual" as const,
    status: "confirmada" as const,
  },
  {
    id: "6",
    time: "17:00",
    patient: "Pedro González",
    type: "presencial" as const,
    status: "reagendada" as const,
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Resumen general del consultorio
        </p>
      </div>

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
          />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PatientsLineChart data={lineChartData} />
        <AppointmentsBarChart data={barChartData} />
      </div>

      {/* Upcoming Appointments */}
      <UpcomingAppointments appointments={upcomingAppointments} />
    </div>
  );
}
