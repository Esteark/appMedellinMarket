"use client";

import { useState } from "react";
import type {
  ResultadoDeshacer,
  ResultadoImportacion,
} from "@/lib/importar/tipos";

type Props = {
  /** `null` en `resultado` = la importación quedó solo en este dispositivo. */
  resultado: ResultadoImportacion | null;
  gastos: number;
  deshecho: ResultadoDeshacer | null;
  deshaciendo: boolean;
  onDeshacer: () => void;
  onOtra: () => void;
};

const AVISOS_LINEA: Record<string, string> = {
  precio_mas_nuevo: "ya había un precio más nuevo; no se cambió",
  precio_fuera_de_rango: "precio fuera de rango; solo se guardó el gasto",
};

export function ResultadoImportacionVista({
  resultado,
  gastos,
  deshecho,
  deshaciendo,
  onDeshacer,
  onOtra,
}: Props) {
  const [confirmar, setConfirmar] = useState(false);

  return (
    <section
      data-testid="importar-resultado"
      className="flex flex-col gap-3 rounded-[14px] border bg-card p-3.5"
    >
      <h2 className="text-lg font-bold">
        {deshecho ? "Importación deshecha" : "Importación lista"}
      </h2>
      {deshecho ? (
        <p className="text-sm">
          Restauramos {deshecho.restaurados} precios y conservamos{" "}
          {deshecho.conservados} que cambiaron después. Los gastos del lote se
          borraron y puedes importar el archivo otra vez.
        </p>
      ) : resultado ? (
        <ul className="text-sm">
          <li>{resultado.gastos} gastos guardados</li>
          <li>{resultado.precios} precios publicados</li>
          <li>
            {resultado.tiendasCreadas} tiendas y {resultado.productosCreados}{" "}
            productos nuevos
          </li>
        </ul>
      ) : (
        <p className="text-sm">
          Guardamos {gastos} gastos en este dispositivo. Inicia sesión para
          publicar precios y actualizar el catálogo.
        </p>
      )}
      {!deshecho && resultado && resultado.avisos.length > 0 && (
        <ul className="text-xs text-muted-foreground">
          {resultado.avisos.map((a) => (
            <li key={`${a.linea}-${a.aviso}`}>
              Línea {a.linea}: {AVISOS_LINEA[a.aviso] ?? a.aviso}
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-2">
        {!deshecho && resultado && !confirmar && (
          <button
            type="button"
            onClick={() => setConfirmar(true)}
            className="rounded-[10px] border px-3 py-1.5 text-sm"
          >
            Deshacer importación
          </button>
        )}
        {!deshecho && resultado && confirmar && (
          <button
            type="button"
            disabled={deshaciendo}
            onClick={onDeshacer}
            className="rounded-[10px] bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-60"
          >
            {deshaciendo ? "Deshaciendo…" : "Sí, deshacer este lote"}
          </button>
        )}
        <button
          type="button"
          onClick={onOtra}
          className="rounded-[10px] border px-3 py-1.5 text-sm"
        >
          Importar otra factura
        </button>
      </div>
    </section>
  );
}
