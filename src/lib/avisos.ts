import { createElement } from "react";
import toast from "react-hot-toast";

export type TipoAviso = "exito" | "info" | "aviso" | "error";

/** Catálogo único de notificaciones (blueprint, paso 14). `{n}` y similares se rellenan con `datos`. */
export const AVISOS = {
  sesion_iniciada: { tipo: "exito", emoji: "👋", texto: "Hola de nuevo." },
  registro_ok: {
    tipo: "exito",
    emoji: "🎉",
    texto: "Cuenta creada. Revisa tu correo para confirmarla.",
  },
  credenciales_malas: {
    tipo: "error",
    emoji: "🔒",
    texto: "Correo o contraseña incorrectos.",
  },
  recuperar_enviado: {
    tipo: "info",
    emoji: "📧",
    texto: "Si el correo está registrado, te enviamos un enlace.",
  },
  clave_cambiada: {
    tipo: "exito",
    emoji: "🔑",
    texto: "Contraseña actualizada.",
  },
  correo_confirmado: {
    tipo: "exito",
    emoji: "✅",
    texto: "Correo confirmado. Ya tienes tu cuenta lista.",
  },
  sesion_cerrada: {
    tipo: "info",
    emoji: "👋",
    texto: "Sesión cerrada. Tu lista queda en este dispositivo.",
  },
  pdf_no_generado: {
    tipo: "error",
    emoji: "📄",
    texto: "No se pudo crear el PDF. Intenta de nuevo.",
  },
  sesion_no_cerrada: {
    tipo: "error",
    emoji: "🔒",
    texto: "No se pudo cerrar la sesión. Intenta de nuevo.",
  },
  sesion_expirada: {
    tipo: "aviso",
    emoji: "⏳",
    texto: "Tu sesión expiró. Inicia sesión de nuevo.",
  },
  lista_fusionada: {
    tipo: "exito",
    emoji: "🛒",
    texto:
      "Unimos la lista de este dispositivo con la guardada ({n} productos).",
  },
  lista_recortada: {
    tipo: "aviso",
    emoji: "✂️",
    texto:
      "Algunas compras pasaban el máximo de la lista (999 unidades por producto, 200 productos) y se recortaron.",
  },
  lista_no_guardada: {
    tipo: "error",
    emoji: "☁️",
    texto:
      "No se pudo guardar tu lista. Sigue en este dispositivo y se reintenta con el próximo cambio.",
  },
  almacenamiento_no_disponible: {
    tipo: "aviso",
    emoji: "💾",
    texto:
      "Este navegador no deja guardar la lista. Inicia sesión para no perderla.",
  },
  barrio_sin_precio: {
    tipo: "aviso",
    emoji: "🏷️",
    texto:
      "Los productos de barrio sin precio no entran en el total: anótalos en Anotados → barrio.",
  },
  barrio_producto_agregado: {
    tipo: "exito",
    emoji: "➕",
    texto: "Agregamos {producto} al catálogo de barrio.",
  },
  barrio_producto_quitado: {
    tipo: "info",
    emoji: "🗑️",
    texto:
      "Quitamos {producto} del catálogo de barrio. Sus precios se conservan.",
  },
  tutorial_reiniciado: {
    tipo: "info",
    emoji: "💡",
    texto: "Tutorial reiniciado. Volverá a aparecer cuando entres.",
  },
  plan_no_guardado: {
    tipo: "error",
    emoji: "☁️",
    texto:
      "No se pudo guardar el plan. Sigue en este dispositivo y se reintenta.",
  },
  plan_fusionado: {
    tipo: "exito",
    emoji: "📋",
    texto: "Unimos tu plan {plan} de este dispositivo con tu cuenta.",
  },
  plan_restaurado: {
    tipo: "info",
    emoji: "↩️",
    texto: "Restauramos el plan {plan} que tenías en este dispositivo.",
  },
  planes_fusionados: {
    tipo: "exito",
    emoji: "🗂️",
    texto: "Unimos tus presupuestos guardados con tu cuenta ({n}).",
  },
  plan_guardado: {
    tipo: "exito",
    emoji: "💾",
    texto: "Presupuesto «{nombre}» guardado.",
  },
  plan_cargado: {
    tipo: "info",
    emoji: "📂",
    texto: "«{nombre}» es ahora tu presupuesto activo.",
  },
  plan_eliminado: {
    tipo: "info",
    emoji: "🗑️",
    texto: "Presupuesto «{nombre}» eliminado.",
  },
  limite_planes: {
    tipo: "aviso",
    emoji: "🗂️",
    texto:
      "Ya tienes 20 presupuestos guardados. Elimina uno para guardar otro.",
  },
  semana_agregada: {
    tipo: "exito",
    emoji: "🗓️",
    texto: "Semana {n} agregada al plan.",
  },
  semana_quitada: {
    tipo: "info",
    emoji: "🗓️",
    texto: "Semana {n} quitada del plan.",
  },
  comida_repetida: {
    tipo: "exito",
    emoji: "🔁",
    texto: "{comida} copiada a los 7 días.",
  },
  lista_guardada: {
    tipo: "exito",
    emoji: "💾",
    texto: "Lista «{nombre}» guardada.",
  },
  lista_actualizada: {
    tipo: "exito",
    emoji: "💾",
    texto: "«{nombre}» actualizada.",
  },
  lista_cargada: {
    tipo: "info",
    emoji: "🛒",
    texto: "«{nombre}» es ahora tu lista.",
  },
  lista_sumada: {
    tipo: "exito",
    emoji: "➕",
    texto: "Sumaste «{nombre}» a tu lista.",
  },
  lista_renombrada: {
    tipo: "exito",
    emoji: "✏️",
    texto: "Lista renombrada a «{nombre}».",
  },
  lista_duplicada: {
    tipo: "exito",
    emoji: "📑",
    texto: "Creamos «{nombre}».",
  },
  lista_eliminada: {
    tipo: "info",
    emoji: "🗑️",
    texto: "Eliminaste «{nombre}».",
  },
  limite_listas: {
    tipo: "aviso",
    emoji: "📚",
    texto:
      "Puedes guardar hasta 20 listas de 200 productos. Elimina una para guardar otra.",
  },
  nombre_repetido: {
    tipo: "aviso",
    emoji: "🔁",
    texto: "Ya tienes una lista con ese nombre.",
  },
  listas_fusionadas: {
    tipo: "exito",
    emoji: "📚",
    texto: "Unimos tus listas guardadas con las de tu cuenta ({n} en total).",
  },
  lista_vaciada: { tipo: "info", emoji: "🧺", texto: "Lista vaciada." },
  datos_viejos: {
    tipo: "aviso",
    emoji: "🕰️",
    texto: "Los precios son de {cuando}. Pueden estar desactualizados.",
  },
  fuentes_caidas: {
    tipo: "aviso",
    emoji: "📡",
    texto: "Sin datos recientes de: {tiendas}.",
  },
  resumen_alertas: {
    tipo: "info",
    emoji: "🔔",
    texto: "Tienes {n} alertas más.",
  },
  actualizacion_iniciada: {
    tipo: "info",
    emoji: "🔄",
    texto:
      "Actualizando precios. Puedes seguir usando la app; te avisamos al terminar.",
  },
  actualizacion_en_curso: {
    tipo: "info",
    emoji: "⏳",
    texto: "Ya hay una actualización en curso; te avisamos al terminar.",
  },
  actualizacion_no_necesaria: {
    tipo: "info",
    emoji: "✅",
    texto: "Los precios ya están al día.",
  },
  actualizacion_ok: {
    tipo: "exito",
    emoji: "✅",
    texto: "Precios actualizados: {ok}/{total} fuentes OK.",
  },
  actualizacion_parcial: {
    tipo: "aviso",
    emoji: "⚠️",
    texto: "Precios actualizados, pero sin datos de: {tiendas}.",
  },
  actualizacion_fallo: {
    tipo: "error",
    emoji: "❌",
    texto: "No se pudo iniciar la actualización. Intenta más tarde.",
  },
  actualizacion_tarda: {
    tipo: "error",
    emoji: "⌛",
    texto:
      "La actualización no terminó en 20 minutos. Si falló, el admin recibe un correo.",
  },
  alerta_nueva: { tipo: "info", emoji: "🔔", texto: "{mensaje}" },
  preferencias_guardadas: {
    tipo: "exito",
    emoji: "💾",
    texto: "Preferencias guardadas.",
  },
  anotado_guardado: {
    tipo: "exito",
    emoji: "📝",
    texto: "Precio anotado: {precio} en {tienda}.",
  },
  precio_corregido: {
    tipo: "exito",
    emoji: "📝",
    texto: "Precio corregido: {precio} en {tienda}.",
  },
  correccion_quitada: {
    tipo: "info",
    emoji: "↩️",
    texto: "Quitaste tu corrección: vuelve el precio automático.",
  },
  anotado_invalido: {
    tipo: "error",
    emoji: "✏️",
    texto: "El precio debe ser un entero entre 100 y 10.000.000.",
  },
  anotar_sin_sesion: {
    tipo: "info",
    emoji: "🔐",
    texto: "Inicia sesión para anotar precios.",
  },
  plan_usado: {
    tipo: "info",
    emoji: "📋",
    texto: "Tu lista ahora es el plan {plan} ({n} productos).",
  },
  plan_sumado: {
    tipo: "exito",
    emoji: "➕",
    texto: "Sumamos {n} productos del plan {plan} a tu lista.",
  },
  sin_conexion: {
    tipo: "error",
    emoji: "📶",
    texto: "Sin conexión. Revisa tu internet e intenta de nuevo.",
  },
  presupuesto_guardado: {
    tipo: "exito",
    emoji: "💾",
    texto: "Presupuesto guardado.",
  },
  presupuesto_restaurado: {
    tipo: "info",
    emoji: "↩️",
    texto: "Presupuesto restaurado al sugerido.",
  },
  gasto_agregado: {
    tipo: "exito",
    emoji: "🧾",
    // biome-ignore lint/suspicious/noTemplateCurlyInString: "$" es el peso y {monto} el marcador
    texto: "Gasto agregado: ${monto} en {rubro}.",
  },
  gasto_eliminado: {
    tipo: "info",
    emoji: "🗑️",
    texto: "Gasto eliminado.",
  },
  presupuesto_fusionado: {
    tipo: "exito",
    emoji: "🔄",
    texto: "Unimos tu presupuesto y gastos de este dispositivo con tu cuenta.",
  },
  importacion_lista: {
    tipo: "exito",
    emoji: "🧾",
    texto: "Importamos {gastos} gastos y {precios} precios.",
  },
  importacion_duplicada: {
    tipo: "aviso",
    emoji: "🔁",
    texto:
      "Ese archivo ya se importó con esa fecha. Deshaz el lote si quieres repetirlo.",
  },
  importacion_error: {
    tipo: "error",
    emoji: "❌",
    texto:
      "No se pudo importar la factura. Revisa el archivo e intenta de nuevo.",
  },
  importacion_deshecha: {
    tipo: "info",
    emoji: "↩️",
    texto:
      "Deshicimos la importación: {restaurados} precios restaurados, {conservados} conservados.",
  },
  importacion_sin_cambios: {
    tipo: "info",
    emoji: "🟰",
    texto: "La importación no cambió ningún precio.",
  },
  factura_total_no_cuadra: {
    tipo: "aviso",
    emoji: "🧮",
    texto:
      "La suma de las líneas no cuadra con el total impreso de la factura.",
  },
  tienda_creada: {
    tipo: "info",
    emoji: "🏪",
    texto: "Creamos la tienda «{nombre}».",
  },
  producto_creado: {
    tipo: "info",
    emoji: "🆕",
    texto: "Creamos el producto «{nombre}». Revísalo en Tiendas.",
  },
  precio_publicado: {
    tipo: "info",
    emoji: "📣",
    texto: "Los precios de la factura serán visibles para todos.",
  },
  precio_no_publicado: {
    tipo: "info",
    emoji: "🔒",
    texto: "Solo se guardan tus gastos; los precios no se publican.",
  },
  precio_mas_nuevo: {
    tipo: "aviso",
    emoji: "🕓",
    texto: "Ya había un precio más nuevo en {tienda}; no lo cambiamos.",
  },
  gastos_sincronizados: {
    tipo: "exito",
    emoji: "☁️",
    texto: "Subimos {n} gastos de este dispositivo a tu cuenta.",
  },
  gasto_editado: { tipo: "exito", emoji: "✏️", texto: "Gasto actualizado." },
  archivo_no_csv: {
    tipo: "aviso",
    emoji: "📄",
    texto: "Solo se leen archivos .csv. Abre el Excel y guárdalo como CSV.",
  },
  limite_tiendas: {
    tipo: "aviso",
    emoji: "🏪",
    texto: "Hoy ya creaste 5 tiendas. Intenta mañana o usa una existente.",
  },
  limite_productos: {
    tipo: "aviso",
    emoji: "🆕",
    texto: "Hoy ya creaste 50 productos. Intenta mañana o usa uno existente.",
  },
  nombre_invalido: {
    tipo: "aviso",
    emoji: "🔤",
    texto: "El nombre de la tienda o del producto no es válido.",
  },
  tienda_renombrada: {
    tipo: "exito",
    emoji: "✏️",
    texto: "Tienda renombrada a «{nombre}».",
  },
  tienda_nombre_repetido: {
    tipo: "aviso",
    emoji: "🔁",
    texto:
      "Ya existe una tienda con ese nombre (sin importar tildes ni mayúsculas).",
  },
  producto_agregado_a_tienda: {
    tipo: "exito",
    emoji: "🏪",
    texto: "«{nombre}» ahora está en {tienda}.",
  },
  producto_quitado_de_tienda: {
    tipo: "info",
    emoji: "🏪",
    texto: "«{nombre}» salió de {tienda}. Sus precios se conservan.",
  },
  catalogo_error: {
    tipo: "error",
    emoji: "❌",
    texto: "No se pudo actualizar el catálogo de la tienda. Intenta de nuevo.",
  },
  producto_editado: {
    tipo: "exito",
    emoji: "✏️",
    texto: "Producto actualizado.",
  },
  producto_revisado: {
    tipo: "exito",
    emoji: "✅",
    texto: "Marcaste «{nombre}» como revisado.",
  },
  producto_fusionado: {
    tipo: "exito",
    emoji: "🧩",
    texto: "Fusionamos «{origen}» en «{destino}».",
  },
  fusion_sin_datos: {
    tipo: "aviso",
    emoji: "🧩",
    texto: "Elige el producto de origen y el de destino para fusionar.",
  },
  fusion_no_permitida: {
    tipo: "aviso",
    emoji: "🚫",
    texto: "No se puede fusionar un producto consigo mismo.",
  },
  precio_fuera_de_rango: {
    tipo: "aviso",
    emoji: "💲",
    texto: "El precio queda fuera del rango permitido (100 a 10.000.000).",
  },
} as const satisfies Record<
  string,
  { tipo: TipoAviso; emoji: string; texto: string }
>;

export const TIPS = {
  presupuesto_cuadrar: {
    tipo: "info" as const,
    emoji: "💡",
    texto: "Cuadra tu presupuesto por rubro para ver desfases al instante.",
  },
  presupuesto_agregar_producto: {
    tipo: "info" as const,
    emoji: "🛒",
    texto:
      "Agrega gastos por producto con cantidad y precio para mayor detalle.",
  },
  presupuesto_historico: {
    tipo: "info" as const,
    emoji: "📊",
    texto: "Guarda el cierre de mes para ver la evolución año tras año.",
  },
} as const satisfies Record<
  string,
  { tipo: TipoAviso; emoji: string; texto: string }
>;

export type ClaveTip = keyof typeof TIPS;

export type ClaveAviso = keyof typeof AVISOS;

/** Avisos que una redirección del servidor puede pedir con `?aviso=` (lista cerrada). */
export const AVISOS_DE_URL: ClaveAviso[] = [
  "sesion_iniciada",
  "registro_ok",
  "clave_cambiada",
  "correo_confirmado",
  "sesion_cerrada",
];

const DURACION: Record<TipoAviso, number> = {
  exito: 4000,
  info: 4000,
  aviso: 6000,
  error: 8000,
};

/** Texto del aviso con sus `{marcadores}` rellenados. */
export function textoAviso(
  clave: ClaveAviso,
  datos: Record<string, string | number> = {},
): string {
  return (
    AVISOS[clave].texto
      .replace(/\{(\w+)\}/g, (_, k: string) => String(datos[k] ?? ""))
      // "6:06 a. m." al final de un marcador no deja doble punto.
      .replace(/\.\./g, ".")
  );
}

type Accion = { texto: string; alPulsar: () => void };

/**
 * Muestra un aviso del catálogo: emoji en un círculo del color del tipo, texto, acción opcional,
 * botón de cerrar y una barra con el tiempo que le queda. Cada clave es su propio id: no se repite.
 */
export function avisar(
  clave: ClaveAviso,
  datos: Record<string, string | number> = {},
  accion?: Accion,
  id: string = clave,
) {
  const { tipo, emoji } = AVISOS[clave];
  const texto = textoAviso(clave, datos);
  const duracion = accion ? Math.max(6000, DURACION[tipo]) : DURACION[tipo];
  const boton = (props: object, contenido: string) =>
    createElement("button", { type: "button", ...props }, contenido);
  return toast(
    (t) =>
      createElement(
        "span",
        { className: "aviso-cuerpo" },
        createElement("span", { className: "aviso-texto" }, texto),
        accion &&
          boton(
            {
              className: "aviso-accion",
              onClick: () => {
                toast.dismiss(t.id);
                accion.alPulsar();
              },
            },
            accion.texto,
          ),
        boton(
          {
            className: "aviso-cerrar",
            "aria-label": "Cerrar aviso",
            onClick: () => toast.dismiss(t.id),
          },
          "×",
        ),
      ),
    {
      id,
      duration: duracion,
      icon: createElement(
        "span",
        { className: "aviso-icono", "aria-hidden": true },
        emoji,
      ),
      className: `aviso aviso-${tipo}`,
      style: { "--duracion": `${duracion}ms` } as React.CSSProperties,
      ariaProps:
        tipo === "error"
          ? ({ role: "alert", "aria-live": "assertive" } as const)
          : ({ role: "status", "aria-live": "polite" } as const),
    },
  );
}

/** El resumen sale una vez por día y dispositivo: solo si lo último guardado no es hoy. */
export function debeResumir(ultimo: string | null, hoy: string): boolean {
  return ultimo !== hoy;
}

/** Hasta 3 alertas en toasts propios; el resto se resume en uno. */
export function seleccionarResumen<T>(alertas: T[]): {
  mostrar: T[];
  resto: number;
} {
  return {
    mostrar: alertas.slice(0, 3),
    resto: Math.max(0, alertas.length - 3),
  };
}

export const LIMITE_SEGUIMIENTO_MS = 20 * 60_000;

/** Seguimiento del botón "Actualizar precios": hay corrida nueva, se agotó el tiempo o se espera. */
export function siguienteEstado(
  seguimiento: { inicio: number; desde: string | null },
  ultimaCorrida: string | null,
  ahora: number,
): "ok" | "tarda" | "esperando" {
  if (
    ultimaCorrida &&
    (!seguimiento.desde ||
      Date.parse(ultimaCorrida) > Date.parse(seguimiento.desde))
  )
    return "ok";
  if (ahora - seguimiento.inicio >= LIMITE_SEGUIMIENTO_MS) return "tarda";
  return "esperando";
}
