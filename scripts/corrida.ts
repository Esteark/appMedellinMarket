// Corrida diaria de precios (GitHub Actions o local contra Supabase local).
// Sale 0 si terminó, aunque haya tiendas en fallo; 1 solo ante una excepción no controlada.
// Uso: pnpm corrida [--todo] [--ayuda]
import "./cargar-env";
import { parseArgs } from "node:util";
import { clienteAdmin } from "@/corrida/admin";
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
  Consulta D1, Euro y SIPSA y actualiza precios_actuales, historial, clima_causas y tienda_estado.
  Los diarios todos los días; los semanales los lunes o con --todo.`);
  process.exit(0);
}

try {
  const ctx = contextoReal();
  const resumen = await correr(clienteAdmin(), ctx, { todo: values.todo });
  console.log(`Corrida ${resumen.corrida_id} (${ctx.hoy})`);
  for (const [tienda, c] of Object.entries(resumen.tiendas)) {
    console.log(
      `  ${tienda}: ${c.estado} · ${c.hallazgos}/${c.intentados} hallazgos · ${c.errores} errores`,
    );
  }
  console.log(
    `  escritos=${resumen.escritos} revisar=${resumen.revisar} causas=${resumen.causas}`,
  );
  process.exit(0);
} catch (e) {
  // shortcut: el correo al admin llega en el paso 9; por ahora solo exit 1 (GitHub avisa).
  console.error("CORRIDA FALLÓ:", e);
  process.exit(1);
}
