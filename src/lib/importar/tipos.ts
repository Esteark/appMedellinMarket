/** Una fila ya leída del CSV de una factura. */
export type FilaCsv = {
  linea: number;
  producto: string;
  cantidad: number;
  precioTotal: number;
  tienda: string;
  fecha: string;
  codigo: string;
  /** Pregunta sobre esta fila cuando algo no quedó claro; vacía si está completa. */
  duda: string;
};

/** Qué se hace con una línea de la factura: usar un producto que ya existe, crearlo, o solo registrar el gasto. */
export type ModoFila = "existente" | "crear" | "solo_gasto";

/** La fila en la pantalla de revisión: lo que la persona puede corregir antes de guardar. */
export type FilaRevision = FilaCsv & {
  rubro: string;
  unidad: string;
  publicarPrecio: boolean;
  promocion: boolean;
  tiendaId: string | null;
  productoId: string | null;
  nuevo: boolean;
};

export type ResultadoImportacion = {
  importacionId: string;
  gastos: number;
  precios: number;
  tiendasCreadas: number;
  productosCreados: number;
  avisos: { linea: number; aviso: string }[];
};

export type ResultadoDeshacer = { restaurados: number; conservados: number };

export type ErrorCsv = { linea: number; mensaje: string };

export type LecturaCsv = {
  filas: FilaCsv[];
  /** Total impreso del recibo (`# TOTAL=…`), si vino. */
  total: number | null;
  /** Líneas `# DUDOSA: …` que dejó la IA. */
  notas: string[];
  errores: ErrorCsv[];
};
