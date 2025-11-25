export interface Patient {
  id: string;
  fullName: string;
  patientCode: string;
}

export interface Sale {
  id: string;
  date: string;
  amount: number;
  paymentMethod: string;
  paymentNote: string | null;
  hasElectronicInvoice: boolean;
  createdAt: string;
  appointmentId?: string | null;
  bankAccountId?: string | null;
  appointment: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    type: string;
    patient: Patient;
  } | null;
  bankAccount: {
    id: string;
    alias: string;
    bankName: string | null;
    accountNumber: string | null;
  } | null;
  createdBy: {
    id: string;
    fullName: string;
  };
}

export interface SaleFormData {
  id?: string;
  appointmentId: string | null;
  amount: number;
  paymentMethod: string;
  paymentNote: string | null;
  hasElectronicInvoice: boolean;
  bankAccountId: string | null;
  date: string;
}

export interface BankAccount {
  id: string;
  alias: string;
  bankName: string | null;
}

export interface AvailableAppointment {
  id: string;
  date: string;
  startTime: string;
  patient: Patient;
}
