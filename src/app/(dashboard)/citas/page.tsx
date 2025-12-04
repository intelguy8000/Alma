"use client";

import { useState, useEffect, useCallback } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
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
  PaymentInfoModal,
} from "@/components/citas";
import type { Appointment } from "@/components/citas";
import { AppointmentModal, AppointmentData } from "@/components/calendar";
import { parseLocalDate, parseTimeToDisplay, formatDBDate } from "@/lib/dates";

interface APIAppointment {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  type: "presencial" | "virtual" | "terapia_choque";
  location: string | null;
  status: "confirmada" | "no_responde" | "cancelada" | "reagendada" | "completada";
  notes: string | null;
  patient: {
    id: string;
    fullName: string;
    patientCode: string;
    phone: string | null;
    whatsapp: string | null;
  };
  sales?: { id: string; amount: number }[];
}

interface Location {
  id: string;
  name: string;
  isActive: boolean;
}

// Convert API appointment to component format
const apiToAppointment = (apt: APIAppointment, locations: Location[]): Appointment => {
  const location = locations.find(l => l.id === apt.location);
  return {
    id: apt.id,
    date: parseLocalDate(apt.date),
    startTime: parseTimeToDisplay(apt.startTime),
    endTime: parseTimeToDisplay(apt.endTime),
    patientId: apt.patient.id,
    patientName: apt.patient.fullName,
    patientPhone: apt.patient.phone || apt.patient.whatsapp || "",
    patientWhatsapp: apt.patient.whatsapp || "",
    type: apt.type,
    location: apt.location || "",
    locationLabel: location?.name || apt.location || "",
    status: apt.status,
    notes: apt.notes || "",
    hasSales: (apt.sales?.length ?? 0) > 0,
  };
};

export default function CitasPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  const [paymentInfoModalOpen, setPaymentInfoModalOpen] = useState(false);
  const [defaultAppointmentValue, setDefaultAppointmentValue] = useState(332000);

  const [locationsLoaded, setLocationsLoaded] = useState(false);

  // Fetch locations
  const fetchLocations = useCallback(async () => {
    try {
      const response = await fetch("/api/locations");
      if (response.ok) {
        const data = await response.json();
        setLocations(data);
      }
    } catch (error) {
      console.error("Error fetching locations:", error);
    } finally {
      setLocationsLoaded(true);
    }
  }, []);

  // Fetch default appointment value
  const fetchDefaultValue = useCallback(async () => {
    try {
      const response = await fetch("/api/settings");
      if (response.ok) {
        const data = await response.json();
        if (data.settings?.default_appointment_value) {
          setDefaultAppointmentValue(parseInt(data.settings.default_appointment_value, 10));
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  }, []);

  // Fetch appointments from API
  const fetchAppointments = useCallback(async (currentLocations: Location[]) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.dateFrom) params.append("startDate", filters.dateFrom);
      if (filters.dateTo) params.append("endDate", filters.dateTo);
      if (filters.status !== "todos") params.append("status", filters.status);
      if (filters.type !== "todos") params.append("type", filters.type);

      const response = await fetch(`/api/appointments?${params.toString()}`);
      if (response.ok) {
        const data: APIAppointment[] = await response.json();
        const converted = data.map(apt => apiToAppointment(apt, currentLocations));
        setAppointments(converted);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Initial load: fetch locations and settings
  useEffect(() => {
    fetchLocations();
    fetchDefaultValue();
  }, [fetchLocations, fetchDefaultValue]);

  // Fetch appointments when locations are loaded or filters change
  useEffect(() => {
    if (locationsLoaded) {
      fetchAppointments(locations);
    }
  }, [locationsLoaded, filters, fetchAppointments, locations]);

  // Calculate scorecards from current data
  const scorecards = {
    total: appointments.length,
    confirmadas: appointments.filter((a) => a.status === "confirmada").length,
    canceladas: appointments.filter((a) => a.status === "cancelada").length,
    asistencia: appointments.length > 0
      ? Math.round(
          ((appointments.filter((a) => a.status === "completada").length +
            appointments.filter((a) => a.status === "confirmada").length) /
            appointments.length) *
            100
        )
      : 0,
  };

  // Handlers
  const handleNewAppointment = () => {
    setSelectedAppointment(undefined);
    setAppointmentModalMode("create");
    setAppointmentModalOpen(true);
  };

  const handleEdit = (appointment: Appointment) => {
    setSelectedAppointment({
      id: appointment.id,
      patientId: appointment.patientId,
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

  const handlePaymentInfo = () => {
    setPaymentInfoModalOpen(true);
  };

  const handleStatusChange = async (id: string, newStatus: Appointment["status"]) => {
    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchAppointments(locations);
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleSaveAppointment = async (data: AppointmentData) => {
    try {
      if (appointmentModalMode === "create") {
        const response = await fetch("/api/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientId: data.patientId,
            date: formatDBDate(data.date),
            startTime: data.startTime,
            endTime: data.endTime,
            type: data.type,
            location: data.location,
            status: data.status,
            notes: data.notes,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          alert(error.error || "Error al crear cita");
          return;
        }
      } else if (data.id) {
        const response = await fetch(`/api/appointments/${data.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientId: data.patientId,
            date: formatDBDate(data.date),
            startTime: data.startTime,
            endTime: data.endTime,
            type: data.type,
            location: data.location,
            status: data.status,
            notes: data.notes,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          alert(error.error || "Error al actualizar cita");
          return;
        }
      }

      fetchAppointments(locations);
      setAppointmentModalOpen(false);
    } catch (error) {
      console.error("Error saving appointment:", error);
      alert("Error al guardar cita");
    }
  };

  const handleDelete = async (appointment: Appointment) => {
    if (appointment.hasSales) {
      alert("No se puede eliminar, tiene pagos registrados");
      return;
    }

    try {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchAppointments(locations);
      } else {
        const data = await response.json();
        alert(data.error || "Error al eliminar la cita");
      }
    } catch (error) {
      console.error("Error deleting appointment:", error);
      alert("Error al eliminar la cita");
    }
  };

  const handleConfirmReschedule = async (newDate: Date, newTime: string) => {
    if (!rescheduleTarget) return;

    try {
      // Mark old appointment as rescheduled
      await fetch(`/api/appointments/${rescheduleTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "reagendada" }),
      });

      // Create new appointment
      const [hours, minutes] = newTime.split(":").map(Number);
      const endHours = hours + 1;
      const endTime = `${endHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

      await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: rescheduleTarget.patientId,
          date: formatDBDate(newDate),
          startTime: newTime,
          endTime: endTime,
          type: rescheduleTarget.type,
          location: rescheduleTarget.location,
          status: "confirmada",
          notes: `Reagendada desde ${format(rescheduleTarget.date, "dd/MM/yyyy")}`,
        }),
      });

      fetchAppointments(locations);
      setRescheduleTarget(null);
      setRescheduleModalOpen(false);
    } catch (error) {
      console.error("Error rescheduling:", error);
      alert("Error al reagendar cita");
    }
  };

  const handleConfirmComplete = async (registerPayment: boolean, paymentData?: { amount: string; method: string; note: string }) => {
    if (!completeTarget) return;

    try {
      // Mark as completed
      await fetch(`/api/appointments/${completeTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completada" }),
      });

      // Register payment if requested
      if (registerPayment && paymentData) {
        const saleResponse = await fetch("/api/sales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientId: completeTarget.patientId,
            appointmentId: completeTarget.id,
            amount: parseFloat(paymentData.amount.replace(/[^0-9.-]+/g, "")),
            paymentMethod: paymentData.method,
            paymentNote: paymentData.note,
          }),
        });

        if (!saleResponse.ok) {
          const error = await saleResponse.json();
          alert(error.error || "Error al registrar el pago");
          return;
        }
      }

      fetchAppointments(locations);
      setCompleteTarget(null);
      setCompleteModalOpen(false);
    } catch (error) {
      console.error("Error completing appointment:", error);
      alert("Error al completar cita");
    }
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
          subtitle="En el período"
          icon={CalendarDays}
          iconColor="bg-blue-500"
        />
        <Scorecard
          title="Confirmadas"
          value={scorecards.confirmadas.toString()}
          subtitle="Pendientes de atender"
          icon={CheckCircle}
          iconColor="bg-emerald-500"
        />
        <Scorecard
          title="Canceladas"
          value={scorecards.canceladas.toString()}
          subtitle="En el período"
          icon={XCircle}
          iconColor="bg-red-500"
        />
        <Scorecard
          title="Tasa Asistencia"
          value={`${scorecards.asistencia}%`}
          subtitle="Confirmadas + Completadas"
          icon={Percent}
          iconColor="bg-violet-500"
        />
      </div>

      {/* Filters */}
      <AppointmentFilters filters={filters} onFiltersChange={setFilters} />

      {/* Table */}
      {isLoading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center justify-center">
            <div className="text-gray-500">Cargando citas...</div>
          </div>
        </div>
      ) : (
        <AppointmentsTable
          appointments={appointments}
          onEdit={handleEdit}
          onComplete={handleComplete}
          onReschedule={handleReschedule}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
          onPaymentInfo={handlePaymentInfo}
        />
      )}

      {/* Modals */}
      <AppointmentModal
        isOpen={appointmentModalOpen}
        onClose={() => setAppointmentModalOpen(false)}
        onSave={handleSaveAppointment}
        onDelete={(id: string) => {
          // Wrapper for modal - creates minimal appointment object
          handleDelete({ id, hasSales: false } as Appointment);
        }}
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

      <PaymentInfoModal
        isOpen={paymentInfoModalOpen}
        onClose={() => setPaymentInfoModalOpen(false)}
        defaultAmount={defaultAppointmentValue}
      />
    </div>
  );
}
