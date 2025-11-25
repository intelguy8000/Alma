"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, DollarSign, Hash, TrendingUp, Search, Calendar, FileCheck } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { SalesTable } from "@/components/ventas/SalesTable";
import { SaleModal } from "@/components/ventas/SaleModal";
import { SaleDetailModal } from "@/components/ventas/SaleDetailModal";
import { formatCOP } from "@/lib/utils";
import type { Sale, Patient, SaleFormData } from "@/types/sales";

const DEFAULT_AMOUNT = 332000;

export default function VentasPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [startDate, setStartDate] = useState(
    format(startOfMonth(new Date()), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState(
    format(endOfMonth(new Date()), "yyyy-MM-dd")
  );
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const fetchSales = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (paymentMethod !== "all") params.set("paymentMethod", paymentMethod);
      if (selectedPatientId) params.set("patientId", selectedPatientId);

      const response = await fetch(`/api/sales?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setSales(data);
      }
    } catch (error) {
      console.error("Error fetching sales:", error);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, paymentMethod, selectedPatientId]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  // Patient search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (patientSearch.length >= 2 && !selectedPatientId) {
        searchPatients(patientSearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [patientSearch, selectedPatientId]);

  const searchPatients = async (query: string) => {
    try {
      const response = await fetch(`/api/patients?search=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setPatients(data);
        setShowPatientDropdown(true);
      }
    } catch (error) {
      console.error("Error searching patients:", error);
    }
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatientId(patient.id);
    setPatientSearch(patient.fullName);
    setShowPatientDropdown(false);
  };

  const handleClearPatient = () => {
    setSelectedPatientId(null);
    setPatientSearch("");
    setPatients([]);
  };

  const handleCreateSale = async (saleData: SaleFormData) => {
    const response = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(saleData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error al crear venta");
    }

    fetchSales();
  };

  const handleEditSale = async (saleData: SaleFormData) => {
    const response = await fetch(`/api/sales/${saleData.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(saleData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error al actualizar venta");
    }

    fetchSales();
  };

  const handleDeleteSale = async (saleId: string) => {
    try {
      const response = await fetch(`/api/sales/${saleId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchSales();
      }
    } catch (error) {
      console.error("Error deleting sale:", error);
    }
  };

  const handleViewSale = (sale: Sale) => {
    setSelectedSale(sale);
    setIsDetailModalOpen(true);
  };

  const handleEditClick = (sale: Sale) => {
    setSelectedSale(sale);
    setIsEditModalOpen(true);
  };

  // Stats
  const totalSales = sales.reduce((sum, sale) => sum + Number(sale.amount), 0);
  const salesCount = sales.length;
  const averageTicket = salesCount > 0 ? totalSales / salesCount : 0;
  const electronicInvoicesCount = sales.filter(sale => sale.hasElectronicInvoice).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2D3D35]">Ventas</h1>
          <p className="text-[#5C7A6B]">Gestiona las ventas del consultorio</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#6B9080] text-white rounded-md hover:bg-[#5A7A6B] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nueva Venta
        </button>
      </div>

      {/* Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#CCE3DE] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#6B9080] flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#3D5A4C]">{formatCOP(totalSales)}</p>
          <p className="text-sm text-[#5C7A6B]">Ventas del período</p>
        </div>

        <div className="bg-[#D8E2DC] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#84A98C] flex items-center justify-center">
              <Hash className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#3D5A4C]">{salesCount}</p>
          <p className="text-sm text-[#5C7A6B]">Cantidad de ventas</p>
        </div>

        <div className="bg-[#E8F5E9] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#81C784] flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#2E7D32]">{formatCOP(averageTicket)}</p>
          <p className="text-sm text-[#5C7A6B]">Ticket promedio</p>
        </div>

        <div className="bg-[#F5E6D3] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#D4A574] flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#8B6914]">{electronicInvoicesCount}</p>
          <p className="text-sm text-[#5C7A6B]">Facturas electrónicas</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#F6FFF8] rounded-lg border border-[#CCE3DE] p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-[#3D5A4C] mb-1">
              Desde
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5C7A6B]" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-[#CCE3DE] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#6B9080] text-[#2D3D35]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3D5A4C] mb-1">
              Hasta
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5C7A6B]" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-[#CCE3DE] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#6B9080] text-[#2D3D35]"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-[#3D5A4C] mb-1">
              Método de pago
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-[#CCE3DE] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#6B9080] text-[#2D3D35]"
            >
              <option value="all">Todos</option>
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          {/* Patient Search */}
          <div className="relative">
            <label className="block text-sm font-medium text-[#3D5A4C] mb-1">
              Paciente
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5C7A6B]" />
              <input
                type="text"
                value={patientSearch}
                onChange={(e) => {
                  setPatientSearch(e.target.value);
                  if (selectedPatientId) {
                    handleClearPatient();
                  }
                }}
                onFocus={() => patientSearch.length >= 2 && setShowPatientDropdown(true)}
                className="w-full pl-10 pr-3 py-2 border border-[#CCE3DE] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#6B9080] text-[#2D3D35]"
                placeholder="Buscar paciente..."
              />
            </div>
            {showPatientDropdown && patients.length > 0 && !selectedPatientId && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-[#CCE3DE] rounded-md shadow-lg max-h-48 overflow-y-auto">
                {patients.map((patient) => (
                  <button
                    key={patient.id}
                    type="button"
                    onClick={() => handlePatientSelect(patient)}
                    className="w-full px-3 py-2 text-left hover:bg-[#CCE3DE]/50 flex items-center justify-between"
                  >
                    <span className="text-[#2D3D35]">{patient.fullName}</span>
                    <span className="text-xs text-[#5C7A6B]">{patient.patientCode}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {selectedPatientId && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-[#5C7A6B]">Filtrado por:</span>
            <span className="px-2 py-1 bg-[#CCE3DE] text-[#3D5A4C] text-sm rounded-full flex items-center gap-1">
              {patientSearch}
              <button
                onClick={handleClearPatient}
                className="ml-1 hover:text-[#E07A5F]"
              >
                ×
              </button>
            </span>
          </div>
        )}
      </div>

      {/* Table */}
      <SalesTable
        sales={sales}
        onView={handleViewSale}
        onEdit={handleEditClick}
        onDelete={handleDeleteSale}
        isLoading={isLoading}
      />

      {/* Create Modal */}
      <SaleModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateSale}
        defaultAmount={DEFAULT_AMOUNT}
      />

      {/* Edit Modal */}
      <SaleModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedSale(null);
        }}
        onSave={handleEditSale}
        sale={selectedSale}
        defaultAmount={DEFAULT_AMOUNT}
      />

      {/* Detail Modal */}
      <SaleDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedSale(null);
        }}
        sale={selectedSale}
      />
    </div>
  );
}
