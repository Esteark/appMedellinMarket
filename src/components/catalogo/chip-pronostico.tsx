import type { Pronostico } from "@/lib/precios/pronostico";
import { cn } from "@/lib/utils";

const FLECHA = { sube: "↑", baja: "↓", estable: "→" } as const;
const FRASE = {
  sube: "podría subir",
  baja: "podría bajar",
  estable: "se mantendría estable",
} as const;

/** «↑ 62 % · 7 días»: una estimación estadística, nunca un precio. */
export function ChipPronostico({ pronostico: p }: { pronostico: Pronostico }) {
  return (
    <span
      role="img"
      data-testid="chip-pronostico"
      data-direccion={p.direccion}
      title="Estimación estadística"
      aria-label={`Estimación estadística: en los próximos 7 días el precio ${FRASE[p.direccion]}, con ${p.probabilidad} % de probabilidad`}
      className={cn(
        "w-max rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums",
        p.direccion === "sube" && "bg-up-bg text-up-ink",
        p.direccion === "baja" && "bg-save-bg text-save-ink",
        p.direccion === "estable" && "bg-secondary text-muted-foreground",
      )}
    >
      {FLECHA[p.direccion]} {p.probabilidad} % · 7 días
    </span>
  );
}
