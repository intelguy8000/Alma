"use client";

import { useState, useEffect } from "react";
import { Save, Building2, Palette, Shield, Check } from "lucide-react";
import type { OrganizationSettings, GeneralSettingsFormData } from "@/types/settings";
import { SETTINGS_KEYS } from "@/types/settings";

// Predefined color palette
const colorPalette = [
  { value: "#6B9080", name: "Verde Sage" },
  { value: "#84A98C", name: "Verde Menta" },
  { value: "#A7C4BC", name: "Verde Agua" },
  { value: "#8FBCBB", name: "Turquesa" },
  { value: "#B48EAD", name: "Lavanda" },
  { value: "#D4A5A5", name: "Rosa Dusty" },
  { value: "#E8C07D", name: "Durazno" },
  { value: "#94B49F", name: "Verde Oliva" },
];

// Session timeout options
const sessionTimeoutOptions = [
  { value: "15", label: "15 minutos" },
  { value: "30", label: "30 minutos" },
  { value: "60", label: "1 hora" },
  { value: "120", label: "2 horas" },
  { value: "240", label: "4 horas" },
  { value: "480", label: "8 horas" },
  { value: "never", label: "Nunca" },
];

interface GeneralSettingsProps {
  organization: OrganizationSettings | null;
  settings: Record<string, string>;
  onSave: (data: GeneralSettingsFormData) => Promise<void>;
}

export function GeneralSettings({ organization, settings, onSave }: GeneralSettingsProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<GeneralSettingsFormData>({
    name: organization?.name || "",
    logoUrl: organization?.logoUrl || null,
    primaryColor: organization?.primaryColor || "#6B9080",
    defaultAppointmentValue: settings[SETTINGS_KEYS.DEFAULT_APPOINTMENT_VALUE] || "332000",
    sessionTimeout: settings[SETTINGS_KEYS.SESSION_TIMEOUT] || "60",
  });

  // Apply color to CSS variable
  useEffect(() => {
    document.documentElement.style.setProperty("--primary-color", formData.primaryColor || "#6B9080");
  }, [formData.primaryColor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (value: string) => {
    const number = parseInt(value.replace(/\D/g, "")) || 0;
    return new Intl.NumberFormat("es-CO").format(number);
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    setFormData({ ...formData, defaultAppointmentValue: rawValue });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Organization Name */}
      <div className="bg-[#F6FFF8] rounded-lg border border-[#CCE3DE] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-[#6B9080] flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-[#2D3D35]">Información del Consultorio</h3>
            <p className="text-sm text-[#5C7A6B]">Datos básicos de tu organización</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#3D5A4C] mb-1">
              Nombre del Consultorio
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-[#CCE3DE] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#6B9080] text-[#2D3D35]"
              placeholder="Ej: Medicina del Alma"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3D5A4C] mb-1">
              URL del Logo (opcional)
            </label>
            <input
              type="url"
              value={formData.logoUrl || ""}
              onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value || null })}
              className="w-full px-3 py-2 border border-[#CCE3DE] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#6B9080] text-[#2D3D35]"
              placeholder="https://example.com/logo.png"
            />
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="bg-[#F6FFF8] rounded-lg border border-[#CCE3DE] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-[#6B9080] flex items-center justify-center">
            <Palette className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-[#2D3D35]">Apariencia</h3>
            <p className="text-sm text-[#5C7A6B]">Personaliza los colores</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#3D5A4C] mb-3">
            Color Principal
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {colorPalette.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => setFormData({ ...formData, primaryColor: color.value })}
                className="relative group"
                title={color.name}
              >
                <div
                  className={`w-12 h-12 rounded-lg border-2 transition-all ${
                    formData.primaryColor === color.value
                      ? "border-gray-900 ring-2 ring-offset-2 ring-gray-400"
                      : "border-transparent hover:border-gray-300"
                  }`}
                  style={{ backgroundColor: color.value }}
                >
                  {formData.primaryColor === color.value && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check className="w-5 h-5 text-white drop-shadow-md" />
                    </div>
                  )}
                </div>
                <span className="block text-xs text-center text-[#5C7A6B] mt-1 truncate">
                  {color.name}
                </span>
              </button>
            ))}
          </div>
          <p className="text-xs text-[#5C7A6B] mt-3">
            Color seleccionado: <span className="font-mono">{formData.primaryColor}</span>
          </p>
        </div>
      </div>

      {/* Default Values */}
      <div className="bg-[#F6FFF8] rounded-lg border border-[#CCE3DE] p-6">
        <h3 className="font-semibold text-[#2D3D35] mb-4">Valores Predeterminados</h3>

        <div>
          <label className="block text-sm font-medium text-[#3D5A4C] mb-1">
            Valor por defecto de cita
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5C7A6B]">$</span>
            <input
              type="text"
              value={formatCurrency(formData.defaultAppointmentValue)}
              onChange={handleCurrencyChange}
              className="w-full pl-7 pr-3 py-2 border border-[#CCE3DE] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#6B9080] text-[#2D3D35]"
              placeholder="160.000"
            />
          </div>
          <p className="text-xs text-[#5C7A6B] mt-1">
            Este valor se usará como predeterminado al registrar ventas
          </p>
        </div>
      </div>

      {/* Security - Session Timeout */}
      <div className="bg-[#F6FFF8] rounded-lg border border-[#CCE3DE] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-[#6B9080] flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-[#2D3D35]">Seguridad</h3>
            <p className="text-sm text-[#5C7A6B]">Configuración de seguridad de la sesión</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#3D5A4C] mb-1">
            Cerrar sesión por inactividad
          </label>
          <select
            value={formData.sessionTimeout || "60"}
            onChange={(e) => setFormData({ ...formData, sessionTimeout: e.target.value })}
            className="w-full max-w-xs px-3 py-2 border border-[#CCE3DE] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#6B9080] text-[#2D3D35]"
          >
            {sessionTimeoutOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-[#5C7A6B] mt-1">
            La sesión se cerrará automáticamente después de este tiempo sin actividad
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#6B9080] text-white rounded-md hover:bg-[#5A7A6B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {isSaving ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>
    </form>
  );
}
