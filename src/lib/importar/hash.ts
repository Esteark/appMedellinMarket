/** SHA-256 (64 hex) del CSV normalizado + fecha: identifica un lote con y sin sesión. */
export async function hashLote(texto: string, fecha: string): Promise<string> {
  const normalizado = texto
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n")
    .trim();
  const bytes = new TextEncoder().encode(`${normalizado}|${fecha}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}
