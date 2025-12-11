# Playwright MCP - Verificación Visual Automatizada

## ¿Qué es?

Playwright MCP permite a Claude Code controlar un navegador real para verificar cambios visualmente en la plataforma. Es especialmente útil para:

- Verificar cambios de UI después de implementaciones
- Tomar screenshots como evidencia de QA
- Navegar la aplicación y validar flujos de usuario

## Configuración

El MCP ya está configurado en el proyecto. El comando utilizado fue:

```bash
claude mcp add playwright -- npx @playwright/mcp@latest
```

Para usarlo en una nueva sesión de Claude Code:
1. Reinicia Claude Code (el MCP se carga al inicio)
2. Playwright MCP estará disponible automáticamente como herramienta

## Dependencias

El proyecto incluye `@playwright/test` como dependencia de desarrollo:

```json
"devDependencies": {
  "@playwright/test": "^1.x.x"
}
```

Si necesitas reinstalar los navegadores:
```bash
npx playwright install chromium
```

## Cómo Usar

### Comando básico

```
Usa playwright mcp para abrir el navegador en medicina-del-alma.vercel.app
```

### Flujo de verificación típico

1. Claude Code abre navegador en modo visible (no headless)
2. Usuario hace login manualmente (las credenciales no se comparten con CC)
3. Usuario confirma "listo" o "ya hice login"
4. Claude Code navega y toma screenshots de verificación
5. Claude Code reporta resultados

### Ejemplo de prompt de verificación

```
Usa playwright mcp para verificar en medicina-del-alma.vercel.app:

1. Que el calendario muestre el sábado en la vista semanal
2. Que exista "Terapia Capilar" como tipo de cita
3. Que se pueda ingresar $0 en el monto de una venta

Toma screenshots como evidencia y reporta si funciona o hay problemas.
```

### Script de verificación manual

También puedes crear scripts Node.js para verificaciones más complejas:

```javascript
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('https://medicina-del-alma.vercel.app');
  // ... acciones de verificación
  await page.screenshot({ path: 'screenshot.png' });

  await browser.close();
})();
```

## Screenshots

Los screenshots de verificación se guardan en `/screenshots/`:

| Archivo | Descripción |
|---------|-------------|
| `1-calendario-sabado.png` | Vista semanal mostrando sábado |
| `3-pago-cero.png` | Modal de venta aceptando $0 |
| `6-filtro-tipos.png` | Filtro de tipos con Terapia Capilar |

## Notas Importantes

- **Login manual**: El navegador abre visible para que el usuario haga login. Claude Code NO tiene acceso a credenciales.
- **Timeout**: Los scripts esperan ~20-30 segundos para login antes de continuar.
- **Modo visible**: Siempre usar `headless: false` para permitir interacción manual.
- **Screenshots**: Se recomienda guardar evidencias en `/screenshots/` para documentación.

## Troubleshooting

### El MCP no está disponible
Reinicia Claude Code. Los MCPs se cargan al inicio de la sesión.

### Chromium no está instalado
```bash
npx playwright install chromium
```

### El navegador no abre
Verifica que no haya procesos de Chromium colgados:
```bash
pkill -f chromium
```

---

*Configurado: 2025-12-11*
