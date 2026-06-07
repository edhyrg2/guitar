import { createHash, randomBytes } from "crypto";
import { Resend } from "resend";

export function generateToken() {
  const token = randomBytes(32).toString("hex");
  const hashedToken = hashToken(token);

  return { token, hashedToken };
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function getAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

type SendEmailArgs = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export async function sendEmail({ to, subject, html, text }: SendEmailArgs) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!resendApiKey || !from) {
    return { ok: false as const, error: "Resend email is not configured." };
  }

  const resend = new Resend(resendApiKey);

  const result = await resend.emails.send({ from, to, subject, html, text });

  if (result.error) {
    return { ok: false as const, error: result.error.message };
  }

  return { ok: true as const };
}

function emailWrapper(content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Guitar Wiring Studio</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Header -->
          <tr>
            <td style="background:#0f172a;border-radius:16px 16px 0 0;padding:28px 40px;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="background:#0f766e;border-radius:10px;width:36px;height:36px;text-align:center;vertical-align:middle;">
                    <span style="color:#ffffff;font-size:18px;font-weight:bold;line-height:36px;">&#9834;</span>
                  </td>
                  <td style="padding-left:12px;text-align:left;">
                    <div style="color:#ffffff;font-size:14px;font-weight:600;line-height:1.2;">Guitar Wiring</div>
                    <div style="color:#94a3b8;font-size:11px;line-height:1.2;">Diagram Studio</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:40px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
                &copy; ${new Date().getFullYear()} Guitar Wiring Studio. All rights reserved.<br/>
                If you did not request this email, you can safely ignore it.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildVerificationEmail(name: string, verifyUrl: string) {
  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;line-height:1.3;">Verify your email address</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.6;">
      Hello <strong style="color:#0f172a;">${name}</strong>, thanks for joining Guitar Wiring Studio.
      Please confirm your email address to activate your account.
    </p>

    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px 24px;margin:0 0 28px;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;">What happens next</p>
      <p style="margin:0;font-size:14px;color:#475569;line-height:1.6;">
        Click the button below to verify your email. Once verified, you can sign in and start building wiring diagrams.
      </p>
    </div>

    <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
      <tr>
        <td style="background:#0f172a;border-radius:10px;">
          <a href="${verifyUrl}" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.01em;">
            Verify email address &rarr;
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;line-height:1.6;">
      Or copy and paste this link into your browser:
    </p>
    <p style="margin:0;font-size:12px;color:#0f766e;word-break:break-all;line-height:1.6;">
      <a href="${verifyUrl}" style="color:#0f766e;">${verifyUrl}</a>
    </p>

    <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0;" />

    <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
      This link expires in <strong>24 hours</strong>. If you did not create an account, you can ignore this email.
    </p>
  `;

  return {
    subject: "Verify your Guitar Wiring Studio email",
    html: emailWrapper(content),
    text: `Hello ${name},\n\nThanks for joining Guitar Wiring Studio. Please verify your email address by visiting the link below:\n\n${verifyUrl}\n\nThis link expires in 24 hours. If you did not create an account, you can ignore this email.\n\n— Guitar Wiring Studio`,
  };
}

export function buildPasswordResetEmail(name: string, resetUrl: string) {
  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;line-height:1.3;">Reset your password</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.6;">
      Hello <strong style="color:#0f172a;">${name}</strong>, we received a request to reset the password for your Guitar Wiring Studio account.
    </p>

    <div style="background:#fef9f0;border:1px solid #fed7aa;border-radius:12px;padding:20px 24px;margin:0 0 28px;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#ea580c;text-transform:uppercase;letter-spacing:0.08em;">Security notice</p>
      <p style="margin:0;font-size:14px;color:#9a3412;line-height:1.6;">
        If you did not request a password reset, please ignore this email. Your password will not change unless you click the button below.
      </p>
    </div>

    <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
      <tr>
        <td style="background:#0f172a;border-radius:10px;">
          <a href="${resetUrl}" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.01em;">
            Reset password &rarr;
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;line-height:1.6;">
      Or copy and paste this link into your browser:
    </p>
    <p style="margin:0;font-size:12px;color:#0f766e;word-break:break-all;line-height:1.6;">
      <a href="${resetUrl}" style="color:#0f766e;">${resetUrl}</a>
    </p>

    <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0;" />

    <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
      This link expires in <strong>1 hour</strong>. After that, you will need to request a new reset link.
    </p>
  `;

  return {
    subject: "Reset your Guitar Wiring Studio password",
    html: emailWrapper(content),
    text: `Hello ${name},\n\nWe received a request to reset the password for your Guitar Wiring Studio account.\n\nReset your password by visiting the link below:\n\n${resetUrl}\n\nThis link expires in 1 hour. If you did not request this, please ignore this email.\n\n— Guitar Wiring Studio`,
  };
}
