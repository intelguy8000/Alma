# TABATA.md - Documentación del Asistente AI

## Descripción General

**Tabata** es el asistente virtual inteligente de Medicina del Alma. Ayuda a los usuarios a gestionar el consultorio mediante consultas en lenguaje natural, sin necesidad de navegar por la interfaz.

### Características
- Consulta de pacientes, citas, inventario y finanzas
- Memoria persistente por usuario y organización
- Sistema de feedback para mejora continua
- Respuestas en español colombiano con formato markdown
- Widget de chat flotante con diseño responsivo

---

## Arquitectura

### Stack
- **Modelo**: OpenAI GPT-4o-mini
- **API**: `/api/chat` (POST para mensajes, GET para historial)
- **Persistencia**: PostgreSQL via Prisma
- **Frontend**: React component con ReactMarkdown

### Componentes del Sistema
```
src/
├── app/api/
│   ├── chat/
│   │   ├── route.ts       # API principal (POST/GET)
│   │   └── clear/route.ts # Limpiar historial
│   └── feedback/
│       └── route.ts       # API de feedback
│
└── components/chat/
    └── TabataChat.tsx     # Widget flotante
```

### Modelos de Base de Datos

```prisma
model ChatMessage {
  id             String   @id @default(cuid())
  organizationId String
  userId         String
  role           String   // "user" | "assistant"
  content        String   @db.Text
  createdAt      DateTime @default(now())

  organization Organization @relation(...)
  user         User         @relation(...)

  @@index([organizationId, createdAt])
  @@index([userId])
}

model TabataKnowledge {
  id             String    @id @default(cuid())
  organizationId String
  category       String    // "paciente" | "proceso" | "preferencia" | "regla"
  content        String    @db.Text
  source         String?   // Cómo lo aprendió
  createdAt      DateTime  @default(now())
  expiresAt      DateTime?

  organization Organization @relation(...)

  @@index([organizationId, category])
}

model TabataFeedback {
  id             String   @id @default(cuid())
  organizationId String
  userId         String
  type           String   // "bug" | "mejora" | "deseo" | "confusion"
  description    String   @db.Text
  context        String?  @db.Text
  status         String   @default("pendiente")
  createdAt      DateTime @default(now())

  organization Organization @relation(...)
  user         User         @relation(...)

  @@index([organizationId, status])
  @@index([organizationId, type])
  @@index([userId])
}
```

---

## System Prompt

El system prompt de Tabata se personaliza con el nombre del usuario y la fecha actual:

```typescript
const getSystemPrompt = (userName: string) => `
Eres Tabata, la asistente virtual de Medicina del Alma,
un consultorio de terapias bioenergéticas en Medellín, Colombia.

## Contexto Actual
- Fecha: ${new Date().toLocaleDateString("es-CO", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  })}
- Estás hablando con: **${userName}**

## Tu Personalidad
- Amable, profesional y eficiente
- Hablas en español colombiano de manera natural
- Usas un tono cálido pero profesional
- Eres concisa en tus respuestas

## Tus Capacidades
1. Consultar información de pacientes
2. Ver citas del día
3. Buscar citas de un paciente
4. Consultar inventario
5. Ver resumen financiero
6. Ayuda con la plataforma

## Restricciones
- Solo puedes consultar información, NO modificar
- No compartas información sensible
- Si no puedes ayudar, sugiere alternativas

## Formato de Respuestas
- Usa formato markdown
- Tablas para datos tabulares
- Listas con viñetas
- Incluye datos relevantes sin abrumar

## Guía de la Plataforma
| Módulo | Descripción | Cómo usarlo |
|--------|-------------|-------------|
| Dashboard | Resumen general | Ver KPIs |
| Calendario | Agenda visual | Click para crear cita |
| Citas | Lista de citas | Filtrar, cambiar estado |
| Pacientes | Gestión pacientes | Ver historial |
| Ventas | Pagos recibidos | Registrar pago |
| Compras & Gastos | Egresos | Registrar gastos |
| Inventario | Control de stock | + entrada, - salida |
| P&G | Estados financieros | Ver por período |
| Configuración | Ajustes | Valor cita, cuentas |

## Detección de Feedback
Detecta y guarda feedback del usuario:
- "no funciona", "da error" → tipo: bug
- "no encuentro", "no entiendo" → tipo: confusion
- "sería bueno que" → tipo: mejora
- "ojalá pudiera" → tipo: deseo
`;
```

---

## Funciones Disponibles (7 Tools)

Tabata tiene 7 funciones disponibles mediante OpenAI Function Calling:

### 1. `search_patients`
Buscar pacientes por nombre o código.

```typescript
// Parámetros
{ query: string }  // Nombre o código del paciente

// Retorna
{
  id: string,
  codigo: string,
  nombre: string,
  telefono: string,
  email: string,
  whatsapp: string,
  primeraCita: string,
  totalCitas: number
}[]
```

### 2. `get_today_appointments`
Obtener las citas del día.

```typescript
// Parámetros
{}  // Sin parámetros

// Retorna
{
  id: string,
  paciente: string,
  telefono: string,
  hora: string,
  horaFin: string,
  tipo: "presencial" | "virtual" | "terapia_choque",
  estado: string,
  ubicacion: string,
  notas: string
}[]
```

### 3. `get_patient_appointments`
Historial de citas de un paciente.

```typescript
// Parámetros
{ patientId: string }

// Retorna
{
  fecha: string,
  hora: string,
  tipo: string,
  estado: string,
  pago: string
}[]
```

### 4. `get_inventory_status`
Consultar estado del inventario.

```typescript
// Parámetros
{
  query?: string,        // Nombre o categoría (opcional)
  lowStockOnly?: boolean // Solo items con stock bajo
}

// Retorna
{
  nombre: string,
  stockActual: number,
  stockMinimo: number,
  unidad: string,
  categoria: string,
  estadoStock: "BAJO" | "OK"
}[]
```

### 5. `get_financial_summary`
Resumen financiero por período.

```typescript
// Parámetros
{ period: "today" | "week" | "month" }

// Retorna
{
  periodo: string,
  ingresos: { total: string, cantidad: number },
  gastos: { total: string, cantidad: number },
  balance: string
}
```

### 6. `save_knowledge`
Guardar información del consultorio.

```typescript
// Parámetros
{
  category: "paciente" | "proceso" | "preferencia" | "regla",
  content: string,
  source?: string
}

// Retorna
{ saved: true, message: string }
```

### 7. `save_feedback`
Guardar feedback del usuario.

```typescript
// Parámetros
{
  type: "bug" | "mejora" | "deseo" | "confusion",
  description: string,
  context?: string
}

// Retorna
{ saved: true, message: string }
```

---

## Flujo de Conversación

```
Usuario envía mensaje
       ↓
POST /api/chat
       ↓
┌─────────────────────────────────────┐
│ 1. Guardar mensaje del usuario      │
│ 2. Cargar historial reciente (10)   │
│ 3. Cargar conocimiento relevante    │
│ 4. Construir mensajes para OpenAI   │
│ 5. Llamar a GPT-4o-mini con tools   │
│ 6. Si hay tool_calls:               │
│    → Ejecutar funciones             │
│    → Continuar conversación         │
│ 7. Guardar respuesta de Tabata      │
│ 8. Retornar ambos mensajes          │
└─────────────────────────────────────┘
       ↓
Mostrar respuesta en UI
```

---

## API Endpoints

### POST `/api/chat`
Enviar mensaje a Tabata.

**Request:**
```json
{ "message": "¿Qué citas tenemos hoy?" }
```

**Response:**
```json
{
  "userMessage": {
    "id": "cm...",
    "role": "user",
    "content": "¿Qué citas tenemos hoy?",
    "createdAt": "2024-11-25T..."
  },
  "assistantMessage": {
    "id": "cm...",
    "role": "assistant",
    "content": "Hoy tienes 3 citas...",
    "createdAt": "2024-11-25T..."
  }
}
```

### GET `/api/chat`
Obtener historial de conversación (últimos 50 mensajes).

### POST `/api/chat/clear`
Borrar historial del usuario actual.

### GET/POST `/api/feedback`
Ver y registrar feedback de usuarios.

---

## Componente Frontend

### `TabataChat.tsx`

Widget de chat flotante con las siguientes características:

| Característica | Descripción |
|----------------|-------------|
| Botón flotante | Esquina inferior derecha, z-index 50 |
| Tamaño normal | 380px × 500px |
| Tamaño expandido | 70vw × 80vh |
| Historial | Carga automática al abrir |
| Markdown | ReactMarkdown para respuestas |
| Loading | Indicador de puntos animados |
| Borrar | Confirmación antes de eliminar |

### Estados del Componente
```typescript
const [isOpen, setIsOpen] = useState(false);
const [isExpanded, setIsExpanded] = useState(false);
const [messages, setMessages] = useState<Message[]>([]);
const [input, setInput] = useState("");
const [isLoading, setIsLoading] = useState(false);
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
```

---

## Ejemplos de Uso

### Buscar un paciente
```
Usuario: ¿Tienes información de María García?

Tabata: Encontré a María García López en el sistema:

| Campo | Valor |
|-------|-------|
| Código | MDA-0001 |
| Teléfono | +57 300 123 4567 |
| WhatsApp | +57 300 123 4567 |
| Primera cita | 25/10/2024 |
| Total citas | 8 |

¿Necesitas ver su historial de citas?
```

### Ver citas del día
```
Usuario: ¿Qué hay para hoy?

Tabata: Hoy tienes 2 citas programadas:

| Hora | Paciente | Tipo | Estado |
|------|----------|------|--------|
| 09:00 | Pedro López | Presencial | Confirmada |
| 15:00 | Ana Martínez | Virtual | Confirmada |

La primera cita es en Forum 1103.
```

### Consultar inventario
```
Usuario: ¿Cómo está el inventario?

Tabata: Estado actual del inventario:

| Item | Stock | Mín | Estado |
|------|-------|-----|--------|
| Aceite esencial | 5 | 10 | BAJO |
| Incienso | 20 | 5 | OK |
| Velas aromáticas | 3 | 5 | BAJO |

Tienes 2 items con stock bajo.
```

### Resumen financiero
```
Usuario: ¿Cómo vamos este mes?

Tabata: Resumen financiero de este mes:

**Ingresos**: $1.660.000 (5 ventas)
**Gastos**: $450.000 (8 registros)
**Balance**: $1.210.000

¡Vas muy bien! El balance es positivo.
```

---

## Sistema de Feedback

### Tipos de Feedback
| Tipo | Descripción | Triggers |
|------|-------------|----------|
| `bug` | Algo no funciona | "no me deja", "da error" |
| `confusion` | No entiende algo | "no encuentro", "dónde está" |
| `mejora` | Sugerencia | "sería bueno que" |
| `deseo` | Feature nuevo | "ojalá pudiera" |

### Proceso de Captura
1. Tabata detecta frases clave
2. Intenta ayudar primero
3. Pregunta: "¿Quieres que anote esto para que el equipo lo revise?"
4. Si acepta, usa `save_feedback`
5. Confirma: "Listo, lo anoté. El equipo lo revisará pronto."

### Ver Feedback (Admin)
Configuración > Feedback (solo visible para administradores)

---

## Configuración

### Variables de Entorno
```env
OPENAI_API_KEY="sk-..."
```

### Parámetros del Modelo
```typescript
{
  model: "gpt-4o-mini",
  temperature: 0.7,
  max_tokens: 1000,
  tool_choice: "auto"
}
```

---

## Seguridad

- Solo accede a datos de la organización del usuario autenticado
- Filtro por `organizationId` en todas las queries
- Historial vinculado a `userId`
- Solo operaciones de LECTURA (no puede modificar datos)
- No expone información sensible

---

## Limitaciones Actuales

1. **Solo consulta**: No puede crear, modificar o eliminar datos
2. **Sin streaming**: Respuestas completas, no token por token
3. **Contexto limitado**: Últimos 10 mensajes
4. **Solo texto**: No soporta imágenes ni archivos
5. **Sin integraciones externas**: No envía WhatsApp ni emails

---

## Roadmap Futuro

### Fase 2: Acciones
- [ ] Crear citas desde el chat
- [ ] Modificar estado de citas
- [ ] Confirmaciones antes de acciones

### Fase 3: Integraciones
- [ ] WhatsApp Business API
- [ ] Recordatorios automáticos
- [ ] Notificaciones push

### Fase 4: Inteligencia
- [ ] Streaming de respuestas
- [ ] Análisis de patrones
- [ ] Sugerencias proactivas
- [ ] Modo voz

---

*Última actualización: Noviembre 2024*
