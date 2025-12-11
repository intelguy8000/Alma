"use client";

import { Calendar, Filter } from "lucide-react";

interface FiltersState {
  dateFrom: string;
  dateTo: string;
  status: string;
  type: string;
}

interface AppointmentFiltersProps {
  filters: FiltersState;
  onFiltersChange: (filters: FiltersState) => void;
}

const statusOptions = [
  { value: "todos", label: "Todos los estados" },
  { value: "confirmada", label: "Confirmada" },
  { value: "no_responde", label: "No responde" },
  { value: "cancelada", label: "Cancelada" },
  { value: "reagendada", label: "Reagendada" },
  { value: "completada", label: "Completada" },
];

const typeOptions = [
  { value: "todos", label: "Todos los tipos" },
  { value: "presencial", label: "Presencial" },
  { value: "virtual", label: "Virtual" },
  { value: "terapia_choque", label: "Terapia de Choque" },
  { value: "terapia_capilar", label: "Terapia Capilar" },
];

export function AppointmentFilters({
  filters,
  onFiltersChange,
}: AppointmentFiltersProps) {
  const handleChange = (key: keyof FiltersState, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-gray-500" />
        <span className="font-medium text-gray-700">Filtros</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Date From */}
        <div>
          <label className="block text-sm text-gray-500 mb-1">Desde</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleChange("dateFrom", e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Date To */}
        <div>
          <label className="block text-sm text-gray-500 mb-1">Hasta</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleChange("dateTo", e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm text-gray-500 mb-1">Estado</label>
          <select
            value={filters.status}
            onChange={(e) => handleChange("status", e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm text-gray-500 mb-1">Tipo</label>
          <select
            value={filters.type}
            onChange={(e) => handleChange("type", e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
          >
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
