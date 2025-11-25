"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, DollarSign, Hash, Tag, Calendar } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ExpensesTable } from "@/components/gastos/ExpensesTable";
import { ExpenseModal } from "@/components/gastos/ExpenseModal";
import { formatCOP } from "@/lib/utils";
import type { Expense, ExpenseFormData, Provider } from "@/types/expenses";
import { EXPENSE_CATEGORIES, categoryLabels } from "@/types/expenses";

export default function ComprasGastosPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [startDate, setStartDate] = useState(
    format(startOfMonth(new Date()), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState(
    format(endOfMonth(new Date()), "yyyy-MM-dd")
  );
  const [category, setCategory] = useState("all");
  const [selectedProviderId, setSelectedProviderId] = useState("all");

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchExpenses = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (category !== "all") params.set("category", category);
      if (selectedProviderId !== "all") params.set("providerId", selectedProviderId);

      const response = await fetch(`/api/expenses?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setExpenses(data);
      }
    } catch (error) {
      console.error("Error fetching expenses:", error);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, category, selectedProviderId]);

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

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleCreateExpense = async (expenseData: ExpenseFormData) => {
    const response = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expenseData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error al crear gasto");
    }

    fetchExpenses();
  };

  const handleEditExpense = async (expenseData: ExpenseFormData) => {
    const response = await fetch(`/api/expenses/${expenseData.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expenseData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error al actualizar gasto");
    }

    fetchExpenses();
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchExpenses();
      }
    } catch (error) {
      console.error("Error deleting expense:", error);
    }
  };

  const handleEditClick = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsEditModalOpen(true);
  };

  // Stats
  const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const expenseCount = expenses.length;

  // Calculate most frequent category
  const categoryCount = expenses.reduce((acc, expense) => {
    if (expense.category) {
      acc[expense.category] = (acc[expense.category] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const mostFrequentCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0];
  const mostFrequentCategoryLabel = mostFrequentCategory
    ? categoryLabels[mostFrequentCategory[0]]?.label || mostFrequentCategory[0]
    : "-";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2D3D35]">Compras & Gastos</h1>
          <p className="text-[#5C7A6B]">Gestiona los gastos del consultorio</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#6B9080] text-white rounded-md hover:bg-[#5A7A6B] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nuevo Gasto
        </button>
      </div>

      {/* Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#F5E6D3] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#C65D3B] flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#8B4513]">{formatCOP(totalExpenses)}</p>
          <p className="text-sm text-[#A0522D]">Gastos del mes</p>
        </div>

        <div className="bg-[#D8E2DC] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#84A98C] flex items-center justify-center">
              <Hash className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#3D5A4C]">{expenseCount}</p>
          <p className="text-sm text-[#5C7A6B]">Cantidad de registros</p>
        </div>

        <div className="bg-[#E8F5E9] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#81C784] flex items-center justify-center">
              <Tag className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#2E7D32]">{mostFrequentCategoryLabel}</p>
          <p className="text-sm text-[#5C7A6B]">Categoría más frecuente</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#F6FFF8] rounded-lg border border-[#CCE3DE] p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-[#3D5A4C] mb-1">
              Desde
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5C7A6B]" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-[#CCE3DE] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#6B9080] text-[#2D3D35]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3D5A4C] mb-1">
              Hasta
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5C7A6B]" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-[#CCE3DE] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#6B9080] text-[#2D3D35]"
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
              value={selectedProviderId}
              onChange={(e) => setSelectedProviderId(e.target.value)}
              className="w-full px-3 py-2 border border-[#CCE3DE] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#6B9080] text-[#2D3D35]"
            >
              <option value="all">Todos</option>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <ExpensesTable
        expenses={expenses}
        onEdit={handleEditClick}
        onDelete={handleDeleteExpense}
        isLoading={isLoading}
      />

      {/* Create Modal */}
      <ExpenseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateExpense}
      />

      {/* Edit Modal */}
      <ExpenseModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedExpense(null);
        }}
        onSave={handleEditExpense}
        expense={selectedExpense}
      />
    </div>
  );
}
