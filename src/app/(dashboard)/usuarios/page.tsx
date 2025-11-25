"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus, ShieldAlert, Users } from "lucide-react";
import { UsersTable } from "@/components/usuarios/UsersTable";
import { UserModal } from "@/components/usuarios/UserModal";
import { ChangePasswordModal } from "@/components/usuarios/ChangePasswordModal";
import type { User, UserFormData, ChangePasswordFormData } from "@/types/users";

export default function UsuariosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Check if user is admin
  const isAdmin = session?.user?.role === "admin";

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else if (response.status === 403) {
        // Not admin, redirect
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
      return;
    }

    if (session.user?.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    fetchUsers();
  }, [session, status, router, fetchUsers]);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleCreateUser = async (data: UserFormData) => {
    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        role: data.role,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error al crear usuario");
    }

    showMessage("success", "Usuario creado exitosamente");
    fetchUsers();
  };

  const handleEditUser = async (data: UserFormData) => {
    if (!selectedUser) return;

    const response = await fetch(`/api/users/${selectedUser.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: data.fullName,
        email: data.email,
        role: data.role,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error al actualizar usuario");
    }

    showMessage("success", "Usuario actualizado exitosamente");
    fetchUsers();
  };

  const handleChangePassword = async (data: ChangePasswordFormData) => {
    if (!selectedUser) return;

    const response = await fetch(`/api/users/${selectedUser.id}/password`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword: data.newPassword }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error al cambiar contraseña");
    }

    showMessage("success", "Contraseña cambiada exitosamente");
  };

  const handleToggleActive = async (user: User) => {
    const action = user.isActive ? "desactivar" : "activar";
    if (!confirm(`¿Deseas ${action} al usuario "${user.fullName}"?`)) return;

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });

      if (!response.ok) {
        const error = await response.json();
        showMessage("error", error.error || `Error al ${action} usuario`);
        return;
      }

      showMessage("success", `Usuario ${user.isActive ? "desactivado" : "activado"} exitosamente`);
      fetchUsers();
    } catch (error) {
      console.error("Error toggling user:", error);
      showMessage("error", `Error al ${action} usuario`);
    }
  };

  const openCreateModal = () => {
    setSelectedUser(null);
    setIsUserModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setIsUserModalOpen(true);
  };

  const openPasswordModal = (user: User) => {
    setSelectedUser(user);
    setIsPasswordModalOpen(true);
  };

  // Show loading while checking session
  if (status === "loading" || isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 bg-[#CCE3DE]/30 rounded animate-pulse" />
        <div className="h-64 bg-[#CCE3DE]/30 rounded-lg animate-pulse" />
      </div>
    );
  }

  // Show access denied if not admin
  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="bg-[#FFEBEE] rounded-lg border border-red-200 p-8 text-center">
          <ShieldAlert className="w-12 h-12 text-[#C62828] mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-[#C62828] mb-2">
            Acceso Denegado
          </h2>
          <p className="text-red-600">
            Solo los administradores pueden acceder a esta sección.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#6B9080] flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#2D3D35]">Usuarios</h1>
            <p className="text-[#5C7A6B]">Administra los usuarios del sistema</p>
          </div>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#6B9080] text-white rounded-md hover:bg-[#5A7A6B] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Usuario
        </button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#F6FFF8] rounded-lg border border-[#CCE3DE] p-4">
          <p className="text-2xl font-bold text-[#2D3D35]">{users.length}</p>
          <p className="text-sm text-[#5C7A6B]">Total usuarios</p>
        </div>
        <div className="bg-[#F6FFF8] rounded-lg border border-[#CCE3DE] p-4">
          <p className="text-2xl font-bold text-[#2E7D32]">
            {users.filter((u) => u.isActive).length}
          </p>
          <p className="text-sm text-[#5C7A6B]">Activos</p>
        </div>
        <div className="bg-[#F6FFF8] rounded-lg border border-[#CCE3DE] p-4">
          <p className="text-2xl font-bold text-[#C65D3B]">
            {users.filter((u) => !u.isActive).length}
          </p>
          <p className="text-sm text-[#5C7A6B]">Inactivos</p>
        </div>
      </div>

      {/* Users Table */}
      <UsersTable
        users={users}
        currentUserId={session?.user?.id}
        onEdit={openEditModal}
        onChangePassword={openPasswordModal}
        onToggleActive={handleToggleActive}
      />

      {/* User Modal */}
      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          setSelectedUser(null);
        }}
        onSubmit={selectedUser ? handleEditUser : handleCreateUser}
        user={selectedUser}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => {
          setIsPasswordModalOpen(false);
          setSelectedUser(null);
        }}
        onSubmit={handleChangePassword}
        user={selectedUser}
      />
    </div>
  );
}
