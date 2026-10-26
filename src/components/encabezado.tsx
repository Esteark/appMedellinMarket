import { frescura } from "@/lib/datos";
import { cuando } from "@/lib/fecha";
import { cn } from "@/lib/utils";

/** Frescura de la corrida: hora, un punto por fuente, X/N OK, fuentes viejas y banner a las 26 h. */
export async function Encabezado() {
  const f = await frescura();
  const vieja = f.horasDesdeCorrida == null || f.horasDesdeCorrida > 26;
  const caidas = f.fuentes.filter((x) => !x.ok);

  return (
    <header className="border-b bg-card">
      {vieja && (
        <div
          role="alert"
          data-testid="banner-corrida"
          className="bg-up-bg px-4 py-2 text-center text-sm font-medium text-up-ink"
        >
          {f.ultimaCorrida
            ? `La última corrida tiene más de 26 h (${cuando(f.ultimaCorrida)}). Los precios pueden estar desactualizados.`
            : "Todavía no hay ninguna corrida de precios."}
        </div>
      )}
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 text-sm">
        <span className="font-semibold">Mercado Medellín</span>
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
                  "size-2.5 rounded-full",
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
          <span className="text-warn-ink">
            Sin datos recientes: {caidas.map((x) => x.nombre).join(", ")}
          </span>
        )}
      </div>
    </header>
  );
}
