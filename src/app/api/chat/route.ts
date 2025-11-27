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
- Fecha: ${new Date().toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "America/Bogota" })}
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
  const colombiaDate = new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });
  const [year, month, day] = colombiaDate.split("-").map(Number);
  const today = new Date(year, month - 1, day);

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
  // Get current date in Colombia timezone (UTC-5)
  const colombiaDate = new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });
  const [year, month, day] = colombiaDate.split("-").map(Number);
  const now = new Date(year, month - 1, day);
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
      startDate = new Date(year, month - 1, 1);
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
