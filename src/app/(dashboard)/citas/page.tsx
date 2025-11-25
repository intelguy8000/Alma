"use client";

import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, addHours } from "date-fns";
import {
  CalendarDays,
  CheckCircle,
  XCircle,
  Percent,
  Plus,
} from "lucide-react";
import { Scorecard } from "@/components/dashboard";
import {
  AppointmentFilters,
  AppointmentsTable,
  RescheduleModal,
  CompleteAppointmentModal,
} from "@/components/citas";
import type { Appointment } from "@/components/citas";
import { AppointmentModal, AppointmentData } from "@/components/calendar";

// Mock appointments data
const initialAppointments: Appointment[] = [
  {
    id: "1",
    date: new Date(),
    startTime: "09:00",
    endTime: "10:00",
    patientName: "María García López",
    patientPhone: "+57 300 123 4567",
    type: "presencial",
    location: "forum_1103",
    locationLabel: "Forum 1103",
    status: "confirmada",
    notes: "Primera consulta",
  },
  {
    id: "2",
    date: new Date(),
    startTime: "11:00",
    endTime: "12:00",
    patientName: "Carlos Rodríguez",
    patientPhone: "+57 301 234 5678",
    type: "virtual",
    location: "virtual",
    locationLabel: "Virtual",
    status: "confirmada",
    notes: "",
  },
  {
    id: "3",
    date: new Date(),
    startTime: "14:00",
    endTime: "15:00",
    patientName: "Ana Martínez",
    patientPhone: "+57 302 345 6789",
    type: "terapia_choque",
    location: "la_ceja",
    locationLabel: "La Ceja",
    status: "no_responde",
    notes: "Llamar para confirmar",
  },
  {
    id: "4",
    date: new Date(),
    startTime: "16:00",
    endTime: "17:00",
    patientName: "José Hernández",
    patientPhone: "+57 303 456 7890",
    type: "presencial",
    location: "forum_1103",
    locationLabel: "Forum 1103",
    status: "cancelada",
    notes: "Canceló por viaje",
  },
  {
    id: "5",
    date: addHours(new Date(), 24),
    startTime: "10:00",
    endTime: "11:00",
    patientName: "Laura Sánchez Pérez",
    patientPhone: "+57 304 567 8901",
    type: "presencial",
    location: "forum_1103",
    locationLabel: "Forum 1103",
    status: "confirmada",
    notes: "",
  },
  {
    id: "6",
    date: addHours(new Date(), 24),
    startTime: "15:00",
    endTime: "16:00",
    patientName: "Pedro González",
    patientPhone: "+57 305 678 9012",
    type: "virtual",
    location: "virtual",
    locationLabel: "Virtual",
    status: "completada",
    notes: "Sesión de seguimiento",
  },
  {
    id: "7",
    date: addHours(new Date(), 48),
    startTime: "09:00",
    endTime: "10:00",
    patientName: "Sofía Ramírez",
    patientPhone: "+57 306 789 0123",
    type: "presencial",
    location: "la_ceja",
    locationLabel: "La Ceja",
    status: "confirmada",
    notes: "",
  },
  {
    id: "8",
    date: addHours(new Date(), 72),
    startTime: "11:00",
    endTime: "12:00",
    patientName: "Miguel Torres",
    patientPhone: "+57 307 890 1234",
    type: "terapia_choque",
    location: "forum_1103",
    locationLabel: "Forum 1103",
    status: "reagendada",
    notes: "Reagendada desde la semana pasada",
  },
];

const locationMap: Record<string, string> = {
  forum_1103: "Forum 1103",
  la_ceja: "La Ceja",
  virtual: "Virtual",
};

export default function CitasPage() {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [filters, setFilters] = useState({
    dateFrom: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    dateTo: format(endOfMonth(new Date()), "yyyy-MM-dd"),
    status: "todos",
    type: "todos",
  });

  // Modals state
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [appointmentModalMode, setAppointmentModalMode] = useState<"create" | "edit">("create");
  const [selectedAppointment, setSelectedAppointment] = useState<Partial<AppointmentData> | undefined>();

  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);

  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [completeTarget, setCompleteTarget] = useState<Appointment | null>(null);

  // Filter appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const aptDate = format(apt.date, "yyyy-MM-dd");
      const matchesDateFrom = !filters.dateFrom || aptDate >= filters.dateFrom;
      const matchesDateTo = !filters.dateTo || aptDate <= filters.dateTo;
      const matchesStatus = filters.status === "todos" || apt.status === filters.status;
      const matchesType = filters.type === "todos" || apt.type === filters.type;

      return matchesDateFrom && matchesDateTo && matchesStatus && matchesType;
    });
  }, [appointments, filters]);

  // Calculate scorecards
  const scorecards = useMemo(() => {
    const total = filteredAppointments.length;
    const confirmadas = filteredAppointments.filter((a) => a.status === "confirmada").length;
    const canceladas = filteredAppointments.filter((a) => a.status === "cancelada").length;
    const completadas = filteredAppointments.filter((a) => a.status === "completada").length;
    const asistencia = total > 0 ? Math.round(((completadas + confirmadas) / total) * 100) : 0;

    return { total, confirmadas, canceladas, asistencia };
  }, [filteredAppointments]);

  // Handlers
  const handleNewAppointment = () => {
    setSelectedAppointment(undefined);
    setAppointmentModalMode("create");
    setAppointmentModalOpen(true);
  };

  const handleEdit = (appointment: Appointment) => {
    setSelectedAppointment({
      id: appointment.id,
      patientId: "1", // Would come from real data
      patientName: appointment.patientName,
      date: appointment.date,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      type: appointment.type,
      location: appointment.location,
      status: appointment.status,
      notes: appointment.notes,
    });
    setAppointmentModalMode("edit");
    setAppointmentModalOpen(true);
  };

  const handleComplete = (appointment: Appointment) => {
    setCompleteTarget(appointment);
    setCompleteModalOpen(true);
  };

  const handleReschedule = (appointment: Appointment) => {
    setRescheduleTarget(appointment);
    setRescheduleModalOpen(true);
  };

  const handleStatusChange = (id: string, newStatus: Appointment["status"]) => {
    setAppointments((prev) =>
      prev.map((apt) => (apt.id === id ? { ...apt, status: newStatus } : apt))
    );
  };

  const handleSaveAppointment = (data: AppointmentData) => {
    if (appointmentModalMode === "create") {
      const newAppointment: Appointment = {
        id: Date.now().toString(),
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        patientName: data.patientName,
        patientPhone: "",
        type: data.type,
        location: data.location,
        locationLabel: locationMap[data.location] || data.location,
        status: data.status,
        notes: data.notes,
      };
      setAppointments((prev) => [...prev, newAppointment]);
    } else if (data.id) {
      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === data.id
            ? {
                ...apt,
                date: data.date,
                startTime: data.startTime,
                endTime: data.endTime,
                patientName: data.patientName,
                type: data.type,
                location: data.location,
                locationLabel: locationMap[data.location] || data.location,
                status: data.status,
                notes: data.notes,
              }
            : apt
        )
      );
    }
  };

  const handleConfirmReschedule = (newDate: Date, newTime: string) => {
    if (!rescheduleTarget) return;

    // Mark old appointment as rescheduled
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === rescheduleTarget.id ? { ...apt, status: "reagendada" as const } : apt
      )
    );

    // Create new appointment
    const [hours, minutes] = newTime.split(":").map(Number);
    const endHours = hours + 1;
    const newAppointment: Appointment = {
      id: Date.now().toString(),
      date: newDate,
      startTime: newTime,
      endTime: `${endHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`,
      patientName: rescheduleTarget.patientName,
      patientPhone: rescheduleTarget.patientPhone,
      type: rescheduleTarget.type,
      location: rescheduleTarget.location,
      locationLabel: rescheduleTarget.locationLabel,
      status: "confirmada",
      notes: `Reagendada desde ${format(rescheduleTarget.date, "dd/MM/yyyy")}`,
    };

    setAppointments((prev) => [...prev, newAppointment]);
    setRescheduleTarget(null);
  };

  const handleConfirmComplete = (registerPayment: boolean, paymentData?: { amount: string; method: string; note: string }) => {
    if (!completeTarget) return;

    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === completeTarget.id ? { ...apt, status: "completada" as const } : apt
      )
    );

    if (registerPayment && paymentData) {
      // Would save to database in real app
      console.log("Payment registered:", paymentData);
    }

    setCompleteTarget(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Citas</h1>
          <p className="text-gray-500 mt-1">Gestiona todas las citas del consultorio</p>
        </div>
        <button
          onClick={handleNewAppointment}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          Nueva Cita
        </button>
      </div>

      {/* Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Scorecard
          title="Total Citas"
          value={scorecards.total.toString()}
          subtitle="Este mes"
          change={12}
          icon={CalendarDays}
          iconColor="bg-blue-500"
        />
        <Scorecard
          title="Confirmadas"
          value={scorecards.confirmadas.toString()}
          subtitle="Pendientes de atender"
          change={8}
          icon={CheckCircle}
          iconColor="bg-emerald-500"
        />
        <Scorecard
          title="Canceladas"
          value={scorecards.canceladas.toString()}
          subtitle="Este mes"
          change={-15}
          icon={XCircle}
          iconColor="bg-red-500"
        />
        <Scorecard
          title="Tasa Asistencia"
          value={`${scorecards.asistencia}%`}
          subtitle="Confirmadas + Completadas"
          change={5}
          icon={Percent}
          iconColor="bg-violet-500"
        />
      </div>

      {/* Filters */}
      <AppointmentFilters filters={filters} onFiltersChange={setFilters} />

      {/* Table */}
      <AppointmentsTable
        appointments={filteredAppointments}
        onEdit={handleEdit}
        onComplete={handleComplete}
        onReschedule={handleReschedule}
        onStatusChange={handleStatusChange}
      />

      {/* Modals */}
      <AppointmentModal
        isOpen={appointmentModalOpen}
        onClose={() => setAppointmentModalOpen(false)}
        onSave={handleSaveAppointment}
        initialData={selectedAppointment}
        mode={appointmentModalMode}
      />

      <RescheduleModal
        isOpen={rescheduleModalOpen}
        onClose={() => {
          setRescheduleModalOpen(false);
          setRescheduleTarget(null);
        }}
        onConfirm={handleConfirmReschedule}
        patientName={rescheduleTarget?.patientName || ""}
        currentDate={rescheduleTarget?.date || new Date()}
        currentTime={rescheduleTarget?.startTime || "09:00"}
      />

      <CompleteAppointmentModal
        isOpen={completeModalOpen}
        onClose={() => {
          setCompleteModalOpen(false);
          setCompleteTarget(null);
        }}
        onConfirm={handleConfirmComplete}
        patientName={completeTarget?.patientName || ""}
      />
    </div>
  );
}
