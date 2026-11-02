"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  agregarGasto,
  editarGasto,
  eliminarGasto,
  listarGastos,
} from "@/app/presupuesto/acciones";
import { CampoMoneda } from "@/components/campo-moneda";
import { ImportarFactura } from "@/components/importar/importar-factura";
import { avisar, textoAviso } from "@/lib/avisos";
import type { ProductoCatalogo } from "@/lib/datos";
import { hoyBogota } from "@/lib/fecha";
import { pesos } from "@/lib/formato";
import {
  agregarCierreLocal,
  fusionarGastos,
  guardarGastosLocal as guardarGastosMes,
  guardarPresupuestoDieta,
  guardarPresupuestoHogar,
  leerCierresLocal,
  leerGastosLocal as leerGastosMes,
  rubrosIniciales,
} from "@/lib/presupuesto/almacenamiento";
import { generarAprendizajes } from "@/lib/presupuesto/aprendizajes";
import { compararPresupuestadoVsGastado } from "@/lib/presupuesto/calculos";
import { generarSnapshotCierre } from "@/lib/presupuesto/cierres";
import { RUBROS_SUGERIDOS } from "@/lib/presupuesto/defaults";
import { calcularDesfases, mensajeDesfase } from "@/lib/presupuesto/desfases";
import { grupoARubro } from "@/lib/presupuesto/rubros";
import type {
  GastoReal,
  PresupuestoCierreSnapshot,
  PresupuestoRubro,
} from "@/lib/presupuesto/tipos";
import {
  CANTIDADES_GASTO,
  UNIDADES_GASTO,
} from "@/lib/presupuesto/unidades-gasto";
import type { CambiosGasto } from "./fila-gasto";
import {
  avisoDeCreacion,
  crearProductoDeGasto,
  PRODUCTO_NUEVO_VACIO,
  ProductoNuevo,
} from "./producto-nuevo";
import { SugerenciasProducto } from "./sugerencias-producto";
import { TablaGastos } from "./tabla-gastos";

type Tab =
  | "resumen"
  | "agregar"
  | "seguimiento"
  | "graficas"
  | "aprendizajes"
  | "historico"
  | "importar";

const mesActual = () => hoyBogota().slice(0, 7);

type Props = {
  productos?: ProductoCatalogo[];
  tiendas?: { id: string; nombre: string }[];
  conSesion?: boolean;
};

export function PresupuestoCliente({
  productos = [],
  tiendas = [],
  conSesion = false,
}: Props) {
  const router = useRouter();
  const [nuevo, setNuevo] = useState(PRODUCTO_NUEVO_VACIO);
  const [tab, setTab] = useState<Tab>("resumen");
  const [version, setVersion] = useState(0);
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: `version` solo fuerza la recarga
  useEffect(() => {
    setRubros(rubrosIniciales());
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
    // Con sesión, lo del servidor (incluidas las importaciones) se une a lo local.
    void listarGastos(mes).then((r) => {
      if (r.ok)
        setGastos((prev) => fusionarGastos(prev, r.gastos as GastoReal[]));
    });
  }, [mes, version]);

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

  const filasDesfase = useMemo(
    () =>
      calcularDesfases(
        rubros.map((r) => ({
          rubro: r.rubro,
          presupuestado: r.monto,
          gastado: porRubro.get(r.rubro) ?? 0,
        })),
        hoy,
        mes,
      ),
    [rubros, porRubro, hoy, mes],
  );
  // La tabla lista todos los rubros (para poder fijar el monto); calcularDesfases omite los vacíos.
  const filasTabla = useMemo(
    () =>
      rubros.map(
        (r) =>
          filasDesfase.find((f) => f.rubro === r.rubro) ?? {
            rubro: r.rubro,
            presupuestado: r.monto,
            gastado: 0,
            esperadoHastaHoy: 0,
            proyeccion: 0,
            porcentajeUsado: 0,
            desfasePct: 0,
            estado: "al_dia" as const,
          },
      ),
    [rubros, filasDesfase],
  );

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
    // Con sesión, «producto nuevo» crea el producto en el catálogo y el gasto queda ligado a él.
    let creado: { id: string; tienda: string } | null = null;
    if (form.modo === "nuevo" && form.productoNombre.trim() && conSesion) {
      const r = await crearProductoDeGasto(
        form.productoNombre,
        form.unidad,
        nuevo,
      );
      if (!r.ok)
        return r.error === "en_curso"
          ? undefined
          : avisar(avisoDeCreacion(r.error));
      creado = { id: r.id, tienda: nuevo.tiendaId };
      avisar(r.existente ? "producto_existente_agregado" : "producto_creado", {
        nombre: form.productoNombre.trim(),
        tienda: tiendas.find((t) => t.id === nuevo.tiendaId)?.nombre ?? "",
      });
      router.refresh();
    }
    const partesNota: string[] = [];
    if (form.productoNombre && !creado) partesNota.push(form.productoNombre);
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
      mes: form.fecha.slice(0, 7),
      rubro: form.rubro,
      monto: Math.floor(monto),
      tienda_id: creado?.tienda ?? null,
      producto_id:
        creado?.id ??
        (form.modo === "catalogo" && form.productoId ? form.productoId : null),
      origen: "manual",
      nota: notaFinal,
      created_at: new Date().toISOString(),
    };
    const nuevos = [gasto, ...gastos];
    // Un gasto de otro mes se guarda en ese mes, no en el que está abierto en pantalla.
    if (gasto.mes === mes) guardarGastosLocal(nuevos);
    else guardarGastosMes(gasto.mes, [gasto, ...leerGastosMes(gasto.mes)]);
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
    setNuevo(PRODUCTO_NUEVO_VACIO);
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
        tienda_id: gasto.tienda_id,
      });
      setVersion((v) => v + 1);
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

  /** Guarda los cambios de un gasto; devuelve el texto del error o `null`. Con sesión, primero el servidor. */
  const editar = async (
    g: GastoReal,
    c: CambiosGasto,
  ): Promise<string | null> => {
    if (!g.id.startsWith("local-")) {
      try {
        const r = await editarGasto({ id: g.id, ...c });
        if (!r.ok)
          return r.error === "ajeno"
            ? "Solo puedes editar tus gastos."
            : textoAviso("gasto_edicion_invalida");
      } catch {
        return textoAviso("sin_conexion");
      }
    }
    const nuevo: GastoReal = { ...g, ...c, mes: c.fecha.slice(0, 7) };
    // Si cambió de mes, sale de este y entra al otro; si no, se reemplaza en su sitio.
    if (nuevo.mes === mes)
      guardarGastosLocal(gastos.map((x) => (x.id === g.id ? nuevo : x)));
    else {
      guardarGastosLocal(gastos.filter((x) => x.id !== g.id));
      guardarGastosMes(nuevo.mes, [
        nuevo,
        ...leerGastosMes(nuevo.mes).filter((x) => x.id !== nuevo.id),
      ]);
    }
    avisar("gasto_editado");
    return null;
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
    { id: "importar", texto: "Importar factura" },
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
              <p className="text-[11px] text-muted-foreground">
                Suma de los montos que escribes por rubro en «Seguimiento por
                rubro»
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
              <p className="text-[11px] text-muted-foreground">
                Gastado ÷ {resumen.diasTranscurridos} días ×{" "}
                {resumen.diasDelMes} del mes (ritmo actual)
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
              <SugerenciasProducto
                productos={catalogoFiltrado}
                onElegir={(p) =>
                  setForm((f) => ({
                    ...f,
                    productoId: p.id,
                    productoNombre: p.nombre,
                    rubro: grupoARubro(p.grupo),
                    unidad: p.unidad || f.unidad,
                  }))
                }
              />
            )}
            {form.modo === "nuevo" && (
              <ProductoNuevo
                valor={nuevo}
                onChange={setNuevo}
                grupos={[
                  ...new Set(["Otros", ...productos.map((p) => p.grupo)]),
                ].sort()}
                tiendas={tiendas}
                conSesion={conSesion}
              />
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
                list="unidades-gasto"
                value={form.unidad}
                onChange={(e) =>
                  setForm((f) => ({ ...f, unidad: e.target.value }))
                }
                placeholder="Elige o escribe: kg, lb, und, panal..."
                className="mt-1 w-full rounded-[10px] border px-2 py-1.5"
              />
              <datalist id="unidades-gasto">
                {UNIDADES_GASTO.map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
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
              <span className="mt-1 flex flex-wrap gap-1">
                {CANTIDADES_GASTO.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, cantidad: c }))}
                    className="rounded-full bg-secondary px-2.5 py-1 text-xs"
                  >
                    {c}
                  </button>
                ))}
              </span>
            </label>
            <div className="text-sm">
              <span className="flex items-center justify-between">
                <label htmlFor="precio-gasto">
                  {form.usarTotal ? "Precio total" : "Precio por unidad"}
                </label>
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
                <CampoMoneda
                  id="precio-gasto"
                  value={form.precioTotal}
                  onChange={(v) => setForm((f) => ({ ...f, precioTotal: v }))}
                  className="mt-1 w-full min-w-0 flex-1 rounded-[10px] border px-2 py-1.5"
                />
              ) : (
                <CampoMoneda
                  id="precio-gasto"
                  value={form.precioUnitario}
                  onChange={(v) =>
                    setForm((f) => ({ ...f, precioUnitario: v }))
                  }
                  className="mt-1 w-full min-w-0 flex-1 rounded-[10px] border px-2 py-1.5"
                />
              )}
            </div>
            <div className="text-sm">
              <label htmlFor="monto-gasto">Monto total</label>
              <CampoMoneda
                id="monto-gasto"
                value={form.monto}
                onChange={(v) => setForm((f) => ({ ...f, monto: v }))}
                className="mt-1 w-full min-w-0 flex-1 rounded-[10px] border px-2 py-1.5"
              />
            </div>
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
          <TablaGastos
            gastos={gastos}
            productos={productos}
            tiendas={tiendas}
            rubros={rubros.map((r) => r.rubro)}
            onEditar={editar}
            onEliminar={eliminar}
          />
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
                {filasTabla.map((f) => (
                  <tr key={f.rubro} className="border-t">
                    <td className="py-1.5 pr-2">{f.rubro}</td>
                    <td className="px-2 text-right">
                      <CampoMoneda
                        aria-label={`Presupuesto de ${f.rubro}`}
                        value={f.presupuestado ? String(f.presupuestado) : ""}
                        placeholder="0"
                        onChange={(v) =>
                          guardarRubros(
                            rubros.map((r) =>
                              r.rubro === f.rubro
                                ? { ...r, monto: Number(v) || 0 }
                                : r,
                            ),
                          )
                        }
                        className="w-28 rounded-[10px] border px-2 py-1 text-right"
                      />
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
      {tab === "importar" && (
        <ImportarFactura
          productos={productos}
          onImportado={() => setVersion((v) => v + 1)}
        />
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
