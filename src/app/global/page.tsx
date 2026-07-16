'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  Mail,
  MessageSquareText,
  Maximize2,
  Sparkles,
  Terminal,
  Waves,
  Languages,
  Bot,
  Baby,
  GraduationCap,
  Zap,
  Mic2,
  ShieldCheck,
  Lightbulb,
  Play,
  CalendarDays,
  Gift,
  KeyRound,
  X,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FadeUp, StaggerContainer, StaggerItem } from '@/components/animated-section';
import {
  EVALUATION_UNIT_PRICES,
  FIXED_TOPUP_PLANS,
  TOPUP_BONUS_TIERS,
  TRIAL_CALLS,
  TRIAL_VALID_DAYS,
  WORD_SENTENCE_POINTS_PER_USE,
  PARAGRAPH_POINTS_PER_USE,
  buildTopupPointDetails,
  formatBonusPercent,
  formatEvaluationUnitDollars,
  getEvaluationUnitPrices,
  type ComparePackageId,
} from '@/app/dev-en/_lib/topup';
import {
  TopNav,
  SiteFooter,
  AmbientBackdrop,
  SAMPLE_MCP_RICH_JSON,
} from './_chrome';

/* ─────────────────────────────────────────────────────────────
 * Standalone English landing for overseas developers.
 *
 * Design intent:
 *  • First fold = what it does + how to plug it in, in one screen.
 *  • Content is dev-first: code, JSON, numbers; marketing copy kept minimal.
 *  • Interactive visuals (hero slides) stay in JSX;
 *    capability + use-case cards use editorial stills under public/.
 *  • Aesthetic borrowed from tavily.com — neutral palette, quiet dividers,
 *    generous spacing, cards over gradients.
 * ────────────────────────────────────────────────────────── */

const MCP_CLIENTS = [
  'Cursor',
  'Claude Desktop',
  'Cline',
  'Windsurf',
  'Zed',
  'LangChain',
  'LlamaIndex',
  'OpenAI Agents SDK',
];

/* ── code snippets for the hero's right card ─────────────── */
const INSTALL_TABS = [
  {
    id: 'cursor',
    label: 'Cursor',
    filename: '~/.cursor/mcp.json',
    code: `{
  "mcpServers": {
    "chivox": {
      "command": "npx",
      "args": ["-y", "@chivox/mcp"],
      "env": { "CHIVOX_API_KEY": "sk_live_..." }
    }
  }
}`,
  },
  {
    id: 'claude',
    label: 'Claude Desktop',
    filename: 'claude_desktop_config.json',
    code: `{
  "mcpServers": {
    "chivox": {
      "command": "npx",
      "args": ["-y", "@chivox/mcp"],
      "env": { "CHIVOX_API_KEY": "sk_live_..." }
    }
  }
}`,
  },
  {
    id: 'node',
    label: 'Node.js',
    filename: 'agent.ts',
    code: `import { Client } from '@modelcontextprotocol/sdk/client';

const chivox = await Client.connect({ name: 'chivox' });

const result = await chivox.callTool('assess_speech', {
  language: 'en-US',
  reference_text: 'The weather is gorgeous today.',
  audio_file_path: './take-01.wav',
});`,
  },
  {
    id: 'python',
    label: 'Python',
    filename: 'agent.py',
    code: `from mcp import Client

async with Client("chivox") as chivox:
    result = await chivox.call_tool(
        "assess_speech",
        language="zh-CN",
        reference_text="你好，今天天气很好",
        audio_file_path="./greeting.wav",
    )`,
  },
];

/* ── core capability cards (What can this MCP do?) ───────── */
type CapabilityVisual = 'meters' | 'bilingual' | 'dialogue' | 'target';
type CapabilityTone = 'emerald' | 'sky' | 'violet' | 'amber';

const CORE_CAPABILITIES: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  body: string;
  chipLabel: string;
  chips: string[];
  tone: CapabilityTone;
  visual: CapabilityVisual;
}[] = [
  {
    icon: Mic2,
    eyebrow: 'assessment',
    title: 'Score guided speech',
    body:
      'Stream live audio or post a file. Get overall, word and phoneme-level evidence in one response.',
    chipLabel: 'signals',
    chips: ['accuracy', 'fluency', 'phoneme'],
    tone: 'emerald',
    visual: 'meters',
  },
  {
    icon: MessageSquareText,
    eyebrow: 'conversation',
    title: 'Evaluate open dialogue',
    body:
      'Score free-flow responses across fluency, content, grammar, accuracy and rhythm — turn by turn.',
    chipLabel: 'mode',
    chips: ['AI-talk', '5-dim', 'streaming'],
    tone: 'violet',
    visual: 'dialogue',
  },
  {
    icon: Languages,
    eyebrow: 'language depth',
    title: 'Diagnose English and Mandarin natively',
    body:
      'Inspect tones and pinyin in Chinese; stress, rhythm and CEFR-aligned evidence in English.',
    chipLabel: 'coverage',
    chips: ['zh-CN', 'en-US', 'CEFR'],
    tone: 'sky',
    visual: 'bilingual',
  },
  {
    icon: Sparkles,
    eyebrow: 'agent outcome',
    title: 'Turn evidence into the next practice',
    body:
      'Give the structured JSON to any LLM to coach, route or generate targeted drills for the next turn.',
    chipLabel: 'works with',
    chips: ['GPT', 'Claude', 'Gemini'],
    tone: 'amber',
    visual: 'target',
  },
];

const ASSESSMENT_LOOP: {
  icon: LucideIcon;
  label: string;
  title: string;
}[] = [
  {
    icon: Mic2,
    label: 'Speech in',
    title: 'Capture the learner',
  },
  {
    icon: Waves,
    label: 'Evidence out',
    title: 'Return acoustic detail',
  },
  {
    icon: Sparkles,
    label: 'Next action',
    title: 'Let the agent respond',
  },
];

const CAPABILITY_ART: Record<CapabilityVisual, { src: string; alt: string }> = {
  meters: {
    src: '/capabilities/meters-v2.jpg',
    alt: 'Speech score meters: overall 84, accuracy 78, fluency 88, rhythm 73',
  },
  bilingual: {
    src: '/capabilities/bilingual-v2.jpg',
    alt: 'Bilingual panel with zh-CN 你好 / en-US Hello pronunciation details',
  },
  dialogue: {
    src: '/capabilities/dialogue-v2.jpg',
    alt: 'AI dialogue scoring UI with five-dimension score chips',
  },
  target: {
    src: '/capabilities/target-v4.jpg',
    alt: 'Personalized drill card with /θ/ minimal pairs and LLM chips',
  },
};

const CAPABILITY_TONE: Record<CapabilityTone, {
  accent: string;
  iconBg: string;
  iconColor: string;
  eyebrow: string;
  glow: string;
  ring: string;
}> = {
  emerald: {
    accent: 'from-emerald-400/70 via-emerald-500/50 to-transparent',
    iconBg: 'bg-emerald-500/10 border-emerald-500/25',
    iconColor: 'text-emerald-700 dark:text-emerald-300',
    eyebrow: 'text-emerald-700/80 dark:text-emerald-300/80',
    glow: 'from-emerald-400/25',
    ring: 'hover:ring-emerald-500/30',
  },
  sky: {
    accent: 'from-sky-400/70 via-sky-500/50 to-transparent',
    iconBg: 'bg-sky-500/10 border-sky-500/25',
    iconColor: 'text-sky-700 dark:text-sky-300',
    eyebrow: 'text-sky-700/80 dark:text-sky-300/80',
    glow: 'from-sky-400/25',
    ring: 'hover:ring-sky-500/30',
  },
  violet: {
    accent: 'from-violet-400/70 via-violet-500/50 to-transparent',
    iconBg: 'bg-violet-500/10 border-violet-500/25',
    iconColor: 'text-violet-700 dark:text-violet-300',
    eyebrow: 'text-violet-700/80 dark:text-violet-300/80',
    glow: 'from-violet-400/25',
    ring: 'hover:ring-violet-500/30',
  },
  amber: {
    accent: 'from-amber-400/80 via-amber-500/50 to-transparent',
    iconBg: 'bg-amber-500/10 border-amber-500/30',
    iconColor: 'text-amber-700 dark:text-amber-300',
    eyebrow: 'text-amber-700/80 dark:text-amber-300/80',
    glow: 'from-amber-400/25',
    ring: 'hover:ring-amber-500/30',
  },
};

/* ── product cards — aligned 1:1 with Products nav (English / Mandarin / Kids) ── */
type UseCaseArt = 'english' | 'mandarin' | 'kids';

const USE_CASE_ART: Record<UseCaseArt, { src: string; alt: string }> = {
  english: {
    src: '/use-cases/voice-v4.jpg',
    alt: 'English learner with overall score 84, fluency 78, and /θ/ pronunciation tip',
  },
  mandarin: {
    src: '/use-cases/mandarin-v4.jpg',
    alt: 'Learner practicing Mandarin tones with pinyin chips and score 88',
  },
  kids: {
    src: '/products/kids/practice.jpg',
    alt: 'Young learner unlocking a star after pronunciation practice on a tablet',
  },
};

const USE_CASES: {
  art: UseCaseArt;
  tag: string;
  title: string;
  body: string;
  href: string;
}[] = [
  {
    art: 'english',
    tag: 'English assessment',
    title: 'Pronunciation, fluency and phoneme feedback',
    body:
      'Score English speech with explainable dimensions — so tutors and agents can coach the exact sound, not a black-box percentage.',
    href: '/products/english-speech-assessment',
  },
  {
    art: 'mandarin',
    tag: 'Mandarin assessment',
    title: 'Tone, Pinyin and fluency scoring',
    body:
      'Give agents tones, sandhi and phoneme-level Mandarin — acoustic detail a transcript-only stack cannot surface.',
    href: '/products/mandarin-chinese-assessment',
  },
  {
    art: 'kids',
    tag: 'Kids speech assessment',
    title: 'Structured feedback for young learners',
    body:
      'Keep the raw scores behind the scenes; surface one clear next step so practice stays encouraging and age-appropriate.',
    href: '/products/kids-speech-assessment',
  },
];

/* ── benchmarks ──────────────────────────────────────────── */
type BenchmarkTab = {
  id: string;
  label: string;
  metric: string;
  metricLabel: string;
  body: string;
  chart: string;
  subStats: { value: string; label: string }[];
  bullets: string[];
  footnote: string;
};

const BENCHMARK_TABS: BenchmarkTab[] = [
  {
    id: 'correlation',
    label: 'Expert match',
    metric: '95%+',
    metricLabel: 'agreement with human experts',
    body:
      'Scores align with certified human expert rubrics at 95%+ correlation. Validated by national standardized speaking tests in 100+ cities.',
    chart: 'correlation',
    subStats: [
      { value: '0.95+', label: 'Pearson r vs experts' },
      { value: '<2 pts', label: 'Mean absolute error' },
      { value: '500K+', label: 'Calibration utterances' },
    ],
    bullets: [
      'Per-dimension rubrics: pron, fluency, completeness, prosody.',
      'Calibration corpus refreshed quarterly across L1/L2 cohorts.',
      'Stable across mic quality, room noise and child voices.',
    ],
    footnote: 'Validated against national speaking-test rubrics · ISO/IEC 17025-aligned labs',
  },
  {
    id: 'latency',
    label: 'Latency',
    metric: '<300ms',
    metricLabel: 'p50 streaming response',
    body:
      'Streaming WebSocket sessions return multi-dimensional scores in a few hundred milliseconds after end-of-speech. Perfect for real-time tutoring UX.',
    chart: 'latency',
    subStats: [
      { value: '180 ms', label: 'p50 end-of-speech → JSON' },
      { value: '<500 ms', label: 'p95 same region' },
      { value: '6 regions', label: 'Edge POPs worldwide' },
    ],
    bullets: [
      'Streaming WebSocket with partial scores while speaking.',
      'Same-region P95 under half a second — built for live UX.',
      'Backpressure-aware client SDKs in JS, Python, Swift, Kotlin.',
    ],
    footnote: 'Measured over 30-day rolling production traffic · last refreshed weekly',
  },
  {
    id: 'coverage',
    label: 'Coverage',
    metric: '7 task types',
    metricLabel: 'word · sentence · paragraph · semi-open · open · free · AI-talk',
    body:
      'One integration covers every stage of your learner journey — from single-word phonics to open-ended conversation.',
    chart: 'coverage',
    subStats: [
      { value: '60+', label: 'Phonemes scored' },
      { value: 'HSK 1–9', label: 'Mandarin lexical depth' },
      { value: 'CEFR A1–C2', label: 'English proficiency range' },
    ],
    bullets: [
      'Same payload contract across every task type.',
      'Children, teens, adults — acoustically tuned per cohort.',
      'AI-Talk turn-taking metrics for open-ended dialog drills.',
    ],
    footnote: 'Aligned to CEFR descriptors and HSK 3.0 vocabulary lists',
  },
  {
    id: 'scale',
    label: 'Scale',
    metric: '9.2B+',
    metricLabel: 'evaluations per year · 185 countries',
    body:
      'Production traffic serving ministries, test centers, and consumer apps, with 99.99% uptime SLA on enterprise plans.',
    chart: 'scale',
    subStats: [
      { value: '99.99%', label: 'Enterprise uptime SLA' },
      { value: '20 yrs', label: 'Speech-AI research' },
      { value: '14+', label: 'Granted patents' },
    ],
    bullets: [
      'Trusted by national testing centers and consumer apps.',
      'Privacy-first retention: configurable TTL, EU residency option.',
      'SOC 2 Type II controls in flight; GDPR-friendly defaults.',
    ],
    footnote: '2024 production volume · ministry, test-center and consumer deployments',
  },
];

export default function GlobalLandingPage() {
  const [installTab, setInstallTab] = useState(INSTALL_TABS[0].id);
  const [benchmark, setBenchmark] = useState(BENCHMARK_TABS[0].id);

  const activeInstall = INSTALL_TABS.find((t) => t.id === installTab) ?? INSTALL_TABS[0];
  const activeBench = BENCHMARK_TABS.find((t) => t.id === benchmark) ?? BENCHMARK_TABS[0];

  return (
    <main className="marketing-page flex-1 flex flex-col relative">
      <AmbientBackdrop />
      <TopNav />

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       * HERO — "What it does" on the left, "how to plug it in" on the right.
       * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative overflow-hidden border-b border-[#e9e2d2]/70">
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div
            className="absolute inset-0 opacity-[0.05] dark:opacity-[0.07]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(0,0,0,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.5) 1px, transparent 1px)',
              backgroundSize: '56px 56px',
              maskImage: 'radial-gradient(ellipse 70% 70% at 50% 30%, black 30%, transparent 80%)',
              WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 50% 30%, black 30%, transparent 80%)',
            }}
          />
          {/* soft colored halos */}
          <div className="absolute -top-40 left-[-8%] w-[620px] h-[620px] rounded-full blur-3xl bg-gradient-to-br from-emerald-300/30 via-sky-300/15 to-transparent" />
          <div className="absolute top-[-10%] right-[-8%] w-[680px] h-[560px] rounded-full blur-3xl bg-gradient-to-bl from-violet-300/25 via-rose-200/20 to-transparent" />
          {/* brand waveform — very subtle, drifts behind text */}
          <HeroWaveGlyph />
        </div>

        <div className="container mx-auto px-5 sm:px-7 lg:px-10 pt-8 pb-12 md:pt-10 md:pb-16 max-w-7xl 2xl:max-w-[min(100%,90rem)]">
          {/* ── two-column hero: text · ear illustration ── */}
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-14 items-center">
            {/* LEFT COLUMN */}
            <div className="lg:col-span-7">
              <FadeUp>
                <span className="inline-flex items-center gap-2 rounded-full pl-1 pr-3 py-1 text-[11px] font-medium bg-white/70 backdrop-blur-md border border-zinc-900/[0.08] text-foreground/80 mb-8 shadow-[0_4px_16px_-8px_rgba(0,0,0,0.10)]">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)] animate-pulse" />
                    live
                  </span>
                  The listening layer for voice-native agents
                </span>
              </FadeUp>

              <FadeUp delay={0.06}>
                <h1
                  className="text-crisp text-[36px] sm:text-[48px] lg:text-[56px] xl:text-[64px] leading-[1.1] mb-9"
                  style={{
                    fontWeight: 680,
                    letterSpacing: '-0.045em',
                    fontFeatureSettings: '"ss01" 1, "cv11" 1',
                  }}
                >
                  <span className="mb-5 block font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-emerald-700 sm:text-[12px]">
                    Speech &amp; pronunciation assessment MCP
                  </span>
                  {/* line 1 */}
                  <span className="block text-zinc-900">Your agent can hear them.</span>

                  {/* line 2 — heavy sans + emerald highlighter swipe on "grade" */}
                  <span
                    className="block text-zinc-900 mt-3"
                    style={{ fontWeight: 900, letterSpacing: '-0.045em' }}
                  >
                    Now it can{' '}
                    <span className="relative inline-block">
                      {/* highlighter swipe — sits behind the word */}
                      <span
                        aria-hidden
                        className="absolute pointer-events-none"
                        style={{
                          left: '-0.08em',
                          right: '-0.08em',
                          top: '54%',
                          bottom: '8%',
                          background:
                            'linear-gradient(100deg, rgba(110,231,183,0.55), rgba(52,211,153,0.72))',
                          borderRadius: '6px',
                          transform: 'skewX(-6deg)',
                          zIndex: 0,
                        }}
                      />
                      <span className="relative z-10">grade</span>
                    </span>{' '}
                    them.
                  </span>
                </h1>
              </FadeUp>

              <FadeUp delay={0.14}>
                <p className="text-[15.5px] md:text-[17px] text-muted-foreground leading-relaxed max-w-xl mb-8">
                  Chivox MCP turns raw speech into a{' '}
                  <strong className="text-foreground/90 font-semibold">dense, agent-ready payload</strong>{' '}
                  &mdash; phoneme scores, stress, tone and fluency in one MCP call, ready for any LLM.
                </p>
              </FadeUp>

              {/* CTA row — left-aligned */}
              <FadeUp delay={0.2}>
                <div className="flex flex-wrap items-center gap-4 mb-10">
                  <Link
                    href="/login"
                    className="group inline-flex items-center gap-2 h-11 pl-5 pr-2 text-sm font-semibold rounded-full bg-zinc-900 text-white hover:bg-zinc-800 transition-colors shadow-[0_8px_24px_-8px_rgba(0,0,0,0.35)]"
                  >
                    Start free
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/15 group-hover:bg-white/25 transition-colors">
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                  <Link
                    href="/demo"
                    className="group relative inline-flex items-center gap-2 h-11 pl-4 pr-2 text-sm font-semibold rounded-full border border-emerald-500/35 bg-white/70 text-emerald-800 backdrop-blur-sm shadow-[0_8px_22px_-12px_rgba(16,185,129,0.55)] hover:border-emerald-500/60 hover:bg-white hover:-translate-y-px hover:shadow-[0_12px_28px_-12px_rgba(16,185,129,0.7)] transition-all duration-200"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <span className="relative inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15">
                        <span className="absolute inset-0 rounded-full bg-emerald-500/25 animate-ping" aria-hidden />
                        <Play className="relative h-2.5 w-2.5 fill-emerald-700 text-emerald-700" strokeWidth={0} />
                      </span>
                      See it run
                    </span>
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15 group-hover:bg-emerald-500/25 group-hover:translate-x-0.5 transition-all">
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                </div>
              </FadeUp>

              {/* Compact benefit strip */}
              <FadeUp delay={0.26}>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-[12.5px] font-medium text-foreground/75">
                  {[
                    {
                      icon: Waves,
                      title: 'Deep linguistic understanding',
                      bg: 'bg-emerald-500/10',
                      fg: 'text-emerald-600',
                    },
                    {
                      icon: ShieldCheck,
                      title: 'Enterprise-ready',
                      bg: 'bg-sky-500/10',
                      fg: 'text-sky-600',
                    },
                    {
                      icon: Zap,
                      title: 'Real-time intelligence',
                      bg: 'bg-amber-500/10',
                      fg: 'text-amber-600',
                    },
                  ].map((v) => (
                    <div key={v.title} className="flex items-center gap-2">
                      <span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${v.bg}`}>
                        <v.icon className={`h-3.5 w-3.5 ${v.fg}`} />
                      </span>
                      <span>{v.title}</span>
                    </div>
                  ))}
                </div>
              </FadeUp>
            </div>

            {/* RIGHT COLUMN — custom ear illustration */}
            <FadeUp delay={0.1} className="lg:col-span-5">
              <div className="relative aspect-[420/500] w-full max-w-[min(100%,640px)] ml-auto select-none pointer-events-none">
                <HeroEarArt />
              </div>
            </FadeUp>
          </div>

          {/* Keep the visual product proof: it explains the acoustic depth faster than copy can. */}
          <FadeUp delay={0.4}>
            <div className="mt-14 md:mt-16 max-w-6xl xl:max-w-7xl mx-auto">
              <div className="flex items-center gap-4 mb-7 md:mb-8">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-foreground/12 to-foreground/15" />
                <span className="inline-flex items-center gap-2 text-[10.5px] font-mono uppercase tracking-[0.22em] text-muted-foreground whitespace-nowrap">
                  <span className="h-1 w-1 rounded-full bg-foreground/35" />
                  /product highlights
                  <span className="text-foreground/30 normal-case tracking-normal">5 frames</span>
                </span>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent via-foreground/12 to-foreground/15" />
              </div>
              <HeroCarousel />
            </div>
          </FadeUp>

        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       * ASSESSMENT LOOP — from audio input to the agent's next action
       * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="capabilities" className="relative py-16 md:py-20 border-b border-[#e9e2d2]/70 scroll-mt-24">
        <div className="container mx-auto px-6 max-w-6xl xl:max-w-7xl">
          <div className="mb-9 grid gap-7 lg:grid-cols-[0.88fr_1.12fr] lg:items-end lg:gap-10 md:mb-10">
            <FadeUp className="max-w-xl">
              <div className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-3">/the-feedback-loop</div>
              <h2 className="heading-display text-3xl md:text-4xl tracking-[-0.02em] mb-3 leading-[1.1]">
                From speech to the next best practice
              </h2>
              <p className="text-muted-foreground leading-relaxed max-w-lg">
                Chivox handles the acoustic judgment. Your LLM receives structured evidence it can explain,
                reason over and turn into the learner&rsquo;s next action.
              </p>
            </FadeUp>

            <FadeUp delay={0.05}>
              <div className="mb-2 flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.18em] text-foreground/45">
                <span className="h-px flex-1 bg-zinc-900/[0.08]" aria-hidden />
                The feedback path
              </div>
              <ol
                className="grid overflow-hidden rounded-[22px] border border-zinc-900/[0.08] bg-white/70 shadow-[0_18px_48px_-42px_rgba(15,23,42,0.55)] backdrop-blur-sm sm:grid-cols-3"
                aria-label="Chivox assessment loop"
              >
                {ASSESSMENT_LOOP.map(({ icon: Icon, label, title }, index) => (
                  <li
                    key={label}
                    className={cn(
                      'relative min-w-0 px-4 py-4 transition-colors duration-200',
                      index > 0 && 'border-t border-zinc-900/[0.07] sm:border-l sm:border-t-0',
                      index === 1 && 'bg-emerald-500/[0.035]',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-emerald-700',
                        index === 1
                          ? 'border-emerald-500/25 bg-emerald-500/[0.11]'
                          : 'border-emerald-500/18 bg-emerald-500/[0.065]',
                      )}>
                        <Icon className="h-3.5 w-3.5" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-[9.5px] font-mono uppercase tracking-[0.12em] text-emerald-700">
                        <span>{String(index + 1).padStart(2, '0')}</span>
                        <span className="opacity-35">/</span>
                        <span className="truncate">{label}</span>
                      </div>
                        <div className="mt-0.5 truncate text-[12.5px] font-semibold tracking-[-0.015em] text-zinc-950">
                          {title}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </FadeUp>
          </div>

          <StaggerContainer className="grid gap-3 md:grid-cols-2 md:gap-4">
            {CORE_CAPABILITIES.map((c) => {
              const tone = CAPABILITY_TONE[c.tone];
              return (
                <StaggerItem key={c.eyebrow}>
                  <div
                    className={`group relative glass-card h-full p-4 sm:p-5 flex flex-col sm:flex-row gap-4 overflow-hidden transition-all duration-300 hover:-translate-y-[2px] ring-1 ring-transparent ${tone.ring}`}
                  >
                    {/* colored corner glow */}
                    <div
                      aria-hidden
                      className={`pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full blur-3xl bg-gradient-to-br ${tone.glow} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                    />
                    {/* accent strip */}
                    <div
                      aria-hidden
                      className={`absolute left-0 top-6 bottom-6 w-[3px] rounded-r-full bg-gradient-to-b ${tone.accent}`}
                    />

                    {/* LEFT — editorial still */}
                    <div className="w-full max-w-[210px] self-start sm:w-[164px] sm:max-w-none sm:shrink-0 lg:w-[174px]">
                      <CapabilityVisual id={c.visual} />
                    </div>

                    {/* RIGHT — header + body + chips */}
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="mb-2 flex items-center gap-2.5">
                        <div className={`h-8 w-8 rounded-lg border ${tone.iconBg} flex items-center justify-center`}>
                          <c.icon className={`h-4 w-4 ${tone.iconColor}`} />
                        </div>
                        <span className={`text-[10.5px] font-mono tracking-wide uppercase ${tone.eyebrow}`}>
                          /{c.eyebrow}
                        </span>
                      </div>

                      <h3
                        className="mb-1.5 text-[16px] font-semibold leading-snug tracking-[-0.01em]"
                        dangerouslySetInnerHTML={{ __html: c.title }}
                      />
                      <p className="text-[12.5px] leading-relaxed text-muted-foreground">{c.body}</p>

                      <div className="mt-auto flex flex-wrap items-center gap-x-2.5 gap-y-2 border-t border-zinc-900/[0.065] pt-3">
                        <span className={`text-[8.5px] font-mono uppercase tracking-[0.14em] ${tone.eyebrow}`}>
                          {c.chipLabel}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {c.chips.map((chip) => (
                            <span
                              key={chip}
                              className="inline-flex items-center rounded-md border border-zinc-900/[0.08] bg-white/60 px-1.5 py-0.5 font-mono text-[9.5px] text-foreground/70 backdrop-blur-sm"
                            >
                              {chip}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       * PROOF — combined depth (Mandarin) + scale (research benchmarks)
       * Earn credibility before asking the reader to integrate.
       * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section
        id="proof"
        className="relative py-20 md:py-24 border-b border-[#e9e2d2]/70 warm-card-bleed scroll-mt-24"
      >
        <div className="container mx-auto px-6 max-w-6xl xl:max-w-7xl relative">
          <FadeUp className="mb-8 max-w-2xl">
            <div className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-3">
              /evidence-you-can-inspect
            </div>
            <h2 className="heading-display text-3xl md:text-[38px] tracking-[-0.02em] mb-3 leading-[1.12]">
              Acoustic depth you can inspect. Scale you can trust.
            </h2>
            <p className="text-muted-foreground leading-relaxed text-[15px]">
              Twenty years of speech-assessment R&amp;D, exposed through one stable contract. Toggle zh / en
              to inspect the same{' '}
              <span className="font-mono text-foreground/80">pron.*</span> /{' '}
              <span className="font-mono text-foreground/80">details[]</span> structure; use the benchmarks
              beside it to sanity-check Chivox against your own evaluation harness.
            </p>
          </FadeUp>

          {/* ── two-column proof grid: depth (Mandarin panel) | scale (benchmarks) ── */}
          <div className="grid lg:grid-cols-12 gap-6 items-start">
            {/* LEFT — Depth */}
            <div className="lg:col-span-7 flex flex-col gap-5">
              <FadeUp delay={0.1}>
                <BilingualScorePanel />
              </FadeUp>
            </div>

            {/* RIGHT — Scale (benchmarks) */}
            <div className="lg:col-span-5">
              <FadeUp delay={0.12}>
                <div className="overflow-hidden rounded-2xl border border-border/60 bg-background">
                  <div
                    className="grid grid-cols-4 gap-1 border-b border-border/60 bg-zinc-950/[0.018] p-1.5"
                    role="tablist"
                    aria-label="Benchmark metrics"
                  >
                    {BENCHMARK_TABS.map((t, index) => (
                      <button
                        key={t.id}
                        type="button"
                        role="tab"
                        aria-selected={t.id === benchmark}
                        onClick={() => setBenchmark(t.id)}
                        className={`group flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-lg px-1.5 text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35 ${
                          t.id === benchmark
                            ? 'bg-white text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.08)] ring-1 ring-zinc-900/[0.055]'
                            : 'text-muted-foreground hover:bg-white/65 hover:text-foreground'
                        }`}
                      >
                        <span
                          className={`hidden font-mono text-[9px] tabular-nums sm:inline ${
                            t.id === benchmark ? 'text-emerald-700' : 'text-muted-foreground/55'
                          }`}
                        >
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="whitespace-nowrap text-[10.5px] font-medium tracking-[-0.01em] sm:text-[11.5px]">
                          {t.label}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="p-6 md:p-7">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="min-w-0">
                      <div className="text-4xl md:text-5xl heading-display tracking-[-0.03em] leading-none mb-2">
                        {activeBench.metric}
                      </div>
                      <div className="text-[12.5px] text-muted-foreground">{activeBench.metricLabel}</div>
                    </div>
                    <BenchmarkMicroChart id={activeBench.chart} />
                  </div>

                  <p className="text-[13.5px] text-foreground/85 leading-relaxed">
                    {activeBench.body}
                  </p>

                  {/* sub-stats row — three small tiles */}
                  <div className="mt-5 grid grid-cols-3 gap-2.5">
                    {activeBench.subStats.map((s) => (
                      <div
                        key={s.label}
                        className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5"
                      >
                        <div className="text-[15px] font-semibold tracking-[-0.01em] tabular-nums leading-tight">
                          {s.value}
                        </div>
                        <div className="mt-1 text-[10.5px] text-muted-foreground leading-snug">
                          {s.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* proof bullets */}
                  <ul className="mt-5 space-y-2">
                    {activeBench.bullets.map((b) => (
                      <li
                        key={b}
                        className="flex items-start gap-2 text-[12.5px] text-foreground/85 leading-relaxed"
                      >
                        <Check className="h-3.5 w-3.5 mt-[3px] text-emerald-600 shrink-0" strokeWidth={3} />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>

                  {/* footnote — source / verification line */}
                  <div className="mt-5 pt-4 border-t border-border/60 flex items-start gap-2 text-[11px] text-muted-foreground leading-relaxed">
                    <span className="mt-[3px] inline-block h-1.5 w-1.5 rounded-full bg-emerald-500/60 shrink-0" />
                    <span>{activeBench.footnote}</span>
                  </div>
                  </div>
                </div>
              </FadeUp>
            </div>
          </div>

          {/* Scale + trust proof points live in the hero carousel now. */}
        </div>
      </section>

      {/* QUICKSTART — after value and proof, show the shortest path to a first result. */}
      <section id="quickstart" className="relative py-16 md:py-20 border-b border-[#e9e2d2]/70 scroll-mt-24">
        <div className="container mx-auto px-6 max-w-6xl xl:max-w-7xl">
          <FadeUp className="mb-10 text-center">
            <div className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-3">/quickstart</div>
            <h2 className="heading-display text-3xl md:text-4xl tracking-[-0.02em] mb-3">
              Get the first structured score in 3 steps
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Paste the config, connect Chivox, then call one assessment tool from your agent loop.
            </p>
            <div className="mt-4 flex items-center justify-center">
              <Link
                href="/docs#quickstart"
                className="group inline-flex items-center gap-1.5 text-[13px] font-medium text-emerald-800 hover:text-emerald-900 transition-colors"
              >
                Full docs &amp; API reference
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </FadeUp>

          <QuickstartDemo
            key={installTab}
            installTab={installTab}
            setInstallTab={setInstallTab}
            activeInstall={activeInstall}
          />
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       * ASSESSMENT SUITE — 1:1 with Products nav
       * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="use-cases" className="relative py-20 md:py-24 border-b border-[#e9e2d2]/70 scroll-mt-24">
        <div className="container mx-auto px-6 max-w-6xl xl:max-w-7xl">
          <FadeUp className="mb-12 max-w-2xl">
            <div className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-3">/product paths</div>
            <h2 className="heading-display text-3xl md:text-4xl tracking-[-0.02em] mb-3">
              Start with the learner you are building for
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              English, Mandarin and Kids share one MCP contract, while each product path gives your agent the
              language and learner context it needs.
            </p>
          </FadeUp>

          <StaggerContainer className="grid md:grid-cols-3 gap-4">
            {USE_CASES.map((u) => (
              <StaggerItem key={u.tag}>
                <Link
                  href={u.href}
                  aria-label={`Explore ${u.tag}`}
                  className="group rounded-2xl border border-zinc-900/[0.08] bg-white/80 backdrop-blur-sm overflow-hidden h-full flex flex-col hover:border-emerald-500/35 hover:-translate-y-[2px] hover:shadow-[0_12px_40px_-16px_rgba(0,0,0,0.12)] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-3"
                >
                  <div className="relative aspect-[16/10] w-full border-b border-zinc-900/[0.06] overflow-hidden">
                    <UseCaseArtwork id={u.art} />
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground mb-2">
                      {u.tag}
                    </div>
                    <h3
                      className="text-[15px] font-semibold tracking-[-0.01em] mb-2 leading-snug"
                      dangerouslySetInnerHTML={{ __html: u.title }}
                    />
                    <p
                      className="text-[13px] text-muted-foreground leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: u.body }}
                    />
                    <span className="mt-5 inline-flex items-center gap-1.5 text-[12px] font-semibold text-emerald-800">
                      Explore product
                      <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      <PricingUsageStory />

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       * CTA — visually merged into ContactSection below (no border, slim padding).
       * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative pt-14 md:pt-20 pb-0">
        <div className="container mx-auto px-6 max-w-6xl xl:max-w-7xl">
          <div className="warm-card px-8 py-16 md:px-14 md:py-20 text-center">
            <div className="text-[11px] font-mono tracking-[0.22em] uppercase text-emerald-700 mb-3">
              Ready to wire it up?
            </div>
            <h2 className="heading-display text-3xl md:text-[44px] tracking-[-0.025em] mb-4 leading-[1.1]">
              Same payload. Your agent. Your production loop.
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4 text-base md:text-[17px] max-w-2xl mx-auto">
              Drop Chivox MCP into Cursor, Claude Desktop, or any agent SDK. One{' '}
              <code className="font-mono text-[13px] px-1.5 py-0.5 rounded bg-zinc-900/[0.06] text-foreground/90">
                npx
              </code>{' '}
              and you&rsquo;re reading the same JSON you just saw above.
            </p>
            <p className="text-[13px] text-muted-foreground/85 mb-8 max-w-2xl mx-auto font-mono tracking-tight">
              Free trial &middot; spend caps &middot; low-balance alerts &middot; zero audio retention
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
              <a
                href="#quickstart"
                className="inline-flex items-center justify-center h-11 px-6 text-sm font-semibold rounded-full gap-2 bg-zinc-900 text-white shadow-[0_10px_24px_-10px_rgba(0,0,0,0.45)] hover:-translate-y-[2px] transition-all duration-200"
              >
                <Terminal className="h-4 w-4 opacity-80" />
                See quickstart
              </a>
              <Link
                href="/docs"
                className="inline-flex items-center justify-center h-11 px-6 text-sm font-semibold rounded-full gap-2 border border-emerald-500/35 bg-white/75 text-emerald-800 backdrop-blur-sm hover:border-emerald-500/60 hover:bg-white hover:-translate-y-[2px] transition-all duration-200 shadow-[0_8px_22px_-12px_rgba(16,185,129,0.55)]"
              >
                <BookOpen className="h-4 w-4" />
                Read the docs
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center h-11 px-6 text-sm font-semibold rounded-full gap-1.5 border border-zinc-900/15 bg-white/70 backdrop-blur-sm hover:border-zinc-900/40 hover:bg-white transition-all duration-200"
              >
                Get your API key
                <ArrowUpRight className="h-4 w-4 opacity-60" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

const PRICING_PACKAGE_COPY = {
  standard: {
    label: 'Standard',
    blurb: 'For evaluation and light product usage.',
    bonus: 'No bonus',
    tone: 'text-blue-700',
    border: 'border-blue-600',
    badge: 'border-blue-200 bg-blue-50 text-blue-700',
  },
  advanced: {
    label: 'Advanced',
    blurb: 'Best value for growing products.',
    bonus: '+10% bonus',
    tone: 'text-emerald-700',
    border: 'border-emerald-600',
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  flagship: {
    label: 'Flagship',
    blurb: 'Lowest unit cost for production volume.',
    bonus: '+20% bonus',
    tone: 'text-amber-700',
    border: 'border-amber-600',
    badge: 'border-amber-200 bg-amber-50 text-amber-700',
  },
} as const;

function formatPackagePrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function PricingUsageStory() {
  const [compareOpen, setCompareOpen] = useState(false);
  const compareTriggerRef = useRef<HTMLButtonElement>(null);

  const pricingFacts = [
    { icon: Check, label: 'Successful evaluations only' },
    { icon: KeyRound, label: 'Shared across every API key' },
    { icon: CalendarDays, label: `Points stay valid for ${TRIAL_VALID_DAYS} days` },
  ];

  useEffect(() => {
    if (!compareOpen) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const trigger = compareTriggerRef.current;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setCompareOpen(false);
    };

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.removeEventListener('keydown', closeOnEscape);
      trigger?.focus();
    };
  }, [compareOpen]);

  return (
    <section
      id="pricing"
      className="relative scroll-mt-24 border-b border-[#e9e2d2]/70 py-16 md:py-24"
    >
      <div className="container mx-auto max-w-[1440px] px-6">
        <div className="grid min-w-0 gap-12 lg:grid-cols-[minmax(0,0.82fr)_minmax(560px,1.18fr)] lg:items-start lg:gap-20 xl:gap-24">
          <FadeUp className="min-w-0 lg:pt-8">
            <div className="mb-5 flex items-center gap-3">
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/[0.07] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-800">
                Pricing
              </span>
              <span className="text-[12px] font-medium text-foreground/60">Pay for results</span>
            </div>

            <h2 className="heading-display text-crisp max-w-[11ch] text-[36px] leading-[1.04] tracking-[-0.04em] md:text-[43px] xl:text-[46px]">
              Simple points for successful speech evaluations.
            </h2>

            <p className="mt-6 max-w-[34rem] text-[15px] leading-7 text-zinc-600 md:text-[16px]">
              One point for a word or sentence. Two for a paragraph. Failed calls use zero points,
              so you only pay when Chivox returns an assessment.
            </p>

            <ul className="mt-8 grid max-w-[34rem] overflow-hidden rounded-2xl border border-zinc-900/[0.08] bg-white/75 shadow-[0_12px_32px_-28px_rgba(15,23,42,0.5)] sm:grid-cols-3">
              {pricingFacts.map(({ icon: Icon, label }, index) => (
                <li
                  key={label}
                  className={cn(
                    'flex min-w-0 items-start gap-2.5 px-3.5 py-3 text-[11px] font-medium leading-snug text-zinc-700',
                    index > 0 && 'border-t border-zinc-900/[0.07] sm:border-l sm:border-t-0',
                  )}
                >
                  <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-700" strokeWidth={2.25} />
                  <span>{label}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="group inline-flex h-11 items-center gap-2 rounded-full bg-zinc-900 pl-5 pr-3 text-sm font-semibold text-white shadow-[0_8px_24px_-10px_rgba(0,0,0,0.4)] transition-all hover:-translate-y-px hover:bg-zinc-800"
              >
                Start with {TRIAL_CALLS} free points
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/15 transition-colors group-hover:bg-white/25">
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
              <button
                ref={compareTriggerRef}
                type="button"
                onClick={() => setCompareOpen(true)}
                aria-haspopup="dialog"
                aria-expanded={compareOpen}
                aria-controls="pricing-compare-dialog"
                className="group inline-flex h-11 items-center gap-2 rounded-full border border-zinc-900/[0.1] bg-white/70 px-4 text-sm font-semibold text-zinc-800 shadow-sm transition-all hover:-translate-y-px hover:border-emerald-700/25 hover:bg-white hover:text-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35"
              >
                Compare packages
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </FadeUp>

          <FadeUp delay={0.08} className="min-w-0">
            <div
              aria-labelledby="points-work-title"
              className="overflow-hidden rounded-[30px] border border-zinc-900/[0.09] bg-white/88 p-6 shadow-[0_30px_80px_-52px_rgba(15,23,42,0.48)] backdrop-blur-md sm:p-8 lg:p-9"
            >
              <div className="flex flex-col gap-4 border-b border-zinc-900/[0.08] pb-6 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-700">How points work</div>
                  <h3 id="points-work-title" className="mt-3 text-[25px] font-semibold tracking-[-0.04em] text-zinc-950 sm:text-[29px]">
                    From free trial to production
                  </h3>
                </div>
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-500/[0.08] px-3.5 py-2 text-[11px] font-semibold text-emerald-800">
                  <Sparkles className="h-4 w-4" /> No card required
                </span>
              </div>

              <ol className="mt-6 space-y-3">
                <li className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.035] px-4 py-4 sm:grid-cols-[48px_minmax(0,1fr)_auto] sm:px-5">
                  <PricingStepNumber value="1" />
                  <div>
                    <h4 className="text-[16px] font-semibold tracking-[-0.02em] text-zinc-900">Start free</h4>
                    <p className="mt-1 text-[13px] text-zinc-500">Valid for {TRIAL_VALID_DAYS} days</p>
                  </div>
                  <strong className="text-[26px] font-semibold tabular-nums tracking-[-0.04em] text-emerald-700 sm:text-[30px]">{TRIAL_CALLS} pts</strong>
                </li>

                <li className="grid grid-cols-[44px_minmax(0,1fr)] gap-4 rounded-2xl border border-zinc-900/[0.08] bg-white/60 px-4 py-4 sm:grid-cols-[48px_minmax(0,1fr)] sm:px-5">
                  <PricingStepNumber value="2" />
                  <div className="min-w-0">
                    <h4 className="text-[16px] font-semibold tracking-[-0.02em] text-zinc-900">Evaluate successfully</h4>
                    <p className="mt-1 text-[13px] leading-relaxed text-zinc-500">Points are deducted only when an assessment returns.</p>
                    <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                      <PricingCodeRow code="word · sentence" points="−1 pt" />
                      <PricingCodeRow code="paragraph" points="−2 pts" />
                    </div>
                  </div>
                </li>

                <li className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border border-zinc-900/[0.08] bg-zinc-50/65 px-4 py-4 sm:grid-cols-[48px_minmax(0,1fr)_auto] sm:px-5">
                  <PricingStepNumber value="3" />
                  <div>
                    <h4 className="text-[16px] font-semibold tracking-[-0.02em] text-zinc-900">Top up as you grow</h4>
                    <p className="mt-1 text-[13px] text-zinc-500">Higher packs lower your unit cost.</p>
                  </div>
                  <strong className="inline-flex items-center gap-2 text-[26px] font-semibold tracking-[-0.04em] text-emerald-700 sm:text-[30px]"><Gift className="h-6 w-6" />+20%</strong>
                </li>
              </ol>

              <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.045] px-5 py-3.5 text-[13px] font-medium text-emerald-900">
                Failed calls cost $0 and use 0 points.
              </div>
            </div>
          </FadeUp>
        </div>

      </div>
      {compareOpen ? <PricingCompareModal onClose={() => setCompareOpen(false)} /> : null}
    </section>
  );
}

/** Shared product surface — same on every pack. Full matrix opens in the modal. */
const PRICING_PACK_INCLUDES = [
  'Exam-grade Mandarin & English scoring',
  'Phoneme-level diagnosis',
  'Pronunciation correction feedback',
  'Word · sentence · paragraph granularity',
  'Real-time streaming',
  'LLM-ready MCP JSON',
] as const;

const PRICING_COMPARE_COLUMNS: {
  id: ComparePackageId;
  label: string;
  price: string;
  tone: string;
  header: string;
}[] = [
  {
    id: 'free',
    label: 'Free',
    price: '$0',
    tone: 'text-sky-700',
    header: 'bg-zinc-800 text-white',
  },
  {
    id: 'standard',
    label: 'Standard',
    price: `from ${formatPackagePrice(FIXED_TOPUP_PLANS[0].amountCents)}`,
    tone: 'text-blue-700',
    header: 'bg-zinc-800 text-white',
  },
  {
    id: 'advanced',
    label: 'Advanced',
    price: `from ${formatPackagePrice(FIXED_TOPUP_PLANS[1].amountCents)}`,
    tone: 'text-emerald-700',
    header: 'bg-emerald-700 text-white',
  },
  {
    id: 'flagship',
    label: 'Flagship',
    price: `from ${formatPackagePrice(FIXED_TOPUP_PLANS[2].amountCents)}`,
    tone: 'text-amber-700',
    header: 'bg-zinc-800 text-white',
  },
];

const COMPARABLE_SENTENCE_EVAL_DOLLARS = 0.0051;
const MAX_SENTENCE_EVAL_SAVINGS_PCT = Math.round(
  (1 - EVALUATION_UNIT_PRICES.flagship.wordSentenceDollars / COMPARABLE_SENTENCE_EVAL_DOLLARS) * 100,
);

function pricingColumnValue(
  packageId: ComparePackageId,
  kind: 'bonus' | 'pointsPerUsd' | 'word' | 'paragraph',
): { text: string; badge?: string } {
  if (packageId === 'free') {
    if (kind === 'bonus') return { text: TRIAL_CALLS.toLocaleString('en-US') };
    if (kind === 'pointsPerUsd') return { text: '—' };
    if (kind === 'word') return { text: `${WORD_SENTENCE_POINTS_PER_USE} pt / use` };
    return { text: `${PARAGRAPH_POINTS_PER_USE} pts / use` };
  }

  const plan = FIXED_TOPUP_PLANS.find((item) => item.id === packageId) ?? FIXED_TOPUP_PLANS[0];
  const tier = TOPUP_BONUS_TIERS.find((item) => item.id === packageId) ?? TOPUP_BONUS_TIERS[0];
  const details = buildTopupPointDetails(plan.amountCents, tier);
  const rates = getEvaluationUnitPrices(packageId);
  const base = EVALUATION_UNIT_PRICES.standard;

  if (kind === 'bonus') {
    return {
      text: plan.bonusPct > 0 ? formatBonusPercent(plan.bonusPct) : '0% · base',
    };
  }
  if (kind === 'pointsPerUsd') return { text: details.pointsPerUsd };
  if (kind === 'word') {
    const save = Math.round((1 - rates.wordSentenceDollars / base.wordSentenceDollars) * 100);
    return {
      text: `${formatEvaluationUnitDollars(rates.wordSentenceDollars)} / use`,
      badge: save > 0 ? `Save ${save}%` : undefined,
    };
  }
  const save = Math.round((1 - rates.paragraphDollars / base.paragraphDollars) * 100);
  return {
    text: `${formatEvaluationUnitDollars(rates.paragraphDollars)} / use`,
    badge: save > 0 ? `Save ${save}%` : undefined,
  };
}

function PricingPackIncludes() {
  const [open, setOpen] = useState(false);
  const preview = PRICING_PACK_INCLUDES.slice(0, 2);

  useEffect(() => {
    if (!open) return;

    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    // Keep wheel/trackpad on the backdrop from scrolling the page underneath.
    const onWheel = (e: WheelEvent) => {
      const scroller = document.getElementById('pricing-compare-scroll');
      if (scroller && scroller.contains(e.target as Node)) return;
      e.preventDefault();
    };
    const onTouchMove = (e: TouchEvent) => {
      const scroller = document.getElementById('pricing-compare-scroll');
      if (scroller && scroller.contains(e.target as Node)) return;
      e.preventDefault();
    };

    window.addEventListener('keydown', onKey);
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });

    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, [open]);

  return (
    <div className="mt-8 min-w-0 border-t border-zinc-900/[0.07] pt-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-800/80">
            Included on every pack
          </p>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            Lower published unit cost as you scale — only price and bonus change.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold text-emerald-800 hover:text-emerald-950"
        >
          View more
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      <ul className="mt-4 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
        {preview.map((label) => (
          <li key={label} className="flex min-w-0 items-center gap-2.5">
            <Check className="h-3.5 w-3.5 shrink-0 text-emerald-700" strokeWidth={2.5} />
            <span className="truncate text-[12.5px] font-medium text-foreground/80">{label}</span>
          </li>
        ))}
      </ul>

      {open ? <PricingCompareModal onClose={() => setOpen(false)} /> : null}
    </div>
  );
}

function PricingCompareModal({ onClose }: { onClose: () => void }) {
  return createPortal(
    <div className="fixed inset-0 z-[100] overscroll-none">
      <button
        type="button"
        aria-label="Close comparison"
        onClick={onClose}
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
      />

      <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-6">
        <div
          id="pricing-compare-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pricing-compare-title"
          className="relative flex max-h-[min(90dvh,820px)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-zinc-900/10 bg-[#fbfaf6] shadow-[0_28px_90px_-28px_rgba(0,0,0,0.5)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-zinc-900/[0.07] px-4 py-4 sm:px-6">
            <div className="min-w-0">
              <h3
                id="pricing-compare-title"
                className="text-[16px] font-semibold tracking-[-0.02em] text-foreground sm:text-[17px]"
              >
                Compare packages
              </h3>
              <p className="mt-1 text-[12.5px] text-muted-foreground">
                Start free with {TRIAL_CALLS} points, or top up for more volume and lower published
                unit prices.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              autoFocus
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-zinc-900/10 bg-white/80 text-foreground/70 transition-colors hover:bg-white hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>

          <div
            id="pricing-compare-scroll"
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-5 sm:py-4"
          >
            <PricingCompareMatrix />
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-zinc-900/[0.07] px-4 py-3 sm:px-6">
            <p className="max-w-xl text-[11px] leading-relaxed text-muted-foreground">
              Only successful evaluations deduct points · valid {TRIAL_VALID_DAYS} days · shared
              across API keys.
            </p>
            <Link
              href="/pricing"
              className="group inline-flex items-center gap-1 text-[12px] font-semibold text-emerald-800 hover:text-emerald-950"
            >
              Full pricing details
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function PricingCompareMatrix() {
  const valueRows: {
    key: string;
    label: string;
    sub?: string;
    kind: 'bonus' | 'pointsPerUsd' | 'word' | 'paragraph';
  }[] = [
    { key: 'bonus', label: 'Bonus evaluation points', kind: 'bonus' },
    { key: 'ppu', label: 'Points per $1', kind: 'pointsPerUsd' },
    {
      key: 'word',
      label: 'Word / phrase / sentence',
      sub: 'Published reference price',
      kind: 'word',
    },
    {
      key: 'paragraph',
      label: 'Paragraph evaluation',
      sub: 'Published reference price',
      kind: 'paragraph',
    },
  ];

  const capabilityRows = [
    {
      label: 'Exam-grade scoring',
      sub: 'Same engine used in high-stakes speaking exams',
    },
    {
      label: 'Chinese scoring engine',
      sub: 'Mandarin · pinyin · tone · character / sentence / paragraph',
    },
    {
      label: 'English scoring engine',
      sub: 'American / British accent · word / sentence / paragraph',
    },
    {
      label: 'Evaluation granularity',
      sub: 'Phoneme · word · sentence · paragraph / passage',
    },
    {
      label: 'Scoring dimensions',
      sub: 'Overall · accuracy · fluency · integrity · stress · intonation',
    },
    {
      label: 'Phoneme-level diagnosis',
      sub: 'Pinpoints pronunciation issues down to each phoneme',
    },
    {
      label: 'Pronunciation correction',
      sub: 'Actionable feedback for words and sentences',
    },
    {
      label: 'Phonics evaluation',
      sub: 'Letter-sound mapping for English learners',
    },
    {
      label: 'Real-time streaming',
      sub: 'WebSocket session for live reading assessment',
    },
    {
      label: 'LLM-ready structured output',
      sub: 'MCP payload ready for diagnosis-to-practice loops',
    },
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-900/[0.08] bg-white/70">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead className="sticky top-0 z-20">
          <tr>
            <th className="sticky left-0 z-30 bg-zinc-900 px-3 py-3 text-[11px] font-semibold text-white sm:px-4">
              <div>Feature</div>
              <div className="mt-0.5 text-[10px] font-normal text-zinc-400">Min. top-up</div>
            </th>
            {PRICING_COMPARE_COLUMNS.map((col) => (
              <th
                key={col.id}
                className={cn('px-2.5 py-3 text-center sm:px-3', col.header)}
              >
                <div className="text-[12px] font-semibold sm:text-[13px]">{col.label}</div>
                <div className="mt-0.5 text-[10px] font-normal opacity-80">{col.price}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {valueRows.slice(0, 2).map((row) => (
            <tr key={row.key} className="border-b border-zinc-900/[0.06]">
              <td className="sticky left-0 z-10 bg-[#fbfaf6] px-3 py-2.5 sm:px-4">
                <div className="text-[12px] font-medium text-foreground/85">{row.label}</div>
              </td>
              {PRICING_COMPARE_COLUMNS.map((col) => {
                const value = pricingColumnValue(col.id, row.kind);
                return (
                  <td
                    key={`${row.key}-${col.id}`}
                    className={cn(
                      'px-2.5 py-2.5 text-center sm:px-3',
                      col.id === 'advanced' && 'bg-emerald-500/[0.04]',
                    )}
                  >
                    <span className="text-[12px] font-semibold tabular-nums text-foreground/85">
                      {value.text}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}

          <tr>
            <td
              colSpan={PRICING_COMPARE_COLUMNS.length + 1}
              className="bg-emerald-500/[0.08] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-800 sm:px-4"
            >
              Published reference prices
            </td>
          </tr>

          {valueRows.slice(2).map((row) => (
            <tr key={row.key} className="border-b border-zinc-900/[0.06]">
              <td className="sticky left-0 z-10 bg-[#fbfaf6] px-3 py-2.5 sm:px-4">
                <div className="text-[12px] font-medium text-foreground/85">{row.label}</div>
                {row.sub ? (
                  <div className="mt-0.5 text-[10.5px] text-muted-foreground">{row.sub}</div>
                ) : null}
              </td>
              {PRICING_COMPARE_COLUMNS.map((col) => {
                const value = pricingColumnValue(col.id, row.kind);
                return (
                  <td
                    key={`${row.key}-${col.id}`}
                    className={cn(
                      'px-2.5 py-2.5 text-center sm:px-3',
                      col.id === 'advanced' && 'bg-emerald-500/[0.04]',
                    )}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[12px] font-semibold tabular-nums text-emerald-800">
                        {value.text}
                      </span>
                      {value.badge ? (
                        <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-amber-800">
                          {value.badge}
                        </span>
                      ) : null}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}

          <tr className="border-b border-zinc-900/[0.06]">
            <td className="sticky left-0 z-10 bg-[#fbfaf6] px-3 py-2.5 sm:px-4">
              <div className="text-[12px] font-medium text-foreground/85">Sentence price advantage</div>
              <div className="mt-0.5 text-[10.5px] font-medium text-emerald-700">
                Up to {MAX_SENTENCE_EVAL_SAVINGS_PCT}% lower than similar products
              </div>
            </td>
            {PRICING_COMPARE_COLUMNS.map((col) => (
              <td
                key={`adv-${col.id}`}
                className={cn(
                  'px-2.5 py-2.5 text-center sm:px-3',
                  col.id === 'advanced' && 'bg-emerald-500/[0.04]',
                )}
              >
                <div className="flex flex-col items-center gap-1">
                  <Check className="h-4 w-4 text-sky-600" strokeWidth={2.5} />
                  <span className="rounded-full bg-sky-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-sky-800">
                    −{MAX_SENTENCE_EVAL_SAVINGS_PCT}%
                  </span>
                </div>
              </td>
            ))}
          </tr>

          <tr>
            <td
              colSpan={PRICING_COMPARE_COLUMNS.length + 1}
              className="bg-zinc-500/[0.07] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-600 sm:px-4"
            >
              Shared evaluation capabilities
            </td>
          </tr>

          {capabilityRows.map((row, index) => (
            <tr
              key={row.label}
              className={cn(
                index < capabilityRows.length - 1 && 'border-b border-zinc-900/[0.05]',
              )}
            >
              <td className="sticky left-0 z-10 bg-[#fbfaf6] px-3 py-2.5 sm:px-4">
                <div className="text-[12px] font-medium text-foreground/85">{row.label}</div>
                <div className="mt-0.5 text-[10.5px] text-muted-foreground">{row.sub}</div>
              </td>
              {PRICING_COMPARE_COLUMNS.map((col) => (
                <td
                  key={`${row.label}-${col.id}`}
                  className={cn(
                    'px-2.5 py-2.5 text-center sm:px-3',
                    col.id === 'advanced' && 'bg-emerald-500/[0.04]',
                  )}
                >
                  <Check className="mx-auto h-4 w-4 text-sky-600" strokeWidth={2.5} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PricingStepNumber({ value }: { value: string }) {
  return (
    <span className="relative z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-emerald-500/25 bg-[#fbfaf6] text-[15px] font-semibold text-emerald-800 ring-4 ring-emerald-500/[0.055] sm:h-11 sm:w-11">
      {value}
    </span>
  );
}

function PricingCodeRow({ code, points }: { code: string; points: string }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-zinc-900/[0.08] bg-zinc-50/75 px-3.5 py-3">
      <code className="min-w-0 whitespace-nowrap font-mono text-[10.5px] text-foreground/70 sm:text-[11px]">{code}</code>
      <span className="inline-flex shrink-0 items-center gap-1.5 text-[12.5px] font-semibold tabular-nums text-emerald-700">
        <Check className="h-3.5 w-3.5" strokeWidth={2.75} />
        {points}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
 *  VISUAL COMPONENTS (drawn inline so no extra assets are needed)
 * ═══════════════════════════════════════════════════════════ */

/* ── Quickstart demo — types config, boots server, runs tool ─
 * A single looping timeline that makes integration feel live:
 *   phase 0  →  JSON config is typed into the editor
 *   phase 1  →  `npx -y @chivox/mcp` boots, ✓ connected
 *   phase 2  →  LLM issues assess_speech(...) tool call
 *   phase 3  →  server streams structured scores back
 * Left-side step cards highlight in sync with the current phase so
 * the eye tracks "what's happening" without reading a single word.
 * ────────────────────────────────────────────────────────── */
type InstallTab = { id: string; label: string; filename: string; code: string };
function QuickstartDemo({
  installTab,
  setInstallTab,
  activeInstall,
}: {
  installTab: string;
  setInstallTab: (v: string) => void;
  activeInstall: InstallTab;
}) {
  const [phase, setPhase] = useState(0);
  const [typed, setTyped] = useState(0);
  const [responseChars, setResponseChars] = useState(0);
  const [copied, setCopied] = useState(false);
  const [hoverStep, setHoverStep] = useState<number | null>(null);
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    prefersReducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const code = activeInstall.code;

  const RESPONSE = useMemo(() => SAMPLE_MCP_RICH_JSON, []);

  /* timeline driver */
  useEffect(() => {
    if (prefersReducedMotion.current) {
      setTyped(code.length);
      setResponseChars(RESPONSE.length);
      setPhase(3);
      return;
    }

    // pause auto-advance while a step is being hovered/focused
    if (hoverStep !== null) return;

    let cancelled = false;

    if (phase === 0) {
      // type config char-by-char
      if (typed >= code.length) {
        const t = setTimeout(() => !cancelled && setPhase(1), 500);
        return () => {
          cancelled = true;
          clearTimeout(t);
        };
      }
      const t = setTimeout(() => {
        if (!cancelled) setTyped((n) => Math.min(code.length, n + (code[n] === '\n' ? 1 : 2)));
      }, 18);
      return () => {
        cancelled = true;
        clearTimeout(t);
      };
    }

    if (phase === 1) {
      const t = setTimeout(() => !cancelled && setPhase(2), 1100);
      return () => {
        cancelled = true;
        clearTimeout(t);
      };
    }

    if (phase === 2) {
      const t = setTimeout(() => !cancelled && setPhase(3), 900);
      return () => {
        cancelled = true;
        clearTimeout(t);
      };
    }

    if (phase === 3) {
      if (responseChars >= RESPONSE.length) {
        // loop
        const t = setTimeout(() => {
          if (cancelled) return;
          setTyped(0);
          setResponseChars(0);
          setPhase(0);
        }, 2600);
        return () => {
          cancelled = true;
          clearTimeout(t);
        };
      }
      const t = setTimeout(() => {
        if (!cancelled) setResponseChars((n) => Math.min(RESPONSE.length, n + 5));
      }, 12);
      return () => {
        cancelled = true;
        clearTimeout(t);
      };
    }
  }, [phase, typed, responseChars, code, RESPONSE, hoverStep]);

  /* ── derive a "display snapshot" ──────────────────────────────
   * When the user hovers/focuses a step card on the left, force
   * the right panel to render that step's canonical state instead
   * of whatever the auto-advance is currently on. On leave, the
   * live state is restored untouched (no jarring rewind).
   * ─────────────────────────────────────────────────────────── */
  const snapshot = (() => {
    if (hoverStep === 0) {
      // "Grab an API key" — the terminal hasn't been spun up yet. Preview
      // the full config you'll paste once you have the key. phase = -1 hides
      // every terminal line (no forever-spinning boot spinner).
      return { phase: -1, typed: code.length, responseChars: 0, activeStep: 0 };
    }
    if (hoverStep === 1) {
      return { phase: 1, typed: code.length, responseChars: 0, activeStep: 1 };
    }
    if (hoverStep === 2) {
      return { phase: 3, typed: code.length, responseChars: RESPONSE.length, activeStep: 2 };
    }
    return {
      phase,
      typed,
      responseChars,
      activeStep: phase === 0 ? 1 : phase >= 2 ? 2 : 1,
    };
  })();

  const dPhase = snapshot.phase;
  const dTyped = snapshot.typed;
  const dResponseChars = snapshot.responseChars;
  const activeStep = snapshot.activeStep;

  const steps = [
    {
      n: '01',
      title: 'Grab an API key',
      body: 'Sign up, confirm your email, copy the key. Free trial credits included.',
      cta: { label: 'Get a key', href: '/en/register' },
      done: true,
    },
    {
      n: '02',
      title: 'Add one block to your MCP config',
      body: 'Paste the snippet into Cursor, Claude Desktop, or your custom agent — pick a tab on the right.',
      done: dPhase >= 1,
    },
    {
      n: '03',
      title: 'Call a tool from your LLM',
      body: 'Hand your model the audio. It gets back nested JSON: pron sub-scores, fluency + WPM, audio SNR, and details[] with ms ranges, stress, liaison and per-phoneme rows.',
      cta: { label: 'API reference', href: '/docs' },
      done: dPhase >= 3 && dResponseChars >= RESPONSE.length,
    },
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* noop */
    }
  };

  return (
    <div className="grid lg:grid-cols-12 gap-6 items-stretch">
      {/* ─── LEFT: steps, live-highlighted ─── */}
      <div className="lg:col-span-5 flex flex-col gap-3">
        {steps.map((s, i) => {
          const active = i === activeStep && !s.done;
          const isHovered = hoverStep === i;
          return (
            <div
              key={s.n}
              onMouseEnter={() => setHoverStep(i)}
              onMouseLeave={() => setHoverStep(null)}
              onFocus={() => setHoverStep(i)}
              onBlur={() => setHoverStep(null)}
              tabIndex={0}
              role="button"
              aria-label={`Preview step ${s.n}: ${s.title}`}
              className={`group relative rounded-xl border bg-background p-5 flex gap-4 transition-all duration-300 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 hover:-translate-y-px hover:border-emerald-400/60 hover:shadow-[0_10px_30px_-18px_rgba(16,185,129,0.55)] ${
                isHovered
                  ? 'border-emerald-400/80 shadow-[0_0_0_3px_rgba(16,185,129,0.10)]'
                  : active
                  ? 'border-emerald-400/70 shadow-[0_0_0_3px_rgba(16,185,129,0.08)]'
                  : s.done
                  ? 'border-border/60'
                  : 'border-border/60'
              }`}
            >
              {/* pulsing rail on the active step */}
              {active && (
                <span className="pointer-events-none absolute -left-px top-3 bottom-3 w-[2px] rounded-full bg-emerald-400/80 animate-pulse" />
              )}
              <div
                className={`shrink-0 h-10 w-10 rounded-lg flex items-center justify-center font-mono text-sm font-semibold transition-colors ${
                  s.done
                    ? 'bg-emerald-500 text-white'
                    : active
                    ? 'bg-foreground text-background'
                    : 'bg-foreground/90 text-background'
                }`}
              >
                {s.done ? <Check className="h-4 w-4" strokeWidth={3} /> : s.n}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold tracking-[-0.01em] mb-1 flex items-center gap-2">
                  {s.title}
                  {active && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-1.5 py-0.5 text-[9.5px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                      running
                    </span>
                  )}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
                {s.cta ? (
                  <Link
                    href={s.cta.href}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-foreground hover:underline underline-offset-4"
                  >
                    {s.cta.label} <ArrowUpRight className="h-3 w-3" />
                  </Link>
                ) : null}
              </div>
            </div>
          );
        })}

        {/* ─── Interactive demo CTA — routes to /demo (Western-dev showcase) ─── */}
        <Link
          href="/demo"
          className="group relative mt-2 rounded-2xl overflow-hidden text-left transition-all hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 shadow-[0_18px_50px_-24px_rgba(16,185,129,0.55)] hover:shadow-[0_24px_60px_-20px_rgba(16,185,129,0.7)]"
        >
          {/* solid colorful body */}
          <span
            aria-hidden
            className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-600"
          />
          {/* soft texture overlay */}
          <span
            aria-hidden
            className="absolute inset-0 opacity-[0.22] mix-blend-overlay"
            style={{
              backgroundImage:
                'radial-gradient(600px 220px at 85% -10%, rgba(253,230,138,0.9), transparent 55%),' +
                'radial-gradient(500px 260px at 5% 110%, rgba(134,239,172,0.8), transparent 55%)',
            }}
          />
          {/* grid micro texture */}
          <span
            aria-hidden
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />

          <span className="relative p-5 md:p-6 flex gap-4 items-start">
            <span className="shrink-0 h-12 w-12 rounded-xl bg-white text-emerald-600 flex items-center justify-center shadow-[0_10px_24px_-6px_rgba(0,0,0,0.35)] ring-1 ring-white/50 group-hover:scale-105 transition-transform">
              <Play className="h-5 w-5 fill-emerald-600" strokeWidth={0} />
            </span>
            <span className="flex-1 min-w-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.16em] text-white mb-2">
                <span className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)] animate-pulse" />
                Live playground · no mic
              </span>
              <span className="block text-[17px] md:text-[18px] font-bold tracking-[-0.015em] text-white mb-1 leading-tight">
                Run a real Mandarin + English demo
              </span>
              <span className="block text-[13px] text-emerald-50/90 leading-relaxed">
                Watch raw JSON → teacher diagnosis → auto-generated drill. No signup, no setup.
              </span>
              <span className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-white">
                Open the playground
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/25 group-hover:bg-white/40 group-hover:translate-x-0.5 transition-all">
                  <ArrowUpRight className="h-3 w-3" />
                </span>
              </span>
            </span>
          </span>
        </Link>
      </div>

      {/* ─── RIGHT: live editor + terminal ─── */}
      <div className="lg:col-span-7 min-w-0">
        <div className="glass-card-dark text-zinc-200 overflow-hidden h-full flex flex-col">
          {/* tab strip */}
          <div className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.04] backdrop-blur-sm">
            <div
              className="flex flex-wrap min-w-0"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {INSTALL_TABS.map((t) => {
                const isActive = t.id === installTab;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setInstallTab(t.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`relative inline-flex items-center gap-1.5 px-3 py-2.5 text-[11.5px] font-mono whitespace-nowrap transition-all ${
                      isActive
                        ? 'text-white font-semibold bg-white/[0.08]'
                        : 'text-zinc-300 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`h-1.5 w-1.5 rounded-full transition-all ${
                        isActive
                          ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                          : 'bg-zinc-500'
                      }`}
                    />
                    {t.label}
                    {isActive && (
                      <span
                        aria-hidden
                        className="pointer-events-none absolute left-2 right-2 -bottom-px h-[2px] rounded-full bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.55)]"
                      />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2 px-3 shrink-0">
              <span className="hidden xl:inline-flex items-center gap-1.5 text-[10.5px] font-mono text-zinc-500 tracking-wider">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    dPhase === 0 ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                  }`}
                />
                {activeInstall.filename}
              </span>
              <button
                type="button"
                onClick={copy}
                className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] px-2 py-1 text-[11px] font-mono text-zinc-300 transition-colors"
                aria-label="Copy config"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" /> Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* code viewport — typed config */}
          <pre className="text-[12.5px] leading-[1.7] font-mono p-6 whitespace-pre overflow-hidden min-h-[190px]">
            {code.slice(0, dTyped)}
            {dPhase === 0 && hoverStep === null && (
              <span className="inline-block w-[7px] h-[1.1em] translate-y-[2px] bg-emerald-400/90 animate-pulse align-middle" />
            )}
          </pre>

          {/* live terminal transcript — hidden while previewing step 1
               (no server has been spun up yet, so nothing to show) */}
          <div
            className="border-t border-white/[0.08] bg-black/30 backdrop-blur-sm px-5 py-4 font-mono text-[11.5px] leading-[1.7] text-zinc-300 space-y-1 min-h-[130px]"
            style={dPhase < 0 ? { display: 'none' } : undefined}
          >
            {/* boot line */}
            <TerminalLine
              visible={dPhase >= 0}
              prefix="$"
              prefixClass="text-zinc-500"
              running={dPhase === 0 || dPhase === 1}
              done={dPhase >= 2}
            >
              <span className="text-zinc-100">npx</span>
              <span className="text-zinc-400"> -y @chivox/mcp</span>
              {dPhase === 1 && (
                <span className="ml-2 text-emerald-400">✓ connected · 4 tools registered</span>
              )}
              {dPhase >= 2 && (
                <span className="ml-2 text-emerald-400">✓ ready</span>
              )}
            </TerminalLine>

            {/* LLM call */}
            <TerminalLine
              visible={dPhase >= 2}
              prefix="→"
              prefixClass="text-sky-400"
              running={dPhase === 2}
              done={dPhase >= 3}
            >
              <span className="text-sky-300">llm.tool_call</span>
              <span className="text-zinc-500">(</span>
              <span className="text-zinc-100">&quot;assess_speech&quot;</span>
              <span className="text-zinc-500">, </span>
              <span className="text-zinc-400">{'{ language: "en-US", audio_file_path: "./take-01.wav" }'}</span>
              <span className="text-zinc-500">)</span>
            </TerminalLine>

            {/* response stream */}
            {dPhase >= 3 && (
              <div className="pt-1">
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 shrink-0">←</span>
                  <pre className="font-mono text-[11.5px] leading-[1.65] text-emerald-200/90 whitespace-pre overflow-hidden">
                    {RESPONSE.slice(0, dResponseChars)}
                    {dResponseChars < RESPONSE.length && hoverStep === null && (
                      <span className="inline-block w-[6px] h-[0.95em] translate-y-[1px] bg-emerald-300/80 animate-pulse align-middle" />
                    )}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TerminalLine({
  visible,
  prefix,
  prefixClass,
  running,
  done,
  children,
}: {
  visible: boolean;
  prefix: string;
  prefixClass?: string;
  running?: boolean;
  done?: boolean;
  children: React.ReactNode;
}) {
  if (!visible) return null;
  return (
    <div className="flex items-start gap-2 qd-line-in">
      <span className={`shrink-0 ${prefixClass ?? 'text-zinc-500'}`}>{prefix}</span>
      <div className="flex-1 min-w-0 flex items-start gap-2 flex-wrap">
        <div className="min-w-0">{children}</div>
        {running && <Spinner />}
        {done && !running && <Check className="h-3 w-3 text-emerald-400 mt-0.5" />}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <span className="inline-flex items-center">
      <svg className="h-3 w-3 animate-spin text-emerald-400" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </span>
  );
}

/* ──────────────────────────────────────────────────────────
 *  CAPABILITY VISUALS — editorial stills in public/capabilities/
 * ────────────────────────────────────────────────────────── */
function CapabilityVisual({ id }: { id: CapabilityVisual }) {
  const art = CAPABILITY_ART[id];
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-zinc-900/[0.06] bg-white/40">
      <Image
        src={art.src}
        alt={art.alt}
        fill
        className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
        sizes="(max-width: 640px) 40vw, 220px"
      />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
 *  HERO EQ GLYPH — tiny animated equaliser bars flanking
 *  the italic "the ears of a" line. Uses the `wave-bar`
 *  keyframe already defined in globals.css.
 * ────────────────────────────────────────────────────────── */
function HeroEqGlyph({ side }: { side: 'left' | 'right' }) {
  const heights = side === 'left' ? [0.45, 0.7, 0.95, 0.7, 0.45] : [0.45, 0.7, 0.95, 0.7, 0.45];
  const delays = side === 'left'
    ? ['0s', '0.12s', '0.24s', '0.36s', '0.48s']
    : ['0.48s', '0.36s', '0.24s', '0.12s', '0s'];
  return (
    <span
      aria-hidden
      className={`hidden md:inline-flex align-middle ${side === 'left' ? 'mr-3' : 'ml-3'} translate-y-[-0.08em] gap-[3px] items-end h-[0.5em]`}
    >
      {heights.map((h, i) => (
        <span
          key={i}
          className="block w-[3px] rounded-full bg-gradient-to-b from-emerald-500 to-teal-600"
          style={{
            height: `${h * 100}%`,
            transformOrigin: 'bottom',
            animation: `wave-bar 1.1s ease-in-out ${delays[i]} infinite`,
          }}
        />
      ))}
    </span>
  );
}

/* ──────────────────────────────────────────────────────────
 *  HERO EAR ART — animated two-act linguistics illustration.
 *
 *  Act 1 (CN, ~0–5.5s)  : Mandarin pitch-contour tracing for
 *                          nǐ-hǎo, tone-sandhi rule detected
 *                          (T3 + T3 → T2 + T3).
 *  Act 2 (EN, ~5.5–10.5s): Phoneme-level scoring of "think"
 *                          with 4 outcomes — /θ/ mispronounced
 *                          (heard /s/), /ɪ/ good, /ŋ/ weak,
 *                          /k/ dropped — then corrected.
 *
 *  CSS lives in globals.css (`.hero-ear-art`); inline SVG <style> is unreliable
 *  in some bundlers. Honours prefers-reduced-motion.
 * ────────────────────────────────────────────────────────── */

function HeroEarArt() {
  const pinyinStyle = {
    fontFamily:
      'var(--font-hero-serif, "Fraunces", "Instrument Serif", Georgia, serif)',
    fontStyle: 'italic' as const,
    fontWeight: 500,
    letterSpacing: '0.01em',
  };
  const serifStyle = {
    fontFamily: 'var(--font-hero-serif, "Fraunces", Georgia, serif)',
  };
  const thinkStyle = {
    fontFamily: 'var(--font-think-serif, "Newsreader", Georgia, serif)',
    fontStyle: 'italic' as const,
    fontWeight: 500,
    letterSpacing: '-0.015em',
  };

  return (
    <svg
      viewBox="0 0 420 500"
      role="img"
      aria-label="Mandarin pitch contour and English phoneme-diagnosis — the listening layer for voice-native agents"
      className="hero-ear-art w-full h-full"
    >
      <defs>
        <radialGradient id="hh-halo" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#d1fae5" stopOpacity="0.9" />
          <stop offset="55%" stopColor="#ecfdf5" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hh-hanzi" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#047857" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="hh-think" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#047857" stopOpacity="0.08" />
        </linearGradient>
        <linearGradient id="hh-curve" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="55%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="hh-bar" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        <linearGradient id="hh-bar-bad" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#fb7185" />
          <stop offset="100%" stopColor="#e11d48" />
        </linearGradient>
        <filter id="hh-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* shared backdrop */}
      <ellipse cx="210" cy="240" rx="200" ry="210" fill="url(#hh-halo)" />

      {/* shared 5-line pitch grid */}
      <g opacity="0.7">
        <line x1="50" x2="370" y1="120" y2="120" stroke="#a7f3d0" strokeWidth="0.6" />
        <line x1="50" x2="370" y1="160" y2="160" stroke="#a7f3d0" strokeWidth="0.6" />
        <line x1="50" x2="370" y1="200" y2="200" stroke="#10b981" strokeOpacity="0.45" strokeWidth="0.8" strokeDasharray="3 3" />
        <line x1="50" x2="370" y1="240" y2="240" stroke="#a7f3d0" strokeWidth="0.6" />
        <line x1="50" x2="370" y1="280" y2="280" stroke="#a7f3d0" strokeWidth="0.6" />
      </g>
      <g opacity="0.55" fontFamily="var(--font-geist-mono, ui-monospace)" fontSize="9" fill="#047857">
        <text x="38" y="123" textAnchor="end">5</text>
        <text x="38" y="163" textAnchor="end">4</text>
        <text x="38" y="203" textAnchor="end">3</text>
        <text x="38" y="243" textAnchor="end">2</text>
        <text x="38" y="283" textAnchor="end">1</text>
      </g>

      {/* ░░░░░ CN SCENE ░░░░░ */}
      <g className="cn-scene">
        <text
          x="210" y="345" textAnchor="middle" fontSize="190" fontWeight="700"
          fill="url(#hh-hanzi)"
          style={{
            fontFamily:
              '"Noto Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
            letterSpacing: '0.02em',
          }}
        >
          你好
        </text>

        {/* ghost / ideal curves */}
        <path
          d="M 70 200 C 95 230, 120 278, 135 280 S 165 200, 180 160"
          fill="none" stroke="#6ee7b7" strokeWidth="2"
          strokeDasharray="3 4" strokeLinecap="round" opacity="0.55"
        />
        <path
          d="M 240 200 C 265 230, 290 278, 305 280 S 335 200, 350 160"
          fill="none" stroke="#6ee7b7" strokeWidth="2"
          strokeDasharray="3 4" strokeLinecap="round" opacity="0.55"
        />

        {/* animated tracers */}
        <g filter="url(#hh-glow)">
          <path
            className="cn-trace cn-trace-1"
            d="M 70 200 C 95 230, 120 278, 135 280 S 165 200, 180 160"
            fill="none" stroke="url(#hh-curve)" strokeWidth="2.6"
            strokeLinecap="round" strokeLinejoin="round" pathLength={100}
          />
          <path
            className="cn-trace cn-trace-2"
            d="M 240 200 C 265 230, 290 278, 305 280 S 335 200, 350 160"
            fill="none" stroke="url(#hh-curve)" strokeWidth="2.6"
            strokeLinecap="round" strokeLinejoin="round" pathLength={100}
          />
        </g>

        {/* dip markers */}
        <g>
          <circle cx="70" cy="200" r="3.2" fill="#059669" />
          <circle className="cn-pulse cn-pulse-1" cx="135" cy="280" r="4" fill="#ffffff" stroke="#059669" strokeWidth="2" />
          <circle cx="180" cy="160" r="3.2" fill="#059669" />
          <circle cx="240" cy="200" r="3.2" fill="#059669" />
          <circle className="cn-pulse cn-pulse-2" cx="305" cy="280" r="4" fill="#ffffff" stroke="#059669" strokeWidth="2" />
          <circle cx="350" cy="160" r="3.2" fill="#059669" />
        </g>

        {/* tone tags */}
        <g fontFamily="var(--font-geist-mono, ui-monospace)" fontSize="10">
          <g>
            <rect x="105" y="92" width="54" height="20" rx="10" fill="#ffffff" stroke="#10b981" strokeOpacity="0.35" />
            <text x="132" y="106" textAnchor="middle" fill="#047857" fontWeight="600">
              T3 ✓
            </text>
          </g>
          <g>
            <rect x="275" y="92" width="54" height="20" rx="10" fill="#ffffff" stroke="#10b981" strokeOpacity="0.35" />
            <text x="302" y="106" textAnchor="middle" fill="#047857" fontWeight="600">
              T3 ✓
            </text>
          </g>
        </g>

        {/* pinyin */}
        <text x="125" y="315" textAnchor="middle" fontSize="28" fill="#065f46" className="font-pinyin" style={pinyinStyle}>
          nǐ
        </text>
        <text x="295" y="315" textAnchor="middle" fontSize="28" fill="#065f46" className="font-pinyin" style={pinyinStyle}>
          hǎo
        </text>

        {/* bottom: tone-sandhi rule */}
        <line x1="70" x2="350" y1="360" y2="360" stroke="#10b981" strokeOpacity="0.25" strokeDasharray="2 3" />
        <text
          x="210" y="390" textAnchor="middle" fontSize="15" fontWeight="600" fill="#065f46"
          fontFamily="var(--font-geist-mono, ui-monospace)" letterSpacing="0.06em"
        >
          T3 + T3 → T2 + T3
        </text>
        <text
          x="210" y="409" textAnchor="middle" fontSize="10" fill="#047857" opacity="0.7"
          fontFamily="var(--font-geist-mono, ui-monospace)" letterSpacing="0.14em"
        >
          TONE SANDHI · DETECTED
        </text>

        {/* teacher score badge */}
        <g transform="translate(352 70)">
          <circle r="22" fill="#ffffff" stroke="#f43f5e" strokeOpacity="0.55" strokeWidth="1.2" />
          <text textAnchor="middle" y="-3" fontSize="9" fill="#be123c"
                fontFamily="var(--font-geist-mono, ui-monospace)" letterSpacing="0.1em">
            SCORE
          </text>
          <text textAnchor="middle" y="13" fontSize="16" fontWeight="700" fill="#be123c" style={serifStyle}>
            92
          </text>
        </g>
      </g>

      {/* ░░░░░ EN SCENE — diagnosis + correction ░░░░░ */}
      <g className="en-scene">
        <text
          x="210" y="330" textAnchor="middle" fontSize="194" fontWeight="500" fill="url(#hh-think)"
          textLength={300}
          lengthAdjust="spacingAndGlyphs"
          style={thinkStyle}
        >
          think
        </text>

        {/* top column tags */}
        <g fontFamily="var(--font-geist-mono, ui-monospace)" fontSize="10">
          <rect x="70" y="56" width="62" height="20" rx="10" fill="#ffffff" stroke="#10b981" strokeOpacity="0.28" />
          <text x="101" y="70" textAnchor="middle" fill="#047857" fontWeight="600">PHONEME</text>
          <rect x="240" y="56" width="68" height="20" rx="10" fill="#ffffff" stroke="#10b981" strokeOpacity="0.28" />
          <text x="274" y="70" textAnchor="middle" fill="#047857" fontWeight="600">ACCURACY</text>
        </g>

        {/* score bars */}
        <rect className="en-bar en-bar-theta-init" x="82"  y="120" width="24" height="160" rx="3" fill="url(#hh-bar-bad)" />
        <rect className="en-bar en-bar-theta-fix"  x="82"  y="120" width="24" height="160" rx="3" fill="url(#hh-bar)" />
        <rect className="en-bar en-bar-i"          x="162" y="120" width="24" height="160" rx="3" fill="url(#hh-bar)" />
        <rect className="en-bar en-bar-ng-init"    x="242" y="120" width="24" height="160" rx="3" fill="#f59e0b" />
        <rect className="en-bar en-bar-ng-fix"     x="242" y="120" width="24" height="160" rx="3" fill="url(#hh-bar)" />
        <g className="en-bar-k-ghost">
          <rect
            x="322" y="120" width="24" height="160" rx="3"
            fill="#fff1f2" fillOpacity="0.4"
            stroke="#f43f5e" strokeOpacity="0.55"
            strokeWidth="1.2" strokeDasharray="3 3"
          />
          <line x1="322" x2="346" y1="278" y2="278" stroke="#f43f5e" strokeWidth="2" />
        </g>
        <rect className="en-bar en-bar-k-fix" x="322" y="120" width="24" height="160" rx="3" fill="url(#hh-bar)" />

        {/* diagnostic labels */}
        <g className="en-label-bad" fontFamily="var(--font-geist-mono, ui-monospace)" fontWeight="700">
          <text x="94"  y="105" textAnchor="middle" fontSize="9"  fill="#be123c" letterSpacing="0.14em">HEARD</text>
          <text x="94"  y="120" textAnchor="middle" fontSize="13" fill="#be123c" style={serifStyle}>/s/</text>
          <text x="254" y="162" textAnchor="middle" fontSize="9"  fill="#b45309" letterSpacing="0.18em">WEAK</text>
          <text x="334" y="105" textAnchor="middle" fontSize="9"  fill="#be123c" letterSpacing="0.16em">DROPPED</text>
          <text x="334" y="120" textAnchor="middle" fontSize="13" fill="#be123c" style={serifStyle}>—</text>
        </g>

        {/* phoneme chips — outer <g> carries the static translate,
            inner animated <g> is free to apply CSS translateY without
            clobbering the position. */}
        <g fontFamily="var(--font-geist-mono, ui-monospace)" fontSize="13" fontWeight="600">
          {/* /θ/ chip */}
          <g transform="translate(94 298)">
            <g className="en-chip en-chip-0">
              <g className="en-state-init">
                <rect x="-22" y="0" width="44" height="22" rx="11" fill="#fff1f2" stroke="#f43f5e" strokeOpacity="0.55" />
                <text x="0" y="15" textAnchor="middle" fill="#be123c">/s/</text>
              </g>
              <g className="en-state-fix">
                <rect x="-22" y="0" width="44" height="22" rx="11" fill="#ecfdf5" stroke="#10b981" strokeOpacity="0.6" />
                <text x="0" y="15" textAnchor="middle" fill="#047857">/θ/</text>
              </g>
            </g>
          </g>
          {/* /ɪ/ chip — always good */}
          <g transform="translate(174 298)">
            <g className="en-chip en-chip-1">
              <rect x="-22" y="0" width="44" height="22" rx="11" fill="#ecfdf5" stroke="#10b981" strokeOpacity="0.55" />
              <text x="-3" y="15" textAnchor="middle" fill="#047857">/ɪ/</text>
              <text x="14" y="15" textAnchor="middle" fill="#10b981" fontSize="11">✓</text>
            </g>
          </g>
          {/* /ŋ/ chip */}
          <g transform="translate(254 298)">
            <g className="en-chip en-chip-2">
              <g className="en-state-init">
                <rect x="-22" y="0" width="44" height="22" rx="11" fill="#fffbeb" stroke="#f59e0b" strokeOpacity="0.6" />
                <text x="0" y="15" textAnchor="middle" fill="#b45309">/ŋ/</text>
              </g>
              <g className="en-state-fix">
                <rect x="-22" y="0" width="44" height="22" rx="11" fill="#ecfdf5" stroke="#10b981" strokeOpacity="0.6" />
                <text x="0" y="15" textAnchor="middle" fill="#047857">/ŋ/</text>
              </g>
            </g>
          </g>
          {/* /k/ chip */}
          <g transform="translate(334 298)">
            <g className="en-chip en-chip-3">
              <g className="en-state-init">
                <rect x="-22" y="0" width="44" height="22" rx="11" fill="#fff1f2" fillOpacity="0.4" stroke="#f43f5e" strokeOpacity="0.6" strokeDasharray="3 3" />
                <text x="0" y="15" textAnchor="middle" fill="#be123c" opacity="0.8">/k/</text>
              </g>
              <g className="en-state-fix">
                <rect x="-22" y="0" width="44" height="22" rx="11" fill="#ecfdf5" stroke="#10b981" strokeOpacity="0.6" />
                <text x="0" y="15" textAnchor="middle" fill="#047857">/k/</text>
              </g>
            </g>
          </g>
        </g>

        {/* correction arrows */}
        <g fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" pathLength={30}>
          <g className="en-arrow en-arrow-1">
            <path d="M 60 250 C 60 270, 85 282, 94 280" />
            <path d="M 90 277 L 94 280 L 91 283" />
          </g>
          <g className="en-arrow en-arrow-2">
            <path d="M 220 250 C 230 274, 245 282, 254 280" />
            <path d="M 250 277 L 254 280 L 251 283" />
          </g>
          <g className="en-arrow en-arrow-3">
            <path d="M 380 250 C 370 272, 345 282, 334 280" />
            <path d="M 337 277 L 334 280 L 336 283" />
          </g>
        </g>

        {/* bottom caption swap */}
        <line x1="70" x2="350" y1="360" y2="360" stroke="#10b981" strokeOpacity="0.25" strokeDasharray="2 3" />
        <g className="en-cap-bad" fontFamily="var(--font-geist-mono, ui-monospace)">
          <text x="210" y="390" textAnchor="middle" fontSize="15" fontWeight="700" fill="#be123c" letterSpacing="0.06em">
            3 ISSUES · DETECTED
          </text>
          <text x="210" y="409" textAnchor="middle" fontSize="10" fill="#b91c1c" opacity="0.85" letterSpacing="0.14em">
            MISSING · WEAK · MISPRONOUNCED
          </text>
        </g>
        <g className="en-cap-good" fontFamily="var(--font-geist-mono, ui-monospace)">
          <text x="210" y="390" textAnchor="middle" fontSize="15" fontWeight="700" fill="#065f46" letterSpacing="0.06em">
            ALL CORRECTED
          </text>
          <text x="210" y="409" textAnchor="middle" fontSize="10" fill="#047857" opacity="0.85" letterSpacing="0.14em">
            PHONEME DIAGNOSIS · SUPERVISED
          </text>
        </g>

        {/* score badge 58 → 92 */}
        <g transform="translate(352 70)">
          <circle r="22" fill="#ffffff" stroke="#10b981" strokeOpacity="0.5" strokeWidth="1.2" />
          <text textAnchor="middle" y="-3" fontSize="9" fill="#047857"
                fontFamily="var(--font-geist-mono, ui-monospace)" letterSpacing="0.1em">
            SCORE
          </text>
          <text className="en-score-bad"  textAnchor="middle" y="13" fontSize="16" fontWeight="700" fill="#be123c" style={serifStyle}>58</text>
          <text className="en-score-good" textAnchor="middle" y="13" fontSize="16" fontWeight="700" fill="#047857" style={serifStyle}>92</text>
        </g>
      </g>

      {/* scattered decorative dots */}
      <g fill="#10b981" opacity="0.35">
        <circle cx="46" cy="78" r="1.6" />
        <circle cx="388" cy="130" r="1.2" />
        <circle cx="30" cy="330" r="1.4" />
        <circle cx="400" cy="370" r="1.6" />
        <circle cx="60" cy="440" r="1.2" />
      </g>
      {/* outer dashed ring */}
      <circle cx="210" cy="240" r="200" fill="none" stroke="#10b981" strokeOpacity="0.08" strokeDasharray="2 6" />
    </svg>
  );
}



/* ──────────────────────────────────────────────────────────
 *  HERO WAVEFORM GLYPH — faint brand motif behind the headline
 * ────────────────────────────────────────────────────────── */
function HeroWaveGlyph() {
  // deterministic bars
  const bars = Array.from({ length: 32 }).map((_, i) => {
    const t = i / 31;
    return 0.2 + 0.8 * Math.abs(Math.sin(t * Math.PI * 2.6) * Math.cos(t * Math.PI + 0.7));
  });
  return (
    <svg
      aria-hidden
      className="absolute left-[-40px] top-[64%] w-[260px] h-[90px] opacity-[0.35] hidden md:block"
      viewBox="0 0 260 90"
      fill="none"
    >
      <defs>
        <linearGradient id="heroWave" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
        </linearGradient>
      </defs>
      {bars.map((h, i) => {
        const x = i * 8;
        const barH = h * 60;
        const y = (90 - barH) / 2;
        return (
          <rect
            key={i}
            x={x.toFixed(2)}
            y={y.toFixed(2)}
            width={3}
            height={barH.toFixed(2)}
            rx={1.5}
            fill="url(#heroWave)"
          />
        );
      })}
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────
 *  HERO CAROUSEL — 3 highlights, auto-rotating
 *    01 Instant setup       · 60-second config
 *    02 Mandarin moat       · tone-level precision
 *    03 Fuel for reasoning  · phoneme-level JSON → LLM
 * ────────────────────────────────────────────────────────── */
const HERO_SLIDES = [
  {
    order: 1,
    id: 'setup',
    label: 'Plug-and-play',
    chip: 'npx · 60 s',
    tone: 'emerald',
    src: '/hero-slides/01-setup.jpg',
    headline: 'One MCP. Every agent runtime.',
    sub: 'Plug Chivox into Claude, Cursor, Cline, LangChain, or any custom loop in minutes.',
    points: [
      'One npx command — no SDK to install.',
      'Same payload for Mandarin and English.',
      'Works with any MCP-compatible client.',
    ],
  },
  {
    order: 2,
    id: 'mandarin',
    label: 'Mandarin depth',
    chip: 'Hardest acoustic signal',
    tone: 'rose',
    src: '/hero-slides/02-mandarin.jpg',
    headline: 'Hardest acoustic signal? Solved.',
    sub: 'Tones, sandhi, erhua, retroflex — surfaced as structured fields instead of lost in transcription.',
    points: [
      'Tone objects + sandhi resolved per syllable.',
      'HSK 1–9 lexical depth, ready for coaching.',
      'Same JSON shape as English scoring.',
    ],
  },
  {
    order: 3,
    id: 'phoneme',
    label: 'Phoneme diagnosis',
    chip: 'Beyond STT',
    tone: 'violet',
    src: '/hero-slides/03-phoneme.jpg',
    headline: 'Raw audio in. Clear diagnosis out.',
    sub: 'Per-phoneme accuracy, stress, liaison, ms-level windows — the signal an LLM can actually reason on.',
    points: [
      'Word + phoneme scores with millisecond spans.',
      'Stress, liaison and intonation flags built in.',
      'Drives feedback and next-drill generation.',
    ],
  },
  {
    order: 4,
    id: 'reasoning',
    label: 'Reasoning-ready JSON',
    chip: 'Not a leaderboard cell',
    tone: 'amber',
    src: '/hero-slides/04-reasoning.jpg',
    headline: 'A payload, not just a score.',
    sub: 'Dozens of fields — pron, fluency, audio quality, per-word details — designed for LLM agents.',
    points: [
      'Stable JSON keys for reliable agent loops.',
      'Rich sub-scores on every utterance.',
      'Plays nicely with GPT, Claude and Gemini.',
    ],
  },
  {
    order: 5,
    id: 'scale',
    label: 'Enterprise-ready',
    chip: 'Production proof',
    tone: 'sky',
    src: '/hero-slides/05-scale.jpg',
    headline: 'Scale you can ship to enterprise.',
    sub: '9B+ evaluations a year, 99.99% uptime, 185 regions — scoring that aligns with human experts.',
    points: [
      'Used by national testing centers and consumer apps.',
      'Enterprise SLAs with privacy-first retention.',
      '95%+ correlation with certified human rubrics.',
    ],
  },
] as const;

type HeroSlideId = (typeof HERO_SLIDES)[number]['id'];

/** Time between auto-advances; progress bar uses the same duration. */
const HERO_CAROUSEL_MS = 3500;

function HeroCarousel() {
  const [active, setActive] = useState<HeroSlideId>('setup');
  const [zoomOpen, setZoomOpen] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const pausedRef = useRef(false);
  const zoomTriggerRef = useRef<HTMLButtonElement>(null);
  const zoomCloseRef = useRef<HTMLButtonElement>(null);
  const zoomDialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    if (!zoomOpen) return;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoomOpen(false);
      if (e.key === 'Tab') {
        const focusable = Array.from(
          zoomDialogRef.current?.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
          ) ?? [],
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!first || !last) return;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    const focusFrame = window.requestAnimationFrame(() => zoomCloseRef.current?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      window.cancelAnimationFrame(focusFrame);
      zoomTriggerRef.current?.focus();
    };
  }, [zoomOpen]);

  // Auto-advance (unless user prefers reduced motion). We pause on hover
  // via `pausedRef` so users can read without fighting the carousel.
  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => {
      if (pausedRef.current || zoomOpen) return;
      setActive((cur) => {
        const i = HERO_SLIDES.findIndex((s) => s.id === cur);
        return HERO_SLIDES[(i + 1) % HERO_SLIDES.length]!.id;
      });
    }, HERO_CAROUSEL_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion, zoomOpen]);

  const activeIdx = HERO_SLIDES.findIndex((s) => s.id === active);

  const activeSlide = HERO_SLIDES[Math.max(0, activeIdx)]!;

  const openZoom = (event: React.MouseEvent<HTMLButtonElement>) => {
    zoomTriggerRef.current = event.currentTarget;
    setZoomOpen(true);
  };

  const goPrev = () => {
    const n = HERO_SLIDES.length;
    setActive((cur) => {
      const i = HERO_SLIDES.findIndex((s) => s.id === cur);
      return HERO_SLIDES[(i - 1 + n) % n]!.id;
    });
  };

  const goNext = () => {
    const n = HERO_SLIDES.length;
    setActive((cur) => {
      const i = HERO_SLIDES.findIndex((s) => s.id === cur);
      return HERO_SLIDES[(i + 1) % n]!.id;
    });
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
    >
      <div className="grid lg:grid-cols-12 gap-6 items-center">
        {/* LEFT — generated still fills the frame (no outer glow / gray canvas). */}
        <div className="lg:col-span-6">
          <button
            type="button"
            onClick={openZoom}
            aria-label="Open screenshot preview"
            aria-haspopup="dialog"
            aria-expanded={zoomOpen}
            aria-controls="hero-preview-dialog"
            className="group block w-full max-w-[500px] mx-auto lg:mx-0 lg:mr-auto text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 rounded-2xl"
          >
            <HeroSlideCard slide={activeSlide} isActive />
          </button>
        </div>

        {/* RIGHT — copy + vertical (up/down) switching.
         * Capped + pinned to the right edge so it sits opposite the
         * left card with a comfortable gap in the middle. */}
        <div className="lg:col-span-6 flex flex-col justify-center w-full max-w-[520px] mx-auto lg:mx-0 lg:ml-auto">
          <div className="grid grid-cols-[1fr_auto] gap-4 items-start">
            <div className="min-w-0">
              <div className="flex items-start gap-3">
                <span
                  className={`mt-1.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[12px] font-mono font-semibold ${
                    activeSlide.tone === 'emerald'
                      ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/25'
                      : activeSlide.tone === 'rose'
                      ? 'bg-rose-500/10 text-rose-700 border border-rose-500/25'
                      : activeSlide.tone === 'amber'
                      ? 'bg-amber-500/10 text-amber-700 border border-amber-500/30'
                      : 'bg-violet-500/10 text-violet-700 border border-violet-500/25'
                  }`}
                >
                  {String(activeSlide.order).padStart(2, '0')}
                </span>
                <div className="flex-1 min-w-0">
                  <div
                    className="text-[22px] md:text-[28px] font-semibold tracking-[-0.02em] leading-[1.15] text-foreground"
                    style={{
                      display: '-webkit-box',
                      WebkitBoxOrient: 'vertical',
                      WebkitLineClamp: 2,
                      overflow: 'hidden',
                    }}
                  >
                    {activeSlide.headline}
                  </div>
                  <div
                    className="mt-2 text-[14px] md:text-[15px] text-muted-foreground leading-snug"
                    style={{
                      display: '-webkit-box',
                      WebkitBoxOrient: 'vertical',
                      WebkitLineClamp: 2,
                      overflow: 'hidden',
                    }}
                  >
                    {activeSlide.sub}
                  </div>
                </div>
              </div>

              {activeSlide.points?.length ? (
                <div className="mt-3 space-y-1.5 pl-10">
                  {activeSlide.points.slice(0, 3).map((p) => (
                    <div key={p} className="text-[12.5px] text-foreground/70 flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-foreground/30 shrink-0" />
                      <span
                        className="leading-relaxed"
                        style={{
                          display: '-webkit-box',
                          WebkitBoxOrient: 'vertical',
                          WebkitLineClamp: 1,
                          overflow: 'hidden',
                        }}
                      >
                        {p}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-2 shrink-0 items-end justify-center self-stretch">
              <button
                type="button"
                onClick={goPrev}
                aria-label="Previous slide"
                className="h-9 w-9 rounded-lg border border-border bg-background/70 hover:bg-background shadow-sm flex items-center justify-center transition-colors"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label="Next slide"
                className="h-9 w-9 rounded-lg border border-border bg-background/70 hover:bg-background shadow-sm flex items-center justify-center transition-colors"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="flex items-center gap-1 shrink-0" role="tablist" aria-label="Carousel position">
              {HERO_SLIDES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={s.id === active}
                  onClick={() => setActive(s.id)}
                  aria-label={`Show slide ${s.label}`}
                  className={cn(
                    'h-1 rounded-full transition-all duration-300 ease-out',
                    s.id === active
                      ? 'w-7 bg-foreground'
                      : 'w-3 bg-foreground/15 hover:bg-foreground/30',
                  )}
                />
              ))}
            </div>
            <span className="text-[11px] font-mono tabular-nums text-muted-foreground shrink-0">
              {String(activeIdx + 1).padStart(2, '0')}
              <span className="opacity-50"> / {String(HERO_SLIDES.length).padStart(2, '0')}</span>
            </span>
            <span className="h-3 w-px bg-border shrink-0" aria-hidden />
            <span className="text-[12px] text-foreground/75 min-w-0 truncate">
              {activeSlide.label}
            </span>
            <button
              type="button"
              onClick={openZoom}
              aria-haspopup="dialog"
              aria-expanded={zoomOpen}
              aria-controls="hero-preview-dialog"
              className="ml-auto inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[12px] font-medium border border-border bg-background/70 hover:bg-background transition-colors"
            >
              View larger
              <Maximize2 className="h-3.5 w-3.5 opacity-70" />
            </button>
          </div>
        </div>
      </div>

      {zoomOpen && typeof document !== 'undefined' ? createPortal(
        <div className="fixed inset-0 z-[200]">
          <button
            type="button"
            aria-label="Close preview"
            onClick={() => setZoomOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />
          <div className="absolute inset-0 flex items-center justify-center overflow-y-auto p-3 sm:p-6">
            <div
              ref={zoomDialogRef}
              id="hero-preview-dialog"
              role="dialog"
              aria-modal="true"
              aria-label={`${activeSlide.label} enlarged preview`}
              className="relative my-auto w-full max-w-[1500px]"
            >
              <div className="relative rounded-2xl">
                <button
                  ref={zoomCloseRef}
                  type="button"
                  onClick={() => setZoomOpen(false)}
                  className="absolute right-2 top-2 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/65 text-white backdrop-blur transition-colors hover:bg-black/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="grid lg:grid-cols-12 gap-4 items-center">
                  <div className="lg:col-span-9 overflow-hidden rounded-2xl border border-white/10 bg-black/20 shadow-2xl">
                    <HeroSlideCard slide={activeSlide} isActive />
                  </div>
                  <div className="lg:col-span-3 self-center rounded-2xl border border-white/10 bg-black/45 backdrop-blur-md p-4 lg:p-5 text-white">
                    <div className="flex items-start gap-3">
                      <span className="mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[12px] font-mono font-semibold border border-white/15 bg-white/10">
                        {String(activeSlide.order).padStart(2, '0')}
                      </span>
                      <div className="min-w-0">
                        <div className="text-[18px] lg:text-[20px] font-semibold tracking-[-0.02em] leading-snug">
                          {activeSlide.headline}
                        </div>
                        <div className="mt-2 text-[13px] text-white/75 leading-relaxed">
                          {activeSlide.sub}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <div className="flex items-center gap-1 shrink-0" role="tablist" aria-label="Carousel position">
                        {HERO_SLIDES.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            role="tab"
                            aria-selected={s.id === active}
                            onClick={() => setActive(s.id)}
                            aria-label={`Show slide ${s.label}`}
                            className={cn(
                              'h-1 rounded-full transition-all duration-300 ease-out',
                              s.id === active
                                ? 'w-7 bg-white'
                                : 'w-3 bg-white/25 hover:bg-white/45',
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] font-mono tabular-nums text-white/70 shrink-0">
                        {String(activeIdx + 1).padStart(2, '0')}
                        <span className="opacity-60"> / {String(HERO_SLIDES.length).padStart(2, '0')}</span>
                      </span>

                      <div className="ml-auto flex items-center gap-2 self-center">
                        <button
                          type="button"
                          onClick={goPrev}
                          aria-label="Previous slide"
                          className="h-9 w-9 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={goNext}
                          aria-label="Next slide"
                          className="h-9 w-9 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 text-[12px] text-white/65">
                      {activeSlide.label}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      ) : null}
    </div>
  );
}

function HeroSlideCard({
  slide,
  isActive = false,
}: {
  slide: (typeof HERO_SLIDES)[number];
  isActive?: boolean;
}) {
  // Stills are pre-cropped to the window only. Use contain so the full
  // UI stays visible (cover was clipping edges).
  return (
    <div className="overflow-hidden rounded-2xl aspect-[16/9] relative bg-transparent">
      <Image
        src={`${slide.src}?v=15`}
        alt={slide.label}
        fill
        sizes="(max-width: 1024px) 100vw, 500px"
        className="object-contain object-center"
        priority={isActive || slide.order === 1}
        unoptimized
      />
    </div>
  );
}

/* Slide 01 — One MCP, every runtime.
 * Horizontal long-strip: config snippet on the left, the list of
 * runtimes the same MCP connects to on the right. The visual sells
 * the “drop into any agent loop” promise of the slide copy. */
function HeroSlideSetup() {
  const runtimes: { name: string; meta: string }[] = [
    { name: 'Claude Desktop', meta: 'mcpServers' },
    { name: 'Cursor',         meta: 'mcp.json' },
    { name: 'Cline',          meta: 'cline.config' },
    { name: 'LangChain',      meta: 'MCPClient' },
    { name: 'Custom loop',    meta: 'stdio · ws' },
  ];
  return (
    <div className="h-full p-3.5 grid grid-cols-[1.05fr_1fr] gap-2.5 items-stretch">
      {/* LEFT — config snippet */}
      <div className="rounded-xl border border-zinc-900/[0.85] bg-zinc-950 text-zinc-100 p-2.5 font-mono text-[10px] leading-[1.55] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-emerald-400/80 text-[9.5px] tracking-[0.16em] uppercase">mcp.config</span>
          <span className="inline-flex items-center gap-1 text-emerald-300 text-[9.5px]">
            <Check className="h-3 w-3" strokeWidth={3} /> connected
          </span>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
          <div><span className="text-zinc-500">{'{'}</span></div>
          <div className="pl-2"><span className="text-sky-300">&quot;mcpServers&quot;</span><span className="text-zinc-500">: {'{'}</span></div>
          <div className="pl-4"><span className="text-emerald-300">&quot;chivox&quot;</span><span className="text-zinc-500">: {'{'}</span></div>
          <div className="pl-6"><span className="text-sky-300">&quot;command&quot;</span><span className="text-zinc-500">: </span><span className="text-amber-200">&quot;npx&quot;</span><span className="text-zinc-500">,</span></div>
          <div className="pl-6"><span className="text-sky-300">&quot;args&quot;</span><span className="text-zinc-500">: [</span><span className="text-amber-200">&quot;-y&quot;</span><span className="text-zinc-500">, </span><span className="text-amber-200">&quot;@chivox/mcp&quot;</span><span className="text-zinc-500">]</span></div>
          <div className="pl-4"><span className="text-zinc-500">{'}'}</span></div>
          <div className="pl-2"><span className="text-zinc-500">{'}'}</span></div>
          <div><span className="text-zinc-500">{'}'}</span></div>
        </div>
      </div>

      {/* RIGHT — connected runtimes */}
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-[9.5px] font-mono uppercase tracking-[0.16em] text-muted-foreground">runtimes · same payload</span>
          <span className="text-[9.5px] font-mono text-emerald-700">5 / 5 ok</span>
        </div>
        {runtimes.map((r) => (
          <div
            key={r.name}
            className="flex items-center gap-2 rounded-md border border-zinc-900/[0.08] bg-white/65 px-2 py-1"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.18)] shrink-0" />
            <span className="text-[12px] text-zinc-800 font-medium truncate">{r.name}</span>
            <span className="ml-auto text-[9.5px] font-mono text-zinc-500 truncate">{r.meta}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Slide 02 — Trust & scale: a compact "metrics dashboard" card.
 * Purpose: bring the benchmark + trust bullets (previously below)
 * into the hero rotation so the first fold can sell credibility too. */
/* Slide 05 — Enterprise scale. Editorial layout:
 * LEFT  → hero metric (9.2B+ evals/year) + growth sparkline +
 *         a 3-up support stat strip
 * RIGHT → "Trusted by" name strip + 3 proof bullets, each with a
 *         labeled icon so the row reads like a checklist, not text.
 */
function HeroSlideScale() {
  // 12-point smoothed growth curve (relative units) — gives the eye a
  // "this thing has been compounding for years" cue without claiming
  // anything load-bearing. Pure decorative tabular-nums-friendly data.
  const spark = [14, 19, 26, 35, 46, 58, 71, 84, 96, 108, 122, 138];
  const sparkW = 240;
  const sparkH = 50;
  const sparkMax = Math.max(...spark);
  const stepX = sparkW / (spark.length - 1);
  const points = spark.map((v, i) => {
    const x = i * stepX;
    const y = sparkH - 3 - (v / sparkMax) * (sparkH - 8);
    return [x, y] as const;
  });
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${sparkW} ${sparkH} L 0 ${sparkH} Z`;
  const lastPt = points[points.length - 1]!;

  const trusted = ['National testing centers', 'Consumer apps', 'Ministry deployments'];

  const proofs: { label: string; body: string }[] = [
    { label: '14+ patents',     body: 'pronunciation assessment' },
    { label: '99.99% SLA',      body: 'enterprise tier' },
    { label: 'Privacy-first',   body: 'configurable retention' },
  ];

  return (
    <div className="h-full p-3.5 grid grid-cols-[1.15fr_1fr] gap-2.5 items-stretch">
      {/* LEFT — hero metric + sparkline + 3-up support */}
      <div className="relative rounded-xl border border-sky-500/20 bg-gradient-to-br from-sky-50/70 via-white/65 to-white/45 backdrop-blur-sm p-2.5 flex flex-col justify-between overflow-hidden min-h-0">
        {/* decorative glow */}
        <div
          aria-hidden
          className="absolute -top-16 -right-12 h-44 w-44 rounded-full bg-sky-400/20 blur-3xl pointer-events-none"
        />
        <div
          aria-hidden
          className="absolute inset-x-3 top-1/2 -translate-y-1/2 h-px bg-gradient-to-r from-transparent via-sky-500/15 to-transparent"
        />

        <div className="flex items-center justify-between">
          <span className="text-[9.5px] font-mono uppercase tracking-[0.18em] text-sky-800/70">
            production scale · 2025
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-1.5 py-0.5 text-[9.5px] font-mono uppercase tracking-wider text-sky-700">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-500 shadow-[0_0_0_3px_rgba(14,165,233,0.18)]" />
            live
          </span>
        </div>

        {/* hero metric */}
        <div className="relative">
          <div className="flex items-baseline gap-2.5">
            <span className="heading-display text-[44px] md:text-[48px] font-semibold leading-none tracking-[-0.035em] tabular-nums text-zinc-900">
              9.2B+
            </span>
            <span className="text-[11.5px] text-muted-foreground leading-tight">
              evaluations
              <br />
              per year
            </span>
          </div>
          <div className="mt-1 text-[10.5px] text-muted-foreground">
            <span className="font-mono text-emerald-700">▲ 28% YoY</span>
            <span className="mx-1.5 text-zinc-300">·</span>
            across <span className="font-mono text-foreground/75">185</span> countries
          </div>
        </div>

        {/* sparkline */}
        <svg viewBox={`0 0 ${sparkW} ${sparkH}`} preserveAspectRatio="none" className="w-full h-[42px]" aria-hidden>
          <defs>
            <linearGradient id="scaleSpark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#scaleSpark)" />
          <path d={linePath} fill="none" stroke="#0284c7" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={lastPt[0]} cy={lastPt[1]} r="3" fill="#0284c7" />
          <circle cx={lastPt[0]} cy={lastPt[1]} r="6" fill="#0ea5e9" opacity="0.18" />
        </svg>

        {/* 3-up support stats */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-sky-500/15">
          <div className="min-w-0">
            <div className="font-mono text-[13.5px] font-semibold tabular-nums text-zinc-900 leading-none">
              99.99%
            </div>
            <div className="mt-1 text-[9.5px] text-muted-foreground">uptime</div>
          </div>
          <div className="min-w-0">
            <div className="font-mono text-[13.5px] font-semibold tabular-nums text-zinc-900 leading-none">
              95%+
            </div>
            <div className="mt-1 text-[9.5px] text-muted-foreground">vs experts</div>
          </div>
          <div className="min-w-0">
            <div className="font-mono text-[13.5px] font-semibold tabular-nums text-zinc-900 leading-none">
              20 yrs
            </div>
            <div className="mt-1 text-[9.5px] text-muted-foreground">research</div>
          </div>
        </div>
      </div>

      {/* RIGHT — trusted-by + compact proof rows */}
      <div className="flex flex-col gap-1.5 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-[9.5px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
            trusted by
          </span>
          <span className="text-[9.5px] font-mono text-zinc-400">3 cohorts</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {trusted.map((t) => (
            <span
              key={t}
              className="inline-flex items-center rounded-md border border-zinc-900/[0.08] bg-white/70 px-1.5 py-0.5 text-[10px] font-medium text-zinc-700"
            >
              {t}
            </span>
          ))}
        </div>

        <div className="mt-0.5 flex flex-col gap-1">
          {proofs.map((p) => (
            <div
              key={p.label}
              className="flex items-center gap-1.5 text-[11px] leading-tight"
            >
              <Check className="h-3 w-3 text-sky-600 shrink-0" strokeWidth={3} />
              <span className="font-semibold text-zinc-800 whitespace-nowrap">
                {p.label}
              </span>
              <span className="text-muted-foreground truncate">· {p.body}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* Slide 02 — Mandarin depth. Horizontal strip:
 * LEFT  → big Hanzi + pinyin + sandhi chip (the "what we resolved")
 * RIGHT → compact F0 pitch contour, Chao 5-level, with produced vs
 *         citation traces. The plot stays the visual hero. */
function HeroSlideMandarin() {
  // y(v): map tone level (1..5) into svg viewBox 0..80
  const y = (v: number) => 8 + ((5 - v) * 64) / 4;
  return (
    <div className="h-full p-3.5 grid grid-cols-[0.8fr_1.2fr] gap-2.5 items-stretch">
      {/* LEFT — target word card */}
      <div className="flex flex-col justify-center gap-1 min-w-0">
        <div className="text-[9.5px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
          target · zh-CN
        </div>
        <div className="font-zh text-[40px] leading-none tracking-tight text-zinc-900">水饺</div>
        <div className="font-pinyin text-[12.5px] text-zinc-700 leading-tight">
          shuǐ jiǎo
          <span className="text-zinc-400"> · dumplings</span>
        </div>
        <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-mono whitespace-nowrap">
          <span className="rounded border border-zinc-900/[0.08] bg-white/70 px-1 py-[1px] text-zinc-700">
            T3·T3
          </span>
          <ArrowRight className="h-2.5 w-2.5 text-emerald-600 shrink-0" />
          <span className="rounded border border-emerald-500/35 bg-emerald-50 px-1 py-[1px] text-emerald-700">
            T2·T3 sandhi
          </span>
        </div>
        <div className="mt-1 text-[9.5px] text-zinc-500 leading-snug">
          generic STT hears <span className="font-zh text-zinc-700">睡觉</span> — wrong tones.
        </div>
      </div>

      {/* RIGHT — pitch contour */}
      <div className="rounded-xl border border-zinc-900/[0.08] bg-gradient-to-br from-white/75 to-emerald-50/45 backdrop-blur-sm px-3 py-2 flex flex-col min-h-0">
        <div className="flex items-center justify-between text-[9.5px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
          <span>F0 · 5-level Chao</span>
          <span className="inline-flex items-center gap-1 text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            locked to tone
          </span>
        </div>
        <svg viewBox="0 0 360 90" className="w-full h-auto" aria-hidden>
          <defs>
            <linearGradient id="traceGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="55%" stopColor="#059669" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
          </defs>
          {[1, 2, 3, 4, 5].map((lvl) => (
            <g key={lvl}>
              <line x1="22" x2="350" y1={y(lvl)} y2={y(lvl)} stroke="rgba(24,24,27,0.06)" />
              <text x="8" y={y(lvl) + 3} fontSize="7.5" fontFamily="ui-monospace, monospace" fill="rgba(24,24,27,0.35)">
                {lvl}
              </text>
            </g>
          ))}
          <line x1="184" x2="184" y1="8" y2="76" stroke="rgba(24,24,27,0.08)" strokeDasharray="3 3" />
          <path
            d="M 30 56 C 70 54, 110 28, 170 12 L 184 12
               M 198 38 C 222 38, 240 76, 264 72 C 288 68, 308 50, 340 16"
            fill="none"
            stroke="url(#traceGrad)"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 30 38 C 60 76, 100 78, 140 56 C 158 42, 172 18, 184 14
               M 198 38 C 222 76, 252 78, 282 56 C 300 42, 318 18, 336 14"
            fill="none"
            stroke="rgba(16,185,129,0.35)"
            strokeWidth="1.3"
            strokeDasharray="3 3"
            strokeLinecap="round"
          />
          <circle cx="340" cy="16" r="3" fill="#059669" />
          <circle cx="340" cy="16" r="5.5" fill="#10b981" opacity="0.18" />
          <text x="100" y="86" fontSize="8" fontFamily="ui-monospace, monospace" fill="rgba(16,185,129,0.85)" textAnchor="middle">
            shuǐ · rising
          </text>
          <text x="265" y="86" fontSize="8" fontFamily="ui-monospace, monospace" fill="rgba(16,185,129,0.85)" textAnchor="middle">
            jiǎo · dip–rise
          </text>
        </svg>
        <div className="flex items-center gap-3 pt-1 text-[9.5px] font-mono text-zinc-500">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-[2px] w-3.5 rounded-full bg-emerald-600" />
            produced
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-[2px] w-3.5 rounded-full border-t border-dashed border-emerald-500/60" />
            citation
          </span>
          <span className="ml-auto text-emerald-700">Δ ≈ 6 cents</span>
        </div>

        {/* Tonal events resolved — single-line ticks, no row cards,
         * so the bottom block stays under one card-height even at the
         * narrowest hero-card width. */}
        <div className="mt-1.5 pt-1.5 border-t border-emerald-500/15 flex flex-col gap-0.5 min-h-0">
          <div className="flex items-center justify-between text-[9.5px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
            <span>tonal events</span>
            <span className="text-emerald-700 normal-case tracking-normal">2 / 2</span>
          </div>
          {[
            { syl: 'shuǐ', detail: 'T3→T2 sandhi' },
            { syl: 'jiǎo', detail: 'T3 dip–rise' },
          ].map((r) => (
            <div key={r.syl} className="flex items-center gap-1.5 text-[10px] leading-tight">
              <Check className="h-2.5 w-2.5 text-emerald-600 shrink-0" strokeWidth={3} />
              <span className="font-pinyin text-emerald-800 w-8 shrink-0">{r.syl}</span>
              <span className="font-mono text-zinc-600 truncate">{r.detail}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* Slide 03 — Reasoning-ready payload: JSON → agent reply */
/* ── Hero slide 3 — phoneme-level diagnostics.
 *    What the listening layer actually *hears* — per-phoneme
 *    accuracy bars plus supra-segmental cues (stress, liaison,
 *    intonation). Intentionally granular; no prose.
 * ───────────────────────────────────────────────────────── */
/* Slide 03 — Phoneme diagnosis. Horizontal strip:
 * LEFT  → target word + IPA + supra-segmental chips
 * RIGHT → 4 phoneme bars (top) + ms-timeline (bottom),
 *         color-coded by status. */
function HeroSlidePhoneme() {
  const phones: Array<{
    ipa: string;
    v: number;
    ms: number;
    status: 'ok' | 'weak' | 'bad' | 'dropped';
    note?: string;
  }> = [
    { ipa: '/θ/', v: 35, ms: 110, status: 'bad',     note: 'heard /s/' },
    { ipa: '/ɪ/', v: 92, ms: 130, status: 'ok' },
    { ipa: '/ŋ/', v: 54, ms: 100, status: 'weak',    note: 'weak release' },
    { ipa: '/k/', v: 0,  ms: 0,   status: 'dropped', note: 'dropped' },
  ];
  const totalMs = phones.reduce((sum, p) => sum + (p.ms || 60), 0);
  const barCls = (s: (typeof phones)[number]['status']) =>
    s === 'ok'      ? 'bg-gradient-to-t from-emerald-400 to-emerald-600'
    : s === 'weak'  ? 'bg-gradient-to-t from-amber-300 to-amber-500'
    : s === 'bad'   ? 'bg-gradient-to-t from-rose-400 to-rose-600'
    :                 'bg-transparent border border-dashed border-rose-400';
  const chipCls = (s: (typeof phones)[number]['status']) =>
    s === 'ok'      ? 'bg-emerald-50 text-emerald-700 border-emerald-500/30'
    : s === 'weak'  ? 'bg-amber-50 text-amber-700 border-amber-500/40'
    :                 'bg-rose-50 text-rose-700 border-rose-500/30';
  const segCls = (s: (typeof phones)[number]['status']) =>
    s === 'ok'      ? 'bg-emerald-500'
    : s === 'weak'  ? 'bg-amber-400'
    : s === 'bad'   ? 'bg-rose-500'
    :                 'bg-rose-200/50 border border-dashed border-rose-400 [background-image:repeating-linear-gradient(45deg,transparent_0_4px,rgba(244,63,94,0.18)_4px_8px)]';
  return (
    <div className="h-full p-3.5 grid grid-cols-[120px_1fr] gap-2.5 items-stretch">
      {/* LEFT — word + meta */}
      <div className="flex flex-col justify-center gap-1 min-w-0">
        <div className="text-[9.5px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
          word · en
        </div>
        <div className="text-[30px] font-semibold tracking-tight text-zinc-900 leading-none">
          think
        </div>
        <div className="font-mono text-[13px] text-zinc-600">/θɪŋk/</div>
        <div className="mt-1 flex flex-wrap gap-1">
          <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-50 text-emerald-700">
            stress · ok
          </span>
          <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-50 text-emerald-700">
            ↘ falling
          </span>
        </div>
        <div className="mt-1 text-[10px] text-zinc-500 leading-snug">
          <span className="font-mono font-semibold text-violet-700">60+ phonemes</span> scored —
          not a single opaque number.
        </div>
      </div>

      {/* RIGHT — phoneme bars + ms timeline */}
      <div className="rounded-xl border border-zinc-900/[0.08] bg-white/65 backdrop-blur-sm px-2.5 py-2 min-h-0 flex flex-col">
        <div className="grid grid-cols-4 gap-1.5">
          {phones.map((p, i) => (
            <div key={i} className="flex flex-col items-center gap-1 min-w-0">
              <div className="relative h-[54px] w-full flex items-end">
                <div className="absolute inset-x-0 top-0 h-px bg-zinc-900/[0.06]" />
                <div className="absolute inset-x-0 top-1/2 h-px bg-zinc-900/[0.04]" />
                <div
                  className={`mx-auto w-6 rounded-t-[3px] ${barCls(p.status)}`}
                  style={{
                    height: `${Math.max(p.v, p.status === 'dropped' ? 100 : 0)}%`,
                    minHeight: p.status === 'dropped' ? '100%' : '4px',
                  }}
                />
              </div>
              <div
                className="font-mono text-[12px] font-semibold tabular-nums"
                style={{ fontFamily: 'var(--font-hero-serif, "Fraunces", Georgia, serif)' }}
              >
                {p.ipa}
              </div>
              <div className={`text-[9.5px] font-mono uppercase tracking-wider px-1.5 py-[1px] rounded-md border ${chipCls(p.status)}`}>
                {p.status === 'dropped' ? '—' : `${p.v}%`}
              </div>
              <div className="min-h-[12px] text-[9.5px] font-mono text-muted-foreground text-center leading-tight truncate w-full">
                {p.note ?? '\u00A0'}
              </div>
            </div>
          ))}
        </div>

        {/* ms timeline — same data, replayed horizontally so the
         * bottom of the card carries information instead of empty
         * space. Each segment width is proportional to phoneme
         * duration; dropped phoneme is a dashed gap. */}
        <div className="mt-auto pt-2.5 border-t border-zinc-900/[0.06]">
          <div className="flex items-center justify-between text-[9.5px] font-mono uppercase tracking-[0.16em] text-muted-foreground mb-1">
            <span>timing · ms</span>
            <span className="normal-case tracking-normal text-foreground/70">
              {totalMs} ms · 1 dropped
            </span>
          </div>
          <div className="flex h-2.5 rounded-full overflow-hidden gap-[2px]">
            {phones.map((p, i) => {
              const w = (p.ms || 60) / totalMs;
              return (
                <div
                  key={i}
                  className={cn('h-full', segCls(p.status))}
                  style={{ flex: `${Math.max(w, 0.18)} 1 0%` }}
                  title={`${p.ipa} · ${p.ms} ms`}
                />
              );
            })}
          </div>
          <div className="mt-1 flex text-[9px] font-mono text-muted-foreground gap-[2px]">
            {phones.map((p, i) => {
              const w = (p.ms || 60) / totalMs;
              return (
                <span
                  key={i}
                  className="text-center tabular-nums"
                  style={{ flex: `${Math.max(w, 0.18)} 1 0%` }}
                >
                  {p.ms ? `${p.ms}` : '—'}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* Slide 04 — Reasoning-ready payload. Horizontal strip:
 * LEFT  → designed schema view (overall · sub-scores · phoneme chips),
 *         not a raw JSON dump
 * RIGHT → an LLM-authored coaching reply derived from the payload. */
function HeroSlideReasoning() {
  const subScores: { key: string; val: number }[] = [
    { key: 'pron.accuracy',   val: 44 },
    { key: 'pron.integrity',  val: 90 },
    { key: 'pron.fluency',    val: 72 },
    { key: 'pron.rhythm',     val: 65 },
  ];
  const phonemes: { ipa: string; v: number; status: 'ok' | 'weak' | 'bad' | 'dropped' }[] = [
    { ipa: 'θ', v: 35, status: 'bad' },
    { ipa: 'ɪ', v: 88, status: 'ok' },
    { ipa: 'ŋ', v: 54, status: 'weak' },
    { ipa: 'k', v: 0,  status: 'dropped' },
  ];
  const phChip = (s: (typeof phonemes)[number]['status']) =>
    s === 'ok'      ? 'bg-emerald-50 border-emerald-500/30 text-emerald-700'
    : s === 'weak'  ? 'bg-amber-50 border-amber-500/35 text-amber-700'
    : s === 'bad'   ? 'bg-rose-50 border-rose-500/30 text-rose-700'
    :                 'bg-rose-50 border-rose-500/30 text-rose-700/80 line-through';
  return (
    <div className="h-full p-3.5 grid grid-cols-[1.1fr_1fr] gap-2.5 items-stretch">
      {/* LEFT — schema-visualizer card */}
      <div className="rounded-xl border border-zinc-900/[0.08] bg-gradient-to-br from-white/80 via-white/65 to-amber-50/35 backdrop-blur-sm flex flex-col gap-1 p-2.5 min-h-0 overflow-hidden">
        <div className="flex items-center justify-between text-[9.5px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
          <span>response · application/json</span>
          <span className="text-amber-700 normal-case tracking-normal">14 fields</span>
        </div>

        {/* overall — hero score row */}
        <div className="flex items-baseline gap-2.5 rounded-lg bg-amber-500/[0.07] border border-amber-500/20 px-2.5 py-1.5">
          <span className="font-mono text-[10px] uppercase tracking-wider text-amber-800/70">overall</span>
          <span className="font-mono text-[22px] font-semibold tabular-nums text-amber-700 leading-none">48</span>
          <span className="ml-auto text-[10px] font-mono text-amber-700/60">/100</span>
        </div>

        {/* sub-scores · 2x2 grid */}
        <div className="grid grid-cols-2 gap-1.5">
          {subScores.map((r) => (
            <div
              key={r.key}
              className="flex items-center justify-between rounded-md border border-zinc-900/[0.06] bg-white/70 px-2 py-1"
            >
              <span className="font-mono text-[9.5px] text-zinc-500 truncate">{r.key}</span>
              <span className="font-mono text-[11px] font-semibold tabular-nums text-zinc-800 ml-2 shrink-0">{r.val}</span>
            </div>
          ))}
        </div>

        {/* details — single-word row */}
        <div className="flex items-center gap-2 rounded-md border border-zinc-900/[0.06] bg-white/70 px-2 py-1.5">
          <span className="font-mono text-[9.5px] uppercase tracking-wider text-zinc-500">details[0]</span>
          <span className="font-mono text-[11px] text-zinc-800 font-medium">&quot;think&quot;</span>
          <span className="font-mono text-[9.5px] text-zinc-500">2400–2910 ms</span>
          <span className="ml-auto inline-flex items-center text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border border-rose-500/30 bg-rose-50 text-rose-700">
            mispron
          </span>
        </div>

        {/* phoneme chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {phonemes.map((p) => (
            <span
              key={p.ipa}
              className={cn(
                'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[10px] border',
                phChip(p.status),
              )}
            >
              <span style={{ fontFamily: 'var(--font-hero-serif, "Fraunces", Georgia, serif)' }}>
                /{p.ipa}/
              </span>
              <span className="tabular-nums opacity-80">
                {p.status === 'dropped' ? '—' : p.v}
              </span>
            </span>
          ))}
          <span className="ml-auto text-[9.5px] font-mono text-muted-foreground">+ 60 fields</span>
        </div>
      </div>

      {/* RIGHT — agent reply */}
      <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/[0.07] to-white/40 backdrop-blur-sm p-3 flex flex-col gap-2 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-700">
            <Sparkles className="h-3 w-3" />
          </span>
          <span className="text-[9.5px] font-mono uppercase tracking-wider text-amber-700">
            agent reply · auto-generated
          </span>
        </div>
        <p className="text-[12px] leading-[1.55] text-foreground/85">
          &ldquo;You said <strong>think</strong> as <em>sink</em>. Place your tongue between your
          teeth for{' '}
          <code className="font-mono text-[11px] px-1 py-0.5 rounded bg-white/60 border border-zinc-900/[0.06]">
            /θ/
          </code>
          . Try: <em>&ldquo;Thirty thirsty thinkers&hellip;&rdquo;</em>&rdquo;
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 text-[9.5px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
          <span>plays nicely with</span>
          <span className="text-foreground/70">o1 · Sonnet · Gemini</span>
        </div>
      </div>
    </div>
  );
}

/* ── Hero product card — audio → Chivox MCP → JSON scores ─ */
function HeroProductCard() {
  // Deterministic-ish waveform bars so every render looks the same.
  const bars = Array.from({ length: 56 }).map((_, i) => {
    const x = i / 55;
    const h = 0.18 + 0.82 * Math.abs(Math.sin(x * Math.PI * 3) * Math.sin(x * Math.PI + 1.1));
    return Math.max(0.1, Math.min(1, h));
  });

  return (
    <div className="relative">
      {/* decorative glow */}
      <div className="absolute -inset-4 rounded-3xl bg-foreground/[0.04] blur-2xl pointer-events-none" />

      <div className="relative glass-card overflow-hidden shadow-[0_24px_80px_-24px_rgba(0,0,0,0.18)]">
        {/* faux window chrome */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-900/[0.08] bg-white/40 backdrop-blur-sm">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
          </div>
          <div className="text-[11px] font-mono text-muted-foreground">chivox · assess_speech</div>
          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">live</span>
        </div>

        {/* input row — waveform + reference text */}
        <div className="p-5 md:p-6 border-b border-border/60">
          <div className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground mb-2.5">
            input · audio
          </div>
          <div
            className="rounded-xl px-4 py-4 overflow-hidden border border-zinc-900/[0.08]"
            style={{
              background:
                'linear-gradient(135deg, rgba(24,24,27,0.82) 0%, rgba(39,39,42,0.68) 50%, rgba(24,24,27,0.82) 100%)',
              backdropFilter: 'blur(16px) saturate(140%)',
              WebkitBackdropFilter: 'blur(16px) saturate(140%)',
              boxShadow:
                'inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 24px -12px rgba(0,0,0,0.3)',
            }}
          >
            <div className="flex items-end gap-[3px] h-14">
              {bars.map((h, i) => (
                <span
                  key={i}
                  className="inline-block w-[4px] rounded-[2px] bg-gradient-to-t from-emerald-400/40 via-emerald-300/80 to-emerald-200"
                  style={{
                    height: `${(h * 100).toFixed(2)}%`,
                    animation: `wave-bar 1.2s ease-in-out ${i * 25}ms infinite`,
                    transformOrigin: 'bottom',
                  }}
                />
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <span>00:00.00</span>
              <span className="text-zinc-500">recording · 16kHz mono</span>
              <span>00:02.34</span>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs">
            <span className="font-mono text-muted-foreground">reference_text:</span>
            <span className="text-foreground/90">&quot;The weather is absolutely gorgeous today.&quot;</span>
          </div>
        </div>

        {/* output row — structured scores */}
        <div className="p-5 md:p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">
              output · json
            </div>
            <span className="text-[10.5px] font-mono text-muted-foreground">latency · 187 ms</span>
          </div>

          {/* 4 score meters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
            {[
              { k: 'overall', v: 82 },
              { k: 'accuracy', v: 78 },
              { k: 'fluency', v: 84 },
              { k: 'rhythm', v: 80 },
            ].map((s) => (
              <ScoreMeter key={s.k} label={s.k} value={s.v} />
            ))}
          </div>

          {/* phoneme row */}
          <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
              words · per-phoneme diagnostics
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
              <WordChip word="The" tone="ok" />
              <WordChip word="weather" tone="ok" />
              <WordChip word="is" tone="ok" />
              <WordChip word="absolutely" tone="warn" score={63} />
              <WordChip word="gorgeous" tone="bad" score={44} />
              <WordChip word="today" tone="ok" />
            </div>
            <div className="mt-3 text-[11px] text-muted-foreground leading-relaxed">
              <span className="font-mono text-foreground/80">gorgeous</span>{' '}
              · <span className="font-mono text-rose-500">/ˈɡɔːrdʒəs/</span> → realized as{' '}
              <span className="font-mono text-rose-500">/ˈɡɔːrʒəs/</span>. Land the{' '}
              <span className="font-mono text-foreground">/d/</span> stop before the{' '}
              <span className="font-mono text-foreground">/ʒ/</span> fricative.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreMeter({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  const color =
    pct >= 80 ? 'bg-emerald-500' : pct >= 65 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className="rounded-lg border border-border/60 bg-background px-3 py-2.5">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-[10.5px] font-mono text-muted-foreground">{label}</span>
        <span className="text-sm font-semibold tabular-nums">{pct}</span>
      </div>
      <div className="h-1 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-[width] duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function WordChip({ word, tone, score }: { word: string; tone: 'ok' | 'warn' | 'bad'; score?: number }) {
  const styles: Record<string, string> = {
    ok: 'border-border/60 bg-background text-foreground/80',
    warn: 'border-amber-300/70 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30',
    bad: 'border-rose-300/70 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/30',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 ${styles[tone]}`}
    >
      {word}
      {score !== undefined ? (
        <span className="text-[9.5px] opacity-80 tabular-nums">· {score}</span>
      ) : null}
    </span>
  );
}

/* ── Phoneme breakdown panel (English) ──────────────────── */
function PhonemePanel() {
  const phonemes = [
    { p: 'ɡ', score: 82 },
    { p: 'ɔː', score: 74 },
    { p: 'dʒ', score: 44 },
    { p: 'ə', score: 88 },
    { p: 's', score: 91 },
  ];
  return (
    <div className="relative rounded-2xl border border-border/60 bg-background p-6 md:p-7 h-full overflow-hidden">
      {/* subtle accent */}
      <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-indigo-400/10 blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200/70 bg-indigo-50/70 dark:bg-indigo-500/10 dark:border-indigo-500/30 px-2 py-0.5 text-[10px] font-medium text-indigo-700 dark:text-indigo-300 tracking-wide uppercase mb-2">
            English · phoneme alignment
          </div>
          <h3 className="text-2xl font-semibold tracking-[-0.015em] leading-tight">
            &ldquo;gorgeous&rdquo;
          </h3>
          <div className="mt-1 font-mono text-sm text-muted-foreground">/ˈɡɔːdʒəs/</div>
        </div>
        <ScoreBadge value={63} label="word score" />
      </div>

      <div className="space-y-2.5">
        {phonemes.map((ph) => {
          const tone = ph.score >= 80 ? 'ok' : ph.score >= 65 ? 'warn' : 'bad';
          const badge = {
            ok: 'border-emerald-200/70 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30',
            warn: 'border-amber-200/70 bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30',
            bad: 'border-rose-300/70 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/30',
          }[tone];
          const bar = {
            ok: 'bg-emerald-500',
            warn: 'bg-amber-500',
            bad: 'bg-rose-500',
          }[tone];
          return (
            <div key={ph.p} className="flex items-center gap-3">
              <code
                className={`shrink-0 min-w-[64px] text-center rounded-md border px-2 py-1.5 font-mono text-[13px] ${badge}`}
              >
                /{ph.p}/
              </code>
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full ${bar} transition-[width] duration-700`}
                  style={{ width: `${ph.score}%` }}
                />
              </div>
              <div className="w-10 text-right text-sm font-semibold tabular-nums">{ph.score}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-xl border border-indigo-200/60 bg-indigo-50/50 dark:bg-indigo-500/[0.06] dark:border-indigo-500/25 p-3.5 text-xs leading-relaxed">
        <span className="font-semibold text-indigo-800 dark:text-indigo-200">LLM hint · </span>
        <span className="text-foreground/85">
          /dʒ/ collapsed to a plain /ʒ/ — the stop onset was lost. Land the stop before the fricative — drill
          {' '}
          <em className="not-italic font-medium text-foreground">judge</em>,{' '}
          <em className="not-italic font-medium text-foreground">badge</em>,{' '}
          <em className="not-italic font-medium text-foreground">gorgeous</em>.
        </span>
      </div>
    </div>
  );
}

/* ── Bilingual score panel — toggle between Mandarin & English ── */
function BilingualScorePanel() {
  const [lang, setLang] = useState<'zh' | 'en'>('zh');
  const isZh = lang === 'zh';

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-0.5 rounded-full border border-zinc-900/[0.08] bg-white/70 backdrop-blur-sm p-0.5">
          <button
            type="button"
            onClick={() => setLang('zh')}
            aria-pressed={isZh}
            className={`rounded-full px-3 py-1 text-[12px] font-medium transition-all duration-200 ${
              isZh
                ? 'bg-rose-500/12 text-rose-900 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.22)]'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Mandarin
          </button>
          <button
            type="button"
            onClick={() => setLang('en')}
            aria-pressed={!isZh}
            className={`rounded-full px-3 py-1 text-[12px] font-medium transition-all duration-200 ${
              !isZh
                ? 'bg-sky-500/12 text-sky-900 shadow-[inset_0_0_0_1px_rgba(14,165,233,0.22)]'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            English
          </button>
        </div>
      </div>

      <div
        key={lang}
        className="animate-[qd-line-in_360ms_cubic-bezier(0.22,1,0.36,1)]"
      >
        {isZh ? <TonePanel /> : <EnglishWordPanel />}
      </div>
    </div>
  );
}

/* ── English word/phoneme panel — same layout as TonePanel ──── */
function EnglishWordPanel() {
  // Sentence row: each word with its IPA, stress pattern hint, and score.
  const words: {
    word: string;
    ipa: string;
    stress: 'pri' | 'sec' | 'unstressed';
    score: number;
    ok: boolean;
  }[] = [
    { word: 'The', ipa: 'ðə', stress: 'unstressed', score: 92, ok: true },
    { word: 'weather', ipa: 'ˈwɛðər', stress: 'pri', score: 88, ok: true },
    { word: 'is', ipa: 'ɪz', stress: 'unstressed', score: 90, ok: true },
    { word: 'absolutely', ipa: 'ˌæbsəˈluːtli', stress: 'pri', score: 71, ok: true },
    { word: 'gorgeous', ipa: 'ˈɡɔːrdʒəs', stress: 'pri', score: 58, ok: false },
    { word: 'today', ipa: 'təˈdeɪ', stress: 'pri', score: 86, ok: true },
  ];

  // Stress glyph → small mark above the cell so it parallels the tone contour SVG.
  const STRESS_COLOR: Record<string, { ink: string; chip: string }> = {
    pri: {
      ink: 'text-sky-600',
      chip: 'border-sky-200/70 text-sky-700 bg-sky-50',
    },
    sec: {
      ink: 'text-indigo-600',
      chip: 'border-indigo-200/70 text-indigo-700 bg-indigo-50',
    },
    unstressed: {
      ink: 'text-zinc-500',
      chip: 'border-zinc-200/70 text-zinc-600 bg-zinc-50',
    },
  };

  const STRESS_LABEL: Record<string, string> = {
    pri: 'ˈ pri',
    sec: 'ˌ sec',
    unstressed: '· unstr',
  };

  return (
    <div className="relative rounded-2xl border border-border/60 bg-background p-6 md:p-7 h-full overflow-hidden">
      <div className="absolute -top-20 -left-20 h-56 w-56 rounded-full bg-sky-400/10 blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between mb-5 gap-4">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-sky-200/70 bg-sky-50/70 px-2 py-0.5 text-[10px] font-medium text-sky-700 tracking-wide uppercase mb-2">
            English · phoneme depth
          </div>
          <h3 className="text-2xl font-semibold tracking-[-0.015em] leading-tight truncate">
            The weather is absolutely gorgeous today
          </h3>
          <div className="mt-1 text-sm text-muted-foreground font-mono truncate">
            /ðə ˈwɛðər ɪz ˌæbsəˈluːtli ˈɡɔːrdʒəs təˈdeɪ/
          </div>
        </div>
        <ScoreBadge value={76} label="sentence score" />
      </div>

      {/* sentence strip: 6 word cards parallel to TonePanel's syllable grid */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
        {words.map((w, idx) => {
          const c = STRESS_COLOR[w.stress];
          return (
            <div
              key={idx}
              className={`relative rounded-xl border p-2.5 flex flex-col items-center text-center min-w-0 ${
                w.ok
                  ? 'border-border/60 bg-muted/25'
                  : 'border-rose-300/70 bg-rose-50'
              }`}
            >
              <div className="text-[15px] md:text-[16px] leading-tight font-semibold tracking-tight text-foreground truncate w-full">
                {w.word}
              </div>
              <div className={`font-mono text-[10.5px] mt-1 leading-[1.3] ${c.ink} truncate w-full`}>
                /{w.ipa}/
              </div>
              <div className={`mt-2 inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9.5px] font-mono whitespace-nowrap ${c.chip}`}>
                {STRESS_LABEL[w.stress]}
              </div>
              <div className="mt-2 w-full h-1 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    w.score >= 80
                      ? 'bg-emerald-500'
                      : w.score >= 65
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                  }`}
                  style={{ width: `${w.score}%` }}
                />
              </div>
              <div className="mt-1 text-[11px] font-semibold tabular-nums">{w.score}</div>
            </div>
          );
        })}
      </div>

      {/* stress legend — parallel to the tone legend in TonePanel */}
      <div className="mt-5 flex items-center flex-wrap gap-x-4 gap-y-1.5 text-[11px]">
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">stress</span>
        {(['pri', 'sec', 'unstressed'] as const).map((s) => {
          const c = STRESS_COLOR[s];
          return (
            <span key={s} className={`inline-flex items-center gap-1 ${c.ink}`}>
              <span className="font-mono text-[10.5px]">{STRESS_LABEL[s]}</span>
            </span>
          );
        })}
        <span className="ml-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">cefr</span>
        <span className="font-mono text-[10.5px] text-emerald-700">B2</span>
      </div>

      <div className="mt-4 rounded-xl border border-sky-200/60 bg-sky-50/50 p-3.5 text-xs leading-relaxed">
        <span className="font-semibold text-sky-800">LLM hint · </span>
        <span className="text-foreground/85">
          <em className="not-italic font-medium font-mono text-foreground">gorgeous</em>{' '}
          <span className="font-mono text-sky-700">/ˈɡɔːrdʒəs/</span> realised as{' '}
          <span className="font-mono text-rose-600">/ˈɡɔːrʒəs/</span> — the{' '}
          <span className="font-mono text-foreground">/d/</span> stop dropped before{' '}
          <span className="font-mono text-foreground">/ʒ/</span>. Drill{' '}
          <em className="not-italic font-medium">judge · badge · gorgeous</em>.
        </span>
      </div>
    </div>
  );
}

/* ── Tone panel (Mandarin) ─────────────────────────────── */
function TonePanel() {
  // Canonical pinyin pitch contours in a 24×24 grid (y inverted so top = high pitch).
  const CONTOURS: Record<number, string> = {
    1: 'M2 6 L22 6',
    2: 'M2 18 Q12 18 22 6',
    3: 'M2 8 Q12 22 22 8',
    4: 'M2 6 L22 20',
  };
  // Per-tone accent color so the sentence strip reads at a glance.
  const TONE_COLOR: Record<number, { ink: string; bg: string; chip: string }> = {
    1: {
      ink: 'text-rose-600 dark:text-rose-300',
      bg: 'bg-rose-50 dark:bg-rose-500/10',
      chip: 'border-rose-200/70 text-rose-700 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/30',
    },
    2: {
      ink: 'text-amber-600 dark:text-amber-300',
      bg: 'bg-amber-50 dark:bg-amber-500/10',
      chip: 'border-amber-200/70 text-amber-800 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30',
    },
    3: {
      ink: 'text-sky-600 dark:text-sky-300',
      bg: 'bg-sky-50 dark:bg-sky-500/10',
      chip: 'border-sky-200/70 text-sky-700 bg-sky-50 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/30',
    },
    4: {
      ink: 'text-violet-600 dark:text-violet-300',
      bg: 'bg-violet-50 dark:bg-violet-500/10',
      chip: 'border-violet-200/70 text-violet-700 bg-violet-50 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/30',
    },
  };

  const syllables: {
    hanzi: string;
    pinyin: string;
    tone: 1 | 2 | 3 | 4;
    score: number;
    ok: boolean;
  }[] = [
    { hanzi: '你', pinyin: 'nǐ', tone: 3, score: 85, ok: true },
    { hanzi: '好', pinyin: 'hǎo', tone: 3, score: 72, ok: true },
    { hanzi: '今', pinyin: 'jīn', tone: 1, score: 88, ok: true },
    { hanzi: '天', pinyin: 'tiān', tone: 1, score: 88, ok: true },
    { hanzi: '天', pinyin: 'tiān', tone: 1, score: 58, ok: false },
    { hanzi: '气', pinyin: 'qì', tone: 4, score: 91, ok: true },
  ];

  return (
    <div className="relative rounded-2xl border border-border/60 bg-background p-6 md:p-7 h-full overflow-hidden">
      {/* subtle accent */}
      <div className="absolute -top-20 -left-20 h-56 w-56 rounded-full bg-rose-400/10 blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-200/70 bg-rose-50/70 dark:bg-rose-500/10 dark:border-rose-500/30 px-2 py-0.5 text-[10px] font-medium text-rose-700 dark:text-rose-300 tracking-wide uppercase mb-2">
            Mandarin · tone accuracy
          </div>
          <h3 className="text-2xl font-semibold tracking-[-0.015em] leading-tight font-zh">
            你好，今天天气……
          </h3>
          <div className="mt-1 text-sm text-muted-foreground font-pinyin">
            nǐ hǎo, jīn tiān tiān qì
          </div>
        </div>
        <ScoreBadge value={78} label="sentence score" tone="rose" />
      </div>

      {/* sentence strip: big hanzi, pinyin, tone glyph, score */}
      <div className="grid grid-cols-6 gap-1.5">
        {syllables.map((s, idx) => {
          const c = TONE_COLOR[s.tone];
          return (
            <div
              key={idx}
              className={`relative rounded-xl border p-2.5 flex flex-col items-center text-center ${
                s.ok
                  ? 'border-border/60 bg-muted/25'
                  : 'border-rose-300/70 bg-rose-50 dark:bg-rose-500/10 dark:border-rose-500/35'
              }`}
            >
              {/* hanzi */}
              <div className="font-zh text-3xl md:text-[30px] leading-none font-medium tracking-tight">
                {s.hanzi}
              </div>
              {/* pinyin */}
              <div className={`font-pinyin text-[13px] mt-1.5 leading-[1.35] ${c.ink}`}>
                {s.pinyin}
              </div>
              {/* tone contour glyph */}
              <div className={`mt-2 inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-mono ${c.chip}`}>
                <svg viewBox="0 0 24 24" className="h-3 w-3.5">
                  <path
                    d={CONTOURS[s.tone]}
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
                T{s.tone}
              </div>
              {/* score bar */}
              <div className="mt-2 w-full h-1 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    s.score >= 80
                      ? 'bg-emerald-500'
                      : s.score >= 65
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                  }`}
                  style={{ width: `${s.score}%` }}
                />
              </div>
              <div className="mt-1 text-[11px] font-semibold tabular-nums">{s.score}</div>
            </div>
          );
        })}
      </div>

      {/* tone legend */}
      <div className="mt-5 flex items-center flex-wrap gap-x-4 gap-y-1.5 text-[11px]">
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">tones</span>
        {[1, 2, 3, 4].map((t) => {
          const c = TONE_COLOR[t as 1 | 2 | 3 | 4];
          return (
            <span key={t} className={`inline-flex items-center gap-1 ${c.ink}`}>
              <svg viewBox="0 0 24 24" className="h-3 w-4">
                <path
                  d={CONTOURS[t]}
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
              <span className="font-mono">T{t}</span>
            </span>
          );
        })}
      </div>

      <div className="mt-4 rounded-xl border border-rose-200/60 bg-rose-50/50 dark:bg-rose-500/[0.06] dark:border-rose-500/25 p-3.5 text-xs leading-relaxed">
        <span className="font-semibold text-rose-800 dark:text-rose-200">LLM hint · </span>
        <span className="text-foreground/85">
          second <em className="not-italic font-medium font-zh text-foreground">天</em>{' '}
          <span className="font-pinyin">(tiān)</span> collapsed into T4. Keep the pitch high and steady —
          it&rsquo;s a T1.
        </span>
      </div>
    </div>
  );
}

/* ── Reusable: big score badge (top-right of panels) ────── */
function ScoreBadge({
  value,
  label,
  tone = 'indigo',
}: {
  value: number;
  label: string;
  tone?: 'indigo' | 'rose';
}) {
  const bg =
    tone === 'rose'
      ? 'from-rose-500 to-orange-500'
      : 'from-indigo-500 to-violet-500';
  return (
    <div className="text-right">
      <div
        className={`inline-flex items-baseline gap-1 bg-gradient-to-br ${bg} bg-clip-text text-transparent`}
      >
        <span className="text-4xl md:text-5xl font-semibold tracking-[-0.03em] tabular-nums">
          {value}
        </span>
        <span className="text-xs text-muted-foreground">/100</span>
      </div>
      <div className="text-[10.5px] text-muted-foreground -mt-0.5">{label}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
 *  USE-CASE ARTWORK — inline colorful SVGs, Tavily-style
 * ═══════════════════════════════════════════════════════════ */
function UseCaseArtwork({ id }: { id: UseCaseArt }) {
  const art = USE_CASE_ART[id];
  return (
    <Image
      src={art.src}
      alt={art.alt}
      fill
      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
    />
  );
}

/* ── Micro-charts for benchmark tabs ───────────────────── */
function BenchmarkMicroChart({ id }: { id: string }) {
  // All charts share a single axis colour + emerald/amber/sky palette so
  // they feel related to the rest of the landing page, while each tab still
  // gets its own distinctive visual identity.
  const axis = 'rgba(15, 23, 42, 0.18)';

  if (id === 'correlation') {
    return (
      <svg viewBox="0 0 180 96" className="w-48 h-24">
        <defs>
          <linearGradient id="corr-trend" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
          <radialGradient id="corr-dot" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#34d399" stopOpacity="1" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.85" />
          </radialGradient>
        </defs>
        <line x1="0" y1="86" x2="180" y2="86" stroke={axis} />
        <line x1="12" y1="90" x2="12" y2="6" stroke={axis} />
        {Array.from({ length: 42 }).map((_, i) => {
          const x = 12 + (i / 41) * 158;
          const base = (i / 41) * 72 + 4;
          const jitter = (Math.sin(i * 1.7) + 1) * 3.4;
          const y = 84 - (base + jitter);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="2.2"
              fill="url(#corr-dot)"
              opacity="0.9"
            />
          );
        })}
        <line
          x1="12"
          y1="78"
          x2="170"
          y2="10"
          stroke="url(#corr-trend)"
          strokeWidth="2"
          strokeDasharray="4 3"
          strokeLinecap="round"
        />
        <text x="170" y="18" textAnchor="end" fontSize="8" fill="#059669" fontWeight={600}>
          r ≈ 0.95
        </text>
      </svg>
    );
  }

  if (id === 'latency') {
    const bars = [18, 26, 40, 58, 88, 62, 44, 30, 22, 18];
    return (
      <svg viewBox="0 0 180 96" className="w-48 h-24">
        <defs>
          <linearGradient id="lat-grad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="55%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
        <line x1="0" y1="86" x2="180" y2="86" stroke={axis} />
        {bars.map((b, i) => {
          const x = 12 + i * 16;
          const peak = i === 4;
          return (
            <g key={i}>
              <rect
                x={x}
                y={86 - b}
                width="10"
                height={b}
                rx="3"
                fill="url(#lat-grad)"
                opacity={0.55 + (b / 100) * 0.45}
              />
              {peak && (
                <circle cx={x + 5} cy={86 - b - 4} r="2" fill="#fbbf24" />
              )}
            </g>
          );
        })}
        <text x="172" y="14" textAnchor="end" fontSize="8" fill="#0369a1" fontWeight={600}>
          p50 · 240 ms
        </text>
      </svg>
    );
  }

  if (id === 'coverage') {
    // One hue per task type — a compact rainbow walks from cool to warm,
    // so "7 task types" reads at a glance as a spectrum of capability.
    const items: Array<{ l: string; c: string }> = [
      { l: 'word', c: '#6366f1' },   // indigo
      { l: 'sent', c: '#3b82f6' },   // blue
      { l: 'para', c: '#0ea5e9' },   // sky
      { l: 'semi', c: '#10b981' },   // emerald
      { l: 'open', c: '#22c55e' },   // green
      { l: 'free', c: '#fbbf24' },   // amber
      { l: 'talk', c: '#f43f5e' },   // rose
    ];
    return (
      <svg viewBox="0 0 180 96" className="w-48 h-24">
        {items.map((it, i) => {
          const cx = 14 + i * 24;
          return (
            <g key={it.l}>
              <circle cx={cx} cy="40" r="12" fill={it.c} opacity="0.18" />
              <circle cx={cx} cy="40" r="8" fill={it.c} />
              <text
                x={cx}
                y="78"
                textAnchor="middle"
                fontSize="8"
                fill="#0f172a"
                opacity="0.65"
                fontFamily="ui-monospace, monospace"
              >
                {it.l}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }

  // scale — growth curve with emerald fill and an amber "now" marker
  return (
    <svg viewBox="0 0 180 96" className="w-48 h-24">
      <defs>
        <linearGradient id="scale-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.48" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.04" />
        </linearGradient>
        <linearGradient id="scale-stroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
      </defs>
      <line x1="0" y1="86" x2="180" y2="86" stroke={axis} />
      <path
        d="M6 78 Q44 72 80 62 T138 30 T174 8 L174 86 L6 86 Z"
        fill="url(#scale-fill)"
      />
      <path
        d="M6 78 Q44 72 80 62 T138 30 T174 8"
        stroke="url(#scale-stroke)"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="174" cy="8" r="3.5" fill="#fbbf24" stroke="#ffffff" strokeWidth="1.5" />
      <text x="168" y="22" textAnchor="end" fontSize="8" fill="#b45309" fontWeight={600}>
        9.2B / yr
      </text>
    </svg>
  );
}

/* Suppress unused-import lint for icons kept for potential future sections. */
void Bot;
void Baby;
void GraduationCap;
