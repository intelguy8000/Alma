export interface Provider {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string | null;
  date: string;
  createdAt: string;
  provider: Provider | null;
}

export interface ExpenseFormData {
  id?: string;
  description: string;
  amount: number;
  category: string | null;
  date: string;
  providerId: string | null;
}

export const EXPENSE_CATEGORIES = [
  { value: "arriendo", label: "Arriendo" },
  { value: "servicios", label: "Servicios" },
  { value: "insumos", label: "Insumos" },
  { value: "nomina", label: "Nómina" },
  { value: "otros", label: "Otros" },
] as const;

export const categoryLabels: Record<string, { label: string; color: string }> = {
  arriendo: { label: "Arriendo", color: "bg-[#E8D5B7] text-[#8B6914]" },
  servicios: { label: "Servicios", color: "bg-[#D4E5F7] text-[#2C5282]" },
  insumos: { label: "Insumos", color: "bg-[#E8F5E9] text-[#2E7D32]" },
  nomina: { label: "Nómina", color: "bg-[#F3E5F5] text-[#7B1FA2]" },
  otros: { label: "Otros", color: "bg-[#F5E6D3] text-[#8B6914]" },
};
