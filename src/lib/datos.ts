import { cargarDatosDemo } from "./demo/datos-demo";
import type { DatosPanel } from "./types";

/**
 * Punto único de acceso a datos del panel (solo servidor).
 * Hoy devuelve datos de DEMOSTRACIÓN. Para conectar datos reales, sustituir el
 * cuerpo por un adaptador que lea Google Sheets en servidor, filtrando por el
 * negocio de la sesión autenticada (aún no implementada).
 */
export async function obtenerDatosPanel(): Promise<DatosPanel> {
  return cargarDatosDemo();
}
