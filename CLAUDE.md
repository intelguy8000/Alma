# CLAUDE.md - Guía Técnica para Claude Code

## Visión del Proyecto

**Medicina del Alma** es un sistema de gestión para consultorios médicos/terapéuticos. Permite a profesionales de la salud administrar su práctica de forma integral: citas, pacientes, finanzas e inventario.

**URL Producción**: https://medicina-del-alma.vercel.app

**Objetivo**: Simplificar la gestión administrativa para que el profesional se enfoque en sus pacientes.

---

## Arquitectura

### Stack
- **Monolito Next.js 16** con App Router
- **React 19** + TypeScript
- **Tailwind CSS 4** (paleta verde menta/sage)
- **Prisma 6** + PostgreSQL (Neon)
- **NextAuth.js 4** (Credentials provider)
- **Resend** para emails transaccionales
- **OpenAI GPT-4o-mini** para Tabata AI

### Multi-Tenant
**CRÍTICO**: Este sistema es multi-tenant. SIEMPRE filtrar por `organizationId` en todas las queries.

```typescript
// CORRECTO
const patients = await prisma.patient.findMany({
  where: {
    organizationId: session.user.organizationId, // SIEMPRE
    isActive: true,
  },
});

// INCORRECTO - NUNCA hacer esto
const patients = await prisma.patient.findMany({
  where: { isActive: true }, // Falta organizationId!
});
```

---

## Estructura de Carpetas

```
src/
├── app/
│   ├── (auth)/                    # Grupo de rutas públicas
│   │   ├── login/
│   │   └── reset-password/
│   │       └── [token]/
│   │
│   ├── (dashboard)/               # Grupo de rutas protegidas
│   │   ├── calendario/            # FullCalendar
│   │   ├── citas/                 # Tabla + filtros
│   │   ├── compras-gastos/        # CRUD gastos
│   │   ├── configuracion/         # 5 tabs
│   │   ├── dashboard/             # KPIs + gráficos
│   │   ├── integraciones/         # Placeholders
│   │   ├── inventario/            # Stock + movimientos
│   │   ├── pacientes/             # CRUD + historial
│   │   ├── proveedores/           # CRUD + historial
│   │   ├── pyg/                   # P&G reportes
│   │   ├── usuarios/              # Admin only
│   │   └── ventas/                # Registro pagos
│   │
│   └── api/
│       ├── appointments/          # GET, POST + [id]
│       ├── auth/                  # NextAuth + forgot/reset
│       ├── bank-accounts/         # CRUD
│       ├── chat/                  # Tabata AI
│       ├── dashboard/             # Stats agregadas
│       ├── expenses/              # CRUD
│       ├── feedback/              # Tabata feedback
│       ├── inventory/             # CRUD + movements
│       ├── locations/             # CRUD
│       ├── patients/              # CRUD
│       ├── providers/             # CRUD
│       ├── pyg/                   # GET reporte
│       ├── sales/                 # CRUD
│       ├── settings/              # GET, PUT
│       └── users/                 # CRUD + password
│
├── components/
│   ├── calendar/                  # CalendarView, AppointmentModal
│   ├── chat/                      # TabataChat
│   ├── citas/                     # Tabla, filtros, modales
│   ├── configuracion/             # 5 tabs de settings
│   ├── dashboard/                 # Scorecards, charts
│   ├── gastos/                    # Tabla, modal
│   ├── inventario/                # Tabla, modales, drawer
│   ├── layout/                    # Sidebar, Header, InactivityTimeout
│   ├── pacientes/                 # Tabla, modal, drawer
│   ├── proveedores/               # Tabla, modal, drawer
│   ├── pyg/                       # Tablas, charts
│   ├── usuarios/                  # Tabla, modales
│   └── ventas/                    # Tabla, modales
│
├── lib/
│   ├── auth.ts                    # NextAuth config
│   ├── openai.ts                  # OpenAI client
│   ├── prisma.ts                  # Prisma client singleton
│   ├── resend.ts                  # Email client + templates
│   └── utils.ts                   # formatCOP, cn, etc.
│
├── types/
│   ├── expenses.ts
│   ├── inventory.ts
│   ├── providers.ts
│   ├── pyg.ts
│   ├── sales.ts
│   ├── settings.ts
│   ├── users.ts
│   └── next-auth.d.ts             # Extensión de tipos
│
└── hooks/                         # Custom hooks
```

---

## Base de Datos - Schema Completo

### Modelos (16)

#### Core
| Modelo | Descripción | Relaciones Principales |
|--------|-------------|------------------------|
| `Organization` | Tenant/Consultorio | Contiene todos los demás modelos |
| `User` | Usuarios del sistema | organization, salesCreated, inventoryMovements |
| `Patient` | Pacientes | organization, appointments |
| `Appointment` | Citas | patient, sales, rescheduledTo/From |

#### Finanzas
| Modelo | Descripción | Relaciones |
|--------|-------------|------------|
| `Sale` | Ventas/Pagos | appointment, bankAccount, createdBy |
| `Expense` | Gastos | provider, organization |
| `BankAccount` | Cuentas bancarias | sales, organization |
| `Provider` | Proveedores | expenses, organization |

#### Inventario
| Modelo | Descripción | Relaciones |
|--------|-------------|------------|
| `InventoryItem` | Items de stock | movements, organization |
| `InventoryMovement` | Entradas/Salidas | inventoryItem, createdBy |

#### Configuración
| Modelo | Descripción |
|--------|-------------|
| `Setting` | Key-value por organización |
| `Location` | Sedes/Ubicaciones |

#### Tabata AI
| Modelo | Descripción |
|--------|-------------|
| `ChatMessage` | Historial de conversaciones |
| `TabataKnowledge` | Base de conocimiento aprendido |
| `TabataFeedback` | Feedback de usuarios sobre Tabata |

### Enums (5)

```typescript
enum UserRole { admin, secretary, viewer }
enum AppointmentType { presencial, virtual, terapia_choque }
enum AppointmentStatus { confirmada, no_responde, cancelada, reagendada, completada }
enum PaymentMethod { efectivo, transferencia, otro }
enum MovementType { entrada, salida }
```

### Diagrama de Relaciones

```
Organization (1)
    ├── Users (N)
    │       ├── salesCreated (N)
    │       ├── inventoryMovements (N)
    │       ├── chatMessages (N)
    │       └── tabataFeedback (N)
    │
    ├── Patients (N)
    │       └── Appointments (N)
    │               ├── Sales (N)
    │               └── rescheduledTo/From (self 1:1)
    │
    ├── Sales (N)
    │       ├── → Appointment (opcional)
    │       ├── → BankAccount (opcional)
    │       └── → User (createdBy)
    │
    ├── BankAccounts (N)
    │       └── Sales (N)
    │
    ├── Expenses (N)
    │       └── → Provider (opcional)
    │
    ├── Providers (N)
    │       └── Expenses (N)
    │
    ├── InventoryItems (N)
    │       └── InventoryMovements (N)
    │               └── → User (createdBy)
    │
    ├── Settings (N)
    ├── Locations (N)
    ├── ChatMessages (N)
    ├── TabataKnowledge (N)
    └── TabataFeedback (N)
```

### Índices Optimizados (41)

- Índices en `organizationId` en todas las tablas
- Índices compuestos: `[organizationId, date]`, `[organizationId, status]`, `[organizationId, isActive]`
- Índices únicos: `slug`, `email`, `patientCode`, `[organizationId, key]`
- Índices de búsqueda: `[organizationId, fullName]`, `[date, startTime]`

---

## APIs (27 endpoints)

### Autenticación
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| * | `/api/auth/[...nextauth]` | NextAuth handler |
| POST | `/api/auth/forgot-password` | Solicitar reset |
| GET/POST | `/api/auth/reset-password` | Validar/resetear |

### Dashboard
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/dashboard` | Stats agregadas con filtro de fechas |

### Citas
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/appointments` | Listar con filtros |
| POST | `/api/appointments` | Crear cita |
| GET | `/api/appointments/[id]` | Obtener una |
| PUT | `/api/appointments/[id]` | Actualizar/reagendar |
| DELETE | `/api/appointments/[id]` | Eliminar |
| GET | `/api/appointments/available` | Sin venta asociada |

### Pacientes
| Método | Endpoint |
|--------|----------|
| GET/POST | `/api/patients` |
| GET/PUT/DELETE | `/api/patients/[id]` |

### Ventas
| Método | Endpoint |
|--------|----------|
| GET/POST | `/api/sales` |
| GET/PUT/DELETE | `/api/sales/[id]` |

### Gastos
| Método | Endpoint |
|--------|----------|
| GET/POST | `/api/expenses` |
| GET/PUT/DELETE | `/api/expenses/[id]` |

### Proveedores
| Método | Endpoint |
|--------|----------|
| GET/POST | `/api/providers` |
| GET/PUT/DELETE | `/api/providers/[id]` |

### Inventario
| Método | Endpoint |
|--------|----------|
| GET/POST | `/api/inventory` |
| GET/PUT/DELETE | `/api/inventory/[id]` |
| GET/POST | `/api/inventory/[id]/movements` |

### Configuración
| Método | Endpoint |
|--------|----------|
| GET/POST | `/api/bank-accounts` |
| PUT/DELETE | `/api/bank-accounts/[id]` |
| GET/POST | `/api/locations` |
| PUT/DELETE | `/api/locations/[id]` |
| GET/PUT | `/api/settings` |

### Usuarios (admin only)
| Método | Endpoint |
|--------|----------|
| GET/POST | `/api/users` |
| GET/PUT/DELETE | `/api/users/[id]` |
| PUT | `/api/users/[id]/password` |

### Reportes
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/pyg` | P&G con rango de fechas |

### Tabata AI
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/chat` | Enviar mensaje a Tabata |
| GET/POST | `/api/feedback` | Feedback de usuarios |

---

## Componentes Principales (~40)

### Layout
- `Sidebar.tsx` - Menú lateral con contexto expandido/colapsado
- `MobileMenuButton.tsx` - Botón hamburguesa para móvil
- `InactivityTimeout.tsx` - Auto-logout por inactividad

### Por Módulo
Cada módulo típicamente tiene:
- `*Table.tsx` - Tabla con acciones
- `*Modal.tsx` - Modal crear/editar
- `*Drawer.tsx` - Panel lateral para historial (opcional)
- `*Filters.tsx` - Filtros de búsqueda (opcional)

### Dashboard
- `Scorecard.tsx` - Tarjeta de KPI
- `PatientsLineChart.tsx` - Gráfico de línea
- `AppointmentsBarChart.tsx` - Gráfico de barras
- `UpcomingAppointments.tsx` - Lista de próximas citas

### Tabata AI
- `TabataChat.tsx` - Widget de chat flotante

---

## Convenciones de Código

### Nombrado
| Tipo | Convención | Ejemplo |
|------|------------|---------|
| Archivos componentes | PascalCase | `PatientModal.tsx` |
| Archivos utilidades | kebab-case | `format-date.ts` |
| Componentes | PascalCase | `PatientModal` |
| Variables | camelCase | `patientData` |
| Constantes | UPPER_SNAKE | `DEFAULT_PAGE_SIZE` |
| Tipos/Interfaces | PascalCase | `PatientFormData` |

### Formato de Moneda
```typescript
import { formatCOP } from "@/lib/utils";

formatCOP(1660000); // "$1.660.000"
```

### Paleta de Colores
```css
--primary: #6B9080      /* Verde sage */
--primary-light: #84A98C
--primary-lighter: #A4C3B2
--background: #F6FFF8
--border: #CCE3DE
--text-dark: #2D3D35
--text-muted: #5C7A6B
--accent-red: #C65D3B
--accent-green: #2E7D32
```

---

## Manejo de Fechas

### CRÍTICO: Timezone Colombia (America/Bogota, UTC-5)

Este sistema usa **timezone de Colombia** para todas las fechas. El servidor en Vercel corre en UTC, por lo que es CRÍTICO usar los helpers centralizados.

**SIEMPRE usar helpers de `src/lib/dates.ts`**

**NUNCA usar directamente:**
- `new Date()` para obtener "hoy" en el servidor - Usa UTC, no Colombia
- `new Date(dateStr).toISOString()` - Convierte a UTC, puede cambiar el día
- `new Date().toISOString().split("T")[0]` - Mismo problema
- `new Date(dateStr)` para fechas sin hora - Interpreta como UTC

### Helpers de Parsing (datos existentes):

```typescript
import {
  parseLocalDate,      // String → Date local (para mostrar)
  parseDateToInput,    // String → "YYYY-MM-DD" para inputs
  formatDBDate,        // Date → "YYYY-MM-DD" para BD
  parseTimeToDisplay,  // "1970-01-01T09:00:00Z" → "09:00"
  parseDateTime        // Para timestamps con hora (createdAt, etc)
} from "@/lib/dates";
```

### Helpers de Colombia Timezone (fecha/hora actual):

```typescript
import {
  getColombiaToday,           // → Date de hoy en Colombia
  getColombiaTodayStr,        // → "YYYY-MM-DD" de hoy en Colombia
  getColombiaTomorrow,        // → Date de mañana en Colombia
  getColombiaHour,            // → Hora actual (0-23) en Colombia
  getColombiaGreeting,        // → "Buenos días/tardes/noches"
  getColombiaDateTimeFormatted // → "lunes, 26 de noviembre de 2025"
} from "@/lib/dates";
```

### Uso correcto en SERVIDOR (APIs):

```typescript
// ❌ INCORRECTO - new Date() usa UTC en servidor
const today = new Date();
const appointments = await prisma.appointment.findMany({
  where: { date: today }  // Puede ser día anterior en Colombia!
});

// ✅ CORRECTO - usar helper de Colombia
import { getColombiaToday } from "@/lib/dates";
const today = getColombiaToday();
const appointments = await prisma.appointment.findMany({
  where: { date: today }
});
```

### Uso correcto en CLIENTE (componentes):

```typescript
// ❌ INCORRECTO - format con new Date() puede dar día anterior
const dateStr = format(new Date(), "yyyy-MM-dd");

// ✅ CORRECTO - usar helper
import { getColombiaTodayStr } from "@/lib/dates";
const dateStr = getColombiaTodayStr();

// Para saludos basados en hora:
import { getColombiaGreeting } from "@/lib/dates";
const greeting = getColombiaGreeting(); // "Buenos días", etc.
```

### Cuándo usar cada helper:

| Caso de uso | Helper |
|-------------|--------|
| Fecha de hoy (Date) en API | `getColombiaToday()` |
| Fecha de hoy (string) para form | `getColombiaTodayStr()` |
| Fecha de mañana para queries | `getColombiaTomorrow()` |
| Saludo automático (hora) | `getColombiaGreeting()` |
| Mostrar fecha en prompt AI | `getColombiaDateTimeFormatted()` |
| Parsear fecha de DB para mostrar | `parseLocalDate()` + `format()` |
| Input type="date" value | `parseDateToInput()` |
| Enviar fecha a API | `formatDBDate()` |
| Mostrar hora de cita | `parseTimeToDisplay()` |

### Lugares donde se usa Colombia timezone:

- **Dashboard API**: Cálculo de "hoy" y "mañana" para citas
- **Tabata AI**: System prompt con fecha actual, citas del día
- **P&G API**: Cálculo de meses para gráficos
- **WhatsApp**: Saludo automático basado en hora
- **RescheduleModal**: Fecha mínima para reagendar
- **AppointmentModal**: Fecha por defecto al crear cita

---

## Flujos Principales

### 1. Crear y Completar Cita
```
Calendario/Citas → Nueva Cita → Seleccionar paciente
                             → Fecha y hora (inicio + fin)
                             → Tipo y ubicación
                             → Guardar (status: confirmada)

Día de la cita → Marcar completada → Registrar venta (opcional)
                                   → Monto por defecto: $332,000
```

### 2. Reagendar Cita
```
Cita original (status: confirmada)
    ↓ Reagendar
Cita original (status: reagendada, rescheduledToId: nueva)
    ↓
Nueva cita (status: confirmada)
```

### 3. Ajuste de Inventario
```
Inventario → Seleccionar item → Ajustar stock
                              → Tipo: entrada/salida
                              → Cantidad
                              → Razón
                              → Guardar (actualiza currentStock)
```

### 4. Flujo de Venta
```
Ventas → Nueva Venta → Seleccionar cita (opcional)
                     → Monto
                     → Método de pago
                     → Cuenta bancaria (si transferencia)
                     → Factura electrónica (checkbox)
                     → Guardar
```

---

## QA Checklist por Módulo

### Al crear/modificar cualquier módulo, verificar:

- [ ] Filtro por `organizationId` en TODAS las queries
- [ ] Validación de datos con Zod (APIs)
- [ ] Manejo de errores con try/catch
- [ ] Loading states en componentes
- [ ] Empty states cuando no hay datos
- [ ] Responsive en móvil
- [ ] Accesibilidad básica (labels, aria-labels)
- [ ] Mensajes en español
- [ ] Conexión a API real (NO datos mock)
- [ ] **Fechas: usar helpers de `src/lib/dates.ts`** (ver sección Manejo de Fechas)

### Específicos por rol:
- [ ] Admin: acceso completo
- [ ] Secretary: sin acceso a usuarios ni configuración avanzada
- [ ] Viewer: solo lectura

### Checklist de Seguridad:
- [ ] Verificar sesión en todas las APIs
- [ ] No exponer datos sensibles en respuestas
- [ ] Sanitizar inputs del usuario
- [ ] Validar permisos de rol antes de operaciones

---

## Comandos Útiles

```bash
# Desarrollo
npm run dev                    # Iniciar servidor
npm run build                  # Build producción
npm run lint                   # Verificar código

# Base de datos
npx dotenv-cli -e .env.local -- npx prisma db push    # Sync schema
npx dotenv-cli -e .env.local -- npm run seed          # Datos iniciales
npm run db:studio              # GUI de Prisma
npx prisma migrate dev         # Crear migración

# Vercel
vercel env pull .env.local     # Traer env vars
vercel logs                    # Ver logs producción

# Git
git add -A && git commit -m "mensaje"
git push
```

---

## Configuraciones Importantes

### Settings Keys
```typescript
const SETTINGS_KEYS = {
  DEFAULT_APPOINTMENT_VALUE: "appointment_default_price",  // $332,000
  SESSION_TIMEOUT: "session_timeout",                      // minutos o "never"
};
```

### Ubicaciones por Defecto
- Forum 1103 (presencial)
- La Ceja (presencial)
- Virtual (videollamada)

---

## Notas Importantes

1. **Zod 4**: Usa `validation.error.issues[0].message` (no `errors`)
2. **Next.js 16**: Params son Promise, usar `await params`
3. **Prisma 6**: Advertencia de deprecación en `package.json#prisma` (ignorar por ahora)
4. **Recharts**: Warning de dimensiones en build (ignorar, no afecta funcionalidad)
5. **Neon PostgreSQL**: Usar `DATABASE_URL` para pooler, `DATABASE_URL_UNPOOLED` para migrations

---

## Protección de Datos

### Soft Delete

Los modelos críticos utilizan "soft delete" en lugar de eliminación permanente. Esto permite recuperar datos eliminados accidentalmente.

**Modelos con soft delete:**
- `Patient` - Pacientes
- `Appointment` - Citas
- `Sale` - Ventas
- `Expense` - Gastos

**Campos de soft delete:**
```prisma
deletedAt     DateTime?   // Fecha de eliminación (null = no eliminado)
deletedById   String?     // Usuario que eliminó
deletedBy     User?       // Relación al usuario
```

**Al consultar datos, SIEMPRE filtrar soft-deleted:**
```typescript
// ✅ CORRECTO - Excluir eliminados
const patients = await prisma.patient.findMany({
  where: {
    organizationId: session.user.organizationId,
    deletedAt: null, // SIEMPRE incluir esto
  },
});

// ❌ INCORRECTO - Incluiría registros eliminados
const patients = await prisma.patient.findMany({
  where: {
    organizationId: session.user.organizationId,
  },
});
```

**Al eliminar, usar soft delete:**
```typescript
// ✅ CORRECTO - Soft delete
await prisma.patient.update({
  where: { id },
  data: {
    deletedAt: new Date(),
    deletedById: session.user.id,
  },
});

// ❌ INCORRECTO - Eliminación permanente
await prisma.patient.delete({ where: { id } });
```

### Audit Logging

Todas las operaciones críticas se registran en `AuditLog`:

```typescript
import { logAudit, serializeForAudit } from "@/lib/audit";

// Registrar eliminación
await logAudit({
  organizationId: session.user.organizationId,
  userId: session.user.id,
  action: "DELETE",
  entity: "Patient",
  entityId: patient.id,
  oldData: serializeForAudit(patient),
});

// Acciones disponibles: CREATE, UPDATE, DELETE, RESTORE
// Entidades: Patient, Appointment, Sale, Expense
```

**Vista de auditoría:**
- Solo visible para usuarios admin
- Configuración → Auditoría
- Filtros por acción, entidad y rango de fechas

### Neon PITR (Point-in-Time Recovery)

Neon PostgreSQL incluye PITR como respaldo adicional:

- **Retención**: 7 días en plan Free, 30 días en Pro
- **Granularidad**: Hasta el segundo
- **Uso**: Panel de Neon → Branch → Restore

**Proceso de restauración ante desastre:**
1. Verificar si el dato existe en AuditLog (oldData)
2. Si es reciente (< 30 días), usar soft delete restore
3. Si es crítico, usar Neon PITR para restaurar la branch

---

## Changelog Reciente

### Diciembre 2024

#### Timezone Colombia (America/Bogota)
- **Estandarización completa** de timezone en toda la aplicación
- Nuevas funciones centralizadas en `src/lib/dates.ts`:
  - `getColombiaToday()`, `getColombiaTodayStr()`, `getColombiaTomorrow()`
  - `getColombiaHour()`, `getColombiaGreeting()`, `getColombiaDateTimeFormatted()`
- Corregidos: Dashboard API, Tabata AI, P&G API, WhatsApp, modales de citas

#### Módulo de Pacientes
- **Opción de eliminar pacientes** con validación (no permite si tiene citas o ventas)
- Soft delete con registro de auditoría

#### Cuentas Bancarias
- Nuevos campos: `accountHolder`, `accountHolderId`, `accountType`
- **Botón "Datos de Pago"** en tabla de citas para copiar mensaje con información bancaria

#### Mensaje WhatsApp
- Formato mejorado con saludo automático según hora Colombia
- Incluye nombre del paciente, día, fecha y hora formateados

#### Tabata AI
- Formato de respuestas mejorado (sin tablas markdown)
- Timezone corregido para fecha y citas del día

---

*Última actualización: Diciembre 2024*
