// Standalone SMTP smoke test for the Chivox MCP contact form.
// Usage:  node scripts/test-smtp.mjs
// Reads .env.local manually so you don't need to spin up Next.

import fs from 'node:fs';
import path from 'node:path';
import nodemailer from 'nodemailer';

function loadDotenv(filename) {
  const p = path.resolve(process.cwd(), filename);
  if (!fs.existsSync(p)) return;
  const raw = fs.readFileSync(p, 'utf8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadDotenv('.env.local');

const host = process.env.SMTP_HOST || 'smtp.qiye.163.com';
const port = Number(process.env.SMTP_PORT) || 465;
const user = process.env.SMTP_USER;
const b64 = process.env.SMTP_PASS_B64?.trim();
const pass = b64
  ? Buffer.from(b64, 'base64').toString('utf8')
  : process.env.SMTP_PASS;

if (!user || !pass) {
  console.error('Missing SMTP_USER and (SMTP_PASS_B64 or SMTP_PASS) in .env.local');
  process.exit(1);
}

console.log(`→ Connecting to ${host}:${port} as ${user}`);

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: { user, pass },
});

try {
  await transporter.verify();
  console.log('✓ SMTP handshake OK');
} catch (err) {
  console.error('✗ SMTP handshake FAILED');
  console.error(err);
  process.exit(2);
}

try {
  const info = await transporter.sendMail({
    from: `"Chivox MCP smoke test" <${user}>`,
    to: 'sales@chivox.com',
    subject: '[smoke-test] Chivox MCP contact-form SMTP check',
    text:
      'This is an automated SMTP smoke test from scripts/test-smtp.mjs.\n' +
      'If you see this in sales@chivox.com, the contact form will work.\n\n' +
      `Sent at: ${new Date().toISOString()}`,
  });
  console.log('✓ Test email sent. messageId =', info.messageId);
  console.log('  response =', info.response);
} catch (err) {
  console.error('✗ Send FAILED');
  console.error(err);
  process.exit(3);
}
