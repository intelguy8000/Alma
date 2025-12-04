"use client";

import { useState } from "react";
import { X, Phone, Calendar, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface AtRiskPatient {
  id: string;
  fullName: string;
  phone: string | null;
  lastAppointmentDate: string;
  daysSinceLastVisit: number;
}

interface AtRiskPatientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: AtRiskPatient[];
  currentDays: number;
  onDaysChange: (days: number) => void;
}

const daysOptions = [15, 30, 45, 60, 90];

export function AtRiskPatientsModal({
  isOpen,
  onClose,
  patients,
  currentDays,
  onDaysChange,
}: AtRiskPatientsModalProps) {
  const [selectedDays, setSelectedDays] = useState(currentDays);

  if (!isOpen) return null;

  const handleDaysChange = (days: number) => {
    setSelectedDays(days);
    onDaysChange(days);
  };

  const handleWhatsApp = (phone: string | null, name: string) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, "");
    const message = encodeURIComponent(
      `Hola ${name}, te escribimos de Medicina del Alma. Hace tiempo no te vemos, ¿cómo estás? Queremos saber si te gustaría agendar una cita.`
    );
    window.open(`https://wa.me/57${cleanPhone}?text=${message}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Pacientes en Riesgo
              </h2>
              <p className="text-sm text-gray-500">
                {patients.length} pacientes sin cita en {selectedDays}+ días
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Days Filter */}
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Días sin visita:</span>
            <div className="flex gap-1">
              {daysOptions.map((days) => (
                <button
                  key={days}
                  onClick={() => handleDaysChange(days)}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    selectedDays === days
                      ? "bg-red-500 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  {days}+
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Patient List */}
        <div className="flex-1 overflow-y-auto p-4">
          {patients.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                No hay pacientes en riesgo con {selectedDays}+ días sin visita
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {patients.map((patient) => (
                <div
                  key={patient.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {patient.fullName}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(patient.lastAppointmentDate), "d MMM yyyy", { locale: es })}
                      </span>
                      <span className="text-red-500 font-medium">
                        {patient.daysSinceLastVisit} días
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {patient.phone && (
                      <button
                        onClick={() => handleWhatsApp(patient.phone, patient.fullName.split(" ")[0])}
                        className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                        title="Enviar WhatsApp"
                      >
                        <Phone className="w-4 h-4" />
                      </button>
                    )}
                    <a
                      href={`/citas?patientId=${patient.id}`}
                      className="px-3 py-2 bg-[#6B9080] hover:bg-[#5a7a6d] text-white text-sm rounded-lg transition-colors"
                    >
                      Agendar
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            Los pacientes se ordenan por más días sin visitar primero
          </p>
        </div>
      </div>
    </div>
  );
}
