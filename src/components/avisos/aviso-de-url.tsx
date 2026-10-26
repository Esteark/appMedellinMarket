"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { AVISOS_DE_URL, avisar, type ClaveAviso } from "@/lib/avisos";

/** Avisos que pide una redirección del servidor (`?aviso=`), solo de la lista cerrada; luego limpia la URL. */
export function AvisoDeUrl() {
  const params = useSearchParams();
  const ruta = usePathname();
  const router = useRouter();
  const aviso = params.get("aviso");
  useEffect(() => {
    if (!aviso) return;
    if (AVISOS_DE_URL.includes(aviso as ClaveAviso))
      avisar(aviso as ClaveAviso);
    const resto = new URLSearchParams(params);
    resto.delete("aviso");
    router.replace(resto.size ? `${ruta}?${resto}` : ruta, { scroll: false });
  }, [aviso, params, ruta, router]);
  return null;
}
