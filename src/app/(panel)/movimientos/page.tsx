import { MovimientosView } from "@/components/movimientos-view";
import { PageHeader } from "@/components/ui/ui";
import { obtenerDatosPanel } from "@/lib/datos";

export const metadata = { title: "Movimientos · Mermas" };

export default async function MovimientosPage() {
  const datos = await obtenerDatosPanel();
  return (
    <>
      <PageHeader
        title="Movimientos"
        description="Compras, usos y mermas registrados por WhatsApp, con su fuente y estado de revisión."
      />
      <MovimientosView movimientos={datos.movimientos} />
    </>
  );
}
