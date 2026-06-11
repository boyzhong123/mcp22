import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const html = path.join(__dirname, 'hero.html');
const out = path.join(__dirname, '..', 'assets', 'hero-v15-2x.png');

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1200, height: 520 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto('file://' + html);
await page.waitForLoadState('networkidle');
const el = await page.$('#wrap');
await el.screenshot({ path: out });
await browser.close();
console.log('wrote', out);
