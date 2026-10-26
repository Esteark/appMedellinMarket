import nodemailer, { type Transporter } from "nodemailer";

/** Manda un aviso al admin. Nunca lanza por falta de configuración: solo lo registra. */
export type Aviso = (asunto: string, texto: string) => Promise<void>;

/** SMTP de Gmail (465, TLS) desde el entorno; `null` si falta configuración. */
export function transporteDesdeEnv(): Transporter | null {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 465),
    secure: true,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export function crearAviso(
  transporte: Pick<Transporter, "sendMail"> | null,
  destino: string | undefined,
  remitente = destino,
): Aviso {
  return async (asunto, texto) => {
    if (!transporte || !destino) {
      console.warn(`[correo sin configurar] ${asunto}\n${texto}`);
      return;
    }
    await transporte.sendMail({
      from: remitente,
      to: destino,
      subject: `[Mercado Medellín] ${asunto}`,
      text: texto,
    });
  };
}
