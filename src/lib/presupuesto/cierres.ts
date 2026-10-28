import type {
  GastoReal,
  PresupuestoCierreSnapshot,
  PresupuestoRubro,
} from "@/lib/presupuesto/tipos";

export function generarSnapshotCierre(
  mes: string,
  rubros: PresupuestoRubro[],
  gastos: GastoReal[],
): PresupuestoCierreSnapshot {
  const porRubroMap = new Map<string, number>();
  for (const g of gastos) {
    if (g.mes !== mes) continue;
    porRubroMap.set(g.rubro, (porRubroMap.get(g.rubro) ?? 0) + g.monto);
  }
  const por_rubro = rubros
    .map((r) => {
      const gastado = porRubroMap.get(r.rubro) ?? 0;
      const presupuestado = r.monto;
      const porcentajeUsado =
        presupuestado > 0
          ? Math.round((gastado / presupuestado) * 100)
          : gastado > 0
            ? 100
            : 0;
      return { rubro: r.rubro, presupuestado, gastado, porcentajeUsado };
    })
    .filter((f) => f.presupuestado > 0 || f.gastado > 0);
  const total_presupuestado = rubros.reduce((a, r) => a + r.monto, 0);
  const total_gastado = gastos
    .filter((g) => g.mes === mes)
    .reduce((a, g) => a + g.monto, 0);
  const ahorro = total_presupuestado - total_gastado;
  return { mes, total_presupuestado, total_gastado, ahorro, por_rubro };
}
