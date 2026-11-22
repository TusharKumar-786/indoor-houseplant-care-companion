import { config } from '../config/env';

/**
 * Escapes user-supplied strings before interpolating into HTML templates
 * to protect against HTML injection and XSS vulnerabilities.
 */
export function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface SendMailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

/**
 * Shared HTML email layout in the LeafPulse brand aesthetic.
 * Palette: Deep Moss (#1F3D2B), Oat Cream (#F5F1E6), Sage Mist (#C9D8C5), Terracotta (#C8693F).
 * No emojis, clean typography, mobile-friendly table layout.
 */
function renderBrandEmailLayout(title: string, contentHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F5F1E6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #3B2F2A; }
    table { border-collapse: collapse; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #F5F1E6; padding: 32px 16px; }
    .main { background-color: #FFFFFF; max-width: 580px; margin: 0 auto; border-radius: 16px; border: 1px solid #C9D8C5; overflow: hidden; box-shadow: 0 4px 16px rgba(31, 61, 43, 0.05); }
    .header { background-color: #1F3D2B; padding: 24px 32px; text-align: left; }
    .logo-text { color: #F5F1E6; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; font-family: Georgia, serif; text-decoration: none; }
    .content { padding: 36px 32px; line-height: 1.65; font-size: 15px; }
    h1, h2, h3 { color: #1F3D2B; font-family: Georgia, serif; margin-top: 0; }
    .btn { display: inline-block; background-color: #1F3D2B; color: #FFFFFF !important; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; font-size: 14px; margin-top: 16px; }
    .footer { padding: 24px 32px; background-color: #F5F1E6; font-size: 12px; color: #736159; border-top: 1px solid #C9D8C5; text-align: center; }
  </style>
</head>
<body>
  <div class="wrapper">
    <table class="main" width="100%" align="center" cellpadding="0" cellspacing="0">
      <tr>
        <td class="header">
          <span class="logo-text">LeafPulse</span>
        </td>
      </tr>
      <tr>
        <td class="content">
          ${contentHtml}
        </td>
      </tr>
      <tr>
        <td class="footer">
          LeafPulse — Indoor Houseplant Companion<br>
          Handcrafted with care for domestic botanical spaces.
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}

/**
 * Universal email sender with Resend API integration and graceful development console fallback.
 */
export async function sendEmail(options: SendMailOptions): Promise<{ success: boolean; id?: string }> {
  const { to, subject, html, text, replyTo } = options;

  // In production: if RESEND_API_KEY is missing, warn and return false internally (do not pretend sent)
  if (!config.email.resendApiKey && config.nodeEnv === 'production') {
    console.warn('[EMAIL SERVICE WARNING] RESEND_API_KEY is not configured in production. Outbound email skipped.');
    return { success: false };
  }

  // In development, or if RESEND_API_KEY is not configured: log cleanly to console with redacted secrets
  if (!config.email.resendApiKey || config.nodeEnv === 'development' || config.nodeEnv === 'test') {
    console.log('\n────────────────────────────────────────────────────────────');
    console.log('[EMAIL SERVICE - CONSOLE DISPATCH]');
    console.log(`To:       ${Array.isArray(to) ? to.join(', ') : to}`);
    console.log(`From:     ${config.email.mailFrom}`);
    if (replyTo) console.log(`Reply-To: ${replyTo}`);
    console.log(`Subject:  ${subject}`);
    console.log('────────────────────────────────────────────────────────────');
    if (text) {
      // Strictly never log reset tokens or raw reset URLs to console
      const sanitizedText = text
        .replace(/token=[a-zA-Z0-9_-]+/gi, 'token=[REDACTED]')
        .replace(/reset-password\?token=[^\s]+/gi, 'reset-password?token=[REDACTED]');
      console.log(`Plain Text Preview:\n${sanitizedText}`);
    }
    console.log('────────────────────────────────────────────────────────────\n');

    // If key is present in development, attempt send, but don't fail if network is absent
    if (!config.email.resendApiKey) {
      return { success: true, id: `mock-${Date.now()}` };
    }
  }

  try {
    const payload: any = {
      from: config.email.mailFrom,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    };
    if (text) payload.text = text;
    if (replyTo) payload.reply_to = replyTo;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.email.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('[EMAIL ERROR] Resend API responded with failure:', errorText);
      return { success: false };
    }

    const data: any = await res.json();
    return { success: true, id: data?.id };
  } catch (error) {
    console.error('[EMAIL ERROR] Failed to deliver email via Resend API:', error);
    return { success: false };
  }
}

/**
 * 1. Contact Form: Notify Admin with visitor Reply-To
 */
export async function sendContactNotification(name: string, email: string, message: string) {
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message);

  const subject = `LeafPulse Contact: ${name}`;
  const html = renderBrandEmailLayout(
    subject,
    `<h2>New Contact Inquiry</h2>
     <p><strong>Sender:</strong> ${safeName} &lt;${safeEmail}&gt;</p>
     <p><strong>Message:</strong></p>
     <div style="background-color: #F5F1E6; padding: 16px; border-radius: 8px; border: 1px solid #C9D8C5; font-style: italic;">
       ${safeMessage.replace(/\n/g, '<br>')}
     </div>
     <p style="margin-top: 20px; font-size: 13px; color: #736159;">
       You can reply directly to this email to contact ${safeName}.
     </p>`
  );
  const text = `New Contact Inquiry from ${name} (${email}):\n\n${message}`;

  return sendEmail({
    to: config.email.adminEmail,
    replyTo: email,
    subject,
    html,
    text,
  });
}

/**
 * 1b. Contact Form: Send receipt confirmation to visitor
 */
export async function sendContactConfirmation(visitorEmail: string, visitorName: string) {
  const safeVisitorName = escapeHtml(visitorName);
  const subject = 'We received your message — LeafPulse';
  const html = renderBrandEmailLayout(
    subject,
    `<h2>Thank you for contacting us, ${safeVisitorName}</h2>
     <p>We received your note and our team reads every inquiry. We will get back to you shortly with an answer or plant care advice.</p>
     <p>In the meantime, feel free to explore our <a href="${config.frontendUrl}/blog" style="color: #1F3D2B; font-weight: 600;">Plant Care Guides</a>.</p>
     <p style="margin-top: 24px;">Warm regards,<br><strong>The LeafPulse Caretakers</strong></p>`
  );
  const text = `Hello ${visitorName},\n\nWe received your note and will get back to you shortly.\n\nWarm regards,\nThe LeafPulse Caretakers`;

  return sendEmail({
    to: visitorEmail,
    subject,
    html,
    text,
  });
}

/**
 * 2. Welcome Email on Registration
 */
export async function sendWelcomeEmail(toEmail: string, userName: string) {
  const firstName = userName ? userName.split(' ')[0] : 'Gardener';
  const safeFirstName = escapeHtml(firstName);
  const subject = `Welcome to LeafPulse, ${firstName}`;
  const html = renderBrandEmailLayout(
    subject,
    `<h2>Welcome to your indoor garden, ${safeFirstName}</h2>
     <p>Your LeafPulse account is ready. Here are three simple steps to start caring with confidence:</p>
     <ol style="padding-left: 20px; line-height: 1.8;">
       <li><strong>Map your rooms:</strong> Record which windows face morning or intense afternoon light.</li>
       <li><strong>Add your first plant:</strong> Choose from beginner favorites like Pothos or Snake Plant.</li>
       <li><strong>Log waterings with a tap:</strong> Never guess whether you watered earlier in the week.</li>
     </ol>
     <p style="text-align: center; margin-top: 28px;">
       <a href="${config.frontendUrl}/dashboard" class="btn">Open Your Garden Dashboard</a>
     </p>`
  );
  const text = `Welcome to LeafPulse, ${firstName}!\n\nOpen your dashboard at ${config.frontendUrl}/dashboard to add your first room and plant.`;

  return sendEmail({
    to: toEmail,
    subject,
    html,
    text,
  });
}

/**
 * 3. Password Reset Request Email (Never logs reset token to console)
 */
export async function sendPasswordResetEmail(toEmail: string, userName: string, resetToken: string) {
  const safeName = escapeHtml(userName || 'there');
  const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}`;
  const subject = 'Reset your LeafPulse password';
  const html = renderBrandEmailLayout(
    subject,
    `<h2>Password Reset Request</h2>
     <p>Hello ${safeName},</p>
     <p>We received a request to reset your LeafPulse account password. Click the button below to choose a new password. This secure link expires in 30 minutes.</p>
     <p style="text-align: center; margin-top: 24px; margin-bottom: 24px;">
       <a href="${resetUrl}" class="btn" style="background-color: #C8693F;">Reset My Password</a>
     </p>
     <p style="font-size: 13px; color: #736159;">If you did not request this change, you can safely ignore this email. Your account remains secure.</p>`
  );
  // Redact token from text representation so console preview never contains tokens
  const text = `Reset your LeafPulse password using the secure link delivered to your account (link expires in 30 minutes):\n${config.frontendUrl}/reset-password?token=[REDACTED]\n\nIf you did not request this, you can ignore this note.`;

  return sendEmail({
    to: toEmail,
    subject,
    html,
    text,
  });
}

/**
 * 3b. Password Changed Confirmation
 */
export async function sendPasswordChangedEmail(toEmail: string, userName: string) {
  const safeName = escapeHtml(userName || 'there');
  const subject = 'Your LeafPulse password was successfully updated';
  const html = renderBrandEmailLayout(
    subject,
    `<h2>Security Notification</h2>
     <p>Hello ${safeName},</p>
     <p>Your LeafPulse account password has just been changed. You can now sign in using your new credentials.</p>
     <p style="font-size: 13px; color: #736159;">If you did not perform this change, please contact our support team immediately.</p>`
  );
  const text = `Your LeafPulse password was successfully updated. If you did not make this change, please contact support.`;

  return sendEmail({
    to: toEmail,
    subject,
    html,
    text,
  });
}
