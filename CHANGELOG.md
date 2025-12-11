# Changelog

Todos los cambios notables del proyecto Medicina del Alma se documentan en este archivo.

---

## [2025-12-11] - Feedback de Usuario + Playwright MCP

### Agregado
- **Terapia Capilar** como nuevo tipo de cita
  - Icono: Sparkles (lucide-react)
  - Color: Púrpura (#8B5CF6)
  - Disponible en: calendario, filtros de citas, modal de nueva cita
- **Playwright MCP** configurado para verificación visual automatizada
  - Documentación en `docs/PLAYWRIGHT-MCP.md`
  - Dependencia: `@playwright/test` agregada
- **Screenshots de verificación** en `/screenshots/`

### Cambiado
- **Agenda/Calendario**: Ahora muestra sábado (antes solo Lun-Vie)
  - `weekends: true`
  - `hiddenDays: [0]` (solo oculta domingo)
- **Validación de pagos**: Ahora acepta $0 para cortesías y casos sociales
  - Frontend: `amount < 0` (antes `amount <= 0`)
  - Backend: `amount >= 0` permitido
- **Next.js**: Actualizado de 16.0.4 a 16.0.8 (fix vulnerabilidad de seguridad)

### Archivos Modificados
```
prisma/schema.prisma                                    # Enum AppointmentType + terapia_capilar
src/app/api/dashboard/appointments-distribution/route.ts
src/app/api/sales/route.ts                              # Validación amount >= 0
src/components/calendar/AppointmentModal.tsx            # Tipo + appointmentTypes array
src/components/calendar/CalendarView.tsx                # weekends, hiddenDays, typeColors
src/components/citas/AppointmentFilters.tsx             # typeOptions
src/components/citas/AppointmentsTable.tsx              # typeConfig + Sparkles icon
src/components/dashboard/UpcomingAppointments.tsx       # typeConfig
src/components/ventas/SaleModal.tsx                     # Validación amount < 0
package.json                                            # Next.js 16.0.8, @playwright/test
```

### Verificado
- [x] Sábado visible en calendario (evidencia: `screenshots/1-calendario-sabado.png`)
- [x] Terapia Capilar en filtros (evidencia: `screenshots/6-filtro-tipos.png`)
- [x] Pago $0 aceptado sin error (evidencia: `screenshots/3-pago-cero.png`)

---

## [2024-12-04] - Dashboard v2

### Agregado
- Scorecards de retención: Pacientes Activos, Nuevos, Recurrentes, En Riesgo
- Gráfico "Pacientes por Semana" con navegación
- Gráfico "Distribución de Citas" con toggle Donut/Trend
- APIs: `/api/dashboard/weekly-patients`, `/api/dashboard/appointments-distribution`

### Cambiado
- Rediseño completo del Dashboard
- "Citas de Mañana" con banner de estado
- Timezone Colombia estandarizado en toda la app

---

## [2024-12-01] - Soft Delete + Auditoría

### Agregado
- Soft delete para Patient, Appointment, Sale, Expense
- Sistema de auditoría (AuditLog)
- Vista de auditoría para admin

### Cambiado
- Eliminación ahora usa `deletedAt` en lugar de DELETE

---

## [2024-11-26] - Cuentas Bancarias Mejoradas

### Agregado
- Campos: accountHolder, accountHolderId, accountType
- Botón "Datos de Pago" para copiar info bancaria

---

## [2024-11-25] - Lanzamiento Inicial

### Agregado
- Sistema multi-tenant completo
- Módulos: Calendario, Citas, Pacientes, Ventas, Gastos, Inventario, Proveedores, P&G
- Tabata AI (asistente)
- Autenticación con NextAuth.js
- Dashboard con KPIs

---

*Formato basado en [Keep a Changelog](https://keepachangelog.com/)*
