"use client";

import { useEffect, useMemo, useState } from "react";
import { agregarGasto, eliminarGasto } from "@/app/presupuesto/acciones";
import { avisar } from "@/lib/avisos";
import type { ProductoCatalogo } from "@/lib/datos";
import { pesos } from "@/lib/formato";
import {
  agregarCierreLocal,
  guardarPresupuestoDieta,
  guardarPresupuestoHogar,
  leerCierresLocal,
  leerPresupuestoDieta,
  leerPresupuestoHogar,
} from "@/lib/presupuesto/almacenamiento";
import { generarAprendizajes } from "@/lib/presupuesto/aprendizajes";
import { compararPresupuestadoVsGastado } from "@/lib/presupuesto/calculos";
import { generarSnapshotCierre } from "@/lib/presupuesto/cierres";
import { RUBROS_SUGERIDOS } from "@/lib/presupuesto/defaults";
import { calcularDesfases, mensajeDesfase } from "@/lib/presupuesto/desfases";
import type {
  GastoReal,
  PresupuestoCierreSnapshot,
  PresupuestoRubro,
} from "@/lib/presupuesto/tipos";

type Tab =
  | "resumen"
  | "agregar"
  | "seguimiento"
  | "graficas"
  | "aprendizajes"
  | "historico";

function hoyBogota(): string {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const bogota = new Date(utc + -5 * 3600000);
  return bogota.toISOString().slice(0, 10);
}

function mesActual(): string {
  return hoyBogota().slice(0, 7);
}

function inicializarRubros(): PresupuestoRubro[] {
  if (typeof window === "undefined") return [];
  const h = leerPresupuestoHogar();
  const d = leerPresupuestoDieta();
  const usados = h?.length ? h : d;
  if (usados && usados.length > 0) return usados;
  return RUBROS_SUGERIDOS.map((r, i) => ({ rubro: r, monto: 0, orden: i }));
}

type Props = {
  productos?: ProductoCatalogo[];
};

function grupoARubro(grupo: string): string {
  const g = grupo.toLowerCase();
  if (g.includes("carne")) return "Carnes";
  if (g.includes("grano")) return "Granos";
  if (g.includes("verdura")) return "Verduras";
  if (g.includes("fruta")) return "Frutas";
  if (g.includes("lácteo") || g.includes("leche")) return "Lácteos";
  if (g.includes("pan")) return "Panadería";
  if (g.includes("despensa")) return "Despensa";
  if (g.includes("aseo")) return "Aseo";
  if (g.includes("bebida")) return "Bebidas";
  if (g.includes("mecato") || g.includes("snack")) return "Mecato";
  return "Otros";
}

export function PresupuestoCliente({ productos = [] }: Props) {
  const [tab, setTab] = useState<Tab>("resumen");
  const [mes, setMes] = useState("");
  const [hoy, setHoy] = useState("");
  const [rubros, setRubros] = useState<PresupuestoRubro[]>([]);
  const [gastos, setGastos] = useState<GastoReal[]>([]);
  const [cierres, setCierres] = useState<PresupuestoCierreSnapshot[]>([]);
  const [form, setForm] = useState({
    fecha: "",
    rubro: "Carnes",
    productoId: "",
    productoNombre: "",
    modo: "catalogo" as "catalogo" | "nuevo",
    cantidad: "",
    unidad: "",
    precioUnitario: "",
    precioTotal: "",
    usarTotal: false,
    nota: "",
    monto: "",
  });

  useEffect(() => {
    const h = hoyBogota();
    const m = mesActual();
    setHoy(h);
    setMes(m);
    setForm((f) => ({ ...f, fecha: h }));
  }, []);

  const catalogoFiltrado = useMemo(() => {
    const q = form.productoNombre.trim().toLowerCase();
    if (!q) return productos.slice(0, 20);
    return productos
      .filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.grupo.toLowerCase().includes(q),
      )
      .slice(0, 30);
  }, [productos, form.productoNombre]);

  const prodMap = useMemo(() => {
    const m = new Map<string, ProductoCatalogo>();
    for (const p of productos) m.set(p.id, p);
    return m;
  }, [productos]);

  useEffect(() => {
    setRubros(inicializarRubros());
    setCierres(leerCierresLocal());
    if (!mes) return;
    try {
      const crudo = localStorage.getItem(`mercado-medellin:gastos:${mes}`);
      if (crudo) {
        setGastos(JSON.parse(crudo) as GastoReal[]);
      } else {
        setGastos([]);
      }
    } catch {
      setGastos([]);
    }
  }, [mes]);

  const guardarGastosLocal = (nuevos: GastoReal[]) => {
    setGastos(nuevos);
    try {
      localStorage.setItem(
        `mercado-medellin:gastos:${mes}`,
        JSON.stringify(nuevos),
      );
    } catch {
      // ignorar
    }
  };

  const { resumen, porRubro } = useMemo(
    () => compararPresupuestadoVsGastado(rubros, gastos, hoy, mes),
    [rubros, gastos, hoy, mes],
  );

  const filasDesfase = useMemo(() => {
    const filas = rubros
      .map((r) => ({
        rubro: r.rubro,
        presupuestado: r.monto,
        gastado: porRubro.get(r.rubro) ?? 0,
      }))
      .filter((f) => f.presupuestado > 0 || f.gastado > 0);
    return calcularDesfases(filas, hoy, mes);
  }, [rubros, porRubro, hoy, mes]);

  const aprendizajes = useMemo(
    () => generarAprendizajes(resumen, filasDesfase),
    [resumen, filasDesfase],
  );

  useEffect(() => {
    if (form.usarTotal) return;
    const cant = Number(form.cantidad);
    const pu = Number(form.precioUnitario);
    if (!cant || cant <= 0 || !pu || pu <= 0) return;
    const total = Math.floor(cant * pu);
    setForm((f) =>
      f.monto === String(total) ? f : { ...f, monto: String(total) },
    );
  }, [form.cantidad, form.precioUnitario, form.usarTotal]);

  useEffect(() => {
    if (!form.usarTotal) return;
    const pt = Number(form.precioTotal);
    if (!pt || pt <= 0) return;
    setForm((f) =>
      f.monto === String(Math.floor(pt))
        ? f
        : { ...f, monto: String(Math.floor(pt)) },
    );
  }, [form.precioTotal, form.usarTotal]);

  const agregar = async () => {
    const monto = Number(form.monto);
    if (!monto || monto <= 0) return;
    const cant = form.cantidad ? Number(form.cantidad) : null;
    const pu = form.precioUnitario ? Number(form.precioUnitario) : null;
    const partesNota: string[] = [];
    if (form.modo === "catalogo" && form.productoNombre)
      partesNota.push(form.productoNombre);
    if (form.modo === "nuevo" && form.productoNombre)
      partesNota.push(form.productoNombre);
    if (cant && cant > 0)
      partesNota.push(`Cant: ${cant}${form.unidad ? ` ${form.unidad}` : ""}`);
    if (pu && pu > 0 && !form.usarTotal)
      partesNota.push(`PU: ${pesos(Math.floor(pu))}`);
    if (form.nota.trim()) partesNota.push(form.nota.trim());
    const notaFinal = partesNota.length ? partesNota.join(" · ") : null;

    const gasto: GastoReal = {
      id: `local-${Date.now()}`,
      user_id: "local",
      fecha: form.fecha,
      mes,
      rubro: form.rubro,
      monto: Math.floor(monto),
      tienda_id: null,
      producto_id:
        form.modo === "catalogo" && form.productoId ? form.productoId : null,
      origen: "manual",
      nota: notaFinal,
      created_at: new Date().toISOString(),
    };
    const nuevos = [gasto, ...gastos];
    guardarGastosLocal(nuevos);
    setForm((f) => ({
      ...f,
      monto: "",
      nota: "",
      productoNombre: "",
      productoId: "",
      cantidad: "",
      precioUnitario: "",
      precioTotal: "",
      usarTotal: false,
      modo: "catalogo",
    }));
    avisar("gasto_agregado", { monto: gasto.monto, rubro: gasto.rubro });
    try {
      await agregarGasto({
        fecha: gasto.fecha,
        mes: gasto.mes,
        rubro: gasto.rubro,
        monto: gasto.monto,
        origen: "manual",
        nota: notaFinal,
        producto_id: gasto.producto_id,
      });
    } catch {
      // ignorar si no hay sesión
    }
  };

  const eliminar = async (id: string) => {
    const nuevos = gastos.filter((g) => g.id !== id);
    guardarGastosLocal(nuevos);
    avisar("gasto_eliminado");
    try {
      if (!id.startsWith("local-")) await eliminarGasto(id);
    } catch {
      // ignorar
    }
  };

  const guardarRubros = (nuevos: PresupuestoRubro[]) => {
    setRubros(nuevos);
    guardarPresupuestoHogar(nuevos);
    guardarPresupuestoDieta(nuevos);
  };

  const guardarCierre = () => {
    if (!mes) return;
    const snap = generarSnapshotCierre(mes, rubros, gastos);
    agregarCierreLocal(snap);
    setCierres(leerCierresLocal());
    avisar("presupuesto_guardado");
  };

  const tabs: { id: Tab; texto: string }[] = [
    { id: "resumen", texto: "Resumen" },
    { id: "agregar", texto: "Agregar gasto" },
    { id: "seguimiento", texto: "Seguimiento por rubro" },
    { id: "graficas", texto: "Gráficas" },
    { id: "aprendizajes", texto: "Aprendizajes" },
    { id: "historico", texto: "Histórico" } as { id: Tab; texto: string },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm">
          Mes:{" "}
          <input
            type="month"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className="rounded-[10px] border px-2 py-1"
          />
        </label>
        <button
          type="button"
          onClick={() => guardarRubros(rubros)}
          className="rounded-[10px] border px-3 py-1.5 text-sm"
        >
          Guardar presupuesto en dispositivo
        </button>
        <button
          type="button"
          onClick={guardarCierre}
          className="rounded-[10px] border px-3 py-1.5 text-sm"
        >
          Guardar cierre de mes
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={
              tab === t.id
                ? "rounded-[10px] bg-primary px-3 py-1.5 text-sm text-primary-foreground"
                : "rounded-[10px] border px-3 py-1.5 text-sm"
            }
          >
            {t.texto}
          </button>
        ))}
      </div>
      {tab === "resumen" && (
        <section
          data-tour="presupuesto-total"
          className="flex flex-col gap-3 rounded-[14px] border bg-card p-3.5"
        >
          <h2 className="text-lg font-bold">Resumen {mes}</h2>
          <div className="grid gap-2.5 sm:grid-cols-4">
            <div className="rounded-[12px] border p-2.5">
              <p className="text-xs text-muted-foreground">Presupuestado</p>
              <p className="text-lg font-bold tabular-nums">
                {pesos(resumen.presupuestado)}
              </p>
            </div>
            <div className="rounded-[12px] border p-2.5">
              <p className="text-xs text-muted-foreground">Gastado</p>
              <p className="text-lg font-bold tabular-nums">
                {pesos(resumen.gastado)}
              </p>
            </div>
            <div className="rounded-[12px] border p-2.5">
              <p className="text-xs text-muted-foreground">Restante</p>
              <p className="text-lg font-bold tabular-nums">
                {pesos(resumen.restante)}
              </p>
            </div>
            <div className="rounded-[12px] border p-2.5">
              <p className="text-xs text-muted-foreground">
                Proyección fin de mes
              </p>
              <p className="text-lg font-bold tabular-nums">
                {pesos(resumen.proyeccionFinMes)}
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Usado: {resumen.porcentajeUsado}% · Días:{" "}
            {resumen.diasTranscurridos}/{resumen.diasDelMes}
          </p>
        </section>
      )}
      {tab === "agregar" && (
        <section className="flex flex-col gap-3 rounded-[14px] border bg-card p-3.5">
          <h2 className="text-lg font-bold">Agregar gasto</h2>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <label className="text-sm">
              Fecha
              <input
                type="date"
                value={form.fecha}
                onChange={(e) =>
                  setForm((f) => ({ ...f, fecha: e.target.value }))
                }
                className="mt-1 w-full rounded-[10px] border px-2 py-1.5"
              />
            </label>
            <label className="text-sm">
              Tipo
              <select
                value={form.modo}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    modo: e.target.value as "catalogo" | "nuevo",
                    productoId: "",
                  }))
                }
                className="mt-1 w-full rounded-[10px] border px-2 py-1.5"
              >
                <option value="catalogo">Producto del catálogo</option>
                <option value="nuevo">Agregar producto nuevo</option>
              </select>
            </label>
            <label className="text-sm sm:col-span-2">
              Producto
              <input
                value={form.productoNombre}
                placeholder={
                  form.modo === "catalogo"
                    ? "Buscar producto..."
                    : "Nombre del producto"
                }
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    productoNombre: e.target.value,
                    productoId: "",
                  }))
                }
                className="mt-1 w-full rounded-[10px] border px-2 py-1.5"
              />
            </label>
            {form.modo === "catalogo" && form.productoNombre && (
              <div className="sm:col-span-2 -mt-1 flex max-h-40 flex-col overflow-auto rounded-[10px] border">
                {catalogoFiltrado.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        productoId: p.id,
                        productoNombre: p.nombre,
                        rubro: grupoARubro(p.grupo),
                        unidad: p.unidad || f.unidad,
                      }))
                    }
                    className="flex items-center justify-between px-2 py-1.5 text-left text-sm hover:bg-muted"
                  >
                    <span>
                      {p.nombre}{" "}
                      <span className="text-muted-foreground">· {p.grupo}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {p.unidad}
                    </span>
                  </button>
                ))}
                {catalogoFiltrado.length === 0 && (
                  <p className="px-2 py-1.5 text-xs text-muted-foreground">
                    Sin resultados. Puedes usar "Agregar producto nuevo".
                  </p>
                )}
              </div>
            )}
            <label className="text-sm">
              Rubro / Grupo
              <select
                value={form.rubro}
                onChange={(e) =>
                  setForm((f) => ({ ...f, rubro: e.target.value }))
                }
                className="mt-1 w-full rounded-[10px] border px-2 py-1.5"
              >
                {RUBROS_SUGERIDOS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Unidad (opcional)
              <input
                value={form.unidad}
                onChange={(e) =>
                  setForm((f) => ({ ...f, unidad: e.target.value }))
                }
                placeholder="kg, lb, und, panal..."
                className="mt-1 w-full rounded-[10px] border px-2 py-1.5"
              />
            </label>
            <label className="text-sm">
              Cantidad
              <input
                type="number"
                min={0}
                step="any"
                value={form.cantidad}
                onChange={(e) =>
                  setForm((f) => ({ ...f, cantidad: e.target.value }))
                }
                className="mt-1 w-full rounded-[10px] border px-2 py-1.5"
              />
            </label>
            <label className="text-sm">
              <span className="flex items-center justify-between">
                <span>
                  {form.usarTotal ? "Precio total" : "Precio por unidad"}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({ ...f, usarTotal: !f.usarTotal }))
                  }
                  className="text-xs text-muted-foreground"
                >
                  {form.usarTotal ? "Cambiar a por unidad" : "Cambiar a total"}
                </button>
              </span>
              {form.usarTotal ? (
                <input
                  type="number"
                  min={0}
                  value={form.precioTotal}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, precioTotal: e.target.value }))
                  }
                  className="mt-1 w-full rounded-[10px] border px-2 py-1.5"
                />
              ) : (
                <input
                  type="number"
                  min={0}
                  value={form.precioUnitario}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, precioUnitario: e.target.value }))
                  }
                  className="mt-1 w-full rounded-[10px] border px-2 py-1.5"
                />
              )}
            </label>
            <label className="text-sm">
              Monto total
              <input
                type="number"
                min={0}
                value={form.monto}
                onChange={(e) =>
                  setForm((f) => ({ ...f, monto: e.target.value }))
                }
                className="mt-1 w-full rounded-[10px] border px-2 py-1.5"
              />
            </label>
            <label className="text-sm">
              Nota / detalle
              <input
                value={form.nota}
                placeholder="Ej: 3 canastas de huevos, oferta..."
                onChange={(e) =>
                  setForm((f) => ({ ...f, nota: e.target.value }))
                }
                className="mt-1 w-full rounded-[10px] border px-2 py-1.5"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={agregar}
            className="self-start rounded-[10px] bg-primary px-3 py-1.5 text-sm text-primary-foreground transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100"
          >
            Agregar gasto
          </button>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="py-1.5 pr-2 font-medium">Fecha</th>
                  <th className="px-2 font-medium">Producto</th>
                  <th className="px-2 font-medium">Rubro</th>
                  <th className="px-2 text-right font-medium">Monto</th>
                  <th className="px-2 font-medium">Detalle</th>
                  <th className="pl-2" />
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {gastos.map((g) => {
                  const prod = g.producto_id
                    ? prodMap.get(g.producto_id)
                    : null;
                  return (
                    <tr key={g.id} className="border-t">
                      <td className="py-1.5 pr-2">{g.fecha}</td>
                      <td className="px-2">
                        {prod ? (
                          <span className="flex items-center gap-1.5">
                            {prod.emoji && <span>{prod.emoji}</span>}
                            <span>{prod.nombre}</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Manual</span>
                        )}
                      </td>
                      <td className="px-2">{g.rubro}</td>
                      <td className="px-2 text-right">{pesos(g.monto)}</td>
                      <td className="px-2 text-muted-foreground">
                        {g.nota ?? ""}
                      </td>
                      <td className="pl-2 text-right">
                        <button
                          type="button"
                          onClick={() => eliminar(g.id)}
                          className="text-xs text-muted-foreground"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {tab === "seguimiento" && (
        <section className="flex flex-col gap-3 rounded-[14px] border bg-card p-3.5">
          <h2 className="text-lg font-bold">Seguimiento por rubro</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="py-1.5 pr-2 font-medium">Rubro</th>
                  <th className="px-2 text-right font-medium">Presupuestado</th>
                  <th className="px-2 text-right font-medium">Gastado</th>
                  <th className="px-2 text-right font-medium">
                    Esperado a hoy
                  </th>
                  <th className="px-2 text-right font-medium">Proyección</th>
                  <th className="px-2 text-right font-medium">% usado</th>
                  <th className="pl-2 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {filasDesfase.map((f) => (
                  <tr key={f.rubro} className="border-t">
                    <td className="py-1.5 pr-2">{f.rubro}</td>
                    <td className="px-2 text-right">
                      {pesos(f.presupuestado)}
                    </td>
                    <td className="px-2 text-right">{pesos(f.gastado)}</td>
                    <td className="px-2 text-right">
                      {pesos(f.esperadoHastaHoy)}
                    </td>
                    <td className="px-2 text-right">{pesos(f.proyeccion)}</td>
                    <td className="px-2 text-right">{f.porcentajeUsado}%</td>
                    <td className="pl-2 text-xs">
                      {f.estado === "desfasado"
                        ? "Desfasado"
                        : f.estado === "ahorrando"
                          ? "Ahorrando"
                          : "Al día"}
                      {" · "}
                      {mensajeDesfase(f)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {tab === "graficas" && (
        <section className="flex flex-col gap-3 rounded-[14px] border bg-card p-3.5">
          <h2 className="text-lg font-bold">Gráficas</h2>
          <p className="text-sm text-muted-foreground">
            Visualización de presupuestado vs gastado por rubro.
          </p>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {filasDesfase.slice(0, 6).map((f) => {
              const max = Math.max(f.presupuestado, f.gastado, 1);
              const pW = Math.min(
                100,
                Math.round((f.presupuestado / max) * 100),
              );
              const gW = Math.min(100, Math.round((f.gastado / max) * 100));
              return (
                <div
                  key={f.rubro}
                  className="flex flex-col gap-1.5 rounded-[12px] border p-2.5"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span>{f.rubro}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {f.porcentajeUsado}%
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary/70 motion-reduce:transition-none"
                        style={{ width: `${pW}%` }}
                      />
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className={
                          f.estado === "desfasado"
                            ? "h-2 rounded-full bg-up-ink motion-reduce:transition-none"
                            : "h-2 rounded-full bg-save-ink motion-reduce:transition-none"
                        }
                        style={{ width: `${gW}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Presupuestado {pesos(f.presupuestado)} · Gastado{" "}
                    {pesos(f.gastado)}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}
      {tab === "aprendizajes" && (
        <section className="flex flex-col gap-3 rounded-[14px] border bg-card p-3.5">
          <h2 className="text-lg font-bold">
            Aprendizajes / Situaciones del mes
          </h2>
          {aprendizajes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay aprendizajes. Agrega gastos o ajusta tu presupuesto
              para ver insights.
            </p>
          ) : (
            <div className="grid gap-2.5">
              {aprendizajes.map((a) => (
                <article
                  key={`${a.titulo}-${a.tipo}`}
                  className="flex flex-col gap-1 rounded-[12px] border p-2.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      {a.tipo}
                    </span>
                    <h3 className="font-semibold">{a.titulo}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {a.descripcion}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
      {tab === "historico" && (
        <section className="flex flex-col gap-3 rounded-[14px] border bg-card p-3.5">
          <h2 className="text-lg font-bold">Histórico mensual</h2>
          {cierres.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay cierres guardados. Usa "Guardar cierre de mes" para
              guardar un snapshot con datos reales.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="py-1.5 pr-2 font-medium">Mes</th>
                    <th className="px-2 text-right font-medium">
                      Presupuestado
                    </th>
                    <th className="px-2 text-right font-medium">Gastado</th>
                    <th className="px-2 text-right font-medium">Ahorro</th>
                    <th className="pl-2 text-right font-medium">% usado</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {cierres.map((c) => {
                    const usado =
                      c.total_presupuestado > 0
                        ? Math.round(
                            (c.total_gastado / c.total_presupuestado) * 100,
                          )
                        : c.total_gastado > 0
                          ? 100
                          : 0;
                    return (
                      <tr key={c.mes} className="border-t">
                        <td className="py-1.5 pr-2">{c.mes}</td>
                        <td className="px-2 text-right">
                          {pesos(c.total_presupuestado)}
                        </td>
                        <td className="px-2 text-right">
                          {pesos(c.total_gastado)}
                        </td>
                        <td className="px-2 text-right">{pesos(c.ahorro)}</td>
                        <td className="pl-2 text-right">{usado}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {cierres.length > 0 && (
            <div className="grid gap-2.5 sm:grid-cols-2">
              {cierres.slice(-6).map((c) => {
                const max = Math.max(c.total_presupuestado, c.total_gastado, 1);
                const pW = Math.min(
                  100,
                  Math.round((c.total_presupuestado / max) * 100),
                );
                const gW = Math.min(
                  100,
                  Math.round((c.total_gastado / max) * 100),
                );
                return (
                  <div
                    key={`g-${c.mes}`}
                    className="flex flex-col gap-1.5 rounded-[12px] border p-2.5"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span>{c.mes}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {pesos(c.ahorro)} ahorrado
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="h-2 rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-primary/70"
                          style={{ width: `${pW}%` }}
                        />
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-up-ink"
                          style={{ width: `${gW}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Presupuestado {pesos(c.total_presupuestado)} · Gastado{" "}
                      {pesos(c.total_gastado)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
