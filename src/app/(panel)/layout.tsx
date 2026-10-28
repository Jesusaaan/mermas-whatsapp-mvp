import { AppShell } from "@/components/app-shell";
import { obtenerDatosPanel } from "@/lib/datos";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { negocio } = await obtenerDatosPanel();
  return <AppShell negocio={negocio.nombre}>{children}</AppShell>;
}
