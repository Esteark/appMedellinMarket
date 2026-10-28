import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import { AvisoDeUrl } from "@/components/avisos/aviso-de-url";
import { Sesion } from "@/components/avisos/sesion";
import { TipsNoInvasivos } from "@/components/avisos/tips-no-invasivos";
import { Toaster } from "@/components/avisos/toaster";
import { Encabezado } from "@/components/encabezado";
import { Pestanas } from "@/components/pestanas";
import { SincronizarPresupuesto } from "@/components/presupuesto/sincronizar-presupuesto";
import { SITIO } from "@/lib/sitio";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const DESCRIPCION =
  "Compara precios de 144 productos de mercado en D1, Euro, La Minorista y más tiendas de Medellín, y arma la lista de tu familia.";

export const metadata: Metadata = {
  metadataBase: new URL(SITIO),
  title: "Mercado Medellín",
  description: DESCRIPCION,
  applicationName: "Mercado Medellín",
  keywords: [
    "precios mercado Medellín",
    "comparar precios supermercado",
    "D1",
    "Euro",
    "La Minorista",
    "lista de mercado",
  ],
  openGraph: {
    type: "website",
    locale: "es_CO",
    siteName: "Mercado Medellín",
    title: "Mercado Medellín",
    description: DESCRIPCION,
  },
  twitter: { card: "summary_large_image" },
};

/** cover: la página llega bajo la muesca; la barra del carrito y las hojas suman safe-area-inset. */
export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAF7" },
    { media: "(prefers-color-scheme: dark)", color: "#0E1116" },
  ],
};

export default function RootLayout({ children, modal }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Suspense fallback={<div className="h-10 border-b bg-card" />}>
          <Encabezado />
        </Suspense>
        <Suspense fallback={<div className="h-11 border-b" />}>
          <Pestanas />
        </Suspense>
        {children}
        {modal}
        <Toaster />
        <Suspense fallback={null}>
          <Sesion />
        </Suspense>
        <Suspense fallback={null}>
          <AvisoDeUrl />
        </Suspense>
        <Suspense fallback={null}>
          <SincronizarPresupuesto />
        </Suspense>
        <Suspense fallback={null}>
          <TipsNoInvasivos />
        </Suspense>
      </body>
    </html>
  );
}
