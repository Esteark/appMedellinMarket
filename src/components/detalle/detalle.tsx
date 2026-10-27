import { Etiqueta } from "@/components/catalogo/etiqueta";
import type { Detalle as Datos } from "@/lib/datos";
import { Agregar } from "./agregar";
import { Barras } from "./barras";
import { Historial } from "./historial";

/** Contenido del detalle de un producto (igual en la hoja y en la página directa). */
export function Detalle({ datos }: { datos: Datos }) {
  const { producto: p, tiendas } = datos;
  const mejor = tiendas.find((t) => t.id === p.mejor?.tienda);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3 pr-20">
        <span className="text-4xl leading-none" aria-hidden="true">
          {p.emoji ?? "🛒"}
        </span>
        <div className="flex flex-col gap-1">
          <h2 id="detalle-titulo" className="text-[19px] font-semibold">
            {p.nombre}
          </h2>
          <span className="text-xs text-muted-foreground">
            {p.unidad}
            {mejor && ` · más barato en ${mejor.nombre}`}
          </span>
          <div className="flex flex-wrap gap-1">
            {p.etiquetas.map((e) => (
              <Etiqueta key={e} tipo={e} cambio={p.cambio} deHoy={p.deHoy} />
            ))}
          </div>
        </div>
      </div>

      <Barras
        tiendas={tiendas}
        precios={p.precios}
        origen={datos.origen}
        viejos={p.viejos}
        mejor={p.mejor?.tienda ?? null}
      />

      {p.causa ? (
        <div className="flex flex-col gap-1 rounded-xl bg-clima-bg px-3.5 py-3 text-[13.5px]">
          <span className="text-[11px] font-bold tracking-wider text-clima-ink uppercase">
            🌧️ Causa según SIPSA (DANE)
          </span>
          {p.causa}
        </div>
      ) : (
        p.etiquetas.some((e) => e === "sube" || e === "baja") && (
          <p className="text-sm text-muted-foreground">Causa no reportada.</p>
        )
      )}

      <section className="flex flex-col gap-1.5">
        <h3 className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
          Últimos 30 días por tienda
        </h3>
        <Historial
          datos={datos.historial}
          tiendas={tiendas}
          viejos={p.viejos}
        />
      </section>

      <Agregar id={p.id} emoji={p.emoji ?? "🛒"} />
    </div>
  );
}
