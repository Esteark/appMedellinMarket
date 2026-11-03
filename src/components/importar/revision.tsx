"use client";

import { useMemo, useState } from "react";
import type { ProductoCatalogo } from "@/lib/datos";
import {
  aplicarModo,
  contarFiltros,
  cumpleFiltro,
  decidir,
  estaCompleta,
  type Filtro,
  jefasDe,
  type ProductoElegido,
} from "@/lib/importar/decidir";
import { agrupar, type Grupo } from "@/lib/importar/grupos";
import { LIMITE_PRODUCTOS_DIA } from "@/lib/importar/limites";
import { repartirCupo, resumirFactura } from "@/lib/importar/resumen";
import type { FilaRevision, ModoFila } from "@/lib/importar/tipos";
import { BarraGuardar } from "./barra-guardar";
import { EncabezadoGrupo } from "./encabezado-grupo";
import { FilaFactura } from "./fila-factura";
import { FiltrosFactura } from "./filtros-factura";
import { ResumenDeFactura } from "./resumen-factura";

type Props = {
  filas: FilaRevision[];
  productos: ProductoCatalogo[];
  /** Cuántos productos nuevos creó ya la persona hoy; `null` sin sesión o si no se pudo leer. */
  cupo: { usados: number; limite: number } | null;
  fechaLote: string;
  conSesion: boolean;
  publicar: boolean;
  totales: Record<string, string>;
  notas: string[];
  confirmaNuevos: boolean;
  guardando: boolean;
  onFilas: (cambio: (fs: FilaRevision[]) => FilaRevision[]) => void;
  onGrupo: (g: Grupo, parche: { tienda?: string; fecha?: string }) => void;
  onPublicar: (v: boolean) => void;
  onTotal: (clave: string, v: string) => void;
  onConfirma: (v: boolean) => void;
  onActualizar: () => void;
  onGuardar: () => void;
  onVolver: () => void;
};

export function RevisionFactura(p: Props) {
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [elegidas, setElegidas] = useState<Set<number>>(new Set());
  const grupos = agrupar(p.filas, p.fechaLote);
  const repiten = useMemo(() => jefasDe(p.filas), [p.filas]);
  const cupo = p.cupo ?? { usados: 0, limite: LIMITE_PRODUCTOS_DIA };
  const resumen = resumirFactura(p.filas, cupo);
  const conCupo = p.conSesion && p.cupo !== null;
  const incompletas = p.filas.filter((f) => !estaCompleta(f));
  const nuevos =
    p.conSesion &&
    p.publicar &&
    p.filas.some((f) => f.nuevo || f.tiendaId === null);

  const conteos = contarFiltros(p.filas);

  const cambiarFila = (linea: number, parche: Partial<FilaRevision>) =>
    p.onFilas((fs) =>
      fs.map((f) => (f.linea === linea ? { ...f, ...parche } : f)),
    );
  const decidirFila = (
    linea: number,
    modo: ModoFila,
    producto?: ProductoElegido,
  ) =>
    p.onFilas((fs) =>
      decidir(
        fs,
        fs.findIndex((f) => f.linea === linea),
        modo,
        producto,
      ),
    );
  const decidirElegidas = (modo: ModoFila) => {
    p.onFilas((fs) =>
      fs.map((f) => (elegidas.has(f.linea) ? aplicarModo(f, modo) : f)),
    );
    setElegidas(new Set());
  };
  const repartir = () =>
    p.onFilas((fs) => {
      const r = repartirCupo(fs, resumen.cupo.queda);
      return fs.map((f, i) =>
        r[i].modo === f.modo ? f : aplicarModo(f, "solo_gasto"),
      );
    });

  const bloqueo = (() => {
    if (p.filas.length === 0) return "No hay líneas para guardar.";
    if (incompletas.length > 0)
      return `Faltan ${incompletas.length} por completar.`;
    if (conCupo && !resumen.cupo.alcanza && p.publicar)
      return "Hoy no caben todos los productos nuevos.";
    if (nuevos && !p.confirmaNuevos) return "Confirma lo que se va a crear.";
    return "";
  })();

  return (
    <section data-testid="importar-revision" className="flex flex-col gap-3">
      {p.notas.length > 0 && (
        <ul
          role="status"
          className="rounded-[12px] border bg-warn-bg p-2.5 text-sm text-warn-ink"
        >
          {p.notas.map((n) => (
            <li key={n}>Dudosa: {n}</li>
          ))}
        </ul>
      )}
      <ResumenDeFactura
        resumen={resumen}
        conCupo={conCupo}
        onRepartir={repartir}
      />
      {p.conSesion ? (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={p.publicar}
            onChange={(e) => p.onPublicar(e.target.checked)}
          />
          Publicar los precios para todos (cambia totales y mejor tienda)
        </label>
      ) : (
        <p className="text-sm text-muted-foreground">
          Sin sesión: solo se guardan tus gastos en este dispositivo. Inicia
          sesión para actualizar el catálogo.
        </p>
      )}
      {p.conSesion && (
        <FiltrosFactura
          filtro={filtro}
          conteos={conteos}
          seleccionadas={elegidas.size}
          onFiltro={setFiltro}
          onSeleccionarVisibles={() =>
            setElegidas(
              new Set(
                p.filas
                  .filter(
                    (f) =>
                      cumpleFiltro(f, filtro) &&
                      !repiten.has(p.filas.indexOf(f)),
                  )
                  .map((f) => f.linea),
              ),
            )
          }
          onLimpiar={() => setElegidas(new Set())}
          onDecidirSeleccion={decidirElegidas}
        />
      )}
      {grupos.map((g) => {
        const suma = g.indices.reduce((s, i) => s + p.filas[i].precioTotal, 0);
        const visibles = g.indices.filter((i) =>
          cumpleFiltro(p.filas[i], filtro),
        );
        return (
          <div
            key={p.filas[g.indices[0]].linea}
            data-testid="grupo-importacion"
            className="flex flex-col gap-2 rounded-[14px] border bg-card p-3.5"
          >
            <EncabezadoGrupo
              g={g}
              suma={suma}
              total={p.totales[g.clave] ?? ""}
              onGrupo={(parche) => p.onGrupo(g, parche)}
              onTotal={(v) => p.onTotal(g.clave, v)}
            />
            {visibles.map((i) => {
              const f = p.filas[i];
              const jefa = repiten.get(i);
              return (
                <FilaFactura
                  key={f.linea}
                  f={f}
                  repiteDe={
                    jefa === undefined ? undefined : p.filas[jefa].linea
                  }
                  conSesion={p.conSesion}
                  productos={p.productos}
                  seleccionada={elegidas.has(f.linea)}
                  onSeleccion={(v) =>
                    setElegidas((s) => {
                      const n = new Set(s);
                      if (v) n.add(f.linea);
                      else n.delete(f.linea);
                      return n;
                    })
                  }
                  onFila={(parche) => cambiarFila(f.linea, parche)}
                  onDecidir={(modo, prod) => decidirFila(f.linea, modo, prod)}
                  onQuitar={() =>
                    p.onFilas((fs) => fs.filter((x) => x.linea !== f.linea))
                  }
                />
              );
            })}
            {visibles.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Ninguna línea de esta tienda coincide con el filtro.
              </p>
            )}
          </div>
        );
      })}
      {nuevos && (
        <label className="flex items-start gap-2 rounded-[12px] border bg-anot-bg p-2.5 text-sm text-anot-ink">
          <input
            type="checkbox"
            checked={p.confirmaNuevos}
            onChange={(e) => p.onConfirma(e.target.checked)}
          />
          Hay tiendas o productos que no existen en el catálogo; confirmo que se
          creen (se verán para todos).
        </label>
      )}
      {incompletas.length > 0 && (
        <div role="status" className="text-sm text-warn-ink">
          Completa o quita {incompletas.length}{" "}
          {incompletas.length === 1 ? "fila" : "filas"} antes de guardar:{" "}
          {incompletas.map((f, k) => (
            <span key={f.linea}>
              {k > 0 && ", "}
              <a className="underline" href={`#fila-${f.linea}`}>
                línea {f.linea}
              </a>
            </span>
          ))}
          .
        </div>
      )}
      <BarraGuardar
        conSesion={p.conSesion}
        guardando={p.guardando}
        bloqueo={bloqueo}
        onVolver={p.onVolver}
        onActualizar={p.onActualizar}
        onGuardar={p.onGuardar}
      />
    </section>
  );
}
