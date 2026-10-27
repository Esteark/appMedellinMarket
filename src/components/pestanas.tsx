"use client";

import { useGSAP } from "@gsap/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { Deslizador } from "@/components/deslizador";
import { deslizar } from "@/lib/animaciones";
import { cn } from "@/lib/utils";

/** Solo las vistas que ya existen; los pasos siguientes agregan Hogar, Dieta y Anotados. */
const PESTANAS = [
  { href: "/", texto: "Canasta familiar" },
  { href: "/antojos", texto: "Antojos y gourmet" },
];

export function Pestanas() {
  const ruta = usePathname();
  const nav = useRef<HTMLElement>(null);
  const indicador = useRef<HTMLSpanElement>(null);
  const primera = useRef(true);

  // 6 · El subrayado se desliza a la pestaña activa (sin animar en la primera pintura).
  useGSAP(
    () => {
      const activa = nav.current?.querySelector<HTMLElement>(
        '[aria-current="page"]',
      );
      if (!activa || !indicador.current) return;
      deslizar(
        indicador.current,
        activa.offsetLeft + 12,
        activa.offsetWidth - 24,
        primera.current,
      );
      primera.current = false;
    },
    { dependencies: [ruta], scope: nav },
  );

  return (
    <nav
      ref={nav}
      aria-label="Secciones"
      className="mx-auto w-full max-w-6xl border-b px-4"
    >
      <Deslizador className="gap-0.5" centrar='[aria-current="page"]'>
        {PESTANAS.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            aria-current={ruta === p.href ? "page" : undefined}
            className={cn(
              "flex-none px-3 py-2.5 text-sm font-semibold",
              ruta === p.href ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {p.texto}
          </Link>
        ))}
        <span
          ref={indicador}
          aria-hidden="true"
          className="absolute bottom-0 left-0 h-0.5 w-0 rounded-sm bg-foreground"
        />
      </Deslizador>
    </nav>
  );
}
