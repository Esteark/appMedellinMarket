import { BASE, EXTRA, PROT } from "@/data/planes";
import { pesos } from "@/lib/formato";
import { Consejos, Tabla } from "./tabla";

const COLS_LISTA = [
  { texto: "Producto" },
  { texto: "Cantidad" },
  { texto: "Precio PDF", der: true },
];

function Plegable({
  titulo,
  filas,
}: {
  titulo: string;
  filas: [string, string, number][];
}) {
  return (
    <details className="rounded-[14px] border bg-card px-3.5 py-2.5">
      <summary className="cursor-pointer text-sm font-semibold">
        {titulo}
      </summary>
      <div className="mt-2">
        <Tabla
          columnas={COLS_LISTA}
          filas={filas.map(([n, c, p]) => [n, c, pesos(p)])}
        />
      </div>
    </details>
  );
}

/** Tablas y consejos de la dieta (contenido fijo del artifact). */
export function DietaTablas() {
  const maxProt = Math.max(...PROT.map(([, v]) => v));
  const sumaBase = BASE.reduce((s, [, , p]) => s + p, 0);
  const sumaExtra = EXTRA.reduce((s, [, , p]) => s + p, 0);
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-bold">Por categoría (según el PDF)</h2>
          <Tabla
            columnas={[
              { texto: "Categoría" },
              { texto: "Cantidad/mes" },
              { texto: "PDF", der: true },
              { texto: "%", der: true },
            ]}
            filas={[
              ["Carnes y atún", "~20 kg", "$248.000", "21,1"],
              ["Huevos", "16 canastas x30", "$240.000", "20,5"],
              ["Verduras y hortalizas", "Lista semanal", "$234.000", "19,9"],
              ["Lácteos y quesos", "Según lista", "$160.000", "13,6"],
              ["Frutas", "Según lista", "$92.000", "7,8"],
              ["Leguminosas", "~26 paquetes", "$82.000", "7,0"],
              ["Especias, salsas, básicos", "Mensual", "$71.000", "6,1"],
              ["Pastas y maicitos", "20 + 8 paquetes", "$46.000", "3,9"],
            ]}
          />
        </section>
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-bold">Proteína por porción</h2>
          <ul
            className="flex flex-col gap-1.5 rounded-[14px] border bg-card p-3.5 text-sm"
            data-testid="proteina"
          >
            {PROT.map(([nombre, valor]) => (
              <li
                key={nombre}
                className="grid grid-cols-[9rem_1fr_4.5rem] items-center gap-2"
              >
                <span>{nombre}</span>
                <span
                  aria-hidden="true"
                  className="h-2.5 rounded-full bg-anot"
                  style={{ width: `${(valor / maxProt) * 100}%` }}
                />
                <span className="text-right tabular-nums">{pesos(valor)}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            Las leguminosas son la proteína más barata. Un día a la semana con
            carne de lentejas baja el costo.
          </p>
        </section>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold">Compras por semana</h2>
        <Tabla
          columnas={[
            { texto: "Semana" },
            { texto: "Qué se compra" },
            { texto: "PDF", der: true },
            { texto: "Suma real", der: true },
          ]}
          filas={[
            [
              "Semana 1",
              "Lista base + especias, salsas, quesos, miel y atún",
              "$371.500",
              "$411.500",
            ],
            [
              "Semana 2",
              "Lista base + 1 paquete de garbanzos",
              "$263.500",
              "$283.500",
            ],
            [
              "Semana 3",
              "Lista base + sal y pasta de ajo",
              "$277.500",
              "$286.500",
            ],
            ["Semana 4", "Solo lista base", "$253.000", "$278.500"],
          ]}
          total={["Mes", "", "$1.165.500", "$1.260.000"]}
        />
        <Plegable
          titulo={`Lista base semanal · ${pesos(sumaBase)}`}
          filas={BASE}
        />
        <Plegable
          titulo={`Extras de la semana 1 · ${pesos(sumaExtra)}`}
          filas={EXTRA}
        />
        <p className="text-xs text-muted-foreground">
          Para bajar al tope de $1.000.000 el PDF sugiere: lentejas a 3 paquetes
          por semana, pasta de ajo casera y atún cada dos semanas.
        </p>
      </section>

      <div className="grid gap-5 sm:grid-cols-2">
        <Consejos
          titulo="Dónde comprar"
          items={[
            "Verduras y frutas: Plaza Minorista o galerías del barrio, hasta 30 % más barato.",
            "Huevos, yogurt, pastas, maicitos: D1.",
            "Carnes: carnicería de confianza, comparando precio por kg.",
            "Leguminosas a granel: naturistas o tienda del barrio.",
          ]}
        />
        <Consejos
          titulo="Ahorros puntuales"
          items={[
            "Olla grande de lentejas o garbanzos el domingo, dura 4–5 días.",
            "Queso costeño duro (~$12.000/250 g) en vez de parmesano.",
            "Pasta de ajo casera: 2 cabezas + 3 cdas de aceite + sal, ~$4.000 vs $10.000.",
            "Aguacate verde para madurar en casa; cilantro en vaso con agua; lechuga en papel absorbente.",
          ]}
        />
      </div>
    </div>
  );
}
