# Fase 1A — Conexión manual de Google Sheets + Apps Script

Alcance: persistencia solo. Sin Meta, sin IA. Foto/audio solo registran el evento (`PENDIENTE_IA`), sin movimientos.

## 1. Crear la hoja y el script
1. Crear una hoja de cálculo nueva en Google Sheets (p. ej. `Mermas MVP`).
2. Menú **Extensiones → Apps Script**. Borrar el contenido de `Code.gs` y pegar el de `apps-script/Code.gs`.
3. Zona horaria: **Configuración del proyecto → Zona horaria = America/Lima** (o `appsscript.json` con `"timeZone": "America/Lima"`).
4. Seleccionar la función `setupSheets` y pulsar **Ejecutar**; autorizar permisos. Repetirlo es seguro (idempotente). Debe crear: `Negocios`, `Movimientos`, `Insumos_Catalogo`, `Alertas`, `Lotes`, `Mensajes_Entrada`. Ver el resultado en **Registro de ejecución**.

## 2. Secreto compartido (Script Properties)
**Configuración del proyecto → Propiedades de la secuencia de comandos → Agregar**:
- `APPS_SCRIPT_SHARED_SECRET` = cadena aleatoria larga (p. ej. 48+ caracteres). Generar en PowerShell:
  `[Convert]::ToBase64String((1..36 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])`
- (Opcional) `SPREADSHEET_ID` solo si el script NO está vinculado a la hoja.

El mismo valor irá luego en `.env.local` como `APPS_SCRIPT_SHARED_SECRET` (nunca en git).

## 3. Datos iniciales manuales (no se inventan)
- `Negocios`: una fila por local: `negocio_id` (p. ej. `neg_001`), `nombre`, `telefono_propietario` y `telefonos_operarios` (solo dígitos con código de país, separados por coma), `activo` = `TRUE`, `creado_en`.
- `Insumos_Catalogo`: `negocio_id`, `insumo_id`, `nombre`, `alias` (separados por coma, opcional), `unidad_base` (`kg`, `g`, `l`, `ml` o `unidad`), `stock_actual`, `stock_minimo`. Un insumo que no esté aquí no se registra: devuelve `ACLARACION`.

## 4. Publicar el Web App (cuando se indique)
**Implementar → Nueva implementación → Aplicación web**: ejecutar como *Yo*; acceso *Cualquier persona*. Copiar la URL `/exec` a `APPS_SCRIPT_WEB_APP_URL`. Tras cambiar código: **Administrar implementaciones → Editar → Nueva versión**.

## 5. Contrato de la petición
Apps Script no expone encabezados, así que la firma va en el cuerpo (POST JSON):
```json
{ "timestamp": 1730000000, "payload": "<JSON en string>", "signature": "<hex>" }
```
`signature = HMAC-SHA256(secreto, timestamp + "." + payload)` en hex minúscula; `timestamp` en segundos, tolerancia ±5 min.

Payload:
```json
{ "whatsapp_message_id": "wamid.TEST1", "from": "51999999999", "message_type": "text",
  "movimientos": [ { "tipo": "compra", "insumo": "Pollo", "cantidad": 5, "unidad": "kg", "costo_total_pen": 40 } ] }
```
Reglas: `tipo` ∈ compra|uso|merma; cantidad numérica > 0; unidad convertible a la `unidad_base` (g↔kg, ml↔l). Uso/merma que superen el stock quedan `POR_REVISAR` sin descontar y crean una alerta. Un `whatsapp_message_id` ya `PROCESADO` devuelve `duplicado: true`; líneas ya registradas nunca se repiten (clave mensaje+línea).

## 6. Prueba manual con el cliente de Next.js
Cliente servidor: `src/lib/apps-script-client.mjs` (firma, redirección 302 de Google, clasifica JSON / HTTP / HTML inesperado). Script: `scripts/probar-apps-script.mjs`. No hay endpoints públicos de prueba.

**.env.local** (nunca en git; ver `.env.example`):
```
APPS_SCRIPT_WEB_APP_URL=https://script.google.com/macros/s/.../exec
APPS_SCRIPT_SHARED_SECRET=<mismo valor que en Script Properties>
TEST_WHATSAPP_FROM=<dígitos con código de país, igual que en Negocios>
# solo para el paso 4 (opcional):
TEST_INSUMO=<nombre o alias existente en Insumos_Catalogo>
TEST_UNIDAD=<kg|g|l|ml|unidad, convertible a su unidad_base>
TEST_CANTIDAD=1
```

**Comandos (PowerShell, desde la raíz del proyecto)**
```
node scripts/probar-apps-script.mjs                       # simulación: valida config, NO envía nada
node scripts/probar-apps-script.mjs --ejecutar            # pasos 1-3 (escribe en la hoja real)
node scripts/probar-apps-script.mjs --ejecutar --compra   # añade el paso 4 (modifica stock_actual)
```
Pasos: 1) firma inválida → `firma_invalida`; 2) imagen del remitente de prueba → `PENDIENTE_IA`; 3) mismo `whatsapp_message_id` → `duplicado` (no es error); 4) compra de `TEST_INSUMO` + reenvío duplicado. Sale con código 1 si algo falla.

**Preparar el paso 4 sin inventar encabezados:** tras `setupSheets()`, en `Insumos_Catalogo` añade UNA fila bajo los encabezados existentes: `negocio_id` (el de tu fila en Negocios), `insumo_id` (p. ej. `ins_prueba`), `nombre` (p. ej. `Insumo de prueba`), `alias` vacío, `unidad_base`, `stock_actual` = `0`, `stock_minimo` vacío. Si el insumo no existe, el script lo informa y omite el paso 4.

**Verificar en la hoja:** `Mensajes_Entrada` (PENDIENTE_IA y PROCESADO), `Movimientos` (una fila de compra) y `stock_actual` incrementado.

**Errores típicos:** `respuesta_invalida` con texto de Google = el Web App no está con acceso *Cualquier persona* o la URL no es `/exec`; `timestamp_fuera_de_rango` = reloj del PC desfasado; `remitente_no_autorizado` = `TEST_WHATSAPP_FROM` no coincide con Negocios o `activo` ≠ TRUE.

## Pendiente (fases posteriores)
`Lotes` queda creada pero sin escrituras (Fase 3). Webhook de Meta: Fase 1B. IA: Fase 2.
