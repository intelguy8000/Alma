# TABATA - Asistente AI de Medicina del Alma

> **Estado**: Documentación en desarrollo

## Visión General

**Tabata** es el asistente de inteligencia artificial de Medicina del Alma, diseñado para automatizar y simplificar la gestión del consultorio a través de conversaciones naturales.

## Propósito

Tabata ayudará a los profesionales de la salud y su personal administrativo con:

### Gestión de Citas
- Consultar disponibilidad de horarios
- Agendar nuevas citas
- Reagendar citas existentes
- Enviar recordatorios a pacientes
- Confirmar asistencia

### Consultas de Información
- Buscar pacientes por nombre o código
- Consultar historial de citas de un paciente
- Verificar estado de pagos
- Obtener resúmenes del día/semana

### Recordatorios Automáticos
- Citas del día siguiente (WhatsApp/Email)
- Pacientes que no han agendado en X tiempo
- Stock bajo de inventario
- Pagos pendientes

### Reportes Rápidos
- Resumen de ingresos del período
- Citas completadas vs canceladas
- Ocupación del calendario

---

## Especificación Técnica

### System Prompt
```
[PENDIENTE DE DEFINIR]

El system prompt de Tabata debe incluir:
- Contexto del consultorio
- Personalidad y tono
- Capacidades disponibles
- Restricciones y límites
- Formato de respuestas
```

### Herramientas (Tools)

```typescript
// [PENDIENTE DE IMPLEMENTAR]

interface TabataTools {
  // Citas
  searchAvailableSlots(date: string, duration: number): Promise<Slot[]>;
  createAppointment(data: AppointmentData): Promise<Appointment>;
  rescheduleAppointment(id: string, newDate: string, newTime: string): Promise<Appointment>;
  cancelAppointment(id: string, reason: string): Promise<void>;

  // Pacientes
  searchPatients(query: string): Promise<Patient[]>;
  getPatientHistory(patientId: string): Promise<PatientHistory>;

  // Información
  getTodayAppointments(): Promise<Appointment[]>;
  getWeekSummary(): Promise<WeekSummary>;

  // Comunicación
  sendWhatsAppReminder(patientId: string, message: string): Promise<void>;
  sendEmailReminder(patientId: string, subject: string, body: string): Promise<void>;
}
```

### Integración Planificada

| Canal | Estado | Descripción |
|-------|--------|-------------|
| Web Chat | Pendiente | Widget en dashboard |
| WhatsApp | Pendiente | Bot para pacientes |
| API REST | Pendiente | Integración externa |

---

## Roadmap

### Fase 1: Fundamentos
- [ ] Definir system prompt base
- [ ] Implementar tools básicos (consultas)
- [ ] Crear endpoint API para chat

### Fase 2: Acciones
- [ ] Implementar tools de escritura (crear/modificar citas)
- [ ] Agregar validaciones y confirmaciones
- [ ] Logging de todas las acciones

### Fase 3: Integraciones
- [ ] Conectar con WhatsApp Business API
- [ ] Implementar recordatorios automáticos
- [ ] Widget de chat en dashboard

### Fase 4: Inteligencia
- [ ] Análisis de patrones (horarios preferidos)
- [ ] Sugerencias proactivas
- [ ] Detección de anomalías

---

## Consideraciones de Seguridad

- Tabata solo puede acceder a datos de la organización del usuario autenticado
- Todas las acciones destructivas requieren confirmación
- Registro completo de auditoría
- Rate limiting por usuario
- No exponer información sensible (contraseñas, tokens)

---

## Notas de Implementación

```
[ESPACIO RESERVADO PARA NOTAS DE DESARROLLO]

- Modelo a utilizar: [Por definir]
- Proveedor: [Por definir]
- Contexto máximo: [Por definir]
- Estrategia de memoria: [Por definir]
```

---

*Documento creado: Noviembre 2024*
*Última actualización: Noviembre 2024*
