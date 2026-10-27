/** URL pública: Vercel la da sola en producción (VERCEL_PROJECT_PRODUCTION_URL); en local, localhost. */
export const SITIO = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";
