"use client";

import { useLinkStatus } from "next/link";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

/** Círculo que gira; quieto con prefers-reduced-motion. */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block size-3.5 flex-none animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none",
        className,
      )}
    />
  );
}

/** Dentro de un <Link>: aparece mientras esa navegación carga (con 150 ms de gracia, sin destellos). */
export function CargandoEnlace({ className }: { className?: string }) {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span className={cn("aparecer-tarde inline-flex", className)}>
      <Spinner />
      <span className="sr-only" role="status">
        Cargando…
      </span>
    </span>
  );
}

/** Botón de envío de un <form action>: queda deshabilitado con spinner mientras la acción corre. */
export function BotonEnviar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={cn(
        "inline-flex items-center gap-1.5 disabled:opacity-70",
        className,
      )}
    >
      {pending && <Spinner />}
      {children}
    </button>
  );
}
