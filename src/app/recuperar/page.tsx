import type { Metadata } from "next";
import { recuperar } from "@/app/auth/acciones";
import { FormularioAuth } from "@/components/auth/formulario";

export const metadata: Metadata = {
  title: "Recuperar contraseña · Mercado Medellín",
  robots: { index: false },
};

export default function Recuperar() {
  return (
    <FormularioAuth
      titulo="Recuperar contraseña"
      accion={recuperar}
      campos={["email"]}
      boton="Enviar enlace"
      enlaces={[{ href: "/ingresar", texto: "Volver a ingresar" }]}
    />
  );
}
