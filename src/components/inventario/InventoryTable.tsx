"use client";

import { useState, useRef, useEffect } from "react";
import { Pencil, MoreHorizontal, Plus, Minus, History } from "lucide-react";
import type { InventoryItem } from "@/types/inventory";
import { getStockStatus, stockStatusConfig, categoryLabels } from "@/types/inventory";

interface InventoryTableProps {
  items: InventoryItem[];
  onEdit: (item: InventoryItem) => void;
  onAddStock: (item: InventoryItem) => void;
  onRemoveStock: (item: InventoryItem) => void;
  onViewMovements: (item: InventoryItem) => void;
  isLoading?: boolean;
}

function ActionMenu({
  item,
  onEdit,
  onAddStock,
  onRemoveStock,
  onViewMovements,
}: {
  item: InventoryItem;
  onEdit: (item: InventoryItem) => void;
  onAddStock: (item: InventoryItem) => void;
  onRemoveStock: (item: InventoryItem) => void;
  onViewMovements: (item: InventoryItem) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
              onAddStock(item);
              setIsOpen(false);
            }}
            className="w-full px-3 py-2 text-left text-sm hover:bg-[#E8F5E9] flex items-center gap-2 text-[#2E7D32]"
          >
            <Plus className="h-4 w-4" />
            Agregar stock
          </button>
          <button
            onClick={() => {
              onRemoveStock(item);
              setIsOpen(false);
            }}
            className="w-full px-3 py-2 text-left text-sm hover:bg-[#FFEBEE] flex items-center gap-2 text-[#C62828]"
          >
            <Minus className="h-4 w-4" />
            Retirar stock
          </button>
          <hr className="my-1 border-[#CCE3DE]" />
          <button
            onClick={() => {
              onViewMovements(item);
              setIsOpen(false);
            }}
            className="w-full px-3 py-2 text-left text-sm hover:bg-[#CCE3DE]/50 flex items-center gap-2 text-[#3D5A4C]"
          >
            <History className="h-4 w-4" />
            Ver movimientos
          </button>
          <button
            onClick={() => {
              onEdit(item);
              setIsOpen(false);
            }}
            className="w-full px-3 py-2 text-left text-sm hover:bg-[#CCE3DE]/50 flex items-center gap-2 text-[#3D5A4C]"
          >
            <Pencil className="h-4 w-4" />
            Editar
          </button>
        </div>
      )}
    </div>
  );
}

export function InventoryTable({
  items,
  onEdit,
  onAddStock,
  onRemoveStock,
  onViewMovements,
  isLoading,
}: InventoryTableProps) {
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

  if (items.length === 0) {
    return (
      <div className="bg-[#F6FFF8] rounded-lg border border-[#CCE3DE] p-8 text-center">
        <p className="text-[#5C7A6B]">No se encontraron items</p>
      </div>
    );
  }

  return (
    <div className="bg-[#F6FFF8] rounded-lg border border-[#CCE3DE] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#CCE3DE] bg-[#CCE3DE]/30">
              <th className="px-4 py-3 text-left text-sm font-medium text-[#3D5A4C]">Nombre</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#3D5A4C]">Categoría</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-[#3D5A4C]">Stock actual</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-[#3D5A4C]">Stock mínimo</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#3D5A4C]">Unidad</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-[#3D5A4C]">Estado</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-[#3D5A4C]">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const currentStock = Number(item.currentStock);
              const minStock = Number(item.minStock);
              const status = getStockStatus(currentStock, minStock);
              const statusInfo = stockStatusConfig[status];

              return (
                <tr
                  key={item.id}
                  className="border-b border-[#CCE3DE] last:border-0 hover:bg-[#CCE3DE]/20"
                >
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-[#2D3D35]">
                      {item.name}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#5C7A6B]">
                    {item.category ? categoryLabels[item.category] || item.category : "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-sm font-semibold ${
                      status === "critico" ? "text-[#C62828]" :
                      status === "bajo" ? "text-[#E65100]" : "text-[#2D3D35]"
                    }`}>
                      {currentStock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-[#5C7A6B]">
                    {minStock}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#5C7A6B]">
                    {item.unit || "-"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${statusInfo.color}`}
                    >
                      {statusInfo.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center">
                      <ActionMenu
                        item={item}
                        onEdit={onEdit}
                        onAddStock={onAddStock}
                        onRemoveStock={onRemoveStock}
                        onViewMovements={onViewMovements}
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
