# Upgrade de Tabata - Agente AI

## Estado: Sprint 1 Completado ✅

Fecha: 1 diciembre 2024

---

## Resumen del Upgrade

Tabata pasó de ser un "Pseudo-RAG" a un agente con Smart Tools que consulta la BD de forma inteligente.

### Problema Original
- No entendía preguntas específicas ("¿cuántos pagaron en efectivo?")
- Alucinaba respuestas en lugar de consultar la BD
- Tools genéricas que no aprovechaban el schema

### Solución Implementada
- 5 nuevas Smart Tools con queries específicas
- System prompt mejorado con guía de consultas
- Capacidad máxima del consultorio (10 citas/día) configurada

---

## Tools Implementadas

| Tool | Propósito | Estado |
|------|-----------|--------|
| get_payments_detail | Desglose de pagos por método + facturas electrónicas | ✅ |
| get_appointments_analysis | Análisis de citas por estado, pendientes, capacidad | ✅ |
| get_daily_summary | Resumen completo del día (citas + pagos) | ✅ |
| get_tomorrow_appointments | Citas de mañana + capacidad disponible | ✅ |
| get_week_summary | Resumen semanal | ✅ |

---

## Archivos Modificados

- src/app/api/chat/route.ts
  - 5 nuevas tool definitions
  - 5 nuevas funciones (~250 líneas)
  - 5 nuevos cases en switch de tool_calls
  - System prompt actualizado

---

## Tests Realizados

| Pregunta | Resultado |
|----------|-----------|
| "¿Cuántos pagaron en efectivo el 27 nov?" | ✅ 4 pacientes, $1.328.000 |
| "Dame resumen del 27 nov" | ✅ 11 citas, $3.320.000 total |
| "¿Cuántos tuvieron factura electrónica?" | ✅ 7 pacientes (corregido) |

---

## Próximos Sprints

### Sprint 2: Active Learning (Pendiente)
- Tabata aprende de correcciones del usuario
- "Eso está mal, fueron X no Y" → Guarda en TabataKnowledge
- Mejora continua basada en feedback

### Sprint 3: RAG con Embeddings (Futuro)
- Búsqueda semántica en notas de pacientes
- Requiere: pgvector + OpenAI embeddings
- Casos de uso: "pacientes con problemas de ansiedad"

---

## Cómo Retomar

1. Revisar este documento
2. Probar Tabata con preguntas del consultorio
3. Detectar errores/limitaciones
4. Crear nuevas tools o mejorar existentes

---

## Lecciones Aprendidas

1. **Un prompt = Un commit** - Prompts largos confunden a CC
2. **Probar → Detectar → Mejorar → Repetir** - Así se construyen agentes
3. **El AI no adivina** - Solo sabe lo que sus tools le permiten consultar
4. **Iterar es normal** - El fix de factura electrónica fue necesario
