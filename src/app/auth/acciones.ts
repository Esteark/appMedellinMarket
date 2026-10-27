"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { ClaveAviso } from "@/lib/avisos";
import { clienteServidor } from "@/lib/supabase/server";

/** Estado de los formularios de auth: el error va junto al formulario y, si hay `aviso`, también en un toast. */
export type EstadoAuth = {
  ok: boolean;
  mensaje?: string;
  aviso?: ClaveAviso;
} | null;

const email = z.email("Escribe un correo válido.");
const clave = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres.");

const primerError = (e: z.ZodError) =>
  e.issues[0]?.message ?? "Datos inválidos.";

/** Origen de la petición para los enlaces de los correos (local, preview o producción). */
async function origen() {
  const h = await headers();
  return h.get("origin") ?? `https://${h.get("host")}`;
}

export async function ingresar(
  _: EstadoAuth,
  datos: FormData,
): Promise<EstadoAuth> {
  const v = z.object({ email, clave: z.string().min(1) }).safeParse({
    email: datos.get("email"),
    clave: datos.get("clave"),
  });
  if (!v.success) return { ok: false, mensaje: primerError(v.error) };
  const db = await clienteServidor();
  const { error } = await db.auth.signInWithPassword({
    email: v.data.email,
    password: v.data.clave,
  });
  if (error)
    return {
      ok: false,
      mensaje: "Correo o contraseña incorrectos.",
      aviso: "credenciales_malas",
    };
  redirect("/?aviso=sesion_iniciada");
}

export async function registrar(
  _: EstadoAuth,
  datos: FormData,
): Promise<EstadoAuth> {
  const v = z.object({ email, clave }).safeParse({
    email: datos.get("email"),
    clave: datos.get("clave"),
  });
  if (!v.success) return { ok: false, mensaje: primerError(v.error) };
  const db = await clienteServidor();
  const { error } = await db.auth.signUp({
    email: v.data.email,
    password: v.data.clave,
    options: { emailRedirectTo: `${await origen()}/auth/confirmar` },
  });
  if (error)
    return {
      ok: false,
      mensaje: `No se pudo crear la cuenta: ${error.message}`,
    };
  redirect("/?aviso=registro_ok");
}

export async function recuperar(
  _: EstadoAuth,
  datos: FormData,
): Promise<EstadoAuth> {
  const v = email.safeParse(datos.get("email"));
  if (!v.success) return { ok: false, mensaje: primerError(v.error) };
  const db = await clienteServidor();
  // Misma respuesta exista o no la cuenta: no se revela quién está registrado.
  await db.auth.resetPasswordForEmail(v.data, {
    redirectTo: `${await origen()}/auth/confirmar?siguiente=/nueva-clave`,
  });
  return {
    ok: true,
    mensaje: "Si el correo está registrado, te enviamos un enlace.",
    aviso: "recuperar_enviado",
  };
}

export async function nuevaClave(
  _: EstadoAuth,
  datos: FormData,
): Promise<EstadoAuth> {
  const v = clave.safeParse(datos.get("clave"));
  if (!v.success) return { ok: false, mensaje: primerError(v.error) };
  const db = await clienteServidor();
  const { data } = await db.auth.getClaims();
  if (!data?.claims.sub)
    return {
      ok: false,
      mensaje: "El enlace expiró. Pide uno nuevo.",
      aviso: "sesion_expirada",
    };
  const { error } = await db.auth.updateUser({ password: v.data });
  if (error)
    return { ok: false, mensaje: `No se pudo cambiar: ${error.message}` };
  redirect("/?aviso=clave_cambiada");
}

/** Cierra la sesión. No redirige: el menú de cuenta termina su animación y navega él. */
export async function salir(): Promise<{ ok: boolean }> {
  const db = await clienteServidor();
  const { error } = await db.auth.signOut();
  return { ok: !error };
}
