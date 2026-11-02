"use client";

import { useMemo, useState } from "react";
import type { ProductoGestion, TiendaConConteos } from "@/lib/datos";
import { normalizarNombre } from "@/lib/importar/emparejar";
import { DialogoFusion } from "./dialogo-fusion";
import { type Formulario, HojaFormulario } from "./formularios";
import { porRevisar, TablaProductos } from "./tabla-productos";

type Props = {
  tiendas: TiendaConConteos[];
  productos: ProductoGestion[];
  conSesion: boolean;
};

const boton = "rounded-[10px] border px-3 py-1.5 text-sm";

/** Gestión del catálogo compartido: tiendas, productos, correcciones de precio y fusiones. */
export function VistaTiendas({ tiendas, productos, conSesion }: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [soloRevisar, setSoloRevisar] = useState(false);
  const [tiendaId, setTiendaId] = useState(tiendas[0]?.id ?? "");
  const [formulario, setFormulario] = useState<Formulario | null>(null);
  const [origen, setOrigen] = useState<ProductoGestion | null>(null);

  const grupos = useMemo(
    () => [...new Set(productos.map((p) => p.grupo))].sort(),
    [productos],
  );
  const tienda = tiendas.find((t) => t.id === tiendaId) ?? tiendas[0];
  const enOtros = productos.filter((p) => p.grupo === "Otros").length;
  const pendientes = productos.filter(porRevisar).length;
  const visibles = useMemo(() => {
    const q = normalizarNombre(busqueda);
    return productos.filter(
      (p) =>
        // Cada pestaña muestra lo que esa tienda sigue; un producto sin ninguna tienda sale en todas para poder ubicarlo.
        (p.tiendas.includes(tienda?.id ?? "") || p.tiendas.length === 0) &&
        (!soloRevisar || porRevisar(p)) &&
        (!q || normalizarNombre(p.nombre).includes(q)),
    );
  }, [productos, busqueda, soloRevisar, tienda]);

  return (
    <div
      className="flex flex-col gap-4"
      data-testid="vista-tiendas"
      data-tour="tiendas"
    >
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          aria-label="Buscar producto"
          placeholder="Buscar producto…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="min-w-48 flex-1 rounded-[10px] border bg-card px-3 py-1.5 text-sm"
        />
        <button
          type="button"
          disabled={!conSesion}
          onClick={() => setFormulario({ tipo: "tienda" })}
          className={boton}
        >
          Nueva tienda
        </button>
        <button
          type="button"
          disabled={!conSesion}
          onClick={() => setFormulario({ tipo: "producto" })}
          className={boton}
        >
          Nuevo producto
        </button>
      </div>
      <p
        className="text-sm text-muted-foreground"
        data-testid="resumen-tiendas"
      >
        {tiendas.length} tiendas · {productos.length} productos · {enOtros} en
        Otros
        {!conSesion && " · Inicia sesión para crear, editar o fusionar."}
      </p>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tiendas.map((t) => (
          <li
            key={t.id}
            data-testid={`tienda-${t.id}`}
            className="flex flex-col gap-1 rounded-[14px] border bg-card p-3.5"
          >
            <p className="flex items-center gap-2 font-semibold">
              <span
                aria-hidden
                className="size-3 rounded-full"
                style={{ backgroundColor: t.color }}
              />
              {t.nombre}
            </p>
            <p className="text-xs text-muted-foreground">
              {t.manual ? "Solo anotados" : "Consulta automática"} · origen{" "}
              {t.origen}
            </p>
            <p className="text-sm tabular-nums">
              {t.productos} productos con precio
              {t.ultimaFecha && ` · último ${t.ultimaFecha}`}
            </p>
            <div className="mt-1 flex gap-2">
              <button
                type="button"
                onClick={() => setTiendaId(t.id)}
                aria-pressed={t.id === tienda?.id}
                className={`${boton} ${t.id === tienda?.id ? "bg-primary text-primary-foreground" : ""}`}
              >
                Ver precios
              </button>
              {conSesion && (
                <button
                  type="button"
                  onClick={() =>
                    setFormulario({
                      tipo: "renombrar",
                      id: t.id,
                      nombre: t.nombre,
                    })
                  }
                  className={boton}
                >
                  Renombrar
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={soloRevisar}
          onChange={(e) => setSoloRevisar(e.target.checked)}
        />
        Solo por revisar ({pendientes})
      </label>
      {tienda && (
        <TablaProductos
          productos={visibles}
          tienda={tienda}
          tiendas={tiendas}
          conSesion={conSesion}
          onFusionar={setOrigen}
        />
      )}

      {formulario && (
        <HojaFormulario
          formulario={formulario}
          grupos={grupos}
          alCerrar={() => setFormulario(null)}
        />
      )}
      {origen && (
        <DialogoFusion
          origen={origen}
          productos={productos}
          alCerrar={() => setOrigen(null)}
        />
      )}
    </div>
  );
}
