import type { Contexto } from "@/corrida/tipos";

type Regla = { permitir: boolean; patron: string };

/** Reglas que aplican a `agente`: su grupo propio si existe; si no, el de `*` (RFC 9309). */
export function parsearRobots(texto: string, agente: string): Regla[] {
  const grupos: { agentes: string[]; reglas: Regla[] }[] = [];
  let actual: (typeof grupos)[number] | null = null;
  let leyendoAgentes = false;
  for (const linea of texto.split(/\r?\n/)) {
    const limpia = linea.replace(/#.*/, "").trim();
    const dos = limpia.indexOf(":");
    if (dos < 0) continue;
    const campo = limpia.slice(0, dos).trim().toLowerCase();
    const valor = limpia.slice(dos + 1).trim();
    if (campo === "user-agent") {
      if (!actual || !leyendoAgentes) {
        actual = { agentes: [], reglas: [] };
        grupos.push(actual);
      }
      actual.agentes.push(valor.toLowerCase());
      leyendoAgentes = true;
    } else if ((campo === "allow" || campo === "disallow") && actual) {
      leyendoAgentes = false;
      if (valor)
        actual.reglas.push({ permitir: campo === "allow", patron: valor });
    }
  }
  const token = agente.split("/")[0].toLowerCase();
  const propios = grupos.filter((g) =>
    g.agentes.some((a) => a !== "*" && token === a),
  );
  const elegidos = propios.length
    ? propios
    : grupos.filter((g) => g.agentes.includes("*"));
  return elegidos.flatMap((g) => g.reglas);
}

function coincide(patron: string, ruta: string): boolean {
  const anclado = patron.endsWith("$");
  const cuerpo = (anclado ? patron.slice(0, -1) : patron)
    .split("*")
    .map((parte) => parte.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp(`^${cuerpo}${anclado ? "$" : ""}`).test(ruta);
}

/** Gana la regla más larga que coincide; en empate gana Allow. Sin coincidencia: permitido. */
export function permitidoPor(reglas: Regla[], ruta: string): boolean {
  let mejor: Regla | null = null;
  for (const r of reglas) {
    if (!coincide(r.patron, ruta)) continue;
    if (
      !mejor ||
      r.patron.length > mejor.patron.length ||
      (r.patron.length === mejor.patron.length && r.permitir)
    )
      mejor = r;
  }
  return mejor ? mejor.permitir : true;
}

// Un robots.txt por host y por contexto (una corrida = un contexto).
const cache = new WeakMap<
  Contexto,
  Map<string, Promise<Regla[] | "bloqueado">>
>();

/**
 * ¿Robots permite pedir `url` con nuestro User-Agent? 404/410 = todo permitido;
 * error de red u otra respuesta no-ok = no se pide nada a ese host.
 */
export async function permitido(url: string, ctx: Contexto): Promise<boolean> {
  const { origin, pathname, search } = new URL(url);
  let porHost = cache.get(ctx);
  if (!porHost) {
    porHost = new Map();
    cache.set(ctx, porHost);
  }
  let reglas = porHost.get(origin);
  if (!reglas) {
    reglas = (async () => {
      try {
        const res = await ctx.fetch(`${origin}/robots.txt`, {
          headers: { "user-agent": ctx.userAgent },
        });
        await ctx.esperar(ctx.pausaMs);
        if (res.status === 404 || res.status === 410) return [];
        if (!res.ok) return "bloqueado";
        return parsearRobots(await res.text(), ctx.userAgent);
      } catch {
        return "bloqueado";
      }
    })();
    porHost.set(origin, reglas);
  }
  const r = await reglas;
  return r !== "bloqueado" && permitidoPor(r, pathname + search);
}
