'use server';

import nodemailer from 'nodemailer';
import crypto from 'node:crypto';

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
  const host = process.env.SMTP_HOST || 'smtp.qiye.163.com';
  const port = Number(process.env.SMTP_PORT) || 465;
  const secure =
    typeof process.env.SMTP_SECURE === 'string'
      ? process.env.SMTP_SECURE.trim().toLowerCase() === 'true'
      : port === 465;
  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER || '',
      pass: getSmtpPass(),
    },
    connectionTimeout: Number(process.env.SMTP_TIMEOUT_MS) || 10_000,
    greetingTimeout: Number(process.env.SMTP_TIMEOUT_MS) || 10_000,
    socketTimeout: Number(process.env.SMTP_TIMEOUT_MS) || 20_000,
    tls: {
      servername: host,
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
    const forwardUrl = (process.env.CONTACT_FORWARD_URL || '').trim();
    if (forwardUrl) {
      const secret = (process.env.CONTACT_FORWARD_SECRET || '').trim();
      if (!secret) {
        console.error('Global contact: CONTACT_FORWARD_URL is set but CONTACT_FORWARD_SECRET is missing.');
        return {
          success: false,
          error: 'Email service is not configured. Please email sales@chivox.com directly.',
        };
      }

      const payload = {
        company,
        name,
        email,
        useCase,
        message,
        source,
        submittedAt: new Date().toISOString(),
      };
      const body = JSON.stringify(payload);
      const ts = String(Date.now());
      const sig = crypto.createHmac('sha256', secret).update(`${ts}.${body}`).digest('hex');

      const ctrl = new AbortController();
      const timeoutMs = Number(process.env.CONTACT_FORWARD_TIMEOUT_MS) || 10_000;
      const t = setTimeout(() => ctrl.abort(), timeoutMs);
      try {
        const res = await fetch(forwardUrl, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-chivox-ts': ts,
            'x-chivox-signature': sig,
          },
          body,
          signal: ctrl.signal,
        });

        if (res.ok) {
          return { success: true };
        }
        const text = await res.text().catch(() => '');
        console.error('Global contact forwarder error:', { status: res.status, body: text.slice(0, 800) });
        return {
          success: false,
          error: 'Couldn’t send right now. Please email sales@chivox.com directly.',
        };
      } finally {
        clearTimeout(t);
      }
    }

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
    const e = err as unknown as { code?: unknown; message?: unknown; name?: unknown; stack?: unknown };
    console.error('Global contact email error:', {
      name: e?.name,
      code: e?.code,
      message: e?.message,
      stack: e?.stack,
      host: process.env.SMTP_HOST || 'smtp.qiye.163.com',
      port: Number(process.env.SMTP_PORT) || 465,
      secure:
        typeof process.env.SMTP_SECURE === 'string'
          ? process.env.SMTP_SECURE.trim().toLowerCase() === 'true'
          : (Number(process.env.SMTP_PORT) || 465) === 465,
    });
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
