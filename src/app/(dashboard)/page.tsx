"use client";

import { useSession } from "next-auth/react";
import {
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
} from "lucide-react";

const stats = [
  {
    name: "Citas Hoy",
    value: "12",
    change: "+2",
    icon: Calendar,
    color: "bg-blue-500",
  },
  {
    name: "Pacientes Activos",
    value: "248",
    change: "+12",
    icon: Users,
    color: "bg-emerald-500",
  },
  {
    name: "Ingresos del Mes",
    value: "$45,231",
    change: "+8.2%",
    icon: DollarSign,
    color: "bg-violet-500",
  },
  {
    name: "Tasa de Retención",
    value: "94%",
    change: "+2.1%",
    icon: TrendingUp,
    color: "bg-amber-500",
  },
];

export default function DashboardPage() {
  const { data: session } = useSession();

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bienvenido, {session?.user?.name?.split(" ")[0] || "Usuario"}
        </h1>
        <p className="text-gray-500 mt-1">
          Aquí está el resumen de tu consultorio
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium text-emerald-600">
                  {stat.change}
                </span>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.name}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Placeholder sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Próximas Citas
          </h2>
          <div className="text-gray-500 text-sm">
            Las citas de hoy aparecerán aquí...
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Actividad Reciente
          </h2>
          <div className="text-gray-500 text-sm">
            La actividad reciente aparecerá aquí...
          </div>
        </div>
      </div>
    </div>
  );
}
