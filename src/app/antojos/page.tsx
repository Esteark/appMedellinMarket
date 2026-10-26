import type { Metadata } from "next";
import { VistaCatalogo } from "@/components/catalogo/vista";
import { ANTOJOS } from "@/data/grupos";

export const metadata: Metadata = {
  title: "Antojos y gourmet · Mercado Medellín",
};

export default function Antojos() {
  return <VistaCatalogo titulo="Antojos y gourmet" grupos={ANTOJOS} />;
}
