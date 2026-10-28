"use client";

import { useState } from "react";
import { formatFechaLarga, formatPEN } from "@/lib/format";
import { EmptyState } from "./ui/ui";

interface Punto {
  fecha: string;
  valor: number;
}

function techo(max: number): number {
  const pasos = [10, 20, 25, 50, 100, 150, 200, 250, 500, 1000, 2000];
  return pasos.find((p) => p >= max) ?? Math.ceil(max / 1000) * 1000;
}

export function GraficoMermasDiarias({ datos }: { datos: Punto[] }) {
  const [activo, setActivo] = useState<number | null>(null);
  const max = Math.max(0, ...datos.map((d) => d.valor));

  if (max === 0) {
    return <EmptyState icon="trash" title="Sin mermas valorizadas" description="Aún no hay mermas con costo registradas este mes." />;
  }

  const tope = techo(max);
  const total = datos.reduce((s, d) => s + d.valor, 0);
  const pico = datos.reduce((a, b) => (b.valor > a.valor ? b : a));
  const sel = activo === null ? null : datos[activo];

  return (
    <div className="px-5 pb-5 pt-4">
      <div className="mb-3 min-h-10" aria-live="polite">
        {sel ? (
          <>
            <p className="text-xs text-muted capitalize">{formatFechaLarga(`${sel.fecha}T12:00:00-05:00`)}</p>
            <p className="tabular text-lg font-semibold text-ink">{formatPEN(sel.valor)}</p>
          </>
        ) : (
          <>
            <p className="text-xs text-muted">Mayor merma del mes: {formatFechaLarga(`${pico.fecha}T12:00:00-05:00`)}</p>
            <p className="tabular text-lg font-semibold text-ink">{formatPEN(pico.valor)}</p>
          </>
        )}
      </div>

      <div className="flex gap-2">
        <div className="tabular relative h-52 w-9 shrink-0 text-right text-[11px] text-subtle sm:h-60">
          {[1, 0.5, 0].map((f) => (
            <span key={f} className="absolute right-0 -translate-y-1/2" style={{ top: `${(1 - f) * 100}%` }}>
              {Math.round(tope * f)}
            </span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div className="relative h-52 sm:h-60" onMouseLeave={() => setActivo(null)}>
            {[0, 0.5, 1].map((f) => (
              <div key={f} className="absolute inset-x-0 border-t border-dashed border-line" style={{ top: `${f * 100}%` }} />
            ))}
            <div className="absolute inset-0 flex items-end gap-[3px]">
              {datos.map((d, i) => (
                <button
                  key={d.fecha}
                  type="button"
                  aria-label={`${formatFechaLarga(`${d.fecha}T12:00:00-05:00`)}: ${formatPEN(d.valor)}`}
                  onMouseEnter={() => setActivo(i)}
                  onFocus={() => setActivo(i)}
                  onClick={() => setActivo(i)}
                  className="group flex h-full min-w-0 flex-1 items-end"
                >
                  <span
                    className={`block w-full rounded-t-[3px] transition-colors ${
                      activo === i ? "bg-sage-800" : d.valor === 0 ? "bg-line" : "bg-sage-500 group-hover:bg-sage-700"
                    }`}
                    style={{ height: d.valor === 0 ? "2px" : `${Math.max((d.valor / tope) * 100, 2)}%` }}
                  />
                </button>
              ))}
            </div>
          </div>
          <div className="tabular relative mt-2 h-4 text-[11px] text-subtle">
            {datos.map((d, i) =>
              i % 7 === 0 || i === datos.length - 1 ? (
                <span
                  key={d.fecha}
                  className="absolute -translate-x-1/2"
                  style={{ left: `${((i + 0.5) / datos.length) * 100}%` }}
                >
                  {Number(d.fecha.slice(8))}
                </span>
              ) : null,
            )}
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted">
        Valor diario de mermas en PEN · total del mes <span className="tabular font-medium text-ink">{formatPEN(total)}</span>
      </p>
    </div>
  );
}
