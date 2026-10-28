/**
 * Modelos del panel, alineados con las hojas de Google Sheets definidas en
 * apps-script/Code.gs (SCHEMA). Los nombres de campo replican los encabezados.
 * Las fechas se tratan como ISO 8601; "fecha" sin hora es YYYY-MM-DD (America/Lima).
 */

export type UnidadBase = "kg" | "l" | "unidad";
export type TipoMovimiento = "compra" | "uso" | "merma";
export type EstadoMovimiento = "REGISTRADO" | "POR_REVISAR";
/** Tipo de mensaje de WhatsApp de origen (hoja Mensajes_Entrada.message_type). */
export type FuenteMensaje = "texto" | "imagen" | "audio";

export interface Negocio {
  negocio_id: string;
  nombre: string;
  telefono_propietario: string;
  telefonos_operarios: string[];
  activo: boolean;
  creado_en: string;
}

export interface InsumoCatalogo {
  negocio_id: string;
  insumo_id: string;
  nombre: string;
  unidad_base: UnidadBase;
  stock_actual: number;
  stock_minimo: number;
  actualizado_en: string;
}

export interface Movimiento {
  movimiento_id: string;
  negocio_id: string;
  whatsapp_message_id: string;
  linea: number;
  fecha_hora: string;
  tipo: TipoMovimiento;
  insumo_id: string;
  insumo_nombre: string;
  cantidad: number;
  unidad: string;
  cantidad_base: number;
  unidad_base: UnidadBase;
  /** null cuando no hay costo fiable: nunca se inventa. */
  costo_total_pen: number | null;
  motivo: string;
  lote_id: string;
  estado: EstadoMovimiento;
  /** Derivado de Mensajes_Entrada.message_type vía whatsapp_message_id. */
  fuente: FuenteMensaje;
}

export interface Lote {
  lote_id: string;
  negocio_id: string;
  insumo_id: string;
  fecha_compra: string;
  fecha_vencimiento: string;
  cantidad_inicial: number;
  saldo: number;
  unidad_base: UnidadBase;
}

export type TipoAlerta =
  | "PROXIMO_VENCER"
  | "STOCK_BAJO"
  | "STOCK_INSUFICIENTE";
export type EstadoAlerta = "ABIERTA" | "RESUELTA";

export interface Alerta {
  alerta_id: string;
  negocio_id: string;
  tipo: TipoAlerta;
  insumo_id: string;
  mensaje: string;
  estado: EstadoAlerta;
  whatsapp_message_id: string;
  creado_en: string;
  /** Presente en alertas de vencimiento (hoja Lotes). */
  lote_id?: string;
}

/** Origen de los datos que alimenta al panel. */
export type ModoDatos = "demo" | "real";

export interface DatosPanel {
  modo: ModoDatos;
  /** Instante de referencia ("ahora") con el que se calculan periodos y vencimientos. */
  referencia: string;
  negocio: Negocio;
  insumos: InsumoCatalogo[];
  movimientos: Movimiento[];
  lotes: Lote[];
  alertas: Alerta[];
}

/* ---- Vistas derivadas ---- */

export type EstadoStock = "ok" | "bajo" | "agotado";

export interface FilaInventario extends InsumoCatalogo {
  /** Costo promedio ponderado de compras con costo fiable; null si no hay. */
  costo_promedio_pen: number | null;
  valor_pen: number | null;
  estado_stock: EstadoStock;
}

export type Severidad = "alta" | "media" | "baja";

export interface AlertaVista extends Alerta {
  insumo_nombre: string;
  severidad: Severidad;
  fecha_vencimiento?: string;
  dias_para_vencer?: number;
}
