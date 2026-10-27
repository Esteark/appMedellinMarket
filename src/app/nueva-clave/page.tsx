import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { nuevaClave } from "@/app/auth/acciones";
import { CargandoAuth } from "@/components/auth/cargando";
import { FormularioAuth } from "@/components/auth/formulario";
import { usuario } from "@/lib/datos";

export const metadata: Metadata = {
  title: "Nueva contraseña · Mercado Medellín",
  robots: { index: false },
};

/** Sin sesión de recuperación (enlace vencido, usado o abierto sin pasar por el correo), el formulario no sirve. */
async function Datos() {
  if (await usuario())
    return (
      <FormularioAuth
        titulo="Nueva contraseña"
        accion={nuevaClave}
        campos={["clave-nueva"]}
        boton="Guardar contraseña"
      />
    );
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-4 px-4 py-10">
      <h1 className="text-2xl font-semibold">Nueva contraseña</h1>
      <p
        data-testid="sin-enlace"
        className="rounded-xl bg-warn-bg px-3.5 py-2.5 text-sm text-warn-ink"
      >
        Para cambiar tu contraseña abre el enlace que te enviamos al correo. Si
        ya lo usaste o expiró, pide uno nuevo.
      </p>
      <Link
        href="/recuperar"
        className="text-sm font-medium underline underline-offset-2"
      >
        Pedir un enlace nuevo
      </Link>
    </main>
  );
}

export default function NuevaClave() {
  return (
    <Suspense
      fallback={
        <CargandoAuth
          titulo="Nueva contraseña"
          texto="Comprobando tu enlace…"
        />
      }
    >
      <Datos />
    </Suspense>
  );
}
