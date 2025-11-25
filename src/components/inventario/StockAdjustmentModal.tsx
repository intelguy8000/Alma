"use client";

import { useState, useEffect } from "react";
import { X, Plus, Minus } from "lucide-react";
import type { InventoryItem, StockAdjustmentData } from "@/types/inventory";

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: StockAdjustmentData) => Promise<void>;
  item: InventoryItem | null;
  type: "entrada" | "salida";
}

export function StockAdjustmentModal({
  isOpen,
  onClose,
  onSave,
  item,
  type,
}: StockAdjustmentModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setReason("");
      setError("");
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!item) return;

    if (quantity <= 0) {
      setError("La cantidad debe ser mayor a 0");
      return;
    }

    if (!reason.trim()) {
      setError("La razón es requerida");
      return;
    }

    // Check if we have enough stock for salida
    if (type === "salida" && quantity > Number(item.currentStock)) {
      setError("No hay suficiente stock disponible");
      return;
    }

    setIsLoading(true);
    try {
      await onSave({
        itemId: item.id,
        type,
        quantity,
        reason: reason.trim(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !item) return null;

  const isEntrada = type === "entrada";
  const newStock = isEntrada
    ? Number(item.currentStock) + quantity
    : Number(item.currentStock) - quantity;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-[#F6FFF8] rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className={`flex items-center justify-between p-4 border-b ${
          isEntrada ? "border-[#CCE3DE] bg-[#E8F5E9]" : "border-[#FFCDD2] bg-[#FFEBEE]"
        }`}>
          <div className="flex items-center gap-2">
            {isEntrada ? (
              <Plus className="h-5 w-5 text-[#2E7D32]" />
            ) : (
              <Minus className="h-5 w-5 text-[#C62828]" />
            )}
            <h2 className={`text-lg font-semibold ${isEntrada ? "text-[#2E7D32]" : "text-[#C62828]"}`}>
              {isEntrada ? "Agregar Stock" : "Retirar Stock"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/50 rounded-md transition-colors"
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

          {/* Item Info */}
          <div className="bg-[#CCE3DE]/30 rounded-lg p-3">
            <p className="font-medium text-[#2D3D35]">{item.name}</p>
            <p className="text-sm text-[#5C7A6B]">
              Stock actual: <span className="font-semibold">{item.currentStock}</span>
              {item.unit && ` ${item.unit}(s)`}
            </p>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-[#3D5A4C] mb-1">
              Cantidad <span className="text-[#E07A5F]">*</span>
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full px-3 py-2 border border-[#CCE3DE] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#6B9080] text-[#2D3D35]"
              min="0.01"
              step="0.01"
              required
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-[#3D5A4C] mb-1">
              Razón <span className="text-[#E07A5F]">*</span>
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-[#CCE3DE] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#6B9080] text-[#2D3D35]"
              placeholder={isEntrada ? "Ej: Compra de insumos" : "Ej: Uso en consulta"}
              required
            />
          </div>

          {/* Preview */}
          <div className={`rounded-lg p-3 ${
            isEntrada ? "bg-[#E8F5E9]" : "bg-[#FFEBEE]"
          }`}>
            <p className="text-sm text-[#5C7A6B]">Nuevo stock:</p>
            <p className={`text-xl font-bold ${
              isEntrada ? "text-[#2E7D32]" : "text-[#C62828]"
            }`}>
              {newStock} {item.unit && `${item.unit}(s)`}
            </p>
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
              className={`flex-1 px-4 py-2 text-white rounded-md transition-colors disabled:opacity-50 ${
                isEntrada
                  ? "bg-[#2E7D32] hover:bg-[#1B5E20]"
                  : "bg-[#C62828] hover:bg-[#B71C1C]"
              }`}
            >
              {isLoading ? "Guardando..." : isEntrada ? "Agregar" : "Retirar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
