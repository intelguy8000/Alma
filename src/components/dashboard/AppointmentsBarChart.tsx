"use client";

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

export function AppointmentsBarChart({ data }: AppointmentsBarChartProps) {
  return (
    <div className="bg-[#F6FFF8] rounded-xl p-6 shadow-sm border border-[#CCE3DE]">
      <h3 className="text-lg font-semibold text-[#2D3D35] mb-4">
        Resumen de Citas
      </h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#CCE3DE" />
            <XAxis
              dataKey="name"
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
            <Bar
              dataKey="antiguos"
              name="Pacientes Antiguos"
              fill="#D4A574"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="nuevos"
              name="Pacientes Nuevos"
              fill="#84A98C"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="presenciales"
              name="Presenciales"
              fill="#6B9080"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="terapiaChoque"
              name="Terapia de Choque"
              fill="#E07A5F"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="virtuales"
              name="Virtuales"
              fill="#A4C3B2"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
