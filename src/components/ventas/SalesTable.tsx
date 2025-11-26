"use client";

import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Eye, Pencil, Trash2, MoreHorizontal, FileCheck, FileX } from "lucide-react";
import { formatCOP } from "@/lib/utils";
import type { Sale } from "@/types/sales";

interface SalesTableProps {
  sales: Sale[];
  onView: (sale: Sale) => void;
  onEdit: (sale: Sale) => void;
  onDelete: (saleId: string) => void;
  onToggleInvoice?: (saleId: string, currentValue: boolean) => void;
  isLoading?: boolean;
}

const paymentMethodLabels: Record<string, { label: string; color: string }> = {
  efectivo: { label: "Efectivo", color: "bg-[#E8F5E9] text-[#2E7D32]" },
  transferencia: { label: "Transferencia", color: "bg-[#D4E5F7] text-[#2C5282]" },
  otro: { label: "Otro", color: "bg-[#F5E6D3] text-[#8B6914]" },
};

// Parse date string to local Date avoiding timezone issues
const parseLocalDate = (dateStr: string): Date => {
  // If it's an ISO string like "2025-11-26T00:00:00.000Z", extract just the date part
  const cleanDate = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  const [year, month, day] = cleanDate.split("-").map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
};

function ActionMenu({
  sale,
  onView,
  onEdit,
  onDelete,
}: {
  sale: Sale;
  onView: (sale: Sale) => void;
  onEdit: (sale: Sale) => void;
  onDelete: (saleId: string) => void;
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
      onDelete(sale.id);
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
              onView(sale);
              setIsOpen(false);
            }}
            className="w-full px-3 py-2 text-left text-sm hover:bg-[#CCE3DE]/50 flex items-center gap-2 text-[#3D5A4C]"
          >
            <Eye className="h-4 w-4" />
            Ver detalle
          </button>
          <button
            onClick={() => {
              onEdit(sale);
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

export function SalesTable({
  sales,
  onView,
  onEdit,
  onDelete,
  onToggleInvoice,
  isLoading,
}: SalesTableProps) {
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

  if (sales.length === 0) {
    return (
      <div className="bg-[#F6FFF8] rounded-lg border border-[#CCE3DE] p-8 text-center">
        <p className="text-[#5C7A6B]">No se encontraron ventas</p>
      </div>
    );
  }

  return (
    <div className="bg-[#F6FFF8] rounded-lg border border-[#CCE3DE] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#CCE3DE] bg-[#CCE3DE]/30">
              <th className="px-4 py-3 text-left text-sm font-medium text-[#3D5A4C]">Fecha</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#3D5A4C]">Paciente</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#3D5A4C]">Cita asociada</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-[#3D5A4C]">Monto</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#3D5A4C]">Método</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-[#3D5A4C]">Factura E.</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#3D5A4C]">Cuenta</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#3D5A4C]">Registrado por</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-[#3D5A4C]">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => {
              const methodInfo = paymentMethodLabels[sale.paymentMethod] || {
                label: sale.paymentMethod,
                color: "bg-gray-100 text-gray-800",
              };

              return (
                <tr
                  key={sale.id}
                  className="border-b border-[#CCE3DE] last:border-0 hover:bg-[#CCE3DE]/20"
                >
                  <td className="px-4 py-3 text-sm text-[#3D5A4C]">
                    {format(parseLocalDate(sale.date), "d MMM yyyy", { locale: es })}
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-[#2D3D35]">
                        {sale.patient.fullName}
                      </p>
                      <p className="text-xs text-[#5C7A6B]">
                        {sale.patient.patientCode}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#5C7A6B]">
                    {sale.appointment ? (
                      <span>
                        {format(parseLocalDate(sale.appointment.date), "d MMM", { locale: es })} -{" "}
                        {sale.appointment.startTime.includes("T")
                          ? sale.appointment.startTime.split("T")[1].substring(0, 5)
                          : sale.appointment.startTime.substring(0, 5)}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-semibold text-[#2E7D32]">
                      {formatCOP(sale.amount)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${methodInfo.color}`}
                    >
                      {methodInfo.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => onToggleInvoice?.(sale.id, sale.hasElectronicInvoice)}
                      className="p-1 rounded-md hover:bg-[#CCE3DE]/50 transition-colors cursor-pointer"
                      title={sale.hasElectronicInvoice ? "Quitar factura electrónica" : "Marcar como factura electrónica"}
                    >
                      {sale.hasElectronicInvoice ? (
                        <FileCheck className="h-5 w-5 text-[#2E7D32] mx-auto" />
                      ) : (
                        <FileX className="h-5 w-5 text-[#9CA3AF] mx-auto" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#5C7A6B]">
                    {sale.bankAccount ? sale.bankAccount.alias : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#5C7A6B]">
                    {sale.createdBy.fullName}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center">
                      <ActionMenu
                        sale={sale}
                        onView={onView}
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
