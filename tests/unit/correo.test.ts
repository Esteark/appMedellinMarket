import nodemailer from "nodemailer";
import { describe, expect, it, vi } from "vitest";
import { crearAviso } from "@/corrida/correo";

describe("correo al admin", () => {
  it("manda un correo al destino con el asunto marcado", async () => {
    const transporte = nodemailer.createTransport({ jsonTransport: true });
    const enviar = vi.spyOn(transporte, "sendMail");
    await crearAviso(
      transporte,
      "admin@ejemplo.test",
      "bot@ejemplo.test",
    )("1 fuente caída", "- euro: fallo");
    expect(enviar).toHaveBeenCalledTimes(1);
    expect(enviar.mock.calls[0][0]).toMatchObject({
      from: "bot@ejemplo.test",
      to: "admin@ejemplo.test",
      subject: "[Mercado Medellín] 1 fuente caída",
      text: "- euro: fallo",
    });
  });

  it("sin SMTP o sin destino solo lo registra en consola, sin fallar", async () => {
    const aviso = vi.spyOn(console, "warn").mockImplementation(() => {});
    await expect(
      crearAviso(null, "admin@ejemplo.test")("x", "y"),
    ).resolves.toBeUndefined();
    const transporte = nodemailer.createTransport({ jsonTransport: true });
    const enviar = vi.spyOn(transporte, "sendMail");
    await crearAviso(transporte, undefined)("x", "y");
    expect(enviar).not.toHaveBeenCalled();
    expect(aviso).toHaveBeenCalledTimes(2);
    aviso.mockRestore();
  });
});
