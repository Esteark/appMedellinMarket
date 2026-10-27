import type { Metadata } from "next";
import { registrar } from "@/app/auth/acciones";
import { FormularioAuth } from "@/components/auth/formulario";

export const metadata: Metadata = {
  title: "Crear cuenta · Mercado Medellín",
  robots: { index: false },
};

export default function Registro() {
  return (
    <FormularioAuth
      titulo="Crear cuenta"
      accion={registrar}
      campos={["email", "clave-nueva"]}
      boton="Crear cuenta"
      enlaces={[{ href: "/ingresar", texto: "¿Ya tienes cuenta? Ingresa" }]}
    />
  );
}
