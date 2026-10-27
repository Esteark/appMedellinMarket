import Link from "next/link";
import { connection } from "next/server";
import { salir } from "@/app/auth/acciones";
import { ActualizarPrecios } from "@/components/avisos/actualizar-precios";
import { frescura, type Usuario, usuario } from "@/lib/datos";
import { cuando } from "@/lib/fecha";
import { cn } from "@/lib/utils";

/** Frescura de la corrida: hora, un punto por fuente, X/N OK, fuentes viejas y banner a las 26 h. */
export async function Encabezado() {
  // Fuera del catch: en el prerender connection() se rechaza a propósito y Next debe verlo.
  await connection();
  // Si la base no responde, el encabezado lo dice y la app sigue en pie (antes tumbaba todo el layout).
  const [f, u] = await Promise.all([
    frescura().catch((e: unknown) => {
      console.error("encabezado: frescura falló:", e);
      return null;
    }),
    usuario().catch(() => null),
  ]);
  if (!f)
    return (
      <header className="border-b bg-card">
        <div
          role="alert"
          data-testid="banner-corrida"
          className="bg-up-bg px-4 py-2 text-center text-sm font-medium text-up-ink"
        >
          No se pudo leer el estado de los precios. Intenta recargar en un
          momento.
        </div>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 text-sm">
          <span className="font-semibold">Mercado Medellín</span>
          <Cuenta u={u} />
        </div>
      </header>
    );
  const vieja = f.horasDesdeCorrida == null || f.horasDesdeCorrida > 26;
  const caidas = f.fuentes.filter((x) => !x.ok).map((x) => x.nombre);
  const dias = Math.max(1, Math.floor((f.horasDesdeCorrida ?? 0) / 24));

  return (
    <header className="border-b bg-card">
      {vieja && (
        <div
          role="alert"
          data-testid="banner-corrida"
          className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 bg-up-bg px-4 py-2 text-center text-sm font-medium text-up-ink"
        >
          <span className="sm:hidden">
            {f.ultimaCorrida
              ? `Precios de hace ${dias} ${dias === 1 ? "día" : "días"}.`
              : "Todavía no hay precios."}
          </span>
          <span className="hidden sm:inline">
            {f.ultimaCorrida
              ? `La última corrida tiene más de 26 h (${cuando(f.ultimaCorrida)}). Los precios pueden estar desactualizados.`
              : "Todavía no hay ninguna corrida de precios."}
          </span>
          <ActualizarPrecios conSesion={!!u} />
        </div>
      )}
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 text-sm">
        <span className="font-semibold">Mercado Medellín</span>
        {/* En móvil el estado baja a su propia línea, compacta. */}
        <span className="order-last flex basis-full flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:order-none sm:basis-auto sm:text-sm">
          <span className="text-muted-foreground" data-testid="actualizado">
            Actualizado: {f.ultimaCorrida ? cuando(f.ultimaCorrida) : "nunca"}
          </span>
          <span className="flex items-center gap-2">
            <ul className="flex gap-1" aria-label="Estado por fuente">
              {f.fuentes.map((x) => (
                <li
                  key={x.id}
                  title={`${x.nombre}: ${x.ok ? "OK" : "caída"}`}
                  className={cn(
                    "size-2 rounded-full sm:size-2.5",
                    x.ok ? "bg-save" : "bg-up",
                  )}
                >
                  <span className="sr-only">
                    {x.nombre}: {x.ok ? "OK" : "caída"}
                  </span>
                </li>
              ))}
            </ul>
            <span className="tabular-nums" data-testid="fuentes-ok">
              {f.fuentesOk}/{f.fuentes.length} fuentes OK
            </span>
          </span>
          {caidas.length > 0 && (
            <>
              <span className="hidden text-warn-ink sm:inline">
                Sin datos recientes: {caidas.join(", ")}
              </span>
              <details className="text-warn-ink sm:hidden">
                <summary className="cursor-pointer font-medium">
                  Ver fuentes
                </summary>
                Sin datos recientes: {caidas.join(", ")}
              </details>
            </>
          )}
        </span>
        <Cuenta u={u} />
      </div>
    </header>
  );
}

/** Correo y "Salir", o el enlace para ingresar. */
function Cuenta({ u }: { u: Usuario | null }) {
  return (
    <span className="ml-auto flex items-center gap-3">
      {u ? (
        <>
          <span
            className="max-w-40 truncate text-muted-foreground sm:max-w-48"
            data-testid="usuario"
          >
            {u.email}
          </span>
          <form action={salir}>
            <button
              type="submit"
              className="font-medium underline underline-offset-2"
            >
              Salir
            </button>
          </form>
        </>
      ) : (
        <Link
          href="/ingresar"
          className="font-medium underline underline-offset-2"
        >
          Ingresar
        </Link>
      )}
    </span>
  );
}
