"use client";

import { useState, useEffect } from "react";
import { X, Package, Plus, Minus } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { InventoryItem, InventoryMovement } from "@/types/inventory";

interface MovementsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string | null;
}

interface ItemWithMovements extends InventoryItem {
  movements: InventoryMovement[];
}

export function MovementsDrawer({
  isOpen,
  onClose,
  itemId,
}: MovementsDrawerProps) {
  const [item, setItem] = useState<ItemWithMovements | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && itemId) {
      fetchItem(itemId);
    } else {
      setItem(null);
    }
  }, [isOpen, itemId]);

  const fetchItem = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/inventory/${id}`);
      if (response.ok) {
        const data = await response.json();
        setItem(data);
      }
    } catch (error) {
      console.error("Error fetching item:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-[#F6FFF8] w-full max-w-md shadow-xl flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#CCE3DE]">
          <h2 className="text-lg font-semibold text-[#2D3D35]">
            Movimientos de Stock
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
                <div className="h-20 bg-[#CCE3DE]/50 rounded-lg" />
                <div className="mt-4 space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-[#CCE3DE]/30 rounded-lg" />
                  ))}
                </div>
              </div>
            </div>
          ) : item ? (
            <div className="p-4 space-y-4">
              {/* Item Info */}
              <div className="bg-[#CCE3DE]/30 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#6B9080] flex items-center justify-center">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#2D3D35]">{item.name}</h3>
                    <p className="text-sm text-[#5C7A6B]">
                      Stock actual: <span className="font-semibold">{item.currentStock}</span>
                      {item.unit && ` ${item.unit}(s)`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Movements List */}
              <div>
                <h4 className="text-sm font-medium text-[#3D5A4C] mb-3">
                  Historial de movimientos
                </h4>
                {item.movements && item.movements.length > 0 ? (
                  <div className="space-y-2">
                    {item.movements.map((movement) => {
                      const isEntrada = movement.type === "entrada";

                      return (
                        <div
                          key={movement.id}
                          className="bg-white border border-[#CCE3DE] rounded-lg p-3"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              isEntrada ? "bg-[#E8F5E9]" : "bg-[#FFEBEE]"
                            }`}>
                              {isEntrada ? (
                                <Plus className={`w-4 h-4 text-[#2E7D32]`} />
                              ) : (
                                <Minus className={`w-4 h-4 text-[#C62828]`} />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className={`text-sm font-semibold ${
                                  isEntrada ? "text-[#2E7D32]" : "text-[#C62828]"
                                }`}>
                                  {isEntrada ? "+" : "-"}{movement.quantity} {item.unit || "unidad(es)"}
                                </span>
                                <span className="text-xs text-[#5C7A6B]">
                                  {format(new Date(movement.createdAt), "d MMM yyyy, HH:mm", {
                                    locale: es,
                                  })}
                                </span>
                              </div>
                              {movement.reason && (
                                <p className="text-sm text-[#5C7A6B] mt-1">
                                  {movement.reason}
                                </p>
                              )}
                              <p className="text-xs text-[#5C7A6B] mt-1">
                                Por: {movement.createdBy.fullName}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-[#5C7A6B] text-center py-4">
                    No hay movimientos registrados
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-[#5C7A6B]">
              Item no encontrado
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
