import { InventarioView } from "@/components/inventario-view";
import { PageHeader } from "@/components/ui/ui";
import { obtenerDatosPanel } from "@/lib/datos";
import { construirInventario } from "@/lib/panel";

export const metadata = { title: "Inventario · Mermas" };

export default async function InventarioPage() {
  const datos = await obtenerDatosPanel();
  return (
    <>
      <PageHeader
        title="Inventario"
        description="Stock actual por insumo. El stock cambia solo con los registros enviados por WhatsApp; esta pantalla es de solo lectura."
      />
      <InventarioView filas={construirInventario(datos)} />
    </>
  );
}
