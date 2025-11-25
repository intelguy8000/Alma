"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatCOP } from "@/lib/utils";
import type { ExpenseByCategory } from "@/types/pyg";

interface ExpensePieChartProps {
  data: ExpenseByCategory[];
}

const COLORS = [
  "#6B9080",
  "#84A98C",
  "#A4C3B2",
  "#CCE3DE",
  "#E07A5F",
  "#81C784",
];

export function ExpensePieChart({ data }: ExpensePieChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-[#F6FFF8] rounded-lg border border-[#CCE3DE] p-6 text-center h-[300px] flex items-center justify-center">
        <p className="text-[#5C7A6B]">No hay datos para mostrar</p>
      </div>
    );
  }

  const chartData = data.map((item) => ({
    name: item.label,
    value: item.amount,
  }));

  const CustomTooltip = ({ active, payload }: {
    active?: boolean;
    payload?: Array<{ name: string; value: number; payload: { name: string; value: number } }>;
  }) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      const total = data.reduce((sum, d) => sum + d.amount, 0);
      const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;

      return (
        <div className="bg-white border border-[#CCE3DE] rounded-lg shadow-lg p-3">
          <p className="font-semibold text-[#2D3D35]">{item.name}</p>
          <p className="text-sm text-[#C65D3B]">{formatCOP(item.value)}</p>
          <p className="text-xs text-[#5C7A6B]">{percentage}% del total</p>
        </div>
      );
    }
    return null;
  };

  const renderCustomizedLabel = (props: {
    cx?: number;
    cy?: number;
    midAngle?: number;
    innerRadius?: number;
    outerRadius?: number;
    percent?: number;
  }) => {
    const { cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, percent = 0 } = props;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null;

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="bg-[#F6FFF8] rounded-lg border border-[#CCE3DE] overflow-hidden">
      <div className="px-4 py-3 bg-[#CCE3DE]/30 border-b border-[#CCE3DE]">
        <h3 className="font-semibold text-[#2D3D35]">Distribución de Gastos</h3>
      </div>
      <div className="p-4">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{ paddingTop: 20 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
