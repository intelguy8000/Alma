# Dashboard - Medicina del Alma

## Resumen

Dashboard enfocado en **retención y frecuencia de pacientes**. Muestra métricas clave para entender la salud del consultorio y tomar acción sobre pacientes en riesgo.

---

## Scorecards

| Card | Descripción | Lógica | Clickeable |
|------|-------------|--------|------------|
| **Pacientes Activos** | Pacientes con actividad reciente | Pacientes con ≥1 cita (no cancelada) en últimos 90 días | No |
| **Nuevos Este Mes** | Crecimiento de pacientes | Pacientes cuya primera cita ever fue en el mes actual | No |
| **Recurrentes** | Retención/fidelización | Pacientes con 2+ citas (no canceladas) en el mes actual | No |
| **En Riesgo** | Alerta accionable | Pacientes sin cita en X+ días (default 30) | Sí → abre modal |

### Modal "En Riesgo"

Al hacer clic en el card "En Riesgo" se abre un modal con:

- **Filtro de días**: 15, 30, 45, 60, 90 días
- **Lista de pacientes** ordenada por días sin visita (más días primero)
- **Botón WhatsApp**: Envía mensaje predefinido de seguimiento
- **Botón Agendar**: Link directo a `/citas?patientId=X`

---

## Gráficos

### 1. Pacientes por Semana

Gráfico de líneas que muestra la actividad semanal.

**Controles:**
- Flechas ← → para navegar entre semanas
- Rango de fechas mostrado (ej: "2 dic - 6 dic")

**Líneas:**
| Color | Nombre | Lógica |
|-------|--------|--------|
| 🟢 Verde sólida | Pacientes Atendidos | COUNT de Sales por día |
| 🟡 Amarilla punteada | Semana Anterior | Comparación con semana previa |
| 🔴 Roja sólida | Cancelaciones | Citas con status "cancelada" |

**Características:**
- Solo muestra Lun-Vie (sin fines de semana)
- Tooltip con fecha completa y valores
- API: `GET /api/dashboard/weekly-patients?weekOffset=0`

---

### 2. Distribución de Citas

Gráfico donut o línea de tendencia con toggle.

**Vista Toggle:**
- 🥧 Donut: Acumulado histórico (todas las citas)
- 📈 Trend: Últimas 8 semanas

**Tabs:**
| Tab | Segmentos |
|-----|-----------|
| Por Modalidad | Presencial (verde) vs Virtual (azul) |
| Por Tipo | Normal (verde) vs T. Choque (rojo) |

**Nota:** En "Por Modalidad", las terapias de choque se cuentan como presenciales.

**API:** `GET /api/dashboard/appointments-distribution`

---

## Citas de Mañana

Sección prominente que muestra el estado de las citas para el día siguiente.

### Banner de Estado

| Estado | Color | Mensaje |
|--------|-------|---------|
| Pendientes | 🟡 Amarillo | "X citas pendientes por confirmar" |
| Confirmadas | 🟢 Verde | "Todas las X citas están confirmadas" |
| Canceladas | 🔴 Rojo | "X citas canceladas" |
| Sin citas | ⚪ Gris | "No hay citas agendadas para mañana" |

### Lista de Citas

- **Solo muestra** citas que requieren acción (status != "confirmada")
- **Ordenadas** por hora ascendente
- **Link "Ver todas"** lleva a `/citas?date=YYYY-MM-DD`

### Timezone

Usa `getColombiaTomorrow()` de `src/lib/dates.ts` para calcular correctamente "mañana" en zona horaria Colombia (America/Bogota).

---

## API Endpoints

### GET /api/dashboard

Endpoint principal con datos de scorecards y citas de mañana.

**Response:**
```json
{
  "activePatients": 78,
  "newPatientsThisMonth": 35,
  "recurrentPatientsThisMonth": 12,
  "atRiskPatientsCount": 5,
  "atRiskPatientsList": [...],
  "atRiskDays": 30,
  "tomorrowAppointments": [...],
  "tomorrowStats": {
    "total": 7,
    "confirmed": 5,
    "pending": 2,
    "cancelled": 0
  },
  "tomorrowDateDisplay": "Viernes, 6 de diciembre",
  "tomorrowDateLink": "2024-12-06"
}
```

### GET /api/dashboard/weekly-patients

Datos para el gráfico de pacientes por semana.

**Query params:**
- `weekOffset`: 0 = semana actual, -1 = semana anterior, etc.

**Response:**
```json
{
  "data": [
    { "day": "Lun", "fullDate": "Lunes 2 de diciembre", "atendidos": 5, "semanaAnterior": 4, "cancelados": 1 },
    ...
  ],
  "dateRange": "2 dic - 6 dic",
  "weekOffset": 0,
  "canGoNext": false,
  "canGoPrev": true
}
```

### GET /api/dashboard/appointments-distribution

Datos para el gráfico de distribución.

**Response:**
```json
{
  "byModality": {
    "presencial": 150,
    "virtual": 30,
    "total": 180,
    "presencialPercent": 83,
    "virtualPercent": 17
  },
  "byType": {
    "normal": 170,
    "terapiaChoque": 10,
    "total": 180
  },
  "weeklyTrend": [...]
}
```

---

## Componentes

| Componente | Ubicación | Descripción |
|------------|-----------|-------------|
| `Scorecard` | `components/dashboard/Scorecard.tsx` | Card reutilizable con soporte para clickeable |
| `PatientsLineChart` | `components/dashboard/PatientsLineChart.tsx` | Gráfico con navegación semanal |
| `AppointmentsDonutChart` | `components/dashboard/AppointmentsDonutChart.tsx` | Donut/Trend con tabs |
| `UpcomingAppointments` | `components/dashboard/UpcomingAppointments.tsx` | Citas de mañana con banner |
| `AtRiskPatientsModal` | `components/dashboard/AtRiskPatientsModal.tsx` | Modal de pacientes en riesgo |

---

## Historial de Cambios

### v2.0 (2024-12-04)
- Rediseño completo enfocado en retención
- Nuevos scorecards: Activos, Nuevos, Recurrentes, En Riesgo
- Gráfico semanal con navegación y comparación
- Donut con toggle a trend line
- Fix timezone en citas de mañana

### v1.0 (Original)
- Scorecards: Ventas, Gastos, Utilidad
- Gráfico de barras "Resumen de Citas"
- Gráfico "Pacientes últimos 7 días"
