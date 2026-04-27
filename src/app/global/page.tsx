'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  Copy,
  Mail,
  MessageSquareText,
  Sparkles,
  Terminal,
  Waves,
  Languages,
  Bot,
  Baby,
  GraduationCap,
  Globe2,
  Zap,
  Mic2,
  ShieldCheck,
  Lightbulb,
  Play,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FadeUp, StaggerContainer, StaggerItem, CountUp } from '@/components/animated-section';
import {
  TopNav,
  SiteFooter,
  ContactSection,
  AmbientBackdrop,
  SAMPLE_MCP_RICH_JSON,
} from './_chrome';

/* ─────────────────────────────────────────────────────────────
 * Standalone English landing for overseas developers.
 *
 * Design intent:
 *  • First fold = what it does + how to plug it in, in one screen.
 *  • Content is dev-first: code, JSON, numbers; marketing copy kept minimal.
 *  • Visuals drawn directly in JSX (waveform, score meter, phoneme chips,
 *    tone chart) so the page ships fast with no extra assets.
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
  chips: string[];
  tone: CapabilityTone;
  visual: CapabilityVisual;
}[] = [
  {
    icon: Mic2,
    eyebrow: 'assess',
    title: 'Score a learner\u2019s speech',
    body:
      'Stream mic audio or post a file. Get overall / accuracy / integrity / fluency / rhythm scores, plus word and phoneme-level diagnostics.',
    chips: ['overall', 'accuracy', 'fluency', 'rhythm', 'phoneme'],
    tone: 'emerald',
    visual: 'meters',
  },
  {
    icon: Languages,
    eyebrow: 'languages',
    title: 'Mandarin &amp; English, natively',
    body:
      'Tones, pinyin, neutral tone, erhua, tone sandhi for Chinese. Stress, rhythm, CEFR-aligned scoring for English. One flag switches between them.',
    chips: ['zh-CN', 'en-US', 'pinyin', 'tones', 'CEFR'],
    tone: 'sky',
    visual: 'bilingual',
  },
  {
    icon: MessageSquareText,
    eyebrow: 'converse',
    title: 'Score free-flow dialogue',
    body:
      'Open-ended AI-talk evaluation returns 5-dimensional scores on fluency, content, grammar, accuracy and rhythm — ready for the next LLM turn.',
    chips: ['AI-talk', 'open-question', '5-dim', 'streaming'],
    tone: 'violet',
    visual: 'dialogue',
  },
  {
    icon: Sparkles,
    eyebrow: 'drill',
    title: 'Personalize the next practice',
    body:
      'Feed the JSON straight to GPT / Claude / Gemini. Use the shipped prompt-skill to generate targeted drills for weak phonemes or tones.',
    chips: ['GPT', 'Claude', 'Gemini', 'Qwen', 'DeepSeek'],
    tone: 'amber',
    visual: 'target',
  },
];

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

/* ── use-case cards, each with a colorful inline illustration ─── */
type UseCaseArt =
  | 'mandarin'
  | 'english'
  | 'kids'
  | 'podcast'
  | 'voice'
  | 'ecosystem';

const USE_CASES: {
  art: UseCaseArt;
  tag: string;
  title: string;
  body: string;
}[] = [
  {
    art: 'mandarin',
    tag: 'Mandarin Depth',
    title: 'The only MCP that feeds LLMs phoneme-level Mandarin',
    body:
      'Tone objects, sandhi resolution and per-phoneme windows returned in the same payload shape every other language ships. Your agent reasons over <span class="font-zh">睡觉</span> vs. <span class="font-zh">水饺</span> at the acoustic layer, not the transcript — signal a Whisper-stack integration simply can&rsquo;t surface.',
  },
  {
    art: 'voice',
    tag: 'AI Interviewer',
    title: 'Score candidate speech, not just transcripts',
    body:
      'Screen English fluency, pronunciation confidence and rhythm at scale. Your LLM reasons over numbers, not vibes — explainable rubrics every HR team will trust.',
  },
  {
    art: 'podcast',
    tag: 'Contact Center QA',
    title: 'Agent training &amp; call-script compliance',
    body:
      'Evaluate standard-phrase delivery, articulation, pacing and keyword hits for call-center reps. Flag exactly which second drifted off-script and auto-generate coaching drills.',
  },
  {
    art: 'ecosystem',
    tag: 'Serious Games &amp; XR',
    title: 'Voice-gated NPCs and pronunciation-powered gameplay',
    body:
      'Players unlock spells, dialogues or levels by saying the phrase correctly. Get a pass/fail plus the exact phoneme that missed, at <300 ms p95 — fast enough for real-time game loops.',
  },
];

/* ── benchmarks ──────────────────────────────────────────── */
const BENCHMARK_TABS = [
  {
    id: 'correlation',
    label: 'Expert correlation',
    metric: '95%+',
    metricLabel: 'agreement with human experts',
    body:
      'Scores align with certified human expert rubrics at 95%+ correlation. Validated by national standardized speaking tests in 100+ cities.',
    chart: 'correlation',
  },
  {
    id: 'latency',
    label: 'Latency',
    metric: '<300ms',
    metricLabel: 'p50 streaming response',
    body:
      'Streaming WebSocket sessions return multi-dimensional scores in a few hundred milliseconds after end-of-speech. Perfect for real-time tutoring UX.',
    chart: 'latency',
  },
  {
    id: 'coverage',
    label: 'Coverage',
    metric: '7 task types',
    metricLabel: 'word · sentence · paragraph · semi-open · open · free · AI-talk',
    body:
      'One integration covers every stage of your learner journey — from single-word phonics to open-ended conversation.',
    chart: 'coverage',
  },
  {
    id: 'scale',
    label: 'Scale',
    metric: '9.2B+',
    metricLabel: 'evaluations per year · 185 countries',
    body:
      'Production traffic serving ministries, test centers, and consumer apps, with 99.99% uptime SLA on enterprise plans.',
    chart: 'scale',
  },
];

export default function GlobalLandingPage() {
  const [installTab, setInstallTab] = useState(INSTALL_TABS[0].id);
  const [benchmark, setBenchmark] = useState(BENCHMARK_TABS[0].id);

  const activeInstall = INSTALL_TABS.find((t) => t.id === installTab) ?? INSTALL_TABS[0];
  const activeBench = BENCHMARK_TABS.find((t) => t.id === benchmark) ?? BENCHMARK_TABS[0];

  return (
    <main className="flex-1 flex flex-col relative">
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
                <p className="text-[15.5px] md:text-[17px] text-muted-foreground leading-relaxed max-w-2xl mb-8">
                  Chivox MCP turns raw speech into a{' '}
                  <strong className="text-foreground/90 font-semibold">dense, agent-ready payload</strong>{' '}
                  &mdash; phoneme scores, stress, tone, fluency, audio quality &mdash; all in one MCP
                  call, any LLM. The listening layer under every voice-native agent you&rsquo;re about to ship.
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

              {/* 3-value benefit strip */}
              <FadeUp delay={0.26}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    {
                      icon: Waves,
                      title: 'Deep linguistic understanding',
                      sub: 'Go beyond transcripts.',
                      bg: 'bg-emerald-500/10',
                      fg: 'text-emerald-600',
                    },
                    {
                      icon: ShieldCheck,
                      title: 'Enterprise-ready',
                      sub: 'Secure. Scalable. Reliable.',
                      bg: 'bg-sky-500/10',
                      fg: 'text-sky-600',
                    },
                    {
                      icon: Zap,
                      title: 'Real-time intelligence',
                      sub: 'React in the moment.',
                      bg: 'bg-amber-500/10',
                      fg: 'text-amber-600',
                    },
                  ].map((v) => (
                    <div key={v.title} className="flex items-start gap-2.5">
                      <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${v.bg}`}>
                        <v.icon className={`h-4 w-4 ${v.fg}`} />
                      </span>
                      <div className="min-w-0">
                        <div className="text-[13px] font-semibold tracking-[-0.005em] text-foreground leading-tight">
                          {v.title}
                        </div>
                        <div className="text-[12px] text-muted-foreground mt-0.5">{v.sub}</div>
                      </div>
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

          {/* prominent install terminal — centered below, spans content width */}
          <FadeUp delay={0.32}>
            <div className="mt-12 md:mt-14">
              <HeroInstallPill />
            </div>
          </FadeUp>

          {/* deep-dive carousel — below the fold */}
          <FadeUp delay={0.4}>
            <div className="mt-20 max-w-6xl xl:max-w-7xl mx-auto">
              <HeroCarousel />
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       * CORE CAPABILITIES — what the MCP can do, in 4 tiles
       * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative py-16 md:py-20 border-b border-[#e9e2d2]/70">
        <div className="container mx-auto px-6 max-w-6xl">
          <FadeUp className="mb-10 text-center max-w-2xl mx-auto">
            <div className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-3">/what-it-does</div>
            <h2 className="heading-display text-3xl md:text-4xl tracking-[-0.02em] mb-3">
              The listening layer, as four MCP tools
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Twenty years of pronunciation-assessment R&amp;D, exposed as a structured payload your LLM
              can reason over. Drop into LangChain, LlamaIndex, the OpenAI Agents SDK or any custom loop —
              skip the months of DSP work.
            </p>
          </FadeUp>

          <StaggerContainer className="grid md:grid-cols-2 gap-4">
            {CORE_CAPABILITIES.map((c) => {
              const tone = CAPABILITY_TONE[c.tone];
              return (
                <StaggerItem key={c.eyebrow}>
                  <div
                    className={`group relative glass-card h-full p-5 md:p-6 flex flex-col sm:flex-row gap-5 overflow-hidden transition-all duration-300 hover:-translate-y-[2px] ring-1 ring-transparent ${tone.ring}`}
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

                    {/* LEFT — compact visual preview */}
                    <div className="sm:w-[190px] sm:shrink-0 self-start">
                      <CapabilityVisual id={c.visual} />
                    </div>

                    {/* RIGHT — header + body + chips */}
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className={`h-8 w-8 rounded-lg border ${tone.iconBg} flex items-center justify-center`}>
                          <c.icon className={`h-4 w-4 ${tone.iconColor}`} />
                        </div>
                        <span className={`text-[10.5px] font-mono tracking-wide uppercase ${tone.eyebrow}`}>
                          /{c.eyebrow}
                        </span>
                      </div>

                      <h3
                        className="text-[17px] font-semibold tracking-[-0.01em] mb-1.5"
                        dangerouslySetInnerHTML={{ __html: c.title }}
                      />
                      <p className="text-[13px] text-muted-foreground leading-relaxed mb-3">{c.body}</p>

                      <div className="mt-auto flex flex-wrap gap-1.5">
                        {c.chips.map((chip) => (
                          <span
                            key={chip}
                            className="inline-flex items-center rounded-md border border-zinc-900/[0.08] bg-white/60 backdrop-blur-sm px-1.5 py-0.5 text-[10px] font-mono text-foreground/70"
                          >
                            {chip}
                          </span>
                        ))}
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
       * QUICKSTART — 3 steps, dead simple
       * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="quickstart" className="relative py-20 md:py-24 border-b border-[#e9e2d2]/70 scroll-mt-24">
        <div className="container mx-auto px-6 max-w-6xl">
          <FadeUp className="mb-12 text-center">
            <div className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-3">/quickstart</div>
            <h2 className="heading-display text-3xl md:text-4xl tracking-[-0.02em] mb-3">
              Production-ready in 3 steps
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Watch it run. Paste config → server connects → your LLM calls a tool and gets structured scores back.
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
            installTab={installTab}
            setInstallTab={setInstallTab}
            activeInstall={activeInstall}
          />
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       * MANDARIN DEPTH — concrete proof the payload resolves the
       * hardest acoustic signals. Technical proof, not market sell.
       * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section
        id="mandarin-moat"
        className="relative py-20 md:py-24 border-b border-[#e9e2d2]/70 scroll-mt-24"
      >
        <div className="container mx-auto px-6 max-w-6xl">
          <FadeUp className="mb-6 max-w-3xl">
            <div className="inline-flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-3">
              <span>/payload-depth</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[9px] font-mono text-rose-600 dark:text-rose-400 normal-case tracking-normal">
                <span className="h-1 w-1 rounded-full bg-rose-500" />
                Depth proof
              </span>
            </div>
            <h2 className="heading-display text-3xl md:text-[42px] tracking-[-0.02em] mb-3 leading-[1.1]">
              Mandarin is where the payload proves itself.
              <br />
              <span className="text-muted-foreground/90">If it resolves tonal sandhi, it resolves anything.</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              English handles the long tail of L2 learners. Mandarin is the pressure test &mdash; four tones,
              sandhi, erhua, retroflex, the acoustic edge cases that kill generic STT. Both ship as{' '}
              <span className="font-mono text-foreground/80">pron.*</span> /{' '}
              <span className="font-mono text-foreground/80">details[]</span> on the same payload contract,
              with tone objects and per-phoneme windows for zh, stress and CEFR alignment for en. One
              integration, two acoustically opposite languages.
            </p>
          </FadeUp>

          {/* ── coverage proof strip — capability chips, no market TAM ── */}
          <FadeUp delay={0.06}>
            <div className="mb-8 rounded-xl border border-rose-500/15 bg-gradient-to-r from-rose-50/70 via-amber-50/50 to-rose-50/30 px-4 md:px-5 py-3.5 flex flex-col md:flex-row md:items-center gap-3 md:gap-5">
              <div className="inline-flex items-center gap-1.5 shrink-0">
                <Globe2 className="h-3.5 w-3.5 text-rose-600" />
                <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-rose-700/90">
                  Mandarin depth
                </span>
              </div>
              <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1.5 flex-1 min-w-0">
                <span className="inline-flex items-baseline gap-1.5">
                  <span className="heading-display text-[17px] md:text-[19px] tabular-nums tracking-[-0.02em] text-rose-700">
                    HSK 1-9
                  </span>
                  <span className="text-[12.5px] text-foreground/75">
                    lexical ladder covered
                  </span>
                </span>
                <span className="hidden md:inline-block h-3 w-px bg-rose-500/25" />
                <span className="inline-flex items-baseline gap-1.5">
                  <span className="heading-display text-[17px] md:text-[19px] tabular-nums tracking-[-0.02em] text-rose-700">
                    5 tones
                  </span>
                  <span className="text-[12.5px] text-foreground/75">
                    + sandhi + erhua resolved
                  </span>
                </span>
                <span className="hidden md:inline-block h-3 w-px bg-rose-500/25" />
                <span className="inline-flex items-baseline gap-1.5">
                  <span className="heading-display text-[17px] md:text-[19px] tabular-nums tracking-[-0.02em] text-rose-700">
                    95%+
                  </span>
                  <span className="text-[12.5px] text-foreground/75">
                    agreement with human raters
                  </span>
                </span>
              </div>
              <div className="shrink-0 inline-flex items-center gap-1.5 text-[12.5px] italic text-foreground/80">
                <ArrowRight className="h-3.5 w-3.5 text-rose-600" />
                Same payload shape, hardest signal.
              </div>
            </div>
          </FadeUp>

          <FadeUp delay={0.1}>
            <BilingualScorePanel />
          </FadeUp>

          <FadeUp delay={0.18}>
            <div className="mt-6 rounded-xl border border-zinc-900/[0.08] bg-white/55 backdrop-blur-sm p-5 md:p-6">
              <div className="text-[10.5px] font-mono tracking-[0.18em] uppercase text-muted-foreground mb-2">
                Code-switching · cross-lingual scoring
              </div>
              <p className="text-[13.5px] text-foreground/80 leading-relaxed">
                Score a heritage speaker mid-sentence as they flip between languages &mdash;{' '}
                <span className="italic">
                  &ldquo;I told her <span className="font-zh">我下周回家</span> and she was thrilled.&rdquo;
                </span>{' '}
                Returns separate EN / zh sub-scores plus a blended fluency index. Same payload contract,
                two languages interleaved.
              </p>
            </div>
          </FadeUp>

          <FadeUp delay={0.22}>
            <div className="mt-6 text-[12.5px] text-muted-foreground">
              Looking to ship a Mandarin coach on top of this?{' '}
              <a
                href="#use-cases"
                className="inline-flex items-center gap-1 text-emerald-800 hover:text-emerald-900 font-medium transition-colors"
              >
                See the build-a-tutor use case
                <ArrowRight className="h-3 w-3" />
              </a>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       * USE CASES — with real imagery
       * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="use-cases" className="relative py-20 md:py-24 border-b border-[#e9e2d2]/70 scroll-mt-24">
        <div className="container mx-auto px-6 max-w-6xl">
          <FadeUp className="mb-12 max-w-2xl">
            <div className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-3">/use-cases</div>
            <h2 className="heading-display text-3xl md:text-4xl tracking-[-0.02em] mb-3">
              Built for what developers actually ship
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Tutors, coaches, companions, QA tooling — pick the scenario that\u2019s yours and see how the
              agent loop looks in practice.
            </p>
          </FadeUp>

          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {USE_CASES.map((u) => (
              <StaggerItem key={u.tag}>
                <div className="group rounded-2xl border border-zinc-900/[0.08] bg-white/80 backdrop-blur-sm overflow-hidden h-full flex flex-col hover:border-zinc-900/25 hover:-translate-y-[2px] hover:shadow-[0_12px_40px_-16px_rgba(0,0,0,0.12)] transition-all duration-300">
                  <div className="relative aspect-[16/10] w-full border-b border-zinc-900/[0.06] overflow-hidden">
                    <UseCaseArtwork id={u.art} />
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <h3
                      className="text-[15px] font-semibold tracking-[-0.01em] mb-2 leading-snug"
                      dangerouslySetInnerHTML={{ __html: u.title }}
                    />
                    <p
                      className="text-[13px] text-muted-foreground leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: u.body }}
                    />
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       * BENCHMARKS — quiet cards with inline micro-charts
       * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative py-20 md:py-24 border-b border-[#e9e2d2]/70 warm-card-bleed">
        <div className="container mx-auto px-6 max-w-6xl relative">
          <FadeUp className="mb-10">
            <div className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-3">/benchmarks</div>
            <h2 className="heading-display text-3xl md:text-4xl tracking-[-0.02em] mb-3">
              Speech scoring driven by research
            </h2>
            <p className="text-muted-foreground leading-relaxed max-w-2xl">
              The engine behind Chivox MCP is 20 years of R&amp;D in pronunciation assessment. Here\u2019s how it
              holds up in production.
            </p>
          </FadeUp>

          <div className="grid lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-4">
              <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
                {BENCHMARK_TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setBenchmark(t.id)}
                    className={`relative text-left px-4 py-3 rounded-lg text-sm whitespace-nowrap transition-all ${
                      t.id === benchmark
                        ? 'bg-background text-foreground border border-border/60 shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-background/60 border border-transparent'
                    }`}
                  >
                    <span className="font-medium">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-8">
              <div className="rounded-2xl border border-border/60 bg-background p-7 md:p-9 h-full">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5 mb-5">
                  <div>
                    <div className="text-5xl md:text-6xl heading-display tracking-[-0.03em] leading-none mb-2">
                      {activeBench.metric}
                    </div>
                    <div className="text-sm text-muted-foreground">{activeBench.metricLabel}</div>
                  </div>
                  <BenchmarkMicroChart id={activeBench.chart} />
                </div>
                <div className="h-px bg-border/60 my-5" />
                <p className="text-foreground/85 leading-relaxed">{activeBench.body}</p>
              </div>
            </div>
          </div>

          <StaggerContainer className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { value: 9.2, suffix: 'B+', label: 'evaluations per year' },
              { value: 95, suffix: '%+', label: 'correlation with human experts' },
              { value: 185, suffix: '', label: 'countries & regions' },
              { value: 20, suffix: ' yrs', label: 'in speech AI research' },
            ].map((s) => (
              <StaggerItem key={s.label}>
                <div className="glass-card px-5 py-6 text-center">
                  <div className="text-2xl md:text-3xl heading-display tracking-[-0.02em] tabular-nums">
                    <CountUp value={s.value} suffix={s.suffix} />
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1.5 leading-snug">{s.label}</div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          {/* trust bullets — lifted from the old Trust section */}
          <FadeUp delay={0.15}>
            <div className="mt-8 grid md:grid-cols-2 gap-x-6 gap-y-2.5">
              {[
                'Validated by national testing centers for standardized speaking exams',
                '14+ granted patents in speech assessment',
                '99.99% uptime SLA for enterprise deployments',
                'GDPR-friendly data handling for EU markets',
              ].map((f) => (
                <div key={f} className="flex items-start gap-2.5 text-[13px] text-foreground/80">
                  <Check className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       * CTA
       * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative py-16 md:py-24">
        <div className="container mx-auto px-6 max-w-6xl">
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
              Starter key free &middot; spend caps &middot; low-balance alerts &middot; zero audio retention
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

      <ContactSection />

      <SiteFooter />
    </main>
  );
}

/* ═══════════════════════════════════════════════════════════════
 *  VISUAL COMPONENTS (drawn inline so no extra assets are needed)
 * ═══════════════════════════════════════════════════════════ */

/** Hero slide ④ — same schema story as README, English “think” row + nested pron/audio. */
const HERO_SLIDE_REASONING_JSON = `{
  "overall": 48,
  "pron": { "accuracy": 44, "integrity": 90, "fluency": 72, "rhythm": 65 },
  "fluency": { "pause": 2, "speed": 118 },
  "audio_quality": { "snr": 19.2, "clip": 0 },
  "details": [
    {
      "word": "think",
      "score": 48, "dp_type": "mispron",
      "start": 2400, "end": 2910,
      "liaison": "none",
      "phonemes": [
        { "ipa": "θ", "score": 35, "dp_type": "mispron" },
        { "ipa": "ɪ", "score": 88, "dp_type": "normal" }
      ],
      "phoneme_error": { "expected": "/θ/", "actual": "/s/" }
    }
  ]
}`;

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

  /* restart the timeline whenever the tab changes */
  useEffect(() => {
    setPhase(0);
    setTyped(0);
    setResponseChars(0);
  }, [installTab]);

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
 *  CAPABILITY VISUALS — small illustrative blocks per card
 * ────────────────────────────────────────────────────────── */
function CapabilityVisual({ id }: { id: CapabilityVisual }) {
  if (id === 'meters') return <CapVisualMeters />;
  if (id === 'bilingual') return <CapVisualBilingual />;
  if (id === 'dialogue') return <CapVisualDialogue />;
  return <CapVisualTarget />;
}

/* 01 · assess — 4 scoring meters (Tavily-ish slim bars) */
function CapVisualMeters() {
  const rows = [
    { k: 'overall', v: 84, c: 'from-emerald-400 to-emerald-500' },
    { k: 'accuracy', v: 78, c: 'from-emerald-400 to-teal-500' },
    { k: 'fluency', v: 88, c: 'from-emerald-400 to-emerald-500' },
    { k: 'rhythm', v: 73, c: 'from-amber-400 to-amber-500' },
  ];
  return (
    <div className="rounded-xl border border-zinc-900/[0.06] bg-white/50 backdrop-blur-sm p-3.5 flex flex-col gap-1.5">
      {rows.map((r) => (
        <div key={r.k} className="flex items-center gap-3">
          <span className="w-[70px] text-[10.5px] font-mono text-muted-foreground">{r.k}</span>
          <div className="relative flex-1 h-1.5 rounded-full bg-zinc-900/[0.06] overflow-hidden">
            <div
              className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${r.c}`}
              style={{ width: `${r.v}%` }}
            />
          </div>
          <span className="w-7 text-right text-[11px] font-mono tabular-nums text-foreground/80">{r.v}</span>
        </div>
      ))}
    </div>
  );
}

/* 02 · languages — CN / EN toggle with pinyin + tone lines */
function CapVisualBilingual() {
  return (
    <div className="rounded-xl border border-zinc-900/[0.06] bg-white/50 backdrop-blur-sm p-3 overflow-hidden">
      <div className="flex items-center gap-1.5 mb-2.5">
        <span className="inline-flex items-center gap-1 rounded-md border border-rose-500/30 bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-mono text-rose-700 whitespace-nowrap">
          <span className="h-1 w-1 rounded-full bg-rose-500" />
          zh-CN
        </span>
        <span className="inline-flex items-center gap-1 rounded-md border border-sky-500/30 bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-mono text-sky-700 whitespace-nowrap">
          <span className="h-1 w-1 rounded-full bg-sky-500" />
          en-US
        </span>
        <span className="ml-auto text-[9.5px] font-mono text-muted-foreground whitespace-nowrap">
          one flag
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <div className="min-w-0 rounded-lg border border-rose-500/25 bg-rose-500/[0.05] px-2 py-1.5">
          <div className="flex items-baseline gap-1.5 min-w-0">
            <span className="font-zh text-base text-rose-800 leading-none">你好</span>
            <span className="font-pinyin text-[10.5px] text-rose-700 truncate">nǐ hǎo</span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-rose-600">
            <svg width="22" height="6" viewBox="0 0 34 8" className="shrink-0">
              <path d="M1 6 Q 5 6, 9 3 T 17 1" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M18 6 Q 22 6, 26 3 T 33 1" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <span className="text-[9px] font-mono text-rose-600/70 truncate">tones · pinyin</span>
          </div>
        </div>

        <div className="min-w-0 rounded-lg border border-sky-500/25 bg-sky-500/[0.05] px-2 py-1.5">
          <div className="flex items-baseline gap-1.5 min-w-0">
            <span className="text-[14px] font-semibold text-sky-900 leading-none">Hello</span>
            <span className="font-mono text-[10px] text-sky-700 truncate">/həˈloʊ/</span>
          </div>
          <div className="mt-1 flex items-center gap-0.5 text-sky-600">
            <span className="inline-flex h-1 w-3 rounded bg-sky-500" />
            <span className="inline-flex h-1 w-1.5 rounded bg-sky-300" />
            <span className="inline-flex h-1 w-2 rounded bg-sky-500" />
            <span className="text-[9px] font-mono ml-1 text-sky-600/70 truncate">stress · CEFR</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* 03 · converse — 3 chat bubbles with a tiny waveform */
function CapVisualDialogue() {
  return (
    <div className="rounded-xl border border-zinc-900/[0.06] bg-white/50 backdrop-blur-sm p-3.5 flex flex-col gap-2">
      <div className="flex items-start gap-2">
        <span className="h-6 w-6 shrink-0 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-700 text-[10px] font-mono flex items-center justify-center">AI</span>
        <div className="rounded-lg rounded-tl-sm border border-violet-500/20 bg-violet-500/[0.05] px-2.5 py-1.5 text-[11.5px] text-foreground/85 max-w-[70%]">
          Describe your hometown in three sentences.
        </div>
      </div>
      <div className="flex items-start gap-2 justify-end">
        <div className="rounded-lg rounded-tr-sm border border-zinc-900/[0.08] bg-white/70 px-2.5 py-1.5 max-w-[80%]">
          <div className="flex items-end gap-[2px] h-3.5">
            {[0.4, 0.8, 0.5, 1, 0.7, 0.9, 0.4, 0.7, 0.55, 0.85, 0.6, 0.3, 0.9, 0.5].map((h, i) => (
              <span
                key={i}
                className="inline-block w-[2.5px] rounded-[1.5px] bg-gradient-to-t from-violet-400/50 to-violet-500"
                style={{ height: `${h * 100}%` }}
              />
            ))}
          </div>
          <div className="mt-1 text-[10px] font-mono text-muted-foreground">user · 00:14</div>
        </div>
        <span className="h-6 w-6 shrink-0 rounded-full bg-zinc-900/[0.06] border border-zinc-900/10 text-zinc-700 text-[10px] font-mono flex items-center justify-center">U</span>
      </div>
      <div className="mt-0.5 flex flex-wrap gap-1">
        {['fluency 82', 'content 76', 'grammar 88', 'accuracy 79', 'rhythm 81'].map((s) => (
          <span key={s} className="inline-flex items-center rounded-md border border-violet-500/25 bg-violet-500/[0.06] px-1.5 py-0.5 text-[10px] font-mono text-violet-700">
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

/* 04 · drill — bullseye + LLM chip row */
function CapVisualTarget() {
  return (
    <div className="rounded-xl border border-zinc-900/[0.06] bg-white/50 backdrop-blur-sm p-3.5 flex items-center gap-4">
      {/* bullseye */}
      <svg width="72" height="72" viewBox="0 0 72 72" className="shrink-0">
        <defs>
          <radialGradient id="capTarget" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="36" cy="36" r="34" fill="url(#capTarget)" />
        <circle cx="36" cy="36" r="28" fill="none" stroke="#f59e0b" strokeOpacity="0.35" strokeWidth="1" />
        <circle cx="36" cy="36" r="20" fill="none" stroke="#f59e0b" strokeOpacity="0.5" strokeWidth="1" />
        <circle cx="36" cy="36" r="12" fill="none" stroke="#f59e0b" strokeOpacity="0.7" strokeWidth="1.2" />
        <circle cx="36" cy="36" r="4" fill="#f59e0b" />
        {/* arrow */}
        <line x1="62" y1="12" x2="40" y2="34" stroke="#18181b" strokeWidth="1.5" strokeLinecap="round" />
        <polygon points="36,36 42,32 40,34" fill="#18181b" />
      </svg>
      <div className="flex-1 min-w-0">
        <div className="text-[10.5px] font-mono uppercase tracking-wider text-amber-700/90 mb-1.5">
          personalized drill
        </div>
        <div className="text-[12.5px] font-mono text-foreground/85 truncate">
          <span className="text-rose-600">/θ/</span> minimal pairs · <span className="text-muted-foreground">think · sink · thank · sank</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {['GPT', 'Claude', 'Gemini', 'Qwen'].map((m) => (
            <span key={m} className="inline-flex items-center rounded-md border border-zinc-900/[0.08] bg-white/70 px-1.5 py-0.5 text-[10px] font-mono text-foreground/70">
              {m}
            </span>
          ))}
        </div>
      </div>
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
          x="210" y="345" textAnchor="middle" fontSize="220" fontWeight="700"
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
          x="210" y="330" textAnchor="middle" fontSize="180" fontWeight="500" fill="url(#hh-think)"
          style={{ ...serifStyle, fontStyle: 'italic', letterSpacing: '-0.015em' }}
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
    id: 'setup',
    label: 'One MCP integration',
    chip: 'npx · 60 s',
    tone: 'emerald',
    headline: 'One MCP, wired into every agent runtime.',
    sub: 'Four tools. Claude, Cursor, Cline, LangChain, any custom loop — zero audio plumbing.',
  },
  {
    id: 'phoneme',
    label: 'Raw speech → diagnosis',
    chip: 'Beyond STT',
    tone: 'violet',
    headline: 'Raw audio in. Structured diagnosis out.',
    sub: 'Per-phoneme accuracy, stress, liaison, ms-level windows — the signal an LLM needs to reason, not just transcribe.',
  },
  {
    id: 'mandarin',
    label: 'Proof of payload depth',
    chip: 'Hardest acoustic signal',
    tone: 'rose',
    headline: 'If it resolves tonal sandhi, it resolves anything.',
    sub: 'Tone, sandhi, erhua, retroflex — the acoustic edge cases generic STT flatlines on. Same payload shape as every other language.',
  },
  {
    id: 'reasoning',
    label: 'A reasoning payload',
    chip: 'Not a leaderboard cell',
    tone: 'amber',
    headline: 'A payload your LLM can reason over — not a score.',
    sub: 'Dozens of top-level and per-token fields: pron, fluency, audio_quality, details[] with stress, liaison, ms ranges, phonemes and tone objects.',
  },
] as const;

type HeroSlideId = (typeof HERO_SLIDES)[number]['id'];

/* Install terminal — the 60-second "just copy this" CTA.
 * Given a full chrome, emerald "ready" indicator, and click-to-copy
 * feedback so it reads as "a real, runnable thing" instead of decoration. */
function HeroInstallPill() {
  const [copied, setCopied] = useState(false);
  const cmd = 'npx -y @chivox/mcp';

  const onCopy = () => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(cmd).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <div className="mx-auto max-w-5xl mb-12">
      {/* label row */}
      <div className="flex items-center justify-center gap-2 mb-2.5 text-[11px] tracking-[0.14em] uppercase text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 text-[10px] font-mono normal-case tracking-wider text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)] animate-pulse" />
          60-second install
        </span>
        <span className="text-muted-foreground/60">·</span>
        <span className="normal-case tracking-normal text-[12px] text-muted-foreground">
          Copy → paste → your agent hears.
        </span>
      </div>

      {/* terminal card with gradient glow */}
      <div className="relative group">
        {/* soft colored glow that lights up on hover */}
        <div
          aria-hidden
          className="absolute -inset-[2px] rounded-2xl opacity-70 group-hover:opacity-100 transition-opacity duration-500 blur-md pointer-events-none"
          style={{
            background:
              'linear-gradient(90deg, rgba(16,185,129,0.35), rgba(56,189,248,0.2) 40%, rgba(16,185,129,0.35))',
          }}
        />

        <div className="relative rounded-2xl border border-zinc-900/[0.1] bg-white/75 backdrop-blur-xl overflow-hidden shadow-[0_12px_40px_-12px_rgba(0,0,0,0.18),inset_0_1px_0_0_rgba(255,255,255,0.6)]">
          {/* chrome bar */}
          <div className="flex items-center justify-between px-3.5 py-2 border-b border-zinc-900/[0.07] bg-gradient-to-b from-white/80 to-zinc-50/60">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
            </div>
            <span className="text-[10.5px] font-mono text-zinc-500 tracking-tight">
              terminal · zsh
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[9.5px] font-mono uppercase tracking-wider text-emerald-700">
              ready
            </span>
          </div>

          {/* command row */}
          <button
            type="button"
            onClick={onCopy}
            aria-label="Copy install command"
            className="w-full flex items-center gap-2 px-4 py-4 text-left group/cmd focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
          >
            <span className="text-emerald-600 font-mono text-[15px] md:text-base shrink-0 select-none">
              $
            </span>
            <code className="flex-1 whitespace-nowrap overflow-x-auto font-mono text-[15px] md:text-base font-medium text-zinc-900 tracking-tight">
              {cmd}
            </code>
            <span
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11.5px] font-semibold transition-all duration-200 shrink-0 ${
                copied
                  ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-700'
                  : 'border-zinc-900/10 bg-white text-zinc-700 group-hover/cmd:border-zinc-900/25 group-hover/cmd:text-zinc-900'
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </>
              )}
            </span>
          </button>
        </div>
      </div>

      {/* sub-caption — the three clients it works with */}
      <div className="mt-3 text-center text-[11.5px] text-muted-foreground">
        Works with <span className="font-medium text-foreground/85">Claude Desktop</span>,{' '}
        <span className="font-medium text-foreground/85">Cursor</span>,{' '}
        <span className="font-medium text-foreground/85">Cline</span> &amp; any MCP client.
      </div>
    </div>
  );
}

/** Time between auto-advances; progress bar uses the same duration. */
const HERO_CAROUSEL_MS = 3500;

function HeroCarousel() {
  const [active, setActive] = useState<HeroSlideId>('mandarin');
  const [reduceMotion, setReduceMotion] = useState(false);

  // Progress is intentionally NOT React state — writing it every frame via
  // setState would re-render the entire carousel (including all slide
  // children) 60×/s, which is what caused the visible "freeze" stutters
  // under load. Instead we mutate a ref and write transform directly to
  // the DOM. React only owns the rare slide change.
  const progressRef = useRef(0);
  const barRef = useRef<HTMLDivElement | null>(null);
  const pausedRef = useRef(false);

  const writeBar = (v: number) => {
    const el = barRef.current;
    if (el) el.style.transform = `scaleX(${reduceMotion ? 0 : v})`;
  };

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  // Reset progress whenever the active slide changes (manual click or auto).
  useEffect(() => {
    progressRef.current = 0;
    writeBar(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, reduceMotion]);

  // One rAF loop for the lifetime of the component. It reads `pausedRef`
  // so mouse hover/leave doesn't tear the loop down — no cleanup thrash,
  // no missed frames, no drift.
  useEffect(() => {
    if (reduceMotion) {
      writeBar(0);
      return;
    }
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      // Backgrounded tabs can deliver huge dt spikes; clamp so a wake-up
      // doesn't fling the bar a full slide forward.
      const dt = Math.min(100, now - last);
      last = now;
      if (!pausedRef.current) {
        const next = Math.min(1, progressRef.current + dt / HERO_CAROUSEL_MS);
        progressRef.current = next;
        writeBar(next);
        if (next >= 1) {
          progressRef.current = 0;
          writeBar(0);
          setActive((cur) => {
            const i = HERO_SLIDES.findIndex((s) => s.id === cur);
            return HERO_SLIDES[(i + 1) % HERO_SLIDES.length].id;
          });
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);

  const activeIdx = HERO_SLIDES.findIndex((s) => s.id === active);

  // position relative to active: 0 = center, -1 = prev (left peek),
  // +1 = next (right peek), 2 = parked out of view.
  const positionFor = (idx: number): -1 | 0 | 1 | 2 => {
    const n = HERO_SLIDES.length;
    const d = ((idx - activeIdx) % n + n) % n;
    if (d === 0) return 0;
    if (d === 1) return 1;
    if (d === n - 1) return -1;
    return 2;
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
    >
      <div className="absolute -inset-4 rounded-3xl bg-foreground/[0.04] blur-2xl pointer-events-none" />

      {/* coverflow stage */}
      <div className="relative h-[460px] md:h-[500px]">
        {HERO_SLIDES.map((slide, i) => {
          const pos = positionFor(i);
          const isActive = pos === 0;
          const isParked = pos === 2;
          const transform =
            pos === 0
              ? 'translate(-50%, 0) scale(1)'
              : pos === -1
              ? 'translate(-112%, 4%) scale(0.74)'
              : pos === 1
              ? 'translate(12%, 4%) scale(0.74)'
              : 'translate(-50%, 6%) scale(0.6)'; // parked

          return (
            <div
              key={slide.id}
              role={isActive || isParked ? undefined : 'button'}
              tabIndex={isActive || isParked ? -1 : 0}
              aria-hidden={isParked || undefined}
              aria-label={isActive || isParked ? undefined : `Show slide ${slide.label}`}
              onClick={isActive || isParked ? undefined : () => setActive(slide.id)}
              onKeyDown={
                isActive || isParked
                  ? undefined
                  : (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setActive(slide.id);
                      }
                    }
              }
              className={`absolute left-1/2 top-0 w-[min(100%,680px)] origin-top transition-all duration-[600ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] ${
                isActive
                  ? 'z-20 opacity-100 pointer-events-auto cursor-default'
                  : isParked
                  ? 'z-0 opacity-0 pointer-events-none'
                  : 'z-10 opacity-55 hover:opacity-80 cursor-pointer'
              }`}
              style={{
                transform,
                filter: isActive ? undefined : 'blur(0.5px) saturate(0.92)',
              }}
            >
              <HeroSlideCard slide={slide} isActive={isActive} />
            </div>
          );
        })}
      </div>

      {/* footer — auto-advance progress + slogan + slide nav */}
      <div className="mt-1 max-w-[720px] mx-auto px-1">
        <div className="mb-3 h-1 w-full rounded-full bg-foreground/[0.07] overflow-hidden" aria-hidden>
          <div
            ref={barRef}
            className="h-full w-full origin-left rounded-full will-change-transform"
            style={{
              transform: `scaleX(${reduceMotion ? 0 : 0})`,
              background:
                'linear-gradient(90deg, #10b981 0%, #34d399 50%, #fbbf24 100%)',
            }}
          />
        </div>
        <div className="relative min-h-[76px]">
          {HERO_SLIDES.map((s, i) => (
            <div
              key={s.id}
              aria-hidden={i !== activeIdx}
              className={`absolute inset-0 transition-all duration-500 ease-out ${
                i === activeIdx
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-1 pointer-events-none'
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-1.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[12px] font-mono font-semibold ${
                    s.tone === 'emerald'
                      ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/25'
                      : s.tone === 'rose'
                      ? 'bg-rose-500/10 text-rose-700 border border-rose-500/25'
                      : s.tone === 'amber'
                      ? 'bg-amber-500/10 text-amber-700 border border-amber-500/30'
                      : 'bg-violet-500/10 text-violet-700 border border-violet-500/25'
                  }`}
                >
                  0{i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[22px] md:text-[26px] font-semibold tracking-[-0.02em] leading-[1.2] text-foreground">
                    {s.headline}
                  </div>
                  <div className="mt-1 text-[14px] md:text-[15px] text-muted-foreground leading-snug">
                    {s.sub}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-2 flex items-center justify-center gap-1.5">
          {HERO_SLIDES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActive(s.id)}
              aria-label={`Show slide ${s.label}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s.id === active
                  ? 'w-6 bg-foreground'
                  : 'w-1.5 bg-foreground/20 hover:bg-foreground/40'
              }`}
            />
          ))}
        </div>
      </div>
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
  return (
    <div
      className={`overflow-hidden rounded-2xl border shadow-[0_24px_80px_-24px_rgba(0,0,0,0.22)] ${
        isActive
          ? 'bg-white border-zinc-900/[0.1]'
          : 'glass-card'
      }`}
    >
      {/* window chrome */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-900/[0.08] bg-white/40 backdrop-blur-sm">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
        </div>
        <div className="text-[11px] font-mono text-muted-foreground tracking-tight">
          chivox ·{' '}
          {slide.id === 'setup'
            ? 'mcp.config'
            : slide.id === 'mandarin'
            ? 'assess.mandarin'
            : slide.id === 'phoneme'
            ? 'phoneme.diagnose'
            : 'agent.reasoning'}
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider ${
            slide.tone === 'emerald'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
              : slide.tone === 'rose'
              ? 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300'
              : slide.tone === 'amber'
              ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'
              : 'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300'
          }`}
        >
          {slide.chip}
        </span>
      </div>

      {/* viewport */}
      <div className="relative min-h-[360px] md:min-h-[400px]">
        {slide.id === 'setup' && <HeroSlideSetup />}
        {slide.id === 'mandarin' && <HeroSlideMandarin />}
        {slide.id === 'phoneme' && <HeroSlidePhoneme />}
        {slide.id === 'reasoning' && <HeroSlideReasoning />}
      </div>
    </div>
  );
}

/* Slide 01 — Instant setup: minimal config + tools registered */
function HeroSlideSetup() {
  return (
    <div className="h-full p-5 md:p-6 flex flex-col gap-4">
      <div className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">
        claude_desktop_config.json
      </div>
      <pre className="flex-1 rounded-xl border border-zinc-900/[0.08] bg-white/50 backdrop-blur-sm p-4 font-mono text-[12.5px] leading-[1.7] whitespace-pre text-zinc-800 overflow-hidden">
<span className="text-zinc-500">{`// drop in, connect.`}</span>{`
`}<span className="text-zinc-700">{`{`}</span>{`
  `}<span className="text-sky-700">{`"mcpServers"`}</span><span className="text-zinc-500">{`: {`}</span>{`
    `}<span className="text-emerald-700">{`"chivox"`}</span><span className="text-zinc-500">{`: {`}</span>{`
      `}<span className="text-sky-700">{`"command"`}</span><span className="text-zinc-500">{`: `}</span><span className="text-amber-700">{`"npx"`}</span><span className="text-zinc-500">{`,`}</span>{`
      `}<span className="text-sky-700">{`"args"`}</span><span className="text-zinc-500">{`: [`}</span><span className="text-amber-700">{`"-y"`}</span><span className="text-zinc-500">{`, `}</span><span className="text-amber-700">{`"@chivox/mcp"`}</span><span className="text-zinc-500">{`]`}</span>{`
    `}<span className="text-zinc-500">{`}`}</span>{`
  `}<span className="text-zinc-500">{`}`}</span>{`
`}<span className="text-zinc-700">{`}`}</span>
      </pre>
      <div className="rounded-lg border border-zinc-900/[0.08] bg-white/50 backdrop-blur-sm px-3 py-2 flex items-center gap-2 font-mono text-[11.5px]">
        <Terminal className="h-3.5 w-3.5 text-zinc-500" />
        <span className="text-zinc-500">$</span>
        <span className="text-zinc-800">npx -y @chivox/mcp</span>
        <span className="ml-auto inline-flex items-center gap-1 text-emerald-700">
          <Check className="h-3 w-3" strokeWidth={3} /> 4 tools registered
        </span>
      </div>
    </div>
  );
}

/* Slide 02 — Mandarin moat: pitch-contour visualization.
 * Hero visual is an F0 trace plot. Text annotations sit at
 * the top and bottom; the "generic-STT mishears it as 睡觉"
 * fact becomes a small side-note rather than a competing
 * red box. Conveys "we see pitch, not just phonemes". */
function HeroSlideMandarin() {
  // Pitch plot layout (viewBox 0-360 × 0-150)
  //   y=10  → high (5)
  //   y=140 → low  (1)
  const y = (v: number) => 10 + ((5 - v) * 130) / 4; // v ∈ [1..5]

  return (
    <div className="h-full p-5 md:p-6 flex flex-col gap-4 relative">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">
          pitch trace · F0 contour
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          locked to tone
        </span>
      </div>

      {/* Target word, big and quiet */}
      <div className="flex items-end justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <span className="font-zh text-[44px] leading-none tracking-tight text-zinc-900">水饺</span>
          <div className="flex flex-col">
            <span className="font-pinyin text-[15px] text-zinc-700">shuǐ jiǎo</span>
            <span className="text-[10.5px] font-mono text-zinc-500">= dumplings</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">target tones</div>
          <div className="font-mono text-[13px] text-zinc-800 tabular-nums">T3 + T3</div>
          <div className="text-[10px] font-mono text-emerald-700">→ sandhi: T2 + T3</div>
        </div>
      </div>

      {/* Pitch-contour plot */}
      <div className="relative rounded-xl border border-zinc-900/[0.08] bg-gradient-to-br from-white/70 via-white/50 to-emerald-50/40 backdrop-blur-sm px-3 pt-3 pb-2">
        <svg viewBox="0 0 360 150" className="w-full h-[150px]" aria-hidden>
          <defs>
            <linearGradient id="traceGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="55%" stopColor="#10b981" />
              <stop offset="55%" stopColor="#059669" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
          </defs>

          {/* gridlines — tone levels 1..5 */}
          {[1, 2, 3, 4, 5].map((lvl) => (
            <g key={lvl}>
              <line x1="24" x2="348" y1={y(lvl)} y2={y(lvl)} stroke="rgba(24,24,27,0.06)" strokeWidth="1" />
              <text x="10" y={y(lvl) + 3} fontSize="8" fontFamily="ui-monospace, monospace" fill="rgba(24,24,27,0.35)">
                {lvl}
              </text>
            </g>
          ))}

          {/* syllable dividers */}
          <line x1="184" x2="184" y1="10" y2="140" stroke="rgba(24,24,27,0.08)" strokeDasharray="3 3" />

          {/* Actual (produced) contour — solid emerald */}
          {/* shuǐ → rises 3→5 (sandhi T2), jiǎo → 2-1-4 dip-rise (T3) */}
          <path
            d="M 30 90  C 70 88, 110 48, 170 18
               L 184 18
               M 198 62  C 230 62, 246 138, 268 134
               C 290 130, 310 90, 340 28"
            fill="none"
            stroke="url(#traceGrad)"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Citation (target) contour — dashed, light */}
          {/* Both syllables drawn as full T3 (2-1-4) to show what citation would be */}
          <path
            d="M 30 62  C 60 130, 110 138, 140 90  C 158 66, 172 30, 184 22
               M 198 62  C 228 130, 260 138, 290 90  C 308 66, 322 30, 336 22"
            fill="none"
            stroke="rgba(16,185,129,0.35)"
            strokeWidth="1.4"
            strokeDasharray="3 3"
            strokeLinecap="round"
          />

          {/* syllable labels */}
          <text x="100" y="145" fontSize="9.5" fontFamily="ui-monospace, monospace" fill="rgba(16,185,129,0.85)" textAnchor="middle">
            shuǐ · rising
          </text>
          <text x="265" y="145" fontSize="9.5" fontFamily="ui-monospace, monospace" fill="rgba(16,185,129,0.85)" textAnchor="middle">
            jiǎo · dip–rise
          </text>

          {/* end dot */}
          <circle cx="340" cy="28" r="3.5" fill="#059669" />
          <circle cx="340" cy="28" r="6" fill="#10b981" opacity="0.18" />
        </svg>

        {/* legend */}
        <div className="flex items-center gap-3 px-1 pt-1 text-[10px] font-mono text-zinc-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-[2px] w-4 rounded-full bg-emerald-600" />
            produced
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-[2px] w-4 rounded-full border-t border-dashed border-emerald-500/60" />
            citation
          </span>
          <span className="ml-auto">F0 · 5-level Chao</span>
        </div>
      </div>

      {/* generic-STT side-note — deliberately small, so the plot stays king */}
      <div className="rounded-lg border border-zinc-900/[0.06] bg-white/50 px-3 py-2 flex items-center gap-2.5">
        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 shrink-0">
          generic STT
        </span>
        <span className="text-[12px] text-zinc-600">
          heard <span className="font-zh text-zinc-800">睡觉</span>{' '}
          <span className="font-pinyin">(shuì jiào · sleep)</span>
        </span>
        <span className="ml-auto text-[10px] font-mono text-rose-500">✕ tone miss</span>
      </div>

      <div className="text-[11px] text-zinc-500 leading-relaxed">
        Catches tones, erhua, neutral tone &amp; sandhi — the difference between{' '}
        <span className="font-pinyin text-zinc-700">mā</span> (mom) and{' '}
        <span className="font-pinyin text-zinc-700">mǎ</span> (horse).
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
function HeroSlidePhoneme() {
  const phones: Array<{
    ipa: string;
    v: number;
    status: 'ok' | 'weak' | 'bad' | 'dropped';
    note?: string;
  }> = [
    { ipa: '/θ/', v: 35, status: 'bad', note: 'heard /s/' },
    { ipa: '/ɪ/', v: 92, status: 'ok' },
    { ipa: '/ŋ/', v: 54, status: 'weak', note: 'weak release' },
    { ipa: '/k/', v: 0,  status: 'dropped', note: 'dropped' },
  ];
  const barCls = (s: (typeof phones)[number]['status']) =>
    s === 'ok'      ? 'bg-gradient-to-t from-emerald-400 to-emerald-600'
    : s === 'weak'  ? 'bg-gradient-to-t from-amber-300 to-amber-500'
    : s === 'bad'   ? 'bg-gradient-to-t from-rose-400 to-rose-600'
    :                 'bg-transparent border border-dashed border-rose-400';
  const chipCls = (s: (typeof phones)[number]['status']) =>
    s === 'ok'      ? 'bg-emerald-50 text-emerald-700 border-emerald-500/30'
    : s === 'weak'  ? 'bg-amber-50 text-amber-700 border-amber-500/40'
    :                 'bg-rose-50 text-rose-700 border-rose-500/30';
  return (
    <div className="h-full p-5 md:p-6 flex flex-col gap-3">
      <div className="flex items-center justify-between text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">
        <span>word · <span className="font-mono normal-case tracking-normal text-foreground/85">think</span></span>
        <span className="font-mono text-[11px] normal-case tracking-normal">/θɪŋk/</span>
      </div>

      {/* phoneme grid */}
      <div className="rounded-xl border border-zinc-900/[0.08] bg-white/60 backdrop-blur-sm p-4">
        <div className="grid grid-cols-4 gap-3">
          {phones.map((p, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              {/* bar */}
              <div className="relative h-[90px] w-full flex items-end">
                <div className="absolute inset-x-0 top-0 h-px bg-zinc-900/[0.06]" />
                <div className="absolute inset-x-0 top-1/3 h-px bg-zinc-900/[0.04]" />
                <div className="absolute inset-x-0 top-2/3 h-px bg-zinc-900/[0.06]" />
                <div
                  className={`mx-auto w-7 rounded-t-[4px] ${barCls(p.status)}`}
                  style={{ height: `${Math.max(p.v, p.status === 'dropped' ? 100 : 0)}%`, minHeight: p.status === 'dropped' ? '100%' : '4px' }}
                />
              </div>
              {/* phoneme label */}
              <div
                className="font-mono text-[13px] font-semibold tabular-nums"
                style={{ fontFamily: 'var(--font-hero-serif, "Fraunces", Georgia, serif)' }}
              >
                {p.ipa}
              </div>
              {/* score / note */}
              <div className={`text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${chipCls(p.status)}`}>
                {p.status === 'dropped' ? '—' : `${p.v}%`}
              </div>
              <div className="min-h-[14px] text-[10px] font-mono text-muted-foreground text-center">
                {p.note ?? '\u00A0'}
              </div>
            </div>
          ))}
        </div>

        {/* supra-segmental strip */}
        <div className="mt-4 pt-3 border-t border-zinc-900/[0.06] grid grid-cols-3 gap-2 text-[11px] font-mono">
          <SupraCell label="STRESS"     state="ok"   value="syllable 1 · ok" />
          <SupraCell label="LIAISON"    state="ok"   value="n/a · ok" />
          <SupraCell label="INTONATION" state="ok"   value="↘ falling · ok" />
        </div>
      </div>

      {/* footer caption */}
      <div className="rounded-xl border border-violet-500/25 bg-gradient-to-br from-violet-500/[0.06] to-white/40 backdrop-blur-sm px-3.5 py-2.5 flex items-center gap-2.5">
        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-violet-700">
          <Waves className="h-3.5 w-3.5" />
        </span>
        <p className="text-[12px] leading-[1.5] text-foreground/85">
          <span className="font-mono font-semibold text-violet-700">60+ phonemes</span> scored for accuracy, stress
          and intonation — not a single opaque number.
        </p>
      </div>
    </div>
  );
}

function SupraCell({
  label,
  state,
  value,
}: {
  label: string;
  state: 'ok' | 'warn' | 'bad';
  value: string;
}) {
  const cls =
    state === 'ok'
      ? 'text-emerald-700 before:bg-emerald-500'
      : state === 'warn'
      ? 'text-amber-700 before:bg-amber-500'
      : 'text-rose-700 before:bg-rose-500';
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className={`inline-flex items-center gap-1.5 uppercase tracking-[0.14em] text-[10px] ${cls} before:inline-block before:h-1.5 before:w-1.5 before:rounded-full`}>
        {label}
      </span>
      <span className="text-[11px] text-foreground/80 truncate">{value}</span>
    </div>
  );
}

function HeroSlideReasoning() {
  return (
    <div className="h-full p-5 md:p-6 flex flex-col gap-3">
      <div className="flex items-center justify-between text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">
        <span>full matrix → agent reasoning</span>
        <span className="font-mono normal-case tracking-normal text-amber-700">not one score</span>
      </div>
      <pre className="rounded-xl border border-zinc-900/[0.08] bg-white/55 backdrop-blur-sm p-3 font-mono text-[10.5px] sm:text-[11px] leading-[1.5] whitespace-pre text-zinc-800 max-h-[min(200px,38vh)] overflow-auto">
        {HERO_SLIDE_REASONING_JSON}
      </pre>

      <div className="flex items-center justify-center text-muted-foreground/60">
        <ArrowRight className="h-4 w-4 rotate-90" />
      </div>

      <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/[0.07] to-white/40 backdrop-blur-sm p-4">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/15 text-amber-700">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-700">
              Agent reply · auto-generated
            </span>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
            o1 · Sonnet · Gemini
          </span>
        </div>
        <p className="text-[13px] leading-[1.55] text-foreground/85">
          &ldquo;I noticed you pronounced <strong>think</strong> as <em>sink</em>. Place your tongue between your teeth for the{' '}
          <code className="font-mono text-[12px] px-1 py-0.5 rounded bg-white/60 border border-zinc-900/[0.06]">/θ/</code>{' '}
          sound. Try: <em>&ldquo;Thirty thirsty thinkers thought&hellip;&rdquo;</em>&rdquo;
        </p>
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
      {/* Header rail — toggle + payload-contract + locales-on-request,
          consolidated into one row so language signal isn't duplicated. */}
      <div className="mb-3 flex flex-wrap items-center gap-2.5">
        <div className="inline-flex items-center gap-1 rounded-full border border-zinc-900/[0.08] bg-white/70 backdrop-blur-sm p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
          <button
            type="button"
            onClick={() => setLang('zh')}
            aria-pressed={isZh}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium whitespace-nowrap transition-all duration-200 ${
              isZh
                ? 'bg-gradient-to-r from-rose-500/15 to-amber-500/10 text-rose-800 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.3)]'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <span aria-hidden className="text-[13px] leading-none">🇨🇳</span>
            <span className="font-mono text-[11px]">zh-CN</span>
            <span className="opacity-70">· tones · sandhi</span>
          </button>
          <button
            type="button"
            onClick={() => setLang('en')}
            aria-pressed={!isZh}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium whitespace-nowrap transition-all duration-200 ${
              !isZh
                ? 'bg-gradient-to-r from-sky-500/15 to-indigo-500/10 text-sky-800 shadow-[inset_0_0_0_1px_rgba(14,165,233,0.3)]'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <span aria-hidden className="text-[13px] leading-none">🇬🇧</span>
            <span className="font-mono text-[11px]">en-US</span>
            <span className="opacity-70">· phonemes · CEFR</span>
          </button>
        </div>

        <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground whitespace-nowrap">
          <ArrowRight className="h-3 w-3 text-emerald-600" aria-hidden />
          same{' '}
          <span className="font-mono text-foreground/80">pron.*</span> /{' '}
          <span className="font-mono text-foreground/80">details[]</span> contract
        </span>

        <span className="ml-auto text-[11px] italic text-muted-foreground whitespace-nowrap hidden md:inline-block">
          Other locales on request.
        </span>
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
  switch (id) {
    case 'mandarin':
      return <ArtMandarin />;
    case 'english':
      return <ArtEnglish />;
    case 'kids':
      return <ArtKids />;
    case 'podcast':
      return <ArtPodcast />;
    case 'voice':
      return <ArtVoice />;
    case 'ecosystem':
      return <ArtEcosystem />;
  }
}

/* ── AI Mandarin Tutor · 红橙渐变 + 大 汉字 + 声调轮廓 ───── */
function ArtMandarin() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-white to-amber-50 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(244,63,94,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(244,63,94,0.08) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      <div className="absolute -top-16 -right-10 h-56 w-56 rounded-full bg-rose-200/50 blur-3xl" />

      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="font-zh text-rose-400/35 text-[120px] md:text-[140px] font-semibold leading-none"
          style={{ letterSpacing: '-0.04em' }}
        >
          语
        </span>
      </div>

      <svg viewBox="0 0 320 180" className="absolute inset-0 w-full h-full">
        <g stroke="rgb(225,29,72)" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.55">
          <path d="M20 40 L110 40" />
          <path d="M20 150 Q65 150 110 70" />
          <path d="M210 60 L240 130 L280 120 L310 80" />
          <path d="M210 40 L310 130" />
        </g>
      </svg>

      <div className="absolute left-4 top-4 flex flex-wrap gap-1.5">
        {[
          { t: 'nǐ', k: 'T3' },
          { t: 'hǎo', k: 'T3' },
          { t: 'jīn', k: 'T1' },
        ].map((p) => (
          <span
            key={p.t}
            className="rounded-md bg-white/90 backdrop-blur-sm px-2 py-0.5 text-[10px] font-pinyin text-rose-700 border border-rose-200 shadow-sm flex items-center gap-1"
          >
            {p.t}
            <span className="font-mono text-[9px] text-rose-500/80">{p.k}</span>
          </span>
        ))}
      </div>

      <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-md bg-white/90 backdrop-blur-sm px-2 py-1 text-[10px] font-mono text-rose-700 border border-rose-200 shadow-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        tone score · 88
      </div>
    </div>
  );
}

/* ── English Conversation Partner · 蓝紫渐变 + chat + wave ── */
function ArtEnglish() {
  const bars = Array.from({ length: 40 }).map((_, i) =>
    Math.max(0.25, Math.abs(Math.sin(i * 0.55) * Math.cos(i * 0.23 + 1)) + 0.2),
  );
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-violet-500 to-sky-500 overflow-hidden">
      <div className="absolute inset-0 opacity-[0.22] mix-blend-overlay"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '18px 18px',
        }}
      />
      <div className="absolute -top-10 right-10 h-48 w-48 rounded-full bg-white/20 blur-2xl" />

      {/* chat bubbles */}
      <div className="absolute top-4 left-4 rounded-xl bg-white/90 backdrop-blur-sm px-2.5 py-1.5 text-[11px] text-indigo-800 shadow-md border border-white/70 max-w-[60%]">
        How would you pronounce <em className="not-italic font-semibold">gorgeous</em>?
      </div>
      <div className="absolute top-[55%] right-3 rounded-xl bg-indigo-950/70 backdrop-blur-sm px-2.5 py-1.5 text-[11px] text-white shadow-md border border-white/20">
        GPT · you said /gor-ʒuːs/
      </div>

      {/* waveform */}
      <svg viewBox="0 0 320 60" className="absolute bottom-3 left-3 right-3 w-[calc(100%-1.5rem)] h-12">
        {bars.map((h, i) => {
          const x = Number(((i / bars.length) * 320).toFixed(2));
          const barH = Number((h * 50).toFixed(2));
          const y = Number((30 - barH / 2).toFixed(2));
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width="4"
              height={barH}
              rx="1.5"
              fill="white"
              opacity={0.85}
            />
          );
        })}
      </svg>

      {/* score chip */}
      <div className="absolute bottom-16 right-3 inline-flex items-center gap-1.5 rounded-md bg-white/90 backdrop-blur-sm px-2 py-1 text-[10px] font-mono text-indigo-700 border border-white/70 shadow-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        fluency · 82
      </div>
    </div>
  );
}

/* ── Kids' Reading Coach · 粉-桃渐变 + 星星 + 书 + phonics ─── */
function ArtKids() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-pink-400 via-fuchsia-400 to-rose-300 overflow-hidden">
      <div className="absolute inset-0 opacity-[0.2] mix-blend-overlay"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.7) 1.2px, transparent 1.2px)',
          backgroundSize: '20px 20px',
        }}
      />
      <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-yellow-200/40 blur-2xl" />

      {/* book */}
      <svg viewBox="0 0 200 120" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%]">
        <defs>
          <linearGradient id="bookPage" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#fff0f6" />
          </linearGradient>
        </defs>
        <path
          d="M100 20 C70 10 40 12 20 22 L20 100 C40 90 70 92 100 100 C130 92 160 90 180 100 L180 22 C160 12 130 10 100 20 Z"
          fill="url(#bookPage)"
          stroke="white"
          strokeWidth="2"
          opacity="0.95"
        />
        <line x1="100" y1="20" x2="100" y2="100" stroke="#f9a8d4" strokeWidth="1.5" />
        {/* text lines */}
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <line x1="30" y1={40 + i * 16} x2="90" y2={40 + i * 16} stroke="#f472b6" strokeWidth="2" opacity="0.65" />
            <line x1="110" y1={40 + i * 16} x2="170" y2={40 + i * 16} stroke="#f472b6" strokeWidth="2" opacity={i === 1 ? 0.3 : 0.65} />
          </g>
        ))}
      </svg>

      {/* stars */}
      {[
        { cx: 30, cy: 30, r: 5 },
        { cx: 290, cy: 40, r: 7 },
        { cx: 40, cy: 150, r: 6 },
        { cx: 280, cy: 160, r: 4 },
      ].map((s, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className="absolute text-yellow-300"
          style={{ left: s.cx, top: s.cy, width: s.r * 3, height: s.r * 3 }}
        >
          <path
            d="M12 2 L14.5 9 L22 9.5 L16 14 L18 22 L12 17.5 L6 22 L8 14 L2 9.5 L9.5 9 Z"
            fill="currentColor"
            stroke="white"
            strokeWidth="1"
          />
        </svg>
      ))}

      {/* phonics badges */}
      <div className="absolute bottom-3 left-3 flex gap-1.5">
        {['/æ/', '/t/', '/s/'].map((p) => (
          <span
            key={p}
            className="rounded-md bg-white/85 backdrop-blur-sm px-2 py-0.5 text-[10px] font-mono text-fuchsia-700 border border-white/60 shadow-sm"
          >
            {p}
          </span>
        ))}
      </div>
      <div className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-sm px-2 py-0.5 text-[10px] font-mono text-rose-600 border border-white/70 shadow-sm">
        ⭐ 5 / 5
      </div>
    </div>
  );
}

/* ── Content QA · 青/绿渐变 + 波形 + 时间轴 + retake 标记 ── */
function ArtPodcast() {
  const bars = Array.from({ length: 60 }).map((_, i) =>
    Math.abs(Math.sin(i * 0.35) * Math.cos(i * 0.7 + 2)) + 0.15,
  );
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-teal-50 overflow-hidden">
      <div className="absolute inset-0 opacity-[0.45]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(16,185,129,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.08) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="absolute -bottom-12 right-10 h-44 w-44 rounded-full bg-emerald-200/40 blur-3xl" />

      <svg viewBox="0 0 320 100" className="absolute inset-x-4 top-1/2 -translate-y-1/2 w-[calc(100%-2rem)] h-24">
        {bars.map((h, i) => {
          const x = Number(((i / bars.length) * 320).toFixed(2));
          const barH = Number((h * 80).toFixed(2));
          const y = Number((50 - barH / 2).toFixed(2));
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width="3.5"
              height={barH}
              rx="1.5"
              fill="rgb(5,150,105)"
              opacity={i >= 28 && i <= 36 ? 0.22 : 0.65}
            />
          );
        })}
        <rect x={146} y={10} width="44" height="80" rx="4" fill="rgba(5,150,105,0.08)" stroke="rgb(5,150,105)" strokeOpacity="0.55" strokeDasharray="3 3" />
        <text x={168} y={8} textAnchor="middle" fontSize="9" fontFamily="ui-monospace, monospace" fill="rgb(6,95,70)">
          retake
        </text>
      </svg>

      <div className="absolute bottom-3 inset-x-3 flex justify-between text-[10px] font-mono text-emerald-800">
        <span>00:00</span>
        <span className="text-emerald-600/60">·</span>
        <span className="bg-white/80 rounded px-1.5 py-0.5 border border-emerald-200">01:24 retake</span>
        <span className="text-emerald-600/60">·</span>
        <span>02:48</span>
      </div>

      <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-md bg-white/90 backdrop-blur-sm px-2 py-1 text-[10px] font-mono text-emerald-700 border border-emerald-200 shadow-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        AI QA · live
      </div>
    </div>
  );
}

/* ── Voice Agents · 紫渐变 + IM 聊天线程 + 语音消息 ──────── */
function ArtVoice() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-sky-50 overflow-hidden">
      <div className="absolute inset-0 opacity-[0.45]"
        style={{
          backgroundImage: 'radial-gradient(rgba(139,92,246,0.10) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />
      <div className="absolute -top-10 -left-10 h-48 w-48 rounded-full bg-violet-200/50 blur-3xl" />

      <div className="absolute inset-0 p-5 flex flex-col gap-2 justify-center">
        <div className="flex items-center gap-2 max-w-[82%]">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-300 to-violet-400 shrink-0 shadow-sm" />
          <div className="rounded-2xl rounded-bl-sm bg-white px-3 py-2 flex items-center gap-2 shadow-sm border border-violet-100">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-violet-600" fill="currentColor">
              <path d="M8 5v14l11-7L8 5z" />
            </svg>
            <div className="flex items-end gap-0.5 h-4">
              {[4, 8, 12, 10, 14, 8, 6, 10, 5].map((h, i) => (
                <span key={i} className="w-0.5 rounded-full bg-violet-500" style={{ height: `${h}px` }} />
              ))}
            </div>
            <span className="text-[10px] font-mono text-violet-700">0:06</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 max-w-[90%] ml-auto">
          <div className="rounded-2xl rounded-br-sm bg-violet-900/92 backdrop-blur-sm px-3 py-2 flex items-center gap-2 shadow-sm">
            <span className="text-[11px] text-white/95">Scored</span>
            <span className="rounded-md bg-emerald-400/25 text-emerald-100 px-1.5 py-0.5 text-[10px] font-mono">overall 84</span>
            <span className="rounded-md bg-amber-400/25 text-amber-100 px-1.5 py-0.5 text-[10px] font-mono">fluency 78</span>
          </div>
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 shrink-0 shadow-sm flex items-center justify-center text-[10px] font-bold text-white">
            ai
          </div>
        </div>

        <div className="flex items-center gap-2 max-w-[70%]">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-300 to-violet-400 shrink-0 shadow-sm" />
          <div className="rounded-2xl rounded-bl-sm bg-white px-3 py-1.5 shadow-sm border border-violet-100 text-[11px] text-violet-800">
            Try it again, focus on /θ/
          </div>
        </div>
      </div>

      <div className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-md bg-white/90 backdrop-blur-sm px-2 py-1 text-[10px] font-mono text-violet-700 border border-violet-200 shadow-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        voice · live
      </div>
    </div>
  );
}

/* ── Dev Ecosystem · 绿渐变 + 中心节点 + 客户端星环 ──────── */
function ArtEcosystem() {
  const NODES = [
    { label: 'Cursor', angle: -90 },
    { label: 'Claude', angle: -30 },
    { label: 'Cline', angle: 30 },
    { label: 'LangChain', angle: 90 },
    { label: 'Zed', angle: 150 },
    { label: 'Dify', angle: 210 },
  ];
  const rx = 110;
  const ry = 58;
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-white to-emerald-50 overflow-hidden">
      <div className="absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(14,165,233,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,0.08) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      <div className="absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-sky-200/40 blur-3xl" />

      <svg viewBox="0 0 320 180" className="absolute inset-0 w-full h-full">
        <ellipse cx="160" cy="90" rx={rx + 10} ry={ry + 10} stroke="rgb(14,165,233)" strokeOpacity="0.25" strokeDasharray="3 5" fill="none" />
        <ellipse cx="160" cy="90" rx={rx - 20} ry={ry - 14} stroke="rgb(14,165,233)" strokeOpacity="0.18" strokeDasharray="2 4" fill="none" />

        {NODES.map((n) => {
          const rad = (n.angle * Math.PI) / 180;
          const x = 160 + Math.cos(rad) * rx;
          const y = 90 + Math.sin(rad) * ry;
          return (
            <line
              key={n.label}
              x1="160"
              y1="90"
              x2={x}
              y2={y}
              stroke="rgb(14,165,233)"
              strokeOpacity="0.35"
              strokeWidth="1"
            />
          );
        })}

        <circle cx="160" cy="90" r="24" fill="white" stroke="rgb(14,165,233)" strokeOpacity="0.35" />
        <text
          x="160"
          y="94"
          textAnchor="middle"
          fontSize="11"
          fontWeight="700"
          fill="#0369a1"
          fontFamily="ui-sans-serif, system-ui"
        >
          chivox
        </text>

        {NODES.map((n) => {
          const rad = (n.angle * Math.PI) / 180;
          const x = 160 + Math.cos(rad) * rx;
          const y = 90 + Math.sin(rad) * ry;
          return (
            <g key={n.label}>
              <circle cx={x} cy={y} r="4" fill="rgb(14,165,233)" />
              <rect
                x={x - 30}
                y={y + 8}
                width="60"
                height="16"
                rx="5"
                fill="white"
                stroke="rgb(14,165,233)"
                strokeOpacity="0.25"
              />
              <text
                x={x}
                y={y + 19}
                textAnchor="middle"
                fontSize="9"
                fontFamily="ui-sans-serif, system-ui"
                fill="#0369a1"
                fontWeight="600"
              >
                {n.label}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-md bg-white/90 backdrop-blur-sm px-2 py-1 text-[10px] font-mono text-sky-700 border border-sky-200 shadow-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        MCP · 1 config
      </div>
      <div className="absolute bottom-3 right-3 text-[10px] font-mono text-sky-700/80">
        + LlamaIndex · OpenAI Agents SDK
      </div>
    </div>
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
void Globe2;
