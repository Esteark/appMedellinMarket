import { createElement } from "react";
import toast from "react-hot-toast";

export type TipoAviso = "exito" | "info" | "aviso" | "error";

/** Catálogo único de notificaciones (blueprint, paso 14). `{n}` y similares se rellenan con `datos`. */
export const AVISOS = {
  sesion_iniciada: { tipo: "exito", texto: "Hola de nuevo." },
  registro_ok: {
    tipo: "exito",
    texto: "Cuenta creada. Revisa tu correo para confirmarla.",
  },
  credenciales_malas: {
    tipo: "error",
    texto: "Correo o contraseña incorrectos.",
  },
  recuperar_enviado: {
    tipo: "info",
    texto: "Si el correo está registrado, te enviamos un enlace.",
  },
  clave_cambiada: { tipo: "exito", texto: "Contraseña actualizada." },
  sesion_cerrada: {
    tipo: "info",
    texto: "Sesión cerrada. Tu lista queda en este dispositivo.",
  },
  sesion_expirada: {
    tipo: "aviso",
    texto: "Tu sesión expiró. Inicia sesión de nuevo.",
  },
  lista_fusionada: {
    tipo: "exito",
    texto:
      "Unimos la lista de este dispositivo con la guardada ({n} productos).",
  },
  lista_no_guardada: {
    tipo: "error",
    texto:
      "No se pudo guardar tu lista. Sigue en este dispositivo y se reintenta con el próximo cambio.",
  },
  almacenamiento_no_disponible: {
    tipo: "aviso",
    texto:
      "Este navegador no deja guardar la lista. Inicia sesión para no perderla.",
  },
  lista_vaciada: { tipo: "info", texto: "Lista vaciada." },
  datos_viejos: {
    tipo: "aviso",
    texto: "Los precios son de {cuando}. Pueden estar desactualizados.",
  },
  fuentes_caidas: {
    tipo: "aviso",
    texto: "Sin datos recientes de: {tiendas}.",
  },
  resumen_alertas: { tipo: "info", texto: "Tienes {n} alertas más." },
  actualizacion_iniciada: {
    tipo: "info",
    texto:
      "Actualizando precios. Puedes seguir usando la app; te avisamos al terminar.",
  },
  actualizacion_en_curso: {
    tipo: "info",
    texto: "Ya hay una actualización en curso; te avisamos al terminar.",
  },
  actualizacion_no_necesaria: {
    tipo: "info",
    texto: "Los precios ya están al día.",
  },
  actualizacion_ok: {
    tipo: "exito",
    texto: "Precios actualizados: {ok}/{total} fuentes OK.",
  },
  actualizacion_parcial: {
    tipo: "aviso",
    texto: "Precios actualizados, pero sin datos de: {tiendas}.",
  },
  actualizacion_fallo: {
    tipo: "error",
    texto: "No se pudo iniciar la actualización. Intenta más tarde.",
  },
  actualizacion_tarda: {
    tipo: "error",
    texto:
      "La actualización no terminó en 20 minutos. Si falló, el admin recibe un correo.",
  },
  alerta_nueva: { tipo: "info", texto: "{mensaje}" },
  preferencias_guardadas: { tipo: "exito", texto: "Preferencias guardadas." },
  anotado_guardado: {
    tipo: "exito",
    texto: "Precio anotado: {precio} en {tienda}.",
  },
  anotado_invalido: {
    tipo: "error",
    texto: "El precio debe ser un entero entre 100 y 10.000.000.",
  },
  anotar_sin_sesion: {
    tipo: "info",
    texto: "Inicia sesión para anotar precios.",
  },
  plan_usado: {
    tipo: "info",
    texto: "Tu lista ahora es el plan {plan} ({n} productos).",
  },
  plan_sumado: {
    tipo: "exito",
    texto: "Sumamos {n} productos del plan {plan} a tu lista.",
  },
  sin_conexion: {
    tipo: "error",
    texto: "Sin conexión. Revisa tu internet e intenta de nuevo.",
  },
} as const satisfies Record<string, { tipo: TipoAviso; texto: string }>;

export type ClaveAviso = keyof typeof AVISOS;

/** Avisos que una redirección del servidor puede pedir con `?aviso=` (lista cerrada). */
export const AVISOS_DE_URL: ClaveAviso[] = [
  "sesion_iniciada",
  "registro_ok",
  "clave_cambiada",
  "sesion_cerrada",
];

const DURACION: Record<TipoAviso, number> = {
  exito: 4000,
  info: 4000,
  aviso: 6000,
  error: 8000,
};
const ICONO: Record<TipoAviso, string> = {
  exito: "✓",
  info: "ℹ",
  aviso: "!",
  error: "✕",
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

/** Muestra un aviso del catálogo. Cada clave es su propio id: no se repite en pantalla. */
export function avisar(
  clave: ClaveAviso,
  datos: Record<string, string | number> = {},
  accion?: Accion,
  id: string = clave,
) {
  const { tipo } = AVISOS[clave];
  const texto = textoAviso(clave, datos);
  const opciones = {
    id,
    duration: accion ? Math.max(6000, DURACION[tipo]) : DURACION[tipo],
    icon: ICONO[tipo],
    className: `aviso aviso-${tipo}`,
    ariaProps:
      tipo === "error"
        ? ({ role: "alert", "aria-live": "assertive" } as const)
        : ({ role: "status", "aria-live": "polite" } as const),
  };
  if (!accion) return toast(texto, opciones);
  return toast(
    (t) =>
      createElement(
        "span",
        { className: "flex items-center gap-3" },
        createElement("span", null, texto),
        createElement(
          "button",
          {
            type: "button",
            className: "flex-none font-semibold underline underline-offset-2",
            onClick: () => {
              toast.dismiss(t.id);
              accion.alPulsar();
            },
          },
          accion.texto,
        ),
      ),
    opciones,
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
