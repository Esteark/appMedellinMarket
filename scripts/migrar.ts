// Carga data/export/*.json en Supabase con las reglas del blueprint §4. Idempotente: todo es
// upsert por clave natural, y la corrida de meta.json solo se inserta si no existe.
// Al final compara cada conteo de la base con el JSON de origen y sale 1 si no coincide.
// Uso: pnpm migrar
import "./cargar-env";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { ADAPTADORES } from "@/corrida/orquestador";
import type { Database, TablesInsert } from "@/lib/supabase/tipos";
import { unidadBase } from "@/lib/unidades";

type Precio = {
  precio: number | null;
  fecha: string;
  fuente?: string;
  estado: "real" | "estimado" | "sin_dato" | "simulado";
};
type Punto = { fecha: string; estado: Precio["estado"] } & Record<
  string,
  unknown
>;
type Meta = {
  estado: {
    ultimaCorrida: string;
    fuentes: Record<string, "ok" | "parcial" | "fallo">;
    ultimoOk: Record<string, string | null>;
    notas: string;
  };
};
type Tienda = {
  id: string;
  nombre: string;
  color: string;
  manual?: boolean;
  nota?: string;
};

// 30-oct-2026: la familia no merca en estas tiendas; ninguna carga las trae de vuelta.
const TIENDAS_RETIRADAS = new Set(["exito", "carulla", "euro", "ara", "isimo"]);
const vigente = ([tienda_id]: [string, ...unknown[]]) =>
  !TIENDAS_RETIRADAS.has(tienda_id);

const leer = <T>(archivo: string): T =>
  JSON.parse(readFileSync(`data/export/${archivo}`, "utf8")) as T;

const productos =
  leer<
    Record<
      string,
      {
        id: string;
        nombre: string;
        grupo: string;
        unidad: string;
        emoji?: string;
      }
    >
  >("productos.json");
const precios = leer<Record<string, Record<string, Precio>>>("precios.json");
const historial = leer<Record<string, { serie: Punto[] }>>("historial.json");
const meta = leer<Meta>("meta.json");
// shortcut: se asume la misma forma que precios.json ({producto: {tienda: {precio, fecha}}}); hoy está vacío.
const anotados =
  leer<Record<string, Record<string, { precio: number; fecha: string }>>>(
    "anotados.json",
  );

// TIENDAS es un literal JS (sin funciones) dentro del archivo copiado del artifact.
const origen = readFileSync("data/origen/constantes-artifact.js", "utf8");
const literal = origen.match(/const TIENDAS=(\[[\s\S]*?\]);/)?.[1];
if (!literal) throw new Error("No encontré TIENDAS en constantes-artifact.js");
const tiendas = (new Function(`return ${literal}`)() as Tienda[]).filter(
  (t) => !TIENDAS_RETIRADAS.has(t.id),
);

const FRECUENCIA: Record<string, "diaria" | "semanal"> = {
  Frutas: "diaria",
  Verduras: "diaria",
  Tubérculos: "diaria",
  Proteínas: "diaria",
  Lácteos: "diaria",
  Granos: "diaria",
  Panadería: "diaria",
  Despensa: "semanal",
  Aseo: "semanal",
  Mecato: "semanal",
  Bebidas: "semanal",
  Gourmet: "semanal",
};

const url = process.env.SUPABASE_URL;
const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !clave) {
  console.error(
    "Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY (en local: pnpm env:local).",
  );
  process.exit(1);
}
const db = createClient<Database>(url, clave, {
  auth: { persistSession: false },
});

type Tabla = keyof Database["public"]["Tables"];
async function upsert<T extends Tabla>(
  tabla: T,
  filas: TablesInsert<T>[],
  onConflict: string,
) {
  for (let i = 0; i < filas.length; i += 1000) {
    const { error } = await db
      .from(tabla)
      // biome-ignore lint/suspicious/noExplicitAny: el genérico de supabase-js no se estrecha con T
      .upsert(filas.slice(i, i + 1000) as any, { onConflict });
    if (error) throw new Error(`${tabla}: ${error.message}`);
  }
}

async function contar(tabla: Tabla): Promise<number> {
  const { count, error } = await db
    .from(tabla)
    .select("*", { count: "exact", head: true });
  if (error) throw new Error(`${tabla}: ${error.message}`);
  return count ?? 0;
}

// --- filas ---
// Manual = sin adaptador en la corrida: el artifact marcaba como automáticas tiendas que hoy van
// por anotados (PriceSmart).
const automaticas = new Set(ADAPTADORES.map((a) => a.tienda));
const filasTiendas = tiendas.map((t) => ({
  id: t.id,
  nombre: t.nombre,
  color: t.color,
  manual: !automaticas.has(t.id),
  nota: t.nota ?? null,
}));

const filasProductos = Object.values(productos).map((p) => {
  const frecuencia = FRECUENCIA[p.grupo];
  if (!frecuencia)
    throw new Error(`Grupo sin frecuencia: ${p.grupo} (${p.id})`);
  return {
    id: p.id,
    nombre: p.nombre,
    grupo: p.grupo,
    unidad: p.unidad,
    ...unidadBase(p.unidad),
    frecuencia,
    emoji: p.emoji ?? null,
  };
});

const filasPrecios: TablesInsert<"precios_actuales">[] = [];
const filasFuente: TablesInsert<"producto_fuente">[] = [];
for (const [producto_id, porTienda] of Object.entries(precios)) {
  for (const [tienda_id, p] of Object.entries(porTienda).filter(vigente)) {
    filasPrecios.push({
      producto_id,
      tienda_id,
      precio: p.precio,
      fecha: p.fecha,
      fuente: p.fuente ?? null,
      estado: p.estado,
    });
    if (p.fuente?.startsWith("http"))
      filasFuente.push({
        producto_id,
        tienda_id,
        url: p.fuente,
        // Las URLs de búsqueda VTEX traen el término en ?ft=; las /p, no.
        termino: new URL(p.fuente).searchParams.get("ft"),
      });
  }
}

// La Vaquita no viene del artifact: sus URLs de producto, elegidas a mano, están en data/fuentes.
// La tienda misma entra por la migración 20261027150000_tienda_vaquita.sql.
const urlsVaquita = JSON.parse(
  readFileSync("data/fuentes/vaquita.json", "utf8"),
) as Record<string, string>;
for (const [producto_id, url] of Object.entries(urlsVaquita)) {
  if (!filasProductos.some((p) => p.id === producto_id))
    throw new Error(
      `data/fuentes/vaquita.json: producto desconocido ${producto_id}`,
    );
  filasFuente.push({ producto_id, tienda_id: "vaquita", url });
}

const filasHistorial: TablesInsert<"precios_historial">[] = [];
for (const [producto_id, { serie }] of Object.entries(historial)) {
  for (const { fecha, estado, ...porTienda } of serie) {
    for (const [tienda_id, precio] of Object.entries(porTienda).filter(
      vigente,
    )) {
      if (typeof precio !== "number") continue;
      filasHistorial.push({
        producto_id,
        tienda_id,
        fecha,
        precio: Math.round(precio),
        estado,
      });
    }
  }
}

const filasAnotados = Object.entries(anotados).flatMap(
  ([producto_id, porTienda]) =>
    Object.entries(porTienda)
      .filter(vigente)
      .map(([tienda_id, a]) => ({
        producto_id,
        tienda_id,
        precio: a.precio,
        fecha: a.fecha,
        autor: null,
      })),
);

const { estado } = meta;
const filasEstado = Object.entries(estado.fuentes)
  .filter(vigente)
  .map(([tienda_id, e]) => ({
    tienda_id,
    estado: e,
    ultimo_ok: estado.ultimoOk[tienda_id] ?? null,
  }));

// --- carga (en orden de llaves foráneas) ---
await upsert("tiendas", filasTiendas, "id");
await upsert("productos", filasProductos, "id");
await upsert("precios_actuales", filasPrecios, "producto_id,tienda_id");
await upsert("producto_fuente", filasFuente, "producto_id,tienda_id");
await upsert(
  "precios_historial",
  filasHistorial,
  "producto_id,tienda_id,fecha",
);
await upsert("anotados", filasAnotados, "producto_id,tienda_id");
await upsert("tienda_estado", filasEstado, "tienda_id");

const { data: previa, error: errorCorrida } = await db
  .from("corridas")
  .select("id")
  .eq("inicio", estado.ultimaCorrida)
  .maybeSingle();
if (errorCorrida) throw new Error(`corridas: ${errorCorrida.message}`);
if (!previa) {
  const { error } = await db.from("corridas").insert({
    inicio: estado.ultimaCorrida,
    fin: estado.ultimaCorrida, // el export no trae la hora de fin; la corrida sí terminó
    fuentes: estado.fuentes,
    notas: estado.notas,
  });
  if (error) throw new Error(`corridas: ${error.message}`);
}

// --- verificación contra el origen ---
// historial, producto_fuente y corridas crecen con la corrida diaria, y las tiendas nuevas (La Vaquita)
// entran por migración SQL y no vienen del origen: ahí basta con ≥.
const esperado: [Tabla, number, "=" | "≥"][] = [
  ["tiendas", filasTiendas.length, "≥"],
  ["productos", filasProductos.length, "="],
  ["precios_actuales", filasPrecios.length, "≥"],
  ["tienda_estado", filasEstado.length, "≥"],
  ["anotados", filasAnotados.length, "≥"],
  ["producto_fuente", filasFuente.length, "≥"],
  ["precios_historial", filasHistorial.length, "≥"],
  ["corridas", 1, "≥"],
];
let mal = false;
for (const [tabla, n, op] of esperado) {
  const real = await contar(tabla);
  if (op === "=" ? real !== n : real < n) {
    console.error(`CONTEO MAL ${tabla}: base=${real}, origen ${op} ${n}`);
    mal = true;
  }
}
if (mal) process.exit(1);
console.log(
  `productos=${filasProductos.length} precios=${filasPrecios.length} tiendas=${filasTiendas.length}`,
);
console.log(
  `historial=${filasHistorial.length} fuentes=${filasFuente.length} tienda_estado=${filasEstado.length} anotados=${filasAnotados.length}`,
);
