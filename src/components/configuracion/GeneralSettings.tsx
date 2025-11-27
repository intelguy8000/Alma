"use client";

import { useState } from "react";
import { Save, Building2, Palette, Shield, Check } from "lucide-react";
import type { OrganizationSettings, GeneralSettingsFormData } from "@/types/settings";
import { SETTINGS_KEYS } from "@/types/settings";
import { useThemeColor, colorPalette } from "@/contexts/ThemeColorContext";

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
  const { primaryColor, setPrimaryColor } = useThemeColor();
  const [formData, setFormData] = useState<GeneralSettingsFormData>({
    name: organization?.name || "",
    logoUrl: organization?.logoUrl || null,
    primaryColor: primaryColor,
    defaultAppointmentValue: settings[SETTINGS_KEYS.DEFAULT_APPOINTMENT_VALUE] || "332000",
    sessionTimeout: settings[SETTINGS_KEYS.SESSION_TIMEOUT] || "60",
  });

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

  const handleColorChange = async (color: string) => {
    setFormData({ ...formData, primaryColor: color });
    // Apply immediately and save to user preferences
    await setPrimaryColor(color);
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
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
            style={{ backgroundColor: primaryColor }}
          >
            <Palette className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-[#2D3D35]">Tu Color Favorito</h3>
            <p className="text-sm text-[#5C7A6B]">Elige el color que más te guste</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
          {colorPalette.map((color) => {
            const isSelected = primaryColor === color.value;
            return (
              <button
                key={color.value}
                type="button"
                onClick={() => handleColorChange(color.value)}
                className={`group relative flex flex-col items-center transition-all duration-200 ${
                  isSelected ? "scale-105" : "hover:scale-105"
                }`}
              >
                {/* Color circle */}
                <div
                  className={`w-14 h-14 rounded-full shadow-md transition-all duration-200 flex items-center justify-center ${
                    isSelected
                      ? "ring-4 ring-offset-2 ring-offset-[#F6FFF8]"
                      : "hover:shadow-lg"
                  }`}
                  style={{
                    backgroundColor: color.value,
                    // @ts-expect-error - CSS custom property for ring color
                    "--tw-ring-color": isSelected ? color.value : undefined
                  }}
                >
                  {isSelected && (
                    <Check className="w-6 h-6 text-white drop-shadow-lg" />
                  )}
                </div>
                {/* Color name */}
                <span className={`mt-2 text-xs font-medium transition-colors ${
                  isSelected ? "text-[#2D3D35]" : "text-[#5C7A6B]"
                }`}>
                  {color.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Subtle confirmation message */}
        <p className="text-center text-xs text-[#84A98C] mt-6">
          Los cambios se guardan automáticamente
        </p>
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
