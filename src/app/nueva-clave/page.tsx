import type { Metadata } from "next";
import { nuevaClave } from "@/app/auth/acciones";
import { FormularioAuth } from "@/components/auth/formulario";

export const metadata: Metadata = {
  title: "Nueva contraseña · Mercado Medellín",
  robots: { index: false },
};

export default function NuevaClave() {
  return (
    <FormularioAuth
      titulo="Nueva contraseña"
      accion={nuevaClave}
      campos={["clave-nueva"]}
      boton="Guardar contraseña"
    />
  );
}
