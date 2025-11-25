"use client";

import { useState, useEffect, useCallback } from "react";
import { DollarSign, TrendingDown, TrendingUp, Percent, FileDown, Calendar } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from "date-fns";
import { IncomeBreakdownTable } from "@/components/pyg/IncomeBreakdownTable";
import { ExpenseBreakdownTable } from "@/components/pyg/ExpenseBreakdownTable";
import { MonthlyComparisonChart } from "@/components/pyg/MonthlyComparisonChart";
import { ExpensePieChart } from "@/components/pyg/ExpensePieChart";
import { formatCOP } from "@/lib/utils";
import type { PygData, PeriodType } from "@/types/pyg";
import { periodOptions } from "@/types/pyg";

export default function PygPage() {
  const [data, setData] = useState<PygData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Period
  const [period, setPeriod] = useState<PeriodType>("current_month");
  const [customStartDate, setCustomStartDate] = useState(
    format(startOfMonth(new Date()), "yyyy-MM-dd")
  );
  const [customEndDate, setCustomEndDate] = useState(
    format(endOfMonth(new Date()), "yyyy-MM-dd")
  );

  const getDateRange = useCallback(() => {
    const now = new Date();

    switch (period) {
      case "current_month":
        return {
          start: format(startOfMonth(now), "yyyy-MM-dd"),
          end: format(endOfMonth(now), "yyyy-MM-dd"),
        };
      case "last_month":
        const lastMonth = subMonths(now, 1);
        return {
          start: format(startOfMonth(lastMonth), "yyyy-MM-dd"),
          end: format(endOfMonth(lastMonth), "yyyy-MM-dd"),
        };
      case "last_3_months":
        return {
          start: format(startOfMonth(subMonths(now, 2)), "yyyy-MM-dd"),
          end: format(endOfMonth(now), "yyyy-MM-dd"),
        };
      case "this_year":
        return {
          start: format(startOfYear(now), "yyyy-MM-dd"),
          end: format(endOfYear(now), "yyyy-MM-dd"),
        };
      case "custom":
        return {
          start: customStartDate,
          end: customEndDate,
        };
      default:
        return {
          start: format(startOfMonth(now), "yyyy-MM-dd"),
          end: format(endOfMonth(now), "yyyy-MM-dd"),
        };
    }
  }, [period, customStartDate, customEndDate]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { start, end } = getDateRange();
      const response = await fetch(`/api/pyg?startDate=${start}&endDate=${end}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error("Error fetching P&G data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [getDateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExportPDF = () => {
    // For now, just open print dialog
    window.print();
  };

  return (
    <div className="p-6 space-y-6 print:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-[#2D3D35]">P&G - Estado de Resultados</h1>
          <p className="text-[#5C7A6B]">Análisis de ingresos y gastos</p>
        </div>
        <button
          onClick={handleExportPDF}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#6B9080] text-white rounded-md hover:bg-[#5A7A6B] transition-colors"
        >
          <FileDown className="h-4 w-4" />
          Exportar PDF
        </button>
      </div>

      {/* Filters */}
      <div className="bg-[#F6FFF8] rounded-lg border border-[#CCE3DE] p-4 print:hidden">
        <div className="flex flex-wrap items-end gap-4">
          {/* Period Selector */}
          <div>
            <label className="block text-sm font-medium text-[#3D5A4C] mb-1">
              Período
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as PeriodType)}
              className="px-3 py-2 border border-[#CCE3DE] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#6B9080] text-[#2D3D35]"
            >
              {periodOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Date Range */}
          {period === "custom" && (
            <>
              <div>
                <label className="block text-sm font-medium text-[#3D5A4C] mb-1">
                  Desde
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5C7A6B]" />
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="pl-10 pr-3 py-2 border border-[#CCE3DE] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#6B9080] text-[#2D3D35]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#3D5A4C] mb-1">
                  Hasta
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5C7A6B]" />
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="pl-10 pr-3 py-2 border border-[#CCE3DE] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#6B9080] text-[#2D3D35]"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-[#CCE3DE]/30 rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-[#CCE3DE]/30 rounded-lg animate-pulse" />
            <div className="h-64 bg-[#CCE3DE]/30 rounded-lg animate-pulse" />
          </div>
        </div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Income */}
            <div className="bg-[#E8F5E9] rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-[#2E7D32] flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-[#2E7D32]">
                {formatCOP(data.summary.totalIncome)}
              </p>
              <p className="text-sm text-[#5C7A6B]">Ingresos totales</p>
            </div>

            {/* Total Expenses */}
            <div className="bg-[#FFEBEE] rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-[#C62828] flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-[#C62828]">
                {formatCOP(data.summary.totalExpenses)}
              </p>
              <p className="text-sm text-[#B71C1C]">Gastos totales</p>
            </div>

            {/* Net Profit */}
            <div className={`rounded-xl p-5 shadow-sm ${
              data.summary.netProfit >= 0 ? "bg-[#E8F5E9]" : "bg-[#FFEBEE]"
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  data.summary.netProfit >= 0 ? "bg-[#2E7D32]" : "bg-[#C62828]"
                }`}>
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className={`text-2xl font-bold ${
                data.summary.netProfit >= 0 ? "text-[#2E7D32]" : "text-[#C62828]"
              }`}>
                {formatCOP(data.summary.netProfit)}
              </p>
              <p className="text-sm text-[#5C7A6B]">Utilidad neta</p>
            </div>

            {/* Profit Margin */}
            <div className={`rounded-xl p-5 shadow-sm ${
              data.summary.profitMargin >= 0 ? "bg-[#CCE3DE]" : "bg-[#FFEBEE]"
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  data.summary.profitMargin >= 0 ? "bg-[#6B9080]" : "bg-[#C62828]"
                }`}>
                  <Percent className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className={`text-2xl font-bold ${
                data.summary.profitMargin >= 0 ? "text-[#3D5A4C]" : "text-[#C62828]"
              }`}>
                {data.summary.profitMargin.toFixed(1)}%
              </p>
              <p className="text-sm text-[#5C7A6B]">Margen de utilidad</p>
            </div>
          </div>

          {/* Breakdown Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <IncomeBreakdownTable
              data={data.incomeByType}
              total={data.summary.totalIncome}
            />
            <ExpenseBreakdownTable
              data={data.expensesByCategory}
              total={data.summary.totalExpenses}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MonthlyComparisonChart data={data.monthlyData} />
            <ExpensePieChart data={data.expensesByCategory} />
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-[#5C7A6B]">
          No hay datos disponibles
        </div>
      )}
    </div>
  );
}
