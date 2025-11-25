"use client";

import Link from "next/link";
import { ArrowRight, Clock, User, Video, MapPin, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface Appointment {
  id: string;
  time: string;
  patient: string;
  type: "presencial" | "virtual" | "terapia_choque";
  status: "confirmada" | "no_responde" | "cancelada" | "reagendada" | "completada";
}

interface UpcomingAppointmentsProps {
  appointments: Appointment[];
}

const typeConfig = {
  presencial: {
    icon: MapPin,
    label: "Presencial",
    color: "text-blue-600 bg-blue-50",
  },
  virtual: {
    icon: Video,
    label: "Virtual",
    color: "text-purple-600 bg-purple-50",
  },
  terapia_choque: {
    icon: Zap,
    label: "T. Choque",
    color: "text-amber-600 bg-amber-50",
  },
};

const statusConfig = {
  confirmada: {
    label: "Confirmada",
    color: "text-emerald-700 bg-emerald-50",
  },
  no_responde: {
    label: "No responde",
    color: "text-yellow-700 bg-yellow-50",
  },
  cancelada: {
    label: "Cancelada",
    color: "text-red-700 bg-red-50",
  },
  reagendada: {
    label: "Reagendada",
    color: "text-blue-700 bg-blue-50",
  },
  completada: {
    label: "Completada",
    color: "text-gray-700 bg-gray-50",
  },
};

export function UpcomingAppointments({
  appointments,
}: UpcomingAppointmentsProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Citas de Mañana
        </h3>
        <Link
          href="/citas"
          className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
        >
          Ver todas
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {appointments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No hay citas programadas para mañana
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((appointment) => {
            const typeInfo = typeConfig[appointment.type];
            const statusInfo = statusConfig[appointment.status];
            const TypeIcon = typeInfo.icon;

            return (
              <div
                key={appointment.id}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {/* Time */}
                <div className="flex items-center gap-2 min-w-[80px]">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">
                    {appointment.time}
                  </span>
                </div>

                {/* Patient */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700 truncate">
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
