# Medicina del Alma - Sistema de Gestión

Sistema multi-tenant para la gestión de consultorios médicos. Permite administrar citas, pacientes, ventas, inventario, gastos y más.

## Stack Tecnológico

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19 + TypeScript
- **Estilos**: Tailwind CSS 4
- **Base de Datos**: PostgreSQL (Neon)
- **ORM**: Prisma 6
- **Autenticación**: NextAuth.js 4
- **Email**: Resend
- **Calendario**: FullCalendar
- **Gráficos**: Recharts
- **Deploy**: Vercel

## Requisitos

- Node.js 18+
- npm o yarn
- Cuenta en Neon (PostgreSQL)
- Cuenta en Resend (para emails)

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
npx prisma db push

# Sembrar datos iniciales
npm run seed

# Iniciar servidor de desarrollo
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## Variables de Entorno

```env
# Base de datos (Neon PostgreSQL)
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://user:pass@host/db?sslmode=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu-secret-seguro-aqui"

# Resend (Email)
RESEND_API_KEY="re_xxxxxxxxxxxx"
RESEND_FROM_EMAIL="Tu App <noreply@tudominio.com>"  # Opcional
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
│   ├── (dashboard)/      # Páginas protegidas
│   │   ├── dashboard/
│   │   ├── calendario/
│   │   ├── citas/
│   │   ├── pacientes/
│   │   ├── ventas/
│   │   ├── compras-gastos/
│   │   ├── proveedores/
│   │   ├── inventario/
│   │   ├── pyg/
│   │   ├── usuarios/
│   │   ├── configuracion/
│   │   └── integraciones/
│   └── api/              # API Routes
├── components/           # Componentes React
├── lib/                  # Utilidades (prisma, auth, resend)
├── types/                # TypeScript types
└── hooks/                # Custom hooks
```

## Deploy en Vercel

1. Conectar repositorio en Vercel
2. Configurar variables de entorno
3. Deploy automático en cada push a main

**URL de producción**: https://alma-six-kappa.vercel.app

## Módulos Implementados

- [x] Dashboard con KPIs
- [x] Calendario interactivo
- [x] Gestión de citas
- [x] Gestión de pacientes
- [x] Registro de ventas
- [x] Control de gastos
- [x] Gestión de proveedores
- [x] Control de inventario
- [x] Reportes P&G
- [x] Gestión de usuarios (admin)
- [x] Configuración
- [x] Recuperación de contraseña

## Licencia

Proyecto privado. Todos los derechos reservados.
