import type { Metadata } from "next";
import { Suspense } from "react";
import { ingresar } from "@/app/auth/acciones";
import { FormularioAuth } from "@/components/auth/formulario";

export const metadata: Metadata = { title: "Ingresar · Mercado Medellín" };

const ENLACES = [
  { href: "/registro", texto: "¿No tienes cuenta? Regístrate" },
  { href: "/recuperar", texto: "Olvidé mi contraseña" },
];

async function ConNota({ searchParams }: PageProps<"/ingresar">) {
  const { error } = await searchParams;
  return (
    <FormularioAuth
      titulo="Ingresar"
      accion={ingresar}
      campos={["email", "clave"]}
      boton="Ingresar"
      enlaces={ENLACES}
      nota={
        error === "enlace"
          ? "El enlace no es válido o expiró. Pide uno nuevo."
          : undefined
      }
    />
  );
}

export default function Ingresar(props: PageProps<"/ingresar">) {
  return (
    <Suspense
      fallback={
        <FormularioAuth
          titulo="Ingresar"
          accion={ingresar}
          campos={["email", "clave"]}
          boton="Ingresar"
          enlaces={ENLACES}
        />
      }
    >
      <ConNota {...props} />
    </Suspense>
  );
}
