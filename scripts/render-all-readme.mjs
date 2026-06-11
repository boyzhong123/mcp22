import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderAsset } from './render-asset.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assets = path.join(__dirname, '..', 'assets');

const JOBS = [
  { html: 'hero.html', selector: '#wrap', out: 'hero-v15-2x.png', width: 1100 },
  { html: 'stats.html', selector: '#row', out: 'stats-v15-2x.png', width: 1100 },
  { html: 'fit.html', selector: '#wrap', out: 'fit-v15-2x.png', width: 720 },
  { html: 'compare.html', selector: '#wrap', out: 'compare-v15-2x.png', width: 1100 },
  { html: 'coach.html', selector: '#wrap', out: 'coach-v15-2x.png', width: 1100 },
  { html: 'loop.html', selector: '#wrap', out: 'loop-v15-2x.png', width: 720 },
  { html: 'mandarin.html', selector: '#wrap', out: 'mandarin-v15-2x.png', width: 1100 },
  { html: 'english.html', selector: '#wrap', out: 'english-v15-2x.png', width: 720 },
  { html: 'tools.html', selector: '#wrap', out: 'tools-v15-2x.png', width: 1100 },
  { html: 'transport.html', selector: '#card', out: 'transport-v15-2x.png', width: 1100 },
  { html: 'pillars.html', selector: '#wrap', out: 'pillars-v15-2x.png', width: 720 },
  { html: 'pricing.html', selector: '#wrap', out: 'pricing-v15-2x.png', width: 720 },
  { html: 'community.html', selector: '#card', out: 'community-v15-2x.png', width: 720 },
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
