import { leerBoletin, minorista } from "@/corrida/adaptadores/sipsa";
import { vaquita } from "@/corrida/adaptadores/vaquita";
import { d1 } from "@/corrida/adaptadores/vtex";
import type { Admin } from "@/corrida/admin";
import { alertasUsuarios } from "@/corrida/alertas-usuario";
import type { Aviso } from "@/corrida/correo";
import type { Adaptador, Consulta, Contexto, Hallazgo } from "@/corrida/tipos";
import { alertasFuenteCaida } from "@/lib/alertas/reglas";
import type { TablesInsert } from "@/lib/supabase/tipos";
import type { UnidadBase } from "@/lib/unidades";

/** Tiendas automáticas. PriceSmart y Tienda/Carnicería de barrio van por anotados (blueprint §1). */
export const ADAPTADORES: Adaptador[] = [d1, minorista, vaquita];

const PRIORIDAD = [
  ["Frutas", "Verduras", "Tubérculos"],
  ["Proteínas", "Lácteos", "Granos"],
  ["Despensa", "Panadería", "Aseo"],
  ["Mecato", "Bebidas", "Gourmet"],
];
const prioridad = (grupo: string) => {
  const i = PRIORIDAD.findIndex((g) => g.includes(grupo));
  return i < 0 ? PRIORIDAD.length : i;
};

type Estado = "ok" | "parcial" | "fallo";

/** ok: más del 50 % de lo intentado; parcial: al menos 1; fallo: 0. */
export function estadoTienda(intentados: number, hallazgos: number): Estado {
  if (hallazgos === 0) return "fallo";
  return hallazgos * 2 > intentados ? "ok" : "parcial";
}

export const esLunes = (fecha: string) =>
  new Date(`${fecha}T12:00:00Z`).getUTCDay() === 1;

export type Opciones = {
  /** Incluir los semanales aunque no sea lunes. */
  todo?: boolean;
  /** Limitar a estos productos (pruebas). */
  productos?: string[];
  adaptadores?: Adaptador[];
  /** Correo al admin (fuente_caida). Sin él solo queda en el resumen. */
  aviso?: Aviso;
};

export type ConteoTienda = {
  intentados: number;
  hallazgos: number;
  errores: number;
  estado: Estado;
};

export type Resumen = {
  corrida_id: number;
  tiendas: Record<string, ConteoTienda>;
  escritos: number;
  revisar: number;
  causas: number;
  alertas: number;
  /** Tiendas automáticas en fallo o con ≥3 días sin ultimo_ok. */
  caidas: string[];
};

type Respuesta<T> = { data: T | null; error: { message: string } | null };

/** Escritura: solo falla si hubo error. */
function revisa(r: Respuesta<unknown>, que: string): void {
  if (r.error) throw new Error(`${que}: ${r.error.message}`);
}

/** Lectura: falla si hubo error o no vino nada. */
function datos<T>(r: Respuesta<T>, que: string): NonNullable<T> {
  revisa(r, que);
  if (r.data == null) throw new Error(`${que}: sin datos`);
  return r.data;
}

const clave = (producto: string, tienda: string) => `${producto}|${tienda}`;

export async function correr(
  db: Admin,
  ctx: Contexto,
  opciones: Opciones = {},
): Promise<Resumen> {
  const adaptadores = opciones.adaptadores ?? ADAPTADORES;
  const tiendas = adaptadores.map((a) => a.tienda);
  const { data: corrida, error } = await db
    .from("corridas")
    .insert({})
    .select("id")
    .single();
  if (error) throw new Error(`corridas: ${error.message}`);

  // 1. Productos del día: los diarios siempre; los semanales los lunes o con --todo.
  const semanal = opciones.todo || esLunes(ctx.hoy);
  const productos = datos(
    await db
      .from("productos")
      .select("id, grupo, unidad_base, cantidad_base, frecuencia"),
    "productos",
  )
    .filter((p) => semanal || p.frecuencia === "diaria")
    .filter((p) => !opciones.productos || opciones.productos.includes(p.id))
    .sort((a, b) => prioridad(a.grupo) - prioridad(b.grupo));

  // ≤ 144 × 3 filas: por debajo del tope de 1000 de PostgREST.
  const fuentes = new Map(
    datos(
      await db
        .from("producto_fuente")
        .select("producto_id, tienda_id, url, termino, sku, activo")
        .in("tienda_id", tiendas),
      "producto_fuente",
    ).map((f) => [clave(f.producto_id, f.tienda_id), f]),
  );
  const actuales = new Map(
    datos(
      await db
        .from("precios_actuales")
        .select("producto_id, tienda_id, precio, fecha, estado, revisar")
        .in("tienda_id", tiendas),
      "precios_actuales",
    ).map((p) => [clave(p.producto_id, p.tienda_id), p]),
  );

  // 2. Tiendas en paralelo; dentro de cada una, en serie (la pausa la hace el adaptador).
  const resultados = await Promise.all(
    adaptadores.map(async (a) => {
      const consultas: Consulta[] = [];
      for (const p of productos) {
        const f = fuentes.get(clave(p.id, a.tienda));
        if (f && !f.activo) continue;
        const c: Consulta = {
          producto_id: p.id,
          unidad_base: p.unidad_base as UnidadBase,
          cantidad_base: Number(p.cantidad_base),
          termino: f?.termino ?? null,
          sku: f?.sku ?? null,
          url: f?.url ?? null,
        };
        if (a.cubre(c)) consultas.push(c);
      }
      const hallazgos: Hallazgo[] = [];
      let errores = 0;
      for (const c of consultas) {
        try {
          const h = await a.buscar(c, ctx);
          if (h) hallazgos.push(h);
        } catch (e) {
          errores++;
          console.error(
            `${a.tienda}/${c.producto_id}: ${(e as Error).message}`,
          );
        }
      }
      return {
        tienda: a.tienda,
        intentados: consultas.length,
        hallazgos,
        errores,
      };
    }),
  );

  // 3. Escritura. Sin hallazgo no se toca precios_actuales.
  const filasActual: TablesInsert<"precios_actuales">[] = [];
  const filasHistorial: TablesInsert<"precios_historial">[] = [];
  const filasSku: TablesInsert<"producto_fuente">[] = [];
  for (const { tienda, hallazgos } of resultados) {
    for (const h of hallazgos) {
      const fecha = h.fecha ?? ctx.hoy;
      const previo = actuales.get(clave(h.producto_id, tienda));
      // Un dato con fecha propia (SIPSA) solo entra si es más nuevo que lo guardado.
      if (h.fecha && previo && previo.fecha >= h.fecha) continue;
      // > 35 % contra el último real. Al repetir la corrida el mismo día, el "previo" ya es
      // el de hoy: se conserva la marca de la primera vuelta para que el estado no cambie.
      const revisar =
        previo?.fecha === fecha
          ? previo.revisar
          : previo?.estado === "real" &&
            previo.precio != null &&
            Math.abs(h.precio - previo.precio) * 100 > previo.precio * 35;
      filasActual.push({
        producto_id: h.producto_id,
        tienda_id: tienda,
        precio: h.precio,
        fecha,
        fuente: tienda === "minorista" ? "SIPSA (mayorista)" : h.url,
        estado: "real",
        revisar,
        nota: null,
      });
      filasHistorial.push({
        producto_id: h.producto_id,
        tienda_id: tienda,
        fecha,
        precio: h.precio,
        estado: "real",
      });
      if (h.sku)
        filasSku.push({
          producto_id: h.producto_id,
          tienda_id: tienda,
          sku: h.sku,
        });
    }
  }
  if (filasActual.length) {
    revisa(
      await db
        .from("precios_actuales")
        .upsert(filasActual, { onConflict: "producto_id,tienda_id" }),
      "precios_actuales",
    );
    revisa(
      await db
        .from("precios_historial")
        .upsert(filasHistorial, { onConflict: "producto_id,tienda_id,fecha" }),
      "precios_historial",
    );
  }
  if (filasSku.length)
    revisa(
      await db
        .from("producto_fuente")
        .upsert(filasSku, { onConflict: "producto_id,tienda_id" }),
      "producto_fuente",
    );

  // 4. Causas del boletín SIPSA (una por producto y fecha; el texto, literal).
  let causas = 0;
  if (tiendas.includes(minorista.tienda)) {
    const delDia = new Set(productos.map((p) => p.id));
    const unicas = new Map(
      ((await leerBoletin(ctx))?.causas ?? [])
        .filter((c) => delDia.has(c.producto_id))
        .map((c) => [clave(c.producto_id, c.fecha), c]),
    );
    if (unicas.size) {
      revisa(
        await db
          .from("clima_causas")
          .upsert([...unicas.values()], { onConflict: "producto_id,fecha" }),
        "clima_causas",
      );
      causas = unicas.size;
    }
  }

  // 5. Estado por tienda. En fallo no se toca ultimo_ok (por eso un upsert por tienda:
  // en un upsert por lotes la columna que falta quedaría en null).
  const conteos: Record<string, ConteoTienda> = {};
  for (const r of resultados) {
    const estado = estadoTienda(r.intentados, r.hallazgos.length);
    conteos[r.tienda] = {
      intentados: r.intentados,
      hallazgos: r.hallazgos.length,
      errores: r.errores,
      estado,
    };
    revisa(
      await db
        .from("tienda_estado")
        .upsert(
          estado === "fallo"
            ? { tienda_id: r.tienda, estado }
            : { tienda_id: r.tienda, estado, ultimo_ok: ctx.hoy },
        ),
      "tienda_estado",
    );
  }

  // 6. Fuentes caídas: solo las tiendas automáticas (las demás van por anotados y
  // estarían "caídas" siempre). Un único correo al admin por corrida.
  const caidas = alertasFuenteCaida(
    datos(
      await db
        .from("tienda_estado")
        .select("tienda_id, estado, ultimo_ok")
        .in("tienda_id", tiendas),
      "tienda_estado",
    ),
    ctx.hoy,
  );
  if (caidas.length && opciones.aviso)
    await opciones.aviso(
      `${caidas.length} fuente(s) caída(s) el ${ctx.hoy}`,
      caidas
        .map((c) => {
          const n = conteos[c.tienda_id ?? ""];
          return `- ${c.tienda_id}: ${n ? `${n.estado}, ${n.hallazgos}/${n.intentados} hallazgos` : "sin datos"}`;
        })
        .join("\n"),
    );

  // 7. Alertas de cada usuario con lista.
  const alertas = await alertasUsuarios(db, ctx.hoy);

  revisa(
    await db
      .from("corridas")
      .update({
        fin: new Date().toISOString(),
        fuentes: Object.fromEntries(
          Object.entries(conteos).map(([t, c]) => [t, c.estado]),
        ),
        conteos,
        notas: `productos=${productos.length} escritos=${filasActual.length} causas=${causas} alertas=${alertas} caidas=${caidas.length}`,
      })
      .eq("id", corrida.id),
    "corridas",
  );

  return {
    corrida_id: corrida.id,
    tiendas: conteos,
    escritos: filasActual.length,
    revisar: filasActual.filter((f) => f.revisar).length,
    causas,
    alertas,
    caidas: caidas.map((c) => c.tienda_id ?? ""),
  };
}
