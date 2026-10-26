import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/tipos";

/** Cliente del navegador (Realtime, auth). El env ya lo validó server.ts en el build. */
export function clienteNavegador() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string,
  );
}
