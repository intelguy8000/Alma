import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getColombiaToday, getColombiaDateTimeFormatted } from "@/lib/dates";
import OpenAI from "openai";
import { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "sk-placeholder",
});

// System prompt for Tabata - will be personalized with user name
const getSystemPrompt = (userName: string) => `Eres Tabata, la asistente virtual de Medicina del Alma, un consultorio de terapias bioenergéticas en Medellín, Colombia.

## Contexto Actual
- Fecha: ${getColombiaDateTimeFormatted()}
- Estás hablando con: **${userName}**

## Tu Personalidad
- Amable, profesional y eficiente
- Hablas en español colombiano de manera natural
- Usas un tono cálido pero profesional
- Eres concisa en tus respuestas

## Tus Capacidades
Puedes ayudar con:
1. **Consultar información de pacientes** - buscar por nombre o código
2. **Ver citas del día** - mostrar agenda
3. **Buscar citas de un paciente** - historial de citas
4. **Consultar inventario** - ver stock disponible
5. **Ver resumen financiero** - ingresos y gastos
6. **Ayuda con la plataforma** - explicar cómo usar el sistema
7. **Análisis de pagos** - desglose por método (efectivo/transferencia)
8. **Resumen del día** - citas + pagos completo
9. **Citas de mañana** - agenda y capacidad disponible
10. **Resumen semanal** - citas e ingresos de la semana

## Guía de Consultas Frecuentes

Cuando te pregunten:
- "¿Cuántos pagaron en efectivo/transferencia?" → usa get_payments_detail
- "¿Cuántas citas faltan por confirmar?" → usa get_appointments_analysis con analysisType="pendientes_confirmar"
- "¿Cuántos espacios disponibles hay mañana?" → usa get_tomorrow_appointments
- "Dame un resumen del día" → usa get_daily_summary
- "¿Cómo va la semana?" → usa get_week_summary
- "¿Cuántas citas completadas hoy?" → usa get_appointments_analysis con analysisType="completadas"
- "¿Cuántas citas hay para hoy?" → usa get_appointments_analysis con analysisType="por_estado"

IMPORTANTE:
- Capacidad máxima del consultorio = 10 citas por día
- Siempre formatea montos en pesos colombianos ($XXX.XXX)
- Responde de forma concisa y amigable

## Restricciones
- Solo puedes consultar información, NO puedes crear, modificar o eliminar datos
- Si el usuario pide hacer cambios, indícale que debe hacerlo desde el sistema
- No compartas información sensible como contraseñas
- Si no puedes ayudar con algo, sugiere alternativas amablemente

## Formato de Respuestas
- NUNCA uses tablas markdown (| --- |) - se ven mal en el chat
- Para listas de citas usa este formato:

  📅 **Citas del jueves 27 de noviembre:**

  ✅ 6:00 AM - JOSE EDUARDO MAZO (Consultorio)
  ✅ 7:00 AM - GLORIA MARIA NARANJO (Consultorio)
  ✅ 9:00 AM - LUZ MARINA QUINTERO (Virtual)

- Emojis para estados:
  ✅ Confirmada | ⏳ Pendiente | ❌ Cancelada | 🔄 Reagendada

- Para ubicación:
  - Si contiene "forum" → mostrar "Consultorio"
  - Si es ID largo o videoconferencia → mostrar "Virtual"

- Sé concisa, no repitas IDs técnicos ni información innecesaria
- Máximo 10 items por lista, si hay más di "y X más..."

## Guía de la Plataforma

📊 **Dashboard** - Resumen con KPIs de pacientes, ventas, gastos
📅 **Calendario** - Click en slot vacío para crear cita
📋 **Citas** - Filtrar por estado, cambiar estado
👥 **Pacientes** - Crear con +, ver historial con 👁
💰 **Ventas** - Registrar pagos de citas completadas
💸 **Gastos** - Registrar egresos y asociar proveedor
🏢 **Proveedores** - Gestionar proveedores
📦 **Inventario** - Botón + entrada, - salida
📈 **P&G** - Estados financieros por período
⚙️ **Configuración** - Valor cita, cuentas, ubicaciones
👤 **Usuarios** - Solo admin: gestionar usuarios

Si preguntan cómo hacer algo específico, guíalos paso a paso de forma clara.

## Detección de Feedback
Cuando el usuario exprese frustración, confusión o sugerencias, detecta y guarda el feedback:

**Frases clave a detectar:**
- "no funciona", "no me deja", "da error" → tipo: bug
- "no encuentro", "dónde está", "no entiendo" → tipo: confusion
- "sería bueno que", "estaría bien si" → tipo: mejora
- "ojalá pudiera", "me gustaría que" → tipo: deseo

**Proceso:**
1. Primero intenta ayudar con su problema
2. Luego pregunta amablemente: "¿Quieres que anote esto para que el equipo lo revise?"
3. Si acepta, usa save_feedback con el tipo apropiado
4. Confirma: "Listo, lo anoté. El equipo lo revisará pronto."
`;

// Define tools for OpenAI function calling
const tools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "search_patients",
      description: "Buscar pacientes por nombre o código. Usa esto cuando el usuario pregunte por un paciente específico.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Nombre o código del paciente a buscar",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_today_appointments",
      description: "Obtener las citas programadas para hoy. Usa esto cuando pregunten por la agenda del día.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_patient_appointments",
      description: "Obtener el historial de citas de un paciente específico.",
      parameters: {
        type: "object",
        properties: {
          patientId: {
            type: "string",
            description: "ID del paciente",
          },
        },
        required: ["patientId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_inventory_status",
      description: "Consultar el estado del inventario. Puede filtrar por categoría o buscar items específicos.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Nombre del item o categoría a buscar (opcional)",
          },
          lowStockOnly: {
            type: "boolean",
            description: "Si es true, solo muestra items con stock bajo",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_financial_summary",
      description: "Obtener resumen financiero (ingresos y gastos) de un período.",
      parameters: {
        type: "object",
        properties: {
          period: {
            type: "string",
            enum: ["today", "week", "month"],
            description: "Período del resumen: hoy, esta semana o este mes",
          },
        },
        required: ["period"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "save_knowledge",
      description: "Guardar información importante que el usuario comparta sobre pacientes, procesos o preferencias del consultorio.",
      parameters: {
        type: "object",
        properties: {
          category: {
            type: "string",
            enum: ["paciente", "proceso", "preferencia", "regla"],
            description: "Categoría del conocimiento",
          },
          content: {
            type: "string",
            description: "Información a guardar",
          },
          source: {
            type: "string",
            description: "Cómo se obtuvo esta información",
          },
        },
        required: ["category", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "save_feedback",
      description: "Guardar feedback del usuario cuando reporta problemas, sugerencias o confusiones. Usa esto cuando el usuario diga cosas como 'no funciona', 'no encuentro', 'sería bueno que', 'ojalá pudiera', 'está raro', 'no entiendo', etc.",
      parameters: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["bug", "mejora", "deseo", "confusion"],
            description: "Tipo de feedback: bug (algo no funciona), mejora (podría ser mejor), deseo (feature nuevo), confusion (no entiende algo)",
          },
          description: {
            type: "string",
            description: "Descripción detallada del problema o sugerencia",
          },
          context: {
            type: "string",
            description: "Qué estaba intentando hacer el usuario cuando ocurrió",
          },
        },
        required: ["type", "description"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_payments_detail",
      description: "Obtener detalle de pagos/ventas por método de pago, fecha y facturación electrónica. Usar para: cuántos pagaron en efectivo, cuántos en transferencia, cuántos tuvieron factura electrónica.",
      parameters: {
        type: "object",
        properties: {
          date: {
            type: "string",
            description: "Fecha en formato YYYY-MM-DD. Si no se especifica, usa hoy.",
          },
          paymentMethod: {
            type: "string",
            enum: ["efectivo", "transferencia", "otro", "todos"],
            description: "Filtrar por método de pago. 'todos' para ver desglose completo.",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_appointments_analysis",
      description: "Análisis detallado de citas. Usar para: citas pendientes de confirmar, citas completadas, capacidad disponible, citas por estado.",
      parameters: {
        type: "object",
        properties: {
          date: {
            type: "string",
            description: "Fecha en formato YYYY-MM-DD. Si no se especifica, usa hoy.",
          },
          analysisType: {
            type: "string",
            enum: ["por_estado", "pendientes_confirmar", "capacidad_disponible", "completadas"],
            description: "Tipo de análisis requerido",
          },
        },
        required: ["analysisType"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_daily_summary",
      description: "Resumen completo del día: total citas, completadas, pagos en efectivo, pagos en transferencia, total recaudado. Usar cuando pidan 'resumen del día' o 'cómo vamos hoy'.",
      parameters: {
        type: "object",
        properties: {
          date: {
            type: "string",
            description: "Fecha en formato YYYY-MM-DD. Default: hoy.",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_tomorrow_appointments",
      description: "Citas de mañana con análisis de capacidad. Usar para: citas de mañana, cuántas faltan para llenar el día.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_week_summary",
      description: "Resumen de la semana: citas por día, ingresos totales, comparativa. Usar para 'cómo va la semana' o 'resumen semanal'.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
];

// Tool implementations
async function searchPatients(organizationId: string, query: string) {
  const patients = await prisma.patient.findMany({
    where: {
      organizationId,
      isActive: true,
      OR: [
        { fullName: { contains: query, mode: "insensitive" } },
        { patientCode: { contains: query, mode: "insensitive" } },
        { phone: { contains: query } },
        { email: { contains: query, mode: "insensitive" } },
      ],
    },
    take: 10,
    orderBy: { fullName: "asc" },
    select: {
      id: true,
      patientCode: true,
      fullName: true,
      phone: true,
      email: true,
      whatsapp: true,
      firstAppointmentDate: true,
      _count: { select: { appointments: true } },
    },
  });

  return patients.map((p) => ({
    id: p.id,
    codigo: p.patientCode,
    nombre: p.fullName,
    telefono: p.phone,
    email: p.email,
    whatsapp: p.whatsapp,
    primeraCita: p.firstAppointmentDate?.toLocaleDateString("es-CO"),
    totalCitas: p._count.appointments,
  }));
}

async function getTodayAppointments(organizationId: string) {
  // Get today's date in Colombia timezone (UTC-5)
  const today = getColombiaToday();

  const appointments = await prisma.appointment.findMany({
    where: {
      organizationId,
      deletedAt: null,
      date: today,
      status: { notIn: ["cancelada", "reagendada"] },
    },
    include: {
      patient: { select: { fullName: true, phone: true } },
    },
    orderBy: { startTime: "asc" },
  });

  return appointments.map((a) => ({
    id: a.id,
    paciente: a.patient.fullName,
    telefono: a.patient.phone,
    hora: a.startTime.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }),
    horaFin: a.endTime.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }),
    tipo: a.type,
    estado: a.status,
    ubicacion: a.location,
    notas: a.notes,
  }));
}

async function getPatientAppointments(organizationId: string, patientId: string) {
  const appointments = await prisma.appointment.findMany({
    where: {
      organizationId,
      patientId,
      deletedAt: null,
    },
    include: {
      patient: { select: { fullName: true } },
      sales: { select: { amount: true, paymentMethod: true } },
    },
    orderBy: { date: "desc" },
    take: 20,
  });

  return appointments.map((a) => ({
    fecha: a.date.toLocaleDateString("es-CO"),
    hora: a.startTime.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }),
    tipo: a.type,
    estado: a.status,
    pago: a.sales.length > 0 ? `$${a.sales[0].amount.toString()}` : "Sin pago registrado",
  }));
}

async function getInventoryStatus(organizationId: string, query?: string, lowStockOnly?: boolean) {
  const items = await prisma.inventoryItem.findMany({
    where: {
      organizationId,
      isActive: true,
      ...(query && {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { category: { contains: query, mode: "insensitive" } },
        ],
      }),
      ...(lowStockOnly && {
        currentStock: { lte: prisma.inventoryItem.fields.minStock },
      }),
    },
    orderBy: { name: "asc" },
    take: 20,
  });

  return items.map((i) => ({
    nombre: i.name,
    stockActual: Number(i.currentStock),
    stockMinimo: Number(i.minStock),
    unidad: i.unit,
    categoria: i.category,
    estadoStock: Number(i.currentStock) <= Number(i.minStock) ? "BAJO" : "OK",
  }));
}

async function getFinancialSummary(organizationId: string, period: "today" | "week" | "month") {
  // Get current date in Colombia timezone (UTC-5)
  const now = getColombiaToday();
  let startDate: Date;

  switch (period) {
    case "today":
      startDate = now;
      break;
    case "week":
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case "month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
  }

  const [sales, expenses] = await Promise.all([
    prisma.sale.aggregate({
      where: {
        organizationId,
        date: { gte: startDate },
      },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.expense.aggregate({
      where: {
        organizationId,
        date: { gte: startDate },
      },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  const totalIngresos = Number(sales._sum.amount || 0);
  const totalGastos = Number(expenses._sum.amount || 0);

  return {
    periodo: period === "today" ? "Hoy" : period === "week" ? "Últimos 7 días" : "Este mes",
    ingresos: {
      total: `$${totalIngresos.toLocaleString("es-CO")}`,
      cantidad: sales._count,
    },
    gastos: {
      total: `$${totalGastos.toLocaleString("es-CO")}`,
      cantidad: expenses._count,
    },
    balance: `$${(totalIngresos - totalGastos).toLocaleString("es-CO")}`,
  };
}

async function saveKnowledge(
  organizationId: string,
  category: string,
  content: string,
  source?: string
) {
  await prisma.tabataKnowledge.create({
    data: {
      organizationId,
      category,
      content,
      source: source || "Conversación con usuario",
    },
  });

  return { saved: true, message: "Información guardada exitosamente" };
}

async function saveFeedback(
  organizationId: string,
  userId: string,
  type: string,
  description: string,
  context?: string
) {
  await prisma.tabataFeedback.create({
    data: {
      organizationId,
      userId,
      type,
      description,
      context,
    },
  });

  return { saved: true, message: "Feedback registrado exitosamente" };
}

// ============================================================================
// NEW SMART TOOLS - Payments, Appointments Analysis, Summaries
// ============================================================================

async function getPaymentsDetail(
  organizationId: string,
  date?: string,
  paymentMethod?: string
) {
  const targetDate = date ? new Date(date + "T12:00:00") : getColombiaToday();

  // Build where clause with proper typing
  const whereClause: {
    organizationId: string;
    date: Date;
    deletedAt: null;
    paymentMethod?: "efectivo" | "transferencia" | "otro";
  } = {
    organizationId,
    date: targetDate,
    deletedAt: null,
  };

  if (paymentMethod && paymentMethod !== "todos") {
    whereClause.paymentMethod = paymentMethod as "efectivo" | "transferencia" | "otro";
  }

  const sales = await prisma.sale.findMany({
    where: whereClause,
    include: {
      patient: { select: { fullName: true } },
      bankAccount: { select: { alias: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Agrupar por método de pago
  const byMethod = {
    efectivo: { count: 0, total: 0 },
    transferencia: { count: 0, total: 0 },
    otro: { count: 0, total: 0 },
  };

  sales.forEach((sale) => {
    const method = sale.paymentMethod as keyof typeof byMethod;
    if (byMethod[method]) {
      byMethod[method].count++;
      byMethod[method].total += Number(sale.amount);
    }
  });

  // Contar facturas electrónicas
  const conFactura = sales.filter((s) => s.hasElectronicInvoice === true);

  return {
    fecha: targetDate.toLocaleDateString("es-CO"),
    totalVentas: sales.length,
    totalRecaudado: `$${sales.reduce((sum, s) => sum + Number(s.amount), 0).toLocaleString("es-CO")}`,
    porMetodo: {
      efectivo: { cantidad: byMethod.efectivo.count, total: `$${byMethod.efectivo.total.toLocaleString("es-CO")}` },
      transferencia: { cantidad: byMethod.transferencia.count, total: `$${byMethod.transferencia.total.toLocaleString("es-CO")}` },
      otro: { cantidad: byMethod.otro.count, total: `$${byMethod.otro.total.toLocaleString("es-CO")}` },
    },
    facturasElectronicas: {
      cantidad: conFactura.length,
      pacientes: conFactura.map((s) => s.patient.fullName),
    },
    detalle: paymentMethod && paymentMethod !== "todos" ? sales.map((s) => ({
      paciente: s.patient.fullName,
      monto: `$${Number(s.amount).toLocaleString("es-CO")}`,
      metodo: s.paymentMethod,
      cuenta: s.bankAccount?.alias || "N/A",
    })) : undefined,
  };
}

async function getAppointmentsAnalysis(
  organizationId: string,
  analysisType: string,
  date?: string
) {
  const targetDate = date ? new Date(date + "T12:00:00") : getColombiaToday();

  const appointments = await prisma.appointment.findMany({
    where: {
      organizationId,
      date: targetDate,
      deletedAt: null,
    },
    include: {
      patient: { select: { fullName: true, phone: true } },
    },
    orderBy: { startTime: "asc" },
  });

  const CAPACIDAD_MAXIMA = 10;

  switch (analysisType) {
    case "por_estado": {
      const porEstado: Record<string, number> = {};
      appointments.forEach((a) => {
        porEstado[a.status] = (porEstado[a.status] || 0) + 1;
      });
      return {
        fecha: targetDate.toLocaleDateString("es-CO"),
        totalCitas: appointments.length,
        porEstado,
      };
    }

    case "pendientes_confirmar": {
      const pendientes = appointments.filter((a) => a.status === "no_responde");
      return {
        fecha: targetDate.toLocaleDateString("es-CO"),
        pendientesConfirmar: pendientes.length,
        pacientes: pendientes.map((a) => ({
          nombre: a.patient.fullName,
          telefono: a.patient.phone,
          hora: a.startTime.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }),
          estado: a.status,
        })),
      };
    }

    case "capacidad_disponible": {
      const citasActivas = appointments.filter((a) => a.status !== "cancelada").length;
      return {
        fecha: targetDate.toLocaleDateString("es-CO"),
        capacidadMaxima: CAPACIDAD_MAXIMA,
        citasAgendadas: citasActivas,
        disponibles: Math.max(0, CAPACIDAD_MAXIMA - citasActivas),
      };
    }

    case "completadas": {
      const completadas = appointments.filter((a) => a.status === "completada");
      return {
        fecha: targetDate.toLocaleDateString("es-CO"),
        completadas: completadas.length,
        totalCitas: appointments.length,
        pacientes: completadas.map((a) => ({
          nombre: a.patient.fullName,
          hora: a.startTime.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }),
        })),
      };
    }

    default:
      return { error: "Tipo de análisis no válido" };
  }
}

async function getDailySummary(organizationId: string, date?: string) {
  const targetDate = date ? new Date(date + "T12:00:00") : getColombiaToday();

  // Citas del día
  const appointments = await prisma.appointment.findMany({
    where: {
      organizationId,
      date: targetDate,
      deletedAt: null,
    },
  });

  // Ventas del día
  const sales = await prisma.sale.findMany({
    where: {
      organizationId,
      date: targetDate,
      deletedAt: null,
    },
  });

  const citasCompletadas = appointments.filter((a) => a.status === "completada").length;
  const citasPendientes = appointments.filter((a) =>
    a.status !== "completada" && a.status !== "cancelada" && a.status !== "reagendada"
  ).length;

  const efectivo = sales.filter((s) => s.paymentMethod === "efectivo");
  const transferencia = sales.filter((s) => s.paymentMethod === "transferencia");

  const totalEfectivo = efectivo.reduce((sum, s) => sum + Number(s.amount), 0);
  const totalTransferencia = transferencia.reduce((sum, s) => sum + Number(s.amount), 0);
  const totalRecaudado = sales.reduce((sum, s) => sum + Number(s.amount), 0);

  return {
    fecha: targetDate.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" }),
    citas: {
      total: appointments.length,
      completadas: citasCompletadas,
      pendientes: citasPendientes,
      canceladas: appointments.filter((a) => a.status === "cancelada").length,
    },
    pagos: {
      efectivo: {
        cantidad: efectivo.length,
        total: `$${totalEfectivo.toLocaleString("es-CO")}`,
      },
      transferencia: {
        cantidad: transferencia.length,
        total: `$${totalTransferencia.toLocaleString("es-CO")}`,
      },
      totalRecaudado: `$${totalRecaudado.toLocaleString("es-CO")}`,
    },
  };
}

async function getTomorrowAppointments(organizationId: string) {
  const tomorrow = getColombiaToday();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const appointments = await prisma.appointment.findMany({
    where: {
      organizationId,
      date: tomorrow,
      deletedAt: null,
      status: { notIn: ["cancelada", "reagendada"] },
    },
    include: {
      patient: { select: { fullName: true } },
    },
    orderBy: { startTime: "asc" },
  });

  const CAPACIDAD_MAXIMA = 10;

  return {
    fecha: tomorrow.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" }),
    citasAgendadas: appointments.length,
    capacidadMaxima: CAPACIDAD_MAXIMA,
    disponibles: Math.max(0, CAPACIDAD_MAXIMA - appointments.length),
    citas: appointments.map((a) => ({
      hora: a.startTime.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }),
      paciente: a.patient.fullName,
      tipo: a.type,
      estado: a.status,
    })),
  };
}

async function getWeekSummary(organizationId: string) {
  const today = getColombiaToday();
  const dayOfWeek = today.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() + diffToMonday);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const appointments = await prisma.appointment.findMany({
    where: {
      organizationId,
      date: { gte: startOfWeek, lte: endOfWeek },
      deletedAt: null,
    },
  });

  const sales = await prisma.sale.findMany({
    where: {
      organizationId,
      date: { gte: startOfWeek, lte: endOfWeek },
      deletedAt: null,
    },
  });

  const ingresosSemana = sales.reduce((sum, s) => sum + Number(s.amount), 0);

  return {
    semana: `${startOfWeek.toLocaleDateString("es-CO")} - ${endOfWeek.toLocaleDateString("es-CO")}`,
    totalCitas: appointments.length,
    citasCompletadas: appointments.filter((a) => a.status === "completada").length,
    citasCanceladas: appointments.filter((a) => a.status === "cancelada").length,
    totalVentas: sales.length,
    ingresosSemana: `$${ingresosSemana.toLocaleString("es-CO")}`,
  };
}

// Execute tool calls - now needs userId for saveFeedback
async function executeTool(
  organizationId: string,
  userId: string,
  toolName: string,
  args: Record<string, unknown>
): Promise<string> {
  try {
    let result: unknown;

    switch (toolName) {
      case "search_patients":
        result = await searchPatients(organizationId, args.query as string);
        break;
      case "get_today_appointments":
        result = await getTodayAppointments(organizationId);
        break;
      case "get_patient_appointments":
        result = await getPatientAppointments(organizationId, args.patientId as string);
        break;
      case "get_inventory_status":
        result = await getInventoryStatus(
          organizationId,
          args.query as string | undefined,
          args.lowStockOnly as boolean | undefined
        );
        break;
      case "get_financial_summary":
        result = await getFinancialSummary(organizationId, args.period as "today" | "week" | "month");
        break;
      case "save_knowledge":
        result = await saveKnowledge(
          organizationId,
          args.category as string,
          args.content as string,
          args.source as string | undefined
        );
        break;
      case "save_feedback":
        result = await saveFeedback(
          organizationId,
          userId,
          args.type as string,
          args.description as string,
          args.context as string | undefined
        );
        break;
      case "get_payments_detail":
        result = await getPaymentsDetail(
          organizationId,
          args.date as string | undefined,
          args.paymentMethod as string | undefined
        );
        break;
      case "get_appointments_analysis":
        result = await getAppointmentsAnalysis(
          organizationId,
          args.analysisType as string,
          args.date as string | undefined
        );
        break;
      case "get_daily_summary":
        result = await getDailySummary(
          organizationId,
          args.date as string | undefined
        );
        break;
      case "get_tomorrow_appointments":
        result = await getTomorrowAppointments(organizationId);
        break;
      case "get_week_summary":
        result = await getWeekSummary(organizationId);
        break;
      default:
        result = { error: "Herramienta no reconocida" };
    }

    return JSON.stringify(result, null, 2);
  } catch (error) {
    console.error(`Error executing tool ${toolName}:`, error);
    return JSON.stringify({ error: "Error al ejecutar la herramienta" });
  }
}

// GET /api/chat - Get chat history
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId || !session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const messages = await prisma.chatMessage.findMany({
      where: {
        organizationId: session.user.organizationId,
        userId: session.user.id,
      },
      orderBy: { createdAt: "asc" },
      take: 50, // Last 50 messages
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return NextResponse.json(
      { error: "Error al obtener historial" },
      { status: 500 }
    );
  }
}

// POST /api/chat - Send message to Tabata
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId || !session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { message } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Mensaje requerido" },
        { status: 400 }
      );
    }

    const organizationId = session.user.organizationId;
    const userId = session.user.id;
    const userName = session.user.name || "Usuario";

    // Save user message
    const userMessage = await prisma.chatMessage.create({
      data: {
        organizationId,
        userId,
        role: "user",
        content: message,
      },
    });

    // Get recent chat history for context (only for this user)
    const recentMessages = await prisma.chatMessage.findMany({
      where: {
        organizationId,
        userId,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Get relevant knowledge
    const knowledge = await prisma.tabataKnowledge.findMany({
      where: {
        organizationId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // Build system prompt with user context and knowledge
    const basePrompt = getSystemPrompt(userName);
    const systemPromptWithKnowledge = knowledge.length > 0
      ? `${basePrompt}\n\n## Conocimiento del Consultorio\n${knowledge.map((k) => `- [${k.category}] ${k.content}`).join("\n")}`
      : basePrompt;

    const openaiMessages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemPromptWithKnowledge },
      ...recentMessages
        .reverse()
        .slice(0, -1) // Exclude the message we just saved
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      { role: "user", content: message },
    ];

    // Call OpenAI with tools
    let response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: openaiMessages,
      tools,
      tool_choice: "auto",
      temperature: 0.7,
      max_tokens: 1000,
    });

    let assistantMessage = response.choices[0].message;

    // Handle tool calls
    while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      const toolResults: ChatCompletionMessageParam[] = [];

      for (const toolCall of assistantMessage.tool_calls) {
        // Type guard for function tool calls
        if (toolCall.type !== "function") continue;

        const args = JSON.parse(toolCall.function.arguments);
        const result = await executeTool(organizationId, userId, toolCall.function.name, args);

        toolResults.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: result,
        });
      }

      // Continue conversation with tool results
      openaiMessages.push(assistantMessage as ChatCompletionMessageParam);
      openaiMessages.push(...toolResults);

      response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: openaiMessages,
        tools,
        tool_choice: "auto",
        temperature: 0.7,
        max_tokens: 1000,
      });

      assistantMessage = response.choices[0].message;
    }

    const assistantContent = assistantMessage.content || "Lo siento, no pude procesar tu solicitud.";

    // Save assistant message
    const savedAssistantMessage = await prisma.chatMessage.create({
      data: {
        organizationId,
        userId,
        role: "assistant",
        content: assistantContent,
      },
    });

    return NextResponse.json({
      userMessage,
      assistantMessage: savedAssistantMessage,
    });
  } catch (error) {
    console.error("Error in chat:", error);
    return NextResponse.json(
      { error: "Error al procesar mensaje" },
      { status: 500 }
    );
  }
}
