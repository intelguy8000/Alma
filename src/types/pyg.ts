export interface PygSummary {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
}

export interface IncomeByType {
  type: string;
  label: string;
  count: number;
  amount: number;
}

export interface ExpenseByCategory {
  category: string;
  label: string;
  count: number;
  amount: number;
}

export interface MonthlyData {
  month: string;
  monthLabel: string;
  income: number;
  expenses: number;
}

export interface PygData {
  summary: PygSummary;
  incomeByType: IncomeByType[];
  expensesByCategory: ExpenseByCategory[];
  monthlyData: MonthlyData[];
}

export const appointmentTypeLabels: Record<string, string> = {
  presencial: "Presencial",
  virtual: "Virtual",
  terapia_choque: "Terapia de Choque",
  sin_cita: "Sin cita asociada",
};

export const expenseCategoryLabels: Record<string, string> = {
  arriendo: "Arriendo",
  servicios: "Servicios",
  insumos: "Insumos",
  nomina: "Nómina",
  otros: "Otros",
  sin_categoria: "Sin categoría",
};

export type PeriodType = "current_month" | "last_month" | "last_3_months" | "this_year" | "custom";

export const periodOptions = [
  { value: "current_month", label: "Mes actual" },
  { value: "last_month", label: "Último mes" },
  { value: "last_3_months", label: "Últimos 3 meses" },
  { value: "this_year", label: "Este año" },
  { value: "custom", label: "Personalizado" },
] as const;
