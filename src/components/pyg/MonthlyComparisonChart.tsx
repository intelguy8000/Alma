"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatCOP } from "@/lib/utils";
import type { MonthlyData } from "@/types/pyg";

interface MonthlyComparisonChartProps {
  data: MonthlyData[];
}

export function MonthlyComparisonChart({ data }: MonthlyComparisonChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-[#F6FFF8] rounded-lg border border-[#CCE3DE] p-6 text-center h-[300px] flex items-center justify-center">
        <p className="text-[#5C7A6B]">No hay datos para mostrar</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ value: number; dataKey: string; color: string }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-[#CCE3DE] rounded-lg shadow-lg p-3">
          <p className="font-semibold text-[#2D3D35] mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey === "income" ? "Ingresos" : "Gastos"}: {formatCOP(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#F6FFF8] rounded-lg border border-[#CCE3DE] overflow-hidden">
      <div className="px-4 py-3 bg-[#CCE3DE]/30 border-b border-[#CCE3DE]">
        <h3 className="font-semibold text-[#2D3D35]">Ingresos vs Gastos (Últimos 6 meses)</h3>
      </div>
      <div className="p-4">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#CCE3DE" />
            <XAxis
              dataKey="monthLabel"
              tick={{ fill: "#5C7A6B", fontSize: 12 }}
              axisLine={{ stroke: "#CCE3DE" }}
            />
            <YAxis
              tick={{ fill: "#5C7A6B", fontSize: 12 }}
              axisLine={{ stroke: "#CCE3DE" }}
              tickFormatter={(value) => {
                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                return value;
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value) => (value === "income" ? "Ingresos" : "Gastos")}
              wrapperStyle={{ paddingTop: 10 }}
            />
            <Bar
              dataKey="income"
              fill="#2E7D32"
              radius={[4, 4, 0, 0]}
              name="income"
            />
            <Bar
              dataKey="expenses"
              fill="#C65D3B"
              radius={[4, 4, 0, 0]}
              name="expenses"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
