"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, MapPin, X, Check, Ban } from "lucide-react";
import type { Location, LocationFormData } from "@/types/settings";

interface LocationsSettingsProps {
  locations: Location[];
  onRefresh: () => void;
}

export function LocationsSettings({ locations, onRefresh }: LocationsSettingsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<LocationFormData>({
    name: "",
    address: "",
  });

  const openModal = (location?: Location) => {
    if (location) {
      setEditingLocation(location);
      setFormData({
        name: location.name,
        address: location.address || "",
      });
    } else {
      setEditingLocation(null);
      setFormData({ name: "", address: "" });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingLocation(null);
    setFormData({ name: "", address: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      const url = editingLocation
        ? `/api/locations/${editingLocation.id}`
        : "/api/locations";
      const method = editingLocation ? "PUT" : "POST";

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

  const handleDelete = async (location: Location) => {
    if (!confirm(`¿Eliminar la ubicación "${location.name}"?`)) return;

    try {
      const response = await fetch(`/api/locations/${location.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error deleting location:", error);
    }
  };

  const handleToggleActive = async (location: Location) => {
    try {
      const response = await fetch(`/api/locations/${location.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !location.isActive }),
      });

      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error toggling location:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-[#2D3D35]">Ubicaciones</h3>
          <p className="text-sm text-[#5C7A6B]">
            Administra los lugares donde se realizan las citas
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#6B9080] text-white rounded-md hover:bg-[#5A7A6B] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Ubicación
        </button>
      </div>

      {/* List */}
      <div className="bg-[#F6FFF8] rounded-lg border border-[#CCE3DE] overflow-hidden">
        {locations.length === 0 ? (
          <div className="p-8 text-center">
            <MapPin className="w-12 h-12 text-[#CCE3DE] mx-auto mb-3" />
            <p className="text-[#5C7A6B]">No hay ubicaciones registradas</p>
            <button
              onClick={() => openModal()}
              className="mt-3 text-[#6B9080] hover:underline"
            >
              Agregar primera ubicación
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#CCE3DE]">
            {locations.map((location) => (
              <div
                key={location.id}
                className={`p-4 flex items-center justify-between ${
                  !location.isActive ? "opacity-60 bg-gray-50" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    location.isActive ? "bg-[#6B9080]" : "bg-gray-400"
                  }`}>
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-[#2D3D35]">{location.name}</p>
                    {location.address ? (
                      <p className="text-sm text-[#5C7A6B]">{location.address}</p>
                    ) : (
                      <p className="text-sm text-[#84A98C]">Sin dirección</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!location.isActive && (
                    <span className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded">
                      Inactiva
                    </span>
                  )}
                  <button
                    onClick={() => handleToggleActive(location)}
                    className={`p-2 rounded-lg transition-colors ${
                      location.isActive
                        ? "text-[#C65D3B] hover:bg-red-50"
                        : "text-[#2E7D32] hover:bg-green-50"
                    }`}
                    title={location.isActive ? "Desactivar" : "Activar"}
                  >
                    {location.isActive ? <Ban className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => openModal(location)}
                    className="p-2 text-[#5C7A6B] hover:bg-[#CCE3DE]/50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(location)}
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
                  {editingLocation ? "Editar Ubicación" : "Nueva Ubicación"}
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
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-[#CCE3DE] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#6B9080] text-[#2D3D35]"
                    placeholder="Ej: Consultorio Principal"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#3D5A4C] mb-1">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-[#CCE3DE] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#6B9080] text-[#2D3D35]"
                    placeholder="Ej: Calle 123 #45-67, Bogotá"
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
                    {isSubmitting ? "Guardando..." : editingLocation ? "Actualizar" : "Crear"}
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
