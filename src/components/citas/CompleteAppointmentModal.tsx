"use client";

import { useState } from "react";
import { X, CheckCircle, DollarSign } from "lucide-react";

interface CompleteAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (registerPayment: boolean, paymentData?: PaymentData) => void;
  patientName: string;
}

interface PaymentData {
  amount: string;
  method: "efectivo" | "transferencia" | "otro";
  note: string;
}

export function CompleteAppointmentModal({
  isOpen,
  onClose,
  onConfirm,
  patientName,
}: CompleteAppointmentModalProps) {
  const [registerPayment, setRegisterPayment] = useState(true);
  const [paymentData, setPaymentData] = useState<PaymentData>({
    amount: "",
    method: "efectivo",
    note: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(registerPayment, registerPayment ? paymentData : undefined);
    onClose();
    // Reset form
    setPaymentData({ amount: "", method: "efectivo", note: "" });
    setRegisterPayment(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Completar Cita
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Success message */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-emerald-800">
                  Marcar como completada
                </p>
                <p className="text-emerald-700">Cita de {patientName}</p>
              </div>
            </div>
          </div>

          {/* Register payment option */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="registerPayment"
              checked={registerPayment}
              onChange={(e) => setRegisterPayment(e.target.checked)}
              className="w-4 h-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-500"
            />
            <label
              htmlFor="registerPayment"
              className="text-sm font-medium text-gray-700"
            >
              Registrar pago
            </label>
          </div>

          {/* Payment details */}
          {registerPayment && (
            <div className="space-y-3 pl-7 border-l-2 border-emerald-200">
              {/* Amount */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Monto
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={paymentData.amount}
                    onChange={(e) =>
                      setPaymentData((prev) => ({
                        ...prev,
                        amount: e.target.value,
                      }))
                    }
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    required={registerPayment}
                  />
                </div>
              </div>

              {/* Payment method */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Método de pago
                </label>
                <select
                  value={paymentData.method}
                  onChange={(e) =>
                    setPaymentData((prev) => ({
                      ...prev,
                      method: e.target.value as PaymentData["method"],
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Nota (opcional)
                </label>
                <input
                  type="text"
                  value={paymentData.note}
                  onChange={(e) =>
                    setPaymentData((prev) => ({ ...prev, note: e.target.value }))
                  }
                  placeholder="Agregar nota..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors"
            >
              Completar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
