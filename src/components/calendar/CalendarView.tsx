"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventClickArg, DateSelectArg, EventDropArg, EventMountArg } from "@fullcalendar/core";
import { format, addHours } from "date-fns";
import { Rows3, Rows4 } from "lucide-react";
import { parseDateToInput, parseTimeToDisplay } from "@/lib/dates";
import { AppointmentModal, AppointmentData } from "./AppointmentModal";
import { cn } from "@/lib/utils";

// Type labels for tooltip
const typeLabels = {
  presencial: "Presencial",
  virtual: "Virtual",
  terapia_choque: "T. Choque",
};

// View mode type
type ViewMode = "compact" | "comfort";

// LocalStorage key
const VIEW_MODE_KEY = "calendar_view_mode";

// Capitalize first letter of each word, lowercase rest
const formatName = (name: string): string => {
  return name
    .toLowerCase()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Truncate name if too long
const truncateName = (name: string, maxLength: number = 20): string => {
  const formatted = formatName(name);
  if (formatted.length <= maxLength) return formatted;
  return formatted.substring(0, maxLength) + "...";
};

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: {
    patientId: string;
    patientName: string;
    type: "presencial" | "virtual" | "terapia_choque";
    location: string;
    status: "confirmada" | "no_responde" | "cancelada" | "reagendada" | "completada";
    notes: string;
    startTimeStr: string;
    endTimeStr: string;
  };
  classNames?: string[];
}

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
  };
}

// Color configuration by type
const typeColors = {
  presencial: { bg: "#10B981", border: "#059669", text: "#ffffff" },
  virtual: { bg: "#3B82F6", border: "#2563EB", text: "#ffffff" },
  terapia_choque: { bg: "#F59E0B", border: "#D97706", text: "#ffffff" },
};

// Status modifiers
const getStatusClasses = (status: string): string[] => {
  switch (status) {
    case "no_responde":
      return ["calendar-event-warning"];
    case "cancelada":
      return ["calendar-event-cancelled"];
    case "completada":
      return ["calendar-event-completed"];
    default:
      return [];
  }
};

// Convert API appointment to calendar event
const appointmentToEvent = (apt: APIAppointment): CalendarEvent => {
  const colors = typeColors[apt.type];

  // Parse date string to avoid timezone issues using centralized helper
  const dateStr = parseDateToInput(apt.date);
  const [year, month, day] = dateStr.split("-").map(Number);

  // Parse time strings using centralized helper
  const startTimeStr = parseTimeToDisplay(apt.startTime);
  const endTimeStr = parseTimeToDisplay(apt.endTime);

  const [startHour, startMin] = startTimeStr.split(":").map(Number);
  const [endHour, endMin] = endTimeStr.split(":").map(Number);

  // Create dates using local timezone (month is 0-indexed)
  const start = new Date(year, month - 1, day, startHour, startMin, 0, 0);
  const end = new Date(year, month - 1, day, endHour, endMin, 0, 0);

  return {
    id: apt.id,
    title: truncateName(apt.patient.fullName),
    start,
    end,
    backgroundColor: colors.bg,
    borderColor: colors.border,
    textColor: colors.text,
    classNames: getStatusClasses(apt.status),
    extendedProps: {
      patientId: apt.patient.id,
      patientName: apt.patient.fullName,
      type: apt.type,
      location: apt.location || "forum_1103",
      status: apt.status,
      notes: apt.notes || "",
      startTimeStr,
      endTimeStr,
    },
  };
};

// Check if any events fall on weekend days
const hasWeekendEvents = (events: CalendarEvent[]): { hasSaturday: boolean; hasSunday: boolean } => {
  let hasSaturday = false;
  let hasSunday = false;

  for (const event of events) {
    const dayOfWeek = event.start.getDay();
    if (dayOfWeek === 6) hasSaturday = true;
    if (dayOfWeek === 0) hasSunday = true;
    if (hasSaturday && hasSunday) break;
  }

  return { hasSaturday, hasSunday };
};

export function CalendarView() {
  const calendarRef = useRef<FullCalendar>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create");
  const [selectedEvent, setSelectedEvent] = useState<Partial<AppointmentData> | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [hiddenDays, setHiddenDays] = useState<number[]>([0, 6]); // Hide Sun(0) and Sat(6) by default
  const [viewMode, setViewMode] = useState<ViewMode>("comfort");

  // Load view mode from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(VIEW_MODE_KEY);
    if (saved === "compact" || saved === "comfort") {
      setViewMode(saved);
    }
  }, []);

  // Toggle view mode and save to localStorage
  const toggleViewMode = () => {
    const newMode = viewMode === "comfort" ? "compact" : "comfort";
    setViewMode(newMode);
    localStorage.setItem(VIEW_MODE_KEY, newMode);
  };

  // Fetch appointments from API
  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/appointments");
      if (response.ok) {
        const data: APIAppointment[] = await response.json();
        const calendarEvents = data.map(appointmentToEvent);
        setEvents(calendarEvents);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Update hidden days based on whether there are weekend events
  useEffect(() => {
    const { hasSaturday, hasSunday } = hasWeekendEvents(events);
    const newHiddenDays: number[] = [];
    if (!hasSunday) newHiddenDays.push(0);  // Hide Sunday if no events
    if (!hasSaturday) newHiddenDays.push(6); // Hide Saturday if no events
    setHiddenDays(newHiddenDays);
  }, [events]);

  // Handle date/time selection (create new appointment)
  const handleDateSelect = (selectInfo: DateSelectArg) => {
    const startTime = format(selectInfo.start, "HH:mm");
    const endTime = format(selectInfo.end || addHours(selectInfo.start, 1), "HH:mm");

    setSelectedEvent({
      date: selectInfo.start,
      startTime,
      endTime,
    });
    setModalMode("create");
    setModalOpen(true);

    // Clear selection
    const calendarApi = selectInfo.view.calendar;
    calendarApi.unselect();
  };

  // Handle event click (view/edit appointment)
  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event;
    const props = event.extendedProps;

    setSelectedEvent({
      id: event.id,
      patientId: props.patientId as string,
      patientName: props.patientName as string,
      date: event.start || new Date(),
      startTime: format(event.start || new Date(), "HH:mm"),
      endTime: format(event.end || addHours(event.start || new Date(), 1), "HH:mm"),
      type: props.type as AppointmentData["type"],
      location: props.location as string,
      status: props.status as AppointmentData["status"],
      notes: props.notes as string,
    });
    setModalMode("edit");
    setModalOpen(true);
  };

  // Handle event drop (drag & drop)
  const handleEventDrop = async (dropInfo: EventDropArg) => {
    const { event } = dropInfo;

    try {
      const newDate = format(event.start || new Date(), "yyyy-MM-dd");
      const newStartTime = format(event.start || new Date(), "HH:mm");
      const newEndTime = format(event.end || addHours(event.start || new Date(), 1), "HH:mm");

      const response = await fetch(`/api/appointments/${event.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: newDate,
          startTime: newStartTime,
          endTime: newEndTime,
        }),
      });

      if (!response.ok) {
        // Revert on error
        dropInfo.revert();
        console.error("Error updating appointment");
      } else {
        // Refresh to get updated data
        fetchAppointments();
      }
    } catch (error) {
      dropInfo.revert();
      console.error("Error updating appointment:", error);
    }
  };

  // Handle save from modal
  const handleSave = async (data: AppointmentData) => {
    try {
      if (modalMode === "create") {
        const response = await fetch("/api/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientId: data.patientId,
            date: format(data.date, "yyyy-MM-dd"),
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
      } else if (modalMode === "edit" && data.id) {
        const response = await fetch(`/api/appointments/${data.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientId: data.patientId,
            date: format(data.date, "yyyy-MM-dd"),
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

      // Refresh appointments
      fetchAppointments();
    } catch (error) {
      console.error("Error saving appointment:", error);
      alert("Error al guardar cita");
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchAppointments();
      }
    } catch (error) {
      console.error("Error deleting appointment:", error);
    }
  };

  // Add tooltip on event mount
  const handleEventDidMount = (arg: EventMountArg) => {
    const props = arg.event.extendedProps;
    const patientName = formatName(props.patientName as string);
    const timeRange = `${props.startTimeStr} - ${props.endTimeStr}`;
    const typeLabel = typeLabels[props.type as keyof typeof typeLabels] || props.type;

    // Create tooltip text
    const tooltipText = `${patientName}\n${timeRange}\n${typeLabel}`;

    // Set title attribute for native tooltip
    arg.el.setAttribute("title", tooltipText);
  };

  return (
    <>
      <div className={cn(
        "bg-white rounded-xl shadow-sm border border-gray-100 p-4 calendar-container",
        viewMode === "compact" ? "calendar-compact" : "calendar-comfort"
      )}>
        {/* View mode toggle */}
        <div className="flex justify-end mb-2">
          <button
            onClick={toggleViewMode}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
              "border border-[#CCE3DE] hover:bg-[#CCE3DE]/30",
              viewMode === "compact"
                ? "bg-[#6B9080] text-white border-[#6B9080]"
                : "bg-white text-[#3D5A4C]"
            )}
            title={viewMode === "compact" ? "Cambiar a vista Comfort" : "Cambiar a vista Compacta"}
          >
            {viewMode === "compact" ? (
              <>
                <Rows3 className="w-4 h-4" />
                <span>Compacta</span>
              </>
            ) : (
              <>
                <Rows4 className="w-4 h-4" />
                <span>Comfort</span>
              </>
            )}
          </button>
        </div>

        {isLoading ? (
          <div className="h-[calc(100vh-140px)] flex items-center justify-center">
            <div className="text-gray-500">Cargando citas...</div>
          </div>
        ) : (
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            locale="es"
            buttonText={{
              today: "Hoy",
              month: "Mes",
              week: "Semana",
              day: "Día",
            }}
            slotMinTime="06:00:00"
            slotMaxTime="21:00:00"
            slotDuration="01:00:00"
            allDaySlot={false}
            weekends={true}
            hiddenDays={hiddenDays}
            selectable={true}
            selectMirror={true}
            editable={true}
            eventDurationEditable={false}
            events={events}
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventDrop={handleEventDrop}
            eventDidMount={handleEventDidMount}
            height="calc(100vh - 140px)"
            nowIndicator={true}
            eventDisplay="block"
            expandRows={true}
            stickyHeaderDates={true}
            stickyFooterScrollbar={true}
            displayEventTime={false}
            slotLabelFormat={{
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }}
            dayHeaderFormat={{
              weekday: "short",
              day: "numeric",
            }}
          />
        )}
      </div>

      <AppointmentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        onDelete={handleDelete}
        initialData={selectedEvent}
        mode={modalMode}
      />
    </>
  );
}
