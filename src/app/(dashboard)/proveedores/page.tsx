"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search } from "lucide-react";
import { ProvidersTable } from "@/components/proveedores/ProvidersTable";
import { ProviderModal } from "@/components/proveedores/ProviderModal";
import { ProviderHistoryDrawer } from "@/components/proveedores/ProviderHistoryDrawer";
import type { Provider, ProviderFormData } from "@/types/providers";

export default function ProveedoresPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // History Drawer
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [historyProviderId, setHistoryProviderId] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchProviders = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("includeInactive", "true");
      if (debouncedSearch) params.set("search", debouncedSearch);

      const response = await fetch(`/api/providers?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setProviders(data);
      }
    } catch (error) {
      console.error("Error fetching providers:", error);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const handleCreateProvider = async (providerData: ProviderFormData) => {
    const response = await fetch("/api/providers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(providerData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error al crear proveedor");
    }

    fetchProviders();
  };

  const handleEditProvider = async (providerData: ProviderFormData) => {
    const response = await fetch(`/api/providers/${providerData.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(providerData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error al actualizar proveedor");
    }

    fetchProviders();
  };

  const handleToggleActive = async (providerId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/providers/${providerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });

      if (response.ok) {
        fetchProviders();
      }
    } catch (error) {
      console.error("Error toggling provider status:", error);
    }
  };

  const handleEditClick = (provider: Provider) => {
    setSelectedProvider(provider);
    setIsEditModalOpen(true);
  };

  const handleViewHistory = (provider: Provider) => {
    setHistoryProviderId(provider.id);
    setIsHistoryDrawerOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2D3D35]">Proveedores</h1>
          <p className="text-[#5C7A6B]">Gestiona los proveedores del consultorio</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#6B9080] text-white rounded-md hover:bg-[#5A7A6B] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nuevo Proveedor
        </button>
      </div>

      {/* Search */}
      <div className="bg-[#F6FFF8] rounded-lg border border-[#CCE3DE] p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5C7A6B]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[#CCE3DE] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#6B9080] text-[#2D3D35]"
            placeholder="Buscar por nombre..."
          />
        </div>
      </div>

      {/* Table */}
      <ProvidersTable
        providers={providers}
        onEdit={handleEditClick}
        onViewHistory={handleViewHistory}
        onToggleActive={handleToggleActive}
        isLoading={isLoading}
      />

      {/* Create Modal */}
      <ProviderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateProvider}
      />

      {/* Edit Modal */}
      <ProviderModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedProvider(null);
        }}
        onSave={handleEditProvider}
        provider={selectedProvider}
      />

      {/* History Drawer */}
      <ProviderHistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => {
          setIsHistoryDrawerOpen(false);
          setHistoryProviderId(null);
        }}
        providerId={historyProviderId}
      />
    </div>
  );
}
