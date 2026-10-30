"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  type ReactNode,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  almacenamientoDisponible,
  leerProgreso,
  marcarVisto,
  reiniciar as reiniciarProgreso,
} from "@/lib/tutorial/almacenamiento";
import {
  claveDeRuta,
  esRutaDeAuth,
  type Modo,
  PASOS_PANTALLA,
  type Paso,
  pasosPara,
} from "@/lib/tutorial/pasos";

type Valor = {
  activo: boolean;
  /** Ruta actual (la entrega `SeguirRuta`); vacía hasta que carga. */
  ruta: string;
  /** El recorrido general ya se vio en este dispositivo (los tips no vuelven a salir). */
  completado: boolean;
  pasos: Paso[];
  /** Sube cada vez que se termina un recorrido: enciende la bombilla. */
  terminados: number;
  abrir: (modo: Modo) => void;
  /** `marcar`: guardar que ya se vio (al terminar, saltar o cerrar tras ver al menos un paso). */
  cerrar: (marcar: boolean) => void;
  reiniciar: () => void;
};

const Contexto = createContext<Valor | null>(null);

export function useTutorial(): Valor {
  const v = useContext(Contexto);
  if (!v) throw new Error("useTutorial fuera de ProveedorTutorial");
  return v;
}

const hayHojaAbierta = () => !!document.querySelector('[role="dialog"]');

/** Estado del tutorial: se abre solo una vez por dispositivo, nunca en rutas de auth, y no escribe en Supabase. */
export function ProveedorTutorial({ children }: { children: ReactNode }) {
  const [ruta, setRuta] = useState("");
  const [activo, setActivo] = useState(false);
  const [modo, setModo] = useState<Modo>("general");
  const [completado, setCompletado] = useState(false);
  const [terminados, setTerminados] = useState(0);
  const disparador = useRef<Element | null>(null);
  const devolverFoco = useRef(false);

  const abrir = useCallback((m: Modo) => {
    disparador.current = document.activeElement;
    setModo(m);
    setActivo(true);
  }, []);

  const cerrar = useCallback(
    (marcar: boolean) => {
      setActivo(false);
      if (marcar) {
        // Terminar el general también cuenta la pantalla actual como vista: no se repite al recargar.
        if (modo === "general") marcarVisto("general");
        marcarVisto(claveDeRuta(ruta));
        if (modo === "general") setCompletado(true);
        setTerminados((n) => n + 1);
      }
      devolverFoco.current = true;
    },
    [modo, ruta],
  );

  // El foco vuelve a quien abrió el tutorial; si ya no está (el menú se cerró), a la bombilla.
  // Se hace en un efecto: hasta el commit el resto de la página sigue inerte y no aceptaría el foco.
  useEffect(() => {
    if (activo || !devolverFoco.current) return;
    devolverFoco.current = false;
    const previo = disparador.current;
    const destino =
      previo instanceof HTMLElement &&
      previo !== document.body &&
      previo.isConnected
        ? previo
        : document.querySelector<HTMLElement>('[data-tour="bombilla"] button');
    requestAnimationFrame(() => destino?.focus());
  }, [activo]);

  // El tips y la bombilla saben desde el primer momento si el general ya se vio.
  useEffect(() => setCompletado(leerProgreso().general), []);

  const reiniciar = useCallback(() => {
    reiniciarProgreso();
    setCompletado(false);
  }, []);

  const valor = useMemo<Valor>(
    () => ({
      activo,
      ruta,
      completado,
      pasos: pasosPara(modo, ruta),
      terminados,
      abrir,
      cerrar,
      reiniciar,
    }),
    [activo, completado, modo, ruta, terminados, abrir, cerrar, reiniciar],
  );
  return (
    <Contexto value={valor}>
      {children}
      {/* usePathname exige Suspense en rutas dinámicas */}
      <Suspense fallback={null}>
        <SeguirRuta alCambiar={setRuta} />
      </Suspense>
    </Contexto>
  );
}

/** Entrega la ruta al proveedor y abre el tutorial solo cuando corresponde. */
function SeguirRuta({ alCambiar }: { alCambiar: (ruta: string) => void }) {
  const ruta = usePathname();
  const { abrir } = useTutorial();

  // biome-ignore lint/correctness/useExhaustiveDependencies: `abrir` y `alCambiar` son estables
  useEffect(() => {
    alCambiar(ruta);
    if (esRutaDeAuth(ruta)) return;
    // `?tutorial=1` siempre; si no, una vez por dispositivo y solo con almacenamiento para recordarlo.
    const forzado =
      new URLSearchParams(window.location.search).get("tutorial") === "1";
    if (!forzado && !almacenamientoDisponible()) return;
    const visto = leerProgreso();
    const clave = claveDeRuta(ruta);
    const t = setTimeout(() => {
      if (hayHojaAbierta()) return;
      if (forzado) return abrir("general");
      if (ruta === "/" && !visto.general) return abrir("general");
      if (
        visto.general &&
        clave in PASOS_PANTALLA &&
        !visto.pantallas.includes(clave)
      )
        abrir("pantalla");
    }, 800);
    return () => clearTimeout(t);
  }, [ruta]);

  return null;
}
