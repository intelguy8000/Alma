"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { InventoryItem, InventoryItemFormData } from "@/types/inventory";
import { INVENTORY_CATEGORIES, INVENTORY_UNITS } from "@/types/inventory";

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: InventoryItemFormData) => Promise<void>;
  item?: InventoryItem | null;
}

export function InventoryModal({
  isOpen,
  onClose,
  onSave,
  item,
}: InventoryModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    currentStock: 0,
    minStock: 0,
    unit: "",
    category: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (item) {
        setFormData({
          name: item.name,
          currentStock: Number(item.currentStock),
          minStock: Number(item.minStock),
          unit: item.unit || "",
          category: item.category || "",
        });
      } else {
        setFormData({
          name: "",
          currentStock: 0,
          minStock: 0,
          unit: "",
          category: "",
        });
      }
      setError("");
    }
  }, [isOpen, item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("El nombre es requerido");
      return;
    }

    setIsLoading(true);
    try {
      const itemFormData: InventoryItemFormData = {
        id: item?.id,
        name: formData.name.trim(),
        currentStock: formData.currentStock,
        minStock: formData.minStock,
        unit: formData.unit || null,
        category: formData.category || null,
      };
      await onSave(itemFormData);
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
            {item ? "Editar Item" : "Nuevo Item"}
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

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-[#3D5A4C] mb-1">
              Nombre <span className="text-[#E07A5F]">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-[#CCE3DE] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#6B9080] text-[#2D3D35]"
              placeholder="Nombre del item"
              required
            />
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
              {INVENTORY_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Stock fields - only show for new items */}
          {!item && (
            <div>
              <label className="block text-sm font-medium text-[#3D5A4C] mb-1">
                Stock inicial
              </label>
              <input
                type="number"
                value={formData.currentStock}
                onChange={(e) => setFormData({ ...formData, currentStock: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-[#CCE3DE] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#6B9080] text-[#2D3D35]"
                min="0"
                step="0.01"
              />
            </div>
          )}

          {/* Min Stock */}
          <div>
            <label className="block text-sm font-medium text-[#3D5A4C] mb-1">
              Stock mínimo
            </label>
            <input
              type="number"
              value={formData.minStock}
              onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-[#CCE3DE] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#6B9080] text-[#2D3D35]"
              min="0"
              step="0.01"
            />
            <p className="text-xs text-[#5C7A6B] mt-1">
              Se alertará cuando el stock esté por debajo de este valor
            </p>
          </div>

          {/* Unit */}
          <div>
            <label className="block text-sm font-medium text-[#3D5A4C] mb-1">
              Unidad
            </label>
            <select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="w-full px-3 py-2 border border-[#CCE3DE] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#6B9080] text-[#2D3D35]"
            >
              <option value="">Sin unidad</option>
              {INVENTORY_UNITS.map((unit) => (
                <option key={unit.value} value={unit.value}>
                  {unit.label}
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
              {isLoading ? "Guardando..." : item ? "Guardar" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
