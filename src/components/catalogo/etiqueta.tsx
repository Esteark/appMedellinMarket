import type { Etiqueta as Tipo } from "@/lib/precios/etiquetas";
import { cn } from "@/lib/utils";

const ESTILO: Record<Tipo, string> = {
  sube: "bg-up-bg text-up-ink",
  baja: "bg-save-bg text-save-ink",
  clima: "bg-clima-bg text-clima-ink",
  anotado: "bg-anot-bg text-anot-ink",
  estimado: "bg-secondary text-muted-foreground",
  mayorista: "bg-secondary text-muted-foreground",
  revisar: "bg-warn-bg text-warn-ink",
  desactualizado: "bg-warn-bg text-warn-ink",
  actualizar: "bg-warn-bg text-warn-ink",
  sin_dato: "bg-secondary text-muted-foreground",
};

function texto(tipo: Tipo, cambio: number | null) {
  if (tipo === "sube") return cambio == null ? "↑ sube" : `↑ ${cambio} %`;
  if (tipo === "baja") return cambio == null ? "↓ baja" : `↓ ${-cambio} %`;
  if (tipo === "clima") return "🌧️ clima";
  if (tipo === "sin_dato") return "sin dato";
  if (tipo === "desactualizado") return "⏱ desactualizado";
  if (tipo === "actualizar") return "✎ actualizar";
  return tipo;
}

export function Etiqueta({
  tipo,
  cambio,
  deHoy,
}: {
  tipo: Tipo;
  cambio: number | null;
  deHoy: boolean;
}) {
  return (
    <span
      data-etiqueta={tipo}
      title={
        tipo === "desactualizado"
          ? "Este precio no se ha visto hace días: puede haber cambiado"
          : tipo === "actualizar"
            ? "Tienda de barrio: este precio anotado ya tiene días. Actualízalo en Anotados → barrio"
            : undefined
      }
      className={cn(
        "inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-bold tabular-nums",
        ESTILO[tipo],
        deHoy && (tipo === "sube" || tipo === "baja") && "etiqueta-hoy",
      )}
    >
      {texto(tipo, cambio)}
    </span>
  );
}
