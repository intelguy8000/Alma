"use client";

import { useState, useEffect, useCallback } from "react";
import { X, AlertTriangle } from "lucide-react";

interface Patient {
  id?: string;
  patientCode?: string;
  fullName: string;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  notes?: string | null;
}

interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patient: Patient) => Promise<void>;
  patient?: Patient | null;
}

export function PatientModal({
  isOpen,
  onClose,
  onSave,
  patient,
}: PatientModalProps) {
  const [formData, setFormData] = useState<Patient>({
    fullName: "",
    phone: "",
    whatsapp: "",
    email: "",
    notes: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState<{
    message: string;
    patientName: string;
    patientCode: string;
  } | null>(null);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);

  useEffect(() => {
    if (patient) {
      setFormData({
        id: patient.id,
        patientCode: patient.patientCode,
        fullName: patient.fullName,
        phone: patient.phone || "",
        whatsapp: patient.whatsapp || "",
        email: patient.email || "",
        notes: patient.notes || "",
      });
    } else {
      setFormData({
        fullName: "",
        phone: "",
        whatsapp: "",
        email: "",
        notes: "",
      });
    }
    setError("");
    setDuplicateWarning(null);
  }, [patient, isOpen]);

  // Check for duplicate phone/whatsapp
  const checkDuplicate = useCallback(async (phone: string, whatsapp: string) => {
    const normalizedPhone = phone?.replace(/\D/g, "") || "";
    const normalizedWhatsapp = whatsapp?.replace(/\D/g, "") || "";

    if (!normalizedPhone && !normalizedWhatsapp) {
      setDuplicateWarning(null);
      return;
    }

    setIsCheckingDuplicate(true);
    try {
      // We'll check by trying to create/update - the API will return the duplicate info
      const searchNumber = normalizedPhone || normalizedWhatsapp;
      const response = await fetch(`/api/patients?search=${searchNumber}`);
      if (response.ok) {
        const patients = await response.json();
        // Find a patient with matching phone/whatsapp that isn't the current one
        const duplicate = patients.find((p: Patient & { id: string }) => {
          if (patient?.id && p.id === patient.id) return false;
          const pPhone = p.phone?.replace(/\D/g, "") || "";
          const pWhatsapp = p.whatsapp?.replace(/\D/g, "") || "";
          return (
            (normalizedPhone && (pPhone === normalizedPhone || pWhatsapp === normalizedPhone)) ||
            (normalizedWhatsapp && (pPhone === normalizedWhatsapp || pWhatsapp === normalizedWhatsapp))
          );
        });

        if (duplicate) {
          setDuplicateWarning({
            message: "Ya existe un paciente con este número",
            patientName: duplicate.fullName,
            patientCode: duplicate.patientCode,
          });
        } else {
          setDuplicateWarning(null);
        }
      }
    } catch (err) {
      console.error("Error checking duplicate:", err);
    } finally {
      setIsCheckingDuplicate(false);
    }
  }, [patient?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.fullName.trim()) {
      setError("El nombre es requerido");
      return;
    }

    setIsLoading(true);
    try {
      await onSave(formData);
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
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="relative bg-card rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {patient ? "Editar Paciente" : "Nuevo Paciente"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-md transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          {patient?.patientCode && (
            <div>
              <label className="block text-sm font-medium mb-1 text-muted-foreground">
                Código
              </label>
              <input
                type="text"
                value={patient.patientCode}
                disabled
                className="w-full px-3 py-2 border border-input rounded-md bg-muted text-muted-foreground"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">
              Nombre completo <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Nombre del paciente"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Teléfono</label>
            <input
              type="tel"
              value={formData.phone || ""}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              onBlur={() => checkDuplicate(formData.phone || "", formData.whatsapp || "")}
              className={`w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring ${
                duplicateWarning ? "border-red-400" : "border-input"
              }`}
              placeholder="+57 300 123 4567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">WhatsApp</label>
            <input
              type="tel"
              value={formData.whatsapp || ""}
              onChange={(e) =>
                setFormData({ ...formData, whatsapp: e.target.value })
              }
              onBlur={() => checkDuplicate(formData.phone || "", formData.whatsapp || "")}
              className={`w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring ${
                duplicateWarning ? "border-red-400" : "border-input"
              }`}
              placeholder="+57 300 123 4567"
            />
          </div>

          {duplicateWarning && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-red-700">{duplicateWarning.message}</p>
                <p className="text-red-600">
                  Paciente: {duplicateWarning.patientName} ({duplicateWarning.patientCode})
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={formData.email || ""}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="paciente@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notas</label>
            <textarea
              value={formData.notes || ""}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              placeholder="Notas adicionales sobre el paciente..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-input rounded-md hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || isCheckingDuplicate || !!duplicateWarning}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isLoading ? "Guardando..." : isCheckingDuplicate ? "Verificando..." : patient ? "Guardar" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
