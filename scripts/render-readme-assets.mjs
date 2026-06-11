import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const html = path.join(__dirname, '..', 'index.html');
const assetsDir = path.join(__dirname, '..', 'assets');

/** index.html ?bare= modes without dedicated HTML templates */
const TARGETS = {
  compare: 'compare-v6-2x.png',
  loop: 'loop-v7-2x.png',
  mandarin: 'mandarin-v7-2x.png',
  english: 'english-v7-2x.png',
  pillars: 'pillars-v7-2x.png',
};

const browser = await chromium.launch();

for (const [mode, filename] of Object.entries(TARGETS)) {
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  await page.goto(`file://${html}?bare=${mode}`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForSelector('.readme', { timeout: 10_000 });
  const el = await page.locator('.readme');
  const out = path.join(assetsDir, filename);
  await el.screenshot({ path: out });
  const box = await el.boundingBox();
  console.log(`wrote ${filename} (${Math.round(box?.width ?? 0)}×${Math.round(box?.height ?? 0)} css px)`);
  await ctx.close();
}

await browser.close();
