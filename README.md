# Medicina del Alma - Sistema de Gestión

Sistema multi-tenant para la gestión de consultorios médicos/terapéuticos. Permite administrar citas, pacientes, ventas, inventario, gastos y más.

## URL de Producción

**https://medicina-del-alma.vercel.app**

## Stack Tecnológico

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19 + TypeScript
- **Estilos**: Tailwind CSS 4
- **Base de Datos**: PostgreSQL (Neon) - 16 modelos, 5 enums, 41 índices
- **ORM**: Prisma 6
- **Autenticación**: NextAuth.js 4
- **Email**: Resend
- **Calendario**: FullCalendar
- **Gráficos**: Recharts
- **AI Assistant**: Tabata (OpenAI GPT-4o-mini)
- **Deploy**: Vercel

## Módulos Funcionales (12)

| Módulo | Descripción | Estado |
|--------|-------------|--------|
| Dashboard | KPIs, gráficos, citas próximas | ✅ |
| Calendario | Vista semanal/mensual, drag & drop | ✅ |
| Citas | CRUD completo, reagendamiento, completar | ✅ |
| Pacientes | CRUD, historial de citas y pagos | ✅ |
| Ventas | Registro de pagos, facturas electrónicas | ✅ |
| Compras & Gastos | CRUD por categoría y proveedor | ✅ |
| Proveedores | CRUD con historial de compras | ✅ |
| Inventario | Stock, alertas, movimientos | ✅ |
| P&G | Estado de resultados, gráficos | ✅ |
| Usuarios | CRUD (admin only), roles | ✅ |
| Configuración | General, cuentas, ubicaciones, notificaciones | ✅ |
| Tabata AI | Asistente inteligente con memoria | ✅ |

## Requisitos

- Node.js 18+
- npm o yarn
- Cuenta en Neon (PostgreSQL)
- Cuenta en Resend (para emails)
- API Key de OpenAI (para Tabata)

## Instalación Local

```bash
# Clonar repositorio
git clone https://github.com/intelguy8000/Alma.git
cd Alma

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# Generar cliente Prisma
npx prisma generate

# Sincronizar base de datos
npx dotenv-cli -e .env.local -- npx prisma db push

# Sembrar datos iniciales
npx dotenv-cli -e .env.local -- npm run seed

# Iniciar servidor de desarrollo
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## Credenciales de Prueba

```
Email: intelguy093@gmail.com
Password: [contactar al administrador]
```

## Variables de Entorno

```env
# Base de datos (Neon PostgreSQL)
DATABASE_URL="postgresql://user:pass@host-pooler/db?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://user:pass@host/db?sslmode=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu-secret-seguro-aqui"

# Resend (Email)
RESEND_API_KEY="re_xxxxxxxxxxxx"
RESEND_FROM_EMAIL="Medicina del Alma <noreply@tudominio.com>"

# OpenAI (para Tabata)
OPENAI_API_KEY="sk-xxxxxxxxxxxx"
```

## Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Iniciar build de producción |
| `npm run seed` | Sembrar datos iniciales |
| `npm run db:push` | Sincronizar schema con BD |
| `npm run db:studio` | Abrir Prisma Studio |
| `npm run db:generate` | Regenerar cliente Prisma |
| `npm run lint` | Ejecutar ESLint |

## Estructura del Proyecto

```
src/
├── app/
│   ├── (auth)/           # Login, reset-password
│   ├── (dashboard)/      # Páginas protegidas (12 módulos)
│   └── api/              # 27 API Routes
├── components/           # Componentes React (~40)
├── lib/                  # Utilidades (prisma, auth, resend, openai)
├── types/                # TypeScript types
└── hooks/                # Custom hooks
```

## Base de Datos

### Modelos (16)
- **Core**: Organization, User, Patient, Appointment
- **Finanzas**: Sale, Expense, BankAccount, Provider
- **Inventario**: InventoryItem, InventoryMovement
- **Configuración**: Setting, Location
- **Tabata AI**: ChatMessage, TabataKnowledge, TabataFeedback

### Enums (5)
- UserRole: admin, secretary, viewer
- AppointmentType: presencial, virtual, terapia_choque
- AppointmentStatus: confirmada, no_responde, cancelada, reagendada, completada
- PaymentMethod: efectivo, transferencia, otro
- MovementType: entrada, salida

## Deploy en Vercel

1. Conectar repositorio en Vercel
2. Configurar variables de entorno
3. Deploy automático en cada push a main

## Documentación Adicional

- [CLAUDE.md](./CLAUDE.md) - Guía técnica completa para desarrollo
- [TABATA.md](./TABATA.md) - Documentación del asistente AI

## Licencia

Proyecto privado. Todos los derechos reservados.

---

*Última actualización: Noviembre 2024*
