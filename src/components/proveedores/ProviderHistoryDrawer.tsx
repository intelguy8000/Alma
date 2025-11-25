"use client";

import { useState, useEffect } from "react";
import { X, Phone, Mail, Building2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { formatCOP } from "@/lib/utils";
import type { Provider } from "@/types/providers";
import type { Expense } from "@/types/expenses";
import { categoryLabels } from "@/types/expenses";

interface ProviderWithExpenses extends Provider {
  expenses: Expense[];
}

interface ProviderHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  providerId: string | null;
}

export function ProviderHistoryDrawer({
  isOpen,
  onClose,
  providerId,
}: ProviderHistoryDrawerProps) {
  const [provider, setProvider] = useState<ProviderWithExpenses | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && providerId) {
      fetchProvider(providerId);
    } else {
      setProvider(null);
    }
  }, [isOpen, providerId]);

  const fetchProvider = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/providers/${id}`);
      if (response.ok) {
        const data = await response.json();
        setProvider(data);
      }
    } catch (error) {
      console.error("Error fetching provider:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalExpenses = provider?.expenses?.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0
  ) || 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-[#F6FFF8] w-full max-w-md shadow-xl flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#CCE3DE]">
          <h2 className="text-lg font-semibold text-[#2D3D35]">
            Historial de Compras
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#CCE3DE] rounded-md transition-colors"
          >
            <X className="h-5 w-5 text-[#5C7A6B]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 space-y-4">
              <div className="animate-pulse">
                <div className="h-24 bg-[#CCE3DE]/50 rounded-lg" />
                <div className="mt-4 space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-[#CCE3DE]/30 rounded-lg" />
                  ))}
                </div>
              </div>
            </div>
          ) : provider ? (
            <div className="p-4 space-y-4">
              {/* Provider Info */}
              <div className="bg-[#CCE3DE]/30 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-[#6B9080] flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#2D3D35]">{provider.name}</h3>
                    {provider.contactName && (
                      <p className="text-sm text-[#5C7A6B]">{provider.contactName}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {provider.phone && (
                    <a
                      href={`tel:${provider.phone}`}
                      className="flex items-center gap-2 text-sm text-[#6B9080] hover:underline"
                    >
                      <Phone className="h-4 w-4" />
                      {provider.phone}
                    </a>
                  )}
                  {provider.email && (
                    <a
                      href={`mailto:${provider.email}`}
                      className="flex items-center gap-2 text-sm text-[#6B9080] hover:underline"
                    >
                      <Mail className="h-4 w-4" />
                      {provider.email}
                    </a>
                  )}
                </div>

                {provider.notes && (
                  <p className="mt-3 text-sm text-[#5C7A6B] italic">
                    {provider.notes}
                  </p>
                )}
              </div>

              {/* Total */}
              <div className="bg-[#E8F5E9] rounded-lg p-4 text-center">
                <p className="text-sm text-[#5C7A6B] mb-1">Total histórico</p>
                <p className="text-2xl font-bold text-[#2E7D32]">
                  {formatCOP(totalExpenses)}
                </p>
                <p className="text-xs text-[#5C7A6B] mt-1">
                  {provider.expenses?.length || 0} compras registradas
                </p>
              </div>

              {/* Expenses List */}
              <div>
                <h4 className="text-sm font-medium text-[#3D5A4C] mb-3">
                  Historial de compras
                </h4>
                {provider.expenses && provider.expenses.length > 0 ? (
                  <div className="space-y-2">
                    {provider.expenses.map((expense) => {
                      const catInfo = expense.category
                        ? categoryLabels[expense.category]
                        : null;

                      return (
                        <div
                          key={expense.id}
                          className="bg-white border border-[#CCE3DE] rounded-lg p-3"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-[#2D3D35]">
                                {expense.description}
                              </p>
                              <p className="text-xs text-[#5C7A6B]">
                                {format(new Date(expense.date), "d 'de' MMMM, yyyy", {
                                  locale: es,
                                })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-[#C65D3B]">
                                {formatCOP(expense.amount)}
                              </p>
                              {catInfo && (
                                <span
                                  className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${catInfo.color}`}
                                >
                                  {catInfo.label}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-[#5C7A6B] text-center py-4">
                    No hay compras registradas
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-[#5C7A6B]">
              Proveedor no encontrado
            </div>
          )}
        </div>

        {/* Footer */}
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
