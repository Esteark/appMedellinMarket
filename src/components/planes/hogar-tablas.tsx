import { Consejos, Tabla } from "./tabla";

/** Desglose mensual y escenarios del hogar (contenido fijo del artifact). */
export function HogarTablas() {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold">Desglose mensual</h2>
        <Tabla
          columnas={[
            { texto: "Rubro" },
            { texto: "Detalle" },
            { texto: "Mensual", der: true },
          ]}
          filas={[
            [
              "Carnes",
              "Res molida, cerdo, pechuga de pollo (antes $375.000)",
              "$400.000",
            ],
            [
              "Huevos",
              "5 panales/semana · $15.000 c/u (D1, Plaza de Flórez / La América)",
              "$300.000",
            ],
            [
              "Yogurt griego",
              "~4 tarros grandes/semana, para aderezos",
              "$140.000",
            ],
            ["Leche en polvo", "2 bolsas × $30.000", "$60.000"],
            ["Leche líquida", "2 bolsas × $3.500", "$7.000"],
            ["Verduras y frutas", "$110.000/semana × 4,33", "$476.300"],
            [
              "Granos, especias y despensa",
              "Aceite de oliva, salsas, especias finas, poco arroz, arepas/parva",
              "$150.000",
            ],
            [
              "Colchón de reserva",
              "Reposición de lácteos y perecederos",
              "$100.000",
            ],
          ]}
          total={["Total", "", "$1.633.300"]}
        />
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold">Escenarios</h2>
        <Tabla
          columnas={[
            { texto: "Nivel" },
            { texto: "Total mes", der: true },
            { texto: "Por trabajador", der: true },
            { texto: "Semana", der: true },
          ]}
          filas={[
            [
              "Básico · marcas aliadas / mayoristas",
              "$1.425.000",
              "$356.250",
              "~$82.210",
            ],
            ["Medio · estimado real", "$1.633.300", "$408.325", "~$94.230"],
            [
              "Ideal · premium / margen amplio",
              "$1.825.000",
              "$456.250",
              "~$105.290",
            ],
          ]}
        />
        <Consejos
          titulo="Cómo leerlos"
          items={[
            "Básico: verduras en Plaza Mayorista o de Flórez y huevos por bulto o distribuidor directo.",
            "Medio: el consumo real: $400.000 en carnes, 600 huevos, yogurt griego constante, verduras de $110.000/semana y colchón de $100.000.",
            "Ideal: absorbe la temporada y permite yogurt de marca especializada o cortes magros de primera.",
          ]}
        />
        <p className="text-xs text-muted-foreground">
          El ajuste de carnes suma $25.000 al mes: $6.250 más por trabajador
          (~$1.440 por semana). Antes: básico $1.400.000 · medio $1.608.300 ·
          ideal $1.800.000.
        </p>
      </section>
    </div>
  );
}
