import type { ResumenFactura } from "@/lib/importar/resumen";

const dato = (n: number, texto: string) => (
  <li className="rounded-[10px] bg-secondary px-2.5 py-1.5 text-sm">
    <strong className="tabular-nums">{n}</strong> {texto}
  </li>
);

/** Qué trae la factura y cuánto cupo de productos nuevos queda hoy. */
export function ResumenDeFactura({
  resumen: r,
  conCupo,
  onRepartir,
}: {
  resumen: ResumenFactura;
  /** Solo con sesión se crean productos, y solo entonces el cupo importa. */
  conCupo: boolean;
  onRepartir: () => void;
}) {
  const { cupo } = r;
  const pct = Math.min(100, Math.round((cupo.necesita / cupo.limite) * 100));
  return (
    <div
      data-testid="resumen-factura"
      className="flex flex-col gap-2 rounded-[14px] border bg-card p-3.5"
    >
      <h2 className="text-sm font-semibold">Resumen de la factura</h2>
      <ul className="flex flex-wrap gap-2">
        {dato(r.lineas, r.lineas === 1 ? "línea" : "líneas")}
        {dato(r.existentes, "ya existen")}
        {dato(r.nuevos, r.nuevos === 1 ? "producto nuevo" : "productos nuevos")}
        {dato(r.soloGasto, "solo gasto")}
        {r.repetidas > 0 && dato(r.repetidas, "repetidas")}
      </ul>
      {conCupo && (
        <>
          <p className="text-sm tabular-nums">
            Productos nuevos hoy: {cupo.usados + cupo.necesita} de {cupo.limite}
            <span className="text-muted-foreground">
              {" "}
              (ya creaste {cupo.usados}; esta factura crea {cupo.necesita})
            </span>
          </p>
          <div
            aria-hidden="true"
            className="h-1.5 overflow-hidden rounded-full bg-secondary"
          >
            <div
              className={`h-full ${cupo.alcanza ? "bg-save" : "bg-up"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          {!cupo.alcanza && (
            <div
              role="alert"
              className="flex flex-wrap items-center gap-2 rounded-[12px] bg-up-bg p-2.5 text-sm text-up-ink"
            >
              <span>
                Hoy solo caben {cupo.queda} productos nuevos y la factura trae{" "}
                {cupo.necesita}.
              </span>
              <button
                type="button"
                onClick={onRepartir}
                className="rounded-[10px] border border-up px-3 py-1.5 text-sm font-medium [@media(pointer:coarse)]:min-h-11"
              >
                Crear hasta el cupo y el resto solo gasto
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
