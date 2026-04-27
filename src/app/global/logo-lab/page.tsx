'use client';

/* Logo playground — round 6.
 * Direction: keep the company's original two-circle composition exactly.
 * Tune palette + cutout proportions only. /global/logo-lab to compare. */

import { AmbientBackdrop } from '../_chrome';

type Palette = {
  id: string;
  name: string;
  note: string;
  // gradient stops for each disk
  left: [string, string];
  right: [string, string];
  // overlay shown over the right circle to render the intersection
  intersection: string;
  // wordmark color for "Chivox"
  wordmarkInk?: string;
  // gradient applied to the "MCP" portion of the wordmark
  wordmarkAccent: [string, string, string];
};

const PALETTES: Palette[] = [
  {
    id: 'orig',
    name: 'Original (current company logo)',
    note:
      'Saturated cyan + magenta, deep purple intersection. Strong DNA, dated execution. Everything below is the same composition with only color values tuned.',
    left: ['#1AA3D6', '#1AA3D6'],
    right: ['#D63A8A', '#D63A8A'],
    intersection: '#1B1346',
    wordmarkAccent: ['#4F7CF7', '#22D3EE', '#22C55E'],
  },
  {
    id: 'P1',
    name: 'P1 · Refined original (deeper cyan + warmer coral)',
    note:
      'Same hues, just less candy: deeper sea-cyan on the left, warmer coral on the right. The intersection is true navy, not muddy purple. Closest to "the original, grown up".',
    left: ['#1192C0', '#0E7AA6'],
    right: ['#E5396B', '#C8224F'],
    intersection: '#0F1B2D',
    wordmarkAccent: ['#0E7AA6', '#1192C0', '#E5396B'],
  },
  {
    id: 'P2',
    name: 'P2 · Brand-aligned (indigo + emerald)',
    note:
      'Listen side picks up the MCP wordmark gradient (indigo → cyan); speak side lands on emerald. Logo and wordmark now read as one system.',
    left: ['#4F7CF7', '#2563EB'],
    right: ['#22C55E', '#16A34A'],
    intersection: '#0F1B2D',
    wordmarkAccent: ['#4F7CF7', '#22D3EE', '#22C55E'],
  },
  {
    id: 'P3',
    name: 'P3 · Cool / sophisticated (slate + teal)',
    note:
      'Left disk slate (anchored, calm, "we listen"). Right disk teal (alive, "we speak"). Mature B2B feel — Stripe / Linear neighborhood.',
    left: ['#475569', '#1E293B'],
    right: ['#14B8A6', '#0D9488'],
    intersection: '#0B1220',
    wordmarkAccent: ['#475569', '#14B8A6', '#0D9488'],
  },
  {
    id: 'P4',
    name: 'P4 · Warm earthy (Anthropic palette)',
    note:
      'Amber + terracotta, deep cocoa intersection. Site already uses warm cards — this logo would melt into that palette instead of fighting it.',
    left: ['#F59E0B', '#D97706'],
    right: ['#DC2626', '#B91C1C'],
    intersection: '#422006',
    wordmarkInk: '#3F1B0A',
    wordmarkAccent: ['#D97706', '#DC2626', '#B91C1C'],
  },
  {
    id: 'P5',
    name: 'P5 · Soft pastel (premium muted)',
    note:
      'Dusty sky blue + warm rose. Same composition, lower saturation. Reads like a SaaS that takes itself seriously without screaming.',
    left: ['#60A5FA', '#3B82F6'],
    right: ['#FB7185', '#F43F5E'],
    intersection: '#1E1B4B',
    wordmarkAccent: ['#3B82F6', '#FB7185', '#F43F5E'],
  },
  {
    id: 'P6',
    name: 'P6 · Mono navy + emerald accent',
    note:
      'Both disks deep navy. Only the intersection — the moment listening meets speaking — is emerald. Strongest concept, quietest execution.',
    left: ['#0F1B2D', '#0F1B2D'],
    right: ['#0F1B2D', '#0F1B2D'],
    intersection: '#22C55E',
    wordmarkAccent: ['#4F7CF7', '#22D3EE', '#22C55E'],
  },
];

/* —————————————————————————————————————————————
 * The mark itself — same composition for every palette.
 * Geometry parameters are fixed; only colors come from the palette.
 *
 * Composition:
 *   Left disk  cx=32 cy=32 r=28, with a smaller circle cut out
 *              to create the open C / crescent.
 *   Right disk cx=68 cy=32 r=28, with a horizontal slot + half-disk
 *              cut out to create the open mouth / smile.
 *   Both circles overlap; the overlap region is rendered in the
 *   `intersection` color so it punches through.
 * ———————————————————————————————————————————— */
const Mark: React.FC<{ palette: Palette; size?: number }> = ({ palette, size = 56 }) => {
  const ns = palette.id;
  return (
    <svg viewBox="0 0 100 64" width={(size * 100) / 64} height={size} aria-hidden>
      <defs>
        <linearGradient id={`${ns}-l`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={palette.left[0]} />
          <stop offset="100%" stopColor={palette.left[1]} />
        </linearGradient>
        <linearGradient id={`${ns}-r`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor={palette.right[0]} />
          <stop offset="100%" stopColor={palette.right[1]} />
        </linearGradient>

        {/* Left circle: subtract a larger offset circle to carve a
            thick crescent / open C — matching the original proportions. */}
        <mask id={`${ns}-mask-l`}>
          <rect width="100" height="64" fill="white" />
          <circle cx="46" cy="32" r="16" fill="black" />
        </mask>

        {/* Right circle: subtract a horizontal slot (centered on the
            right disk, ends inside the parent edges so the pink ring
            remains continuous on the left/right) + a centered half-disk
            below — matches the original's "open smile" anatomy. */}
        <mask id={`${ns}-mask-r`}>
          <rect width="100" height="64" fill="white" />
          <rect x="46" y="30" width="44" height="4" fill="black" />
          <path d="M 53 32 a 15 15 0 0 0 30 0 Z" fill="black" />
        </mask>

        {/* Clip used to render the intersection slice — it's the
            right circle clipped by the left circle's footprint. */}
        <clipPath id={`${ns}-clip-l`}>
          <circle cx="32" cy="32" r="28" />
        </clipPath>
      </defs>

      {/* Left disk */}
      <circle cx="32" cy="32" r="28" fill={`url(#${ns}-l)`} mask={`url(#${ns}-mask-l)`} />
      {/* Right disk */}
      <circle cx="68" cy="32" r="28" fill={`url(#${ns}-r)`} mask={`url(#${ns}-mask-r)`} />
      {/* Intersection: re-draw the right disk clipped to the left disk's bounds */}
      <g clipPath={`url(#${ns}-clip-l)`}>
        <circle
          cx="68"
          cy="32"
          r="28"
          fill={palette.intersection}
          mask={`url(#${ns}-mask-r)`}
        />
      </g>
    </svg>
  );
};

const Wordmark: React.FC<{ palette: Palette; tone?: 'normal' | 'white' }> = ({
  palette,
  tone = 'normal',
}) => {
  const inkColor =
    tone === 'white' ? '#ffffff' : palette.wordmarkInk ?? '#0B1220';
  const [a, b, c] = palette.wordmarkAccent;
  return (
    <span
      className="font-semibold tracking-[-0.025em] text-[22px] leading-none flex items-baseline gap-[5px]"
      style={{ fontFamily: '"Inter", "SF Pro Display", "Helvetica Neue", system-ui, sans-serif' }}
    >
      <span style={{ color: inkColor }}>Chivox</span>
      <span
        style={{
          background: `linear-gradient(90deg, ${a} 0%, ${b} 55%, ${c} 100%)`,
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
        }}
      >
        MCP
      </span>
    </span>
  );
};

const Section: React.FC<{ palette: Palette }> = ({ palette }) => (
  <section className="rounded-2xl border border-zinc-900/[0.08] bg-white/70 backdrop-blur-md p-6 md:p-7">
    <div className="flex items-center gap-2 mb-5">
      <span className="text-[11px] font-mono text-emerald-700 tracking-[0.14em]">{palette.id}</span>
      <h2 className="text-[15.5px] font-semibold tracking-[-0.01em] text-zinc-900">
        {palette.name}
      </h2>
    </div>

    {/* hero preview */}
    <div className="flex items-center gap-4 mb-6">
      <Mark palette={palette} size={56} />
      <Wordmark palette={palette} />
    </div>

    {/* nav-size */}
    <div className="flex items-center gap-4 mb-4 text-[11px] text-muted-foreground font-mono uppercase tracking-[0.14em]">
      <span>nav size →</span>
      <span className="inline-flex items-center gap-2.5">
        <Mark palette={palette} size={32} />
        <span className="text-[16px]">
          <Wordmark palette={palette} />
        </span>
      </span>
    </div>

    {/* favicon */}
    <div className="flex items-center gap-4 mb-4 text-[11px] text-muted-foreground font-mono uppercase tracking-[0.14em]">
      <span>favicon →</span>
      <span className="inline-flex items-center gap-3">
        <Mark palette={palette} size={20} />
        <Mark palette={palette} size={16} />
      </span>
    </div>

    {/* on dark */}
    <div className="inline-flex items-center gap-4 rounded-xl bg-zinc-950 px-5 py-4">
      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.14em]">on dark</span>
      <div className="flex items-center gap-3">
        <Mark palette={palette} size={40} />
        <Wordmark palette={palette} tone="white" />
      </div>
    </div>

    <p className="mt-5 text-[13px] text-muted-foreground leading-relaxed">{palette.note}</p>
  </section>
);

export default function LogoLabPage() {
  return (
    <div className="relative min-h-screen">
      <AmbientBackdrop />

      <main className="relative container mx-auto px-6 max-w-5xl py-16">
        <header className="mb-10">
          <div className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-3">
            /logo-lab · round 6 · same composition, palette only
          </div>
          <h1 className="heading-display text-3xl md:text-4xl tracking-[-0.02em] leading-[1.1] mb-3">
            P5 — large preview
          </h1>
          <p className="text-muted-foreground leading-relaxed max-w-2xl mb-8">
            Big-format look at P5. Same composition as the original company mark, dusty
            sky-blue + warm rose, deep purple intersection. Geometry tuned (thicker C,
            wider mouth) to match your reference image.
          </p>

          {/* huge inline preview — easier to judge geometry at scale */}
          <div className="rounded-3xl border border-zinc-900/[0.08] bg-white/80 backdrop-blur-md p-10 md:p-14 flex flex-col items-center gap-6">
            <Mark palette={PALETTES[5]} size={220} />
            <Wordmark palette={PALETTES[5]} />
          </div>

          {/* and on dark, big */}
          <div className="mt-5 rounded-3xl bg-zinc-950 p-10 md:p-14 flex flex-col items-center gap-6">
            <Mark palette={PALETTES[5]} size={220} />
            <Wordmark palette={PALETTES[5]} tone="white" />
          </div>
        </header>

        <div className="space-y-5">
          {PALETTES.map((p) => (
            <Section key={p.id} palette={p} />
          ))}
        </div>

        <footer className="mt-10 text-[12.5px] text-muted-foreground font-mono">
          Pick one (e.g. &quot;P2&quot;). I&apos;ll wire it into{' '}
          <code className="text-foreground/80">ChivoxMcpBrand</code> and drop this page.
        </footer>
      </main>
    </div>
  );
}
