"use client";

import { X, Calendar, User, CreditCard, Banknote, FileText } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { formatCOP } from "@/lib/utils";
import { parseLocalDate, parseTimeToDisplay } from "@/lib/dates";
import type { Sale } from "@/types/sales";

interface SaleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
}

const paymentMethodLabels: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  otro: "Otro",
};

const typeLabels: Record<string, string> = {
  presencial: "Presencial",
  virtual: "Virtual",
  terapia_choque: "Terapia de Choque",
};

export function SaleDetailModal({ isOpen, onClose, sale }: SaleDetailModalProps) {
  if (!isOpen || !sale) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-[#F6FFF8] rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-[#CCE3DE]">
          <h2 className="text-lg font-semibold text-[#2D3D35]">Detalle de Venta</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#CCE3DE] rounded-md transition-colors"
          >
            <X className="h-5 w-5 text-[#5C7A6B]" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Amount */}
          <div className="text-center py-4 bg-[#E8F5E9] rounded-lg">
            <p className="text-sm text-[#5C7A6B] mb-1">Monto</p>
            <p className="text-3xl font-bold text-[#2E7D32]">{formatCOP(sale.amount)}</p>
          </div>

          {/* Date */}
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-[#6B9080] mt-0.5" />
            <div>
              <p className="text-sm text-[#5C7A6B]">Fecha de venta</p>
              <p className="text-[#2D3D35] font-medium">
                {format(parseLocalDate(sale.date), "d 'de' MMMM, yyyy", { locale: es })}
              </p>
            </div>
          </div>

          {/* Patient */}
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-[#6B9080] mt-0.5" />
            <div>
              <p className="text-sm text-[#5C7A6B]">Paciente</p>
              <p className="text-[#2D3D35] font-medium">
                {sale.patient.fullName}
              </p>
              <p className="text-xs text-[#5C7A6B]">
                {sale.patient.patientCode}
              </p>
            </div>
          </div>

          {/* Appointment */}
          {sale.appointment && (
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-[#6B9080] mt-0.5" />
              <div>
                <p className="text-sm text-[#5C7A6B]">Cita asociada</p>
                <p className="text-[#2D3D35] font-medium">
                  {format(parseLocalDate(sale.appointment.date), "d MMM yyyy", { locale: es })} -{" "}
                  {parseTimeToDisplay(sale.appointment.startTime)}
                </p>
                <p className="text-xs text-[#5C7A6B]">
                  {typeLabels[sale.appointment.type] || sale.appointment.type}
                </p>
              </div>
            </div>
          )}

          {/* Payment Method */}
          <div className="flex items-start gap-3">
            <CreditCard className="h-5 w-5 text-[#6B9080] mt-0.5" />
            <div>
              <p className="text-sm text-[#5C7A6B]">Método de pago</p>
              <p className="text-[#2D3D35] font-medium">
                {paymentMethodLabels[sale.paymentMethod] || sale.paymentMethod}
              </p>
            </div>
          </div>

          {/* Bank Account */}
          {sale.bankAccount && (
            <div className="flex items-start gap-3">
              <Banknote className="h-5 w-5 text-[#6B9080] mt-0.5" />
              <div>
                <p className="text-sm text-[#5C7A6B]">Cuenta bancaria</p>
                <p className="text-[#2D3D35] font-medium">{sale.bankAccount.alias}</p>
                {sale.bankAccount.bankName && (
                  <p className="text-xs text-[#5C7A6B]">{sale.bankAccount.bankName}</p>
                )}
              </div>
            </div>
          )}

          {/* Note */}
          {sale.paymentNote && (
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-[#6B9080] mt-0.5" />
              <div>
                <p className="text-sm text-[#5C7A6B]">Nota</p>
                <p className="text-[#2D3D35]">{sale.paymentNote}</p>
              </div>
            </div>
          )}

          {/* Created By */}
          <div className="pt-4 border-t border-[#CCE3DE]">
            <p className="text-xs text-[#5C7A6B]">
              Registrado por <span className="font-medium">{sale.createdBy.fullName}</span>
            </p>
            <p className="text-xs text-[#5C7A6B]">
              {format(new Date(sale.createdAt), "d MMM yyyy, HH:mm", { locale: es })}
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-[#CCE3DE]">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-[#6B9080] text-white rounded-md hover:bg-[#5A7A6B] transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
