export type Disparo =
  | { ok: true; enCurso: boolean }
  | { ok: false; error: string };

type Opciones = {
  fetch: typeof fetch;
  /** Token fine-grained con Actions: Read and write en este repo. Solo servidor. */
  token: string | undefined;
  /** "dueño/repo". */
  repo: string | undefined;
  workflow?: string;
};

/**
 * Lanza el workflow de la corrida con workflow_dispatch, salvo que ya haya una corrida en cola
 * o en curso (entonces no dispara otra). La concurrencia del workflow es la segunda barrera.
 */
export async function dispararCorrida({
  fetch,
  token,
  repo,
  workflow = "corrida.yml",
}: Opciones): Promise<Disparo> {
  if (!token || !repo)
    return { ok: false, error: "Falta GITHUB_DISPATCH_TOKEN o GITHUB_REPO" };
  const base = `https://api.github.com/repos/${repo}/actions/workflows/${workflow}`;
  const cabeceras = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
  };
  try {
    for (const estado of ["queued", "in_progress"]) {
      const r = await fetch(`${base}/runs?status=${estado}&per_page=1`, {
        headers: cabeceras,
      });
      if (!r.ok) return { ok: false, error: `GitHub respondió ${r.status}` };
      const { total_count } = (await r.json()) as { total_count: number };
      if (total_count > 0) return { ok: true, enCurso: true };
    }
    const r = await fetch(`${base}/dispatches`, {
      method: "POST",
      headers: cabeceras,
      body: JSON.stringify({ ref: "main" }),
    });
    if (r.status !== 204)
      return { ok: false, error: `GitHub respondió ${r.status}` };
    return { ok: true, enCurso: false };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** El token y el repo solo se leen aquí, en el servidor. */
export const dispararDesdeEnv = () =>
  dispararCorrida({
    fetch,
    token: process.env.GITHUB_DISPATCH_TOKEN,
    repo: process.env.GITHUB_REPO,
  });
