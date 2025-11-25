import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";
import { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "sk-placeholder",
});

// System prompt for Tabata - will be personalized with user name
const getSystemPrompt = (userName: string) => `Eres Tabata, la asistente virtual de Medicina del Alma, un consultorio de terapias bioenergéticas en Medellín, Colombia.

## Contexto Actual
- Fecha: ${new Date().toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
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

## Restricciones
- Solo puedes consultar información, NO puedes crear, modificar o eliminar datos
- Si el usuario pide hacer cambios, indícale que debe hacerlo desde el sistema
- No compartas información sensible como contraseñas
- Si no puedes ayudar con algo, sugiere alternativas amablemente

## Formato de Respuestas
- Usa formato claro y estructurado
- Para datos tabulares usa tablas markdown
- Para listas usa viñetas
- Incluye datos relevantes sin abrumar
- Si hay muchos resultados, muestra un resumen

## Guía de la Plataforma
Puedes ayudar a los usuarios con dudas sobre cómo usar la plataforma:

| Módulo | Descripción | Cómo usarlo |
|--------|-------------|-------------|
| Dashboard | Resumen general | Ver KPIs de pacientes, ventas, gastos y citas |
| Calendario | Agenda visual | Click en slot vacío para crear cita, arrastra para mover |
| Citas | Lista de citas | Filtrar por estado, ver detalles, cambiar estado |
| Pacientes | Gestión pacientes | Crear nuevo con +, ver historial con ícono de ojo |
| Ventas | Pagos recibidos | Registrar pago asociado a cita completada |
| Compras & Gastos | Egresos | Registrar gastos, asociar a proveedor |
| Proveedores | Gestión proveedores | Crear/editar proveedores, ver historial de compras |
| Inventario | Control de stock | Botón + para entrada, - para salida de items |
| P&G | Estados financieros | Ver ingresos vs gastos por período |
| Configuración | Ajustes | Valor de cita, cuentas bancarias, ubicaciones |
| Usuarios | Admin de usuarios | Solo admin: crear/editar usuarios del sistema |

Si preguntan cómo hacer algo específico, guíalos paso a paso de forma clara.
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const appointments = await prisma.appointment.findMany({
    where: {
      organizationId,
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
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case "today":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
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

// Execute tool calls
async function executeTool(
  organizationId: string,
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
        const result = await executeTool(organizationId, toolCall.function.name, args);

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
