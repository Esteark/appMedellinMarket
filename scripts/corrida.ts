// Corrida diaria de precios (GitHub Actions o local contra Supabase local).
// Sale 0 si terminó, aunque haya tiendas en fallo; 1 solo ante una excepción no controlada.
// Uso: pnpm corrida [--todo] [--ayuda]
import "./cargar-env";
import { parseArgs } from "node:util";
import { clienteAdmin } from "@/corrida/admin";
import { crearAviso, transporteDesdeEnv } from "@/corrida/correo";
import { correr } from "@/corrida/orquestador";
import { contextoReal } from "@/corrida/tipos";

const { values } = parseArgs({
  options: {
    todo: { type: "boolean", default: false },
    ayuda: { type: "boolean", default: false },
  },
});

if (values.ayuda) {
  console.log(`pnpm corrida [--todo]
  Consulta D1, La Minorista (SIPSA) y La Vaquita y actualiza precios_actuales, historial, clima_causas y tienda_estado.
  Los diarios todos los días; los semanales los lunes o con --todo.`);
  process.exit(0);
}

const aviso = crearAviso(
  transporteDesdeEnv(),
  process.env.ADMIN_EMAIL,
  process.env.SMTP_USER,
);

try {
  const ctx = contextoReal();
  const resumen = await correr(clienteAdmin(), ctx, {
    todo: values.todo,
    aviso,
  });
  console.log(`Corrida ${resumen.corrida_id} (${ctx.hoy})`);
  for (const [tienda, c] of Object.entries(resumen.tiendas)) {
    console.log(
      `  ${tienda}: ${c.estado} · ${c.hallazgos}/${c.intentados} hallazgos · ${c.errores} errores`,
    );
  }
  console.log(
    `  escritos=${resumen.escritos} revisar=${resumen.revisar} causas=${resumen.causas} alertas=${resumen.alertas} caídas=${resumen.caidas.join(",") || "ninguna"}`,
  );
  process.exit(0);
} catch (e) {
  console.error("CORRIDA FALLÓ:", e);
  // Primero el correo; si también falla, el exit 1 hace que GitHub avise igual.
  await aviso(
    "La corrida falló",
    e instanceof Error ? (e.stack ?? e.message) : String(e),
  ).catch((errorCorreo) =>
    console.error("Tampoco salió el correo:", errorCorreo),
  );
  process.exit(1);
}
