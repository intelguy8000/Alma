"use client";

import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { formatCOP } from "@/lib/utils";
import { parseLocalDate } from "@/lib/dates";
import type { Expense } from "@/types/expenses";
import { categoryLabels } from "@/types/expenses";

interface ExpensesTableProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (expenseId: string) => void;
  isLoading?: boolean;
}

function ActionMenu({
  expense,
  onEdit,
  onDelete,
}: {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (expenseId: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowDeleteConfirm(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete(expense.id);
      setShowDeleteConfirm(false);
      setIsOpen(false);
    } else {
      setShowDeleteConfirm(true);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 hover:bg-[#CCE3DE] rounded-md transition-colors"
      >
        <MoreHorizontal className="h-5 w-5 text-[#5C7A6B]" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-[#F6FFF8] border border-[#CCE3DE] rounded-md shadow-lg z-10">
          <button
            onClick={() => {
              onEdit(expense);
              setIsOpen(false);
            }}
            className="w-full px-3 py-2 text-left text-sm hover:bg-[#CCE3DE]/50 flex items-center gap-2 text-[#3D5A4C]"
          >
            <Pencil className="h-4 w-4" />
            Editar
          </button>
          <hr className="my-1 border-[#CCE3DE]" />
          <button
            onClick={handleDelete}
            className="w-full px-3 py-2 text-left text-sm hover:bg-[#FFE4D6] flex items-center gap-2 text-[#C65D3B]"
          >
            <Trash2 className="h-4 w-4" />
            {showDeleteConfirm ? "Confirmar eliminación" : "Eliminar"}
          </button>
        </div>
      )}
    </div>
  );
}

export function ExpensesTable({
  expenses,
  onEdit,
  onDelete,
  isLoading,
}: ExpensesTableProps) {
  if (isLoading) {
    return (
      <div className="bg-[#F6FFF8] rounded-lg border border-[#CCE3DE] overflow-hidden">
        <div className="animate-pulse">
          <div className="h-12 bg-[#CCE3DE]/50" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-[#CCE3DE]/20 border-t border-[#CCE3DE]" />
          ))}
        </div>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="bg-[#F6FFF8] rounded-lg border border-[#CCE3DE] p-8 text-center">
        <p className="text-[#5C7A6B]">No se encontraron gastos</p>
      </div>
    );
  }

  return (
    <div className="bg-[#F6FFF8] rounded-lg border border-[#CCE3DE] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="data-table w-full">
          <thead>
            <tr className="border-b border-[#CCE3DE] bg-[#CCE3DE]/30">
              <th className="text-left text-sm font-medium text-[#3D5A4C]">Fecha</th>
              <th className="text-left text-sm font-medium text-[#3D5A4C]">Descripción</th>
              <th className="text-left text-sm font-medium text-[#3D5A4C]">Categoría</th>
              <th className="text-left text-sm font-medium text-[#3D5A4C]">Proveedor</th>
              <th className="text-right text-sm font-medium text-[#3D5A4C]">Monto</th>
              <th className="text-center text-sm font-medium text-[#3D5A4C]">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => {
              const catInfo = expense.category
                ? categoryLabels[expense.category] || { label: expense.category, color: "bg-gray-100 text-gray-800" }
                : null;

              return (
                <tr
                  key={expense.id}
                  className="border-b border-[#CCE3DE] last:border-0 hover:bg-[#CCE3DE]/20"
                >
                  <td className="text-sm text-[#3D5A4C] whitespace-nowrap">
                    {format(parseLocalDate(expense.date), "d MMM yyyy", { locale: es })}
                  </td>
                  <td>
                    <span className="text-sm font-medium text-[#2D3D35] cell-truncate block" title={expense.description}>
                      {expense.description}
                    </span>
                  </td>
                  <td>
                    {catInfo ? (
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${catInfo.color}`}
                      >
                        {catInfo.label}
                      </span>
                    ) : (
                      <span className="text-sm text-[#5C7A6B]">-</span>
                    )}
                  </td>
                  <td>
                    <span className="text-sm text-[#5C7A6B] cell-truncate-sm block" title={expense.provider?.name || ""}>
                      {expense.provider?.name || "-"}
                    </span>
                  </td>
                  <td className="text-right">
                    <span className="text-sm font-semibold text-[#C65D3B] whitespace-nowrap">
                      {formatCOP(expense.amount)}
                    </span>
                  </td>
                  <td>
                    <div className="flex justify-center">
                      <ActionMenu
                        expense={expense}
                        onEdit={onEdit}
                        onDelete={onDelete}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
