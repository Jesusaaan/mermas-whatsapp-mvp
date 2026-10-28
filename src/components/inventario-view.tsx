"use client";

import { useMemo, useState } from "react";
import { formatFechaCorta, formatNumero, formatPEN } from "@/lib/format";
import type { EstadoStock, FilaInventario } from "@/lib/types";
import { Badge, Card, Chips, EmptyState, SearchInput, type Tone } from "./ui/ui";

const ESTADO: Record<EstadoStock, { tone: Tone; label: string }> = {
  ok: { tone: "sage", label: "Normal" },
  bajo: { tone: "amber", label: "Stock bajo" },
  agotado: { tone: "clay", label: "Agotado" },
};

type Filtro = "todos" | EstadoStock;

function NivelStock({ f }: { f: FilaInventario }) {
  const pct = Math.min(100, (f.stock_actual / Math.max(f.stock_minimo * 2, 1)) * 100);
  const color = f.estado_stock === "ok" ? "bg-sage-500" : f.estado_stock === "bajo" ? "bg-amber-ink" : "bg-clay-ink";
  return (
    <div className="h-1 w-16 overflow-hidden rounded-full bg-sunken" aria-hidden="true">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function InventarioView({ filas }: { filas: FilaInventario[] }) {
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const visibles = useMemo(() => {
    const t = q.trim().toLowerCase();
    return filas.filter((f) => (filtro === "todos" || f.estado_stock === filtro) && (!t || f.nombre.toLowerCase().includes(t)));
  }, [filas, q, filtro]);

  const valorTotal = visibles.reduce((s, f) => s + (f.valor_pen ?? 0), 0);
  const sinCosto = visibles.filter((f) => f.valor_pen === null).length;
  const hayFiltros = q !== "" || filtro !== "todos";

  return (
    <Card>
      <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={q} onChange={setQ} placeholder="Buscar insumo" />
        <div className="overflow-x-auto">
          <Chips
            label="Filtrar por estado de stock"
            value={filtro}
            onChange={setFiltro}
            options={[
              { value: "todos", label: "Todos" },
              { value: "ok", label: "Normal" },
              { value: "bajo", label: "Bajo" },
              { value: "agotado", label: "Agotado" },
            ]}
          />
        </div>
      </div>

      {visibles.length === 0 ? (
        <EmptyState
          title={filas.length === 0 ? "Aún no hay insumos" : "Sin resultados"}
          description={
            filas.length === 0
              ? "El catálogo se llena cuando se registran compras por WhatsApp."
              : "Ningún insumo coincide con la búsqueda o el filtro."
          }
          action={
            hayFiltros && (
              <button type="button" onClick={() => { setQ(""); setFiltro("todos"); }} className="text-sm font-medium text-sage-700 hover:text-sage-900">
                Limpiar filtros
              </button>
            )
          }
        />
      ) : (
        <>
          {/* Tabla ≥ md */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs font-medium text-muted">
                  <th scope="col" className="px-5 py-3">Insumo</th>
                  <th scope="col" className="px-3 py-3">Unidad</th>
                  <th scope="col" className="px-3 py-3 text-right">Stock actual</th>
                  <th scope="col" className="px-3 py-3 text-right">Costo promedio</th>
                  <th scope="col" className="px-3 py-3 text-right">Valor</th>
                  <th scope="col" className="px-3 py-3">Actualización</th>
                  <th scope="col" className="px-5 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visibles.map((f) => (
                  <tr key={f.insumo_id} className="transition hover:bg-paper">
                    <td className="px-5 py-3 font-medium text-ink">{f.nombre}</td>
                    <td className="px-3 py-3 text-muted">{f.unidad_base}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <NivelStock f={f} />
                        <span className="tabular w-14 text-right text-ink">{formatNumero(f.stock_actual)}</span>
                      </div>
                      <p className="tabular text-right text-[11px] text-subtle">mín. {formatNumero(f.stock_minimo)}</p>
                    </td>
                    <td className="tabular px-3 py-3 text-right text-ink">
                      {f.costo_promedio_pen === null ? <span className="text-subtle">Sin costo</span> : `${formatPEN(f.costo_promedio_pen)}/${f.unidad_base}`}
                    </td>
                    <td className="tabular px-3 py-3 text-right font-medium text-ink">
                      {f.valor_pen === null ? <span className="font-normal text-subtle">—</span> : formatPEN(f.valor_pen)}
                    </td>
                    <td className="px-3 py-3 text-muted">{formatFechaCorta(f.actualizado_en)}</td>
                    <td className="px-5 py-3"><Badge tone={ESTADO[f.estado_stock].tone}>{ESTADO[f.estado_stock].label}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tarjetas < md */}
          <ul className="divide-y divide-line md:hidden">
            {visibles.map((f) => (
              <li key={f.insumo_id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-ink">{f.nombre}</p>
                    <p className="tabular mt-0.5 text-xs text-muted">
                      {formatNumero(f.stock_actual)} {f.unidad_base} · mín. {formatNumero(f.stock_minimo)}
                    </p>
                  </div>
                  <Badge tone={ESTADO[f.estado_stock].tone}>{ESTADO[f.estado_stock].label}</Badge>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted">
                  <span className="tabular">
                    {f.costo_promedio_pen === null ? "Sin costo" : `${formatPEN(f.costo_promedio_pen)}/${f.unidad_base}`}
                  </span>
                  <span className="tabular font-medium text-ink">{f.valor_pen === null ? "—" : formatPEN(f.valor_pen)}</span>
                  <span>{formatFechaCorta(f.actualizado_en)}</span>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-5 py-3 text-xs text-muted">
            <span>{visibles.length} de {filas.length} insumos{sinCosto ? ` · ${sinCosto} sin costo (no se valorizan)` : ""}</span>
            <span>
              Valor del inventario: <span className="tabular font-medium text-ink">{formatPEN(valorTotal)}</span>
            </span>
          </div>
        </>
      )}
    </Card>
  );
}
