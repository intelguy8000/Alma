"use client";

import { useState } from "react";
import { Lock, Unlock, AlertTriangle, ShieldCheck, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SafeBoxSettingsProps {
  isVistaContableEnabled: boolean;
  onToggleVistaContable: (enabled: boolean, password: string) => Promise<boolean>;
}

const CORRECT_PASSWORD = "T4b4t4";

export function SafeBoxSettings({ isVistaContableEnabled, onToggleVistaContable }: SafeBoxSettingsProps) {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<"enable" | "disable" | null>(null);

  const handleToggleClick = (action: "enable" | "disable") => {
    setPendingAction(action);
    setShowPasswordModal(true);
    setPassword("");
    setError("");
  };

  const handleSubmitPassword = async () => {
    if (password !== CORRECT_PASSWORD) {
      setError("Clave incorrecta. Intenta de nuevo.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const success = await onToggleVistaContable(pendingAction === "enable", password);
      if (success) {
        setShowPasswordModal(false);
        setPassword("");
        setPendingAction(null);
      } else {
        setError("Error al guardar la configuración.");
      }
    } catch {
      setError("Error al guardar la configuración.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-[#CCE3DE]">
        <div className="w-10 h-10 rounded-lg bg-[#6B9080] flex items-center justify-center">
          <Lock className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[#2D3D35]">Caja Fuerte</h2>
          <p className="text-sm text-[#5C7A6B]">Control de visibilidad de datos sensibles</p>
        </div>
      </div>

      {/* Vista Contable Toggle */}
      <div className="bg-white rounded-lg border border-[#CCE3DE] p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {isVistaContableEnabled ? (
                <ShieldCheck className="w-5 h-5 text-[#1565C0]" />
              ) : (
                <Unlock className="w-5 h-5 text-[#5C7A6B]" />
              )}
              <h3 className="font-medium text-[#2D3D35]">Vista Contable</h3>
              <span
                className={cn(
                  "px-2 py-0.5 text-xs font-medium rounded-full",
                  isVistaContableEnabled
                    ? "bg-[#E3F2FD] text-[#1565C0]"
                    : "bg-[#F5F5F5] text-[#5C7A6B]"
                )}
              >
                {isVistaContableEnabled ? "Activada" : "Desactivada"}
              </span>
            </div>
            <p className="text-sm text-[#5C7A6B] mb-4">
              Muestra únicamente registros con documentación contable completa.
              Esto aplica a Ventas, Pacientes, Citas, Dashboard y P&G.
            </p>

            {/* Warning */}
            <div className="flex items-start gap-2 p-3 bg-[#FFF8E1] rounded-lg border border-[#FFE082]">
              <AlertTriangle className="w-5 h-5 text-[#F9A825] shrink-0 mt-0.5" />
              <div className="text-sm text-[#8B6914]">
                <p className="font-medium">Atención</p>
                <p>Al activar, se mostrarán únicamente los registros con documentación contable completa.</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => handleToggleClick(isVistaContableEnabled ? "disable" : "enable")}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-colors",
              isVistaContableEnabled
                ? "bg-[#FFE4D6] text-[#C65D3B] hover:bg-[#FFD4C4]"
                : "bg-[#6B9080] text-white hover:bg-[#5A7A6B]"
            )}
          >
            {isVistaContableEnabled ? "Desactivar" : "Activar"}
          </button>
        </div>
      </div>

      {/* Recovery Info */}
      <div className="flex items-start gap-2 p-4 bg-[#F0F4F8] rounded-lg border border-[#D0D7DE]">
        <BarChart3 className="w-5 h-5 text-[#5C7A6B] shrink-0 mt-0.5" />
        <div className="text-sm text-[#5C7A6B]">
          <p>
            Si olvidaste la clave, contacta al administrador del sistema.
          </p>
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#E3F2FD] flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-[#1565C0]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#2D3D35]">
                  {pendingAction === "enable" ? "Activar" : "Desactivar"} Vista Contable
                </h3>
                <p className="text-sm text-[#5C7A6B]">Ingresa la clave para continuar</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#3D5A4C] mb-1">
                  Clave de seguridad
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmitPassword()}
                  placeholder="Ingresa la clave..."
                  className="w-full px-3 py-2 border border-[#CCE3DE] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6B9080] text-[#2D3D35]"
                  autoFocus
                />
                {error && (
                  <p className="mt-1 text-sm text-[#C65D3B]">{error}</p>
                )}
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPassword("");
                    setError("");
                    setPendingAction(null);
                  }}
                  className="px-4 py-2 text-[#5C7A6B] hover:bg-[#CCE3DE]/50 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmitPassword}
                  disabled={isLoading || !password}
                  className={cn(
                    "px-4 py-2 rounded-lg font-medium transition-colors",
                    pendingAction === "enable"
                      ? "bg-[#1565C0] text-white hover:bg-[#0D47A1]"
                      : "bg-[#C65D3B] text-white hover:bg-[#B54D2B]",
                    (isLoading || !password) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isLoading ? "Guardando..." : "Confirmar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
