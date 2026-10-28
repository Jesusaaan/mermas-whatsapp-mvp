import Link from "next/link";
import { AlertaItem } from "@/components/alerta-item";
import { GraficoMermasDiarias } from "@/components/bar-chart";
import { TipoBadge } from "@/components/etiquetas";
import { Card, EmptyState, PageHeader, StatCard } from "@/components/ui/ui";
import { obtenerDatosPanel } from "@/lib/datos";
import { formatFechaHora, formatNumero, formatPEN } from "@/lib/format";
import { construirAlertas, mermasPorDia, resumenMensual, topMermas } from "@/lib/panel";

export const metadata = { title: "Dashboard · Mermas" };

export default async function DashboardPage() {
  const datos = await obtenerDatosPanel();
  const r = resumenMensual(datos);
  const porDia = mermasPorDia(datos);
  const top = topMermas(datos);
  const abiertas = construirAlertas(datos).filter((a) => a.estado === "ABIERTA");
  const prioritarias = abiertas.slice(0, 4);
  const ultimos = datos.movimientos.slice(0, 5);
  const maxTop = Math.max(1, ...top.map((t) => t.valor));

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Resumen de ${r.mesLabel} para ${datos.negocio.nombre}. Cifras simuladas con fines de demostración.`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Valor de mermas"
          value={formatPEN(r.valorMermas)}
          hint={`${r.registrosMerma} registros${r.mermasSinCosto ? ` · ${r.mermasSinCosto} sin costo` : ""}`}
          icon="trash"
          tone="clay"
        />
        <StatCard label="Compras" value={formatPEN(r.valorCompras)} hint={`${r.registrosCompra} compras registradas`} icon="cart" tone="sage" />
        <StatCard
          label="Alertas abiertas"
          value={String(r.alertasAbiertas)}
          hint={`${abiertas.filter((a) => a.severidad === "alta").length} de prioridad alta`}
          icon="bell"
          tone="amber"
        />
        <StatCard
          label="Registros del mes"
          value={String(r.registros)}
          hint={r.porRevisar ? `${r.porRevisar} por revisar` : "Todos registrados"}
          icon="list"
          tone="sky"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card
          title="Mermas por fecha"
          subtitle="Valor diario en PEN, mes en curso"
          className="lg:col-span-2"
        >
          <GraficoMermasDiarias datos={porDia} />
        </Card>

        <Card title="Alertas prioritarias" subtitle="Lo que requiere atención primero" action={
          <Link href="/alertas" className="text-xs font-medium text-sage-700 hover:text-sage-900">Ver todas</Link>
        }>
          {prioritarias.length === 0 ? (
            <EmptyState icon="check" title="Sin alertas abiertas" description="No hay vencimientos ni problemas de stock pendientes." />
          ) : (
            <ul className="divide-y divide-line">
              {prioritarias.map((a) => <AlertaItem key={a.alerta_id} a={a} compacto />)}
            </ul>
          )}
        </Card>

        <Card title="Insumos más desperdiciados" subtitle="Por valor de merma en el mes" className="lg:col-span-2">
          {top.length === 0 ? (
            <EmptyState icon="trash" title="Sin mermas este mes" description="Cuando el equipo registre mermas por WhatsApp aparecerán aquí." />
          ) : (
            <ol className="divide-y divide-line">
              {top.map((t, i) => (
                <li key={t.nombre} className="flex items-center gap-4 px-5 py-3">
                  <span className="tabular w-4 text-xs text-subtle">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="truncate text-sm font-medium text-ink">{t.nombre}</p>
                      <p className="tabular shrink-0 text-sm font-medium text-ink">{formatPEN(t.valor)}</p>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-sunken">
                      <div className="h-full rounded-full bg-sage-500" style={{ width: `${(t.valor / maxTop) * 100}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {formatNumero(t.cantidad)} {t.unidad} · {t.veces} {t.veces === 1 ? "registro" : "registros"}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card title="Últimos registros" subtitle="Vía WhatsApp" action={
          <Link href="/movimientos" className="text-xs font-medium text-sage-700 hover:text-sage-900">Ver todos</Link>
        }>
          {ultimos.length === 0 ? (
            <EmptyState icon="list" title="Sin registros" description="Aún no hay movimientos." />
          ) : (
            <ul className="divide-y divide-line">
              {ultimos.map((m) => (
                <li key={m.movimiento_id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{m.insumo_nombre}</p>
                    <p className="tabular text-xs text-muted">
                      {formatNumero(m.cantidad)} {m.unidad} · {formatFechaHora(m.fecha_hora)}
                    </p>
                  </div>
                  <TipoBadge tipo={m.tipo} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <p className="mt-6 text-xs text-subtle">
        El panel no calcula ahorros: requeriría una línea base y una metodología validadas con datos reales del piloto.
      </p>
    </>
  );
}
