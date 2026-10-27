"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useMemo, useRef, useState } from "react";
import { Carrito } from "@/components/carrito/carrito";
import { useLista } from "@/components/carrito/use-lista";
import { Deslizador } from "@/components/deslizador";
import { cascada, pulso, volar } from "@/lib/animaciones";
import type { ProductoCatalogo, TiendaCatalogo } from "@/lib/datos";
import { cn } from "@/lib/utils";
import { Fluctuacion } from "./fluctuacion";
import { Tarjeta } from "./tarjeta";

gsap.registerPlugin(useGSAP);

const normal = (s: string) =>
  s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

type Props = {
  productos: ProductoCatalogo[];
  tiendas: TiendaCatalogo[];
  /** Grupos de esta vista (básicos o antojos). */
  grupos: string[];
};

function Chip({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={onClick}
      className={cn(
        "flex-none rounded-full border px-3 py-1.5 text-[13px] font-medium",
        activo
          ? "border-primary bg-primary text-primary-foreground"
          : "bg-card",
      )}
    >
      {children}
    </button>
  );
}

export function Catalogo({ productos, tiendas, grupos }: Props) {
  const [lista, cambiar] = useLista();
  const [busqueda, setBusqueda] = useState("");
  const [grupo, setGrupo] = useState<string | null>(null);
  const [tienda, setTienda] = useState<string | null>(null);
  const rejilla = useRef<HTMLElement>(null);
  const icono = useRef<HTMLDivElement>(null);

  const tiendaDe = useMemo(
    () => new Map(tiendas.map((t) => [t.id, t])),
    [tiendas],
  );
  const visibles = useMemo(() => {
    const q = normal(busqueda.trim());
    return productos.filter(
      (p) =>
        grupos.includes(p.grupo) &&
        (!grupo || p.grupo === grupo) &&
        (!tienda || p.precios[tienda] != null) &&
        (!q || normal(p.nombre).includes(q)),
    );
  }, [productos, grupos, grupo, tienda, busqueda]);

  // 3 y 8 · Cascada al cargar o filtrar; pulso de las etiquetas de hoy.
  const { contextSafe } = useGSAP(
    () => {
      cascada(".tarjeta");
      pulso(".etiqueta-hoy");
    },
    { scope: rejilla, dependencies: [grupo, tienda, busqueda] },
  );

  // 1 · Agregar: el emoji vuela al carrito.
  const alCambiar = contextSafe(
    (id: string, delta: number, emoji: Element | null) => {
      cambiar(id, delta);
      if (delta > 0 && emoji && icono.current) volar(emoji, icono.current);
    },
  );

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 pt-4 pb-[calc(8rem+env(safe-area-inset-bottom))] lg:grid-cols-[minmax(0,1fr)_340px] lg:pb-8">
      <div className="flex min-w-0 flex-col gap-3">
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar producto"
          aria-label="Buscar producto"
          className="h-10 rounded-[10px] border border-input bg-card px-3 text-base sm:text-sm"
        />
        <fieldset className="min-w-0">
          <legend className="sr-only">Grupos</legend>
          <Deslizador className="gap-1.5 pb-0.5" data-testid="chips-grupos">
            <Chip activo={!grupo} onClick={() => setGrupo(null)}>
              Todos
            </Chip>
            {grupos.map((g) => (
              <Chip key={g} activo={grupo === g} onClick={() => setGrupo(g)}>
                {g}
              </Chip>
            ))}
          </Deslizador>
        </fieldset>
        <fieldset className="min-w-0">
          <legend className="sr-only">Tiendas</legend>
          <Deslizador className="gap-1.5 pb-0.5" data-testid="chips-tiendas">
            <Chip activo={!tienda} onClick={() => setTienda(null)}>
              Más barato
            </Chip>
            {tiendas.map((t) => (
              <Chip
                key={t.id}
                activo={tienda === t.id}
                onClick={() => setTienda(t.id)}
              >
                {t.nombre}
              </Chip>
            ))}
          </Deslizador>
        </fieldset>
        <section
          ref={rejilla}
          aria-label="Catálogo"
          data-testid="rejilla"
          className="grid grid-cols-2 gap-2.5 sm:grid-cols-3"
        >
          {visibles.map((p) => {
            const id = tienda ?? p.mejor?.tienda;
            const precio = id ? p.precios[id] : null;
            return (
              <Tarjeta
                key={p.id}
                producto={p}
                tienda={id ? tiendaDe.get(id) : undefined}
                precio={precio ?? null}
                esMejor={id === p.mejor?.tienda}
                cantidad={lista[p.id] ?? 0}
                onCambiar={(delta, emoji) => alCambiar(p.id, delta, emoji)}
              />
            );
          })}
          {visibles.length === 0 && (
            <p className="col-span-full rounded-[14px] border border-dashed bg-card p-7 text-center text-muted-foreground">
              Ningún producto coincide con la búsqueda.
            </p>
          )}
        </section>
        <Fluctuacion
          productos={productos.filter(
            (p) => grupos.includes(p.grupo) && p.serie.length >= 2,
          )}
        />
      </div>
      <Carrito
        lista={lista}
        productos={productos}
        tiendas={tiendas}
        icono={icono}
      />
    </div>
  );
}
