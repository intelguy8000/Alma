"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Package, AlertTriangle, XCircle, Search } from "lucide-react";
import { InventoryTable } from "@/components/inventario/InventoryTable";
import { InventoryModal } from "@/components/inventario/InventoryModal";
import { StockAdjustmentModal } from "@/components/inventario/StockAdjustmentModal";
import { MovementsDrawer } from "@/components/inventario/MovementsDrawer";
import type { InventoryItem, InventoryItemFormData, StockAdjustmentData } from "@/types/inventory";
import { INVENTORY_CATEGORIES, getStockStatus } from "@/types/inventory";

export default function InventarioPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Stock Adjustment
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<"entrada" | "salida">("entrada");

  // Movements Drawer
  const [isMovementsDrawerOpen, setIsMovementsDrawerOpen] = useState(false);
  const [movementsItemId, setMovementsItemId] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (category !== "all") params.set("category", category);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const response = await fetch(`/api/inventory?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error("Error fetching inventory:", error);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, category, statusFilter]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleCreateItem = async (itemData: InventoryItemFormData) => {
    const response = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(itemData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error al crear item");
    }

    fetchItems();
  };

  const handleEditItem = async (itemData: InventoryItemFormData) => {
    const response = await fetch(`/api/inventory/${itemData.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(itemData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error al actualizar item");
    }

    fetchItems();
  };

  const handleStockAdjustment = async (data: StockAdjustmentData) => {
    const response = await fetch(`/api/inventory/${data.itemId}/movements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: data.type,
        quantity: data.quantity,
        reason: data.reason,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error al registrar movimiento");
    }

    fetchItems();
  };

  const handleEditClick = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  const handleAddStock = (item: InventoryItem) => {
    setSelectedItem(item);
    setAdjustmentType("entrada");
    setIsAdjustmentModalOpen(true);
  };

  const handleRemoveStock = (item: InventoryItem) => {
    setSelectedItem(item);
    setAdjustmentType("salida");
    setIsAdjustmentModalOpen(true);
  };

  const handleViewMovements = (item: InventoryItem) => {
    setMovementsItemId(item.id);
    setIsMovementsDrawerOpen(true);
  };

  // Stats
  const totalItems = items.length;
  const lowStockItems = items.filter((item) => {
    const status = getStockStatus(Number(item.currentStock), Number(item.minStock));
    return status === "bajo";
  }).length;
  const criticalItems = items.filter((item) => {
    const status = getStockStatus(Number(item.currentStock), Number(item.minStock));
    return status === "critico";
  }).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2D3D35]">Inventario</h1>
          <p className="text-[#5C7A6B]">Gestiona el inventario del consultorio</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#6B9080] text-white rounded-md hover:bg-[#5A7A6B] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nuevo Item
        </button>
      </div>

      {/* Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#CCE3DE] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#6B9080] flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#3D5A4C]">{totalItems}</p>
          <p className="text-sm text-[#5C7A6B]">Total items</p>
        </div>

        <div className="bg-[#FFF3E0] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#E65100] flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#E65100]">{lowStockItems}</p>
          <p className="text-sm text-[#A0522D]">Items en stock bajo</p>
        </div>

        <div className="bg-[#FFEBEE] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#C62828] flex items-center justify-center">
              <XCircle className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#C62828]">{criticalItems}</p>
          <p className="text-sm text-[#B71C1C]">Items críticos</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#F6FFF8] rounded-lg border border-[#CCE3DE] p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-[#3D5A4C] mb-1">
              Buscar
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5C7A6B]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[#CCE3DE] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#6B9080] text-[#2D3D35]"
                placeholder="Buscar por nombre..."
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-[#3D5A4C] mb-1">
              Categoría
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-[#CCE3DE] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#6B9080] text-[#2D3D35]"
            >
              <option value="all">Todos</option>
              {INVENTORY_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-[#3D5A4C] mb-1">
              Estado
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-[#CCE3DE] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#6B9080] text-[#2D3D35]"
            >
              <option value="all">Todos</option>
              <option value="normal">Normal</option>
              <option value="bajo">Bajo</option>
              <option value="critico">Crítico</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <InventoryTable
        items={items}
        onEdit={handleEditClick}
        onAddStock={handleAddStock}
        onRemoveStock={handleRemoveStock}
        onViewMovements={handleViewMovements}
        isLoading={isLoading}
      />

      {/* Create Modal */}
      <InventoryModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateItem}
      />

      {/* Edit Modal */}
      <InventoryModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedItem(null);
        }}
        onSave={handleEditItem}
        item={selectedItem}
      />

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={isAdjustmentModalOpen}
        onClose={() => {
          setIsAdjustmentModalOpen(false);
          setSelectedItem(null);
        }}
        onSave={handleStockAdjustment}
        item={selectedItem}
        type={adjustmentType}
      />

      {/* Movements Drawer */}
      <MovementsDrawer
        isOpen={isMovementsDrawerOpen}
        onClose={() => {
          setIsMovementsDrawerOpen(false);
          setMovementsItemId(null);
        }}
        itemId={movementsItemId}
      />
    </div>
  );
}
