"use client";

import { useState, useEffect } from "react";
import { X, Copy, Check, AlertTriangle } from "lucide-react";
import type { BankAccount } from "@/types/settings";
import { formatCOP } from "@/lib/utils";

interface PaymentInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAmount: number;
}

export function PaymentInfoModal({
  isOpen,
  onClose,
  defaultAmount,
}: PaymentInfoModalProps) {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchBankAccounts();
    }
  }, [isOpen]);

  const fetchBankAccounts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/bank-accounts");
      if (response.ok) {
        const data = await response.json();
        setBankAccounts(data);
        if (data.length > 0) {
          setSelectedAccountId(data[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching bank accounts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedAccount = bankAccounts.find((a) => a.id === selectedAccountId);

  const generateMessage = () => {
    if (!selectedAccount) return "";

    const accountType = selectedAccount.accountType || "Ahorros";
    const bankName = selectedAccount.bankName || "Banco";
    const accountNumber = selectedAccount.accountNumber || "";
    const holder = selectedAccount.accountHolder || "";
    const holderId = selectedAccount.accountHolderId || "";

    return `¡Hola! ☀️ Le comparto la información para el pago de su cita:

Cuenta de ${accountType} ${bankName} ${accountNumber} a nombre de ${holder} CC ${holderId}

${formatCOP(defaultAmount)}

Recuerda compartirnos el comprobante de pago ¡Gracias! 🫂✨`;
  };

  const handleCopy = async () => {
    const message = generateMessage();
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Error copying:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Datos de Pago
            </h3>
            <button
              onClick={onClose}
              className="p-1 text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Cargando...</div>
            ) : bankAccounts.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                <p className="text-gray-600 mb-2">
                  No hay cuentas bancarias configuradas.
                </p>
                <p className="text-sm text-gray-500">
                  Ve a Configuración para agregar una cuenta.
                </p>
              </div>
            ) : (
              <>
                {/* Account selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Seleccionar Cuenta
                  </label>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                  >
                    {bankAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.alias} - {account.bankName || "Sin banco"}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Message preview */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mensaje a copiar
                  </label>
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-200 text-sm text-gray-700 whitespace-pre-wrap">
                    {generateMessage()}
                  </div>
                </div>

                {/* Copy button */}
                <button
                  onClick={handleCopy}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md font-medium transition-colors ${
                    copied
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-emerald-500 text-white hover:bg-emerald-600"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-5 h-5" />
                      ¡Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      Copiar Mensaje
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
