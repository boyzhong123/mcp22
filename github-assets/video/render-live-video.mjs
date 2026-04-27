import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";

const rootDir = process.cwd();
const videoDir = path.join(rootDir, "github-assets", "video");
const outputDir = path.join(videoDir, "output", "live");

async function readWaitMs() {
  const manifestPath = path.join(videoDir, "audio", "voice-manifest.js");
  try {
    const raw = await fs.readFile(manifestPath, "utf8");
    const m = raw.match(/"totalMs"\s*:\s*(\d+)/);
    if (m) return Number(m[1]) + 15000;
  } catch {
    /* fall through */
  }
  return 280000;
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: [
      "--disable-background-timer-throttling",
      "--disable-renderer-backgrounding",
      "--disable-backgrounding-occluded-windows",
    ],
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 3,
    recordVideo: {
      dir: outputDir,
      size: { width: 1920, height: 1080 },
    },
  });

  const page = await context.newPage();
  await page.addInitScript(() => {
    window.__CHIVOX_EXPORT_CLOCK__ = true;
  });
  const url = `${pathToFileURL(path.join(videoDir, "index.html")).href}?play=1`;
  await page.goto(url, { waitUntil: "load" });

  const waitMs = await readWaitMs();
  await page.waitForTimeout(waitMs);

  const video = page.video();
  await context.close();
  await browser.close();

  const saved = await video.path();
  const finalWebm = path.join(outputDir, "presentation-live.webm");
  await fs.copyFile(saved, finalWebm);
  console.log(finalWebm);
}

await main();
