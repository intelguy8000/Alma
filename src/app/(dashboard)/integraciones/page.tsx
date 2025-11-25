"use client";

import { MessageCircle, Calendar, FileText, Mail, Plug, Clock } from "lucide-react";

interface IntegrationCardProps {
  icon: React.ReactNode;
  iconBg: string;
  name: string;
  description: string;
  status: "coming_soon" | "available" | "connected";
  buttonText: string;
}

function IntegrationCard({
  icon,
  iconBg,
  name,
  description,
  status,
  buttonText,
}: IntegrationCardProps) {
  return (
    <div className="bg-[#F6FFF8] rounded-xl border border-[#CCE3DE] p-6 flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-14 h-14 rounded-xl ${iconBg} flex items-center justify-center`}>
          {icon}
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
          <Clock className="w-3 h-3" />
          Próximamente
        </span>
      </div>

      <h3 className="text-lg font-semibold text-[#2D3D35] mb-2">{name}</h3>
      <p className="text-sm text-[#5C7A6B] flex-1 mb-4">{description}</p>

      <button
        disabled={status === "coming_soon"}
        className="w-full px-4 py-2.5 bg-[#CCE3DE]/50 text-[#5C7A6B] rounded-lg font-medium cursor-not-allowed opacity-60"
      >
        {buttonText}
      </button>
    </div>
  );
}

const integrations: IntegrationCardProps[] = [
  {
    icon: <MessageCircle className="w-7 h-7 text-white" />,
    iconBg: "bg-[#25D366]",
    name: "WhatsApp Business",
    description:
      "Envía recordatorios automáticos a tus pacientes antes de cada cita. Reduce las ausencias y mejora la comunicación.",
    status: "coming_soon",
    buttonText: "Configurar",
  },
  {
    icon: <Calendar className="w-7 h-7 text-white" />,
    iconBg: "bg-[#4285F4]",
    name: "Google Calendar",
    description:
      "Sincroniza automáticamente tus citas con Google Calendar. Mantén tu agenda actualizada en todos tus dispositivos.",
    status: "coming_soon",
    buttonText: "Conectar",
  },
  {
    icon: <FileText className="w-7 h-7 text-white" />,
    iconBg: "bg-[#00BFA5]",
    name: "Alegra",
    description:
      "Genera facturas electrónicas automáticamente al registrar ventas. Cumple con los requisitos de la DIAN.",
    status: "coming_soon",
    buttonText: "Conectar",
  },
];

export default function IntegracionesPage() {
  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#6B9080] flex items-center justify-center">
          <Plug className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#2D3D35]">Integraciones</h1>
          <p className="text-[#5C7A6B]">Conecta herramientas externas con tu consultorio</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-[#6B9080] to-[#84A98C] rounded-xl p-6 text-white">
        <h2 className="text-xl font-semibold mb-2">Próximas integraciones</h2>
        <p className="text-white/90">
          Estamos trabajando en nuevas integraciones para automatizar tu flujo de trabajo.
          Pronto podrás conectar WhatsApp, Google Calendar y más herramientas.
        </p>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration) => (
          <IntegrationCard key={integration.name} {...integration} />
        ))}
      </div>

      {/* Request Integration Section */}
      <div className="bg-[#F6FFF8] rounded-xl border border-[#CCE3DE] p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-[#CCE3DE] flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-[#6B9080]" />
        </div>
        <h3 className="text-xl font-semibold text-[#2D3D35] mb-2">
          ¿Necesitas otra integración?
        </h3>
        <p className="text-[#5C7A6B] mb-4 max-w-md mx-auto">
          Si necesitas integrar otra herramienta con tu sistema, contáctanos y evaluaremos
          agregarla a nuestra lista de desarrollo.
        </p>
        <a
          href="mailto:soporte@medicinadelinema.com?subject=Solicitud de integración"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#6B9080] text-white rounded-lg font-medium hover:bg-[#5A7A6B] transition-colors"
        >
          <Mail className="w-4 h-4" />
          soporte@medicinadelinema.com
        </a>
      </div>
    </div>
  );
}
