"use client";

import { useEffect, useState } from "react";
import { leerLista, reemplazarLista } from "@/components/carrito/use-lista";
import { avisar } from "@/lib/avisos";
import {
  cargar,
  type ListaGuardada,
  leerLocales,
  MAX_LISTAS,
  normalizarNombre,
  sumar,
} from "@/lib/listas/guardadas";
import { persistir } from "./almacen";
import { TarjetaLista } from "./tarjeta-lista";

/** Descarga la lista como `lista-mercado-<nombre>-<fecha>.json`, sin dependencias. */
function exportar(l: ListaGuardada) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(l, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `lista-mercado-${normalizarNombre(l.nombre).replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Las listas guardadas viven en el dispositivo; con sesión `SincronizarListas` y `persistir` las reflejan en la cuenta. */
export function ListasGuardadas() {
  const [listas, setListas] = useState<ListaGuardada[] | null>(null);
  // Se lee tras hidratar: el servidor no ve localStorage.
  useEffect(() => setListas(leerLocales()), []);

  if (!listas)
    return <p className="text-sm text-muted-foreground">Cargando…</p>;

  const guardar = (nuevas: ListaGuardada[]) => {
    setListas(nuevas);
    void persistir(nuevas);
  };
  const repetido = (nombre: string, salvo?: ListaGuardada) =>
    listas.some(
      (x) =>
        x !== salvo && normalizarNombre(x.nombre) === normalizarNombre(nombre),
    );
  const ahora = () => new Date().toISOString();

  const renombrar = (l: ListaGuardada, nuevo: string) => {
    const nombre = nuevo.trim();
    if (!nombre || nombre.length > 60) return;
    if (repetido(nombre, l)) return avisar("nombre_repetido");
    guardar(
      listas.map((x) => (x === l ? { ...x, nombre, actualizada: ahora() } : x)),
    );
    avisar("lista_renombrada", { nombre });
  };

  const duplicar = (l: ListaGuardada) => {
    if (listas.length >= MAX_LISTAS) return avisar("limite_listas");
    let nombre = `${l.nombre.slice(0, 52)} (copia)`;
    for (let i = 2; repetido(nombre); i++)
      nombre = `${l.nombre.slice(0, 50)} (copia ${i})`;
    guardar([...listas, { ...l, nombre, actualizada: ahora() }]);
    avisar("lista_duplicada", { nombre });
  };

  const eliminar = (l: ListaGuardada) => {
    guardar(listas.filter((x) => x !== l));
    avisar(
      "lista_eliminada",
      { nombre: l.nombre },
      { texto: "Deshacer", alPulsar: () => guardar([...leerLocales(), l]) },
    );
  };

  if (!listas.length)
    return (
      <p
        data-testid="listas-vacio"
        className="rounded-[14px] border border-dashed bg-card p-7 text-center text-muted-foreground"
      >
        Todavía no has guardado listas. Arma tu lista en el catálogo y pulsa
        «Guardar lista».
      </p>
    );

  return (
    <ul className="flex flex-col gap-2.5">
      {listas.map((l) => (
        <TarjetaLista
          key={normalizarNombre(l.nombre)}
          lista={l}
          alCargar={() => {
            reemplazarLista(cargar(l));
            avisar("lista_cargada", { nombre: l.nombre });
          }}
          alSumar={() => {
            reemplazarLista(sumar(leerLista(), l));
            avisar("lista_sumada", { nombre: l.nombre });
          }}
          alRenombrar={(nuevo) => renombrar(l, nuevo)}
          alDuplicar={() => duplicar(l)}
          alEliminar={() => eliminar(l)}
          alExportar={() => exportar(l)}
        />
      ))}
    </ul>
  );
}
