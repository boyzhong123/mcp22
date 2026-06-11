import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderAsset } from './render-asset.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assets = path.join(__dirname, '..', 'assets');

const JOBS = [
  { html: 'hero.html', selector: '#wrap', out: 'hero-v13-2x.png', width: 1100 },
  { html: 'stats.html', selector: '#row', out: 'stats-v10-2x.png', width: 1100 },
  { html: 'fit.html', selector: '#wrap', out: 'fit-v8-2x.png', width: 720 },
  { html: 'loop.html', selector: '#wrap', out: 'loop-v8-2x.png', width: 720 },
  { html: 'mandarin.html', selector: '#wrap', out: 'mandarin-v8-2x.png', width: 720 },
  { html: 'english.html', selector: '#wrap', out: 'english-v8-2x.png', width: 720 },
  { html: 'pillars.html', selector: '#wrap', out: 'pillars-v8-2x.png', width: 720 },
  { html: 'pricing.html', selector: '#wrap', out: 'pricing-v10-2x.png', width: 720 },
  { html: 'community.html', selector: '#card', out: 'community-v4-2x.png', width: 720 },
];

for (const job of JOBS) {
  await renderAsset({
    html: path.join(__dirname, job.html),
    selector: job.selector,
    out: path.join(assets, job.out),
    width: job.width,
  });
}

console.log('All README assets rendered.');
