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
};

const statusConfig = {
  confirmada: {
    label: "Confirmada",
    color: "text-[#3D5A4C] bg-[#CCE3DE]",
  },
  no_responde: {
    label: "No responde",
    color: "text-[#8B6914] bg-[#F5E6D3]",
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

export function UpcomingAppointments({
  appointments,
}: UpcomingAppointmentsProps) {
  return (
    <div className="bg-[#F6FFF8] rounded-xl p-6 shadow-sm border border-[#CCE3DE]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[#2D3D35]">
          Citas de Mañana
        </h3>
        <Link
          href="/citas"
          className="flex items-center gap-1 text-sm text-[#6B9080] hover:text-[#5A7A6B] font-medium"
        >
          Ver todas
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {appointments.length === 0 ? (
        <div className="text-center py-8 text-[#5C7A6B]">
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
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-[#CCE3DE]/30 transition-colors"
              >
                {/* Time */}
                <div className="flex items-center gap-2 min-w-[80px]">
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
