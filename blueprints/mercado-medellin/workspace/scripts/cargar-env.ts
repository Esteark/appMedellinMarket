// Cargador de variables para scripts (tsx no lee .env.local). Es el PRIMER import de todo
// script en scripts/. En local carga .env.local (lo genera `pnpm env:local`); en GitHub
// Actions el archivo no existe y las variables llegan como secrets del workflow.
import { existsSync } from "node:fs";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
