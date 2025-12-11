"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Pencil,
  CheckCircle,
  CalendarClock,
  MapPin,
  Video,
  Zap,
  MoreVertical,
  Check,
  Trash2,
  Banknote,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getColombiaGreeting } from "@/lib/dates";

// WhatsApp icon SVG component
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

export interface Appointment {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  patientId?: string;
  patientName: string;
  patientPhone: string;
  patientWhatsapp?: string;
  type: "presencial" | "virtual" | "terapia_choque" | "terapia_capilar";
  location: string;
  locationLabel: string;
  status: "confirmada" | "no_responde" | "cancelada" | "reagendada" | "completada";
  notes: string;
  hasSales?: boolean;
}

interface AppointmentsTableProps {
  appointments: Appointment[];
  onEdit: (appointment: Appointment) => void;
  onComplete: (appointment: Appointment) => void;
  onReschedule: (appointment: Appointment) => void;
  onStatusChange: (id: string, status: Appointment["status"]) => void;
  onDelete: (appointment: Appointment) => void;
  onPaymentInfo: (appointment: Appointment) => void;
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
  terapia_capilar: {
    icon: Sparkles,
    label: "T. Capilar",
    color: "text-purple-700 bg-purple-50 border-purple-200",
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
  onDelete,
  onPaymentInfo,
}: AppointmentsTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [openStatusDropdown, setOpenStatusDropdown] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleWhatsAppCopy = async (appointment: Appointment) => {
    // Get greeting based on Colombia time
    const greeting = getColombiaGreeting();

    // Get first name only, capitalized
    const firstName = appointment.patientName
      .split(" ")[0]
      .toLowerCase()
      .replace(/^\w/, (c) => c.toUpperCase());

    // Format day name (capitalized)
    const dayName = format(appointment.date, "EEEE", { locale: es })
      .replace(/^\w/, (c) => c.toUpperCase());

    // Format date (e.g., "24 de Noviembre")
    const dateFormatted = format(appointment.date, "d 'de' MMMM", { locale: es })
      .replace(/de (\w)/, (_, c) => `de ${c.toUpperCase()}`);

    // Format time to 12h (e.g., "11 am", "3 pm")
    const [hourStr] = appointment.startTime.split(":");
    const hourNum = parseInt(hourStr, 10);
    const period = hourNum >= 12 ? "pm" : "am";
    const hour12 = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
    const timeFormatted = `${hour12} ${period}`;

    // Determine message based on appointment type
    const isTerapiaChoque = appointment.type === "terapia_choque";

    let message: string;
    if (isTerapiaChoque) {
      message = `${greeting} ${firstName}, soy Julio Zapata, médico, le estoy confirmando la cita agendada para el día ${dayName} ${dateFormatted} a las ${timeFormatted} - Sede La Ceja, quedo pendiente a la confirmación y muchas gracias.`;
    } else {
      message = `${greeting} ${firstName}, soy Julio Zapata, médico, le estoy confirmando la cita agendada para el día ${dayName} ${dateFormatted} a las ${timeFormatted} - La Ceja, Calle 7 sur 42-70 Edificio Fórum Consultorio 1103 o Virtual, quedo pendiente a la confirmación y muchas gracias.`;
    }

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
        <table className="data-table w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hora
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Paciente
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ubicación
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                WhatsApp
              </th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                  <td>
                    <div className="cell-with-subtitle">
                      <span className="text-sm font-medium text-gray-900">
                        {format(appointment.date, "dd/MM/yyyy")}
                      </span>
                      <span className="subtitle">
                        {format(appointment.date, "EEEE", { locale: es })}
                      </span>
                    </div>
                  </td>

                  {/* Time */}
                  <td>
                    <span className="text-sm text-gray-900">
                      {appointment.startTime}
                    </span>
                  </td>

                  {/* Patient */}
                  <td>
                    <div className="cell-with-subtitle cell-truncate" title={appointment.patientName}>
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {appointment.patientName}
                      </span>
                      {appointment.patientPhone && (
                        <span className="subtitle">
                          {appointment.patientPhone}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Type */}
                  <td>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border whitespace-nowrap",
                        typeInfo.color
                      )}
                    >
                      <TypeIcon className="w-3 h-3" />
                      {typeInfo.label}
                    </span>
                  </td>

                  {/* Location */}
                  <td>
                    <span className="text-sm text-gray-700 cell-truncate-sm block" title={appointment.locationLabel}>
                      {appointment.locationLabel}
                    </span>
                  </td>

                  {/* Status - Editable dropdown */}
                  <td>
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

                  {/* WhatsApp Column */}
                  <td>
                    <div className="flex justify-center gap-1">
                      <button
                        onClick={() => handleWhatsAppCopy(appointment)}
                        className={cn(
                          "p-2 rounded-lg transition-all",
                          copiedId === appointment.id
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20"
                        )}
                        title={copiedId === appointment.id ? "¡Copiado!" : "Copiar mensaje WhatsApp"}
                      >
                        {copiedId === appointment.id ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <WhatsAppIcon className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => onPaymentInfo(appointment)}
                        className="p-2 rounded-lg transition-all bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                        title="Datos de pago"
                      >
                        <Banknote className="w-5 h-5" />
                      </button>
                    </div>
                  </td>

                  {/* Actions */}
                  <td>
                    <div className="flex items-center justify-end gap-1">
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
                              <hr className="my-1 border-gray-100" />
                              {deleteConfirmId === appointment.id ? (
                                <button
                                  onClick={() => {
                                    onDelete(appointment);
                                    setDeleteConfirmId(null);
                                    setOpenDropdown(null);
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 flex items-center gap-2 text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Confirmar eliminación
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    if (appointment.hasSales) {
                                      alert("No se puede eliminar, tiene pagos registrados");
                                      setOpenDropdown(null);
                                    } else {
                                      setDeleteConfirmId(appointment.id);
                                    }
                                  }}
                                  className={cn(
                                    "w-full text-left px-3 py-2 text-sm flex items-center gap-2",
                                    appointment.hasSales
                                      ? "text-gray-400 cursor-not-allowed"
                                      : "text-red-600 hover:bg-red-50"
                                  )}
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Eliminar
                                </button>
                              )}
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
