"use client";

import Link from "next/link";
import { ArrowRight, Clock, User, Video, MapPin, Zap, AlertTriangle, CheckCircle, XCircle, Calendar, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Appointment {
  id: string;
  time: string;
  patient: string;
  type: "presencial" | "virtual" | "terapia_choque" | "terapia_capilar";
  status: "confirmada" | "no_responde" | "cancelada" | "reagendada" | "completada";
}

interface TomorrowStats {
  total: number;
  confirmed: number;
  pending: number;
  cancelled: number;
}

interface UpcomingAppointmentsProps {
  appointments: Appointment[];
  stats: TomorrowStats;
  dateDisplay: string;
  dateLink: string;
}

const typeConfig = {
  presencial: {
    icon: MapPin,
    label: "Presencial",
    color: "text-[#6B9080] bg-[#CCE3DE]",
  },
  virtual: {
    icon: Video,
    label: "Virtual",
    color: "text-[#5B8BD0] bg-[#D4E5F7]",
  },
  terapia_choque: {
    icon: Zap,
    label: "T. Choque",
    color: "text-[#D4A574] bg-[#F5E6D3]",
  },
  terapia_capilar: {
    icon: Sparkles,
    label: "T. Capilar",
    color: "text-[#8B5CF6] bg-[#EDE9FE]",
  },
};

const statusConfig = {
  confirmada: {
    label: "Confirmada",
    color: "text-[#3D5A4C] bg-[#CCE3DE]",
  },
  no_responde: {
    label: "No responde",
    color: "text-[#8B6914] bg-[#FEF3C7]",
  },
  cancelada: {
    label: "Cancelada",
    color: "text-[#C65D3B] bg-[#FFE4D6]",
  },
  reagendada: {
    label: "Reagendada",
    color: "text-[#5B3F7A] bg-[#E8D5F2]",
  },
  completada: {
    label: "Completada",
    color: "text-[#2E7D32] bg-[#E8F5E9]",
  },
};

function StatusBanner({ stats }: { stats: TomorrowStats }) {
  // State D: No appointments
  if (stats.total === 0) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-100 border border-gray-200">
        <Calendar className="w-5 h-5 text-gray-500" />
        <span className="text-sm font-medium text-gray-600">
          No hay citas agendadas para mañana
        </span>
      </div>
    );
  }

  // State A: Has pending appointments
  if (stats.pending > 0) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
        <AlertTriangle className="w-5 h-5 text-amber-600" />
        <span className="text-sm font-medium text-amber-800">
          {stats.pending} {stats.pending === 1 ? "cita pendiente" : "citas pendientes"} por confirmar
        </span>
      </div>
    );
  }

  // State C: Has cancellations (but no pending)
  if (stats.cancelled > 0) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
        <XCircle className="w-5 h-5 text-red-500" />
        <span className="text-sm font-medium text-red-700">
          {stats.cancelled} {stats.cancelled === 1 ? "cita cancelada" : "citas canceladas"}
        </span>
      </div>
    );
  }

  // State B: All confirmed
  return (
    <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 border border-emerald-200">
      <CheckCircle className="w-5 h-5 text-emerald-600" />
      <span className="text-sm font-medium text-emerald-800">
        {stats.total === 1
          ? "La cita está confirmada"
          : `Todas las ${stats.total} citas están confirmadas`}
      </span>
    </div>
  );
}

export function UpcomingAppointments({
  appointments,
  stats,
  dateDisplay,
  dateLink,
}: UpcomingAppointmentsProps) {
  return (
    <div className="bg-[#F6FFF8] rounded-xl p-6 shadow-sm border border-[#CCE3DE]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-[#2D3D35]">
              Citas de Mañana
            </h3>
            {stats.total > 0 && (
              <span className="text-sm text-[#5C7A6B] font-medium">
                ({stats.total} total)
              </span>
            )}
          </div>
          <p className="text-sm text-[#5C7A6B] mt-0.5">
            {dateDisplay}
          </p>
        </div>
        <Link
          href={`/citas?date=${dateLink}`}
          className="flex items-center gap-1 text-sm text-[#6B9080] hover:text-[#5A7A6B] font-medium"
        >
          Ver todas
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Status Banner */}
      <StatusBanner stats={stats} />

      {/* Appointments List (only non-confirmed, needing action) */}
      {appointments.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium text-[#5C7A6B] uppercase tracking-wider mb-2">
            Requieren acción
          </p>
          {appointments.map((appointment) => {
            const typeInfo = typeConfig[appointment.type];
            const statusInfo = statusConfig[appointment.status];
            const TypeIcon = typeInfo.icon;

            return (
              <div
                key={appointment.id}
                className="flex items-center gap-4 p-3 rounded-lg bg-white border border-[#CCE3DE]/50 hover:border-[#CCE3DE] transition-colors"
              >
                {/* Time */}
                <div className="flex items-center gap-2 min-w-[70px]">
                  <Clock className="w-4 h-4 text-[#5C7A6B]" />
                  <span className="text-sm font-medium text-[#2D3D35]">
                    {appointment.time}
                  </span>
                </div>

                {/* Patient */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <User className="w-4 h-4 text-[#5C7A6B] flex-shrink-0" />
                  <span className="text-sm text-[#3D5A4C] truncate">
                    {appointment.patient}
                  </span>
                </div>

                {/* Type */}
                <div
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
                    typeInfo.color
                  )}
                >
                  <TypeIcon className="w-3 h-3" />
                  <span className="hidden sm:inline">{typeInfo.label}</span>
                </div>

                {/* Status */}
                <div
                  className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    statusInfo.color
                  )}
                >
                  {statusInfo.label}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
