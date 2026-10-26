"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import type { EstadoAuth } from "@/app/auth/acciones";
import { avisar } from "@/lib/avisos";

type Campo = "email" | "clave" | "clave-nueva";

const CAMPOS: Record<
  Campo,
  { nombre: string; etiqueta: string; tipo: string; auto: string }
> = {
  email: { nombre: "email", etiqueta: "Correo", tipo: "email", auto: "email" },
  clave: {
    nombre: "clave",
    etiqueta: "Contraseña",
    tipo: "password",
    auto: "current-password",
  },
  "clave-nueva": {
    nombre: "clave",
    etiqueta: "Contraseña (mínimo 8 caracteres)",
    tipo: "password",
    auto: "new-password",
  },
};

type Props = {
  titulo: string;
  accion: (estado: EstadoAuth, datos: FormData) => Promise<EstadoAuth>;
  campos: Campo[];
  boton: string;
  enlaces?: { href: string; texto: string }[];
  /** Mensaje que llega por URL (p. ej. enlace del correo vencido). */
  nota?: string;
};

/** Formulario de auth: el resultado se ve junto al botón y, si el catálogo lo pide, en un toast. */
export function FormularioAuth({
  titulo,
  accion,
  campos,
  boton,
  enlaces,
  nota,
}: Props) {
  const [estado, enviar, enviando] = useActionState(accion, null);
  useEffect(() => {
    if (estado?.aviso) avisar(estado.aviso);
  }, [estado]);

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-5 px-4 py-10">
      <h1 className="text-2xl font-semibold">{titulo}</h1>
      <form action={enviar} className="flex flex-col gap-4">
        {campos.map((c) => {
          const d = CAMPOS[c];
          return (
            <label
              key={c}
              className="flex flex-col gap-1.5 text-sm font-medium"
            >
              {d.etiqueta}
              <input
                name={d.nombre}
                type={d.tipo}
                autoComplete={d.auto}
                required
                minLength={c === "clave-nueva" ? 8 : undefined}
                className="h-11 rounded-[10px] border border-input bg-card px-3 text-base font-normal"
              />
            </label>
          );
        })}
        <button
          type="submit"
          disabled={enviando}
          aria-busy={enviando}
          className="h-11 rounded-[10px] bg-primary font-semibold text-primary-foreground disabled:opacity-60"
        >
          {enviando ? "Un momento…" : boton}
        </button>
        {(estado?.mensaje ?? nota) && (
          <p
            role={estado?.ok ? "status" : "alert"}
            className={
              estado?.ok ? "text-sm text-save-ink" : "text-sm text-up-ink"
            }
          >
            {estado?.mensaje ?? nota}
          </p>
        )}
      </form>
      {enlaces && (
        <nav className="flex flex-col gap-2 text-sm">
          {enlaces.map((e) => (
            <Link
              key={e.href}
              href={e.href}
              className="text-anot-ink underline underline-offset-2"
            >
              {e.texto}
            </Link>
          ))}
        </nav>
      )}
    </main>
  );
}
