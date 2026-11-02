"use client";

import { useId, useMemo, useRef, useState } from "react";
import { normalizarNombre } from "@/lib/importar/emparejar";
import { cn } from "@/lib/utils";

type Producto = { id: string; nombre: string; emoji: string | null };

type Props = {
  /** Id del campo, para el `<label htmlFor>` de afuera. */
  id: string;
  /** Id del producto elegido; vacío = «Manual». */
  valor: string;
  productos: Producto[];
  onChange: (id: string) => void;
  textoVacio?: string;
};

/**
 * Lista desplegable de productos con buscador en el mismo campo: se abre con todos, se escribe para
 * filtrar (sin tildes ni mayúsculas), y se elige con el ratón o con ↑ ↓ y Enter. La lista queda en el
 * flujo de la página (no flota), así no la recorta una tabla con desplazamiento.
 */
export function SelectorProducto({
  id,
  valor,
  productos,
  onChange,
  textoVacio = "Manual (sin producto)",
}: Props) {
  const lista = useId();
  const contenedor = useRef<HTMLDivElement>(null);
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const [activo, setActivo] = useState(0);

  const elegido = productos.find((p) => p.id === valor);
  const etiquetaElegido = valor
    ? `${elegido?.emoji ?? ""} ${elegido?.nombre ?? valor}`.trim()
    : textoVacio;

  const opciones = useMemo(() => {
    const q = normalizarNombre(texto);
    const visibles = q
      ? productos.filter((p) => normalizarNombre(p.nombre).includes(q))
      : productos;
    return [
      { id: "", nombre: textoVacio, emoji: null as string | null },
      ...visibles,
    ];
  }, [productos, texto, textoVacio]);

  const abrir = () => {
    setAbierto(true);
    setActivo(
      Math.max(
        0,
        opciones.findIndex((o) => o.id === valor),
      ),
    );
  };
  const cerrar = () => {
    setAbierto(false);
    setTexto("");
  };
  const elegir = (id: string) => {
    onChange(id);
    cerrar();
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: solo detecta que el foco salió del selector
    <div
      ref={contenedor}
      className="flex flex-col gap-1"
      onBlur={(e) => {
        // Sale del selector (no solo de un botón a otro): se cierra.
        if (!contenedor.current?.contains(e.relatedTarget as Node | null))
          cerrar();
      }}
    >
      <input
        id={id}
        role="combobox"
        aria-expanded={abierto}
        aria-controls={lista}
        aria-autocomplete="list"
        aria-activedescendant={abierto ? `${lista}-${activo}` : undefined}
        autoComplete="off"
        placeholder={abierto && valor ? etiquetaElegido : "Buscar producto…"}
        value={abierto ? texto : etiquetaElegido}
        onFocus={abrir}
        onClick={() => !abierto && abrir()}
        onChange={(e) => {
          setTexto(e.target.value);
          setAbierto(true);
          setActivo(0);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            if (!abierto) return abrir();
            const n = opciones.length;
            setActivo((a) => (a + (e.key === "ArrowDown" ? 1 : n - 1)) % n);
          } else if (e.key === "Enter" && abierto) {
            // Elegir, no enviar el formulario de la fila.
            e.preventDefault();
            elegir(opciones[activo]?.id ?? "");
          } else if (e.key === "Escape" && abierto) {
            // El primer Esc cierra la lista; el segundo, ya cerrada, cancela la edición de la fila.
            e.preventDefault();
            e.stopPropagation();
            cerrar();
          }
        }}
        className="mt-1 w-full rounded-[10px] border border-input bg-background px-2 py-1.5"
      />
      {abierto && (
        <div
          id={lista}
          role="listbox"
          aria-label="Productos"
          // Pulsar la barra de desplazamiento o el relleno no debe sacar el foco del campo (cerraría la lista).
          onMouseDown={(e) => e.preventDefault()}
          className="max-h-48 overflow-y-auto rounded-[10px] border bg-card text-sm"
        >
          {opciones.map((o, i) => (
            <div
              key={o.id || "manual"}
              id={`${lista}-${i}`}
              role="option"
              aria-selected={o.id === valor}
              tabIndex={-1}
              // `mousedown` y no `click`: así el campo no pierde el foco antes de elegir.
              onMouseDown={(e) => {
                e.preventDefault();
                elegir(o.id);
              }}
              onMouseMove={() => setActivo(i)}
              className={cn(
                "cursor-pointer px-2.5 py-1.5",
                i === activo && "bg-secondary",
                o.id === valor && "font-semibold",
                !o.id && "text-muted-foreground",
              )}
            >
              {o.emoji} {o.nombre}
            </div>
          ))}
          {opciones.length === 1 && (
            <div className="px-2.5 py-1.5 text-xs text-muted-foreground">
              Ningún producto coincide: puedes dejarlo como manual.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
