# CLAUDE.md - Guía Técnica para Claude Code

## Visión del Proyecto

**Medicina del Alma** es un sistema de gestión para consultorios médicos/terapéuticos. Permite a profesionales de la salud administrar su práctica de forma integral: citas, pacientes, finanzas e inventario.

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
│   │   ├── configuracion/         # 4 tabs
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
│       ├── expenses/              # CRUD
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
│   ├── citas/                     # Tabla, filtros, modales
│   ├── configuracion/             # 4 tabs de settings
│   ├── dashboard/                 # Scorecards, charts
│   ├── gastos/                    # Tabla, modal
│   ├── inventario/                # Tabla, modales, drawer
│   ├── layout/                    # Sidebar, Header
│   ├── pacientes/                 # Tabla, modal, drawer
│   ├── proveedores/               # Tabla, modal, drawer
│   ├── pyg/                       # Tablas, charts
│   ├── usuarios/                  # Tabla, modales
│   └── ventas/                    # Tabla, modales
│
├── lib/
│   ├── auth.ts                    # NextAuth config
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

## Modelos de Base de Datos (13)

### Core
| Modelo | Descripción | Relaciones Principales |
|--------|-------------|------------------------|
| `Organization` | Tenant/Consultorio | Contiene todos los demás |
| `User` | Usuarios del sistema | organization, salesCreated |
| `Patient` | Pacientes | organization, appointments |
| `Appointment` | Citas | patient, sales, rescheduledTo |

### Finanzas
| Modelo | Descripción | Relaciones |
|--------|-------------|------------|
| `Sale` | Ventas/Pagos | appointment, bankAccount, createdBy |
| `Expense` | Gastos | provider |
| `BankAccount` | Cuentas bancarias | sales |
| `Provider` | Proveedores | expenses |

### Inventario
| Modelo | Descripción | Relaciones |
|--------|-------------|------------|
| `InventoryItem` | Items de stock | movements |
| `InventoryMovement` | Entradas/Salidas | inventoryItem, createdBy |

### Configuración
| Modelo | Descripción |
|--------|-------------|
| `Setting` | Key-value por org |
| `Location` | Sedes/Ubicaciones |

### Enums Disponibles
```typescript
enum UserRole { admin, secretary, viewer }
enum AppointmentType { presencial, virtual, terapia_choque }
enum AppointmentStatus { confirmada, no_responde, cancelada, reagendada, completada }
enum PaymentMethod { efectivo, transferencia, otro }
enum MovementType { entrada, salida }
```

---

## APIs (24 endpoints)

### Autenticación
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| * | `/api/auth/[...nextauth]` | NextAuth handler |
| POST | `/api/auth/forgot-password` | Solicitar reset |
| GET/POST | `/api/auth/reset-password` | Validar/resetear |

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
| Método | Endpoint |
|--------|----------|
| GET | `/api/pyg` | P&G con rango de fechas |

---

## Componentes Principales (37)

### Layout
- `Sidebar.tsx` - Menú lateral con contexto expandido/colapsado
- `Header.tsx` - Barra superior con usuario

### Por Módulo
Cada módulo típicamente tiene:
- `*Table.tsx` - Tabla con acciones
- `*Modal.tsx` - Modal crear/editar
- `*Drawer.tsx` - Panel lateral para historial (opcional)

---

## Convenciones de Código

### Nombrado
| Tipo | Convención | Ejemplo |
|------|------------|---------|
| Archivos | kebab-case | `patient-modal.tsx` |
| Componentes | PascalCase | `PatientModal` |
| Variables | camelCase | `patientData` |
| Constantes | UPPER_SNAKE | `DEFAULT_PAGE_SIZE` |

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

## Flujos Principales

### 1. Crear y Completar Cita
```
Calendario/Citas → Nueva Cita → Seleccionar paciente
                             → Fecha y hora
                             → Guardar (status: confirmada)

Día de la cita → Marcar completada → Registrar venta (opcional)
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

---

## QA Checklist por Módulo

### Al crear/modificar cualquier módulo, verificar:

- [ ] Filtro por `organizationId` en todas las queries
- [ ] Validación de datos con Zod (APIs)
- [ ] Manejo de errores con try/catch
- [ ] Loading states en componentes
- [ ] Empty states cuando no hay datos
- [ ] Responsive en móvil
- [ ] Accesibilidad básica (labels, roles)
- [ ] Mensajes en español

### Específicos por rol:
- [ ] Admin: acceso completo
- [ ] Secretary: sin acceso a usuarios ni configuración avanzada
- [ ] Viewer: solo lectura

---

## Comandos Útiles

```bash
# Desarrollo
npm run dev                    # Iniciar servidor
npm run build                  # Build producción
npm run lint                   # Verificar código

# Base de datos
npm run db:push                # Sync schema
npm run db:studio              # GUI de Prisma
npm run seed                   # Datos iniciales
npx prisma migrate dev         # Crear migración

# Vercel
vercel env pull .env.local     # Traer env vars
vercel logs                    # Ver logs producción

# Git
git add -A && git commit -m "mensaje"
git push
```

---

## Notas Importantes

1. **Zod 4**: Usa `validation.error.issues[0].message` (no `errors`)
2. **Next.js 16**: Params son Promise, usar `await params`
3. **Prisma 6**: Advertencia de deprecación en `package.json#prisma`
4. **Recharts**: Warning de dimensiones en build (ignorar, no afecta)

---

*Última actualización: Noviembre 2024*
