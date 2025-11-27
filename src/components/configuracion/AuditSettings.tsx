"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { History, Filter, User, FileText, Trash2, RefreshCw, Plus, Eye, AlertTriangle } from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

const actionLabels: Record<string, string> = {
  CREATE: "Crear",
  UPDATE: "Actualizar",
  DELETE: "Eliminar",
  RESTORE: "Restaurar",
};

const actionColors: Record<string, string> = {
  CREATE: "bg-green-100 text-green-700",
  UPDATE: "bg-blue-100 text-blue-700",
  DELETE: "bg-red-100 text-red-700",
  RESTORE: "bg-purple-100 text-purple-700",
};

const actionIcons: Record<string, React.ElementType> = {
  CREATE: Plus,
  UPDATE: RefreshCw,
  DELETE: Trash2,
  RESTORE: RefreshCw,
};

const entityLabels: Record<string, string> = {
  Patient: "Paciente",
  Sale: "Venta",
  Appointment: "Cita",
  Expense: "Gasto",
};

export function AuditSettings() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [filters, setFilters] = useState({
    action: "all",
    entity: "all",
    days: "7",
  });

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.action !== "all") params.append("action", filters.action);
      if (filters.entity !== "all") params.append("entity", filters.entity);

      // Calculate date range based on days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(filters.days));
      params.append("startDate", startDate.toISOString());
      params.append("endDate", endDate.toISOString());

      const response = await fetch(`/api/audit?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const formatEntityName = (log: AuditLog) => {
    if (log.oldData) {
      if (log.entity === "Patient" && log.oldData.fullName) {
        return log.oldData.fullName as string;
      }
      if (log.entity === "Sale" && log.oldData.amount) {
        return `$${Number(log.oldData.amount).toLocaleString()}`;
      }
      if (log.entity === "Expense" && log.oldData.description) {
        return log.oldData.description as string;
      }
    }
    return log.entityId.slice(0, 8) + "...";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <History className="w-6 h-6 text-[#6B9080]" />
        <div>
          <h3 className="text-lg font-semibold text-[#2D3D35]">Registro de Auditoría</h3>
          <p className="text-sm text-[#5C7A6B]">
            Historial de cambios en datos críticos del sistema
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-[#CCE3DE]/30 border border-[#A4C3B2] rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-[#6B9080] mt-0.5 flex-shrink-0" />
        <div className="text-sm text-[#3D5A4C]">
          <p className="font-medium">Protección de Datos Activa</p>
          <p className="mt-1">
            Los datos eliminados se conservan durante 30 días y pueden ser restaurados.
            El sistema utiliza &quot;soft delete&quot; para proteger contra eliminaciones accidentales.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#5C7A6B]" />
          <span className="text-sm text-[#5C7A6B]">Filtros:</span>
        </div>

        <select
          value={filters.action}
          onChange={(e) => setFilters({ ...filters, action: e.target.value })}
          className="px-3 py-2 text-sm border border-[#CCE3DE] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#6B9080]"
        >
          <option value="all">Todas las acciones</option>
          <option value="CREATE">Crear</option>
          <option value="UPDATE">Actualizar</option>
          <option value="DELETE">Eliminar</option>
          <option value="RESTORE">Restaurar</option>
        </select>

        <select
          value={filters.entity}
          onChange={(e) => setFilters({ ...filters, entity: e.target.value })}
          className="px-3 py-2 text-sm border border-[#CCE3DE] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#6B9080]"
        >
          <option value="all">Todas las entidades</option>
          <option value="Patient">Pacientes</option>
          <option value="Sale">Ventas</option>
          <option value="Appointment">Citas</option>
          <option value="Expense">Gastos</option>
        </select>

        <select
          value={filters.days}
          onChange={(e) => setFilters({ ...filters, days: e.target.value })}
          className="px-3 py-2 text-sm border border-[#CCE3DE] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#6B9080]"
        >
          <option value="7">Últimos 7 días</option>
          <option value="30">Últimos 30 días</option>
          <option value="90">Últimos 90 días</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-[#CCE3DE]/30 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 bg-[#F6FFF8] rounded-lg border border-[#CCE3DE]">
          <History className="w-12 h-12 text-[#CCE3DE] mx-auto mb-3" />
          <p className="text-[#5C7A6B]">No hay registros de auditoría en el período seleccionado</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-[#CCE3DE] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#CCE3DE] bg-[#CCE3DE]/20">
                <th className="text-left px-4 py-3 text-sm font-medium text-[#3D5A4C]">Fecha</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[#3D5A4C]">Usuario</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[#3D5A4C]">Acción</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[#3D5A4C]">Entidad</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[#3D5A4C]">Detalle</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-[#3D5A4C]">Ver</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const ActionIcon = actionIcons[log.action] || FileText;
                return (
                  <tr key={log.id} className="border-b border-[#CCE3DE] hover:bg-[#CCE3DE]/10">
                    <td className="px-4 py-3 text-sm text-[#5C7A6B]">
                      {format(new Date(log.createdAt), "dd MMM yyyy, HH:mm", { locale: es })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#6B9080] flex items-center justify-center text-white text-xs">
                          {log.user.fullName.charAt(0)}
                        </div>
                        <span className="text-sm text-[#3D5A4C]">{log.user.fullName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${actionColors[log.action]}`}>
                        <ActionIcon className="w-3 h-3" />
                        {actionLabels[log.action] || log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#3D5A4C]">
                      {entityLabels[log.entity] || log.entity}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#5C7A6B] max-w-[200px] truncate">
                      {formatEntityName(log)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1 hover:bg-[#CCE3DE] rounded transition-colors"
                        title="Ver detalles"
                      >
                        <Eye className="w-4 h-4 text-[#6B9080]" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#CCE3DE]">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-[#6B9080]" />
                <div>
                  <h3 className="font-semibold text-[#2D3D35]">Detalle de Auditoría</h3>
                  <p className="text-sm text-[#5C7A6B]">
                    {format(new Date(selectedLog.createdAt), "dd MMM yyyy, HH:mm:ss", { locale: es })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-[#5C7A6B] hover:text-[#2D3D35]"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#5C7A6B] uppercase tracking-wider">Usuario</label>
                  <p className="text-[#2D3D35] font-medium">{selectedLog.user.fullName}</p>
                  <p className="text-sm text-[#5C7A6B]">{selectedLog.user.email}</p>
                </div>
                <div>
                  <label className="text-xs text-[#5C7A6B] uppercase tracking-wider">Acción</label>
                  <p className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${actionColors[selectedLog.action]}`}>
                    {actionLabels[selectedLog.action] || selectedLog.action}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-[#5C7A6B] uppercase tracking-wider">Entidad</label>
                  <p className="text-[#2D3D35]">{entityLabels[selectedLog.entity] || selectedLog.entity}</p>
                </div>
                <div>
                  <label className="text-xs text-[#5C7A6B] uppercase tracking-wider">ID</label>
                  <p className="text-[#2D3D35] font-mono text-sm">{selectedLog.entityId}</p>
                </div>
              </div>

              {selectedLog.oldData && (
                <div>
                  <label className="text-xs text-[#5C7A6B] uppercase tracking-wider">Datos Anteriores</label>
                  <pre className="mt-2 p-3 bg-[#F6FFF8] rounded-lg text-sm text-[#3D5A4C] overflow-x-auto">
                    {JSON.stringify(selectedLog.oldData, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.newData && (
                <div>
                  <label className="text-xs text-[#5C7A6B] uppercase tracking-wider">Datos Nuevos</label>
                  <pre className="mt-2 p-3 bg-[#F6FFF8] rounded-lg text-sm text-[#3D5A4C] overflow-x-auto">
                    {JSON.stringify(selectedLog.newData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
