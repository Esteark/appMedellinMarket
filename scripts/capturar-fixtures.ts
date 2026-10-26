// Captura respuestas reales para las pruebas de los adaptadores en tests/fixtures/<grupo>/.
// Respeta robots.txt, User-Agent propio y pausa de 1 s. Si algo falla, sale 1 sin tocar
// los fixtures anteriores (escribe solo cuando todo se capturó).
// Uso: pnpm capturar <vtex|euro|sipsa>
import "./cargar-env";
import { mkdirSync, writeFileSync } from "node:fs";
import { fechasCandidatas, urlsBoletin } from "@/corrida/adaptadores/sipsa";
import { urlConsulta } from "@/corrida/adaptadores/vtex";
import { permitido } from "@/corrida/robots";
import { contextoReal } from "@/corrida/tipos";

const grupo = process.argv[2];
const ctx = contextoReal();
const capturas: Record<string, Buffer> = {}; // archivo → bytes tal cual
const urls: Record<string, string> = {}; // archivo → url

async function capturar(archivo: string, url: string): Promise<string> {
  if (!url.endsWith("/robots.txt") && !(await permitido(url, ctx)))
    throw new Error(`robots.txt no permite ${url}`);
  const res = await ctx.fetch(url, {
    headers: { "user-agent": ctx.userAgent },
  });
  await ctx.esperar(ctx.pausaMs);
  if (!res.ok) throw new Error(`${url} respondió ${res.status}`);
  const bytes = Buffer.from(await res.arrayBuffer());
  capturas[archivo] = bytes;
  urls[archivo] = url;
  return bytes.toString("utf8");
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
    // Consulta exacta por RefId (la que usa la corrida): aceite de la URL /p del export.
    await capturar(
      "d1-refid.json",
      urlConsulta({
        producto_id: "aceite",
        unidad_base: "ml",
        cantidad_base: 1000,
        termino: null,
        sku: null,
        url: "https://www.d1.com.co/aceite-girasol-don-olio-12004357/p",
      }) as string,
    );
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
  } else if (grupo === "sipsa") {
    await capturar("robots.txt", "https://www.dane.gov.co/robots.txt");
    // El boletín más nuevo publicado entre hoy y 3 días atrás.
    let fecha: string | undefined;
    for (const candidata of fechasCandidatas(ctx.hoy)) {
      try {
        await capturar("anexo.xlsx", urlsBoletin(candidata).anexo);
        fecha = candidata;
        break;
      } catch {
        // no publicado ese día (fin de semana, festivo)
      }
    }
    if (!fecha)
      throw new Error("no hay boletín SIPSA de hoy ni de 3 días atrás");
    await capturar("boletin.pdf", urlsBoletin(fecha).boletin);
  } else {
    throw new Error(
      `Grupo no soportado: ${grupo ?? "(ninguno)"}. Use vtex, euro o sipsa.`,
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
