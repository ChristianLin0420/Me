import nodemailer from 'nodemailer';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SITE_URL = process.env.SITE_URL || 'https://christian-lin-me.fly.dev';
const FROM_EMAIL = process.env.FROM_EMAIL || SMTP_USER;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

export function isEmailConfigured(): boolean {
  return !!(SMTP_USER && SMTP_PASS);
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!SMTP_USER || !SMTP_PASS) {
    console.log(`[Email] SMTP not configured. Would send to ${to}: ${subject}`);
    return { success: true, mock: true };
  }

  const info = await transporter.sendMail({
    from: FROM_EMAIL,
    to,
    subject,
    html,
  });

  console.log(`[Email] Sent to ${to}: ${subject} (${info.messageId})`);
  return { success: true, messageId: info.messageId };
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
      Message from ${escapeHtml(name)}
    </h1>
    <div style="background:#fbfaef;padding:24px;margin-bottom:24px;">
      <p style="font-size:14px;line-height:1.8;color:#36392d;margin:0;white-space:pre-wrap;">${escapeHtml(message)}</p>
    </div>
    <div style="font-size:13px;color:#636658;">
      <p style="margin:0 0 4px;"><strong>From:</strong> ${escapeHtml(name)}</p>
      <p style="margin:0 0 4px;"><strong>Email:</strong> <a href="mailto:${encodeURI(email)}" style="color:#5e5e5e;">${escapeHtml(email)}</a></p>
    </div>
    <a href="mailto:${encodeURI(email)}?subject=Re: Your inquiry — The Digital Archivist" style="display:inline-block;margin-top:24px;background:#5e5e5e;color:#f9f7f7;font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;text-decoration:none;padding:14px 32px;">
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

export async function sendDigestEmail(
  to: string,
  papers: Array<{
    title: string;
    authors: string[];
    abstract: string;
    citationCount: number;
    selectionToken: string;
    venue: string;
  }>
) {
  const today = new Date().toISOString().split('T')[0].replace(/-/g, '.');

  const paperCards = papers.map((paper, i) => {
    const selectUrl = `${SITE_URL}/api/papers/select/${paper.selectionToken}`;
    const abstractSnippet = paper.abstract.length > 150
      ? paper.abstract.slice(0, 150) + '...'
      : paper.abstract;
    const authorsText = paper.authors.slice(0, 3).join(', ') + (paper.authors.length > 3 ? ' et al.' : '');

    return `
      <div style="padding:20px 0;${i < papers.length - 1 ? 'border-bottom:1px solid #e8ead8;' : ''}">
        <div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#b9bbaa;margin-bottom:6px;">
          #${String(i + 1).padStart(2, '0')} ${paper.venue ? `/ ${escapeHtml(paper.venue.slice(0, 40))}` : ''} / ${paper.citationCount} CITATIONS
        </div>
        <h2 style="font-family:system-ui,sans-serif;font-size:16px;font-weight:700;color:#36392d;letter-spacing:-0.01em;margin:0 0 6px;line-height:1.3;">
          ${escapeHtml(paper.title)}
        </h2>
        <p style="font-size:12px;color:#636658;margin:0 0 8px;font-style:italic;">${escapeHtml(authorsText)}</p>
        <p style="font-size:13px;line-height:1.6;color:#636658;margin:0 0 12px;">${escapeHtml(abstractSnippet)}</p>
        <a href="${selectUrl}" style="display:inline-block;background:#5e5e5e;color:#f9f7f7;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;text-decoration:none;padding:10px 24px;">
          READ_THIS_PAPER &rarr;
        </a>
      </div>
    `;
  }).join('');

  const html = emailWrapper(`
    <div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#636658;margin-bottom:8px;">
      DAILY RESEARCH DIGEST &mdash; ${today}
    </div>
    <h1 style="font-family:system-ui,sans-serif;font-size:24px;font-weight:700;color:#36392d;letter-spacing:-0.02em;margin:0 0 8px;">
      Today's Top Papers
    </h1>
    <p style="font-size:14px;line-height:1.7;color:#636658;margin:0 0 24px;">
      ${papers.length} papers curated from your research areas. Click any paper to generate a detailed reading and blog draft.
    </p>
    ${paperCards}
  `);

  return sendEmail(to, `Daily Research Digest \u2014 ${today}`, html);
}

export async function sendDraftReadyEmail(
  to: string,
  paper: { title: string; blogId: number }
) {
  const editUrl = `${SITE_URL}/admin/blogs/${paper.blogId}`;

  const html = emailWrapper(`
    <div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#636658;margin-bottom:8px;">
      DRAFT READY FOR REVIEW
    </div>
    <h1 style="font-family:system-ui,sans-serif;font-size:24px;font-weight:700;color:#36392d;letter-spacing:-0.02em;margin:0 0 16px;">
      Your paper review draft is ready.
    </h1>
    <p style="font-size:14px;line-height:1.7;color:#636658;margin:0 0 8px;">
      <strong>${escapeHtml(paper.title)}</strong>
    </p>
    <p style="font-size:14px;line-height:1.7;color:#636658;margin:0 0 28px;">
      The AI has read the full paper and generated a structured blog draft. Review and edit it in your admin panel.
    </p>
    <a href="${editUrl}" style="display:inline-block;background:#5e5e5e;color:#f9f7f7;font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;text-decoration:none;padding:14px 32px;">
      EDIT_DRAFT &rarr;
    </a>
  `);

  return sendEmail(to, `Draft Ready: ${paper.title} \u2014 The Digital Archivist`, html);
}

export async function sendNotificationEmail(
  email: string,
  token: string,
  post: { title: string; type: string; excerpt: string; url: string }
) {
  const unsubUrl = `${SITE_URL}/api/subscribe/unsubscribe/${token}`;

  const html = emailWrapper(`
    <div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#636658;margin-bottom:8px;">
      NEW ${escapeHtml(post.type.toUpperCase())} PUBLISHED
    </div>
    <h1 style="font-family:system-ui,sans-serif;font-size:24px;font-weight:700;color:#36392d;letter-spacing:-0.02em;margin:0 0 16px;">
      ${escapeHtml(post.title)}
    </h1>
    <p style="font-size:14px;line-height:1.7;color:#636658;margin:0 0 28px;">
      ${escapeHtml(post.excerpt)}
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
