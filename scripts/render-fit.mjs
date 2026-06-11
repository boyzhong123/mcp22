import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const html = path.join(__dirname, 'fit.html');
const out = path.join(__dirname, '..', 'assets', 'fit-v8-2x.png');

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1100, height: 420 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto('file://' + html);
await page.waitForLoadState('networkidle');
const el = await page.$('#wrap');
await el.screenshot({ path: out });
await browser.close();
console.log('wrote', out);
