import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/tipos";

/** Refresca la sesión de Supabase en cada petición (Next 16: proxy, no middleware). */
export async function proxy(request: NextRequest) {
  let respuesta = NextResponse.next({ request });
  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(aPoner, cabeceras) {
          for (const { name, value } of aPoner)
            request.cookies.set(name, value);
          respuesta = NextResponse.next({ request });
          for (const { name, value, options } of aPoner)
            respuesta.cookies.set(name, value, options);
          // Sin caché de CDN: si no, la sesión de uno podría servírsele a otro.
          for (const [clave, valor] of Object.entries(cabeceras))
            respuesta.headers.set(clave, valor);
        },
      },
    },
  );
  await supabase.auth.getClaims();
  return respuesta;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/salud|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
