"use client";

import { useState } from "react";
import { registrarAliasLista } from "@/app/listas/acciones";
import { crearProducto } from "@/app/tiendas/acciones";
import { leerLista, reemplazarLista } from "@/components/carrito/use-lista";
import { avisar } from "@/lib/avisos";
import { emparejarProducto, normalizarNombre } from "@/lib/importar/emparejar";
import { claveAviso } from "@/lib/importar/factura";
import {
  type FilaLista,
  guardarAlias,
  itemDeProducto,
  leerAlias,
  leerListaCsv,
  type UnidadLista,
  unidadDeCompra,
} from "@/lib/importar/lista";
import { PROMPT_LISTA } from "@/lib/importar/prompt-lista";
import {
  normalizarNombre as claveLista,
  type Items,
  leerLocales,
  MAX_ITEMS,
  MAX_LISTAS,
  sumar,
} from "@/lib/listas/guardadas";
import { unidadBase } from "@/lib/unidades";
import { persistir } from "./almacen";
import {
  type Fila,
  type Producto,
  type Seccion,
  SeccionLista,
} from "./seccion-lista";

const campo = "rounded-[10px] border bg-card px-2 py-1 text-sm";
const boton = "rounded-[10px] border px-3 py-1.5 text-sm";

/** Carga una lista desde el CSV que devuelve la IA; revisión obligatoria antes de tocar la lista. */
export function CargarLista({
  productos,
  aliasNube = {},
}: {
  productos: Producto[];
  aliasNube?: Record<string, string>;
}) {
  const [texto, setTexto] = useState("");
  const [errores, setErrores] = useState<string[]>([]);
  const [notas, setNotas] = useState<string[]>([]);
  const [secciones, setSecciones] = useState<Seccion[] | null>(null);
  const [nuevos, setNuevos] = useState<Producto[]>([]);
  const [confirmar, setConfirmar] = useState<number | null>(null);
  const todos = [...productos, ...nuevos];

  const calcular = (id: string, f: FilaLista, lista = todos) => {
    const p = lista.find((x) => x.id === id);
    if (!p) return { item: 1, aviso: false };
    const r = itemDeProducto(unidadBase(p.unidad), f.cantidad, f.unidad);
    return r.ok ? { item: r.item, aviso: false } : { item: 1, aviso: true };
  };

  const revisar = () => {
    const r = leerListaCsv(texto);
    setErrores(
      r.errores.map((e) => `Línea ${e.linea}: ${e.mensaje.replace(/_/g, " ")}`),
    );
    setNotas(r.notas);
    // Una fila mala no bota el archivo completo: se revisa lo que sí se entendió.
    if (!r.listas.length) return setSecciones(null);
    const alias = { ...aliasNube, ...leerAlias() };
    setSecciones(
      r.listas.map((l) => ({
        nombre: l.nombre,
        guardar: l.nombre.slice(0, 60),
        filas: l.filas.map((f) => {
          const id =
            alias[normalizarNombre(f.producto)] ??
            emparejarProducto(
              { producto: f.producto, tiendaId: null },
              { productos, aliasProducto: [], codigos: {} },
            ) ??
            "";
          return { f, productoId: id, ...calcular(id, f) };
        }),
      })),
    );
  };

  const cambiar = (s: number, i: number, parche: Partial<Fila>) =>
    setSecciones(
      (ss) =>
        ss?.map((x, k) =>
          k === s
            ? {
                ...x,
                filas: x.filas.map((r, j) =>
                  j === i ? { ...r, ...parche } : r,
                ),
              }
            : x,
        ) ?? null,
    );

  /** Corregir el texto de una fila vuelve a emparejar y recalcula la cantidad de compra. */
  const cambiarFila = (s: number, i: number, parche: Partial<FilaLista>) =>
    setSecciones((ss) => {
      if (!ss) return null;
      const alias = { ...aliasNube, ...leerAlias() };
      return ss.map((x, k) => {
        if (k !== s) return x;
        return {
          ...x,
          filas: x.filas.map((r, j) => {
            if (j !== i) return r;
            const f = { ...r.f, ...parche };
            const productoId =
              parche.producto === undefined
                ? r.productoId
                : (alias[normalizarNombre(f.producto)] ??
                  emparejarProducto(
                    { producto: f.producto, tiendaId: null },
                    { productos, aliasProducto: [], codigos: {} },
                  ) ??
                  "");
            return { f, productoId, ...calcular(productoId, f) };
          }),
        };
      });
    });

  const elegir = async (s: number, i: number, id: string) => {
    const f = secciones?.[s].filas[i].f;
    if (!f) return;
    if (id !== "__nuevo__")
      return cambiar(s, i, { productoId: id, ...calcular(id, f) });
    const r = await crearProducto({
      nombre: f.producto,
      grupo: "Otros",
      unidad: unidadDeCompra(f.unidad),
      frecuencia: "semanal",
    });
    if (!r.ok) return avisar(claveAviso(r.error));
    const nuevo = {
      id: r.id,
      nombre: f.producto,
      unidad: unidadDeCompra(f.unidad),
    };
    setNuevos((n) => [...n, nuevo]);
    avisar("producto_creado", { nombre: f.producto });
    cambiar(s, i, {
      productoId: r.id,
      ...calcular(r.id, f, [...todos, nuevo]),
    });
  };

  const itemsDe = (sec: Seccion): Items => {
    const items: Items = {};
    for (const r of sec.filas)
      if (r.productoId)
        items[r.productoId] = Math.min(
          999,
          (items[r.productoId] ?? 0) + r.item,
        );
    return items;
  };

  /** Recuerda cómo se escribió cada producto elegido; sin sesión solo queda en el dispositivo. */
  const recordar = (sec: Seccion) => {
    const alias = leerAlias();
    for (const r of sec.filas) {
      if (!r.productoId) continue;
      alias[normalizarNombre(r.f.producto)] = r.productoId;
      void registrarAliasLista(r.f.producto, r.productoId).catch(() => {});
    }
    guardarAlias(alias);
  };

  const nueva = (sec: Seccion, nombre: string) => ({
    nombre,
    items: itemsDe(sec),
    tienda_preferida: "d1",
    actualizada: new Date().toISOString(),
  });

  const usar = (s: number, sec: Seccion) => {
    if (Object.keys(leerLista()).length && confirmar !== s)
      return setConfirmar(s);
    recordar(sec);
    setConfirmar(null);
    // Una lista que viene de un CSV no es una guardada: no se puede «guardar cambios» sobre ella.
    reemplazarLista(itemsDe(sec), null);
    avisar("lista_cargada", { nombre: sec.nombre });
  };

  const sumarALista = (sec: Seccion) => {
    recordar(sec);
    reemplazarLista(sumar(leerLista(), nueva(sec, sec.nombre)));
    avisar("lista_sumada", { nombre: sec.nombre });
  };

  const guardar = (sec: Seccion) => {
    const nombre = sec.guardar.trim();
    const guardadas = leerLocales();
    if (!nombre) return;
    if (guardadas.some((l) => claveLista(l.nombre) === claveLista(nombre)))
      return avisar("nombre_repetido");
    if (
      guardadas.length >= MAX_LISTAS ||
      Object.keys(itemsDe(sec)).length > MAX_ITEMS
    )
      return avisar("limite_listas");
    recordar(sec);
    void persistir([...guardadas, nueva(sec, nombre)]);
    avisar("lista_guardada", { nombre });
  };

  return (
    <section
      data-tour="cargar-lista"
      className="flex flex-col gap-2 rounded-[14px] border bg-card p-3.5"
    >
      <h2 className="text-lg font-bold">Cargar lista desde texto</h2>
      <p className="text-sm text-muted-foreground">
        Pega tu listado en tu IA con este prompt y pega aquí el CSV que te
        devuelva. Nada sale de tu navegador.
      </p>
      <details className="text-sm">
        <summary className="cursor-pointer">Ver el prompt</summary>
        <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap rounded-[10px] border p-2 text-xs">
          {PROMPT_LISTA}
        </pre>
      </details>
      <textarea
        aria-label="CSV de la lista"
        data-testid="lista-texto"
        rows={6}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        className={`${campo} w-full font-mono text-xs`}
      />
      {errores.length > 0 && (
        <div
          role={secciones ? "status" : "alert"}
          className={`text-sm ${secciones ? "text-warn-ink" : "text-up-ink"}`}
        >
          {secciones && (
            <p>
              Se cargaron las filas que sí se entendieron. Revisa estos avisos:
            </p>
          )}
          <ul>
            {errores.slice(0, 6).map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}
      {notas.length > 0 && (
        <ul role="status" className="text-sm text-warn-ink">
          {notas.map((n) => (
            <li key={n}>Dudosa: {n}</li>
          ))}
        </ul>
      )}
      <button
        type="button"
        disabled={!texto.trim()}
        onClick={revisar}
        className={`${boton} self-start`}
      >
        Revisar
      </button>
      {secciones?.map((sec, s) => (
        <SeccionLista
          key={sec.nombre}
          sec={sec}
          productos={todos}
          confirmando={confirmar === s}
          onProducto={(i, producto) => cambiarFila(s, i, { producto })}
          onCantidad={(i, cantidad) => cambiarFila(s, i, { cantidad })}
          onUnidad={(i, unidad: UnidadLista) => cambiarFila(s, i, { unidad })}
          onElegir={(i, id) => void elegir(s, i, id)}
          onItem={(i, item) => cambiar(s, i, { item, aviso: false })}
          onNombre={(guardar) =>
            setSecciones(
              (ss) =>
                ss?.map((x, k) => (k === s ? { ...x, guardar } : x)) ?? null,
            )
          }
          onUsar={() => usar(s, sec)}
          onSumar={() => sumarALista(sec)}
          onGuardar={() => guardar(sec)}
        />
      ))}
    </section>
  );
}
