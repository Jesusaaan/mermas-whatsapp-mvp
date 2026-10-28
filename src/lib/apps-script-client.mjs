// Cliente SOLO servidor para el Web App de Apps Script (protocolo de apps-script/Code.gs).
// No importar desde componentes de cliente: usa el secreto compartido.
import { createHmac } from "node:crypto";
import https from "node:https";

const TIMEOUT_MS = 45000; // Code.gs espera hasta 30 s por el lock
const MAX_REDIRECTS = 3;

/** @param {Record<string, string | undefined>} [env] */
export function getAppsScriptConfig(env = process.env) {
  const url = env.APPS_SCRIPT_WEB_APP_URL;
  const secret = env.APPS_SCRIPT_SHARED_SECRET;
  const missing = [];
  if (!url) missing.push("APPS_SCRIPT_WEB_APP_URL");
  if (!secret) missing.push("APPS_SCRIPT_SHARED_SECRET");
  if (missing.length) throw new Error(`Faltan variables: ${missing.join(", ")}`);
  return { url: /** @type {string} */ (url), secret: /** @type {string} */ (secret) };
}

/** HMAC-SHA256 hex de `${timestamp}.${payload}` (UTF-8), igual que hmacHex_ en Code.gs. */
export function sign(secret, timestamp, payloadString) {
  return createHmac("sha256", secret).update(`${timestamp}.${payloadString}`, "utf8").digest("hex");
}

/** Sobre {timestamp (epoch segundos, entero), payload (JSON en string), signature}. */
export function buildEnvelope(secret, payload, { now = Date.now(), badSignature = false } = {}) {
  const timestamp = Math.floor(now / 1000);
  const payloadString = JSON.stringify(payload);
  const signature = badSignature ? "0".repeat(64) : sign(secret, timestamp, payloadString);
  return { timestamp, payload: payloadString, signature };
}

/**
 * Envía el payload firmado y clasifica la respuesta.
 * kind: "ok" | "duplicado" | "rechazado" (ok:false de Code.gs) | "error_http" | "respuesta_invalida" | "error_red"
 */
export async function sendToAppsScript(payload, { config = getAppsScriptConfig(), badSignature = false } = {}) {
  const body = JSON.stringify(buildEnvelope(config.secret, payload, { badSignature }));
  let res;
  let stage = "POST";
  try {
    // Apps Script responde 302 a script.googleusercontent.com; se sigue a mano con GET (sin reenviar el cuerpo).
    res = await httpRequest(config.url, "POST", body);
    for (let i = 0; i < MAX_REDIRECTS && res.status >= 300 && res.status < 400 && res.location; i++) {
      stage = "GET_REDIRECT";
      res = await httpRequest(new URL(res.location, config.url), "GET");
    }
  } catch (err) {
    return { kind: "error_red", detalle: `${stage}: ${describeError(err, config)}`, error: { etapa: stage, ...errorInfo(err, config) } };
  }

  const text = res.text;
  if (res.status < 200 || res.status >= 300) return { kind: "error_http", status: res.status, detalle: snippet(text) };

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    // Típico: página HTML de login/permisos/error de Google (despliegue sin acceso "Cualquier persona").
    return { kind: "respuesta_invalida", status: res.status, detalle: snippet(text) };
  }
  if (!data || typeof data !== "object") return { kind: "respuesta_invalida", status: res.status, detalle: snippet(text) };
  if (data.ok === false) return { kind: "rechazado", error: String(data.error ?? "desconocido"), data };
  if (data.ok === true) return { kind: data.duplicado ? "duplicado" : "ok", data };
  return { kind: "respuesta_invalida", status: res.status, detalle: snippet(text) };
}

/** Texto sin secreto ni URL del Web App (el ID del despliegue es sensible). */
function redact(value, config) {
  let s = String(value ?? "");
  if (config?.secret) s = s.split(config.secret).join("***");
  if (config?.url) s = s.split(config.url).join("<url>");
  return s.replace(/https?:\/\/\S+/g, "<url>").slice(0, 300);
}

/** {name, message, code?, cause?} con la cadena de `cause`, sanitizada. */
export function errorInfo(err, config, depth = 0) {
  if (!err || typeof err !== "object") return { name: typeof err, message: redact(err, config) };
  const info = { name: String(err.name ?? "Error"), message: redact(err.message, config) };
  if (err.code !== undefined) info.code = redact(err.code, config);
  if (err.cause !== undefined && depth < 3) info.cause = errorInfo(err.cause, config, depth + 1);
  return info;
}

function describeError(err, config) {
  const parts = [];
  for (let e = errorInfo(err, config); e; e = e.cause) parts.push(`${e.name}${e.code ? `[${e.code}]` : ""}: ${e.message}`);
  return parts.join(" <- ");
}

/** HTTPS sin keep-alive (agent:false) y sin seguir redirecciones; evita reutilizar sockets cerrados por Google. */
function httpRequest(url, method, body) {
  return new Promise((resolve, reject) => {
    const headers = { Connection: "close" };
    if (body !== undefined) Object.assign(headers, { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) });
    const req = https.request(new URL(url), { method, agent: false, timeout: TIMEOUT_MS, headers }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("error", reject);
      res.on("end", () => resolve({ status: res.statusCode ?? 0, location: res.headers.location, text: Buffer.concat(chunks).toString("utf8") }));
    });
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", reject);
    req.end(body);
  });
}

function snippet(text) {
  return text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160);
}
