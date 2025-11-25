export interface InventoryItem {
  id: string;
  name: string;
  currentStock: number;
  minStock: number;
  unit: string | null;
  category: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: {
    movements: number;
  };
}

export interface InventoryMovement {
  id: string;
  type: "entrada" | "salida";
  quantity: number;
  reason: string | null;
  createdAt: string;
  createdBy: {
    id: string;
    fullName: string;
  };
}

export interface InventoryItemWithMovements extends InventoryItem {
  movements: InventoryMovement[];
}

export interface InventoryItemFormData {
  id?: string;
  name: string;
  currentStock: number;
  minStock: number;
  unit: string | null;
  category: string | null;
}

export interface StockAdjustmentData {
  itemId: string;
  type: "entrada" | "salida";
  quantity: number;
  reason: string;
}

export const INVENTORY_CATEGORIES = [
  { value: "insumos_medicos", label: "Insumos Médicos" },
  { value: "papeleria", label: "Papelería" },
  { value: "limpieza", label: "Limpieza" },
  { value: "equipos", label: "Equipos" },
  { value: "otros", label: "Otros" },
] as const;

export const INVENTORY_UNITS = [
  { value: "unidad", label: "Unidad" },
  { value: "caja", label: "Caja" },
  { value: "paquete", label: "Paquete" },
  { value: "jeringa", label: "Jeringa" },
  { value: "frasco", label: "Frasco" },
  { value: "rollo", label: "Rollo" },
  { value: "resma", label: "Resma" },
  { value: "litro", label: "Litro" },
  { value: "kg", label: "Kilogramo" },
] as const;

export const categoryLabels: Record<string, string> = {
  insumos_medicos: "Insumos Médicos",
  papeleria: "Papelería",
  limpieza: "Limpieza",
  equipos: "Equipos",
  otros: "Otros",
};

export type StockStatus = "normal" | "bajo" | "critico";

export function getStockStatus(currentStock: number, minStock: number): StockStatus {
  if (currentStock <= 0) return "critico";
  if (currentStock <= minStock) return "bajo";
  return "normal";
}

export const stockStatusConfig: Record<StockStatus, { label: string; color: string }> = {
  normal: { label: "Normal", color: "bg-[#E8F5E9] text-[#2E7D32]" },
  bajo: { label: "Bajo", color: "bg-[#FFF3E0] text-[#E65100]" },
  critico: { label: "Crítico", color: "bg-[#FFEBEE] text-[#C62828]" },
};
