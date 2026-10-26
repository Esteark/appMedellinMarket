import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";
import type { Database } from "@/lib/supabase/tipos";

/** Env de la web, validado una vez. Accesos literales para que Next los incruste. */
export const env = z
  .object({
    NEXT_PUBLIC_SUPABASE_URL: z.url(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  })
  .parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });

/** Cliente con la clave publicable y la sesión de las cookies: RLS decide qué se ve. */
export async function clienteServidor() {
  const almacen = await cookies();
  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => almacen.getAll(),
        setAll(aPoner) {
          try {
            for (const { name, value, options } of aPoner)
              almacen.set(name, value, options);
          } catch {
            // Un server component no puede escribir cookies; el proxy ya refrescó la sesión.
          }
        },
      },
    },
  );
}
