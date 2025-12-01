"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, CreditCard, X, Check, Ban } from "lucide-react";
import type { BankAccount, BankAccountFormData } from "@/types/settings";

interface BankAccountsSettingsProps {
  bankAccounts: BankAccount[];
  onRefresh: () => void;
}

export function BankAccountsSettings({ bankAccounts, onRefresh }: BankAccountsSettingsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<BankAccountFormData>({
    alias: "",
    accountNumber: "",
    bankName: "",
    accountHolder: "",
    accountHolderId: "",
    accountType: "",
  });

  const openModal = (account?: BankAccount) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        alias: account.alias,
        accountNumber: account.accountNumber || "",
        bankName: account.bankName || "",
        accountHolder: account.accountHolder || "",
        accountHolderId: account.accountHolderId || "",
        accountType: account.accountType || "",
      });
    } else {
      setEditingAccount(null);
      setFormData({ alias: "", accountNumber: "", bankName: "", accountHolder: "", accountHolderId: "", accountType: "" });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAccount(null);
    setFormData({ alias: "", accountNumber: "", bankName: "", accountHolder: "", accountHolderId: "", accountType: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.alias.trim()) return;

    setIsSubmitting(true);
    try {
      const url = editingAccount
        ? `/api/bank-accounts/${editingAccount.id}`
        : "/api/bank-accounts";
      const method = editingAccount ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        closeModal();
        onRefresh();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (account: BankAccount) => {
    if (!confirm(`¿Eliminar la cuenta "${account.alias}"?`)) return;

    try {
      const response = await fetch(`/api/bank-accounts/${account.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error deleting bank account:", error);
    }
  };

  const handleToggleActive = async (account: BankAccount) => {
    try {
      const response = await fetch(`/api/bank-accounts/${account.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !account.isActive }),
      });

      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error toggling bank account:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-[#2D3D35]">Cuentas Bancarias</h3>
          <p className="text-sm text-[#5C7A6B]">
            Administra las cuentas bancarias para registrar pagos
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#6B9080] text-white rounded-md hover:bg-[#5A7A6B] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Cuenta
        </button>
      </div>

      {/* List */}
      <div className="bg-[#F6FFF8] rounded-lg border border-[#CCE3DE] overflow-hidden">
        {bankAccounts.length === 0 ? (
          <div className="p-8 text-center">
            <CreditCard className="w-12 h-12 text-[#CCE3DE] mx-auto mb-3" />
            <p className="text-[#5C7A6B]">No hay cuentas bancarias registradas</p>
            <button
              onClick={() => openModal()}
              className="mt-3 text-[#6B9080] hover:underline"
            >
              Agregar primera cuenta
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#CCE3DE]">
            {bankAccounts.map((account) => (
              <div
                key={account.id}
                className={`p-4 flex items-center justify-between ${
                  !account.isActive ? "opacity-60 bg-gray-50" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    account.isActive ? "bg-[#6B9080]" : "bg-gray-400"
                  }`}>
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-[#2D3D35]">{account.alias}</p>
                    <div className="flex items-center gap-2 text-sm text-[#5C7A6B]">
                      {account.bankName && <span>{account.bankName}</span>}
                      {account.bankName && account.accountNumber && <span>•</span>}
                      {account.accountNumber && <span>{account.accountNumber}</span>}
                      {!account.bankName && !account.accountNumber && (
                        <span className="text-[#84A98C]">Sin detalles</span>
                      )}
                    </div>
                    {account._count && account._count.sales > 0 && (
                      <p className="text-xs text-[#84A98C] mt-1">
                        {account._count.sales} venta{account._count.sales !== 1 ? "s" : ""} asociada{account._count.sales !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!account.isActive && (
                    <span className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded">
                      Inactiva
                    </span>
                  )}
                  <button
                    onClick={() => handleToggleActive(account)}
                    className={`p-2 rounded-lg transition-colors ${
                      account.isActive
                        ? "text-[#C65D3B] hover:bg-red-50"
                        : "text-[#2E7D32] hover:bg-green-50"
                    }`}
                    title={account.isActive ? "Desactivar" : "Activar"}
                  >
                    {account.isActive ? <Ban className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => openModal(account)}
                    className="p-2 text-[#5C7A6B] hover:bg-[#CCE3DE]/50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(account)}
                    className="p-2 text-[#C65D3B] hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/50"
              onClick={closeModal}
            />
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between p-4 border-b border-[#CCE3DE]">
                <h3 className="text-lg font-semibold text-[#2D3D35]">
                  {editingAccount ? "Editar Cuenta" : "Nueva Cuenta Bancaria"}
                </h3>
                <button
                  onClick={closeModal}
                  className="p-1 text-[#5C7A6B] hover:bg-[#CCE3DE]/50 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#3D5A4C] mb-1">
                    Alias *
                  </label>
                  <input
                    type="text"
                    value={formData.alias}
                    onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
                    className="w-full px-3 py-2 border border-[#CCE3DE] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#6B9080] text-[#2D3D35]"
                    placeholder="Ej: Cuenta Bancolombia"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#3D5A4C] mb-1">
                    Nombre del Banco
                  </label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    className="w-full px-3 py-2 border border-[#CCE3DE] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#6B9080] text-[#2D3D35]"
                    placeholder="Ej: Bancolombia"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#3D5A4C] mb-1">
                      Tipo de Cuenta
                    </label>
                    <select
                      value={formData.accountType}
                      onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                      className="w-full px-3 py-2 border border-[#CCE3DE] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#6B9080] text-[#2D3D35]"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="Ahorros">Ahorros</option>
                      <option value="Corriente">Corriente</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#3D5A4C] mb-1">
                      Número de Cuenta
                    </label>
                    <input
                      type="text"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-[#CCE3DE] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#6B9080] text-[#2D3D35]"
                      placeholder="Ej: 1234567890"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#3D5A4C] mb-1">
                    Titular de la Cuenta
                  </label>
                  <input
                    type="text"
                    value={formData.accountHolder}
                    onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
                    className="w-full px-3 py-2 border border-[#CCE3DE] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#6B9080] text-[#2D3D35]"
                    placeholder="Ej: Juan Pérez"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#3D5A4C] mb-1">
                    Cédula del Titular
                  </label>
                  <input
                    type="text"
                    value={formData.accountHolderId}
                    onChange={(e) => setFormData({ ...formData, accountHolderId: e.target.value })}
                    className="w-full px-3 py-2 border border-[#CCE3DE] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#6B9080] text-[#2D3D35]"
                    placeholder="Ej: 1234567890"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 border border-[#CCE3DE] text-[#5C7A6B] rounded-md hover:bg-[#F6FFF8] transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-[#6B9080] text-white rounded-md hover:bg-[#5A7A6B] transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? "Guardando..." : editingAccount ? "Actualizar" : "Crear"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
