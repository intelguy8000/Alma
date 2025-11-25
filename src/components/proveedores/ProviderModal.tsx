"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { Provider, ProviderFormData } from "@/types/providers";

interface ProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (provider: ProviderFormData) => Promise<void>;
  provider?: Provider | null;
}

export function ProviderModal({
  isOpen,
  onClose,
  onSave,
  provider,
}: ProviderModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    contactName: "",
    phone: "",
    email: "",
    notes: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (provider) {
        setFormData({
          name: provider.name,
          contactName: provider.contactName || "",
          phone: provider.phone || "",
          email: provider.email || "",
          notes: provider.notes || "",
        });
      } else {
        setFormData({
          name: "",
          contactName: "",
          phone: "",
          email: "",
          notes: "",
        });
      }
      setError("");
    }
  }, [isOpen, provider]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("El nombre es requerido");
      return;
    }

    setIsLoading(true);
    try {
      const providerFormData: ProviderFormData = {
        id: provider?.id,
        name: formData.name.trim(),
        contactName: formData.contactName.trim() || null,
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        notes: formData.notes.trim() || null,
      };
      await onSave(providerFormData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-[#F6FFF8] rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-[#CCE3DE]">
          <h2 className="text-lg font-semibold text-[#2D3D35]">
            {provider ? "Editar Proveedor" : "Nuevo Proveedor"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#CCE3DE] rounded-md transition-colors"
          >
            <X className="h-5 w-5 text-[#5C7A6B]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-[#FFE4D6] text-[#C65D3B] text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-[#3D5A4C] mb-1">
              Nombre <span className="text-[#E07A5F]">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-[#CCE3DE] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#6B9080] text-[#2D3D35]"
              placeholder="Nombre del proveedor"
              required
            />
          </div>

          {/* Contact Name */}
          <div>
            <label className="block text-sm font-medium text-[#3D5A4C] mb-1">
              Nombre de contacto
            </label>
            <input
              type="text"
              value={formData.contactName}
              onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
              className="w-full px-3 py-2 border border-[#CCE3DE] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#6B9080] text-[#2D3D35]"
              placeholder="Persona de contacto"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-[#3D5A4C] mb-1">
              Teléfono
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-[#CCE3DE] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#6B9080] text-[#2D3D35]"
              placeholder="+57 300 123 4567"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-[#3D5A4C] mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-[#CCE3DE] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#6B9080] text-[#2D3D35]"
              placeholder="proveedor@email.com"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-[#3D5A4C] mb-1">
              Notas
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-[#CCE3DE] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#6B9080] text-[#2D3D35] resize-none"
              placeholder="Notas adicionales..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-[#CCE3DE] rounded-md hover:bg-[#CCE3DE]/50 transition-colors text-[#3D5A4C]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-[#6B9080] text-white rounded-md hover:bg-[#5A7A6B] transition-colors disabled:opacity-50"
            >
              {isLoading ? "Guardando..." : provider ? "Guardar" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
