import { describe, expect, it } from "vitest";
import { dispararCorrida } from "@/lib/github";

type Llamada = { url: string; metodo: string; cuerpo?: string };

/** fetch falso: `enCola` corridas queued, `enCurso` in_progress y el status del POST. */
function falso(enCola: number, enCurso: number, statusPost = 204) {
  const llamadas: Llamada[] = [];
  const fetch = (async (url: string, init?: RequestInit) => {
    llamadas.push({
      url,
      metodo: init?.method ?? "GET",
      cuerpo: init?.body as string | undefined,
    });
    if (init?.method === "POST")
      return new Response(null, { status: statusPost });
    const total = url.includes("status=queued") ? enCola : enCurso;
    return Response.json({ total_count: total });
  }) as typeof globalThis.fetch;
  return { fetch, llamadas };
}

const base = { token: "t", repo: "dueno/repo" };
const posts = (l: Llamada[]) => l.filter((x) => x.metodo === "POST");

describe("dispararCorrida", () => {
  it("con una corrida en cola o en curso no dispara", async () => {
    for (const [cola, curso] of [
      [1, 0],
      [0, 1],
    ]) {
      const f = falso(cola, curso);
      expect(await dispararCorrida({ ...base, fetch: f.fetch })).toEqual({
        ok: true,
        enCurso: true,
      });
      expect(posts(f.llamadas)).toHaveLength(0);
    }
  });

  it("sin corridas hace exactamente un POST a dispatches con ref main", async () => {
    const f = falso(0, 0);
    expect(await dispararCorrida({ ...base, fetch: f.fetch })).toEqual({
      ok: true,
      enCurso: false,
    });
    const [post, ...otros] = posts(f.llamadas);
    expect(otros).toHaveLength(0);
    expect(post.url).toBe(
      "https://api.github.com/repos/dueno/repo/actions/workflows/corrida.yml/dispatches",
    );
    expect(JSON.parse(post.cuerpo ?? "")).toEqual({ ref: "main" });
  });

  it("una respuesta distinta de 204 es un fallo", async () => {
    const f = falso(0, 0, 422);
    expect((await dispararCorrida({ ...base, fetch: f.fetch })).ok).toBe(false);
  });

  it("sin token no llama a fetch", async () => {
    const f = falso(0, 0);
    expect(
      (await dispararCorrida({ ...base, token: undefined, fetch: f.fetch })).ok,
    ).toBe(false);
    expect(f.llamadas).toHaveLength(0);
  });
});
