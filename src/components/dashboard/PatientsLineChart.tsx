"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface DataPoint {
  day: string;
  atendidos: number;
  cancelados: number;
  projected?: boolean;
}

interface PatientsLineChartProps {
  data: DataPoint[];
}

export function PatientsLineChart({ data }: PatientsLineChartProps) {
  return (
    <div className="bg-[#F6FFF8] rounded-xl p-6 shadow-sm border border-[#CCE3DE]">
      <h3 className="text-lg font-semibold text-[#2D3D35] mb-4">
        Pacientes últimos 7 días
      </h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#CCE3DE" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 12, fill: "#5C7A6B" }}
              axisLine={{ stroke: "#CCE3DE" }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#5C7A6B" }}
              axisLine={{ stroke: "#CCE3DE" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#F6FFF8",
                border: "1px solid #CCE3DE",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="atendidos"
              name="Pacientes Atendidos"
              stroke="#6B9080"
              strokeWidth={2}
              dot={{ fill: "#6B9080", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="cancelados"
              name="Citas Canceladas"
              stroke="#E07A5F"
              strokeWidth={2}
              dot={{ fill: "#E07A5F", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
            {/* Proyección para mañana - último punto con línea punteada */}
            <Line
              type="monotone"
              dataKey="proyeccion"
              name="Proyección Mañana"
              stroke="#6B9080"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: "#6B9080", strokeWidth: 2, r: 4 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
