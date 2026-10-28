# MVP WhatsApp Mermas — instrucciones permanentes para Claude Code

## Producto y alcance
SaaS piloto para **5 restaurantes de Lima durante 7 días**. El operario manda foto de boleta o audio por WhatsApp para registrar compra, uso o merma; el dueño consulta panel web con inventario, mermas y alertas. No construir POS, facturación, cobros, planes comerciales ni recomendaciones avanzadas en este MVP. Moneda PEN; zona horaria America/Lima.

## Stack fijado
Windows PowerShell (`npm.cmd` y `npx.cmd`, nunca `npm`/`npx` a secas); Next.js App Router + TypeScript + Tailwind; Git + GitHub; despliegue Vercel; Meta WhatsApp **Cloud API oficial**; un proveedor multimodal de IA configurable; Google Sheets como base y Google Apps Script `doPost` como escritura. Next.js lee Sheets **solo en servidor** con credenciales privadas. Mantener un solo repositorio (sin monorepo ni microservicios adicionales en el piloto). Scripts de Apps Script en `/apps-script` y documentación en `/docs`.

## Flujo de negocio
WhatsApp foto/audio -> webhook firmado de Meta -> lectura/transcripción IA -> JSON validado -> aclaración corta si faltan tipo/insumo/cantidad/unidad -> Apps Script registra movimiento(s), actualiza inventario y lotes -> panel del dueño consulta servidor -> alertas próximas a vencer. Antes de activar IA, demostrar extremo a extremo un mensaje de prueba sin IA. Cada mensaje puede contener múltiples insumos: guardar una fila por insumo compartiendo el `whatsapp_message_id`; nunca registrar un mismo mensaje dos veces.

## Datos
Hojas de negocio obligatorias del plan: `Negocios`, `Movimientos`, `Insumos_Catalogo`, `Alertas`. Ajustes mínimos justificados: `Lotes` para fecha de compra/vencimiento y saldo por lote; `Mensajes_Entrada` como cola/bitácora de idempotencia y reintentos. Relacionar siempre con `negocio_id`. Agregar `whatsapp_message_id` y `lote_id` cuando corresponda. Nunca descontar stock si la unidad no es convertible o falta cantidad fiable. No inventar costos, fechas de vencimiento ni ahorros. Preguntar aclaración o marcar por revisar. Los costos de merma, si existen, en PEN.

## Seguridad obligatoria
Webhook GET verifica token/challenge; POST comprueba `X-Hub-Signature-256` con HMAC-SHA256 sobre cuerpo crudo antes de procesar. Autorización por número de operario registrado para ingreso, con distinción de propietario y operario. No permitir leer datos de otros negocios cambiando `negocio_id`: el servidor deriva negocio autorizado de la sesión. Prohibido login basado solo en escribir número: usar OTP seguro o enlace de acceso de duración limitada para piloto. No publicar Apps Script/Sheets/Meta/IA secrets en navegador ni en git. Crear `.env.example` solo con nombres, no valores. Para Apps Script expuesto usar autenticación del emisor con secreto firmado y validación server-side.

## Orden — NO adelantar fases
0. Base: aplicación recién creada, comprobar `npm.cmd run build`, carpetas `/apps-script`, `/docs`, `.env.example`, página temporal limpia y `/api/health`. Sin claves todavía.
1. Captura sin IA: Apps Script crea hojas y acepta movimiento validado; webhook verifica GET/POST, deduplica y registra evento; prueba local simulada y prueba con Meta cuando estén credenciales. Reintentos trazables. Sin dashboard complejo.
2. IA: foto + audio, JSON estructurado con schema, manejo de múltiples líneas, validación, aclaraciones, tests con boletas/audios locales sin datos personales.
3. Lotes, vencimiento, panel Dashboard/Inventario/Alertas/Movimientos; acceso autorizado por negocio; nada de ahorro ficticio.
4. Piloto de 7 días / 5 locales: medir capturas completas, precisión, intervención humana, retención diaria y mermas valorizadas. Ajustar desde resultados.

## Reglas de eficiencia del agente
Antes de tocar archivos: revisar el proyecto existente y hacer el cambio mínimo. Ejecutar **solo la fase solicitada**, no inventar credenciales ni implementar extras. Al terminar: ejecutar `npm.cmd run build` (y tests si existen), resolver errores, informar archivos modificados, comandos ejecutados, variables faltantes y prueba manual en máximo 8 líneas. No correr `git push`, conectar Meta, ni desplegar sin instrucción explícita. Nunca cambiar ExecutionPolicy, reinstalar Node/Git innecesariamente, ni pegar lenguaje natural en PowerShell. No agregar Resend, CRM, pagos, ni dependencias no justificadas. Mantener cada módulo corto, claro y fácil de sustituir.
