"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { formatCOP } from "@/lib/utils";
import { parseDateToInput, getTodayLocal } from "@/lib/dates";
import type { Expense, ExpenseFormData, Provider } from "@/types/expenses";
import { EXPENSE_CATEGORIES } from "@/types/expenses";

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: ExpenseFormData) => Promise<void>;
  expense?: Expense | null;
}

export function ExpenseModal({
  isOpen,
  onClose,
  onSave,
  expense,
}: ExpenseModalProps) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [formData, setFormData] = useState({
    description: "",
    amount: 0,
    category: "",
    date: getTodayLocal(),
    providerId: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchProviders();
      if (expense) {
        setFormData({
          description: expense.description,
          amount: Number(expense.amount),
          category: expense.category || "",
          date: expense.date ? parseDateToInput(expense.date) : getTodayLocal(),
          providerId: expense.provider?.id || "",
        });
      } else {
        setFormData({
          description: "",
          amount: 0,
          category: "",
          date: getTodayLocal(),
          providerId: "",
        });
      }
      setError("");
    }
  }, [isOpen, expense]);

  const fetchProviders = async () => {
    try {
      const response = await fetch("/api/providers");
      if (response.ok) {
        const data = await response.json();
        setProviders(data);
      }
    } catch (error) {
      console.error("Error fetching providers:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.description.trim()) {
      setError("La descripción es requerida");
      return;
    }

    if (!formData.amount || formData.amount <= 0) {
      setError("El monto debe ser mayor a 0");
      return;
    }

    setIsLoading(true);
    try {
      const expenseFormData: ExpenseFormData = {
        id: expense?.id,
        description: formData.description.trim(),
        amount: formData.amount,
        category: formData.category || null,
        date: formData.date,
        providerId: formData.providerId || null,
      };
      await onSave(expenseFormData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-[#F6FFF8] rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-[#CCE3DE]">
          <h2 className="text-lg font-semibold text-[#2D3D35]">
            {expense ? "Editar Gasto" : "Nuevo Gasto"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#CCE3DE] rounded-md transition-colors"
          >
            <X className="h-5 w-5 text-[#5C7A6B]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-[#FFE4D6] text-[#C65D3B] text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-[#3D5A4C] mb-1">
              Fecha
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-[#CCE3DE] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#6B9080] text-[#2D3D35]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[#3D5A4C] mb-1">
              Descripción <span className="text-[#E07A5F]">*</span>
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-[#CCE3DE] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#6B9080] text-[#2D3D35]"
              placeholder="Ej: Pago arriendo local"
              required
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-[#3D5A4C] mb-1">
              Monto <span className="text-[#E07A5F]">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5C7A6B]">$</span>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                className="w-full pl-8 pr-4 py-2 border border-[#CCE3DE] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#6B9080] text-[#2D3D35]"
                placeholder="0"
                min="0"
                step="1000"
                required
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-[#3D5A4C] mb-1">
              Categoría
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-[#CCE3DE] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#6B9080] text-[#2D3D35]"
            >
              <option value="">Sin categoría</option>
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Provider */}
          <div>
            <label className="block text-sm font-medium text-[#3D5A4C] mb-1">
              Proveedor
            </label>
            <select
              value={formData.providerId}
              onChange={(e) => setFormData({ ...formData, providerId: e.target.value })}
              className="w-full px-3 py-2 border border-[#CCE3DE] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#6B9080] text-[#2D3D35]"
            >
              <option value="">Sin proveedor</option>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-[#CCE3DE] rounded-md hover:bg-[#CCE3DE]/50 transition-colors text-[#3D5A4C]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-[#6B9080] text-white rounded-md hover:bg-[#5A7A6B] transition-colors disabled:opacity-50"
            >
              {isLoading ? "Guardando..." : expense ? "Guardar" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
