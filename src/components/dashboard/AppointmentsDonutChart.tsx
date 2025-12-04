"use client";

import { useState, useEffect, useCallback } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { MapPin, Video, Zap, Calendar, PieChartIcon, TrendingUp } from "lucide-react";

interface WeeklyTrendData {
  week: string;
  weekLabel: string;
  presencial: number;
  virtual: number;
  normal: number;
  terapiaChoque: number;
}

interface DistributionData {
  byModality: {
    presencial: number;
    virtual: number;
    total: number;
    presencialPercent: number;
    virtualPercent: number;
  };
  byType: {
    normal: number;
    terapiaChoque: number;
    total: number;
    normalPercent: number;
    terapiaChoquePercent: number;
  };
  weeklyTrend: WeeklyTrendData[];
}

// Colors
const COLORS = {
  presencial: "#6B9080",
  virtual: "#5B8BD0",
  normal: "#6B9080",
  terapiaChoque: "#E07A5F",
};

// Custom tooltip for donut
interface DonutTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { percent: number } }>;
}

function DonutTooltip({ active, payload }: DonutTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0];
  return (
    <div className="bg-white p-2 rounded-lg shadow-lg border border-[#CCE3DE] text-sm">
      <p className="font-medium text-[#2D3D35]">{data.name}</p>
      <p className="text-[#5C7A6B]">
        {data.value} citas ({data.payload.percent}%)
      </p>
    </div>
  );
}

// Custom tooltip for trend line
interface TrendTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function TrendTooltip({ active, payload, label }: TrendTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white p-3 rounded-lg shadow-lg border border-[#CCE3DE] text-sm">
      <p className="font-medium text-[#2D3D35] mb-2">Semana del {label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-[#5C7A6B]">{entry.name}:</span>
          <span className="font-medium text-[#2D3D35]">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

// Center label component for donut
function CenterLabel({ total }: { total: number }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
      <span className="text-3xl font-bold text-[#2D3D35]">{total}</span>
      <span className="text-sm text-[#5C7A6B]">citas</span>
    </div>
  );
}

export function AppointmentsDonutChart() {
  const [data, setData] = useState<DistributionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"modality" | "type">("modality");
  const [viewMode, setViewMode] = useState<"donut" | "trend">("donut");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/dashboard/appointments-distribution");
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error("Error fetching distribution data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Prepare chart data based on active tab
  const donutData = activeTab === "modality"
    ? [
        { name: "Presencial", value: data?.byModality.presencial || 0, percent: data?.byModality.presencialPercent || 0, color: COLORS.presencial },
        { name: "Virtual", value: data?.byModality.virtual || 0, percent: data?.byModality.virtualPercent || 0, color: COLORS.virtual },
      ]
    : [
        { name: "Consulta Normal", value: data?.byType.normal || 0, percent: data?.byType.normalPercent || 0, color: COLORS.normal },
        { name: "Terapia de Choque", value: data?.byType.terapiaChoque || 0, percent: data?.byType.terapiaChoquePercent || 0, color: COLORS.terapiaChoque },
      ];

  const total = activeTab === "modality"
    ? (data?.byModality.total || 0)
    : (data?.byType.total || 0);

  const hasData = donutData.some(d => d.value > 0);
  const hasTrendData = data?.weeklyTrend && data.weeklyTrend.some(w =>
    (activeTab === "modality" ? (w.presencial > 0 || w.virtual > 0) : (w.normal > 0 || w.terapiaChoque > 0))
  );

  return (
    <div className="bg-[#F6FFF8] rounded-xl p-6 shadow-sm border border-[#CCE3DE]">
      {/* Header with tabs and view toggle */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[#2D3D35]">
          Distribución de Citas
        </h3>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex bg-[#CCE3DE]/30 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("donut")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "donut"
                  ? "bg-white text-[#2D3D35] shadow-sm"
                  : "text-[#5C7A6B] hover:text-[#2D3D35]"
              }`}
              title="Vista Donut"
            >
              <PieChartIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("trend")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "trend"
                  ? "bg-white text-[#2D3D35] shadow-sm"
                  : "text-[#5C7A6B] hover:text-[#2D3D35]"
              }`}
              title="Vista Tendencia"
            >
              <TrendingUp className="w-4 h-4" />
            </button>
          </div>
          {/* Category tabs */}
          <div className="flex bg-[#CCE3DE]/50 rounded-lg p-0.5">
            <button
              onClick={() => setActiveTab("modality")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === "modality"
                  ? "bg-white text-[#2D3D35] shadow-sm"
                  : "text-[#5C7A6B] hover:text-[#2D3D35]"
              }`}
            >
              Por Modalidad
            </button>
            <button
              onClick={() => setActiveTab("type")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === "type"
                  ? "bg-white text-[#2D3D35] shadow-sm"
                  : "text-[#5C7A6B] hover:text-[#2D3D35]"
              }`}
            >
              Por Tipo
            </button>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[220px] relative">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#6B9080] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : viewMode === "donut" ? (
          // Donut view
          !hasData ? (
            <div className="h-full flex flex-col items-center justify-center text-[#5C7A6B]">
              <Calendar className="w-12 h-12 mb-2 opacity-50" />
              <p>No hay citas registradas</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<DonutTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <CenterLabel total={total} />
            </>
          )
        ) : (
          // Trend line view
          !hasTrendData ? (
            <div className="h-full flex flex-col items-center justify-center text-[#5C7A6B]">
              <TrendingUp className="w-12 h-12 mb-2 opacity-50" />
              <p>No hay datos de tendencia</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data?.weeklyTrend}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#CCE3DE" />
                <XAxis
                  dataKey="weekLabel"
                  tick={{ fontSize: 11, fill: "#5C7A6B" }}
                  axisLine={{ stroke: "#CCE3DE" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#5C7A6B" }}
                  axisLine={{ stroke: "#CCE3DE" }}
                  allowDecimals={false}
                />
                <Tooltip content={<TrendTooltip />} />
                {activeTab === "modality" ? (
                  <>
                    <Line
                      type="monotone"
                      dataKey="presencial"
                      name="Presencial"
                      stroke={COLORS.presencial}
                      strokeWidth={2}
                      dot={{ fill: COLORS.presencial, strokeWidth: 2, r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="virtual"
                      name="Virtual"
                      stroke={COLORS.virtual}
                      strokeWidth={2}
                      dot={{ fill: COLORS.virtual, strokeWidth: 2, r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </>
                ) : (
                  <>
                    <Line
                      type="monotone"
                      dataKey="normal"
                      name="Normal"
                      stroke={COLORS.normal}
                      strokeWidth={2}
                      dot={{ fill: COLORS.normal, strokeWidth: 2, r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="terapiaChoque"
                      name="T. Choque"
                      stroke={COLORS.terapiaChoque}
                      strokeWidth={2}
                      dot={{ fill: COLORS.terapiaChoque, strokeWidth: 2, r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          )
        )}
      </div>

      {/* Legend */}
      {!isLoading && (hasData || hasTrendData) && (
        <div className="flex justify-center gap-6 mt-2">
          {activeTab === "modality" ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.presencial }} />
                <MapPin className="w-4 h-4 text-[#5C7A6B]" />
                <span className="text-sm text-[#5C7A6B]">
                  Presencial {viewMode === "donut" && `(${data?.byModality.presencial || 0})`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.virtual }} />
                <Video className="w-4 h-4 text-[#5C7A6B]" />
                <span className="text-sm text-[#5C7A6B]">
                  Virtual {viewMode === "donut" && `(${data?.byModality.virtual || 0})`}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.normal }} />
                <Calendar className="w-4 h-4 text-[#5C7A6B]" />
                <span className="text-sm text-[#5C7A6B]">
                  Normal {viewMode === "donut" && `(${data?.byType.normal || 0})`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.terapiaChoque }} />
                <Zap className="w-4 h-4 text-[#5C7A6B]" />
                <span className="text-sm text-[#5C7A6B]">
                  T. Choque {viewMode === "donut" && `(${data?.byType.terapiaChoque || 0})`}
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Period indicator */}
      <p className="text-xs text-center text-[#5C7A6B]/70 mt-3">
        {viewMode === "donut" ? "Acumulado histórico" : "Últimas 8 semanas"}
      </p>
    </div>
  );
}
