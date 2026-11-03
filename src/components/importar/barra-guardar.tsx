type Props = {
  conSesion: boolean;
  guardando: boolean;
  /** Por qué no se puede guardar; vacío si se puede. */
  bloqueo: string;
  onVolver: () => void;
  onActualizar: () => void;
  onGuardar: () => void;
};

const boton =
  "rounded-[10px] border px-3 py-1.5 text-sm [@media(pointer:coarse)]:min-h-11";

/** Barra fija abajo: siempre a mano aunque la factura tenga decenas de líneas. */
export function BarraGuardar(p: Props) {
  return (
    <div
      data-testid="barra-guardar"
      className="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center gap-2 border-t bg-background/95 px-1 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] backdrop-blur"
    >
      <button type="button" onClick={p.onVolver} className={boton}>
        Volver
      </button>
      {p.conSesion && (
        <button type="button" onClick={p.onActualizar} className={boton}>
          Actualizar revisión
        </button>
      )}
      {p.bloqueo && <span className="text-xs text-warn-ink">{p.bloqueo}</span>}
      <button
        type="button"
        disabled={p.guardando || Boolean(p.bloqueo)}
        onClick={p.onGuardar}
        className={`${boton} ml-auto bg-primary text-primary-foreground disabled:opacity-60`}
      >
        {p.guardando ? "Guardando…" : "Guardar importación"}
      </button>
    </div>
  );
}
