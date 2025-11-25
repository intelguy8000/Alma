"use client";

import { useState, useRef, useEffect } from "react";
import { Pencil, MoreHorizontal, Phone, Mail, History, Power } from "lucide-react";
import { formatCOP } from "@/lib/utils";
import type { Provider } from "@/types/providers";

interface ProvidersTableProps {
  providers: Provider[];
  onEdit: (provider: Provider) => void;
  onViewHistory: (provider: Provider) => void;
  onToggleActive: (providerId: string, isActive: boolean) => void;
  isLoading?: boolean;
}

function ActionMenu({
  provider,
  onEdit,
  onViewHistory,
  onToggleActive,
}: {
  provider: Provider;
  onEdit: (provider: Provider) => void;
  onViewHistory: (provider: Provider) => void;
  onToggleActive: (providerId: string, isActive: boolean) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 hover:bg-[#CCE3DE] rounded-md transition-colors"
      >
        <MoreHorizontal className="h-5 w-5 text-[#5C7A6B]" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-52 bg-[#F6FFF8] border border-[#CCE3DE] rounded-md shadow-lg z-10">
          <button
            onClick={() => {
              onViewHistory(provider);
              setIsOpen(false);
            }}
            className="w-full px-3 py-2 text-left text-sm hover:bg-[#CCE3DE]/50 flex items-center gap-2 text-[#3D5A4C]"
          >
            <History className="h-4 w-4" />
            Ver historial de compras
          </button>
          <button
            onClick={() => {
              onEdit(provider);
              setIsOpen(false);
            }}
            className="w-full px-3 py-2 text-left text-sm hover:bg-[#CCE3DE]/50 flex items-center gap-2 text-[#3D5A4C]"
          >
            <Pencil className="h-4 w-4" />
            Editar
          </button>
          {provider.phone && (
            <a
              href={`tel:${provider.phone}`}
              className="w-full px-3 py-2 text-left text-sm hover:bg-[#CCE3DE]/50 flex items-center gap-2 text-[#3D5A4C]"
              onClick={() => setIsOpen(false)}
            >
              <Phone className="h-4 w-4" />
              Llamar
            </a>
          )}
          {provider.email && (
            <a
              href={`mailto:${provider.email}`}
              className="w-full px-3 py-2 text-left text-sm hover:bg-[#CCE3DE]/50 flex items-center gap-2 text-[#3D5A4C]"
              onClick={() => setIsOpen(false)}
            >
              <Mail className="h-4 w-4" />
              Enviar email
            </a>
          )}
          <hr className="my-1 border-[#CCE3DE]" />
          <button
            onClick={() => {
              onToggleActive(provider.id, !provider.isActive);
              setIsOpen(false);
            }}
            className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${
              provider.isActive
                ? "hover:bg-[#FFE4D6] text-[#C65D3B]"
                : "hover:bg-[#E8F5E9] text-[#2E7D32]"
            }`}
          >
            <Power className="h-4 w-4" />
            {provider.isActive ? "Desactivar" : "Activar"}
          </button>
        </div>
      )}
    </div>
  );
}

export function ProvidersTable({
  providers,
  onEdit,
  onViewHistory,
  onToggleActive,
  isLoading,
}: ProvidersTableProps) {
  if (isLoading) {
    return (
      <div className="bg-[#F6FFF8] rounded-lg border border-[#CCE3DE] overflow-hidden">
        <div className="animate-pulse">
          <div className="h-12 bg-[#CCE3DE]/50" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-[#CCE3DE]/20 border-t border-[#CCE3DE]" />
          ))}
        </div>
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <div className="bg-[#F6FFF8] rounded-lg border border-[#CCE3DE] p-8 text-center">
        <p className="text-[#5C7A6B]">No se encontraron proveedores</p>
      </div>
    );
  }

  return (
    <div className="bg-[#F6FFF8] rounded-lg border border-[#CCE3DE] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#CCE3DE] bg-[#CCE3DE]/30">
              <th className="px-4 py-3 text-left text-sm font-medium text-[#3D5A4C]">Nombre</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#3D5A4C]">Contacto</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#3D5A4C]">Teléfono</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#3D5A4C]">Email</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-[#3D5A4C]">Estado</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-[#3D5A4C]">Total compras</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-[#3D5A4C]">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {providers.map((provider) => (
              <tr
                key={provider.id}
                className="border-b border-[#CCE3DE] last:border-0 hover:bg-[#CCE3DE]/20"
              >
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-[#2D3D35]">
                    {provider.name}
                  </p>
                </td>
                <td className="px-4 py-3 text-sm text-[#5C7A6B]">
                  {provider.contactName || "-"}
                </td>
                <td className="px-4 py-3">
                  {provider.phone ? (
                    <a
                      href={`tel:${provider.phone}`}
                      className="text-sm text-[#6B9080] hover:underline"
                    >
                      {provider.phone}
                    </a>
                  ) : (
                    <span className="text-sm text-[#5C7A6B]">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {provider.email ? (
                    <a
                      href={`mailto:${provider.email}`}
                      className="text-sm text-[#6B9080] hover:underline"
                    >
                      {provider.email}
                    </a>
                  ) : (
                    <span className="text-sm text-[#5C7A6B]">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      provider.isActive
                        ? "bg-[#E8F5E9] text-[#2E7D32]"
                        : "bg-[#F5E6D3] text-[#8B6914]"
                    }`}
                  >
                    {provider.isActive ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-semibold text-[#3D5A4C]">
                    {formatCOP(provider.totalExpenses || 0)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center">
                    <ActionMenu
                      provider={provider}
                      onEdit={onEdit}
                      onViewHistory={onViewHistory}
                      onToggleActive={onToggleActive}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
