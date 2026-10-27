"use client";

import { LogOut, UserRound } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { useTransition } from "react";
import { salir } from "@/app/auth/acciones";
import { Spinner } from "@/components/cargando";

/** Ícono de cuenta que abre un menú pequeño; aquí irán más opciones de la cuenta. */
export function MenuCuenta({ email }: { email: string }) {
  const [saliendo, empezar] = useTransition();
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        data-testid="usuario"
        aria-label={`Cuenta de ${email}`}
        className="grid size-8 place-items-center rounded-full bg-secondary text-foreground hover:bg-border data-[state=open]:bg-primary data-[state=open]:text-primary-foreground"
      >
        <UserRound aria-hidden="true" className="size-[18px]" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-40 min-w-52 rounded-xl border bg-card p-1.5 text-sm text-foreground shadow-lg"
        >
          <p className="truncate px-2.5 py-1.5 text-xs text-muted-foreground">
            {email}
          </p>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item
            disabled={saliendo}
            onSelect={(e) => {
              e.preventDefault(); // el menú sigue abierto con el spinner hasta que redirige
              empezar(() => salir());
            }}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 font-medium outline-none data-[disabled]:opacity-60 data-[highlighted]:bg-secondary"
          >
            {saliendo ? (
              <Spinner />
            ) : (
              <LogOut aria-hidden="true" className="size-4" />
            )}
            Cerrar sesión
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
