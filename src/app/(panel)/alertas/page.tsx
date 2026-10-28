import { AlertasView } from "@/components/alertas-view";
import { PageHeader } from "@/components/ui/ui";
import { obtenerDatosPanel } from "@/lib/datos";
import { construirAlertas } from "@/lib/panel";

export const metadata = { title: "Alertas · Mermas" };

export default async function AlertasPage() {
  const datos = await obtenerDatosPanel();
  return (
    <>
      <PageHeader
        title="Alertas"
        description="Insumos próximos a vencer y problemas de stock, ordenados por prioridad."
      />
      <AlertasView alertas={construirAlertas(datos)} />
    </>
  );
}
