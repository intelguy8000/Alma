"use client";

import { CalendarView } from "@/components/calendar";

export default function CalendarioPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendario</h1>
          <p className="text-gray-500 mt-1">
            Gestiona tus citas y agenda
          </p>
        </div>
      </div>

      {/* Calendar */}
      <CalendarView />
    </div>
  );
}
