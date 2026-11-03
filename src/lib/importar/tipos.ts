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
  /** Qué se hace con la línea: usar un producto que existe, crearlo o solo registrar el gasto. */
  modo: ModoFila;
  /** `true` si la persona lo eligió a mano: la vista previa del servidor ya no lo cambia. */
  modoManual: boolean;
  /** Ícono propuesto para un producto nuevo; `null` si no se reconoció ninguna palabra. */
  emoji: string | null;
  /** Grupo del catálogo propuesto para un producto nuevo. */
  grupo: string;
  /** Tamaño del producto nuevo en su unidad (2500 para «g» de un arroz de 2500 g). */
  cantidadBase: number;
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
