// Genera .env.local a partir de `supabase status -o json` (Supabase local corriendo).
// Idempotente: reescribe las claves de Supabase y conserva SMTP/ADMIN/USER_AGENT si ya existían.
// Uso: pnpm env:local
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { parseEnv } from "node:util";

const ARCHIVO = ".env.local";

const crudo = execSync("supabase status -o json", { encoding: "utf8" });
const inicio = crudo.indexOf("{");
const fin = crudo.lastIndexOf("}");
if (inicio < 0 || fin < inicio) {
  console.error(
    "`supabase status -o json` no devolvió JSON. ¿Corre Supabase local?",
  );
  process.exit(1);
}
const estado = JSON.parse(crudo.slice(inicio, fin + 1)) as Record<
  string,
  string
>;

// La CLI ha usado dos juegos de nombres; se acepta cualquiera de los dos.
const url = estado.API_URL;
const publica = estado.PUBLISHABLE_KEY ?? estado.ANON_KEY;
const servicio = estado.SECRET_KEY ?? estado.SERVICE_ROLE_KEY;
if (!url || !publica || !servicio) {
  console.error(
    "Faltan API_URL, PUBLISHABLE_KEY/ANON_KEY o SECRET_KEY/SERVICE_ROLE_KEY.",
  );
  process.exit(1);
}

const previo: Record<string, string | undefined> = existsSync(ARCHIVO)
  ? parseEnv(readFileSync(ARCHIVO, "utf8"))
  : {};

const valores: Record<string, string> = {
  NEXT_PUBLIC_SUPABASE_URL: url,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publica,
  SUPABASE_URL: url,
  SUPABASE_SERVICE_ROLE_KEY: servicio,
  SMTP_HOST: previo.SMTP_HOST ?? "smtp.gmail.com",
  SMTP_PORT: previo.SMTP_PORT ?? "465",
  SMTP_USER: previo.SMTP_USER ?? "",
  SMTP_PASS: previo.SMTP_PASS ?? "",
  ADMIN_EMAIL: previo.ADMIN_EMAIL ?? "",
  CORRIDA_USER_AGENT:
    previo.CORRIDA_USER_AGENT ??
    "MercadoMedellinBot/1.0 (+uso familiar; contacto en README)",
};

const texto = Object.entries(valores)
  .map(([clave, valor]) => `${clave}=${valor}`)
  .join("\n");
writeFileSync(ARCHIVO, `${texto}\n`);
console.log(`${ARCHIVO} escrito con ${Object.keys(valores).length} variables.`);
