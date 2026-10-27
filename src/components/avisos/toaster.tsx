"use client";

import { useEffect } from "react";
import toast, { Toaster as Base, useToasterStore } from "react-hot-toast";

const MAXIMO = 3;

/** Único Toaster de la app: arriba al centro (abajo está la barra del carrito), máximo 3 visibles. */
export function Toaster() {
  const { toasts } = useToasterStore();
  useEffect(() => {
    for (const t of toasts.filter((t) => t.visible).slice(MAXIMO))
      toast.dismiss(t.id);
  }, [toasts]);
  return (
    <Base
      position="top-center"
      toastOptions={{
        className: "aviso",
        style: {
          background: "var(--card)",
          color: "var(--foreground)",
          borderRadius: 14,
          padding: "10px 12px",
          maxWidth: 440,
          boxShadow: "0 12px 32px rgb(15 23 42 / 0.16)",
        },
      }}
    />
  );
}
