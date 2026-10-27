import type { EmailOtpType } from "@supabase/supabase-js";
import { connection, type NextRequest, NextResponse } from "next/server";
import { clienteServidor } from "@/lib/supabase/server";

/** Solo rutas internas: evita que el enlace del correo sirva de redirección abierta. */
function destino(siguiente: string | null) {
  return siguiente?.startsWith("/") &&
    !siguiente.startsWith("//") &&
    !siguiente.startsWith("/\\")
    ? siguiente
    : "/";
}

/**
 * Origen público de la petición. `nextUrl.origin` puede traer otro host que el del navegador
 * (p. ej. `localhost` con `next start` abierto por 127.0.0.1); redirigir a ese otro host
 * perdería la cookie de sesión recién creada.
 */
function origen(request: NextRequest) {
  const h = request.headers;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto =
    h.get("x-forwarded-proto") ?? request.nextUrl.protocol.slice(0, -1);
  return host ? `${proto}://${host}` : request.nextUrl.origin;
}

/** Enlaces de los correos de Supabase: confirmar registro y recuperar contraseña. */
export async function GET(request: NextRequest) {
  await connection();
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const tipo = url.searchParams.get("type") as EmailOtpType | null;
  const base = origen(request);
  const db = await clienteServidor();
  const { error } = code
    ? await db.auth.exchangeCodeForSession(code)
    : tokenHash && tipo
      ? await db.auth.verifyOtp({ token_hash: tokenHash, type: tipo })
      : { error: new Error("Enlace sin código") };
  if (error) {
    // El enlace con `?code=` (PKCE) solo sirve en el navegador donde se pidió el correo.
    const otroNavegador = /code verifier/i.test(error.message);
    return NextResponse.redirect(
      new URL(
        `/ingresar?error=${otroNavegador ? "navegador" : "enlace"}`,
        base,
      ),
    );
  }
  const siguiente = destino(url.searchParams.get("siguiente"));
  const registro = tipo === "signup" || tipo === "email";
  const ir =
    registro && siguiente === "/" ? "/?aviso=correo_confirmado" : siguiente;
  return NextResponse.redirect(new URL(ir, base));
}
