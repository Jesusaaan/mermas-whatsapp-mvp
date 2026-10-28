import type { EstadoMovimiento, FuenteMensaje, TipoMovimiento } from "@/lib/types";
import { Badge, type Tone } from "./ui/ui";

const TIPO: Record<TipoMovimiento, { tone: Tone; label: string }> = {
  compra: { tone: "sage", label: "Compra" },
  uso: { tone: "sky", label: "Uso" },
  merma: { tone: "clay", label: "Merma" },
};

export const FUENTE: Record<FuenteMensaje, string> = {
  imagen: "Foto de boleta",
  audio: "Audio",
  texto: "Texto",
};

export const TipoBadge = ({ tipo }: { tipo: TipoMovimiento }) => <Badge tone={TIPO[tipo].tone}>{TIPO[tipo].label}</Badge>;

export const EstadoMovBadge = ({ estado }: { estado: EstadoMovimiento }) =>
  estado === "REGISTRADO" ? <Badge tone="sage">Registrado</Badge> : <Badge tone="amber">Por revisar</Badge>;
