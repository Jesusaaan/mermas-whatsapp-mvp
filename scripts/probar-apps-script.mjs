// Prueba manual contra el Web App real. Uso (PowerShell): ver docs/FASE_1A_SETUP.md
// Sin --ejecutar solo valida configuración y muestra el plan (no envía nada).
import { existsSync } from "node:fs";
import { getAppsScriptConfig, sendToAppsScript } from "../src/lib/apps-script-client.mjs";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const args = new Set(process.argv.slice(2));
const run = args.has("--ejecutar");
const withCompra = args.has("--compra");

const from = process.env.TEST_WHATSAPP_FROM;
const insumo = process.env.TEST_INSUMO;
const unidad = process.env.TEST_UNIDAD;
const cantidad = Number(process.env.TEST_CANTIDAD ?? "1");

let config;
try {
  config = getAppsScriptConfig();
} catch (e) {
  fail(e.message + " (definirlas en .env.local)");
}
if (!from) fail("Falta TEST_WHATSAPP_FROM en .env.local (mismo formato que Negocios: solo dígitos con código de país).");

const stamp = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
console.log(`Host: ${new URL(config.url).host} | remitente: ***${from.slice(-3)} | secreto: definido`);
if (!run) {
  console.log(
    "Modo simulación: no se envió nada. Pasos: 1) firma inválida 2) imagen PENDIENTE_IA 3) duplicado" +
      (withCompra ? " 4) compra de prueba" : " (4 solo con --compra)") +
      ". Añade --ejecutar para escribir en la hoja real."
  );
  process.exit(0);
}

let failures = 0;
const check = (name, ok, extra = "") => {
  console.log(`${ok ? "OK   " : "FALLO"} ${name}${extra ? " — " + extra : ""}`);
  if (!ok) failures++;
};
const describe = (r) =>
  r.kind === "rechazado"
    ? `rechazado:${r.error}`
    : r.kind === "ok" || r.kind === "duplicado"
      ? `${r.kind}:${r.data.estado ?? ""}`
      : `${r.kind} ${r.status ?? ""} ${r.detalle ?? ""}`.trim() + (r.error ? ` ${JSON.stringify(r.error)}` : "");

const imgPayload = { whatsapp_message_id: `wamid.TEST_IMG_${stamp}`, from, message_type: "image", movimientos: [] };

// 1) Firma inválida debe rechazarse
let r = await sendToAppsScript(imgPayload, { config, badSignature: true });
check("1 firma inválida rechazada", r.kind === "rechazado" && r.error === "firma_invalida", describe(r));

// 2) Mensaje autorizado -> PENDIENTE_IA
r = await sendToAppsScript(imgPayload, { config });
if (r.kind === "rechazado" && r.error === "remitente_no_autorizado") {
  fail("TEST_WHATSAPP_FROM no está en Negocios (propietario/operarios, con activo=TRUE).");
}
check("2 imagen registrada como PENDIENTE_IA", r.kind === "ok" && r.data.estado === "PENDIENTE_IA", describe(r));

// 3) Mismo whatsapp_message_id -> duplicado (no es error)
r = await sendToAppsScript(imgPayload, { config });
check("3 duplicado detectado", r.kind === "duplicado" && r.data.estado === "PENDIENTE_IA", describe(r));

// 4) Compra solo con un insumo de prueba existente en Insumos_Catalogo
if (!withCompra) {
  console.log("OMITIDO 4 compra: usa --compra (modifica stock_actual del insumo de prueba).");
} else if (!insumo || !unidad || !(cantidad > 0)) {
  console.log("OMITIDO 4 compra: define TEST_INSUMO, TEST_UNIDAD y opcional TEST_CANTIDAD (>0) en .env.local.");
} else {
  const p = {
    whatsapp_message_id: `wamid.TEST_COMPRA_${stamp}`,
    from,
    message_type: "text",
    movimientos: [{ tipo: "compra", insumo, cantidad, unidad, motivo: "prueba 1A" }],
  };
  r = await sendToAppsScript(p, { config });
  const linea = r.data?.lineas?.[0];
  if (linea?.motivo === "insumo_no_está_en_catalogo") {
    console.log(
      "OMITIDO 4 compra: el insumo no existe para ese negocio. Añade una fila en Insumos_Catalogo bajo los encabezados ya creados " +
        "(negocio_id, insumo_id, nombre, alias, unidad_base, stock_actual, stock_minimo, actualizado_en) y repite."
    );
  } else {
    check("4 compra registrada", r.kind === "ok" && linea?.estado === "REGISTRADO", `${describe(r)} ${linea ? linea.estado + " " + linea.motivo : ""}`);
    const again = await sendToAppsScript(p, { config });
    check("4b reenvío de la compra es duplicado", again.kind === "duplicado", describe(again));
  }
}

console.log(failures ? `\n${failures} prueba(s) fallaron.` : "\nPruebas ejecutadas: todas OK.");
process.exit(failures ? 1 : 0);

function fail(msg) {
  console.error("ERROR: " + msg);
  process.exit(1);
}
