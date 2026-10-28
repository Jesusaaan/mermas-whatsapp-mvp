const TZ = "America/Lima";

const pen = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });
const num = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 2 });
const diaFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ });
const fechaCorta = new Intl.DateTimeFormat("es-PE", { timeZone: TZ, day: "numeric", month: "short" });
const fechaLarga = new Intl.DateTimeFormat("es-PE", { timeZone: TZ, weekday: "short", day: "numeric", month: "short" });
const hora = new Intl.DateTimeFormat("es-PE", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false });

export const formatPEN = (v: number) => pen.format(v);
export const formatNumero = (v: number) => num.format(v);

/** YYYY-MM-DD en America/Lima a partir de un ISO o una fecha. */
export const diaLima = (iso: string) => diaFmt.format(new Date(iso));
export const formatFechaCorta = (iso: string) => fechaCorta.format(new Date(iso)).replace(".", "");
export const formatFechaLarga = (iso: string) => fechaLarga.format(new Date(iso)).replace(/\./g, "");
export const formatFechaHora = (iso: string) =>
  `${formatFechaCorta(iso)}, ${hora.format(new Date(iso))}`;

/** Suma días a una fecha YYYY-MM-DD (aritmética en UTC, sin horario de verano). */
export function sumarDias(dia: string, n: number): string {
  const d = new Date(`${dia}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function diasEntre(desde: string, hasta: string): number {
  return Math.round(
    (Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)) / 86_400_000,
  );
}

/** "+51 9•• ••• 123" a partir de 519XXXXXXXX. */
export function enmascararTelefono(t: string): string {
  const d = t.replace(/\D/g, "");
  if (d.length < 9) return "••••";
  return `+${d.slice(0, 2)} ${d[2]}•• ••• ${d.slice(-3)}`;
}
