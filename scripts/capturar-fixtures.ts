// Captura respuestas reales para las pruebas de los adaptadores en tests/fixtures/<grupo>/.
// Respeta robots.txt, User-Agent propio y pausa de 1 s. Si algo falla, sale 1 sin tocar
// los fixtures anteriores (escribe solo cuando todo se capturó).
// Uso: pnpm capturar <vtex|euro|sipsa>
import "./cargar-env";
import { mkdirSync, writeFileSync } from "node:fs";
import { urlConsulta } from "@/corrida/adaptadores/vtex";
import { permitido } from "@/corrida/robots";
import { contextoReal } from "@/corrida/tipos";

const grupo = process.argv[2];
const ctx = contextoReal();
const capturas: Record<string, string> = {}; // archivo → contenido
const urls: Record<string, string> = {}; // archivo → url

async function capturar(archivo: string, url: string): Promise<string> {
  if (!url.endsWith("/robots.txt") && !(await permitido(url, ctx)))
    throw new Error(`robots.txt no permite ${url}`);
  const res = await ctx.fetch(url, {
    headers: { "user-agent": ctx.userAgent },
  });
  await ctx.esperar(ctx.pausaMs);
  if (!res.ok) throw new Error(`${url} respondió ${res.status}`);
  const texto = await res.text();
  capturas[archivo] = texto;
  urls[archivo] = url;
  return texto;
}

const consulta = (termino: string | null, sku: string | null = null) =>
  urlConsulta({
    producto_id: "",
    unidad_base: "u",
    cantidad_base: 1,
    termino,
    sku,
    url: null,
  }) as string;

try {
  if (grupo === "vtex") {
    await capturar("robots.txt", "https://www.d1.com.co/robots.txt");
    // Un producto por unidad (cabeza), uno en g y uno en ml.
    const ajo = JSON.parse(await capturar("d1-ajo.json", consulta("ajo")));
    await capturar("d1-arroz.json", consulta("arroz"));
    await capturar("d1-leche.json", consulta("leche"));
    const sku = ajo[0]?.items?.[0]?.itemId;
    if (!sku) throw new Error("la búsqueda de ajo no trajo skuId");
    await capturar("d1-sku.json", consulta(null, sku));
  } else if (grupo === "euro") {
    const euro = "https://www.eurosupermercados.com.co";
    await capturar("robots.txt", `${euro}/robots.txt`);
    // ml, kg a granel, g, y uno no convertible ("x6und 300gr" contra "unidad").
    await capturar(
      "aceite.html",
      `${euro}/aceite-girasol-100---euromax--x-900ml-444/p`,
    );
    await capturar("aguacate.html", `${euro}/aguacate-hass-c4a/p`);
    await capturar(
      "atun.html",
      `${euro}/atun-lomitos-en-agua--euromax--x-160gr-892/p`,
    );
    await capturar(
      "croissant.html",
      `${euro}/pan-croissant-x6und--300gr-esponjados-072/p`,
    );
  } else {
    throw new Error(
      `Grupo no soportado todavía: ${grupo ?? "(ninguno)"}. Use vtex o euro.`,
    );
  }
} catch (e) {
  console.error(
    `CAPTURA FALLÓ (${grupo}): ${(e as Error).message}. Fixtures anteriores intactos.`,
  );
  process.exit(1);
}

const carpeta = `tests/fixtures/${grupo}`;
mkdirSync(carpeta, { recursive: true });
for (const [archivo, texto] of Object.entries(capturas))
  writeFileSync(`${carpeta}/${archivo}`, texto);
writeFileSync(
  `${carpeta}/capturado.json`,
  `${JSON.stringify({ fecha: ctx.hoy, userAgent: ctx.userAgent, urls }, null, 2)}\n`,
);
console.log(
  `Capturados ${Object.keys(capturas).length} archivos en ${carpeta}`,
);
