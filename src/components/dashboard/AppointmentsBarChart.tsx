"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Calendar } from "lucide-react";

interface DataPoint {
  name: string;
  presenciales: number;
  virtuales: number;
  nuevos: number;
  antiguos: number;
  terapiaChoque: number;
}

interface AppointmentsBarChartProps {
  data: DataPoint[];
}

const dateRanges = [
  { label: "Última semana", value: "7d" },
  { label: "Último mes", value: "30d" },
  { label: "Últimos 3 meses", value: "90d" },
  { label: "Este año", value: "year" },
];

export function AppointmentsBarChart({ data }: AppointmentsBarChartProps) {
  const [selectedRange, setSelectedRange] = useState("30d");

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Resumen de Citas
        </h3>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <select
            value={selectedRange}
            onChange={(e) => setSelectedRange(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            {dateRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: "#6b7280" }}
              axisLine={{ stroke: "#e5e7eb" }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#6b7280" }}
              axisLine={{ stroke: "#e5e7eb" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
            />
            <Legend />
            <Bar
              dataKey="presenciales"
              name="Presenciales"
              fill="#10B981"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="virtuales"
              name="Virtuales"
              fill="#3B82F6"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="nuevos"
              name="Pacientes Nuevos"
              fill="#8B5CF6"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="antiguos"
              name="Pacientes Antiguos"
              fill="#F59E0B"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="terapiaChoque"
              name="Terapia de Choque"
              fill="#EC4899"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
