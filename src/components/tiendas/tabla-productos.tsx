"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { editarProducto, marcarRevisado } from "@/app/tiendas/acciones";
import { EmojiSelector } from "@/components/emoji-selector";
import { CorregirPrecio } from "@/components/precios/corregir-precio";
import { avisar } from "@/lib/avisos";
import type { ProductoGestion } from "@/lib/datos";
import { pesos } from "@/lib/formato";
import { claveAviso } from "@/lib/importar/factura";

const campo = "w-full min-w-20 rounded-[10px] border bg-card px-2 py-1 text-sm";
const boton = "rounded-[10px] border px-2.5 py-1 text-xs";

type Tienda = { id: string; nombre: string };
type Props = {
  productos: ProductoGestion[];
  tienda: Tienda;
  tiendas: Tienda[];
  conSesion: boolean;
  onFusionar: (p: ProductoGestion) => void;
};

type Borrador = Pick<
  ProductoGestion,
  "nombre" | "grupo" | "unidad" | "emoji" | "frecuencia"
>;

const Boton = ({
  onClick,
  children,
}: {
  onClick: () => void;
  children: string;
}) => (
  <button type="button" className={boton} onClick={onClick}>
    {children}
  </button>
);

/** Por revisar = nació de una factura y todavía está en Otros. */
export const porRevisar = (p: ProductoGestion) =>
  p.grupo === "Otros" && !p.revisado;

/** Productos con el precio y la fecha de una tienda; edición en línea y corrección de precio con autor. */
export function TablaProductos({
  productos,
  tienda,
  tiendas,
  conSesion,
  onFusionar,
}: Props) {
  const router = useRouter();
  const [editando, setEditando] = useState<string | null>(null);
  const [borrador, setBorrador] = useState<Borrador | null>(null);
  const [precio, setPrecio] = useState<ProductoGestion | null>(null);

  const editar = (p: ProductoGestion) => {
    setEditando(p.id);
    setBorrador({
      nombre: p.nombre,
      grupo: p.grupo,
      unidad: p.unidad,
      emoji: p.emoji,
      frecuencia: p.frecuencia,
    });
  };

  const guardar = async (id: string) => {
    if (!borrador) return;
    try {
      const r = await editarProducto(id, borrador);
      if (!r.ok) return avisar(claveAviso(r.error));
      avisar("producto_editado");
      setEditando(null);
      router.refresh();
    } catch {
      avisar("sin_conexion");
    }
  };

  const revisar = async (p: ProductoGestion) => {
    const r = await marcarRevisado(p.id);
    if (!r.ok) return avisar(claveAviso(r.error));
    avisar("producto_revisado", { nombre: p.nombre });
    router.refresh();
  };

  const cambiar = (parche: Partial<Borrador>) =>
    setBorrador((b) => (b ? { ...b, ...parche } : b));

  return (
    <div className="overflow-x-auto rounded-[14px] border bg-card">
      <table className="w-full text-left text-sm" data-testid="tabla-productos">
        <thead className="border-b text-xs text-muted-foreground">
          <tr>
            <th className="px-3 py-2">Producto</th>
            <th className="px-3 py-2">Grupo</th>
            <th className="px-3 py-2">Unidad</th>
            <th className="px-3 py-2">Precio · {tienda.nombre}</th>
            {conSesion && <th className="px-3 py-2" />}
          </tr>
        </thead>
        <tbody>
          {productos.map((p) => {
            const e = p.precios[tienda.id];
            const abierta = editando === p.id && borrador;
            return (
              <tr
                key={p.id}
                data-testid={`producto-${p.id}`}
                className="border-b last:border-0"
              >
                <td className="px-3 py-2">
                  {abierta ? (
                    <span className="flex flex-col gap-1.5">
                      <input
                        aria-label="Nombre"
                        className={campo}
                        value={borrador.nombre}
                        onChange={(ev) => cambiar({ nombre: ev.target.value })}
                      />
                      <EmojiSelector
                        valor={borrador.emoji ?? ""}
                        onChange={(emoji) => cambiar({ emoji })}
                      />
                    </span>
                  ) : (
                    <>
                      {p.emoji} {p.nombre}
                      {p.tiendas.length === 0 && (
                        <span
                          data-testid="sin-tienda"
                          className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground"
                        >
                          Sin tienda
                        </span>
                      )}
                      {porRevisar(p) && (
                        <span
                          data-testid="por-revisar"
                          className="ml-2 rounded-full bg-warn-bg px-2 py-0.5 text-xs text-warn-ink"
                        >
                          Por revisar
                        </span>
                      )}
                    </>
                  )}
                </td>
                <td className="px-3 py-2">
                  {abierta ? (
                    <input
                      aria-label="Grupo"
                      className={campo}
                      value={borrador.grupo}
                      onChange={(ev) => cambiar({ grupo: ev.target.value })}
                    />
                  ) : (
                    p.grupo
                  )}
                </td>
                <td className="px-3 py-2">
                  {abierta ? (
                    <input
                      aria-label="Unidad"
                      className={campo}
                      value={borrador.unidad}
                      onChange={(ev) => cambiar({ unidad: ev.target.value })}
                    />
                  ) : (
                    p.unidad
                  )}
                </td>
                <td className="px-3 py-2 tabular-nums">
                  {abierta ? (
                    <select
                      aria-label="Frecuencia"
                      className={campo}
                      value={borrador.frecuencia}
                      onChange={(ev) =>
                        cambiar({ frecuencia: ev.target.value })
                      }
                    >
                      <option value="diaria">Diaria</option>
                      <option value="semanal">Semanal</option>
                    </select>
                  ) : e?.precio != null ? (
                    <>
                      {pesos(e.precio)}{" "}
                      <span className="text-xs text-muted-foreground">
                        {e.fecha}
                      </span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">sin dato</span>
                  )}
                </td>
                {conSesion && (
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    {abierta ? (
                      <>
                        <Boton onClick={() => guardar(p.id)}>Guardar</Boton>{" "}
                        <Boton onClick={() => setEditando(null)}>
                          Cancelar
                        </Boton>
                      </>
                    ) : (
                      <>
                        <Boton onClick={() => editar(p)}>Editar</Boton>{" "}
                        <Boton onClick={() => setPrecio(p)}>Precio</Boton>{" "}
                        <Boton onClick={() => onFusionar(p)}>Fusionar</Boton>
                        {porRevisar(p) && (
                          <Boton onClick={() => revisar(p)}>
                            Marcar revisado
                          </Boton>
                        )}
                      </>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      {precio && (
        <CorregirPrecio
          producto={precio}
          tiendas={tiendas}
          tiendaInicial={tienda.id}
          precios={Object.fromEntries(
            tiendas.map((t) => [t.id, precio.precios[t.id]?.precio ?? null]),
          )}
          corregidaEn={null}
          alCerrar={() => setPrecio(null)}
        />
      )}
    </div>
  );
}
