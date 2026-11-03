import { pesos } from "@/lib/formato";
import { type Grupo, noCuadra } from "@/lib/importar/grupos";

const campo = "w-full rounded-[10px] border bg-card px-2 py-1.5 text-sm";

type Props = {
  g: Grupo;
  suma: number;
  /** Total impreso que escribió la persona, solo dígitos. */
  total: string;
  onGrupo: (parche: { tienda?: string; fecha?: string }) => void;
  onTotal: (v: string) => void;
};

/** Tienda, fecha y total impreso de un grupo de líneas, con el aviso si la suma no cuadra. */
export function EncabezadoGrupo({ g, suma, total, onGrupo, onTotal }: Props) {
  const impreso = Number(total);
  return (
    <>
      <div className="grid gap-2 sm:grid-cols-3">
        <label className="text-xs text-muted-foreground">
          Tienda
          <input
            className={campo}
            value={g.tienda}
            onChange={(e) => onGrupo({ tienda: e.target.value })}
          />
        </label>
        <label className="text-xs text-muted-foreground">
          Fecha
          <input
            type="date"
            className={campo}
            value={g.fecha}
            onChange={(e) => onGrupo({ fecha: e.target.value })}
          />
        </label>
        <label className="text-xs text-muted-foreground">
          Total impreso (opcional)
          <input
            inputMode="numeric"
            className={campo}
            value={total}
            onChange={(e) => onTotal(e.target.value.replace(/\D/g, ""))}
          />
        </label>
      </div>
      <p className="text-sm tabular-nums">
        Suma de líneas: <strong>{pesos(suma)}</strong>
        {impreso > 0 && noCuadra(suma, impreso) && (
          <span role="alert" className="ml-2 text-warn-ink">
            No cuadra con el total impreso ({pesos(impreso)}).
          </span>
        )}
      </p>
    </>
  );
}
