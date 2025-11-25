"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  History,
  Pencil,
  MessageCircle,
  UserX,
  UserCheck,
  MoreHorizontal,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
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

interface PatientsTableProps {
  patients: Patient[];
  onViewHistory: (patientId: string) => void;
  onEdit: (patient: Patient) => void;
  onToggleActive: (patientId: string, isActive: boolean) => void;
  isLoading?: boolean;
}

function ActionMenu({
  patient,
  onViewHistory,
  onEdit,
  onToggleActive,
}: {
  patient: Patient;
  onViewHistory: (patientId: string) => void;
  onEdit: (patient: Patient) => void;
  onToggleActive: (patientId: string, isActive: boolean) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleWhatsApp = () => {
    const number = patient.whatsapp?.replace(/\D/g, "") || patient.phone?.replace(/\D/g, "");
    if (number) {
      window.open(`https://wa.me/${number}`, "_blank");
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 hover:bg-muted rounded-md transition-colors"
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-card border rounded-md shadow-lg z-10">
          <button
            onClick={() => {
              onViewHistory(patient.id);
              setIsOpen(false);
            }}
            className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
          >
            <History className="h-4 w-4" />
            Ver historial
          </button>
          <button
            onClick={() => {
              onEdit(patient);
              setIsOpen(false);
            }}
            className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
          >
            <Pencil className="h-4 w-4" />
            Editar
          </button>
          {(patient.whatsapp || patient.phone) && (
            <button
              onClick={handleWhatsApp}
              className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 text-green-600"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </button>
          )}
          <hr className="my-1" />
          <button
            onClick={() => {
              onToggleActive(patient.id, !patient.isActive);
              setIsOpen(false);
            }}
            className={`w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 ${
              patient.isActive ? "text-red-600" : "text-green-600"
            }`}
          >
            {patient.isActive ? (
              <>
                <UserX className="h-4 w-4" />
                Desactivar
              </>
            ) : (
              <>
                <UserCheck className="h-4 w-4" />
                Activar
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export function PatientsTable({
  patients,
  onViewHistory,
  onEdit,
  onToggleActive,
  isLoading,
}: PatientsTableProps) {
  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="animate-pulse">
          <div className="h-12 bg-muted" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-muted/50 border-t" />
          ))}
        </div>
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <div className="bg-card rounded-lg border p-8 text-center">
        <p className="text-muted-foreground">No se encontraron pacientes</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium">Código</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Nombre</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Teléfono</th>
              <th className="px-4 py-3 text-left text-sm font-medium">WhatsApp</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Estado</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Primera Cita</th>
              <th className="px-4 py-3 text-center text-sm font-medium">Citas</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Total</th>
              <th className="px-4 py-3 text-center text-sm font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((patient) => (
              <tr key={patient.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3">
                  <span className="font-mono text-sm text-primary">
                    {patient.patientCode}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium">{patient.fullName}</span>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {patient.phone || "-"}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {patient.whatsapp || "-"}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {patient.email || "-"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      patient.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {patient.isActive ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {patient.firstAppointmentDate
                    ? format(new Date(patient.firstAppointmentDate), "d MMM yyyy", {
                        locale: es,
                      })
                    : "-"}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="font-medium">{patient.totalAppointments}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-medium text-emerald-600">
                    {formatCOP(patient.totalSpent)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center">
                    <ActionMenu
                      patient={patient}
                      onViewHistory={onViewHistory}
                      onEdit={onEdit}
                      onToggleActive={onToggleActive}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
