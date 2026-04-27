/**
 * Build full narration from voice-manifest segment files, record screen, mux final mp4.
 * Run from repo root: node github-assets/video/export-final-mp4.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const videoDir = __dirname;
const rootDir = path.join(videoDir, "..", "..");
const manifestPath = path.join(videoDir, "audio", "voice-manifest.js");
const raw = fs.readFileSync(manifestPath, "utf8");
const json = JSON.parse(raw.replace(/^[\s\S]*?=\s*/, "").replace(/;\s*$/, ""));

// Paths must be relative to the concat list file (same folder as the mp3 segments).
const lines = [];
for (const slide of json.slides) {
  for (const seg of slide.segments) {
    lines.push(`file '${seg.file.replace(/'/g, "'\\''")}'`);
  }
}
const concatPath = path.join(videoDir, "audio", "voice_concat_all.txt");
fs.writeFileSync(concatPath, lines.join("\n") + "\n", "utf8");

const outVoice = path.join(videoDir, "audio", "voice-full-manifest.mp3");
const outWebm = path.join(videoDir, "output", "live", "presentation-live.webm");
const outMp4 = path.join(videoDir, "chivox-mcp-demo-manifest-final.mp4");

function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { cwd, stdio: "inherit", encoding: "utf8" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

console.log("Concatenating narration…");
run("ffmpeg", [
  "-y",
  "-f",
  "concat",
  "-safe",
  "0",
  "-i",
  "github-assets/video/audio/voice_concat_all.txt",
  "-c",
  "copy",
  "github-assets/video/audio/voice-full-manifest.mp3",
], rootDir);

console.log("Recording presentation (Playwright)…");
run("npm", ["install", "-D", "playwright"], rootDir);
run("npx", ["playwright", "install", "chromium"], rootDir);
run("node", ["github-assets/video/render-live-video.mjs"], rootDir);

console.log("Muxing final mp4 (video + narration, 500ms voice delay)…");
run("ffmpeg", [
  "-y",
  "-i",
  "github-assets/video/output/live/presentation-live.webm",
  "-i",
  "github-assets/video/audio/voice-full-manifest.mp3",
  "-filter_complex",
  "[1:a]adelay=500|500[a]",
  "-map",
  "0:v:0",
  "-map",
  "[a]",
  "-c:v",
  "libx264",
  "-preset",
  "slower",
  "-crf",
  "14",
  "-pix_fmt",
  "yuv420p",
  "-c:a",
  "aac",
  "-b:a",
  "192k",
  "-shortest",
  "github-assets/video/chivox-mcp-demo-manifest-final.mp4",
], rootDir);

console.log("Done:", outMp4);
