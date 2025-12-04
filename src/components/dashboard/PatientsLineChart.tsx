"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  fullDate: string;
  atendidos: number;
  semanaAnterior: number;
  cancelados: number;
  isFuture: boolean;
}

interface WeeklyData {
  data: DataPoint[];
  dateRange: string;
  weekOffset: number;
  canGoNext: boolean;
  canGoPrev: boolean;
}

// Custom tooltip component
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: DataPoint }>;
  label?: string;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="bg-white p-3 rounded-lg shadow-lg border border-[#CCE3DE]">
      <p className="font-medium text-[#2D3D35] mb-2">{data.fullDate}</p>
      <div className="space-y-1 text-sm">
        <p className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#6B9080]" />
          <span className="text-[#5C7A6B]">Atendidos:</span>
          <span className="font-medium text-[#2D3D35]">{data.atendidos}</span>
        </p>
        <p className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#F5C842]" />
          <span className="text-[#5C7A6B]">Sem. anterior:</span>
          <span className="font-medium text-[#2D3D35]">{data.semanaAnterior}</span>
        </p>
        <p className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#E07A5F]" />
          <span className="text-[#5C7A6B]">Cancelados:</span>
          <span className="font-medium text-[#2D3D35]">{data.cancelados}</span>
        </p>
      </div>
    </div>
  );
}

export function PatientsLineChart() {
  const [weeklyData, setWeeklyData] = useState<WeeklyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);

  const loadData = useCallback(async (offset: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/dashboard/weekly-patients?weekOffset=${offset}`);
      if (response.ok) {
        const data = await response.json();
        setWeeklyData(data);
      }
    } catch (error) {
      console.error("Error fetching weekly data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(weekOffset);
  }, [weekOffset, loadData]);

  const handlePrevWeek = () => {
    setWeekOffset((prev) => prev - 1);
  };

  const handleNextWeek = () => {
    if (weeklyData?.canGoNext) {
      setWeekOffset((prev) => prev + 1);
    }
  };

  return (
    <div className="bg-[#F6FFF8] rounded-xl p-6 shadow-sm border border-[#CCE3DE]">
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[#2D3D35]">
          Pacientes por Semana
        </h3>
        <div className="flex items-center gap-2">
          {/* Date range */}
          <span className="text-sm text-[#5C7A6B] mr-2">
            {weeklyData?.dateRange || "..."}
          </span>
          {/* Navigation */}
          <button
            onClick={handlePrevWeek}
            className="p-1.5 rounded-lg hover:bg-[#CCE3DE] transition-colors"
            title="Semana anterior"
          >
            <ChevronLeft className="w-5 h-5 text-[#5C7A6B]" />
          </button>
          <button
            onClick={handleNextWeek}
            disabled={!weeklyData?.canGoNext}
            className={`p-1.5 rounded-lg transition-colors ${
              weeklyData?.canGoNext
                ? "hover:bg-[#CCE3DE] text-[#5C7A6B]"
                : "text-gray-300 cursor-not-allowed"
            }`}
            title="Semana siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[300px]">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#6B9080] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : weeklyData ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={weeklyData.data}
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
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: "10px" }}
                formatter={(value) => (
                  <span className="text-sm text-[#5C7A6B]">{value}</span>
                )}
              />
              {/* Previous week - dashed line for comparison */}
              <Line
                type="monotone"
                dataKey="semanaAnterior"
                name="Semana Anterior"
                stroke="#F5C842"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: "#F5C842", strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5 }}
              />
              {/* Current week - solid line (main) */}
              <Line
                type="monotone"
                dataKey="atendidos"
                name="Pacientes Atendidos"
                stroke="#6B9080"
                strokeWidth={2}
                dot={{ fill: "#6B9080", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
              {/* Cancellations */}
              <Line
                type="monotone"
                dataKey="cancelados"
                name="Cancelaciones"
                stroke="#E07A5F"
                strokeWidth={2}
                dot={{ fill: "#E07A5F", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-[#5C7A6B]">
            Error al cargar datos
          </div>
        )}
      </div>
    </div>
  );
}
