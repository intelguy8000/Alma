"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageSquareWarning, Download, Check, Clock, Sparkles, Trash2, Filter } from "lucide-react";

interface Feedback {
  id: string;
  type: string;
  description: string;
  context: string | null;
  status: string;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  bug: { label: "Bug", color: "bg-red-100 text-red-700" },
  mejora: { label: "Mejora", color: "bg-blue-100 text-blue-700" },
  deseo: { label: "Deseo", color: "bg-purple-100 text-purple-700" },
  confusion: { label: "Confusión", color: "bg-yellow-100 text-yellow-700" },
};

const STATUS_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pendiente: { label: "Pendiente", color: "bg-gray-100 text-gray-700", icon: <Clock className="w-3 h-3" /> },
  revisado: { label: "Revisado", color: "bg-blue-100 text-blue-700", icon: <Check className="w-3 h-3" /> },
  implementado: { label: "Implementado", color: "bg-green-100 text-green-700", icon: <Sparkles className="w-3 h-3" /> },
};

export function FeedbackSettings() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);

  const loadFeedback = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType) params.set("type", filterType);
      if (filterStatus) params.set("status", filterStatus);

      const res = await fetch(`/api/feedback?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setFeedback(data);
      }
    } catch (error) {
      console.error("Error loading feedback:", error);
    } finally {
      setIsLoading(false);
    }
  }, [filterType, filterStatus]);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        setFeedback((prev) =>
          prev.map((f) => (f.id === id ? { ...f, status } : f))
        );
      }
    } catch (error) {
      console.error("Error updating feedback:", error);
    }
  };

  const deleteFeedback = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este feedback?")) return;

    try {
      const res = await fetch(`/api/feedback/${id}`, { method: "DELETE" });
      if (res.ok) {
        setFeedback((prev) => prev.filter((f) => f.id !== id));
      }
    } catch (error) {
      console.error("Error deleting feedback:", error);
    }
  };

  const exportCSV = async () => {
    setIsExporting(true);
    try {
      const res = await fetch("/api/feedback/export");
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `feedback-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error exporting:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#F6FFF8] rounded-lg border border-[#CCE3DE] p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#6B9080] flex items-center justify-center">
              <MessageSquareWarning className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-[#2D3D35]">Feedback de Usuarios</h3>
              <p className="text-sm text-[#5C7A6B]">
                Reportes, sugerencias y confusiones detectadas por Tabata
              </p>
            </div>
          </div>
          <button
            onClick={exportCSV}
            disabled={isExporting || feedback.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#CCE3DE] rounded-lg text-[#3D5A4C] hover:bg-[#F6FFF8] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#5C7A6B]" />
          <span className="text-sm text-[#5C7A6B]">Filtros:</span>
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 border border-[#CCE3DE] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#6B9080]"
        >
          <option value="">Todos los tipos</option>
          <option value="bug">Bug</option>
          <option value="mejora">Mejora</option>
          <option value="deseo">Deseo</option>
          <option value="confusion">Confusión</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-[#CCE3DE] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#6B9080]"
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="revisado">Revisado</option>
          <option value="implementado">Implementado</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-[#CCE3DE] overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-[#5C7A6B]">Cargando...</div>
        ) : feedback.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquareWarning className="w-12 h-12 text-[#CCE3DE] mx-auto mb-3" />
            <p className="text-[#5C7A6B]">No hay feedback registrado</p>
            <p className="text-sm text-[#84A98C]">
              Los usuarios pueden reportar problemas o sugerencias a través de Tabata
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-[#F6FFF8] border-b border-[#CCE3DE]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#3D5A4C] uppercase">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#3D5A4C] uppercase">
                  Usuario
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#3D5A4C] uppercase">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#3D5A4C] uppercase">
                  Descripción
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#3D5A4C] uppercase">
                  Estado
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[#3D5A4C] uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#CCE3DE]">
              {feedback.map((item) => (
                <tr key={item.id} className="hover:bg-[#F6FFF8]">
                  <td className="px-4 py-3 text-sm text-[#5C7A6B] whitespace-nowrap">
                    {formatDate(item.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-[#2D3D35]">
                        {item.user.fullName}
                      </p>
                      <p className="text-xs text-[#5C7A6B]">{item.user.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        TYPE_LABELS[item.type]?.color || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {TYPE_LABELS[item.type]?.label || item.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-[#2D3D35] max-w-md truncate" title={item.description}>
                      {item.description}
                    </p>
                    {item.context && (
                      <p className="text-xs text-[#5C7A6B] mt-1 truncate" title={item.context}>
                        Contexto: {item.context}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={item.status}
                      onChange={(e) => updateStatus(item.id, e.target.value)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${
                        STATUS_LABELS[item.status]?.color || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="revisado">Revisado</option>
                      <option value="implementado">Implementado</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => deleteFeedback(item.id)}
                      className="p-2 text-[#5C7A6B] hover:text-red-500 hover:bg-red-50 rounded-lg"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
