import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { clienteAdmin } from "@/corrida/admin";
import { correr } from "@/corrida/orquestador";
import { contextoPrueba, fetchFalso } from "../helpers/fetch-falso";

// Corre contra Supabase local (pnpm exec supabase start && pnpm env:local && pnpm migrar)
// con fixtures reales. Toca solo estos productos y lo deja todo como estaba al final.
const PRODUCTOS = ["aceite", "banano"];
const TIENDAS = ["d1", "euro", "minorista"];
const HOY = "2026-10-26"; // fecha de los fixtures capturados

const db = clienteAdmin();
const ctx = (f: typeof fetch) => ({ ...contextoPrueba(f), hoy: HOY });

async function foto() {
  const actuales = await db
    .from("precios_actuales")
    .select(
      "producto_id, tienda_id, precio, fecha, fuente, estado, revisar, nota",
    )
    .in("producto_id", PRODUCTOS)
    .in("tienda_id", TIENDAS)
    .order("producto_id")
    .order("tienda_id");
  const historial = await db
    .from("precios_historial")
    .select("producto_id, tienda_id, fecha, precio, estado")
    .in("producto_id", PRODUCTOS)
    .in("tienda_id", TIENDAS)
    .gte("fecha", "2026-10-20")
    .order("producto_id")
    .order("tienda_id")
    .order("fecha");
  if (actuales.error || historial.error)
    throw actuales.error ?? historial.error;
  return { actuales: actuales.data, historial: historial.data };
}

// Copia de lo que la corrida modifica, para restaurarlo.
let antes: {
  actuales: unknown[];
  fuentes: unknown[];
  estados: unknown[];
  maxCorrida: number;
};

beforeAll(async () => {
  const [a, f, e, c] = await Promise.all([
    db.from("precios_actuales").select("*").in("producto_id", PRODUCTOS),
    db.from("producto_fuente").select("*").in("producto_id", PRODUCTOS),
    db.from("tienda_estado").select("*"),
    db.from("corridas").select("id").order("id", { ascending: false }).limit(1),
  ]);
  antes = {
    actuales: a.data ?? [],
    fuentes: f.data ?? [],
    estados: e.data ?? [],
    maxCorrida: c.data?.[0]?.id ?? 0,
  };
  // Precio real previo de aceite en D1 lejos del actual, para provocar el salto > 35 %.
  const semilla = await db.from("precios_actuales").upsert({
    producto_id: "aceite",
    tienda_id: "d1",
    precio: 5000,
    fecha: "2026-10-25",
    estado: "real",
    revisar: false,
  });
  if (semilla.error) throw semilla.error;
});

afterAll(async () => {
  await db
    .from("precios_historial")
    .delete()
    .in("producto_id", PRODUCTOS)
    .eq("fecha", HOY);
  await db.from("clima_causas").delete().eq("fecha", HOY);
  await db.from("corridas").delete().gt("id", antes.maxCorrida);
  // biome-ignore lint/suspicious/noExplicitAny: filas tal cual se leyeron
  await db.from("precios_actuales").upsert(antes.actuales as any);
  // biome-ignore lint/suspicious/noExplicitAny: filas tal cual se leyeron
  await db.from("producto_fuente").upsert(antes.fuentes as any);
  // biome-ignore lint/suspicious/noExplicitAny: filas tal cual se leyeron
  await db.from("tienda_estado").upsert(antes.estados as any);
});

describe("orquestador contra la base local", () => {
  it("correr dos veces el mismo día deja idénticos precios_actuales e historial", async () => {
    const f = fetchFalso(["vtex", "euro", "sipsa"]);
    const primera = await correr(db, ctx(f.fetch), { productos: PRODUCTOS });
    const despuesDeUna = await foto();
    const segunda = await correr(db, ctx(f.fetch), { productos: PRODUCTOS });
    expect(await foto()).toEqual(despuesDeUna);

    // Hubo hallazgos reales: aceite en D1 (RefId) y en Euro, banano en SIPSA.
    expect(primera.escritos).toBeGreaterThanOrEqual(3);
    expect(segunda.tiendas).toEqual(primera.tiendas);
    const fila = (p: string, t: string) =>
      despuesDeUna.actuales.find(
        (a) => a.producto_id === p && a.tienda_id === t,
      );
    expect(fila("aceite", "euro")).toMatchObject({
      precio: 10000,
      fecha: HOY,
      estado: "real",
    });
    expect(fila("banano", "minorista")).toMatchObject({
      fuente: "SIPSA (mayorista)",
      fecha: HOY,
    });
    // El SKU encontrado quedó guardado para la próxima corrida.
    const sku = await db
      .from("producto_fuente")
      .select("sku")
      .eq("producto_id", "aceite")
      .eq("tienda_id", "d1")
      .single();
    expect(sku.data?.sku).toBe("604");
  });

  it("un salto de más del 35 % queda con revisar = true", async () => {
    // Aceite en D1: $8.900 el litro contra los $5.000 sembrados → +78 %.
    const { actuales } = await foto();
    expect(
      actuales.find((a) => a.producto_id === "aceite" && a.tienda_id === "d1"),
    ).toMatchObject({ precio: 8900, revisar: true });
    // Aceite en Euro: $10.000 contra $10.000 del export → sin marca.
    expect(
      actuales.find((a) => a.producto_id === "aceite" && a.tienda_id === "euro")
        ?.revisar,
    ).toBe(false);
  });

  it("una tienda con 0 hallazgos queda en fallo y conserva su ultimo_ok", async () => {
    const sinNada = (async () =>
      new Response("", { status: 404 })) as unknown as typeof fetch;
    const previo = await db
      .from("tienda_estado")
      .select("ultimo_ok")
      .eq("tienda_id", "euro")
      .single();
    const resumen = await correr(db, ctx(sinNada), { productos: PRODUCTOS });
    for (const t of TIENDAS) expect(resumen.tiendas[t].estado).toBe("fallo");
    const euro = await db
      .from("tienda_estado")
      .select("estado, ultimo_ok")
      .eq("tienda_id", "euro")
      .single();
    expect(euro.data).toEqual({
      estado: "fallo",
      ultimo_ok: previo.data?.ultimo_ok,
    });
  });
});
