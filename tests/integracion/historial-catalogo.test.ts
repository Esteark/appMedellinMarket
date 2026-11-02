import { createClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { clienteAdmin } from "@/corrida/admin";
import type { Database } from "@/lib/supabase/tipos";

// Contra Supabase local con los datos de `pnpm migrar` (la papa tiene historial en D1, La Minorista y PriceSmart).
// Se llama `detalle()` real con un cliente público (`anon`), como la web sin sesión; el estado del catálogo
// se cambia con el cliente de servicio y se deja como estaba.
const sesion = vi.hoisted(() => ({ cliente: null as unknown }));

vi.mock("next/server", () => ({ connection: async () => {} }));
vi.mock("@/lib/supabase/server", () => ({
  clienteServidor: async () => sesion.cliente,
}));

import { detalle } from "@/lib/datos";

const admin = clienteAdmin();
const PRODUCTO = "papa";
const QUITADA = "minorista";

const tiendasEnLaGrafica = async () => {
  const d = await detalle(PRODUCTO);
  if (!d) throw new Error("la papa no existe: corre pnpm migrar");
  return new Set(
    d.historial.flatMap((punto) =>
      Object.keys(punto).filter((k) => k !== "fecha"),
    ),
  );
};
const poner = async (activo: boolean) => {
  const r = await admin
    .from("catalogo_tienda")
    .update({ activo })
    .eq("producto_id", PRODUCTO)
    .eq("tienda_id", QUITADA);
  if (r.error) throw r.error;
};

beforeAll(() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !clave) throw new Error("Falta .env.local (pnpm env:local).");
  sesion.cliente = createClient<Database>(url, clave, {
    auth: { persistSession: false },
  });
});

afterAll(async () => {
  await poner(true);
});

describe("detalle(): el historial respeta el catálogo por tienda", () => {
  it("con todas las tiendas dibuja las tres líneas", async () => {
    await poner(true);
    const tiendas = await tiendasEnLaGrafica();
    expect(tiendas.has(QUITADA)).toBe(true);
    expect(tiendas.size).toBeGreaterThanOrEqual(2);
  });

  it("una tienda que ya no sigue el producto sale de la gráfica", async () => {
    await poner(false);
    const tiendas = await tiendasEnLaGrafica();
    expect(tiendas.has(QUITADA)).toBe(false);
    expect(tiendas.size).toBeGreaterThanOrEqual(1);
  });

  it("al volver a agregarla, su historial regresa (no se borró)", async () => {
    await poner(true);
    expect((await tiendasEnLaGrafica()).has(QUITADA)).toBe(true);
  });
});
