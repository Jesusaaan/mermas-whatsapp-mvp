/**
 * Fase 1A — Persistencia en Google Sheets vía Apps Script.
 * - setupSheets(): crea/verifica hojas (idempotente).
 * - doPost(e): recibe un sobre firmado, deduplica por whatsapp_message_id,
 *   registra movimientos validados y actualiza stock en Insumos_Catalogo.
 *
 * Secretos: Script Properties (APPS_SCRIPT_SHARED_SECRET). Nunca en código.
 * Apps Script no expone encabezados HTTP en `e`, por eso la firma va en el cuerpo.
 *
 * Sobre esperado (JSON):
 *   { "timestamp": <epoch segundos>, "payload": "<JSON como string>", "signature": "<hex>" }
 *   signature = HMAC-SHA256(secret, timestamp + "." + payload) en hexadecimal minúscula.
 *
 * Payload (JSON):
 *   { "whatsapp_message_id": "wamid...", "from": "519XXXXXXXX",
 *     "message_type": "text" | "image" | "audio",
 *     "movimientos": [ { "tipo": "compra|uso|merma", "insumo": "...",
 *                        "cantidad": 1.5, "unidad": "kg",
 *                        "costo_total_pen": 12.5 (opcional), "motivo": "..." (opcional) } ] }
 *   Para image/audio los movimientos se IGNORAN (la IA llega en la Fase 2).
 */

var TZ = 'America/Lima';
var MAX_SKEW_SECONDS = 300;
var LOCK_WAIT_MS = 30000;

var SCHEMA = {
  Negocios: ['negocio_id', 'nombre', 'telefono_propietario', 'telefonos_operarios', 'activo', 'creado_en'],
  Movimientos: ['movimiento_id', 'negocio_id', 'whatsapp_message_id', 'linea', 'fecha_hora', 'tipo',
    'insumo_id', 'insumo_nombre', 'cantidad', 'unidad', 'cantidad_base', 'unidad_base',
    'costo_total_pen', 'motivo', 'lote_id', 'estado', 'registrado_por', 'creado_en'],
  Insumos_Catalogo: ['negocio_id', 'insumo_id', 'nombre', 'alias', 'unidad_base', 'stock_actual', 'stock_minimo', 'actualizado_en'],
  Alertas: ['alerta_id', 'negocio_id', 'tipo', 'insumo_id', 'mensaje', 'estado', 'whatsapp_message_id', 'creado_en'],
  Lotes: ['lote_id', 'negocio_id', 'insumo_id', 'whatsapp_message_id', 'fecha_compra', 'fecha_vencimiento',
    'cantidad_inicial', 'saldo', 'unidad_base', 'estado', 'creado_en'],
  Mensajes_Entrada: ['whatsapp_message_id', 'negocio_id', 'remitente', 'message_type', 'estado', 'intentos',
    'detalle', 'recibido_en', 'actualizado_en']
};

// unidad canónica -> [familia, factor a la unidad base de la familia]
var UNITS = {
  kg: ['peso', 1], g: ['peso', 0.001],
  l: ['volumen', 1], ml: ['volumen', 0.001],
  unidad: ['conteo', 1]
};
var UNIT_ALIASES = {
  kg: 'kg', kilo: 'kg', kilos: 'kg', kilogramo: 'kg', kilogramos: 'kg',
  g: 'g', gr: 'g', grs: 'g', gramo: 'g', gramos: 'g',
  l: 'l', lt: 'l', lts: 'l', litro: 'l', litros: 'l',
  ml: 'ml', mililitro: 'ml', mililitros: 'ml',
  u: 'unidad', und: 'unidad', unid: 'unidad', unidad: 'unidad', unidades: 'unidad'
};
var TIPOS = { compra: 1, uso: -1, merma: -1 };

/* ------------------------------ Setup ------------------------------ */

function setupSheets() {
  var ss = getSpreadsheet_();
  var report = {};
  Object.keys(SCHEMA).forEach(function (name) {
    var headers = SCHEMA[name];
    var sheet = ss.getSheetByName(name) || ss.insertSheet(name);
    var current = sheet.getLastColumn() > 0
      ? sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), headers.length)).getValues()[0]
      : [];
    var empty = current.every(function (v) { return v === ''; });
    if (empty) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
      sheet.setFrozenRows(1);
      report[name] = 'creada';
      return;
    }
    var ok = headers.every(function (h, i) { return current[i] === h; });
    report[name] = ok ? 'ok' : 'ENCABEZADOS DISTINTOS: revisar manualmente (esperado: ' + headers.join(', ') + ')';
  });
  Logger.log(JSON.stringify(report, null, 2));
  return report;
}

/* ------------------------------ doPost ------------------------------ */

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var env = parseJson_(e && e.postData && e.postData.contents);
    var authError = verifyEnvelope_(env);
    if (authError) return json_({ ok: false, error: authError });

    var payload = parseJson_(env.payload);
    var shapeError = validatePayload_(payload);
    if (shapeError) return json_({ ok: false, error: shapeError });

    lock.waitLock(LOCK_WAIT_MS);
    try {
      return json_(processMessage_(payload));
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    console.error(String(err && err.message ? err.message : err));
    return json_({ ok: false, error: 'error_interno' });
  }
}

function verifyEnvelope_(env) {
  if (!env || typeof env !== 'object') return 'cuerpo_invalido';
  if (typeof env.payload !== 'string' || typeof env.signature !== 'string') return 'cuerpo_invalido';
  var ts = Number(env.timestamp);
  if (!isFinite(ts)) return 'cuerpo_invalido';
  var secret = PropertiesService.getScriptProperties().getProperty('APPS_SCRIPT_SHARED_SECRET');
  if (!secret) return 'servidor_sin_secreto';
  var now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > MAX_SKEW_SECONDS) return 'timestamp_fuera_de_rango';
  var expected = hmacHex_(secret, String(env.timestamp) + '.' + env.payload);
  if (!safeEqual_(expected, env.signature.toLowerCase())) return 'firma_invalida';
  return null;
}

function validatePayload_(p) {
  if (!p || typeof p !== 'object') return 'payload_invalido';
  if (typeof p.whatsapp_message_id !== 'string' || !p.whatsapp_message_id.trim()) return 'falta_whatsapp_message_id';
  if (!digits_(p.from)) return 'falta_remitente';
  if (['text', 'image', 'audio'].indexOf(p.message_type) < 0) return 'message_type_invalido';
  if (p.movimientos !== undefined && !Array.isArray(p.movimientos)) return 'movimientos_invalido';
  return null;
}

/* --------------------------- Procesamiento --------------------------- */

function processMessage_(p) {
  var msgId = p.whatsapp_message_id.trim();
  var from = digits_(p.from);
  var now = nowLima_();
  var inbox = getSheet_('Mensajes_Entrada');
  var inboxRow = findRow_(inbox, 1, msgId);
  var intentos = 1;

  if (inboxRow) {
    var prev = inbox.getRange(inboxRow, 1, 1, SCHEMA.Mensajes_Entrada.length).getValues()[0];
    if (prev[4] === 'PROCESADO' || prev[4] === 'NO_AUTORIZADO' || prev[4] === 'PENDIENTE_IA') {
      return { ok: true, duplicado: true, estado: prev[4], whatsapp_message_id: msgId };
    }
    intentos = Number(prev[5] || 0) + 1; // reintento de ACLARACION/ERROR: líneas ya registradas no se duplican
  }

  var negocio = findNegocioBySender_(from);
  if (!negocio) {
    upsertInbox_(inbox, inboxRow, [msgId, '', from, p.message_type, 'NO_AUTORIZADO', intentos, 'remitente no registrado', now, now]);
    return { ok: false, error: 'remitente_no_autorizado', whatsapp_message_id: msgId };
  }

  if (p.message_type !== 'text') {
    // Foto/audio: solo se registra el evento. Sin movimientos hasta la Fase 2.
    upsertInbox_(inbox, inboxRow, [msgId, negocio.id, from, p.message_type, 'PENDIENTE_IA', intentos, 'sin IA: movimientos ignorados', now, now]);
    return { ok: true, estado: 'PENDIENTE_IA', whatsapp_message_id: msgId, lineas: [] };
  }

  var lineas = (p.movimientos || []).map(function (m, i) {
    return registerLine_(negocio, from, msgId, i + 1, m);
  });
  var pendientes = lineas.filter(function (l) { return l.estado === 'ACLARACION' || l.estado === 'POR_REVISAR'; });
  var estado = !lineas.length ? 'ACLARACION' : (pendientes.length ? 'ACLARACION' : 'PROCESADO');
  var detalle = !lineas.length ? 'sin movimientos' : lineas.map(function (l) { return l.linea + ':' + l.estado + (l.motivo ? '(' + l.motivo + ')' : ''); }).join('; ');
  upsertInbox_(inbox, inboxRow, [msgId, negocio.id, from, p.message_type, estado, intentos, detalle, now, nowLima_()]);
  return { ok: true, estado: estado, whatsapp_message_id: msgId, negocio_id: negocio.id, lineas: lineas };
}

function registerLine_(negocio, from, msgId, linea, m) {
  var out = function (estado, motivo) { return { linea: linea, estado: estado, motivo: motivo || '' }; };
  var movSheet = getSheet_('Movimientos');
  if (hasMovement_(movSheet, msgId, linea)) return out('DUPLICADO');

  // Validación: tipo, insumo, cantidad y unidad; nada se infiere.
  m = m || {};
  var tipo = String(m.tipo || '').trim().toLowerCase();
  if (!TIPOS[tipo]) return out('ACLARACION', 'tipo_invalido');
  var nombre = String(m.insumo || '').trim();
  if (!nombre) return out('ACLARACION', 'falta_insumo');
  var cantidad = parseQty_(m.cantidad);
  if (cantidad === null) return out('ACLARACION', 'cantidad_invalida');
  var unidad = UNIT_ALIASES[String(m.unidad || '').trim().toLowerCase()];
  if (!unidad) return out('ACLARACION', 'unidad_invalida');

  var cat = getSheet_('Insumos_Catalogo');
  var insumo = findInsumo_(cat, negocio.id, nombre);
  if (!insumo) return out('ACLARACION', 'insumo_no_está_en_catalogo');
  var baseUnit = UNIT_ALIASES[String(insumo.row[4]).trim().toLowerCase()];
  if (!baseUnit || UNITS[baseUnit][0] !== UNITS[unidad][0]) return out('ACLARACION', 'unidad_no_convertible');

  var cantBase = round_(cantidad * UNITS[unidad][1] / UNITS[baseUnit][1]);
  var stock = Number(insumo.row[5]) || 0;
  var delta = TIPOS[tipo] * cantBase;
  var estado = 'REGISTRADO';
  var motivoErr = '';
  if (stock + delta < 0) { estado = 'POR_REVISAR'; motivoErr = 'stock_insuficiente'; }

  var costo = (m.costo_total_pen === undefined || m.costo_total_pen === null || m.costo_total_pen === '')
    ? '' : parseQty_(m.costo_total_pen, true);
  if (costo === null) costo = ''; // costo no fiable: se deja vacío, no se inventa

  var now = nowLima_();
  movSheet.appendRow([Utilities.getUuid(), negocio.id, msgId, linea, now, tipo,
    insumo.row[1], insumo.row[2], cantidad, unidad, cantBase, baseUnit,
    costo, String(m.motivo || ''), '', estado, from, now]);

  if (estado === 'REGISTRADO') {
    cat.getRange(insumo.rowNum, 6).setValue(round_(stock + delta));
    cat.getRange(insumo.rowNum, 8).setValue(now);
  } else {
    getSheet_('Alertas').appendRow([Utilities.getUuid(), negocio.id, 'STOCK_INSUFICIENTE', insumo.row[1],
      tipo + ' de ' + cantBase + ' ' + baseUnit + ' supera stock ' + stock + ' (sin descontar)', 'ABIERTA', msgId, now]);
  }
  return out(estado, motivoErr);
}

/* ------------------------------ Búsquedas ------------------------------ */

function findNegocioBySender_(phone) {
  var sheet = getSheet_('Negocios');
  var n = sheet.getLastRow() - 1;
  if (n < 1) return null;
  var rows = sheet.getRange(2, 1, n, SCHEMA.Negocios.length).getValues();
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (String(r[4]).toUpperCase() !== 'TRUE' && r[4] !== true) continue; // solo negocios activos
    if (digits_(r[2]) === phone) return { id: String(r[0]), rol: 'propietario' };
    var ops = String(r[3]).split(',').map(digits_);
    if (ops.indexOf(phone) >= 0) return { id: String(r[0]), rol: 'operario' };
  }
  return null;
}

function findInsumo_(sheet, negocioId, nombre) {
  var n = sheet.getLastRow() - 1;
  if (n < 1) return null;
  var rows = sheet.getRange(2, 1, n, SCHEMA.Insumos_Catalogo.length).getValues();
  var key = norm_(nombre);
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][0]) !== negocioId) continue;
    var names = [rows[i][2]].concat(String(rows[i][3]).split(','));
    if (names.some(function (x) { return norm_(x) === key; })) return { row: rows[i], rowNum: i + 2 };
  }
  return null;
}

function hasMovement_(sheet, msgId, linea) {
  var n = sheet.getLastRow() - 1;
  if (n < 1) return false;
  var rows = sheet.getRange(2, 3, n, 2).getValues(); // whatsapp_message_id, linea
  return rows.some(function (r) { return r[0] === msgId && Number(r[1]) === linea; });
}

function findRow_(sheet, col, value) {
  var n = sheet.getLastRow() - 1;
  if (n < 1) return 0;
  var vals = sheet.getRange(2, col, n, 1).getValues();
  for (var i = 0; i < vals.length; i++) if (String(vals[i][0]) === value) return i + 2;
  return 0;
}

function upsertInbox_(sheet, rowNum, values) {
  if (rowNum) {
    var prevRecibido = sheet.getRange(rowNum, 8).getValue();
    values[7] = prevRecibido || values[7];
    sheet.getRange(rowNum, 1, 1, values.length).setValues([values]);
  } else {
    sheet.appendRow(values);
  }
}

/* ------------------------------- Utilidades ------------------------------- */

function getSpreadsheet_() {
  var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  var ss = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Sin hoja: script no vinculado y SPREADSHEET_ID no definido');
  return ss;
}

function getSheet_(name) {
  var sheet = getSpreadsheet_().getSheetByName(name);
  if (!sheet) throw new Error('Falta la hoja ' + name + ': ejecutar setupSheets()');
  return sheet;
}

function parseJson_(s) {
  try { return JSON.parse(s); } catch (_) { return null; }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function hmacHex_(secret, message) {
  var bytes = Utilities.computeHmacSha256Signature(message, secret);
  return bytes.map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
}

function safeEqual_(a, b) {
  if (a.length !== b.length) return false;
  var diff = 0;
  for (var i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function digits_(v) { return String(v === undefined || v === null ? '' : v).replace(/\D/g, ''); }

function norm_(s) {
  return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
}

// Cantidad numérica finita; >0 (o >=0 si allowZero). Devuelve null si no es fiable.
function parseQty_(v, allowZero) {
  if (typeof v === 'string') {
    if (!/^\d+([.,]\d+)?$/.test(v.trim())) return null;
    v = Number(v.trim().replace(',', '.'));
  }
  if (typeof v !== 'number' || !isFinite(v)) return null;
  return (allowZero ? v >= 0 : v > 0) ? v : null;
}

function round_(n) { return Math.round(n * 1e6) / 1e6; }

function nowLima_() { return Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd'T'HH:mm:ssXXX"); }
