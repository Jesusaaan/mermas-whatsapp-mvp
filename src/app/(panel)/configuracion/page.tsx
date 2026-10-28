import { Badge, Card, PageHeader, type Tone } from "@/components/ui/ui";
import { obtenerDatosPanel } from "@/lib/datos";
import { enmascararTelefono, formatFechaCorta } from "@/lib/format";

export const metadata = { title: "Configuración · Mermas" };

const INTEGRACIONES: { nombre: string; detalle: string; estado: string; tone: Tone }[] = [
  { nombre: "WhatsApp Cloud API (Meta)", detalle: "Webhook de captura de mensajes.", estado: "No conectado", tone: "neutral" },
  { nombre: "Lectura de Google Sheets", detalle: "Lectura del panel desde el servidor.", estado: "Pendiente", tone: "amber" },
  { nombre: "Escritura vía Apps Script", detalle: "Cliente implementado en el servidor; sin verificación desde el panel.", estado: "Sin verificar", tone: "amber" },
  { nombre: "Lectura de boletas y audios (IA)", detalle: "Fase posterior del proyecto.", estado: "No activada", tone: "neutral" },
  { nombre: "Acceso seguro al panel", detalle: "Enlace o código de acceso con duración limitada.", estado: "No implementado", tone: "neutral" },
];

function Fila({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <dt className="text-sm text-muted">{k}</dt>
      <dd className="text-sm font-medium text-ink">{v}</dd>
    </div>
  );
}

export default async function ConfiguracionPage() {
  const { negocio } = await obtenerDatosPanel();
  return (
    <>
      <PageHeader title="Configuración" description="Datos del negocio y estado de las integraciones. Ningún dato de esta pantalla es editable todavía." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Negocio" subtitle="Datos de demostración, no corresponden a un restaurante real">
          <dl className="divide-y divide-line px-5">
            <Fila k="Nombre" v={negocio.nombre} />
            <Fila k="Identificador" v={<span className="font-mono text-xs">{negocio.negocio_id}</span>} />
            <Fila k="Estado" v={<Badge tone={negocio.activo ? "sage" : "neutral"}>{negocio.activo ? "Activo" : "Inactivo"}</Badge>} />
            <Fila k="Propietario" v={<span className="tabular">{enmascararTelefono(negocio.telefono_propietario)}</span>} />
            <Fila k="Operarios" v={<span className="tabular">{negocio.telefonos_operarios.map(enmascararTelefono).join(" · ")}</span>} />
            <Fila k="Creado" v={formatFechaCorta(negocio.creado_en)} />
            <Fila k="Moneda y zona horaria" v="PEN · America/Lima" />
          </dl>
        </Card>

        <Card title="Integraciones" subtitle="Ninguna conexión real está activa desde este panel">
          <ul className="divide-y divide-line">
            {INTEGRACIONES.map((i) => (
              <li key={i.nombre} className="flex items-start justify-between gap-4 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{i.nombre}</p>
                  <p className="mt-0.5 text-xs text-muted">{i.detalle}</p>
                </div>
                <Badge tone={i.tone}>{i.estado}</Badge>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Cómo se registran los datos" className="lg:col-span-2">
          <p className="px-5 py-4 text-sm text-muted">
            Las compras, usos y mermas se registran únicamente enviando una foto de boleta o un audio por WhatsApp. Este
            panel solo consulta: no permite crear ni editar movimientos ni inventario.
          </p>
        </Card>
      </div>
    </>
  );
}
