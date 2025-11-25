"use client";

import { formatCOP } from "@/lib/utils";
import type { IncomeByType } from "@/types/pyg";

interface IncomeBreakdownTableProps {
  data: IncomeByType[];
  total: number;
}

export function IncomeBreakdownTable({ data, total }: IncomeBreakdownTableProps) {
  if (data.length === 0) {
    return (
      <div className="bg-[#F6FFF8] rounded-lg border border-[#CCE3DE] p-6 text-center">
        <p className="text-[#5C7A6B]">No hay ingresos en este período</p>
      </div>
    );
  }

  return (
    <div className="bg-[#F6FFF8] rounded-lg border border-[#CCE3DE] overflow-hidden">
      <div className="px-4 py-3 bg-[#CCE3DE]/30 border-b border-[#CCE3DE]">
        <h3 className="font-semibold text-[#2D3D35]">Desglose de Ingresos</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#CCE3DE]">
              <th className="px-4 py-3 text-left text-sm font-medium text-[#3D5A4C]">Tipo de Cita</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-[#3D5A4C]">Cantidad</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-[#3D5A4C]">Monto</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-[#3D5A4C]">% del Total</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => {
              const percentage = total > 0 ? (item.amount / total) * 100 : 0;
              return (
                <tr
                  key={item.type}
                  className="border-b border-[#CCE3DE] last:border-0 hover:bg-[#CCE3DE]/20"
                >
                  <td className="px-4 py-3 text-sm text-[#2D3D35]">{item.label}</td>
                  <td className="px-4 py-3 text-sm text-[#5C7A6B] text-right">{item.count}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-[#2E7D32] text-right">
                    {formatCOP(item.amount)}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#5C7A6B] text-right">
                    {percentage.toFixed(1)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-[#E8F5E9]">
              <td className="px-4 py-3 text-sm font-semibold text-[#2D3D35]">Total</td>
              <td className="px-4 py-3 text-sm font-semibold text-[#2D3D35] text-right">
                {data.reduce((sum, item) => sum + item.count, 0)}
              </td>
              <td className="px-4 py-3 text-sm font-bold text-[#2E7D32] text-right">
                {formatCOP(total)}
              </td>
              <td className="px-4 py-3 text-sm font-semibold text-[#2D3D35] text-right">100%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
