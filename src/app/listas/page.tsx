import type { Metadata } from "next";
import { ListasGuardadas } from "@/components/listas/listas-guardadas";

export const metadata: Metadata = { title: "Mis listas · Mercado Medellín" };

export default function Listas() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-3 px-4 pt-4 pb-10">
      <div>
        <h1 className="text-xl font-bold">Mis listas</h1>
        <p className="text-sm text-muted-foreground">
          Listas de mercado con nombre. Cárgalas para reemplazar tu lista o
          súmalas sin bajar cantidades. Con sesión se guardan también en tu
          cuenta.
        </p>
      </div>
      <ListasGuardadas />
    </main>
  );
}
