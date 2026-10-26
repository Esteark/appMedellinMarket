import { VistaCatalogo } from "@/components/catalogo/vista";
import { BASICOS } from "@/data/grupos";

export default function Canasta() {
  return <VistaCatalogo titulo="Canasta familiar" grupos={BASICOS} />;
}
