"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Plus, Users } from "lucide-react";
import { PatientsTable } from "@/components/pacientes/PatientsTable";
import { PatientModal } from "@/components/pacientes/PatientModal";
import { PatientHistoryDrawer } from "@/components/pacientes/PatientHistoryDrawer";
import { formatCOP } from "@/lib/utils";

interface Patient {
  id: string;
  patientCode: string;
  fullName: string;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  notes?: string | null;
  isActive: boolean;
  firstAppointmentDate?: string | null;
  totalAppointments: number;
  totalSpent: number;
}

interface DuplicateInfo {
  id: string;
  duplicateOf: string;
}

export default function PacientesPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Drawer states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [historyPatientId, setHistoryPatientId] = useState<string | null>(null);

  // Delete confirmation states
  const [deletePatient, setDeletePatient] = useState<Patient | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPatients = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const [patientsRes, duplicatesRes] = await Promise.all([
        fetch(`/api/patients?${params.toString()}`),
        fetch("/api/patients/duplicates"),
      ]);

      if (patientsRes.ok) {
        const data = await patientsRes.json();
        setPatients(data);
      }

      if (duplicatesRes.ok) {
        const dupData = await duplicatesRes.json();
        setDuplicates(dupData);
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPatients();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchPatients]);

  const handleCreatePatient = () => {
    setSelectedPatient(null);
    setIsModalOpen(true);
  };

  const handleEditPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsModalOpen(true);
  };

  const handleViewHistory = (patientId: string) => {
    setHistoryPatientId(patientId);
    setIsDrawerOpen(true);
  };

  const handleToggleActive = async (patientId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/patients/${patientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });

      if (response.ok) {
        fetchPatients();
      }
    } catch (error) {
      console.error("Error toggling patient status:", error);
    }
  };

  const handleSavePatient = async (patientData: Partial<Patient>) => {
    const isEditing = !!patientData.id;

    const response = await fetch(
      isEditing ? `/api/patients/${patientData.id}` : "/api/patients",
      {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patientData),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error al guardar");
    }

    fetchPatients();
  };

  const handleDeleteClick = (patient: Patient) => {
    setDeletePatient(patient);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletePatient) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/patients/${deletePatient.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.canDelete === false) {
          setDeleteError(data.error + " Puedes desactivarlo en su lugar.");
        } else {
          setDeleteError(data.error || "Error al eliminar");
        }
        return;
      }

      setDeletePatient(null);
      fetchPatients();
    } catch (error) {
      console.error("Error deleting patient:", error);
      setDeleteError("Error al eliminar paciente");
    } finally {
      setIsDeleting(false);
    }
  };

  // Stats
  const totalPatients = patients.length;
  const activePatients = patients.filter((p) => p.isActive).length;
  const totalAppointments = patients.reduce((sum, p) => sum + p.totalAppointments, 0);
  const totalRevenue = patients.reduce((sum, p) => sum + p.totalSpent, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Pacientes</h1>
          <p className="text-muted-foreground">
            Gestiona los pacientes del consultorio
          </p>
        </div>
        <button
          onClick={handleCreatePatient}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nuevo Paciente
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalPatients}</p>
              <p className="text-sm text-muted-foreground">Total Pacientes</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activePatients}</p>
              <p className="text-sm text-muted-foreground">Activos</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <div>
            <p className="text-2xl font-bold">{totalAppointments}</p>
            <p className="text-sm text-muted-foreground">Total Citas</p>
          </div>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <div>
            <p className="text-2xl font-bold text-emerald-600">
              {formatCOP(totalRevenue)}
            </p>
            <p className="text-sm text-muted-foreground">Ingresos Totales</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre, código o email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">Todos los estados</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>
      </div>

      {/* Table */}
      <PatientsTable
        patients={patients}
        duplicates={duplicates}
        onViewHistory={handleViewHistory}
        onEdit={handleEditPatient}
        onToggleActive={handleToggleActive}
        onDelete={handleDeleteClick}
        isLoading={isLoading}
      />

      {/* Modal */}
      <PatientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePatient}
        patient={selectedPatient}
      />

      {/* History Drawer */}
      <PatientHistoryDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        patientId={historyPatientId}
      />

      {/* Delete Confirmation Modal */}
      {deletePatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border shadow-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-2">Eliminar Paciente</h3>

            {deleteError ? (
              <>
                <p className="text-red-600 mb-4">{deleteError}</p>
                <div className="flex justify-end">
                  <button
                    onClick={() => setDeletePatient(null)}
                    className="px-4 py-2 bg-muted rounded-md hover:bg-muted/80"
                  >
                    Cerrar
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-muted-foreground mb-4">
                  ¿Seguro que deseas eliminar a <strong>{deletePatient.fullName}</strong>?
                  Esta acción no se puede deshacer.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setDeletePatient(null)}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-muted rounded-md hover:bg-muted/80 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    {isDeleting ? "Eliminando..." : "Eliminar"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
