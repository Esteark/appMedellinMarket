// Prueba de humo: arranca el build de producción (`next start` en el puerto 3100), pide una
// ruta y comprueba la respuesta. Sale 0 si todo cuadra, 1 si no. Siempre apaga el servidor.
//
// Uso: pnpm humo [--ruta .] [--estado 200] [--contiene texto]... [--claves a,b]
// --ruta va SIN barra inicial (Git Bash convierte "/x" en una ruta de Windows); "." = "/".
// Si la respuesta es JSON con estado 200, además exige `ok === true`.
import { spawn } from "node:child_process";
import { parseArgs } from "node:util";

const PUERTO = 3100;
const { values } = parseArgs({
  options: {
    ruta: { type: "string", default: "." },
    estado: { type: "string", default: "200" },
    contiene: { type: "string", multiple: true, default: [] },
    claves: { type: "string", default: "" },
  },
});

const ruta = `/${values.ruta.replace(/^\.?\/?/, "")}`;
const url = `http://127.0.0.1:${PUERTO}${ruta}`;
const servidor = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "start", "--port", String(PUERTO)],
  { stdio: ["ignore", "ignore", "inherit"] },
);

function fallar(mensaje: string): never {
  console.error(`HUMO FALLÓ ${ruta}: ${mensaje}`);
  servidor.kill();
  process.exit(1);
}

async function pedir(): Promise<Response> {
  for (let intento = 0; intento < 120; intento++) {
    try {
      return await fetch(url, { redirect: "manual" });
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  return fallar("el servidor no respondió en 60 s");
}

const respuesta = await pedir();
const cuerpo = await respuesta.text();
if (respuesta.status !== Number(values.estado)) {
  fallar(`estado ${respuesta.status}, se esperaba ${values.estado}`);
}
for (const texto of values.contiene) {
  if (!cuerpo.includes(texto)) fallar(`la respuesta no contiene «${texto}»`);
}
const esJson = (respuesta.headers.get("content-type") ?? "").includes("json");
if (esJson && respuesta.status === 200) {
  const datos = JSON.parse(cuerpo) as Record<string, unknown>;
  if (datos.ok !== true) fallar(`ok no es true: ${cuerpo}`);
  for (const clave of values.claves.split(",").filter(Boolean)) {
    if (!(clave in datos)) fallar(`falta la clave «${clave}» en ${cuerpo}`);
  }
}
console.log(`HUMO OK ${ruta} → ${respuesta.status}`);
servidor.kill();
process.exit(0);
