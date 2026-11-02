import { Suspense } from "react";
import { GRUPOS_DE_PRODUCTO } from "@/data/grupos";
import { gruposDeProductos } from "@/lib/datos";
import { PresupuestoEditable } from "./presupuesto-editable";

async function Datos() {
  return <PresupuestoEditable grupos={await gruposDeProductos()} />;
}

/** Los rubros del plan con los grupos del catálogo; mientras llegan, los de fábrica. */
export function PresupuestoConGrupos() {
  return (
    <Suspense fallback={<PresupuestoEditable grupos={GRUPOS_DE_PRODUCTO} />}>
      <Datos />
    </Suspense>
  );
}
