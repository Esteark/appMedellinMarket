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
import { grupoARubro } from "@/lib/presupuesto/rubros";
import { OrigenFactura } from "./origen";
import { ResultadoImportacionVista } from "./resultado";
import { RevisionFactura } from "./revision";

type Props = { productos: ProductoCatalogo[]; onImportado: () => void };

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
    const r = await previsualizarCompra(aPayload(base));
    setConSesion(r.ok || r.error !== "sin_sesion");
    if (!r.ok) return;
    setFilas(
      base.map((f, i) => {
        const v = r.filas[i];
        if (!v) return f;
        return {
          ...f,
          tiendaId: v.tienda_id,
          productoId: v.producto_id,
          nuevo: v.producto_nuevo,
          rubro: v.producto_nuevo ? f.rubro : grupoARubro(v.grupo),
        };
      }),
    );
  };

  const revisar = async () => {
    const lectura = leerCsv(texto);
    setErrores(lectura.errores);
    if (lectura.errores.length > 0 || lectura.filas.length === 0) return;
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
        filas: aPayload(filas),
      });
      if (r.ok) {
        setResultado(r);
        setDeshecho(null);
        setPaso("resultado");
        avisar("importacion_lista", { gastos: r.gastos, precios: r.precios });
        onImportado();
      } else avisar(claveAviso(r.error));
    } else {
      guardarLocal(filas, fechaLote);
      guardarImportacionesLocal([
        {
          hash,
          fecha: fechaLote,
          filas: filas.length,
          creado: new Date().toISOString(),
        },
        ...lotes,
      ]);
      setResultado(null);
      setPaso("resultado");
      avisar("importacion_lista", { gastos: filas.length, precios: 0 });
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
        onFila={(i, p) =>
          setFilas((fs) => fs.map((f, k) => (k === i ? { ...f, ...p } : f)))
        }
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
