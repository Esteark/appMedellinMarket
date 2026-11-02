"use client";

import { useState } from "react";
import { AgregarATienda } from "./agregar-a-tienda";
import { HojaFormulario } from "./formularios";

type Tienda = { id: string; nombre: string };

/** Botón que abre «Agregar a una tienda» y, desde ahí, «Nuevo producto»; para la Canasta y Anotados. */
export function AgregarProducto({
  productos,
  tiendas,
  grupos,
  tiendaInicial,
  texto = "Agregar producto",
}: {
  productos: {
    id: string;
    nombre: string;
    emoji: string | null;
    tiendas: string[];
  }[];
  tiendas: Tienda[];
  grupos: string[];
  /** Tienda ya elegida (la del chip activo); sin ella se parte de la primera. */
  tiendaInicial?: string;
  texto?: string;
}) {
  const [paso, setPaso] = useState<"buscar" | "crear" | null>(null);
  const [tiendaId, setTiendaId] = useState(tiendaInicial);

  return (
    <>
      <button
        type="button"
        data-testid="agregar-producto"
        onClick={() => {
          setTiendaId(tiendaInicial);
          setPaso("buscar");
        }}
        className="h-10 rounded-[10px] border bg-card px-3 text-sm font-medium"
      >
        {texto}
      </button>
      {paso === "buscar" && (
        <AgregarATienda
          tiendaInicial={tiendaInicial}
          tiendas={tiendas}
          productos={productos}
          alCerrar={() => setPaso(null)}
          alCrear={(id) => {
            setTiendaId(id);
            setPaso("crear");
          }}
        />
      )}
      {paso === "crear" && (
        <HojaFormulario
          formulario={{ tipo: "producto", tiendaInicial: tiendaId }}
          grupos={grupos}
          tiendas={tiendas}
          alCerrar={() => setPaso(null)}
        />
      )}
    </>
  );
}
