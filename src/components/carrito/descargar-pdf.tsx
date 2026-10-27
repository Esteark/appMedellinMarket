"use client";

import { FileDown } from "lucide-react";
import { useTransition } from "react";
import { Spinner } from "@/components/cargando";
import { avisar } from "@/lib/avisos";
import type { ProductoCatalogo, TiendaCatalogo } from "@/lib/datos";
import { hoyBogota } from "@/lib/fecha";
import { pesos } from "@/lib/formato";
import { datosPdf } from "@/lib/precios/exportar";
import type { Lista } from "@/lib/precios/lista";

// El PDF no entiende var(--token): estos son --primary y --muted-foreground del modo claro.
const TINTA = [15, 23, 42] as const;
const GRIS = [91, 100, 116] as const;

// Intl pone espacios duros en "$ 8.500"; Helvetica del PDF los pinta bien, pero se normalizan.
const dinero = (n: number) => pesos(n).replace(/\s/g, " ");

type Props = {
  lista: Lista;
  productos: ProductoCatalogo[];
  tiendas: TiendaCatalogo[];
};

/** Botón "Descargar PDF": arma la lista de mercado por tienda en el navegador (sin servidor). */
export function DescargarPdf({ lista, productos, tiendas }: Props) {
  const [creando, empezar] = useTransition();

  function crear() {
    empezar(async () => {
      try {
        // Las librerías pesan: solo se descargan al pulsar el botón.
        const [{ jsPDF }, { default: autoTable }] = await Promise.all([
          import("jspdf"),
          import("jspdf-autotable"),
        ]);
        const fecha = hoyBogota();
        const d = datosPdf(lista, productos, tiendas);
        const doc = new jsPDF({ unit: "pt", format: "a4" });
        const margen = 40;
        let y = 48;

        doc
          .setFont("helvetica", "bold")
          .setFontSize(18)
          .setTextColor(...TINTA);
        doc.text("Lista de mercado", margen, y);
        doc
          .setFont("helvetica", "normal")
          .setFontSize(10)
          .setTextColor(...GRIS);
        y += 16;
        doc.text(`${fecha} · Mercado Medellín`, margen, y);
        y += 14;

        const columnas = ["Producto", "Cant.", "Precio", "Subtotal"];
        const alinear = {
          1: { halign: "right" as const },
          2: { halign: "right" as const },
          3: { halign: "right" as const },
        };
        const tabla = (titulo: string, cuerpo: string[][], pie?: string[]) => {
          doc
            .setFont("helvetica", "bold")
            .setFontSize(12)
            .setTextColor(...TINTA);
          doc.text(titulo, margen, y + 4);
          autoTable(doc, {
            startY: y + 10,
            margin: { left: margen, right: margen },
            head: [columnas],
            body: cuerpo,
            foot: pie ? [pie] : undefined,
            theme: "striped",
            styles: { fontSize: 9, cellPadding: 4 },
            headStyles: { fillColor: [...TINTA] },
            footStyles: { fillColor: [241, 242, 236], textColor: [...TINTA] },
            columnStyles: alinear,
          });
          // El tipo `lastAutoTable` solo se aumenta con la importación estática; aquí es dinámica.
          const { finalY } = (
            doc as unknown as { lastAutoTable: { finalY: number } }
          ).lastAutoTable;
          y = finalY + 22;
          // Si no cabe otro título con su tabla, página nueva.
          if (y > doc.internal.pageSize.getHeight() - 90) {
            doc.addPage();
            y = 48;
          }
        };

        for (const t of d.tablas)
          tabla(
            t.tienda,
            t.filas.map((f) => [
              f.producto,
              String(f.cantidad),
              `${dinero(f.precio ?? 0)}${f.marca ? " *" : ""}`,
              dinero(f.subtotal ?? 0),
            ]),
            ["Subtotal", "", "", dinero(t.subtotal)],
          );
        if (d.sinPrecio.length)
          tabla(
            "Sin precio",
            d.sinPrecio.map((f) => [f.producto, String(f.cantidad), "—", "—"]),
          );

        doc
          .setFont("helvetica", "bold")
          .setFontSize(13)
          .setTextColor(...TINTA);
        doc.text(`Total: ${dinero(d.total)}`, margen, y);
        if (d.hayMarcas) {
          doc
            .setFont("helvetica", "normal")
            .setFontSize(9)
            .setTextColor(...GRIS);
          doc.text(
            "* Precio anotado a mano o desactualizado: puede haber cambiado.",
            margen,
            y + 16,
          );
        }
        doc.save(`lista-mercado-${fecha}.pdf`);
      } catch (e) {
        console.error("pdf:", e);
        avisar("pdf_no_generado");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={crear}
      disabled={creando}
      aria-busy={creando}
      data-testid="descargar-pdf"
      className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border bg-card px-4 text-sm font-semibold hover:bg-secondary disabled:opacity-70"
    >
      {creando ? (
        <Spinner />
      ) : (
        <FileDown aria-hidden="true" className="size-4" />
      )}
      Descargar PDF
    </button>
  );
}
