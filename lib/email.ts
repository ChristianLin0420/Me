const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SITE_URL = process.env.SITE_URL || 'https://christian-lin-me.fly.dev';
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';

export function isEmailConfigured(): boolean {
  return !!RESEND_API_KEY;
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.log(`[Email] Resend not configured. Would send to ${to}: ${subject}`);
    return { success: true, mock: true };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Email send failed');
  }

  return await res.json();
}

function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#fefcf4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:48px 24px;">
    <div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#636658;margin-bottom:32px;">
      THE DIGITAL ARCHIVIST
    </div>
    ${content}
    <div style="margin-top:48px;padding-top:24px;border-top:1px solid #e8ead8;">
      <p style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.15em;text-transform:uppercase;color:#b9bbaa;margin:0;">
        © ${new Date().getFullYear()} The Digital Archivist. All rights reserved.
      </p>
    </div>
  </div>
</body></html>`;
}

export async function sendContactEmail(name: string, email: string, message: string) {
  const to = ADMIN_EMAIL;
  if (!to) {
    console.log(`[Email] ADMIN_EMAIL not set. Contact from ${name} <${email}>: ${message}`);
    return { success: true, mock: true };
  }

  const html = emailWrapper(`
    <div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#636658;margin-bottom:8px;">
      NEW CONTACT INQUIRY
    </div>
    <h1 style="font-family:system-ui,sans-serif;font-size:24px;font-weight:700;color:#36392d;letter-spacing:-0.02em;margin:0 0 24px;">
      Message from ${name}
    </h1>
    <div style="background:#fbfaef;padding:24px;margin-bottom:24px;">
      <p style="font-size:14px;line-height:1.8;color:#36392d;margin:0;white-space:pre-wrap;">${message}</p>
    </div>
    <div style="font-size:13px;color:#636658;">
      <p style="margin:0 0 4px;"><strong>From:</strong> ${name}</p>
      <p style="margin:0 0 4px;"><strong>Email:</strong> <a href="mailto:${email}" style="color:#5e5e5e;">${email}</a></p>
    </div>
    <a href="mailto:${email}?subject=Re: Your inquiry — The Digital Archivist" style="display:inline-block;margin-top:24px;background:#5e5e5e;color:#f9f7f7;font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;text-decoration:none;padding:14px 32px;">
      REPLY_TO_SENDER
    </a>
  `);

  return sendEmail(to, `Contact: ${name} — The Digital Archivist`, html);
}

export async function sendConfirmationEmail(email: string, token: string) {
  const verifyUrl = `${SITE_URL}/api/subscribe/verify/${token}`;

  const html = emailWrapper(`
    <h1 style="font-family:system-ui,sans-serif;font-size:28px;font-weight:700;color:#36392d;letter-spacing:-0.02em;margin:0 0 16px;">
      Confirm your subscription.
    </h1>
    <p style="font-size:15px;line-height:1.7;color:#636658;margin:0 0 32px;">
      You've requested to receive dispatches when new research, publications, or notes are archived.
      Click the button below to verify your email address.
    </p>
    <a href="${verifyUrl}" style="display:inline-block;background:#5e5e5e;color:#f9f7f7;font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;text-decoration:none;padding:14px 32px;">
      VERIFY_SUBSCRIPTION
    </a>
    <p style="font-size:12px;color:#b9bbaa;margin-top:24px;">
      If you didn't request this, you can safely ignore this email.
    </p>
  `);

  return sendEmail(email, 'Confirm your subscription — The Digital Archivist', html);
}

export async function sendNotificationEmail(
  email: string,
  token: string,
  post: { title: string; type: string; excerpt: string; url: string }
) {
  const unsubUrl = `${SITE_URL}/api/subscribe/unsubscribe/${token}`;

  const html = emailWrapper(`
    <div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#636658;margin-bottom:8px;">
      NEW ${post.type.toUpperCase()} PUBLISHED
    </div>
    <h1 style="font-family:system-ui,sans-serif;font-size:24px;font-weight:700;color:#36392d;letter-spacing:-0.02em;margin:0 0 16px;">
      ${post.title}
    </h1>
    <p style="font-size:14px;line-height:1.7;color:#636658;margin:0 0 28px;">
      ${post.excerpt}
    </p>
    <a href="${post.url}" style="display:inline-block;background:#5e5e5e;color:#f9f7f7;font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;text-decoration:none;padding:14px 32px;">
      READ_FULL_${post.type.toUpperCase()}
    </a>
    <p style="font-size:11px;color:#b9bbaa;margin-top:32px;">
      <a href="${unsubUrl}" style="color:#b9bbaa;text-decoration:underline;">Unsubscribe</a> from future dispatches.
    </p>
  `);

  return sendEmail(email, `New: ${post.title} — The Digital Archivist`, html);
}
