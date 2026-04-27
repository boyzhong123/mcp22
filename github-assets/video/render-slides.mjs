import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs/promises";

const rootDir = process.cwd();
const videoDir = path.join(rootDir, "github-assets", "video");
const framesDir = path.join(videoDir, "output", "frames");

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function renderSlideFrames() {
  await ensureDir(framesDir);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  const url = `file://${path.join(videoDir, "index.html")}`;
  await page.goto(url, { waitUntil: "load" });

  // Hide cover and directly control slide state for deterministic frame capture.
  await page.evaluate(() => {
    const cover = document.getElementById("cover");
    if (cover) cover.style.display = "none";
  });

  for (let i = 0; i < 8; i += 1) {
    await page.evaluate((idx) => {
      const slides = Array.from(document.querySelectorAll(".slide"));
      slides.forEach((el, j) => {
        if (j === idx) {
          el.classList.add("active");
        } else {
          el.classList.remove("active");
        }
      });
    }, i);
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(framesDir, `slide${i}.png`) });
  }

  await browser.close();
}

await renderSlideFrames();
console.log("Slide frames rendered to", framesDir);
