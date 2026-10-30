// Pasos del tutorial. Puro: ningún paso toca datos ni red. `objetivo` es el valor de `data-tour` del
// elemento real; si ese elemento no existe en la pantalla, el paso se salta.

export type Paso = {
  id: string;
  titulo: string;
  texto: string;
  objetivo: string;
};

export type Modo = "general" | "pantalla";

export const PASOS_GENERAL: Paso[] = [
  {
    id: "encabezado",
    titulo: "Frescura de los precios",
    texto:
      "Aquí ves cuándo se actualizaron los precios y cuántas fuentes respondieron hoy. Si algo está viejo, te lo decimos.",
    objetivo: "encabezado",
  },
  {
    id: "pestanas",
    titulo: "Las secciones",
    texto:
      "Canasta y Antojos son el catálogo. Hogar y Dieta son tus planes editables, Presupuesto lleva lo que gastas, Anotados es para corregir precios a mano (incluida la tienda de barrio) y Mis listas guarda tus mercados con nombre.",
    objetivo: "pestanas",
  },
  {
    id: "busqueda",
    titulo: "Busca un producto",
    texto: "Escribe el nombre y el catálogo se filtra al instante.",
    objetivo: "busqueda",
  },
  {
    id: "chips-grupo",
    titulo: "Filtra por grupo",
    texto: "Frutas, verduras, carnes, lácteos… elige un grupo o ve todos.",
    objetivo: "chips-grupo",
  },
  {
    id: "chips-tienda",
    titulo: "Compara tiendas",
    texto:
      "Por defecto ves el precio más barato de cada producto. Elige una tienda para ver solo sus precios.",
    objetivo: "chips-tienda",
  },
  {
    id: "tarjeta",
    titulo: "Cada producto",
    texto:
      "Precio, tienda más barata y etiquetas: ↑/↓ si cambió, ⏱ si el precio está viejo. El ✎ corrige el precio a mano y + lo agrega a tu lista.",
    objetivo: "tarjeta",
  },
  {
    id: "carrito",
    titulo: "Tu lista",
    texto:
      "Aquí se arma tu mercado: el total, cuánto ahorras comprando dividido entre tiendas y la lista agrupada por tienda.",
    objetivo: "carrito",
  },
  {
    id: "boton-guardar",
    titulo: "Guarda tu lista",
    texto:
      "Ponle un nombre y vuelve a ella cuando quieras desde Mis listas. Con sesión se guarda también en tu cuenta.",
    objetivo: "boton-guardar",
  },
  {
    id: "alertas-campana",
    titulo: "Alertas",
    texto:
      "Te avisamos cuando un producto de tu lista está más barato en otra tienda o cuando sube de precio.",
    objetivo: "alertas-campana",
  },
  {
    id: "bombilla",
    titulo: "Ayuda cuando la necesites",
    texto:
      "Esta bombilla abre el tutorial de la pantalla en la que estés o el recorrido general, las veces que quieras.",
    objetivo: "bombilla",
  },
];

const CATALOGO: Paso[] = PASOS_GENERAL.filter((p) =>
  ["busqueda", "chips-grupo", "chips-tienda", "tarjeta", "carrito"].includes(
    p.id,
  ),
);

/** Recorridos por pantalla: explican solo lo de esa vista. */
export const PASOS_PANTALLA: Record<string, Paso[]> = {
  "/": CATALOGO,
  "/antojos": CATALOGO,
  "/listas": [
    {
      id: "listas",
      titulo: "Tus listas guardadas",
      texto:
        "Carga una lista para reemplazar la actual, súmala sin bajar cantidades, renómbrala, duplícala o expórtala.",
      objetivo: "listas",
    },
  ],
  "/hogar": [
    {
      id: "hogar-presupuesto",
      titulo: "Tu plan de Hogar",
      texto:
        "Edita los rubros, las personas y los aportantes: el reparto se recalcula al instante. Este plan no se mezcla con lo que registras en Presupuesto.",
      objetivo: "hogar-presupuesto",
    },
  ],
  "/dieta": [
    {
      id: "dieta-plan",
      titulo: "Tu plan de Dieta",
      texto:
        "Ajusta los ítems con + y −, agrega productos propios y una nota. «Volver al sugerido» deshace tus cambios.",
      objetivo: "dieta-plan",
    },
  ],
  "/presupuesto": [
    {
      id: "presupuesto-total",
      titulo: "Presupuesto real",
      texto:
        "Registra lo que gastas y compáralo con lo presupuestado por rubro. Al cerrar el mes queda en el histórico.",
      objetivo: "presupuesto-total",
    },
  ],
  "/anotados": [
    {
      id: "anotados-tabla",
      titulo: "Precios anotados",
      texto:
        "Toca una celda para anotar el precio que viste. Queda con tu nombre y la fecha, y reemplaza al automático sin borrarlo.",
      objetivo: "anotados-tabla",
    },
  ],
  "/anotados/barrio": [
    {
      id: "barrio-progreso",
      titulo: "Tienda de barrio",
      texto:
        "Esta tienda no tiene consulta automática: aquí armas sus precios a mano. Te avisamos cuando alguno lleve días sin actualizarse.",
      objetivo: "barrio-progreso",
    },
  ],
  "/alertas": [
    {
      id: "alertas-campana",
      titulo: "Tus alertas",
      texto:
        "Las de mayor ahorro van primero. Márcalas como leídas cuando las veas.",
      objetivo: "alertas-campana",
    },
  ],
  "/producto/[id]": [
    {
      id: "producto-detalle",
      titulo: "Detalle del producto",
      texto:
        "Precio por tienda, causa del cambio según SIPSA y, en frutas y verduras, una estimación estadística a 7 días (no es un precio).",
      objetivo: "producto-detalle",
    },
  ],
};

/** `/producto/aguacate` → `/producto/[id]`; sin barra final. */
export function claveDeRuta(ruta: string): string {
  const limpia = ruta.length > 1 ? ruta.replace(/\/$/, "") : ruta;
  return limpia.startsWith("/producto/") ? "/producto/[id]" : limpia;
}

/** Rutas donde el tutorial y la bombilla no aparecen. */
export const esRutaDeAuth = (ruta: string) =>
  /^\/(ingresar|registro|recuperar|nueva-clave|auth)(\/|$)/.test(ruta);

export function pasosPara(modo: Modo, ruta: string): Paso[] {
  if (modo === "general") return PASOS_GENERAL;
  return PASOS_PANTALLA[claveDeRuta(ruta)] ?? PASOS_GENERAL;
}
