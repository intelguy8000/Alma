"use client";

import { useState, useEffect } from "react";
import { X, Search } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { formatCOP } from "@/lib/utils";
import { parseDateToInput, getTodayLocal, parseLocalDate, parseTimeToDisplay } from "@/lib/dates";
import type { Sale, Patient, BankAccount, AvailableAppointment, SaleFormData } from "@/types/sales";

interface SaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (sale: SaleFormData) => Promise<void>;
  sale?: Sale | null;
  defaultAmount?: number;
}

const DEFAULT_AMOUNT = 332000;

export function SaleModal({
  isOpen,
  onClose,
  onSave,
  sale,
  defaultAmount = DEFAULT_AMOUNT,
}: SaleModalProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [availableAppointments, setAvailableAppointments] = useState<AvailableAppointment[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  const [formData, setFormData] = useState({
    appointmentId: "",
    amount: defaultAmount,
    paymentMethod: "efectivo",
    paymentNote: "",
    bankAccountId: "",
    hasElectronicInvoice: false,
    date: getTodayLocal(),
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchBankAccounts();
      if (sale) {
        setFormData({
          appointmentId: sale.appointmentId || "",
          amount: Number(sale.amount),
          paymentMethod: sale.paymentMethod,
          paymentNote: sale.paymentNote || "",
          bankAccountId: sale.bankAccountId || "",
          hasElectronicInvoice: sale.hasElectronicInvoice || false,
          date: sale.date ? parseDateToInput(sale.date) : getTodayLocal(),
        });
        if (sale.patient) {
          setSelectedPatientId(sale.patient.id);
          setPatientSearch(sale.patient.fullName);
        }
      } else {
        setFormData({
          appointmentId: "",
          amount: defaultAmount,
          paymentMethod: "efectivo",
          paymentNote: "",
          bankAccountId: "",
          hasElectronicInvoice: false,
          date: getTodayLocal(),
        });
        setSelectedPatientId(null);
        setPatientSearch("");
      }
      setError("");
    }
  }, [isOpen, sale, defaultAmount]);

  useEffect(() => {
    if (selectedPatientId) {
      fetchAvailableAppointments(selectedPatientId);
    } else {
      setAvailableAppointments([]);
      setFormData((prev) => ({ ...prev, appointmentId: "" }));
    }
  }, [selectedPatientId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (patientSearch.length >= 2 && !selectedPatientId) {
        searchPatients(patientSearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [patientSearch, selectedPatientId]);

  const searchPatients = async (query: string) => {
    setIsLoadingPatients(true);
    try {
      const response = await fetch(`/api/patients?search=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setPatients(data);
        setShowPatientDropdown(true);
      }
    } catch (error) {
      console.error("Error searching patients:", error);
    } finally {
      setIsLoadingPatients(false);
    }
  };

  const fetchAvailableAppointments = async (patientId: string) => {
    try {
      const response = await fetch(`/api/appointments/available?patientId=${patientId}`);
      if (response.ok) {
        const data = await response.json();
        setAvailableAppointments(data);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

  const fetchBankAccounts = async () => {
    try {
      const response = await fetch("/api/bank-accounts");
      if (response.ok) {
        const data = await response.json();
        setBankAccounts(data);
      }
    } catch (error) {
      console.error("Error fetching bank accounts:", error);
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
    setAvailableAppointments([]);
    setFormData((prev) => ({ ...prev, appointmentId: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedPatientId) {
      setError("Selecciona un paciente");
      return;
    }

    if (!formData.amount || formData.amount <= 0) {
      setError("El monto debe ser mayor a 0");
      return;
    }

    if (formData.paymentMethod === "transferencia" && !formData.bankAccountId) {
      setError("Selecciona una cuenta bancaria para transferencias");
      return;
    }

    if (formData.paymentMethod === "otro" && !formData.paymentNote) {
      setError("Especifica el método de pago en las notas");
      return;
    }

    setIsLoading(true);
    try {
      const saleFormData: SaleFormData = {
        id: sale?.id,
        patientId: selectedPatientId,
        appointmentId: formData.appointmentId || null,
        amount: formData.amount,
        paymentMethod: formData.paymentMethod,
        paymentNote: formData.paymentNote || null,
        hasElectronicInvoice: formData.hasElectronicInvoice,
        bankAccountId: formData.paymentMethod === "transferencia" ? (formData.bankAccountId || null) : null,
        date: formData.date,
      };
      await onSave(saleFormData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-[#F6FFF8] rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-[#CCE3DE]">
          <h2 className="text-lg font-semibold text-[#2D3D35]">
            {sale ? "Editar Venta" : "Nueva Venta"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#CCE3DE] rounded-md transition-colors"
          >
            <X className="h-5 w-5 text-[#5C7A6B]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-[#FFE4D6] text-[#C65D3B] text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Patient Search */}
          <div className="relative">
            <label className="block text-sm font-medium text-[#3D5A4C] mb-1">
              Paciente <span className="text-[#E07A5F]">*</span>
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
                className="w-full pl-10 pr-4 py-2 border border-[#CCE3DE] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#6B9080] text-[#2D3D35]"
                placeholder="Buscar paciente..."
              />
              {selectedPatientId && (
                <button
                  type="button"
                  onClick={handleClearPatient}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-[#CCE3DE] rounded"
                >
                  <X className="h-4 w-4 text-[#5C7A6B]" />
                </button>
              )}
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
            {isLoadingPatients && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-[#CCE3DE] rounded-md p-2 text-center text-[#5C7A6B] text-sm">
                Buscando...
              </div>
            )}
          </div>

          {/* Appointment Select */}
          {selectedPatientId && (
            <div>
              <label className="block text-sm font-medium text-[#3D5A4C] mb-1">
                Cita asociada
              </label>
              <select
                value={formData.appointmentId}
                onChange={(e) => setFormData({ ...formData, appointmentId: e.target.value })}
                className="w-full px-3 py-2 border border-[#CCE3DE] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#6B9080] text-[#2D3D35]"
              >
                <option value="">Sin cita asociada</option>
                {availableAppointments.map((apt) => (
                  <option key={apt.id} value={apt.id}>
                    {format(parseLocalDate(apt.date), "d MMM yyyy", { locale: es })} - {parseTimeToDisplay(apt.startTime)}
                  </option>
                ))}
              </select>
              {availableAppointments.length === 0 && (
                <p className="text-xs text-[#5C7A6B] mt-1">
                  No hay citas completadas sin venta registrada
                </p>
              )}
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-[#3D5A4C] mb-1">
              Fecha
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-[#CCE3DE] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#6B9080] text-[#2D3D35]"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-[#3D5A4C] mb-1">
              Monto <span className="text-[#E07A5F]">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5C7A6B]">$</span>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                className="w-full pl-8 pr-4 py-2 border border-[#CCE3DE] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#6B9080] text-[#2D3D35]"
                placeholder="332000"
                min="0"
                step="1000"
                required
              />
            </div>
            <p className="text-xs text-[#5C7A6B] mt-1">
              Valor por defecto: {formatCOP(defaultAmount)}
            </p>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-[#3D5A4C] mb-1">
              Método de pago <span className="text-[#E07A5F]">*</span>
            </label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              className="w-full px-3 py-2 border border-[#CCE3DE] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#6B9080] text-[#2D3D35]"
              required
            >
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          {/* Bank Account (if transferencia) */}
          {formData.paymentMethod === "transferencia" && (
            <div>
              <label className="block text-sm font-medium text-[#3D5A4C] mb-1">
                Cuenta bancaria <span className="text-[#E07A5F]">*</span>
              </label>
              <select
                value={formData.bankAccountId}
                onChange={(e) => setFormData({ ...formData, bankAccountId: e.target.value })}
                className="w-full px-3 py-2 border border-[#CCE3DE] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#6B9080] text-[#2D3D35]"
                required
              >
                <option value="">Seleccionar cuenta...</option>
                {bankAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.alias} {account.bankName && `(${account.bankName})`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Payment Note */}
          <div>
            <label className="block text-sm font-medium text-[#3D5A4C] mb-1">
              Nota {formData.paymentMethod === "otro" && <span className="text-[#E07A5F]">*</span>}
            </label>
            <textarea
              value={formData.paymentNote}
              onChange={(e) => setFormData({ ...formData, paymentNote: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-[#CCE3DE] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#6B9080] text-[#2D3D35] resize-none"
              placeholder={formData.paymentMethod === "otro" ? "Especifica el método de pago..." : "Nota opcional..."}
              required={formData.paymentMethod === "otro"}
            />
          </div>

          {/* Electronic Invoice */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="hasElectronicInvoice"
              checked={formData.hasElectronicInvoice}
              onChange={(e) => setFormData({ ...formData, hasElectronicInvoice: e.target.checked })}
              className="w-4 h-4 text-[#6B9080] border-[#CCE3DE] rounded focus:ring-[#6B9080]"
            />
            <label htmlFor="hasElectronicInvoice" className="text-sm font-medium text-[#3D5A4C]">
              Factura electrónica
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-[#CCE3DE] rounded-md hover:bg-[#CCE3DE]/50 transition-colors text-[#3D5A4C]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-[#6B9080] text-white rounded-md hover:bg-[#5A7A6B] transition-colors disabled:opacity-50"
            >
              {isLoading ? "Guardando..." : sale ? "Guardar" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
