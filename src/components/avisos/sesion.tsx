import { connection } from "next/server";
import { ordenarAlertas } from "@/lib/alertas/reglas";
import { datosSesion, frescura, usuario } from "@/lib/datos";
import { cuando } from "@/lib/fecha";
import { ResumenDelDia } from "./resumen-del-dia";
import { SincronizarLista } from "./sincronizar-lista";

/** Lo que depende de la sesión y no se ve: sincronizar la lista y el resumen del día. */
export async function Sesion() {
  await connection(); // fuera del catch: el prerender lo rechaza a propósito
  // Nada de esto es imprescindible: si la base falla, no se muestra y la app sigue.
  const r = await Promise.all([usuario(), frescura()])
    .then(async ([u, f]) => ({ f, datos: u ? await datosSesion() : null }))
    .catch((e: unknown) => {
      console.error("sesion:", e);
      return null;
    });
  if (!r) return null;
  const { f, datos } = r;
  const vieja = f.horasDesdeCorrida == null || f.horasDesdeCorrida > 26;
  return (
    <>
      {datos && <SincronizarLista guardada={datos.lista ?? {}} />}
      <ResumenDelDia
        alertas={datos ? ordenarAlertas(datos.alertas) : null}
        viejaDesde={
          vieja ? (f.ultimaCorrida ? cuando(f.ultimaCorrida) : "nunca") : null
        }
        caidas={f.fuentes.filter((x) => !x.ok).map((x) => x.nombre)}
      />
    </>
  );
}
