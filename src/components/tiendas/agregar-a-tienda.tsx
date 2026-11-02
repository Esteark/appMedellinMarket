"use client";

import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";
import { agregarATienda } from "@/app/tiendas/acciones";
import { Hoja } from "@/components/hoja";
import { avisar } from "@/lib/avisos";
import type { ProductoGestion } from "@/lib/datos";
import { normalizarNombre } from "@/lib/importar/emparejar";
import { claveAviso } from "@/lib/importar/factura";

type Tienda = { id: string; nombre: string };
type Producto = Pick<ProductoGestion, "id" | "nombre" | "emoji" | "tiendas">;

/** Hoja para sumar al catálogo de una tienda un producto que ya existe, o para crear uno nuevo. */
export function AgregarATienda({
  tiendaInicial,
  tiendas,
  productos,
  alCerrar,
  alCrear,
}: {
  tiendaInicial?: string;
  tiendas: Tienda[];
  productos: Producto[];
  alCerrar: () => void;
  /** Abre «Nuevo producto» con la tienda elegida ya marcada. */
  alCrear: (tiendaId: string) => void;
}) {
  const router = useRouter();
  const titulo = useId();
  const [tiendaId, setTiendaId] = useState(
    tiendas.some((t) => t.id === tiendaInicial)
      ? (tiendaInicial as string)
      : (tiendas[0]?.id ?? ""),
  );
  const tienda = tiendas.find((t) => t.id === tiendaId) ?? tiendas[0];
  const [q, setQ] = useState("");
  const [enviando, setEnviando] = useState<string | null>(null);
  const nombres = useMemo(
    () => new Map(tiendas.map((t) => [t.id, t.nombre])),
    [tiendas],
  );

  const candidatos = useMemo(() => {
    const n = normalizarNombre(q);
    return productos
      .filter((p) => !p.tiendas.includes(tiendaId))
      .filter((p) => !n || normalizarNombre(p.nombre).includes(n))
      .slice(0, 50);
  }, [productos, q, tiendaId]);

  const agregar = async (p: Producto) => {
    if (!tienda) return;
    setEnviando(p.id);
    try {
      const r = await agregarATienda({ producto: p.id, tiendas: [tiendaId] });
      if (!r.ok) return avisar(claveAviso(r.error));
      avisar("producto_agregado_a_tienda", {
        nombre: p.nombre,
        tienda: tienda.nombre,
      });
      router.refresh();
    } catch {
      avisar("sin_conexion");
    } finally {
      setEnviando(null);
    }
  };

  if (!tienda)
    return (
      <Hoja titulo={titulo} alCerrar={alCerrar}>
        <h2 id={titulo} className="pr-20 text-lg font-bold">
          Agregar a una tienda
        </h2>
        <p className="text-sm text-muted-foreground">
          Todavía no hay tiendas. Crea una desde «Tiendas».
        </p>
      </Hoja>
    );

  return (
    <Hoja titulo={titulo} alCerrar={alCerrar}>
      <div className="flex flex-col gap-3" data-testid="agregar-a-tienda">
        <h2 id={titulo} className="pr-20 text-lg font-bold">
          Agregar a {tienda?.nombre}
        </h2>
        <label className="flex items-center gap-2 text-sm">
          Tienda
          <select
            value={tiendaId}
            onChange={(e) => setTiendaId(e.target.value)}
            className="h-10 min-w-0 flex-1 rounded-[10px] border border-input bg-card px-2 text-base sm:text-sm"
          >
            {tiendas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </select>
        </label>
        <input
          type="search"
          aria-label="Buscar producto para agregar"
          placeholder="Buscar entre los productos que esta tienda no sigue…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="h-10 rounded-[10px] border border-input bg-card px-3 text-base sm:text-sm"
        />
        <ul className="flex max-h-72 flex-col overflow-y-auto rounded-[12px] border">
          {candidatos.map((p) => (
            <li
              key={p.id}
              data-testid={`candidato-${p.id}`}
              className="flex items-center gap-2 border-b px-3 py-2 text-sm last:border-0"
            >
              <span className="min-w-0 flex-1">
                {p.emoji} {p.nombre}
                {p.tiendas.length > 0 && (
                  <span className="block text-xs text-muted-foreground">
                    También en{" "}
                    {p.tiendas.map((t) => nombres.get(t) ?? t).join(", ")}
                  </span>
                )}
              </span>
              <button
                type="button"
                disabled={enviando !== null}
                onClick={() => agregar(p)}
                className="rounded-[10px] border px-3 py-1.5 text-xs font-medium disabled:opacity-60"
              >
                {enviando === p.id ? "Agregando…" : "Agregar"}
              </button>
            </li>
          ))}
          {candidatos.length === 0 && (
            <li className="px-3 py-4 text-sm text-muted-foreground">
              Ningún producto coincide.
            </li>
          )}
        </ul>
        <button
          type="button"
          onClick={() => alCrear(tiendaId)}
          className="self-start text-sm font-medium underline underline-offset-2"
        >
          ¿No está? Crear un producto nuevo
        </button>
      </div>
    </Hoja>
  );
}
