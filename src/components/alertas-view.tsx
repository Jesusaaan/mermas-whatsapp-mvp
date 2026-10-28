"use client";

import { useMemo, useState } from "react";
import type { AlertaVista, TipoAlerta } from "@/lib/types";
import { AlertaItem, TIPO_ALERTA } from "./alerta-item";
import { Card, Chips, EmptyState, inputClass } from "./ui/ui";

type Estado = "ABIERTA" | "RESUELTA" | "todas";

export function AlertasView({ alertas }: { alertas: AlertaVista[] }) {
  const [estado, setEstado] = useState<Estado>("ABIERTA");
  const [tipo, setTipo] = useState<"todos" | TipoAlerta>("todos");

  const visibles = useMemo(
    () => alertas.filter((a) => (estado === "todas" || a.estado === estado) && (tipo === "todos" || a.tipo === tipo)),
    [alertas, estado, tipo],
  );

  const abiertas = alertas.filter((a) => a.estado === "ABIERTA");
  const resumen = [
    { label: "Prioridad alta", n: abiertas.filter((a) => a.severidad === "alta").length, color: "text-clay-ink" },
    { label: "Prioridad media", n: abiertas.filter((a) => a.severidad === "media").length, color: "text-amber-ink" },
    { label: "Prioridad baja", n: abiertas.filter((a) => a.severidad === "baja").length, color: "text-sky-ink" },
  ];

  return (
    <>
      <div className="mb-6 grid grid-cols-3 gap-3">
        {resumen.map((r) => (
          <div key={r.label} className="rounded-xl border border-line bg-surface p-4">
            <p className={`tabular text-2xl font-semibold ${r.color}`}>{r.n}</p>
            <p className="mt-1 text-xs text-muted">{r.label}</p>
          </div>
        ))}
      </div>

      <Card>
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="overflow-x-auto">
            <Chips
              label="Filtrar por estado"
              value={estado}
              onChange={setEstado}
              options={[
                { value: "ABIERTA", label: "Abiertas" },
                { value: "RESUELTA", label: "Resueltas" },
                { value: "todas", label: "Todas" },
              ]}
            />
          </div>
          <label className="sm:w-52">
            <span className="sr-only">Filtrar por tipo</span>
            <select value={tipo} onChange={(e) => setTipo(e.target.value as "todos" | TipoAlerta)} className={inputClass}>
              <option value="todos">Todos los tipos</option>
              {(Object.keys(TIPO_ALERTA) as TipoAlerta[]).map((t) => (
                <option key={t} value={t}>{TIPO_ALERTA[t]}</option>
              ))}
            </select>
          </label>
        </div>

        {visibles.length === 0 ? (
          <EmptyState
            icon="check"
            title={alertas.length === 0 ? "Sin alertas" : "Nada que mostrar"}
            description={
              estado === "ABIERTA" && tipo === "todos"
                ? "No hay vencimientos ni problemas de stock abiertos."
                : "No hay alertas con ese estado y tipo."
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {visibles.map((a) => <AlertaItem key={a.alerta_id} a={a} />)}
          </ul>
        )}
      </Card>
    </>
  );
}
