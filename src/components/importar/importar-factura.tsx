"use client";

import { useEffect, useState } from "react";
import {
  deshacerImportacion,
  importarCompra,
  previsualizarCompra,
} from "@/app/presupuesto/acciones";
import { avisar } from "@/lib/avisos";
import type { ProductoCatalogo } from "@/lib/datos";
import { hoyBogota } from "@/lib/fecha";
import { leerCsv } from "@/lib/importar/csv";
import { conVistaPrevia } from "@/lib/importar/decidir";
import {
  aPayload,
  aRevision,
  claveAviso,
  guardarLocal,
} from "@/lib/importar/factura";
import type { Grupo } from "@/lib/importar/grupos";
import { hashLote } from "@/lib/importar/hash";
import type {
  ErrorCsv,
  FilaRevision,
  ResultadoDeshacer,
  ResultadoImportacion,
} from "@/lib/importar/tipos";
import {
  guardarImportacionesLocal,
  leerImportacionesLocal,
} from "@/lib/presupuesto/almacenamiento";
import { OrigenFactura } from "./origen";
import { ResultadoImportacionVista } from "./resultado";
import { RevisionFactura } from "./revision";

type Props = { productos: ProductoCatalogo[]; onImportado: () => void };

/** Una fila sin producto, tienda, cantidad o precio no se puede guardar todavía. */
const estaCompleta = (f: FilaRevision) =>
  Boolean(f.producto.trim()) &&
  Boolean(f.tienda.trim()) &&
  f.cantidad >= 0.001 &&
  f.precioTotal >= 1;

export function ImportarFactura({ productos, onImportado }: Props) {
  const [paso, setPaso] = useState<"origen" | "revision" | "resultado">(
    "origen",
  );
  const [texto, setTexto] = useState("");
  const [archivo, setArchivo] = useState("factura.csv");
  const [fechaLote, setFechaLote] = useState("");
  const [errores, setErrores] = useState<ErrorCsv[]>([]);
  const [mensaje, setMensaje] = useState("");
  const [filas, setFilas] = useState<FilaRevision[]>([]);
  const [notas, setNotas] = useState<string[]>([]);
  const [totales, setTotales] = useState<Record<string, string>>({});
  const [conSesion, setConSesion] = useState(false);
  const [publicar, setPublicar] = useState(true);
  const [confirma, setConfirma] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoImportacion | null>(null);
  const [deshecho, setDeshecho] = useState<ResultadoDeshacer | null>(null);

  useEffect(() => setFechaLote(hoyBogota()), []);

  const leerArchivo = (f: File) => {
    if (!/\.csv$/i.test(f.name)) {
      setMensaje(
        "Solo se leen archivos .csv. Abre el Excel y guárdalo como CSV.",
      );
      avisar("archivo_no_csv");
      return;
    }
    setMensaje("");
    setArchivo(f.name);
    const lector = new FileReader();
    lector.onload = () => setTexto(String(lector.result ?? ""));
    lector.readAsText(f);
  };

  const previsualizar = async (base: FilaRevision[]) => {
    const completas = base.filter(estaCompleta);
    if (completas.length === 0) return setFilas(base);
    const r = await previsualizarCompra(aPayload(completas));
    setConSesion(r.ok || r.error !== "sin_sesion");
    if (!r.ok) return setFilas(base);
    // El RPC numera las filas recibidas (1..N), no las líneas del CSV: se
    // emparejan por posición con las filas completas que se enviaron.
    const porLinea = new Map(
      completas.map((f, i) => [f.linea, r.filas[i]] as const),
    );
    setFilas(
      base.map((f) => {
        const v = porLinea.get(f.linea);
        return v ? conVistaPrevia(f, v) : f;
      }),
    );
  };

  const revisar = async () => {
    const lectura = leerCsv(texto);
    setErrores(lectura.errores);
    if (lectura.filas.length === 0) return;
    const base = lectura.filas.map((f) => aRevision(f, productos));
    const claves = new Set(
      base.map((f) => `${f.tienda}|${f.fecha || fechaLote}`),
    );
    setTotales(
      lectura.total && claves.size === 1
        ? { [[...claves][0]]: String(lectura.total) }
        : {},
    );
    setNotas(lectura.notas);
    setFilas(base);
    setConfirma(false);
    setPaso("revision");
    await previsualizar(base);
  };

  const guardar = async () => {
    const activas = filas.filter(estaCompleta);
    if (activas.length === 0) return;
    setGuardando(true);
    const hash = await hashLote(texto, fechaLote);
    const lotes = leerImportacionesLocal();
    if (lotes.some((l) => l.hash === hash)) {
      avisar("importacion_duplicada");
    } else if (conSesion) {
      const r = await importarCompra({
        fecha: fechaLote,
        archivo,
        publicar,
        hash,
        filas: aPayload(activas),
      });
      if (r.ok) {
        setResultado(r);
        setDeshecho(null);
        setPaso("resultado");
        avisar("importacion_lista", { gastos: r.gastos, precios: r.precios });
        onImportado();
      } else avisar(claveAviso(r.error));
    } else {
      guardarLocal(activas, fechaLote);
      guardarImportacionesLocal([
        {
          hash,
          fecha: fechaLote,
          filas: activas.length,
          creado: new Date().toISOString(),
        },
        ...lotes,
      ]);
      setResultado(null);
      setPaso("resultado");
      avisar("importacion_lista", { gastos: activas.length, precios: 0 });
      onImportado();
    }
    setGuardando(false);
  };

  const deshacer = async () => {
    if (!resultado) return;
    setGuardando(true);
    const r = await deshacerImportacion(resultado.importacionId);
    if (r.ok) {
      setDeshecho(r);
      avisar("importacion_deshecha", {
        restaurados: r.restaurados,
        conservados: r.conservados,
      });
      onImportado();
    } else avisar(claveAviso(r.error));
    setGuardando(false);
  };

  const otra = () => {
    setPaso("origen");
    setTexto("");
    setFilas([]);
    setResultado(null);
    setDeshecho(null);
  };

  const cambiarGrupo = (
    g: Grupo,
    parche: { tienda?: string; fecha?: string },
  ) =>
    setFilas((fs) =>
      fs.map((f, i) => (g.indices.includes(i) ? { ...f, ...parche } : f)),
    );

  if (paso === "resultado")
    return (
      <ResultadoImportacionVista
        resultado={resultado}
        gastos={filas.length}
        deshecho={deshecho}
        deshaciendo={guardando}
        onDeshacer={deshacer}
        onOtra={otra}
      />
    );

  if (paso === "revision")
    return (
      <RevisionFactura
        filas={filas}
        fechaLote={fechaLote}
        conSesion={conSesion}
        publicar={publicar}
        totales={totales}
        notas={notas}
        confirmaNuevos={confirma}
        guardando={guardando}
        incompletas={filas.filter((f) => !estaCompleta(f)).length}
        onFila={(i, p) =>
          setFilas((fs) => fs.map((f, k) => (k === i ? { ...f, ...p } : f)))
        }
        onQuitar={(i) => setFilas((fs) => fs.filter((_, k) => k !== i))}
        onGrupo={cambiarGrupo}
        onPublicar={setPublicar}
        onTotal={(c, v) => setTotales((t) => ({ ...t, [c]: v }))}
        onConfirma={setConfirma}
        onActualizar={() => previsualizar(filas)}
        onGuardar={guardar}
        onVolver={() => setPaso("origen")}
      />
    );

  return (
    <OrigenFactura
      texto={texto}
      fechaLote={fechaLote}
      mensaje={mensaje}
      errores={errores}
      onTexto={setTexto}
      onFecha={setFechaLote}
      onArchivo={leerArchivo}
      onRevisar={revisar}
    />
  );
}
