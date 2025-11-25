"use client";

import { Edit2, Key, ToggleLeft, ToggleRight, UserCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { User } from "@/types/users";
import { roleLabels, roleColors } from "@/types/users";
import { cn } from "@/lib/utils";

interface UsersTableProps {
  users: User[];
  currentUserId?: string;
  onEdit: (user: User) => void;
  onChangePassword: (user: User) => void;
  onToggleActive: (user: User) => void;
}

export function UsersTable({
  users,
  currentUserId,
  onEdit,
  onChangePassword,
  onToggleActive,
}: UsersTableProps) {
  if (users.length === 0) {
    return (
      <div className="bg-[#F6FFF8] rounded-lg border border-[#CCE3DE] p-8 text-center">
        <UserCircle className="w-12 h-12 text-[#CCE3DE] mx-auto mb-3" />
        <p className="text-[#5C7A6B]">No hay usuarios registrados</p>
      </div>
    );
  }

  return (
    <div className="bg-[#F6FFF8] rounded-lg border border-[#CCE3DE] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#CCE3DE]/30 border-b border-[#CCE3DE]">
              <th className="text-left px-4 py-3 text-sm font-semibold text-[#3D5A4C]">
                Nombre
              </th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-[#3D5A4C]">
                Email
              </th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-[#3D5A4C]">
                Rol
              </th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-[#3D5A4C]">
                Estado
              </th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-[#3D5A4C]">
                Último acceso
              </th>
              <th className="text-right px-4 py-3 text-sm font-semibold text-[#3D5A4C]">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#CCE3DE]">
            {users.map((user) => {
              const isCurrentUser = user.id === currentUserId;
              const roleColor = roleColors[user.role];

              return (
                <tr
                  key={user.id}
                  className={cn(
                    "hover:bg-[#CCE3DE]/20 transition-colors",
                    !user.isActive && "opacity-60 bg-gray-50"
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#6B9080] flex items-center justify-center text-white font-medium text-sm">
                        {user.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-[#2D3D35]">
                          {user.fullName}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs text-[#6B9080]">(Tú)</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-[#5C7A6B]">{user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex px-2 py-1 text-xs font-medium rounded-full",
                        roleColor.bg,
                        roleColor.text
                      )}
                    >
                      {roleLabels[user.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {user.isActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                        Inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-[#5C7A6B]">
                      {user.lastLogin
                        ? format(new Date(user.lastLogin), "dd MMM yyyy, HH:mm", {
                            locale: es,
                          })
                        : "Nunca"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEdit(user)}
                        className="p-2 text-[#5C7A6B] hover:bg-[#CCE3DE]/50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onChangePassword(user)}
                        className="p-2 text-[#5C7A6B] hover:bg-[#CCE3DE]/50 rounded-lg transition-colors"
                        title="Cambiar contraseña"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      {!isCurrentUser && (
                        <button
                          onClick={() => onToggleActive(user)}
                          className={cn(
                            "p-2 rounded-lg transition-colors",
                            user.isActive
                              ? "text-[#C65D3B] hover:bg-red-50"
                              : "text-[#2E7D32] hover:bg-green-50"
                          )}
                          title={user.isActive ? "Desactivar" : "Activar"}
                        >
                          {user.isActive ? (
                            <ToggleRight className="w-4 h-4" />
                          ) : (
                            <ToggleLeft className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
