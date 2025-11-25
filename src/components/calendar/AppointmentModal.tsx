"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  X,
  Calendar,
  Clock,
  User,
  MapPin,
  Video,
  Zap,
  FileText,
  Check,
  AlertCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface AppointmentData {
  id?: string;
  patientId: string;
  patientName: string;
  date: Date;
  startTime: string;
  endTime: string;
  type: "presencial" | "virtual" | "terapia_choque";
  location: string;
  status: "confirmada" | "no_responde" | "cancelada" | "reagendada" | "completada";
  notes: string;
}

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AppointmentData) => void;
  onDelete?: (id: string) => void;
  initialData?: Partial<AppointmentData>;
  mode: "create" | "edit" | "view";
}

// Mock patients for the selector
const mockPatients = [
  { id: "1", name: "María García López", code: "MDA-0001" },
  { id: "2", name: "Carlos Rodríguez", code: "MDA-0002" },
  { id: "3", name: "Ana Martínez", code: "MDA-0003" },
  { id: "4", name: "José Hernández", code: "MDA-0004" },
  { id: "5", name: "Laura Sánchez Pérez", code: "MDA-0005" },
  { id: "6", name: "Pedro González", code: "MDA-0006" },
  { id: "7", name: "Sofía Ramírez", code: "MDA-0007" },
  { id: "8", name: "Miguel Torres", code: "MDA-0008" },
];

const locations = [
  { value: "forum_1103", label: "Forum 1103" },
  { value: "la_ceja", label: "La Ceja" },
  { value: "virtual", label: "Virtual" },
];

const appointmentTypes = [
  { value: "presencial", label: "Presencial", icon: MapPin, color: "text-emerald-600" },
  { value: "virtual", label: "Virtual", icon: Video, color: "text-blue-600" },
  { value: "terapia_choque", label: "Terapia de Choque", icon: Zap, color: "text-amber-600" },
];

const statuses = [
  { value: "confirmada", label: "Confirmada", icon: Check, color: "text-emerald-600 bg-emerald-50" },
  { value: "no_responde", label: "No responde", icon: AlertCircle, color: "text-yellow-600 bg-yellow-50" },
  { value: "cancelada", label: "Cancelada", icon: XCircle, color: "text-red-600 bg-red-50" },
  { value: "reagendada", label: "Reagendada", icon: RefreshCw, color: "text-blue-600 bg-blue-50" },
  { value: "completada", label: "Completada", icon: Check, color: "text-gray-600 bg-gray-50" },
];

export function AppointmentModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
  mode,
}: AppointmentModalProps) {
  const [formData, setFormData] = useState<AppointmentData>({
    id: "",
    patientId: "",
    patientName: "",
    date: new Date(),
    startTime: "09:00",
    endTime: "10:00",
    type: "presencial",
    location: "forum_1103",
    status: "confirmada",
    notes: "",
  });

  const [patientSearch, setPatientSearch] = useState("");
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        ...initialData,
        date: initialData.date || new Date(),
      }));
      if (initialData.patientName) {
        setPatientSearch(initialData.patientName);
      }
    }
  }, [initialData]);

  const filteredPatients = mockPatients.filter(
    (p) =>
      p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.code.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const handlePatientSelect = (patient: typeof mockPatients[0]) => {
    setFormData((prev) => ({
      ...prev,
      patientId: patient.id,
      patientName: patient.name,
    }));
    setPatientSearch(patient.name);
    setShowPatientDropdown(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const isViewMode = mode === "view";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {mode === "create"
              ? "Nueva Cita"
              : mode === "edit"
              ? "Editar Cita"
              : "Detalle de Cita"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Patient Search */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Paciente
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={patientSearch}
                onChange={(e) => {
                  setPatientSearch(e.target.value);
                  setShowPatientDropdown(true);
                }}
                onFocus={() => setShowPatientDropdown(true)}
                placeholder="Buscar paciente..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                disabled={isViewMode}
                required
              />
            </div>
            {showPatientDropdown && patientSearch && !isViewMode && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((patient) => (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => handlePatientSelect(patient)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
                    >
                      <span className="text-sm text-gray-900">{patient.name}</span>
                      <span className="text-xs text-gray-400">{patient.code}</span>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-2 text-sm text-gray-500">
                    No se encontraron pacientes
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Date and Time Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={format(formData.date, "yyyy-MM-dd")}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      date: new Date(e.target.value + "T12:00:00"),
                    }))
                  }
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  disabled={isViewMode}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hora
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => {
                    const start = e.target.value;
                    const [hours, minutes] = start.split(":").map(Number);
                    const endHours = hours + 1;
                    const end = `${endHours.toString().padStart(2, "0")}:${minutes
                      .toString()
                      .padStart(2, "0")}`;
                    setFormData((prev) => ({
                      ...prev,
                      startTime: start,
                      endTime: end,
                    }));
                  }}
                  min="07:00"
                  max="20:00"
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  disabled={isViewMode}
                  required
                />
              </div>
            </div>
          </div>

          {/* Appointment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Cita
            </label>
            <div className="grid grid-cols-3 gap-2">
              {appointmentTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = formData.type === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() =>
                      !isViewMode &&
                      setFormData((prev) => ({
                        ...prev,
                        type: type.value as AppointmentData["type"],
                      }))
                    }
                    className={cn(
                      "flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all",
                      isSelected
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-gray-200 hover:border-gray-300",
                      isViewMode && "cursor-default"
                    )}
                    disabled={isViewMode}
                  >
                    <Icon
                      className={cn("w-5 h-5", isSelected ? type.color : "text-gray-400")}
                    />
                    <span
                      className={cn(
                        "text-xs font-medium",
                        isSelected ? "text-emerald-700" : "text-gray-500"
                      )}
                    >
                      {type.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ubicación
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={formData.location}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, location: e.target.value }))
                }
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none bg-white"
                disabled={isViewMode}
              >
                {locations.map((loc) => (
                  <option key={loc.value} value={loc.value}>
                    {loc.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <div className="flex flex-wrap gap-2">
              {statuses.map((status) => {
                const Icon = status.icon;
                const isSelected = formData.status === status.value;
                return (
                  <button
                    key={status.value}
                    type="button"
                    onClick={() =>
                      !isViewMode &&
                      setFormData((prev) => ({
                        ...prev,
                        status: status.value as AppointmentData["status"],
                      }))
                    }
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                      isSelected ? status.color : "bg-gray-100 text-gray-500",
                      isSelected && "ring-2 ring-offset-1",
                      isViewMode && "cursor-default"
                    )}
                    disabled={isViewMode}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {status.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas (opcional)
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Agregar notas..."
                rows={3}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                disabled={isViewMode}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            {mode === "edit" && onDelete && formData.id && (
              <button
                type="button"
                onClick={() => {
                  onDelete(formData.id!);
                  onClose();
                }}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Eliminar
              </button>
            )}
            <div className={cn("flex gap-2", mode !== "edit" && "ml-auto")}>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {isViewMode ? "Cerrar" : "Cancelar"}
              </button>
              {!isViewMode && (
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors"
                >
                  {mode === "create" ? "Crear Cita" : "Guardar Cambios"}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
