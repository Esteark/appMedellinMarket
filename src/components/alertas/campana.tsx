"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { sacudir } from "@/lib/animaciones";
import { avisar } from "@/lib/avisos";
import { clienteNavegador } from "@/lib/supabase/client";

/** Campana con el número de alertas sin leer; se actualiza sola por Realtime. */
export function Campana({ userId }: { userId: string }) {
  const router = useRouter();
  const ruta = usePathname();
  const [n, setN] = useState(0);
  const icono = useRef<HTMLSpanElement>(null);
  // El canal vive toda la sesión: la ruta se lee por ref para no reabrirlo al navegar.
  const rutaRef = useRef(ruta);
  rutaRef.current = ruta;

  // Se relee al navegar y cuando otra pestaña (o este mismo usuario) marca alertas como leídas.
  const contar = useCallback(() => {
    clienteNavegador()
      .from("alertas")
      .select("id", { count: "exact", head: true })
      .eq("leida", false)
      .then(({ count }) => setN(count ?? 0));
  }, []);
  // biome-ignore lint/correctness/useExhaustiveDependencies: `ruta` es el disparador a propósito
  useEffect(contar, [contar, ruta]);

  useEffect(() => {
    const db = clienteNavegador();
    let canal: ReturnType<typeof db.channel> | null = null;
    let cancelado = false;
    // Con RLS, Realtime solo entrega eventos si el canal se une con el token del usuario.
    db.auth.getSession().then(({ data }) => {
      if (cancelado) return;
      if (data.session) db.realtime.setAuth(data.session.access_token);
      canal = db
        .channel(`alertas-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "alertas",
            filter: `user_id=eq.${userId}`,
          },
          ({ new: a }) => {
            setN((x) => x + 1);
            if (icono.current) sacudir(icono.current);
            avisar(
              "alerta_nueva",
              { mensaje: String(a.mensaje) },
              { texto: "Ver", alPulsar: () => router.push("/alertas") },
              `alerta-${a.id}`,
            );
            if (rutaRef.current === "/alertas") router.refresh();
          },
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "alertas",
            filter: `user_id=eq.${userId}`,
          },
          contar,
        )
        .subscribe();
    });
    return () => {
      cancelado = true;
      if (canal) void db.removeChannel(canal);
    };
  }, [userId, router, contar]);

  return (
    <Link
      href="/alertas"
      data-testid="campana"
      aria-label={n ? `Alertas, ${n} sin leer` : "Alertas"}
      className="relative grid size-8 place-items-center rounded-full bg-secondary text-foreground hover:bg-border"
    >
      <span ref={icono} className="grid place-items-center">
        <Bell aria-hidden="true" className="size-[18px]" />
      </span>
      {n > 0 && (
        <span
          data-testid="campana-n"
          className="absolute -top-1 -right-1 grid min-w-4 place-items-center rounded-full bg-up px-1 text-[10px] font-bold leading-4 text-white tabular-nums"
        >
          {n > 9 ? "9+" : n}
        </span>
      )}
    </Link>
  );
}
