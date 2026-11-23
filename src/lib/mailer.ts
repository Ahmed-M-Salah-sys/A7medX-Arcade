import { Resend } from 'resend';
import nodemailer from 'nodemailer';

export interface SendOtpResult {
  success: boolean;
  messageId?: string;
  error?: string;
  simulated?: boolean;
}

/**
 * Renders a gaming-styled HTML email for A7med Arcade verification codes.
 */
function renderOtpEmailHtml(otp: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>A7med Arcade - Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #030712; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #030712; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #0f172a; border-radius: 20px; border: 1px solid #1e293b; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);">
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #06b6d4 100%); padding: 32px 24px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">A7med Arcade</h1>
              <p style="margin: 6px 0 0 0; color: rgba(255, 255, 255, 0.85); font-size: 13px; font-weight: 500;">Next-Gen Indie Game Publishing Platform</p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 28px 24px 28px;">
              <h2 style="margin: 0 0 12px 0; color: #f8fafc; font-size: 18px; font-weight: 700;">Account Verification</h2>
              <p style="margin: 0 0 24px 0; color: #94a3b8; font-size: 14px; line-height: 1.6;">
                Thank you for joining <strong>A7med Arcade</strong>! Please use the following 6-digit verification code to complete your registration:
              </p>

              <!-- OTP Code Display Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
                <tr>
                  <td align="center" style="background: #090d16; border: 2px dashed #6366f1; border-radius: 14px; padding: 22px 16px;">
                    <span style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #38bdf8; display: inline-block;">
                      ${otp}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Expiry Alert -->
              <div style="background-color: rgba(245, 158, 11, 0.1); border-left: 3px solid #f59e0b; padding: 12px 14px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0; color: #fbbf24; font-size: 13px; font-weight: 500;">
                  ⏱ This code is valid for <strong>10 minutes</strong> and can only be used once.
                </p>
              </div>

              <!-- Security Warning -->
              <p style="margin: 20px 0 0 0; color: #64748b; font-size: 12px; line-height: 1.5;">
                If you did not request this verification code, please ignore this email. No changes will be made to your account.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0b1120; padding: 20px 24px; border-top: 1px solid #1e293b; text-align: center;">
              <p style="margin: 0; color: #475569; font-size: 11px;">
                Designed &amp; Developed by Ahmed Mohamed Salah &bull; All rights reserved &copy; 2026 A7med Arcade.
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

/**
 * Send 6-digit OTP email using Resend or Nodemailer SMTP based on available environment variables.
 * Returns a clear error if neither email provider is configured.
 */
export async function sendOtpEmail(email: string, otp: string): Promise<SendOtpResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const emailFrom = process.env.EMAIL_FROM || 'A7med Arcade <onboarding@resend.dev>';
  const subject = `Your A7med Arcade Verification Code: ${otp}`;
  const html = renderOtpEmailHtml(otp);
  const text = `Welcome to A7med Arcade!\n\nYour 6-digit verification code is: ${otp}\n\nThis code will expire in 10 minutes. If you did not request this code, please ignore this email.`;

  // 1. Resend Integration (Priority 1)
  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim()) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY.trim());
      const response = await resend.emails.send({
        from: emailFrom,
        to: normalizedEmail,
        subject,
        html,
        text,
      });

      if (response.error) {
        console.error('[Mailer Resend Error]:', response.error);
        return { success: false, error: response.error.message || 'Failed to send verification email via Resend.' };
      }

      return { success: true, messageId: response.data?.id };
    } catch (err: unknown) {
      console.error('[Mailer Resend Exception]:', err);
      const errMsg = err instanceof Error ? err.message : 'Unknown Resend error';
      return { success: false, error: `Resend service error: ${errMsg}` };
    }
  }

  // 2. Nodemailer SMTP Integration (Priority 2)
  if (process.env.SMTP_HOST && process.env.SMTP_HOST.trim()) {
    try {
      const port = Number(process.env.SMTP_PORT) || 587;
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST.trim(),
        port,
        secure: port === 465,
        auth: {
          user: process.env.SMTP_USER?.trim() || '',
          pass: process.env.SMTP_PASS?.trim() || '',
        },
      });

      const info = await transporter.sendMail({
        from: emailFrom,
        to: normalizedEmail,
        subject,
        html,
        text,
      });

      return { success: true, messageId: info.messageId };
    } catch (err: unknown) {
      console.error('[Mailer SMTP Exception]:', err);
      const errMsg = err instanceof Error ? err.message : 'Unknown SMTP error';
      return { success: false, error: `SMTP service error: ${errMsg}` };
    }
  }

  // 3. Development fallback simulator if explicitly enabled
  if (process.env.NODE_ENV === 'development' && process.env.ENABLE_DEV_OTP === 'true') {
    console.log('\n======================================================');
    console.log(`[DEV OTP SIMULATOR] To: ${normalizedEmail}`);
    console.log(`[DEV OTP SIMULATOR] Code: ${otp}`);
    console.log('======================================================\n');
    return { success: true, simulated: true };
  }

  // 4. Missing Mail Configuration Error
  return {
    success: false,
    error:
      'Mail service configuration is missing. Please configure RESEND_API_KEY or SMTP credentials (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS) in your environment variables.',
  };
}
