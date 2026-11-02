"use client";

import { useId, useState } from "react";
import { buscarEmojis, CATEGORIAS_EMOJI, limpiarEmoji } from "@/data/emojis";
import { cn } from "@/lib/utils";

const celda =
  "grid size-9 place-items-center rounded-[10px] border bg-background text-xl [@media(pointer:coarse)]:size-11";

/** Elige el ícono de un producto: categorías, buscador en español, uno propio o «Sin ícono». */
export function EmojiSelector({
  valor,
  onChange,
}: {
  valor: string;
  onChange: (emoji: string) => void;
}) {
  const id = useId();
  const [abierto, setAbierto] = useState(false);
  const [q, setQ] = useState("");
  const [categoria, setCategoria] = useState<string | null>(null);

  const items = q
    ? buscarEmojis(q)
    : categoria
      ? (CATEGORIAS_EMOJI.find((c) => c.id === categoria)?.items ?? [])
      : buscarEmojis("");
  const elegir = (e: string) => {
    onChange(e);
    setAbierto(false);
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: Esc cierra el selector desde cualquiera de sus controles
    <div
      className="flex flex-col gap-2"
      onKeyDown={(ev) => {
        if (ev.key === "Escape" && abierto) {
          ev.preventDefault();
          ev.stopPropagation();
          setAbierto(false);
        }
      }}
    >
      <button
        type="button"
        aria-expanded={abierto}
        aria-controls={id}
        onClick={() => setAbierto((a) => !a)}
        className="flex h-10 items-center gap-2 self-start rounded-[10px] border bg-card px-3 text-sm"
      >
        <span aria-hidden="true" className="text-xl">
          {valor || "·"}
        </span>
        {valor ? "Cambiar ícono" : "Elegir ícono"}
      </button>
      {abierto && (
        <div
          id={id}
          data-testid="selector-emoji"
          className="flex flex-col gap-2 rounded-[12px] border bg-card p-2"
        >
          <input
            type="search"
            aria-label="Buscar ícono"
            placeholder="Buscar: aguacate, leche…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-10 rounded-[10px] border border-input bg-background px-3 text-base sm:text-sm"
          />
          {!q && (
            <fieldset className="flex min-w-0 flex-wrap gap-1.5">
              <legend className="sr-only">Categoría</legend>
              {[{ id: null, nombre: "Todos" }, ...CATEGORIAS_EMOJI].map((c) => (
                <button
                  key={c.id ?? "todos"}
                  type="button"
                  aria-pressed={categoria === c.id}
                  onClick={() => setCategoria(c.id)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs font-medium",
                    categoria === c.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-secondary",
                  )}
                >
                  {c.nombre}
                </button>
              ))}
            </fieldset>
          )}
          <ul className="flex max-h-44 flex-wrap gap-1 overflow-y-auto">
            {items.map((i) => (
              <li key={i.e}>
                <button
                  type="button"
                  title={i.n}
                  aria-label={i.n}
                  aria-pressed={valor === i.e}
                  onClick={() => elegir(i.e)}
                  className={cn(celda, valor === i.e && "border-primary")}
                >
                  {i.e}
                </button>
              </li>
            ))}
            {items.length === 0 && (
              <li className="text-xs text-muted-foreground">
                Nada coincide. Escribe uno propio abajo.
              </li>
            )}
          </ul>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-sm">
              Otro
              <input
                aria-label="Escribir un ícono propio"
                value={valor}
                onChange={(e) => onChange(limpiarEmoji(e.target.value))}
                className="h-10 w-20 rounded-[10px] border border-input bg-background px-2 text-base sm:text-sm"
              />
            </label>
            <button
              type="button"
              onClick={() => elegir("")}
              className="text-sm font-medium text-muted-foreground underline underline-offset-2"
            >
              Sin ícono
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
