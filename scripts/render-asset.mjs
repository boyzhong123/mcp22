import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Screenshot a single DOM node — no surrounding whitespace.
 * @param {{ html: string, selector: string, out: string, width?: number }} opts
 */
export async function renderAsset({ html, selector, out, width = 1100 }) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width, height: 200 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  await page.goto(`file://${html}`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector(selector);
  const el = page.locator(selector);
  const box = await el.boundingBox();
  if (box) {
    await page.setViewportSize({
      width: Math.ceil(box.width),
      height: Math.ceil(box.height),
    });
  }
  await el.screenshot({ path: out });
  await browser.close();
  console.log('wrote', out, box ? `${Math.round(box.width)}×${Math.round(box.height)} css px` : '');
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const [htmlName, selector, outName, width] = process.argv.slice(2);
  await renderAsset({
    html: path.join(__dirname, htmlName),
    selector,
    out: path.join(__dirname, '..', 'assets', outName),
    width: width ? Number(width) : 1100,
  });
}
