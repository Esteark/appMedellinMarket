import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/tipos";

export type Admin = SupabaseClient<Database>;

/** Cliente con service role: único lugar de src/ que usa esa clave (salta RLS). */
export function clienteAdmin(): Admin {
  const url = process.env.SUPABASE_URL;
  const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !clave)
    throw new Error(
      "Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY (en local: pnpm env:local).",
    );
  return createClient<Database>(url, clave, {
    auth: { persistSession: false },
  });
}
