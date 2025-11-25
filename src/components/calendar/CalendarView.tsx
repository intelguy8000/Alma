"use client";

import { useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventClickArg, DateSelectArg, EventDropArg } from "@fullcalendar/core";
import { format, addHours } from "date-fns";
import { AppointmentModal, AppointmentData } from "./AppointmentModal";

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
  };
  classNames?: string[];
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

// Mock appointments data
const mockAppointments: CalendarEvent[] = [
  {
    id: "1",
    title: "María García López",
    start: new Date(new Date().setHours(9, 0, 0, 0)),
    end: new Date(new Date().setHours(10, 0, 0, 0)),
    backgroundColor: typeColors.presencial.bg,
    borderColor: typeColors.presencial.border,
    textColor: typeColors.presencial.text,
    extendedProps: {
      patientId: "1",
      patientName: "María García López",
      type: "presencial",
      location: "forum_1103",
      status: "confirmada",
      notes: "Primera consulta",
    },
  },
  {
    id: "2",
    title: "Carlos Rodríguez",
    start: new Date(new Date().setHours(11, 0, 0, 0)),
    end: new Date(new Date().setHours(12, 0, 0, 0)),
    backgroundColor: typeColors.virtual.bg,
    borderColor: typeColors.virtual.border,
    textColor: typeColors.virtual.text,
    extendedProps: {
      patientId: "2",
      patientName: "Carlos Rodríguez",
      type: "virtual",
      location: "virtual",
      status: "confirmada",
      notes: "",
    },
  },
  {
    id: "3",
    title: "Ana Martínez",
    start: new Date(new Date().setHours(14, 0, 0, 0)),
    end: new Date(new Date().setHours(15, 0, 0, 0)),
    backgroundColor: typeColors.terapia_choque.bg,
    borderColor: typeColors.terapia_choque.border,
    textColor: typeColors.terapia_choque.text,
    classNames: getStatusClasses("no_responde"),
    extendedProps: {
      patientId: "3",
      patientName: "Ana Martínez",
      type: "terapia_choque",
      location: "la_ceja",
      status: "no_responde",
      notes: "Llamar para confirmar",
    },
  },
  {
    id: "4",
    title: "José Hernández",
    start: new Date(new Date().setHours(16, 0, 0, 0)),
    end: new Date(new Date().setHours(17, 0, 0, 0)),
    backgroundColor: typeColors.presencial.bg,
    borderColor: typeColors.presencial.border,
    textColor: typeColors.presencial.text,
    classNames: getStatusClasses("cancelada"),
    extendedProps: {
      patientId: "4",
      patientName: "José Hernández",
      type: "presencial",
      location: "forum_1103",
      status: "cancelada",
      notes: "Canceló por viaje",
    },
  },
  // Tomorrow appointments
  {
    id: "5",
    title: "Laura Sánchez",
    start: addHours(new Date(new Date().setHours(10, 0, 0, 0)), 24),
    end: addHours(new Date(new Date().setHours(11, 0, 0, 0)), 24),
    backgroundColor: typeColors.presencial.bg,
    borderColor: typeColors.presencial.border,
    textColor: typeColors.presencial.text,
    extendedProps: {
      patientId: "5",
      patientName: "Laura Sánchez",
      type: "presencial",
      location: "forum_1103",
      status: "confirmada",
      notes: "",
    },
  },
  {
    id: "6",
    title: "Pedro González",
    start: addHours(new Date(new Date().setHours(15, 0, 0, 0)), 24),
    end: addHours(new Date(new Date().setHours(16, 0, 0, 0)), 24),
    backgroundColor: typeColors.virtual.bg,
    borderColor: typeColors.virtual.border,
    textColor: typeColors.virtual.text,
    classNames: getStatusClasses("completada"),
    extendedProps: {
      patientId: "6",
      patientName: "Pedro González",
      type: "virtual",
      location: "virtual",
      status: "completada",
      notes: "Sesión de seguimiento",
    },
  },
];

export function CalendarView() {
  const calendarRef = useRef<FullCalendar>(null);
  const [events, setEvents] = useState<CalendarEvent[]>(mockAppointments);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create");
  const [selectedEvent, setSelectedEvent] = useState<Partial<AppointmentData> | undefined>();

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
      patientId: props.patientId,
      patientName: props.patientName,
      date: event.start || new Date(),
      startTime: format(event.start || new Date(), "HH:mm"),
      endTime: format(event.end || addHours(event.start || new Date(), 1), "HH:mm"),
      type: props.type,
      location: props.location,
      status: props.status,
      notes: props.notes,
    });
    setModalMode("edit");
    setModalOpen(true);
  };

  // Handle event drop (drag & drop)
  const handleEventDrop = (dropInfo: EventDropArg) => {
    const { event } = dropInfo;

    setEvents((prev) =>
      prev.map((e) =>
        e.id === event.id
          ? {
              ...e,
              start: event.start || e.start,
              end: event.end || e.end,
            }
          : e
      )
    );

    // In real app, would save to database here
    console.log("Event moved:", event.id, event.start, event.end);
  };

  // Handle save from modal
  const handleSave = (data: AppointmentData) => {
    const colors = typeColors[data.type];
    const [startHour, startMin] = data.startTime.split(":").map(Number);
    const [endHour, endMin] = data.endTime.split(":").map(Number);

    const startDate = new Date(data.date);
    startDate.setHours(startHour, startMin, 0, 0);

    const endDate = new Date(data.date);
    endDate.setHours(endHour, endMin, 0, 0);

    if (modalMode === "create") {
      const newEvent: CalendarEvent = {
        id: Date.now().toString(),
        title: data.patientName,
        start: startDate,
        end: endDate,
        backgroundColor: colors.bg,
        borderColor: colors.border,
        textColor: colors.text,
        classNames: getStatusClasses(data.status),
        extendedProps: {
          patientId: data.patientId,
          patientName: data.patientName,
          type: data.type,
          location: data.location,
          status: data.status,
          notes: data.notes,
        },
      };
      setEvents((prev) => [...prev, newEvent]);
    } else if (modalMode === "edit" && data.id) {
      setEvents((prev) =>
        prev.map((e) =>
          e.id === data.id
            ? {
                ...e,
                title: data.patientName,
                start: startDate,
                end: endDate,
                backgroundColor: colors.bg,
                borderColor: colors.border,
                textColor: colors.text,
                classNames: getStatusClasses(data.status),
                extendedProps: {
                  patientId: data.patientId,
                  patientName: data.patientName,
                  type: data.type,
                  location: data.location,
                  status: data.status,
                  notes: data.notes,
                },
              }
            : e
        )
      );
    }
  };

  // Handle delete
  const handleDelete = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 calendar-container">
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
          slotMinTime="07:00:00"
          slotMaxTime="20:00:00"
          slotDuration="00:30:00"
          allDaySlot={false}
          weekends={true}
          selectable={true}
          selectMirror={true}
          editable={true}
          eventDurationEditable={false}
          events={events}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          height="calc(100vh - 200px)"
          nowIndicator={true}
          eventDisplay="block"
          expandRows={true}
          stickyHeaderDates={true}
          eventTimeFormat={{
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }}
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
