"use client";

import { Bell, Mail, MessageSquare, Clock, Construction } from "lucide-react";

export function NotificationsSettings() {
  return (
    <div className="space-y-6">
      {/* Coming Soon Banner */}
      <div className="bg-[#FFF8E1] border border-[#FFE082] rounded-lg p-6 text-center">
        <Construction className="w-12 h-12 text-[#F57C00] mx-auto mb-3" />
        <h3 className="font-semibold text-[#E65100] mb-2">Próximamente</h3>
        <p className="text-[#F57C00]">
          Estamos trabajando en las configuraciones de notificaciones.
          <br />
          Pronto podrás configurar recordatorios automáticos para tus pacientes.
        </p>
      </div>

      {/* Preview of upcoming features */}
      <div className="opacity-50 pointer-events-none">
        <h3 className="font-semibold text-[#2D3D35] mb-4">Vista previa de funciones</h3>

        <div className="space-y-4">
          {/* WhatsApp Notifications */}
          <div className="bg-[#F6FFF8] rounded-lg border border-[#CCE3DE] p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-[#25D366] flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-medium text-[#2D3D35]">WhatsApp</h4>
                <p className="text-sm text-[#5C7A6B]">Recordatorios por WhatsApp</p>
              </div>
            </div>
            <div className="space-y-3 pl-13">
              <label className="flex items-center gap-3">
                <input type="checkbox" disabled className="rounded" />
                <span className="text-sm text-[#3D5A4C]">Recordatorio 24h antes de la cita</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" disabled className="rounded" />
                <span className="text-sm text-[#3D5A4C]">Recordatorio 1h antes de la cita</span>
              </label>
            </div>
          </div>

          {/* Email Notifications */}
          <div className="bg-[#F6FFF8] rounded-lg border border-[#CCE3DE] p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-[#6B9080] flex items-center justify-center">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-medium text-[#2D3D35]">Email</h4>
                <p className="text-sm text-[#5C7A6B]">Notificaciones por correo</p>
              </div>
            </div>
            <div className="space-y-3 pl-13">
              <label className="flex items-center gap-3">
                <input type="checkbox" disabled className="rounded" />
                <span className="text-sm text-[#3D5A4C]">Confirmación de cita agendada</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" disabled className="rounded" />
                <span className="text-sm text-[#3D5A4C]">Resumen semanal de citas</span>
              </label>
            </div>
          </div>

          {/* System Notifications */}
          <div className="bg-[#F6FFF8] rounded-lg border border-[#CCE3DE] p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-[#84A98C] flex items-center justify-center">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-medium text-[#2D3D35]">Sistema</h4>
                <p className="text-sm text-[#5C7A6B]">Alertas del sistema</p>
              </div>
            </div>
            <div className="space-y-3 pl-13">
              <label className="flex items-center gap-3">
                <input type="checkbox" disabled className="rounded" />
                <span className="text-sm text-[#3D5A4C]">Stock bajo de inventario</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" disabled className="rounded" />
                <span className="text-sm text-[#3D5A4C]">Citas pendientes de confirmar</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
