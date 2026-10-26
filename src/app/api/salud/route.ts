import { connection } from "next/server";
import { frescura } from "@/lib/datos";

/** 200 con el estado de la corrida si la base responde; 503 si no. */
export async function GET() {
  await connection();
  try {
    const f = await frescura();
    return Response.json({
      ok: true,
      ultimaCorrida: f.ultimaCorrida,
      horasDesdeCorrida: f.horasDesdeCorrida,
      fuentesOk: f.fuentesOk,
    });
  } catch (e) {
    return Response.json(
      { ok: false, error: (e as Error).message },
      { status: 503 },
    );
  }
}
