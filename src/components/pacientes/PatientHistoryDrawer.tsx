"use client";

import { useState, useEffect } from "react";
import { X, Calendar, DollarSign, Phone, Mail, FileText } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { formatCOP } from "@/lib/utils";

interface Sale {
  id: string;
  amount: number;
  paymentMethod: string;
}

interface Appointment {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
  notes?: string | null;
  sales: Sale[];
}

interface PatientHistory {
  id: string;
  patientCode: string;
  fullName: string;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  notes?: string | null;
  isActive: boolean;
  firstAppointmentDate?: string | null;
  createdAt: string;
  appointments: Appointment[];
  totalSpent: number;
  totalAppointments: number;
}

interface PatientHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string | null;
}

const typeLabels: Record<string, string> = {
  presencial: "Presencial",
  virtual: "Virtual",
  terapia_choque: "Terapia de Choque",
};

const statusLabels: Record<string, string> = {
  confirmada: "Confirmada",
  no_responde: "No Responde",
  cancelada: "Cancelada",
  reagendada: "Reagendada",
  completada: "Completada",
};

const statusColors: Record<string, string> = {
  confirmada: "bg-blue-100 text-blue-800",
  no_responde: "bg-yellow-100 text-yellow-800",
  cancelada: "bg-red-100 text-red-800",
  reagendada: "bg-purple-100 text-purple-800",
  completada: "bg-green-100 text-green-800",
};

export function PatientHistoryDrawer({
  isOpen,
  onClose,
  patientId,
}: PatientHistoryDrawerProps) {
  const [patient, setPatient] = useState<PatientHistory | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && patientId) {
      fetchPatientHistory();
    }
  }, [isOpen, patientId]);

  const fetchPatientHistory = async () => {
    if (!patientId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/patients/${patientId}`);
      if (response.ok) {
        const data = await response.json();
        setPatient(data);
      }
    } catch (error) {
      console.error("Error fetching patient history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card w-full max-w-lg h-full overflow-y-auto shadow-xl animate-in slide-in-from-right">
        <div className="sticky top-0 bg-card border-b p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Historial del Paciente</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-md transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-4">
            <div className="animate-pulse space-y-4">
              <div className="h-20 bg-muted rounded-lg" />
              <div className="h-40 bg-muted rounded-lg" />
              <div className="h-40 bg-muted rounded-lg" />
            </div>
          </div>
        ) : patient ? (
          <div className="p-4 space-y-6">
            {/* Patient Info Card */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {patient.patientCode}
                  </p>
                  <h3 className="text-xl font-semibold">{patient.fullName}</h3>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    patient.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {patient.isActive ? "Activo" : "Inactivo"}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2 text-sm">
                {patient.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{patient.phone}</span>
                  </div>
                )}
                {patient.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{patient.email}</span>
                  </div>
                )}
                {patient.notes && (
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <FileText className="h-4 w-4 mt-0.5" />
                    <span>{patient.notes}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-primary/10 rounded-lg p-4 text-center">
                <Calendar className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{patient.totalAppointments}</p>
                <p className="text-sm text-muted-foreground">Total Citas</p>
              </div>
              <div className="bg-emerald-100 rounded-lg p-4 text-center">
                <DollarSign className="h-6 w-6 mx-auto mb-2 text-emerald-600" />
                <p className="text-2xl font-bold text-emerald-600">
                  {formatCOP(patient.totalSpent)}
                </p>
                <p className="text-sm text-muted-foreground">Total Gastado</p>
              </div>
            </div>

            {/* Appointments List */}
            <div>
              <h4 className="font-medium mb-3">Historial de Citas</h4>
              {patient.appointments.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">
                  No hay citas registradas
                </p>
              ) : (
                <div className="space-y-3">
                  {patient.appointments.map((apt) => {
                    const aptAmount = apt.sales.reduce(
                      (sum, s) => sum + Number(s.amount),
                      0
                    );
                    return (
                      <div
                        key={apt.id}
                        className="border rounded-lg p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {format(new Date(apt.date), "d 'de' MMMM, yyyy", {
                                locale: es,
                              })}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(`2000-01-01T${apt.startTime}`), "HH:mm")} -{" "}
                              {format(new Date(`2000-01-01T${apt.endTime}`), "HH:mm")}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              statusColors[apt.status] || "bg-gray-100"
                            }`}
                          >
                            {statusLabels[apt.status] || apt.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {typeLabels[apt.type] || apt.type}
                          </span>
                          {aptAmount > 0 && (
                            <span className="font-medium text-emerald-600">
                              {formatCOP(aptAmount)}
                            </span>
                          )}
                        </div>
                        {apt.notes && (
                          <p className="text-sm text-muted-foreground border-t pt-2">
                            {apt.notes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            No se encontró el paciente
          </div>
        )}
      </div>
    </div>
  );
}
