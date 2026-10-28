import { formatFechaCorta } from "@/lib/format";
import type { AlertaVista, Severidad, TipoAlerta } from "@/lib/types";
import { Badge, type Tone } from "./ui/ui";
import { Icon } from "./ui/icons";

export const TIPO_ALERTA: Record<TipoAlerta, string> = {
  PROXIMO_VENCER: "Próximo a vencer",
  STOCK_BAJO: "Stock bajo",
  STOCK_INSUFICIENTE: "Stock insuficiente",
};

const SEVERIDAD: Record<Severidad, { tone: Tone; label: string; bar: string }> = {
  alta: { tone: "clay", label: "Prioridad alta", bar: "bg-clay-ink" },
  media: { tone: "amber", label: "Prioridad media", bar: "bg-amber-ink" },
  baja: { tone: "sky", label: "Prioridad baja", bar: "bg-sky-ink" },
};

export function textoVencimiento(a: AlertaVista): string | null {
  if (a.fecha_vencimiento === undefined || a.dias_para_vencer === undefined) return null;
  const d = a.dias_para_vencer;
  const cuando = d < 0 ? `venció hace ${-d} d` : d === 0 ? "vence hoy" : d === 1 ? "vence mañana" : `vence en ${d} días`;
  return `${cuando} (${formatFechaCorta(`${a.fecha_vencimiento}T12:00:00-05:00`)})`;
}

export function AlertaItem({ a, compacto = false }: { a: AlertaVista; compacto?: boolean }) {
  const s = SEVERIDAD[a.severidad];
  const abierta = a.estado === "ABIERTA";
  const venc = textoVencimiento(a);
  return (
    <li className={`relative flex gap-3 ${compacto ? "px-5 py-3.5" : "p-4 sm:p-5"} ${abierta ? "" : "opacity-70"}`}>
      <span className={`absolute inset-y-3 left-0 w-0.5 rounded-full ${abierta ? s.bar : "bg-line-strong"}`} />
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-sunken text-muted">
        <Icon name={a.tipo === "PROXIMO_VENCER" ? "bell" : "alert"} className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="text-sm font-medium text-ink">{a.insumo_nombre}</p>
          <span className="text-xs text-muted">{TIPO_ALERTA[a.tipo]}</span>
        </div>
        <p className="mt-0.5 text-sm text-muted">{a.mensaje}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {abierta ? <Badge tone={s.tone}>{s.label}</Badge> : <Badge tone="sage">Resuelta</Badge>}
          {abierta && venc && <span className="text-xs text-muted">{venc}</span>}
          <span className="text-xs text-subtle">Creada {formatFechaCorta(a.creado_en)}</span>
        </div>
      </div>
    </li>
  );
}
