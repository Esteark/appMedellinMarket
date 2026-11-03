import { AVISOS, type ClaveAviso } from "@/lib/avisos";
import type { ProductoCatalogo } from "@/lib/datos";
import {
  guardarGastosLocal,
  leerGastosLocal,
} from "@/lib/presupuesto/almacenamiento";
import { grupoARubro } from "@/lib/presupuesto/rubros";
import type { GastoReal } from "@/lib/presupuesto/tipos";
import { emparejarProducto } from "./emparejar";
import { inferirProducto } from "./inferir";
import type { FilaCsv, FilaRevision, ModoFila } from "./tipos";

export const UNIDADES = ["u", "kg", "g", "l", "ml"];

const PROMOCION = /\b(descuento|oferta|promo|2x1|rebaja)\b/i;

/** Primer emparejamiento en el cliente; con sesión, `previsualizar_compra` lo corrige. */
export function aRevision(
  f: FilaCsv,
  productos: Pick<ProductoCatalogo, "id" | "nombre" | "grupo" | "unidad">[],
): FilaRevision {
  const id = emparejarProducto(
    { producto: f.producto, tiendaId: null, codigo: f.codigo },
    { productos, aliasProducto: [], codigos: {} },
  );
  const p = productos.find((x) => x.id === id);
  // Lo que no coincide se propone como producto nuevo con su ficha inferida del nombre; lo que no es un producto
  // (una bolsa, un descuento) como solo gasto. Todo esto lo confirma o corrige la persona.
  const inf = inferirProducto(f.producto, f.cantidad);
  const modo: ModoFila = p
    ? "existente"
    : inf.noEsProducto
      ? "solo_gasto"
      : "crear";
  const grupo = p ? p.grupo : inf.grupo;
  return {
    ...f,
    rubro: grupoARubro(grupo),
    unidad: p ? (UNIDADES.includes(p.unidad) ? p.unidad : "u") : inf.unidad,
    publicarPrecio: modo !== "solo_gasto",
    promocion: PROMOCION.test(f.producto),
    tiendaId: null,
    productoId: id,
    nuevo: modo === "crear",
    modo,
    modoManual: false,
    emoji: p ? null : inf.emoji,
    grupo,
    cantidadBase: p ? 1 : inf.cantidadBase,
  };
}

export const aPayload = (filas: FilaRevision[]) =>
  filas.map((f) => ({
    producto: f.producto,
    tienda: f.tienda,
    cantidad: f.cantidad,
    precio_total: Math.round(f.precioTotal),
    fecha: f.fecha,
    codigo: f.codigo,
    rubro: f.rubro,
    unidad: f.unidad,
    publicar_precio: f.publicarPrecio && f.modo !== "solo_gasto",
    promocion: f.promocion,
    // La ficha solo importa al crear un producto nuevo; si la persona eligió uno existente, se manda cuál.
    ...(f.modo === "crear" && {
      emoji: f.emoji ?? "",
      grupo: f.grupo,
      cantidad_base: f.cantidadBase,
    }),
    ...(f.modo === "existente" &&
      f.productoId && { producto_id: f.productoId }),
  }));

export const claveAviso = (error: string) =>
  (error === "sin_sesion"
    ? "sesion_expirada"
    : error in AVISOS
      ? error
      : "importacion_error") as ClaveAviso;

/** Sin sesión: los gastos quedan en `mercado-medellin:gastos:{mes}` del mes de cada línea. */
export function guardarLocal(filas: FilaRevision[], fechaLote: string) {
  const porMes = new Map<string, GastoReal[]>();
  for (const f of filas) {
    const fecha = f.fecha || fechaLote;
    const mes = fecha.slice(0, 7);
    const gasto: GastoReal = {
      id: `local-${crypto.randomUUID()}`,
      user_id: "local",
      fecha,
      mes,
      rubro: f.rubro,
      monto: Math.round(f.precioTotal),
      tienda_id: null,
      producto_id: null,
      origen: "importado",
      nota: f.tienda,
      cantidad: f.cantidad,
      descripcion: f.producto,
      created_at: new Date().toISOString(),
    };
    porMes.set(mes, [gasto, ...(porMes.get(mes) ?? [])]);
  }
  for (const [mes, nuevos] of porMes)
    guardarGastosLocal(mes, [...nuevos, ...leerGastosLocal(mes)]);
}
