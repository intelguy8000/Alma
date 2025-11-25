"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  MessageCircle,
  Pencil,
  CheckCircle,
  CalendarClock,
  MapPin,
  Video,
  Zap,
  MoreVertical,
  Copy,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Appointment {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  patientName: string;
  patientPhone: string;
  type: "presencial" | "virtual" | "terapia_choque";
  location: string;
  locationLabel: string;
  status: "confirmada" | "no_responde" | "cancelada" | "reagendada" | "completada";
  notes: string;
}

interface AppointmentsTableProps {
  appointments: Appointment[];
  onEdit: (appointment: Appointment) => void;
  onComplete: (appointment: Appointment) => void;
  onReschedule: (appointment: Appointment) => void;
  onStatusChange: (id: string, status: Appointment["status"]) => void;
}

const typeConfig = {
  presencial: {
    icon: MapPin,
    label: "Presencial",
    color: "text-emerald-700 bg-emerald-50 border-emerald-200",
  },
  virtual: {
    icon: Video,
    label: "Virtual",
    color: "text-blue-700 bg-blue-50 border-blue-200",
  },
  terapia_choque: {
    icon: Zap,
    label: "T. Choque",
    color: "text-amber-700 bg-amber-50 border-amber-200",
  },
};

const statusConfig = {
  confirmada: { label: "Confirmada", color: "text-emerald-700 bg-emerald-50" },
  no_responde: { label: "No responde", color: "text-yellow-700 bg-yellow-50" },
  cancelada: { label: "Cancelada", color: "text-red-700 bg-red-50" },
  reagendada: { label: "Reagendada", color: "text-blue-700 bg-blue-50" },
  completada: { label: "Completada", color: "text-gray-700 bg-gray-100" },
};

export function AppointmentsTable({
  appointments,
  onEdit,
  onComplete,
  onReschedule,
  onStatusChange,
}: AppointmentsTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [openStatusDropdown, setOpenStatusDropdown] = useState<string | null>(null);

  const handleWhatsAppCopy = async (appointment: Appointment) => {
    const dateFormatted = format(appointment.date, "EEEE d 'de' MMMM", { locale: es });
    const message = `Hola ${appointment.patientName.split(" ")[0]}, te recordamos tu cita el ${dateFormatted} a las ${appointment.startTime} en ${appointment.locationLabel}. Medicina del Alma.`;

    try {
      await navigator.clipboard.writeText(message);
      setCopiedId(appointment.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleStatusChange = (id: string, newStatus: Appointment["status"]) => {
    onStatusChange(id, newStatus);
    setOpenStatusDropdown(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hora
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Paciente
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ubicación
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {appointments.map((appointment) => {
              const typeInfo = typeConfig[appointment.type];
              const statusInfo = statusConfig[appointment.status];
              const TypeIcon = typeInfo.icon;

              return (
                <tr
                  key={appointment.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {/* Date */}
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">
                      {format(appointment.date, "dd/MM/yyyy")}
                    </div>
                    <div className="text-xs text-gray-500">
                      {format(appointment.date, "EEEE", { locale: es })}
                    </div>
                  </td>

                  {/* Time */}
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-900">
                      {appointment.startTime}
                    </span>
                  </td>

                  {/* Patient */}
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">
                      {appointment.patientName}
                    </div>
                    {appointment.patientPhone && (
                      <div className="text-xs text-gray-500">
                        {appointment.patientPhone}
                      </div>
                    )}
                  </td>

                  {/* Type */}
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border",
                        typeInfo.color
                      )}
                    >
                      <TypeIcon className="w-3 h-3" />
                      {typeInfo.label}
                    </span>
                  </td>

                  {/* Location */}
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-700">
                      {appointment.locationLabel}
                    </span>
                  </td>

                  {/* Status - Editable dropdown */}
                  <td className="px-4 py-3">
                    <div className="relative">
                      <button
                        onClick={() =>
                          setOpenStatusDropdown(
                            openStatusDropdown === appointment.id
                              ? null
                              : appointment.id
                          )
                        }
                        className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-gray-200 transition-all",
                          statusInfo.color
                        )}
                      >
                        {statusInfo.label}
                      </button>

                      {openStatusDropdown === appointment.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenStatusDropdown(null)}
                          />
                          <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 min-w-[140px]">
                            {Object.entries(statusConfig).map(([key, config]) => (
                              <button
                                key={key}
                                onClick={() =>
                                  handleStatusChange(
                                    appointment.id,
                                    key as Appointment["status"]
                                  )
                                }
                                className={cn(
                                  "w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-2",
                                  appointment.status === key && "bg-gray-50"
                                )}
                              >
                                <span
                                  className={cn(
                                    "w-2 h-2 rounded-full",
                                    config.color.replace("text-", "bg-").split(" ")[0]
                                  )}
                                />
                                {config.label}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {/* WhatsApp Copy */}
                      <button
                        onClick={() => handleWhatsAppCopy(appointment)}
                        className="p-2 rounded-lg hover:bg-emerald-50 text-gray-500 hover:text-emerald-600 transition-colors relative"
                        title="Copiar mensaje WhatsApp"
                      >
                        {copiedId === appointment.id ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <MessageCircle className="w-4 h-4" />
                        )}
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => onEdit(appointment)}
                        className="p-2 rounded-lg hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-colors"
                        title="Editar cita"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      {/* More actions dropdown */}
                      <div className="relative">
                        <button
                          onClick={() =>
                            setOpenDropdown(
                              openDropdown === appointment.id
                                ? null
                                : appointment.id
                            )
                          }
                          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {openDropdown === appointment.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setOpenDropdown(null)}
                            />
                            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 min-w-[160px]">
                              <button
                                onClick={() => {
                                  onComplete(appointment);
                                  setOpenDropdown(null);
                                }}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                              >
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                                Completar
                              </button>
                              <button
                                onClick={() => {
                                  onReschedule(appointment);
                                  setOpenDropdown(null);
                                }}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                              >
                                <CalendarClock className="w-4 h-4 text-blue-500" />
                                Re-agendar
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {appointments.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No hay citas que coincidan con los filtros
        </div>
      )}
    </div>
  );
}
