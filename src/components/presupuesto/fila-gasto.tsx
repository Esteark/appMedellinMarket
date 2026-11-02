"use client";

import type { ProductoCatalogo } from "@/lib/datos";
import { pesos } from "@/lib/formato";
import type { GastoReal } from "@/lib/presupuesto/tipos";
import { type CambiosGasto, EdicionGasto } from "./edicion-gasto";

export type { CambiosGasto };

type Props = {
  gasto: GastoReal;
  productos: Pick<ProductoCatalogo, "id" | "nombre" | "emoji">[];
  tiendas: { id: string; nombre: string }[];
  rubros: string[];
  editando: boolean;
  alEditar: () => void;
  alCancelar: () => void;
  /** Devuelve el texto del error, o `null` si se guardó. */
  alGuardar: (cambios: CambiosGasto) => Promise<string | null>;
  alEliminar: () => void;
};

const BOTON = "rounded-[10px] border px-2.5 py-1 text-xs";

/** Un gasto: en lectura (con «Editar» y «Eliminar») o, si se está editando, su formulario. */
export function FilaGasto(props: Props) {
  const { gasto: g, productos, tiendas, editando } = props;
  const producto = productos.find((p) => p.id === g.producto_id);
  const tienda = tiendas.find((t) => t.id === g.tienda_id);
  const etiqueta = `${producto?.nombre ?? g.rubro} del ${g.fecha}`;

  if (editando)
    return (
      <EdicionGasto
        gasto={g}
        productos={productos}
        tiendas={tiendas}
        rubros={props.rubros}
        alCancelar={props.alCancelar}
        alGuardar={props.alGuardar}
      />
    );

  return (
    <tr className="border-t" data-testid={`gasto-${g.id}`}>
      <td className="py-1.5 pr-2">{g.fecha}</td>
      <td className="px-2">
        {producto ? (
          <span className="flex items-center gap-1.5">
            {producto.emoji && <span>{producto.emoji}</span>}
            <span>{producto.nombre}</span>
          </span>
        ) : (
          <span className="text-muted-foreground">Manual</span>
        )}
        {(g.cantidad != null || g.descripcion) && (
          <span className="block text-xs text-muted-foreground">
            {g.cantidad != null && `×${g.cantidad} `}
            {g.descripcion}
          </span>
        )}
      </td>
      <td className="px-2">{g.rubro}</td>
      <td className="px-2 text-muted-foreground">{tienda?.nombre ?? ""}</td>
      <td className="px-2 text-right">{pesos(g.monto)}</td>
      <td className="px-2 text-muted-foreground">{g.nota ?? ""}</td>
      <td className="whitespace-nowrap pl-2 text-right">
        <button
          type="button"
          className={BOTON}
          aria-label={`Editar ${etiqueta}`}
          onClick={props.alEditar}
        >
          Editar
        </button>{" "}
        <button
          type="button"
          className={BOTON}
          aria-label={`Eliminar ${etiqueta}`}
          onClick={props.alEliminar}
        >
          Eliminar
        </button>
      </td>
    </tr>
  );
}
