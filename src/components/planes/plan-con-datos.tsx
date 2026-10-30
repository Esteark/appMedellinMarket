import type { ReactNode } from "react";
import { planGuardado } from "@/lib/datos";
import type { TipoPlan } from "@/lib/planes/config";
import { PlanProvider } from "./plan-provider";

/** Lee el plan de la cuenta (si hay sesión) y lo ofrece a Reparto, Presupuesto y Plan editable. */
export async function PlanConDatos({
  tipo,
  children,
}: {
  tipo: TipoPlan;
  children: ReactNode;
}) {
  const { conSesion, config } = await planGuardado(tipo);
  return (
    <PlanProvider tipo={tipo} conSesion={conSesion} nube={config}>
      {children}
    </PlanProvider>
  );
}
