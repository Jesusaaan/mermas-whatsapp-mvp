/**
 * DATOS DE DEMOSTRACIÓN — todo lo de este archivo es ficticio.
 * No proviene de ningún restaurante real ni de Google Sheets.
 * Generación determinista (sin Date.now ni Math.random) para que el
 * servidor y el cliente rendericen lo mismo.
 */
import { sumarDias } from "../format";
import type {
  Alerta,
  DatosPanel,
  FuenteMensaje,
  InsumoCatalogo,
  Lote,
  Movimiento,
  TipoMovimiento,
  UnidadBase,
} from "../types";

const NEGOCIO = "demo-negocio";
const REFERENCIA = "2026-10-28T18:30:00-05:00";
const HOY = "2026-10-28";

interface Semilla {
  id: string;
  nombre: string;
  unidad: UnidadBase;
  stock: number;
  minimo: number;
  precio: number; // PEN por unidad base, solo para generar compras demo
  rango: [number, number]; // cantidad típica por movimiento
}

const SEMILLAS: Semilla[] = [
  { id: "ins-pollo", nombre: "Pollo entero", unidad: "kg", stock: 18.5, minimo: 10, precio: 11.8, rango: [2, 9] },
  { id: "ins-arroz", nombre: "Arroz extra", unidad: "kg", stock: 42, minimo: 25, precio: 4.2, rango: [3, 12] },
  { id: "ins-aceite", nombre: "Aceite vegetal", unidad: "l", stock: 9, minimo: 12, precio: 8.9, rango: [1, 5] },
  { id: "ins-cebolla", nombre: "Cebolla roja", unidad: "kg", stock: 14, minimo: 8, precio: 3.1, rango: [1, 6] },
  { id: "ins-tomate", nombre: "Tomate", unidad: "kg", stock: 6.5, minimo: 8, precio: 3.6, rango: [1, 5] },
  { id: "ins-papa", nombre: "Papa amarilla", unidad: "kg", stock: 30, minimo: 15, precio: 3.9, rango: [3, 10] },
  { id: "ins-limon", nombre: "Limón", unidad: "kg", stock: 3, minimo: 5, precio: 6.5, rango: [1, 4] },
  { id: "ins-pescado", nombre: "Pescado fresco", unidad: "kg", stock: 0, minimo: 6, precio: 24, rango: [1, 6] },
  { id: "ins-aji", nombre: "Ají amarillo", unidad: "kg", stock: 4, minimo: 2, precio: 9, rango: [1, 3] },
  { id: "ins-leche", nombre: "Leche evaporada", unidad: "l", stock: 12, minimo: 6, precio: 4.8, rango: [2, 8] },
  { id: "ins-huevos", nombre: "Huevos", unidad: "unidad", stock: 90, minimo: 60, precio: 0.55, rango: [12, 60] },
  { id: "ins-lechuga", nombre: "Lechuga", unidad: "unidad", stock: 8, minimo: 10, precio: 2.2, rango: [2, 10] },
  { id: "ins-queso", nombre: "Queso fresco", unidad: "kg", stock: 5, minimo: 3, precio: 19.5, rango: [1, 4] },
];

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const redondear = (v: number, paso: number) => Math.round(v / paso) * paso;
const dos = (v: number) => Math.round(v * 100) / 100;
const pad = (v: number) => String(v).padStart(2, "0");

function generarMovimientos(): Movimiento[] {
  const r = rng(20261028);
  const out: Movimiento[] = [];
  const dias = Number(HOY.slice(8));
  const motivos = ["vencido", "mal estado", "error de preparación", "sobreproducción", "caída o derrame"];
  let n = 0;
  for (let d = 1; d <= dias; d++) {
    const cuantos = 2 + Math.floor(r() * 3);
    for (let k = 0; k < cuantos; k++) {
      n++;
      const s = SEMILLAS[Math.floor(r() * SEMILLAS.length)];
      const x = r();
      const tipo: TipoMovimiento = x < 0.27 ? "compra" : x < 0.8 ? "uso" : "merma";
      const [min, max] = s.rango;
      const paso = s.unidad === "unidad" ? 1 : 0.5;
      let cantidad = redondear(min + r() * (max - min), paso);
      if (tipo === "merma") cantidad = Math.max(paso, redondear(cantidad * 0.3, paso));
      const costo =
        tipo === "compra" ? dos(cantidad * s.precio * (0.94 + r() * 0.14))
        : tipo === "merma" ? dos(cantidad * s.precio)
        : null;
      const fuenteR = r();
      const fuente: FuenteMensaje =
        tipo === "compra" ? (fuenteR < 0.8 ? "imagen" : "texto")
        : fuenteR < 0.6 ? "audio" : "texto";
      const porRevisar = r() > 0.95;
      const hora = 8 + Math.floor(r() * 13);
      const minuto = Math.floor(r() * 60);
      if (d === dias && hora >= 18) continue; // nada posterior a la hora de referencia
      out.push({
        movimiento_id: `demo-mov-${n}`,
        negocio_id: NEGOCIO,
        whatsapp_message_id: `demo-wamid-${n}`,
        linea: 1,
        fecha_hora: `${HOY.slice(0, 8)}${pad(d)}T${pad(hora)}:${pad(minuto)}:00-05:00`,
        tipo,
        insumo_id: s.id,
        insumo_nombre: s.nombre,
        cantidad,
        unidad: s.unidad,
        cantidad_base: cantidad,
        unidad_base: s.unidad,
        costo_total_pen: costo,
        motivo: tipo === "merma" ? motivos[Math.floor(r() * motivos.length)] : "",
        lote_id: "",
        estado: porRevisar ? "POR_REVISAR" : "REGISTRADO",
        fuente,
      });
    }
  }
  return out.sort((a, b) => b.fecha_hora.localeCompare(a.fecha_hora));
}

const insumos: InsumoCatalogo[] = SEMILLAS.map((s, i) => ({
  negocio_id: NEGOCIO,
  insumo_id: s.id,
  nombre: s.nombre,
  unidad_base: s.unidad,
  stock_actual: s.stock,
  stock_minimo: s.minimo,
  actualizado_en: `${sumarDias(HOY, -(i % 4))}T${pad(9 + (i % 9))}:15:00-05:00`,
}));

const lote = (id: string, insumo: string, venceEn: number, ini: number, saldo: number, u: UnidadBase): Lote => ({
  lote_id: id,
  negocio_id: NEGOCIO,
  insumo_id: insumo,
  fecha_compra: sumarDias(HOY, -3),
  fecha_vencimiento: sumarDias(HOY, venceEn),
  cantidad_inicial: ini,
  saldo,
  unidad_base: u,
});

const lotes: Lote[] = [
  lote("demo-lote-1", "ins-leche", 1, 12, 8, "l"),
  lote("demo-lote-2", "ins-pollo", 2, 20, 12, "kg"),
  lote("demo-lote-3", "ins-lechuga", 3, 12, 8, "unidad"),
  lote("demo-lote-4", "ins-queso", 5, 6, 5, "kg"),
  lote("demo-lote-5", "ins-huevos", -2, 120, 0, "unidad"),
];

type Base = Pick<Alerta, "tipo" | "insumo_id" | "mensaje"> & Partial<Alerta>;

const alerta = (n: number, a: Base, haceDias: number, hora: string): Alerta => ({
  alerta_id: `demo-alerta-${n}`,
  negocio_id: NEGOCIO,
  estado: "ABIERTA",
  whatsapp_message_id: `demo-wamid-a${n}`,
  creado_en: `${sumarDias(HOY, -haceDias)}T${hora}:00-05:00`,
  ...a,
});

const alertas: Alerta[] = [
  alerta(1, { tipo: "STOCK_INSUFICIENTE", insumo_id: "ins-pescado", mensaje: "Un uso de 3 kg superó el stock disponible; no se descontó" }, 0, "12:40"),
  alerta(2, { tipo: "PROXIMO_VENCER", insumo_id: "ins-leche", lote_id: "demo-lote-1", mensaje: "Lote con 8 l de saldo vence mañana" }, 0, "07:00"),
  alerta(3, { tipo: "PROXIMO_VENCER", insumo_id: "ins-pollo", lote_id: "demo-lote-2", mensaje: "Lote con 12 kg de saldo vence en 2 días" }, 0, "07:00"),
  alerta(4, { tipo: "STOCK_BAJO", insumo_id: "ins-aceite", mensaje: "Stock por debajo del mínimo (9 l de 12 l)" }, 1, "19:20"),
  alerta(5, { tipo: "STOCK_BAJO", insumo_id: "ins-tomate", mensaje: "Stock por debajo del mínimo (6.5 kg de 8 kg)" }, 1, "16:05"),
  alerta(6, { tipo: "PROXIMO_VENCER", insumo_id: "ins-lechuga", lote_id: "demo-lote-3", mensaje: "Lote con 8 unidades de saldo vence en 3 días" }, 0, "07:00"),
  alerta(7, { tipo: "STOCK_BAJO", insumo_id: "ins-limon", mensaje: "Stock por debajo del mínimo (3 kg de 5 kg)" }, 2, "11:30"),
  alerta(8, { tipo: "PROXIMO_VENCER", insumo_id: "ins-queso", lote_id: "demo-lote-4", mensaje: "Lote con 5 kg de saldo vence en 5 días" }, 0, "07:00"),
  alerta(9, { tipo: "PROXIMO_VENCER", insumo_id: "ins-huevos", lote_id: "demo-lote-5", estado: "RESUELTA", mensaje: "Lote vencido sin saldo; cerrado" }, 4, "07:00"),
  alerta(10, { tipo: "STOCK_INSUFICIENTE", insumo_id: "ins-aceite", estado: "RESUELTA", mensaje: "Un uso de 6 l superó el stock; se normalizó con una compra" }, 6, "13:10"),
];

export function cargarDatosDemo(): DatosPanel {
  return {
    modo: "demo",
    referencia: REFERENCIA,
    negocio: {
      negocio_id: NEGOCIO,
      nombre: "Restaurante Demo",
      telefono_propietario: "51900000001",
      telefonos_operarios: ["51900000002", "51900000003"],
      activo: true,
      creado_en: "2026-10-01T09:00:00-05:00",
    },
    insumos,
    movimientos: generarMovimientos(),
    lotes,
    alertas,
  };
}
