'use server';

import nodemailer from 'nodemailer';

/* ─────────────────────────────────────────────────────────────
 * English-only contact submission for /global landing page.
 *
 * Parallel to `send-contact-email.ts` (kept untouched for the
 * existing Chinese homepage). Differences here:
 *   • No phone field / no China-mobile regex.
 *   • Email is required and the primary channel.
 *   • Outbound subject & body are written for English-speaking
 *     sales reply.
 * ─────────────────────────────────────────────────────────── */

/**
 * Next.js loads `.env*` with variable expansion — literal `$` in
 * `SMTP_PASS=...` gets mangled (e.g. `2a2d$ZBCS4s$QK2L` → `2a2d`).
 * Prefer `SMTP_PASS_B64` (base64 of the UTF-8 password, no `$` issues).
 */
function getSmtpPass(): string {
  const b64 = process.env.SMTP_PASS_B64?.trim();
  if (b64) {
    try {
      return Buffer.from(b64, 'base64').toString('utf8');
    } catch {
      return '';
    }
  }
  return process.env.SMTP_PASS || '';
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.qiye.163.com',
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER || '',
      pass: getSmtpPass(),
    },
  });
}

function getSmtpUser() {
  return process.env.SMTP_USER || 'sales@chivox.com';
}

export type GlobalContactUseCase =
  | 'language-learning'
  | 'serious-games'
  | 'accessibility'
  | 'enterprise-training'
  | 'research'
  | 'other';

export interface GlobalContactFormData {
  company: string;
  name: string;
  email: string;
  useCase?: GlobalContactUseCase;
  message?: string;
  source?: string;
}

export interface GlobalContactFormResult {
  success: boolean;
  error?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const USE_CASE_LABELS: Record<GlobalContactUseCase, string> = {
  'language-learning': 'Language learning',
  'serious-games': 'Serious games / consumer',
  accessibility: 'Accessibility / speech therapy',
  'enterprise-training': 'Enterprise training & L&D',
  research: 'Research / academic',
  other: 'Other',
};

export async function sendGlobalContactEmail(
  data: GlobalContactFormData,
): Promise<GlobalContactFormResult> {
  const company = (data.company || '').trim();
  const name = (data.name || '').trim();
  const email = (data.email || '').trim();
  const message = (data.message || '').trim();
  const useCase = data.useCase;
  const source = (data.source || '/global').trim();

  if (!company || !name || !email) {
    return { success: false, error: 'Please fill in company, name and work email.' };
  }

  if (!EMAIL_RE.test(email)) {
    return { success: false, error: 'That email address doesn’t look right.' };
  }

  if (company.length > 200 || name.length > 120 || message.length > 4000) {
    return { success: false, error: 'One of the fields is too long.' };
  }

  try {
    const smtpUser = getSmtpUser();
    const smtpPass = getSmtpPass();
    if (!smtpUser || !smtpPass) {
      console.error('Global contact: missing SMTP_USER or SMTP pass (set SMTP_PASS_B64 or SMTP_PASS).');
      return {
        success: false,
        error: 'Email service is not configured. Please email sales@chivox.com directly.',
      };
    }
    const transporter = createTransporter();

    const submitTime = new Date().toISOString();
    const useCaseLabel = useCase ? USE_CASE_LABELS[useCase] ?? useCase : '—';

    const lines: string[] = [
      'New lead from the Chivox MCP Global site.',
      '',
      '---',
      `Company   : ${company}`,
      `Name      : ${name}`,
      `Email     : ${email}`,
      `Use case  : ${useCaseLabel}`,
    ];
    if (message) {
      lines.push('', 'Message   :', message);
    }
    lines.push('', `Source    : ${source}`, `Submitted : ${submitTime} (UTC)`);

    const textContent = lines.join('\n');
    const htmlContent = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'PingFang SC','Microsoft YaHei',sans-serif;font-size:14px;line-height:1.8;color:#222;white-space:pre-wrap;">${escapeHtml(
      textContent,
    )}</div>`;

    await transporter.sendMail({
      from: `"Chivox MCP Global" <${smtpUser}>`,
      to: 'sales@chivox.com',
      replyTo: email,
      subject: `[Chivox MCP · Global] ${company} — ${name}`,
      text: textContent,
      html: htmlContent,
    });

    return { success: true };
  } catch (err) {
    console.error('Global contact email error:', err);
    return {
      success: false,
      error: 'Couldn’t send right now. Please email sales@chivox.com directly.',
    };
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
