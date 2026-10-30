"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { avisar, debeResumir, seleccionarResumen } from "@/lib/avisos";
import { hoyBogota } from "@/lib/fecha";

const CLAVE = "mercado-medellin:resumen";

type Props = {
  /** null sin sesión. Ya ordenadas por monto. */
  alertas: { id: number; tipo: string; mensaje: string }[] | null;
  /** Texto de `cuando()` si la corrida tiene más de 26 h. */
  viejaDesde: string | null;
  caidas: string[];
};

/** Una vez por día y dispositivo: alertas de hoy o, si no hay, el estado de los datos. */
export function ResumenDelDia({ alertas, viejaDesde, caidas }: Props) {
  const router = useRouter();
  useEffect(() => {
    const hoy = hoyBogota();
    try {
      if (!debeResumir(localStorage.getItem(CLAVE), hoy)) return;
      localStorage.setItem(CLAVE, hoy);
    } catch {
      return; // Mejor nada que repetirlo en cada carga.
    }
    if (alertas?.length) {
      const { mostrar, resto } = seleccionarResumen(alertas);
      for (const a of mostrar)
        avisar(
          "alerta_nueva",
          { mensaje: a.mensaje },
          a.tipo === "precio_manual_vencido"
            ? {
                texto: "Actualizar precios de barrio",
                alPulsar: () => router.push("/anotados/barrio"),
              }
            : { texto: "Ver", alPulsar: () => router.push("/alertas") },
          `alerta-${a.id}`,
        );
      if (resto) avisar("resumen_alertas", { n: resto });
      return;
    }
    if (viejaDesde) avisar("datos_viejos", { cuando: viejaDesde });
    if (caidas.length) avisar("fuentes_caidas", { tiendas: caidas.join(", ") });
  }, [alertas, viejaDesde, caidas, router]);
  return null;
}
