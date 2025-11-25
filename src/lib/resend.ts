import { Resend } from "resend";

// Use a placeholder during build if API key is not set
const apiKey = process.env.RESEND_API_KEY || "re_placeholder";

export const resend = new Resend(apiKey);

// Use verified domain email or Resend's test email for development
export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Medicina del Alma <onboarding@resend.dev>";

interface SendPasswordResetEmailParams {
  to: string;
  userName: string;
  resetLink: string;
}

export async function sendPasswordResetEmail({
  to,
  userName,
  resetLink,
}: SendPasswordResetEmailParams) {
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Restablecer contraseña - Medicina del Alma",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Restablecer contraseña</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background-color: #6B9080; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                Medicina del Alma
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #2D3D35; font-size: 20px; font-weight: 600;">
                Hola ${userName},
              </h2>

              <p style="margin: 0 0 20px; color: #5C7A6B; font-size: 16px; line-height: 1.6;">
                Recibimos una solicitud para restablecer la contraseña de tu cuenta.
                Si no realizaste esta solicitud, puedes ignorar este correo.
              </p>

              <p style="margin: 0 0 30px; color: #5C7A6B; font-size: 16px; line-height: 1.6;">
                Para restablecer tu contraseña, haz clic en el siguiente botón:
              </p>

              <!-- Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center">
                    <a href="${resetLink}"
                       style="display: inline-block; padding: 14px 32px; background-color: #6B9080; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
                      Restablecer Contraseña
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0; color: #84A98C; font-size: 14px; line-height: 1.6;">
                Este enlace expirará en <strong>1 hora</strong> por seguridad.
              </p>

              <p style="margin: 20px 0 0; color: #84A98C; font-size: 14px; line-height: 1.6;">
                Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:
              </p>

              <p style="margin: 10px 0 0; color: #6B9080; font-size: 12px; word-break: break-all;">
                ${resetLink}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #F6FFF8; border-radius: 0 0 12px 12px; border-top: 1px solid #CCE3DE;">
              <p style="margin: 0; color: #84A98C; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} Medicina del Alma. Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  });

  if (error) {
    console.error("Error sending password reset email:", error);
    throw new Error("Error al enviar el correo");
  }

  return data;
}
