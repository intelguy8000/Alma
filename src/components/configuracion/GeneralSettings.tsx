"use client";

import { useState } from "react";
import { Save, Building2, Palette } from "lucide-react";
import type { OrganizationSettings, GeneralSettingsFormData } from "@/types/settings";
import { SETTINGS_KEYS } from "@/types/settings";

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
    defaultAppointmentValue: settings[SETTINGS_KEYS.DEFAULT_APPOINTMENT_VALUE] || "160000",
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
          <label className="block text-sm font-medium text-[#3D5A4C] mb-1">
            Color Principal
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={formData.primaryColor || "#6B9080"}
              onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
              className="w-12 h-12 rounded-lg border border-[#CCE3DE] cursor-pointer"
            />
            <input
              type="text"
              value={formData.primaryColor || "#6B9080"}
              onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
              className="flex-1 px-3 py-2 border border-[#CCE3DE] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#6B9080] text-[#2D3D35] font-mono"
              placeholder="#6B9080"
            />
          </div>
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
