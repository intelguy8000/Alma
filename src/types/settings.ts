// Settings types

export interface OrganizationSettings {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string | null;
}

export interface GeneralSettingsFormData {
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
  defaultAppointmentValue: string;
  sessionTimeout: string;
}

// Bank Accounts
export interface BankAccount {
  id: string;
  alias: string;
  accountNumber: string | null;
  bankName: string | null;
  isActive: boolean;
  createdAt: Date;
  _count?: {
    sales: number;
  };
}

export interface BankAccountFormData {
  alias: string;
  accountNumber: string;
  bankName: string;
}

// Locations
export interface Location {
  id: string;
  name: string;
  address: string | null;
  isActive: boolean;
  createdAt: Date;
}

export interface LocationFormData {
  name: string;
  address: string;
}

// Settings keys
export const SETTINGS_KEYS = {
  DEFAULT_APPOINTMENT_VALUE: 'default_appointment_value',
  SESSION_TIMEOUT: 'session_timeout',
  REAL_MODE: 'real_mode',
} as const;

export type SettingKey = typeof SETTINGS_KEYS[keyof typeof SETTINGS_KEYS];
