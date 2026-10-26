import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import { Encabezado } from "@/components/encabezado";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Mercado Medellín",
  description: "Compara precios de mercado en las tiendas de Medellín.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Suspense fallback={<div className="h-10 border-b bg-card" />}>
          <Encabezado />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
