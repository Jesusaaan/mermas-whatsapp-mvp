"use client";

import { useMemo, useState } from "react";
import { diaLima, formatFechaHora, formatNumero, formatPEN } from "@/lib/format";
import type { Movimiento, TipoMovimiento } from "@/lib/types";
import { EstadoMovBadge, FUENTE, TipoBadge } from "./etiquetas";
import { Card, Chips, EmptyState, SearchInput, inputClass } from "./ui/ui";

type Filtro = "todos" | TipoMovimiento;
const PAGINA = 20;

export function MovimientosView({ movimientos }: { movimientos: Movimiento[] }) {
  const [q, setQ] = useState("");
  const [tipo, setTipo] = useState<Filtro>("todos");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [limite, setLimite] = useState(PAGINA);

  const visibles = useMemo(() => {
    const t = q.trim().toLowerCase();
    return movimientos.filter((m) => {
      const dia = diaLima(m.fecha_hora);
      return (
        (tipo === "todos" || m.tipo === tipo) &&
        (!desde || dia >= desde) &&
        (!hasta || dia <= hasta) &&
        (!t || m.insumo_nombre.toLowerCase().includes(t))
      );
    });
  }, [movimientos, q, tipo, desde, hasta]);

  const rangoInvalido = desde !== "" && hasta !== "" && desde > hasta;
  const hayFiltros = q !== "" || tipo !== "todos" || desde !== "" || hasta !== "";
  const limpiar = () => { setQ(""); setTipo("todos"); setDesde(""); setHasta(""); setLimite(PAGINA); };
  const reiniciar = <T,>(set: (v: T) => void) => (v: T) => { set(v); setLimite(PAGINA); };
  const mostrados = visibles.slice(0, limite);
  const costoTotal = visibles.reduce((s, m) => s + (m.costo_total_pen ?? 0), 0);

  return (
    <Card>
      <div className="flex flex-col gap-3 border-b border-line p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput value={q} onChange={reiniciar(setQ)} placeholder="Buscar insumo" />
          <div className="overflow-x-auto">
            <Chips
              label="Filtrar por tipo"
              value={tipo}
              onChange={reiniciar(setTipo)}
              options={[
                { value: "todos", label: "Todos" },
                { value: "compra", label: "Compras" },
                { value: "uso", label: "Usos" },
                { value: "merma", label: "Mermas" },
              ]}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs text-muted">
            Desde
            <input type="date" value={desde} max={hasta || undefined} onChange={(e) => reiniciar(setDesde)(e.target.value)} className={`${inputClass} mt-1 w-40`} />
          </label>
          <label className="text-xs text-muted">
            Hasta
            <input type="date" value={hasta} min={desde || undefined} onChange={(e) => reiniciar(setHasta)(e.target.value)} className={`${inputClass} mt-1 w-40`} />
          </label>
          {hayFiltros && (
            <button type="button" onClick={limpiar} className="h-9 text-sm font-medium text-sage-700 hover:text-sage-900">
              Limpiar filtros
            </button>
          )}
        </div>
        {rangoInvalido && <p role="alert" className="text-xs text-clay-ink">La fecha inicial es posterior a la final.</p>}
      </div>

      {visibles.length === 0 ? (
        <EmptyState
          icon="list"
          title={movimientos.length === 0 ? "Aún no hay movimientos" : "Sin resultados"}
          description={
            movimientos.length === 0
              ? "Los movimientos aparecerán cuando el equipo envíe fotos de boletas o audios por WhatsApp."
              : "No hay movimientos con esos filtros."
          }
        />
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs font-medium text-muted">
                  <th scope="col" className="px-5 py-3">Fecha</th>
                  <th scope="col" className="px-3 py-3">Tipo</th>
                  <th scope="col" className="px-3 py-3">Insumo</th>
                  <th scope="col" className="px-3 py-3 text-right">Cantidad</th>
                  <th scope="col" className="px-3 py-3 text-right">Costo</th>
                  <th scope="col" className="px-3 py-3">Fuente</th>
                  <th scope="col" className="px-5 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {mostrados.map((m) => (
                  <tr key={m.movimiento_id} className="transition hover:bg-paper">
                    <td className="whitespace-nowrap px-5 py-3 text-muted">{formatFechaHora(m.fecha_hora)}</td>
                    <td className="px-3 py-3"><TipoBadge tipo={m.tipo} /></td>
                    <td className="px-3 py-3 font-medium text-ink">
                      {m.insumo_nombre}
                      {m.motivo && <span className="block text-xs font-normal text-muted">{m.motivo}</span>}
                    </td>
                    <td className="tabular whitespace-nowrap px-3 py-3 text-right text-ink">{formatNumero(m.cantidad)} {m.unidad}</td>
                    <td className="tabular px-3 py-3 text-right text-ink">
                      {m.costo_total_pen === null ? <span className="text-subtle">—</span> : formatPEN(m.costo_total_pen)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-muted">{FUENTE[m.fuente]}</td>
                    <td className="px-5 py-3"><EstadoMovBadge estado={m.estado} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="divide-y divide-line md:hidden">
            {mostrados.map((m) => (
              <li key={m.movimiento_id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{m.insumo_nombre}</p>
                    <p className="tabular mt-0.5 text-xs text-muted">{formatNumero(m.cantidad)} {m.unidad} · {formatFechaHora(m.fecha_hora)}</p>
                  </div>
                  <TipoBadge tipo={m.tipo} />
                </div>
                <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted">
                  <span>{FUENTE[m.fuente]}</span>
                  <span className="tabular font-medium text-ink">{m.costo_total_pen === null ? "Sin costo" : formatPEN(m.costo_total_pen)}</span>
                  <EstadoMovBadge estado={m.estado} />
                </div>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3 text-xs text-muted">
            <span>
              Mostrando {mostrados.length} de {visibles.length} · costo registrado{" "}
              <span className="tabular font-medium text-ink">{formatPEN(costoTotal)}</span>
            </span>
            {mostrados.length < visibles.length && (
              <button
                type="button"
                onClick={() => setLimite((l) => l + PAGINA)}
                className="rounded-lg border border-line px-3 py-1.5 font-medium text-ink transition hover:border-line-strong hover:bg-sunken"
              >
                Mostrar más
              </button>
            )}
          </div>
        </>
      )}
    </Card>
  );
}
