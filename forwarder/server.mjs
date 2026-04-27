import http from 'node:http';
import crypto from 'node:crypto';
import nodemailer from 'nodemailer';

function getEnv(name, fallback = '') {
  return (process.env[name] ?? fallback).toString().trim();
}

function getSmtpPass() {
  const b64 = getEnv('SMTP_PASS_B64');
  if (b64) {
    try {
      return Buffer.from(b64, 'base64').toString('utf8');
    } catch {
      return '';
    }
  }
  return getEnv('SMTP_PASS');
}

function readJson(req, limitBytes = 256 * 1024) {
  return new Promise((resolve, reject) => {
    let buf = '';
    let bytes = 0;
    req.on('data', (chunk) => {
      bytes += chunk.length;
      if (bytes > limitBytes) {
        reject(Object.assign(new Error('payload too large'), { code: 'PAYLOAD_TOO_LARGE' }));
        req.destroy();
        return;
      }
      buf += chunk.toString('utf8');
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(buf || '{}'));
      } catch {
        reject(Object.assign(new Error('invalid json'), { code: 'INVALID_JSON' }));
      }
    });
    req.on('error', reject);
  });
}

function safeStr(x, max = 4000) {
  const s = (x ?? '').toString().trim();
  return s.length > max ? s.slice(0, max) : s;
}

function verifySignature({ secret, ts, sig, body }) {
  if (!secret) return false;
  if (!ts || !sig) return false;
  const skewMs = Math.abs(Date.now() - Number(ts));
  const maxSkewMs = Number(getEnv('MAX_SKEW_MS', '300000')) || 300_000;
  if (!Number.isFinite(skewMs) || skewMs > maxSkewMs) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${ts}.${body}`).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(sig, 'hex'));
  } catch {
    return false;
  }
}

function createTransporter() {
  const host = getEnv('SMTP_HOST', 'smtp.qiye.163.com');
  const port = Number(getEnv('SMTP_PORT', '465')) || 465;
  const secure =
    getEnv('SMTP_SECURE') ? getEnv('SMTP_SECURE').toLowerCase() === 'true' : port === 465;
  const user = getEnv('SMTP_USER');
  const pass = getSmtpPass();

  if (!user || !pass) {
    throw new Error('Missing SMTP_USER and (SMTP_PASS_B64 or SMTP_PASS).');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    connectionTimeout: Number(getEnv('SMTP_TIMEOUT_MS', '10000')) || 10_000,
    greetingTimeout: Number(getEnv('SMTP_TIMEOUT_MS', '10000')) || 10_000,
    socketTimeout: Number(getEnv('SMTP_TIMEOUT_MS', '20000')) || 20_000,
    tls: { servername: host },
  });
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const secret = getEnv('CONTACT_FORWARD_SECRET');
const port = Number(getEnv('PORT', '8787')) || 8787;
const salesTo = getEnv('SALES_TO', 'BD@chivox.com');

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    if (req.method !== 'POST' || req.url !== '/contact') {
      res.writeHead(404, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'not found' }));
      return;
    }

    const rawBody = await new Promise((resolve, reject) => {
      let buf = '';
      req.on('data', (c) => (buf += c.toString('utf8')));
      req.on('end', () => resolve(buf));
      req.on('error', reject);
    });

    const ts = safeStr(req.headers['x-chivox-ts'], 64);
    const sig = safeStr(req.headers['x-chivox-signature'], 256);
    if (!verifySignature({ secret, ts, sig, body: rawBody })) {
      res.writeHead(401, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'unauthorized' }));
      return;
    }

    let payload;
    try {
      payload = JSON.parse(rawBody || '{}');
    } catch {
      res.writeHead(400, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'invalid json' }));
      return;
    }

    const company = safeStr(payload.company, 200);
    const name = safeStr(payload.name, 120);
    const email = safeStr(payload.email, 320);
    const useCase = safeStr(payload.useCase, 80);
    const message = safeStr(payload.message, 4000);
    const source = safeStr(payload.source, 200);
    const submittedAt = safeStr(payload.submittedAt, 80);

    if (!company || !name || !email) {
      res.writeHead(400, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'missing fields' }));
      return;
    }

    const transporter = createTransporter();
    const smtpUser = getEnv('SMTP_USER');

    const lines = [
      'New lead forwarded from Netlify → forwarder.',
      '',
      '---',
      `Company   : ${company}`,
      `Name      : ${name}`,
      `Email     : ${email}`,
      `Use case  : ${useCase || '—'}`,
    ];
    if (message) lines.push('', 'Message   :', message);
    lines.push('', `Source    : ${source || '—'}`, `Submitted : ${submittedAt || new Date().toISOString()} (UTC)`);

    const text = lines.join('\n');
    const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'PingFang SC','Microsoft YaHei',sans-serif;font-size:14px;line-height:1.8;color:#222;white-space:pre-wrap;">${escapeHtml(
      text,
    )}</div>`;

    await transporter.sendMail({
      from: `"Chivox MCP Global" <${smtpUser}>`,
      to: salesTo,
      replyTo: email,
      subject: `[Chivox MCP · Global] ${company} — ${name}`,
      text,
      html,
    });

    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
  } catch (err) {
    console.error('forwarder error', err);
    res.writeHead(500, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'internal error' }));
  }
});

server.listen(port, () => {
  console.log(`forwarder listening on :${port}`);
});

