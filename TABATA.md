# TABATA - Asistente AI de Medicina del Alma

> **Estado**: Fase 1 completada - Chat básico con tools

## Visión General

**Tabata** es el asistente de inteligencia artificial de Medicina del Alma, diseñado para automatizar y simplificar la gestión del consultorio a través de conversaciones naturales.

## Implementación Actual

### Componentes
- `src/components/chat/TabataChat.tsx` - Widget flotante de chat
- `src/app/api/chat/route.ts` - API principal con OpenAI y tools
- `src/app/api/chat/clear/route.ts` - API para limpiar historial

### Modelos de Base de Datos
```prisma
model ChatMessage {
  id             String   @id @default(cuid())
  organizationId String
  userId         String
  role           String   // user, assistant
  content        String   @db.Text
  createdAt      DateTime @default(now())

  organization   Organization @relation(...)
  user           User         @relation(...)

  @@index([organizationId, createdAt])
  @@index([userId])
}

model TabataKnowledge {
  id             String    @id @default(cuid())
  organizationId String
  category       String    // paciente, proceso, preferencia, regla
  content        String    @db.Text
  source         String?   // cómo lo aprendió
  createdAt      DateTime  @default(now())
  expiresAt      DateTime?

  organization   Organization @relation(...)

  @@index([organizationId, category])
}
```

### Tools Implementados (Function Calling)

| Tool | Descripción | Parámetros |
|------|-------------|------------|
| `search_patients` | Buscar pacientes por nombre/código | `query: string` |
| `get_today_appointments` | Ver citas del día | ninguno |
| `get_patient_appointments` | Historial de citas de un paciente | `patientId: string` |
| `get_inventory_status` | Consultar inventario | `query?: string`, `lowStockOnly?: boolean` |
| `get_financial_summary` | Resumen de ingresos/gastos | `period: "today" | "week" | "month"` |
| `save_knowledge` | Guardar información del consultorio | `category, content, source?` |

### Modelo y Configuración
- **Modelo**: gpt-4o-mini
- **Temperatura**: 0.7
- **Max tokens**: 1000
- **Contexto**: Últimos 10 mensajes + conocimiento guardado

---

## Capacidades Actuales

### Consultas de Información (Solo Lectura)
- Buscar pacientes por nombre o código
- Ver citas programadas para hoy
- Consultar historial de citas de un paciente
- Ver estado del inventario (incluye alertas de stock bajo)
- Obtener resumen financiero (hoy, semana, mes)

### Sistema de Memoria
- Historial de chat persistente por usuario
- Base de conocimiento del consultorio (TabataKnowledge)
- Categorización: paciente, proceso, preferencia, regla

---

## Variables de Entorno Requeridas

```env
OPENAI_API_KEY="sk-..."
```

---

## Uso

El chat aparece como un botón flotante en la esquina inferior derecha de todas las páginas del dashboard. Al hacer clic:

1. Se abre la ventana de chat
2. Se carga el historial de conversaciones
3. El usuario puede escribir preguntas en lenguaje natural
4. Tabata responde usando los tools disponibles

### Ejemplos de Preguntas

```
- "¿Cuántas citas tengo hoy?"
- "Busca al paciente María García"
- "¿Cómo va el inventario?"
- "Dame el resumen financiero de este mes"
- "¿Cuántas veces ha venido el paciente P-001?"
```

---

## Roadmap

### Fase 1: Fundamentos ✅
- [x] Modelos de base de datos (ChatMessage, TabataKnowledge)
- [x] Componente de chat flotante
- [x] API con OpenAI function calling
- [x] Tools de consulta (pacientes, citas, inventario, finanzas)
- [x] Sistema de memoria básico

### Fase 2: Acciones (Pendiente)
- [ ] Tools de escritura (crear/modificar citas)
- [ ] Confirmaciones antes de acciones destructivas
- [ ] Logging de todas las acciones

### Fase 3: Integraciones (Pendiente)
- [ ] Conectar con WhatsApp Business API
- [ ] Recordatorios automáticos
- [ ] Notificaciones push

### Fase 4: Inteligencia (Pendiente)
- [ ] Análisis de patrones (horarios preferidos)
- [ ] Sugerencias proactivas
- [ ] Detección de anomalías

---

## Consideraciones de Seguridad

- Tabata solo accede a datos de la organización del usuario autenticado
- Actualmente solo puede CONSULTAR, no modificar datos
- Todo el historial está vinculado al userId
- El conocimiento se guarda por organizationId

---

*Última actualización: Noviembre 2024*
