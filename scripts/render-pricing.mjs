import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const html = path.join(__dirname, 'pricing.html');
const out = path.join(__dirname, '..', 'assets', 'pricing-v10-2x.png');

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1080, height: 680 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto('file://' + html);
await page.waitForLoadState('networkidle');
const el = await page.$('#wrap');
await el.screenshot({ path: out });
await browser.close();
console.log('wrote', out);
