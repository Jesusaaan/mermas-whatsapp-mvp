import { diaLima, diasEntre } from "./format";
import type {
  AlertaVista,
  DatosPanel,
  FilaInventario,
  Movimiento,
  Severidad,
} from "./types";

/** Cálculos puros sobre DatosPanel; sirven igual para datos demo o reales. */

export function construirInventario(d: DatosPanel): FilaInventario[] {
  const orden = { agotado: 0, bajo: 1, ok: 2 };
  return d.insumos
    .map((i) => {
      const compras = d.movimientos.filter(
        (m) =>
          m.insumo_id === i.insumo_id &&
          m.tipo === "compra" &&
          m.estado === "REGISTRADO" &&
          m.costo_total_pen !== null &&
          m.cantidad_base > 0,
      );
      const cant = compras.reduce((s, m) => s + m.cantidad_base, 0);
      const costo = compras.reduce((s, m) => s + (m.costo_total_pen ?? 0), 0);
      const promedio = cant > 0 ? costo / cant : null;
      return {
        ...i,
        costo_promedio_pen: promedio,
        valor_pen: promedio === null ? null : promedio * i.stock_actual,
        estado_stock:
          i.stock_actual <= 0 ? "agotado" : i.stock_actual <= i.stock_minimo ? "bajo" : "ok",
      } satisfies FilaInventario;
    })
    .sort((a, b) => orden[a.estado_stock] - orden[b.estado_stock] || a.nombre.localeCompare(b.nombre));
}

export function movimientosDelMes(d: DatosPanel): Movimiento[] {
  const mes = diaLima(d.referencia).slice(0, 7);
  return d.movimientos.filter((m) => diaLima(m.fecha_hora).slice(0, 7) === mes);
}

const sumaCosto = (ms: Movimiento[]) => ms.reduce((s, m) => s + (m.costo_total_pen ?? 0), 0);

export function resumenMensual(d: DatosPanel) {
  const mes = movimientosDelMes(d);
  const mermas = mes.filter((m) => m.tipo === "merma");
  const compras = mes.filter((m) => m.tipo === "compra");
  return {
    mesLabel: new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", month: "long", year: "numeric" }).format(
      new Date(d.referencia),
    ),
    valorMermas: sumaCosto(mermas),
    mermasSinCosto: mermas.filter((m) => m.costo_total_pen === null).length,
    registrosMerma: mermas.length,
    valorCompras: sumaCosto(compras),
    registrosCompra: compras.length,
    registros: mes.length,
    porRevisar: mes.filter((m) => m.estado === "POR_REVISAR").length,
    alertasAbiertas: d.alertas.filter((a) => a.estado === "ABIERTA").length,
  };
}

/** Valor de mermas por día del mes en curso, hasta el día de referencia. */
export function mermasPorDia(d: DatosPanel) {
  const hoy = diaLima(d.referencia);
  const n = Number(hoy.slice(8));
  const prefijo = hoy.slice(0, 8);
  const porDia = new Map<string, number>();
  for (const m of movimientosDelMes(d)) {
    if (m.tipo !== "merma") continue;
    const k = diaLima(m.fecha_hora);
    porDia.set(k, (porDia.get(k) ?? 0) + (m.costo_total_pen ?? 0));
  }
  return Array.from({ length: n }, (_, i) => {
    const fecha = `${prefijo}${String(i + 1).padStart(2, "0")}`;
    return { fecha, valor: Math.round((porDia.get(fecha) ?? 0) * 100) / 100 };
  });
}

export function topMermas(d: DatosPanel, limite = 5) {
  const acc = new Map<string, { nombre: string; valor: number; cantidad: number; unidad: string; veces: number }>();
  for (const m of movimientosDelMes(d)) {
    if (m.tipo !== "merma") continue;
    const a = acc.get(m.insumo_id) ?? { nombre: m.insumo_nombre, valor: 0, cantidad: 0, unidad: m.unidad_base, veces: 0 };
    a.valor += m.costo_total_pen ?? 0;
    a.cantidad += m.cantidad_base;
    a.veces += 1;
    acc.set(m.insumo_id, a);
  }
  return [...acc.values()].sort((a, b) => b.valor - a.valor).slice(0, limite);
}

const pesoSeveridad: Record<Severidad, number> = { alta: 0, media: 1, baja: 2 };

export function construirAlertas(d: DatosPanel): AlertaVista[] {
  const hoy = diaLima(d.referencia);
  return d.alertas
    .map((a) => {
      const lote = a.lote_id ? d.lotes.find((l) => l.lote_id === a.lote_id) : undefined;
      const dias = lote ? diasEntre(hoy, lote.fecha_vencimiento) : undefined;
      let severidad: Severidad;
      if (a.tipo === "STOCK_INSUFICIENTE") severidad = "alta";
      else if (a.tipo === "STOCK_BAJO") severidad = "media";
      else severidad = dias === undefined || dias > 5 ? "baja" : dias <= 2 ? "alta" : "media";
      return {
        ...a,
        insumo_nombre: d.insumos.find((i) => i.insumo_id === a.insumo_id)?.nombre ?? a.insumo_id,
        severidad,
        fecha_vencimiento: lote?.fecha_vencimiento,
        dias_para_vencer: dias,
      } satisfies AlertaVista;
    })
    .sort(
      (a, b) =>
        Number(a.estado !== "ABIERTA") - Number(b.estado !== "ABIERTA") ||
        pesoSeveridad[a.severidad] - pesoSeveridad[b.severidad] ||
        b.creado_en.localeCompare(a.creado_en),
    );
}
