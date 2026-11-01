"use client";

import { useState } from "react";
import { PROMPT_FACTURA } from "@/lib/importar/prompt";

/** Explica el flujo en tres líneas y deja copiar el prompt que convierte una factura en CSV. */
export function PanelPrompt() {
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(PROMPT_FACTURA);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      setCopiado(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-[12px] border bg-secondary p-3 text-sm">
      <ol className="list-decimal pl-5 text-muted-foreground">
        <li>
          Copia el prompt y pégalo en tu IA junto con la foto o el texto de la
          factura.
        </li>
        <li>Pega aquí la respuesta (o súbela como archivo .csv).</li>
        <li>
          Revisa todo antes de guardar. El archivo nunca sale de tu navegador.
        </li>
      </ol>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={copiar}
          className="rounded-[10px] border bg-card px-3 py-1.5"
        >
          {copiado ? "Prompt copiado" : "Copiar prompt"}
        </button>
        <details className="text-muted-foreground">
          <summary className="cursor-pointer">Ver el prompt</summary>
          <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-[10px] border bg-card p-2 text-xs">
            {PROMPT_FACTURA}
          </pre>
        </details>
      </div>
    </div>
  );
}
