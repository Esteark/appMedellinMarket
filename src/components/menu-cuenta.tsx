"use client";

import { LogOut, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { DropdownMenu } from "radix-ui";
import { useState, useTransition } from "react";
import { salir } from "@/app/auth/acciones";
import { Spinner } from "@/components/cargando";
import { avisar } from "@/lib/avisos";

// Lo que dura la animación de salida del panel (`.menu-cuenta` en globals.css).
const SALIDA_MS = 130;

const sinMovimiento = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Ícono de cuenta que abre un menú pequeño; aquí irán más opciones de la cuenta. */
export function MenuCuenta({ email }: { email: string }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [saliendo, empezar] = useTransition();

  function cerrarSesion() {
    empezar(async () => {
      let ok = false;
      try {
        ok = (await salir()).ok;
      } catch {
        // sin red o servidor caído: se avisa abajo
      }
      if (!ok) {
        avisar(navigator.onLine ? "sesion_no_cerrada" : "sin_conexion");
        return;
      }
      // El panel termina su animación de salida antes de cambiar de página.
      setAbierto(false);
      if (!sinMovimiento()) await new Promise((r) => setTimeout(r, SALIDA_MS));
      router.push("/?aviso=sesion_cerrada");
      router.refresh();
    });
  }

  return (
    <DropdownMenu.Root open={abierto} onOpenChange={setAbierto}>
      <DropdownMenu.Trigger
        data-testid="usuario"
        aria-label={`Cuenta de ${email}`}
        className="grid size-8 place-items-center rounded-full bg-secondary text-foreground transition-colors duration-150 hover:bg-border data-[state=open]:bg-primary data-[state=open]:text-primary-foreground motion-reduce:transition-none"
      >
        <UserRound aria-hidden="true" className="size-[18px]" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="menu-cuenta z-40 min-w-52 rounded-xl border bg-card p-1.5 text-sm text-foreground shadow-lg"
        >
          <p className="truncate px-2.5 py-1.5 text-xs text-muted-foreground">
            {email}
          </p>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item
            disabled={saliendo}
            onSelect={(e) => {
              e.preventDefault(); // el menú sigue abierto con el spinner hasta que la sesión se cierra
              cerrarSesion();
            }}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 font-medium outline-none data-[disabled]:opacity-60 data-[highlighted]:bg-secondary"
          >
            {/* Mismo tamaño que el ícono: el spinner no mueve el texto. */}
            <span className="grid size-4 flex-none place-items-center">
              {saliendo ? (
                <Spinner />
              ) : (
                <LogOut aria-hidden="true" className="size-4" />
              )}
            </span>
            Cerrar sesión
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
