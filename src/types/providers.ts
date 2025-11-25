import type { Expense } from "./expenses";

export interface Provider {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: {
    expenses: number;
  };
  totalExpenses?: number;
}

export interface ProviderWithExpenses extends Provider {
  expenses: Expense[];
}

export interface ProviderFormData {
  id?: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
}
