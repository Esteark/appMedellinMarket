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

/** Enlaces de los correos de Supabase: confirmar registro y recuperar contraseña. */
export async function GET(request: NextRequest) {
  await connection();
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const tipo = url.searchParams.get("type") as EmailOtpType | null;
  const db = await clienteServidor();
  const { error } = code
    ? await db.auth.exchangeCodeForSession(code)
    : tokenHash && tipo
      ? await db.auth.verifyOtp({ token_hash: tokenHash, type: tipo })
      : { error: new Error("Enlace sin código") };
  const ir = error
    ? "/ingresar?error=enlace"
    : destino(url.searchParams.get("siguiente"));
  return NextResponse.redirect(new URL(ir, url.origin));
}
