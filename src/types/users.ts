import { UserRole } from "@prisma/client";

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date | null;
}

export interface UserFormData {
  fullName: string;
  email: string;
  password?: string;
  confirmPassword?: string;
  role: UserRole;
}

export interface ChangePasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

export const roleLabels: Record<UserRole, string> = {
  admin: "Administrador",
  secretary: "Secretaria",
  viewer: "Visualizador",
};

export const roleColors: Record<UserRole, { bg: string; text: string }> = {
  admin: { bg: "bg-green-100", text: "text-green-700" },
  secretary: { bg: "bg-blue-100", text: "text-blue-700" },
  viewer: { bg: "bg-gray-100", text: "text-gray-600" },
};
