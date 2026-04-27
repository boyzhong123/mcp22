'use client';

/* ════════════════════════════════════════════════════════════════════════
 *  /global/demo — Standalone showcase for the overseas developer landing.
 *
 *  INTENT
 *  ------
 *  This page is INTENTIONALLY SEPARATE from /en/demo and /[locale]/demo.
 *  Do NOT refactor the two demos together. The existing /en/demo page is
 *  a bilingual, recorded-audio interactive experience tied to next-intl.
 *  This /global/demo is a static, English-first showcase that walks a
 *  Western developer through what Chivox MCP actually returns and how an
 *  LLM can reason over it — using Mandarin as the headline example (the
 *  “why MCP” differentiator) with English as a secondary tab.
 *
 *  DESIGN
 *  ------
 *  • Brand-matched with /global: warm cream / emerald / amber glassy
 *    surfaces. No dark slate panels (that belongs to /en/dev-en).
 *  • Four stages displayed as vertical cards:
 *      01 Input           — reference text + recorded audio row
 *      02 MCP response    — annotated JSON with field callouts
 *      03 LLM diagnosis   — streamed teacher-like feedback
 *      04 Auto-generated  — targeted drill the agent writes back
 *  • Auto-advance timeline cycles the spotlight stage; hovering pauses.
 *  • Mandarin = default tab (the moat); English = secondary.
 * ══════════════════════════════════════════════════════════════════════ */

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BackToOverview } from '../_chrome';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  AudioWaveform,
  Check,
  Copy,
  Mic2,
  Play,
  Sparkles,
  Languages,
  Terminal,
} from 'lucide-react';

/* ──────────────────────────────────────────────────────────────────────
 *  Scenarios — two self-contained mock payloads.
 *
 *  Copy mirrors the real Chivox MCP response shape (overall, pron.*,
 *  fluency, audio_quality, details[] with per-item phonemes/tone).
 * ──────────────────────────────────────────────────────────────────── */

type PhonemeRow = { ipa: string; score: number; note?: string; tone?: 'ok' | 'weak' | 'bad' | 'good' };

type DetailRow = {
  label: string;               // word or 汉字
  pinyin?: string;             // only for Mandarin
  toneRef?: 1 | 2 | 3 | 4;
  toneDetected?: 1 | 2 | 3 | 4;
  toneConfidence?: number[];   // [neutral, T1, T2, T3, T4]
  start: number;               // ms
  end: number;                 // ms
  score: number;
  dpType: 'normal' | 'mispron' | 'wrong_tone' | 'omit';
  phonemes?: PhonemeRow[];
  note?: string;
};

type Scenario = {
  id: 'mandarin' | 'english';
  flag: string;
  locale: string;
  kicker: string;
  title: string;
  blurb: string;
  reference: { text: string; romanization?: string; gloss: string };
  audio: { durationMs: number; sampleRate: string };
  pron: { accuracy: number; integrity: number; fluency: number; rhythm: number; tone?: number };
  overall: number;
  fluencyMeta: { pauseCount: number; speed: number };
  audioQuality: { snr: number; clip: number; volume: number };
  genericSttHeard: string;        // contrast row ("Whisper shrugged and heard …")
  genericSttMeaning: string;      // plain-English gloss of what STT heard
  details: DetailRow[];
  diagnosis: string[];            // LLM pass 2 — teacher-style feedback paragraphs
  drill: { title: string; items: { label: string; content: string; meta?: string }[] }[];
};

const MANDARIN: Scenario = {
  id: 'mandarin',
  flag: '🇨🇳',
  locale: 'zh-CN',
  kicker: 'Scenario 01 · tonal hard-mode',
  title: 'The learner tries to order dumplings.',
  blurb:
    'They say “shuǐ jiǎo” (水饺, dumplings). A generic STT mishears it as “shuì jiào” (睡觉, to sleep) — same syllables, different tones, completely different meaning. Watch what MCP actually hears.',
  reference: { text: '我想吃水饺', romanization: 'wǒ xiǎng chī shuǐ jiǎo', gloss: '“I want to eat dumplings.”' },
  audio: { durationMs: 2380, sampleRate: '16kHz · mono' },
  pron: { accuracy: 78, integrity: 100, fluency: 84, rhythm: 72, tone: 68 },
  overall: 76,
  fluencyMeta: { pauseCount: 1, speed: 102 },
  audioQuality: { snr: 23.4, clip: 0, volume: 2280 },
  genericSttHeard: '我想睡觉',
  genericSttMeaning: '“I want to sleep.”',
  details: [
    {
      label: '我', pinyin: 'wǒ', toneRef: 3, toneDetected: 3, toneConfidence: [2, 4, 6, 82, 6],
      start: 0, end: 280, score: 92, dpType: 'normal',
    },
    {
      label: '想', pinyin: 'xiǎng', toneRef: 3, toneDetected: 3, toneConfidence: [3, 5, 10, 74, 8],
      start: 280, end: 700, score: 85, dpType: 'normal',
    },
    {
      label: '吃', pinyin: 'chī', toneRef: 1, toneDetected: 1, toneConfidence: [2, 80, 8, 6, 4],
      start: 700, end: 1040, score: 88, dpType: 'normal',
    },
    {
      label: '水',
      pinyin: 'shuǐ',
      toneRef: 3,
      toneDetected: 2,
      toneConfidence: [2, 4, 74, 16, 4],
      start: 1040, end: 1620, score: 86, dpType: 'normal',
      note: 'Detected as T2 (rising) — this is the T3+T3 → T2+T3 sandhi rule correctly applied. Citation is T3, but natural speech expects T2 here.',
      phonemes: [
        { ipa: 'ʂ', score: 88, tone: 'ok' },
        { ipa: 'w', score: 84, tone: 'ok' },
        { ipa: 'eɪ', score: 82, tone: 'ok' },
      ],
    },
    {
      label: '饺',
      pinyin: 'jiǎo',
      toneRef: 3,
      toneDetected: 4,
      toneConfidence: [2, 4, 8, 28, 58],
      start: 1620, end: 2380, score: 40, dpType: 'wrong_tone',
      note: 'Detected as T4 (falling) — this is the single error that flips the utterance to 睡觉 “sleep”.',
      phonemes: [
        { ipa: 'tɕ', score: 82, tone: 'ok' },
        { ipa: 'j', score: 86, tone: 'ok' },
        { ipa: 'au', score: 78, tone: 'ok' },
      ],
    },
  ],
  diagnosis: [
    '**The overall read is fine (76) but one syllable flips the meaning.** Your 饺 landed as T4 — a sharp fall — instead of the dipping T3. To a native listener this is the difference between “饺 (dumplings)” and “觉 (sleep).”',
    '**Nice work on the sandhi.** 水饺 is T3 + T3, so textbook Mandarin becomes **2nd + 3rd** in real speech, and that is exactly what the model detected on 水 (rising). The segment is right; the error is only on 饺.',
    '**Pacing is good.** 102 characters/min, one natural pause. No fluency issue — your only drill is the dipping T3 on 饺.',
  ],
  drill: [
    {
      title: 'Tone contrast drill',
      items: [
        {
          label: 'T3 dip — 饺 vs 觉',
          content: 'jiǎo · jiào · jiǎo · jiào — alternate six times. Feel the difference between the dip and the fall.',
          meta: '30 s',
        },
        {
          label: 'T3 + T3 sandhi',
          content: 'shuǐ jiǎo → shuí jiǎo — rising first, dipping second. Five repeats, then use in: "我 想 / 吃 / 水饺."',
          meta: '45 s',
        },
      ],
    },
    {
      title: 'Meaning check',
      items: [
        {
          label: 'Contextual minimal pairs',
          content: '我想吃水饺 (dumplings) ↔ 我想睡觉 (sleep). Record both; re-run MCP; confirm tone scores flip for 饺/觉.',
          meta: '60 s',
        },
      ],
    },
  ],
};

const ENGLISH: Scenario = {
  id: 'english',
  flag: '🇺🇸',
  locale: 'en-US',
  kicker: 'Scenario 02 · segmental',
  title: 'Learner reads a B1 sentence.',
  blurb:
    'They attempt “The weather is absolutely gorgeous today.” The words are right, but which phonemes softened, which vowels collapsed, and how is the stress shaped?',
  reference: { text: 'The weather is absolutely gorgeous today.', gloss: 'A B1 sample sentence for sentence-level scoring.' },
  audio: { durationMs: 2940, sampleRate: '16kHz · mono' },
  pron: { accuracy: 71, integrity: 95, fluency: 86, rhythm: 74 },
  overall: 78,
  fluencyMeta: { pauseCount: 2, speed: 128 },
  audioQuality: { snr: 22.1, clip: 0, volume: 2430 },
  genericSttHeard: 'the weather is absolutely gorgeous today',
  genericSttMeaning: 'Correct at the word level — but notice what it misses below.',
  details: [
    { label: 'the', start: 0, end: 160, score: 80, dpType: 'normal' },
    { label: 'weather', start: 160, end: 580, score: 84, dpType: 'normal' },
    { label: 'is', start: 580, end: 720, score: 88, dpType: 'normal' },
    {
      label: 'absolutely',
      start: 720, end: 1520, score: 63, dpType: 'mispron',
      note: 'Primary stress should land on the third syllable — ab-so-LUTE-ly /ˌæb.səˈluːt.li/ — but the stressed /uː/ was reduced to a short /ʊ/, flattening the whole word.',
      phonemes: [
        { ipa: 'æ', score: 76, tone: 'ok' },
        { ipa: 'b', score: 86, tone: 'ok' },
        { ipa: 's', score: 82, tone: 'ok' },
        { ipa: 'ə', score: 90, tone: 'good' },
        { ipa: 'l', score: 74, tone: 'ok' },
        { ipa: 'uː', score: 40, tone: 'bad', note: 'stressed /uː/ was clipped to /ʊ/ — word lost its primary stress' },
        { ipa: 't', score: 80, tone: 'ok' },
        { ipa: 'li', score: 78, tone: 'ok' },
      ],
    },
    {
      label: 'gorgeous',
      start: 1520, end: 2360, score: 44, dpType: 'mispron',
      note: 'American /ˈɡɔːr.dʒəs/ — the affricate /dʒ/ softened to /ʒ/ and the final /əs/ went silent.',
      phonemes: [
        { ipa: 'ɡ', score: 92, tone: 'ok' },
        { ipa: 'ɔː', score: 74, tone: 'ok' },
        { ipa: 'r', score: 70, tone: 'weak', note: 'rhotic /r/ thinned but audible' },
        { ipa: 'dʒ', score: 30, tone: 'bad', note: 'came out closer to /ʒ/' },
        { ipa: 'əs', score: 0, tone: 'bad', note: 'dropped' },
      ],
    },
    { label: 'today', start: 2360, end: 2940, score: 82, dpType: 'normal' },
  ],
  diagnosis: [
    '**Your rhythm is good (74)** — the whole sentence moves cleanly. The scoring drop is two specific phonemes, not your overall speech.',
    '**“gorgeous” lost the affricate /dʒ/.** You produced a soft /ʒ/ (like the “s” in “measure”) where the word needs a stop-fricative combo (d→ʒ). The trailing /əs/ disappeared entirely — practice the full word-final sequence.',
    '**Stress on “absolutely”** landed flat — primary stress is on the **third** syllable, ab-so-**LUTE**-ly. Stretch the /uː/ there; that single change recovers 10+ points on `accuracy`.',
  ],
  drill: [
    {
      title: 'Phoneme repair',
      items: [
        { label: '/dʒ/ affricate drill', content: 'judge · gem · gorgeous · major · magic — exaggerate the stop before the fricative.', meta: '30 s' },
        { label: 'Final /-əs/ resurface', content: '“gor-juhss” · “-juhss” · “-juhss” — commit to the final sibilant.', meta: '20 s' },
      ],
    },
    {
      title: 'Stress & rhythm',
      items: [
        { label: 'ab-so-LUTE-ly', content: 'clap on the third syllable three times, then say the word holding a long /uː/; repeat the full sentence.', meta: '40 s' },
      ],
    },
  ],
};

const SCENARIOS: Record<'mandarin' | 'english', Scenario> = {
  mandarin: MANDARIN,
  english: ENGLISH,
};

/* Helpers */
const TONE_NAMES = ['neutral', 'T1 (level)', 'T2 (rising)', 'T3 (dipping)', 'T4 (falling)'];

const DP_LABEL: Record<DetailRow['dpType'], { label: string; cls: string }> = {
  normal:      { label: 'OK',        cls: 'border-emerald-500/30 bg-emerald-50 text-emerald-700' },
  mispron:     { label: 'mispron',   cls: 'border-rose-500/30 bg-rose-50 text-rose-700' },
  wrong_tone:  { label: 'wrong-tone',cls: 'border-rose-500/30 bg-rose-50 text-rose-700' },
  omit:        { label: 'omitted',   cls: 'border-amber-500/30 bg-amber-50 text-amber-700' },
};

function scoreTone(score: number) {
  if (score >= 80) return 'text-emerald-700';
  if (score >= 65) return 'text-amber-700';
  return 'text-rose-700';
}

function scoreBarCls(score: number) {
  if (score >= 80) return 'bg-gradient-to-t from-emerald-400 to-emerald-600';
  if (score >= 65) return 'bg-gradient-to-t from-amber-300 to-amber-500';
  return 'bg-gradient-to-t from-rose-400 to-rose-600';
}

/* ════════════════════════════════════════════════════════════════════
 *  PAGE
 * ══════════════════════════════════════════════════════════════════ */

export default function GlobalDemoPage() {
  const [scenarioId, setScenarioId] = useState<'mandarin' | 'english'>('mandarin');
  const [stage, setStage] = useState<1 | 2 | 3 | 4>(1);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const scenario = SCENARIOS[scenarioId];

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  /* auto-advance the spotlight stage every ~3.2s, resets on scenario change */
  useEffect(() => {
    if (paused || reduceMotion) return;
    const t = window.setTimeout(() => {
      setStage((s) => (s === 4 ? 1 : ((s + 1) as 1 | 2 | 3 | 4)));
    }, 3200);
    return () => clearTimeout(t);
  }, [stage, paused, reduceMotion, scenarioId]);

  useEffect(() => {
    setStage(1);
  }, [scenarioId]);

  return (
    <main className="min-h-screen text-foreground" lang="en">
      <AmbientBackdrop />
      <DemoHeader />

      <BackToOverview containerClassName="container mx-auto px-5 sm:px-7 lg:px-10 max-w-7xl pt-6" />

      <section className="container mx-auto px-5 sm:px-7 lg:px-10 pt-5 pb-6 max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-emerald-700 mb-3">
            /demo · live walkthrough
          </p>
          <h1 className="text-[34px] md:text-[44px] font-black tracking-[-0.035em] leading-[1.05] mb-3 text-zinc-900">
            A one-minute tour of what your LLM actually gets.
          </h1>
          <p className="text-[15.5px] md:text-[16px] text-muted-foreground leading-relaxed">
            No recording required. Press play on either scenario below and watch the MCP payload, the LLM
            diagnosis, and the targeted drill your agent can generate — all from the same response. Mandarin
            is first: it&apos;s the moat most developers underestimate.
          </p>
        </div>
      </section>

      {/* scenario tabs + control bar */}
      <section className="container mx-auto px-5 sm:px-7 lg:px-10 max-w-7xl">
        <div
          className="rounded-2xl border border-zinc-900/[0.08] bg-white/65 backdrop-blur-xl px-3 py-3 sm:px-4 sm:py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-[0_1px_0_rgba(255,255,255,0.85)_inset]"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="flex items-center gap-1 bg-zinc-100/70 rounded-full p-1">
            {(['mandarin', 'english'] as const).map((id) => {
              const active = id === scenarioId;
              const s = SCENARIOS[id];
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setScenarioId(id)}
                  aria-pressed={active}
                  className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-all ${
                    active
                      ? 'bg-white shadow-sm text-zinc-900'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <span>{s.flag}</span>
                  <span>{id === 'mandarin' ? 'Mandarin (hard mode)' : 'English'}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-[11.5px] text-muted-foreground">
            <Languages className="h-3.5 w-3.5 text-emerald-600" />
            <span className="font-mono">
              locale: <span className="text-foreground/80">{scenario.locale}</span>
            </span>
            <span className="text-muted-foreground/60">·</span>
            <span className="font-mono">
              stage{' '}
              <span className="text-foreground/85 font-semibold">
                0{stage}
              </span>
              /04
            </span>
            <span className="text-muted-foreground/60">·</span>
            <span>{paused ? 'paused (hover)' : 'auto-advancing'}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStage(1)}
              className="inline-flex items-center gap-1 rounded-full border border-zinc-900/10 bg-white px-3 py-1.5 text-[11.5px] font-semibold text-zinc-800 hover:border-zinc-900/30 transition-colors"
            >
              <Play className="h-3 w-3 text-emerald-600" />
              Replay
            </button>
            <Link
              href="/login"
              className="inline-flex items-center gap-1 rounded-full bg-zinc-900 text-white px-3.5 py-1.5 text-[11.5px] font-semibold hover:-translate-y-px transition-all shadow-sm"
            >
              Get API key
              <ArrowRight className="h-3 w-3 opacity-85" />
            </Link>
          </div>
        </div>
      </section>

      {/* scenario hero */}
      <section className="container mx-auto px-5 sm:px-7 lg:px-10 mt-8 max-w-7xl">
        <ScenarioHero scenario={scenario} />
      </section>

      {/* four stages */}
      <section className="container mx-auto px-5 sm:px-7 lg:px-10 mt-10 max-w-7xl">
        <div className="grid gap-6">
          <Stage num="01" title="Input" runner="Chivox MCP tool call" active={stage === 1}>
            <Stage01Input scenario={scenario} />
          </Stage>
          <Stage num="02" title="MCP response" runner="Phonetic matrix · ~40 fields" active={stage === 2}>
            <Stage02Response scenario={scenario} />
          </Stage>
          <Stage num="03" title="LLM diagnosis" runner="Your model reads the matrix" active={stage === 3}>
            <Stage03Diagnosis scenario={scenario} active={stage === 3} reduceMotion={reduceMotion} />
          </Stage>
          <Stage num="04" title="Auto-generated drill" runner="Agent plans next-session practice" active={stage === 4}>
            <Stage04Drill scenario={scenario} />
          </Stage>
        </div>
      </section>

      {/* closer */}
      <section className="container mx-auto px-5 sm:px-7 lg:px-10 mt-14 mb-20 max-w-7xl">
        <div className="rounded-3xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/[0.08] via-amber-500/[0.05] to-white/30 backdrop-blur-xl p-8 md:p-12 text-center shadow-[0_1px_0_rgba(255,255,255,0.85)_inset]">
          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-emerald-700 mb-3">Ready to wire it up?</p>
          <h2 className="text-[28px] md:text-[36px] font-black tracking-[-0.03em] leading-[1.1] mb-4 text-zinc-900">
            Same payload. Your agent. Your production loop.
          </h2>
          <p className="text-[14.5px] text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-7">
            Drop Chivox MCP into Cursor, Claude Desktop, or any agent SDK. One{' '}
            <code className="font-mono text-foreground/80 bg-white/70 px-1.5 py-0.5 rounded">npx</code> and
            you&apos;re reading the same JSON you just saw above.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/#quickstart"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-zinc-900 text-white text-sm font-semibold hover:-translate-y-px transition-all shadow-sm"
            >
              <Terminal className="h-4 w-4" />
              See quickstart
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-full border border-zinc-900/15 bg-white text-sm font-semibold text-zinc-900 hover:border-zinc-900/40 transition-colors"
            >
              Get your API key
              <ArrowUpRight className="h-3.5 w-3.5 opacity-70" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ──────────────────────────────────────────────────────────────────
 *  Background + header
 * ──────────────────────────────────────────────────────────────── */

function AmbientBackdrop() {
  return (
    <div aria-hidden className="fixed inset-0 -z-10 pointer-events-none">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(1100px 560px at 10% -10%, #ecfdf5 0%, transparent 55%),' +
            'radial-gradient(900px 520px at 95% 10%, #fef3c7 0%, transparent 55%),' +
            'radial-gradient(800px 520px at 50% 110%, #fde2e4 0%, transparent 60%),' +
            '#fbf6e9',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,0,0,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.5) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 25%, black 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 25%, black 30%, transparent 80%)',
        }}
      />
    </div>
  );
}

function DemoHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/70">
      <div className="container mx-auto max-w-7xl px-5 sm:px-7 lg:px-10 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="shrink-0 flex items-center gap-2.5 group">
          <span className="relative h-8 w-8 rounded-lg bg-gradient-to-br from-zinc-900 to-zinc-800 flex items-center justify-center shadow-sm ring-1 ring-zinc-900/10">
            <AudioWaveform className="h-[18px] w-[18px] text-[#fbf6e9]" strokeWidth={2.3} />
            <span className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </span>
          <span className="font-bold tracking-[-0.02em] text-[17px] leading-none flex items-baseline gap-1">
            <span className="text-zinc-900">Chivox</span>
            <span className="bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500 bg-clip-text text-transparent">
              MCP
            </span>
            <span className="ml-1 text-[12.5px] font-mono font-medium text-muted-foreground">
              / Playground
            </span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium rounded-full border border-zinc-900/15 bg-white hover:border-zinc-900/40 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5 opacity-70" />
            Back
          </Link>
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3.5 text-[12px] font-semibold rounded-full bg-zinc-900 text-white hover:-translate-y-px transition-all shadow-sm"
          >
            Get API key
            <ArrowRight className="h-3 w-3 opacity-85" />
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ──────────────────────────────────────────────────────────────────
 *  Hero card — scenario framing, contrast vs generic STT
 * ──────────────────────────────────────────────────────────────── */

function ScenarioHero({ scenario }: { scenario: Scenario }) {
  return (
    <div className="grid lg:grid-cols-5 gap-5">
      <div className="lg:col-span-3 rounded-2xl border border-zinc-900/[0.08] bg-white/70 backdrop-blur-xl p-6 md:p-7 shadow-[0_1px_0_rgba(255,255,255,0.85)_inset]">
        <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-emerald-700 mb-3">
          {scenario.kicker}
        </p>
        <h2 className="text-[22px] md:text-[26px] font-bold tracking-[-0.02em] leading-[1.2] text-zinc-900 mb-3">
          {scenario.title}
        </h2>
        <p className="text-[14.5px] text-muted-foreground leading-relaxed mb-5">{scenario.blurb}</p>

        <div className="rounded-xl border border-dashed border-emerald-500/30 bg-emerald-500/[0.05] p-4">
          <div className="text-[10.5px] font-mono uppercase tracking-[0.14em] text-emerald-700 mb-1.5">
            reference_text
          </div>
          <p className="text-[22px] md:text-[24px] font-bold text-zinc-900 tracking-tight leading-tight mb-1">
            {scenario.reference.text}
          </p>
          {scenario.reference.romanization ? (
            <p className="font-pinyin text-[13.5px] text-emerald-800/80 mb-1">
              {scenario.reference.romanization}
            </p>
          ) : null}
          <p className="text-[12.5px] text-muted-foreground">{scenario.reference.gloss}</p>
        </div>
      </div>

      <div className="lg:col-span-2 grid grid-rows-2 gap-5">
        <div className="rounded-2xl border border-rose-500/25 bg-gradient-to-br from-rose-500/[0.08] to-white/30 p-5 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset]">
          <div className="flex items-center gap-2 text-[10.5px] font-mono uppercase tracking-[0.14em] text-rose-700 mb-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-500" />
            Generic STT heard
          </div>
          <p className="text-[20px] font-bold text-rose-800 tracking-tight leading-tight mb-1">
            {scenario.genericSttHeard}
          </p>
          <p className="text-[12px] text-rose-700/80">{scenario.genericSttMeaning}</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/[0.08] to-white/30 p-5 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset]">
          <div className="flex items-center gap-2 text-[10.5px] font-mono uppercase tracking-[0.14em] text-emerald-700 mb-1.5">
            <Check className="h-3 w-3" strokeWidth={3} />
            Chivox MCP heard
          </div>
          <p className="text-[20px] font-bold text-emerald-800 tracking-tight leading-tight mb-1">
            {scenario.reference.text}
          </p>
          <p className="text-[12px] text-emerald-700/80">
            …plus <span className="font-mono">pron</span>, <span className="font-mono">details[]</span>, and tone
            confidence — next four stages.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
 *  Stage wrapper
 * ──────────────────────────────────────────────────────────────── */

function Stage({
  num,
  title,
  runner,
  active,
  children,
}: {
  num: string;
  title: string;
  runner: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`relative rounded-2xl border bg-white/65 backdrop-blur-xl transition-all duration-500 ${
        active
          ? 'border-emerald-400/60 shadow-[0_18px_50px_-28px_rgba(16,185,129,0.45)]'
          : 'border-zinc-900/[0.08] shadow-sm'
      }`}
    >
      {active && (
        <span
          aria-hidden
          className="absolute -left-px top-6 bottom-6 w-[3px] rounded-full bg-emerald-400/80 animate-pulse"
        />
      )}
      <div className="flex flex-wrap items-center gap-3 px-5 sm:px-6 py-4 border-b border-zinc-900/[0.06]">
        <span
          className={`h-9 w-9 rounded-lg flex items-center justify-center font-mono text-[12px] font-semibold tracking-tight transition-colors ${
            active
              ? 'bg-zinc-900 text-white'
              : 'bg-white text-zinc-900 border border-zinc-900/10'
          }`}
        >
          {num}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-bold tracking-tight text-zinc-900">{title}</div>
          <div className="text-[11.5px] font-mono text-muted-foreground">{runner}</div>
        </div>
        {active ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-emerald-700">
            <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
            focus
          </span>
        ) : null}
      </div>
      <div className="px-5 sm:px-6 py-5 sm:py-6">{children}</div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
 *  Stage 01 — Input (audio + reference + request snippet)
 * ──────────────────────────────────────────────────────────────── */

function Stage01Input({ scenario }: { scenario: Scenario }) {
  // deterministic-looking waveform
  const bars = useMemo(
    () =>
      Array.from({ length: 56 }).map((_, i) => {
        const x = i / 55;
        const base = 0.22 + 0.78 * Math.abs(Math.sin(x * Math.PI * 3.1) * Math.sin(x * Math.PI + 0.8));
        return Math.max(0.1, Math.min(1, base));
      }),
    [],
  );

  const seconds = (scenario.audio.durationMs / 1000).toFixed(2);

  return (
    <div className="grid lg:grid-cols-2 gap-5">
      {/* audio row */}
      <div className="rounded-xl border border-emerald-500/25 bg-gradient-to-br from-emerald-50 to-white/70 p-5">
        <div className="flex items-center justify-between mb-3 text-[10.5px] font-mono uppercase tracking-[0.14em] text-emerald-700">
          <span className="inline-flex items-center gap-1.5">
            <Mic2 className="h-3 w-3" /> learner audio
          </span>
          <span>{scenario.audio.sampleRate}</span>
        </div>
        <div className="flex items-end gap-[3px] h-14 mb-3">
          {bars.map((h, i) => (
            <span
              key={i}
              className="inline-block w-[4px] rounded-[2px] bg-gradient-to-t from-emerald-500/40 via-emerald-400/90 to-emerald-300"
              style={{
                height: `${(h * 100).toFixed(1)}%`,
                animation: `wave-bar 1.3s ease-in-out ${i * 26}ms infinite`,
                transformOrigin: 'bottom',
              }}
            />
          ))}
        </div>
        <div className="flex items-center justify-between text-[11px] font-mono text-emerald-800/80">
          <span>00:00.00</span>
          <span className="text-emerald-700/70">{scenario.audio.durationMs} ms</span>
          <span>00:0{seconds}</span>
        </div>
      </div>

      {/* request */}
      <div className="rounded-xl border border-zinc-900/[0.08] bg-white/75 p-5">
        <div className="text-[10.5px] font-mono uppercase tracking-[0.14em] text-muted-foreground mb-3">
          what your agent sends to MCP
        </div>
        <pre className="text-[11.5px] leading-[1.6] font-mono text-zinc-800 whitespace-pre overflow-x-auto">
{`await mcp.call("assess_speech", {
  language: "${scenario.locale}",
  refText:  ${JSON.stringify(scenario.reference.text)},
  audio:    "s3://sessions/${scenario.id}.wav"
})`}
        </pre>
        <div className="mt-4 flex flex-wrap gap-2 text-[10.5px] font-mono">
          <FieldTag label="language" value={scenario.locale} tone="sky" />
          <FieldTag label="coreType" value={scenario.id === 'mandarin' ? 'cn.sent.raw' : 'en.sent.score'} tone="violet" />
          <FieldTag label="rubric" value="CEFR-aligned" tone="emerald" />
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
 *  Stage 02 — Response (annotated JSON + per-token breakdown)
 * ──────────────────────────────────────────────────────────────── */

function Stage02Response({ scenario }: { scenario: Scenario }) {
  const snippet = useMemo(() => buildPayloadPreview(scenario), [scenario]);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };

  return (
    <div className="grid xl:grid-cols-5 gap-5">
      {/* JSON preview */}
      <div className="xl:col-span-3 rounded-xl border border-zinc-900/[0.08] bg-white/80 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-900/[0.06] bg-white/60">
          <span className="text-[11px] font-mono text-muted-foreground">
            chivox · assess_speech · <span className="text-foreground/80">{scenario.id}.json</span>
          </span>
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1 rounded-md border border-zinc-900/10 px-2 py-0.5 text-[10.5px] font-mono text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-600" strokeWidth={3} /> : <Copy className="h-3 w-3" />}
            {copied ? 'copied' : 'copy'}
          </button>
        </div>
        <pre className="text-[11.5px] leading-[1.65] font-mono whitespace-pre overflow-x-auto p-4 text-zinc-800 max-h-[420px]">
          {snippet}
        </pre>
      </div>

      {/* field callouts */}
      <div className="xl:col-span-2 flex flex-col gap-3">
        <ScoreRing overall={scenario.overall} />
        <SubScores pron={scenario.pron} />
        <div className="rounded-xl border border-zinc-900/[0.08] bg-white/70 p-4 text-[12px] leading-relaxed">
          <div className="text-[10.5px] font-mono uppercase tracking-[0.14em] text-violet-700 mb-1.5">
            audio_quality
          </div>
          <ul className="grid grid-cols-3 gap-2 font-mono text-[11px]">
            <KV k="snr" v={scenario.audioQuality.snr.toFixed(1)} />
            <KV k="clip" v={String(scenario.audioQuality.clip)} />
            <KV k="volume" v={String(scenario.audioQuality.volume)} />
          </ul>
        </div>
        <div className="rounded-xl border border-zinc-900/[0.08] bg-white/70 p-4 text-[12px] leading-relaxed">
          <div className="text-[10.5px] font-mono uppercase tracking-[0.14em] text-amber-700 mb-1.5">
            fluency
          </div>
          <ul className="grid grid-cols-2 gap-2 font-mono text-[11px]">
            <KV k="pauses" v={String(scenario.fluencyMeta.pauseCount)} />
            <KV k="speed" v={`${scenario.fluencyMeta.speed} ${scenario.id === 'mandarin' ? 'chars/min' : 'wpm'}`} />
          </ul>
        </div>
      </div>

      {/* per-token breakdown */}
      <div className="xl:col-span-5">
        <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground mb-3">
          details[] — per-{scenario.id === 'mandarin' ? '字' : 'word'} breakdown
        </div>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {scenario.details.map((d, i) => (
            <DetailCard key={i} detail={d} lang={scenario.id} />
          ))}
        </div>
      </div>
    </div>
  );
}

function DetailCard({ detail, lang }: { detail: DetailRow; lang: Scenario['id'] }) {
  const dp = DP_LABEL[detail.dpType];
  return (
    <div className="rounded-xl border border-zinc-900/[0.08] bg-white/80 p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div
            className={`text-[20px] font-bold leading-none ${
              lang === 'mandarin' ? 'font-zh text-zinc-900' : 'tracking-tight text-zinc-900'
            }`}
          >
            {detail.label}
          </div>
          {detail.pinyin ? (
            <div className="mt-1 font-pinyin text-[12.5px] text-emerald-800/80">{detail.pinyin}</div>
          ) : null}
        </div>
        <div className="text-right shrink-0">
          <div className={`text-[22px] font-black tabular-nums leading-none ${scoreTone(detail.score)}`}>
            {detail.score}
          </div>
          <div className={`mt-1 inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-mono ${dp.cls}`}>
            {dp.label}
          </div>
        </div>
      </div>

      {detail.toneRef != null && detail.toneDetected != null ? (
        <ToneBlock detail={detail} />
      ) : null}

      {detail.phonemes && detail.phonemes.length > 0 ? (
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground mb-1.5">
            phonemes[]
          </div>
          <div className="flex flex-wrap gap-1.5">
            {detail.phonemes.map((p, i) => (
              <PhonemeChip key={i} p={p} />
            ))}
          </div>
        </div>
      ) : null}

      {detail.note ? (
        <p className="text-[11.5px] text-zinc-600 leading-snug">{detail.note}</p>
      ) : null}

      <div className="text-[10px] font-mono text-muted-foreground/70">
        {detail.start}ms → {detail.end}ms
      </div>
    </div>
  );
}

function ToneBlock({ detail }: { detail: DetailRow }) {
  const literalMatch = detail.toneRef === detail.toneDetected;
  // dp_type is authoritative: a differing tone that the engine flags as
  // `normal` means it accepted the detected tone (e.g. T3+T3 sandhi → T2).
  const accepted = detail.dpType !== 'wrong_tone';
  const status = literalMatch ? 'match' : accepted ? 'sandhi · ok' : 'mismatch';
  const toneLabel = (t: number) => (t === 0 ? '0' : String(t));
  const conf = detail.toneConfidence ?? [];
  return (
    <div
      className={`rounded-lg border px-2.5 py-2 ${
        accepted
          ? 'border-emerald-500/25 bg-emerald-500/[0.05]'
          : 'border-rose-500/30 bg-rose-500/[0.06]'
      }`}
    >
      <div className="flex items-center justify-between text-[10.5px] font-mono text-muted-foreground mb-1.5">
        <span>
          tone: ref{' '}
          <span className="font-semibold text-emerald-800">
            T{toneLabel(detail.toneRef!)}
          </span>{' '}
          → detected{' '}
          <span className={`font-semibold ${accepted ? 'text-emerald-700' : 'text-rose-700'}`}>
            T{toneLabel(detail.toneDetected!)}
          </span>
        </span>
        <span className={accepted ? 'text-emerald-700' : 'text-rose-700'}>{status}</span>
      </div>
      <div className="flex items-end gap-0.5 h-6">
        {conf.map((c, i) => {
          const isRef = i === detail.toneRef;
          const isDet = i === detail.toneDetected;
          const detColor = accepted
            ? 'bg-gradient-to-t from-emerald-500 to-emerald-300'
            : 'bg-gradient-to-t from-rose-500 to-rose-300';
          const cls =
            isRef && isDet
              ? 'bg-gradient-to-t from-emerald-500 to-emerald-300'
              : isDet
              ? detColor
              : isRef
              ? 'bg-gradient-to-t from-emerald-400/50 to-emerald-200'
              : 'bg-zinc-300/70';
          return (
            <div
              key={i}
              title={`${TONE_NAMES[i]} · ${c}%`}
              className={`flex-1 rounded-t-sm ${cls}`}
              style={{ height: `${Math.max(4, c)}%` }}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-[9px] font-mono text-muted-foreground/80 mt-1">
        <span>0</span>
        <span>T1</span>
        <span>T2</span>
        <span>T3</span>
        <span>T4</span>
      </div>
    </div>
  );
}

function PhonemeChip({ p }: { p: PhonemeRow }) {
  const cls =
    p.tone === 'good' || p.tone === 'ok'
      ? 'border-emerald-500/30 bg-emerald-50 text-emerald-800'
      : p.tone === 'weak'
      ? 'border-amber-500/35 bg-amber-50 text-amber-800'
      : 'border-rose-500/35 bg-rose-50 text-rose-800';
  return (
    <span
      title={p.note ?? `${p.ipa} · ${p.score}`}
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-mono ${cls}`}
      style={{ fontFamily: 'var(--font-hero-serif, "Fraunces", Georgia, serif)' }}
    >
      <span>{p.ipa}</span>
      <span className="text-[10px] tabular-nums font-sans not-italic">{p.score}</span>
    </span>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <li className="flex flex-col">
      <span className="text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground/80">{k}</span>
      <span className="text-zinc-800">{v}</span>
    </li>
  );
}

function FieldTag({ label, value, tone }: { label: string; value: string; tone: 'sky' | 'violet' | 'emerald' }) {
  const cls =
    tone === 'sky'
      ? 'border-sky-500/30 text-sky-800 bg-sky-50'
      : tone === 'violet'
      ? 'border-violet-500/30 text-violet-800 bg-violet-50'
      : 'border-emerald-500/30 text-emerald-800 bg-emerald-50';
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 ${cls}`}>
      <span className="opacity-60">{label}:</span>
      <span>{value}</span>
    </span>
  );
}

function ScoreRing({ overall }: { overall: number }) {
  const circ = 2 * Math.PI * 34;
  const offset = circ - (overall / 100) * circ;
  const tone = overall >= 80 ? '#10b981' : overall >= 65 ? '#f59e0b' : '#f43f5e';
  return (
    <div className="rounded-xl border border-zinc-900/[0.08] bg-white/80 p-4 flex items-center gap-4">
      <svg width="84" height="84" viewBox="0 0 84 84" className="shrink-0">
        <circle cx="42" cy="42" r="34" fill="none" stroke="#e4e4e7" strokeWidth="6" />
        <circle
          cx="42"
          cy="42"
          r="34"
          fill="none"
          stroke={tone}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform="rotate(-90 42 42)"
          style={{ transition: 'stroke-dashoffset 600ms ease' }}
        />
        <text
          x="42"
          y="48"
          textAnchor="middle"
          fontSize="22"
          fontWeight="800"
          fill={tone}
          fontFamily="var(--font-geist-sans), system-ui, sans-serif"
        >
          {overall}
        </text>
      </svg>
      <div>
        <div className="text-[10.5px] font-mono uppercase tracking-[0.14em] text-emerald-700 mb-0.5">overall</div>
        <div className="text-[14px] font-semibold text-zinc-900 tracking-tight mb-0.5">
          Weighted composite
        </div>
        <div className="text-[11.5px] text-muted-foreground">
          accuracy · integrity · fluency · rhythm · tone
        </div>
      </div>
    </div>
  );
}

function SubScores({ pron }: { pron: Scenario['pron'] }) {
  const rows = [
    { k: 'accuracy', v: pron.accuracy },
    { k: 'integrity', v: pron.integrity },
    { k: 'fluency', v: pron.fluency },
    { k: 'rhythm', v: pron.rhythm },
    ...(pron.tone != null ? [{ k: 'tone', v: pron.tone }] : []),
  ];
  return (
    <div className="rounded-xl border border-zinc-900/[0.08] bg-white/70 p-4">
      <div className="text-[10.5px] font-mono uppercase tracking-[0.14em] text-emerald-700 mb-2">pron</div>
      <ul className="flex flex-col gap-2">
        {rows.map((r) => (
          <li key={r.k} className="flex items-center gap-3 text-[12px]">
            <span className="w-[72px] font-mono text-muted-foreground">{r.k}</span>
            <span className="flex-1 h-1.5 rounded-full bg-zinc-200/80 overflow-hidden">
              <span
                className={`block h-full rounded-full ${scoreBarCls(r.v)}`}
                style={{ width: `${r.v}%` }}
              />
            </span>
            <span className={`font-mono tabular-nums w-[28px] text-right ${scoreTone(r.v)}`}>{r.v}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
 *  Stage 03 — LLM diagnosis (streamed text)
 * ──────────────────────────────────────────────────────────────── */

function Stage03Diagnosis({
  scenario,
  active,
  reduceMotion,
}: {
  scenario: Scenario;
  active: boolean;
  reduceMotion: boolean;
}) {
  const joined = useMemo(() => scenario.diagnosis.join('\n\n'), [scenario]);
  const [typed, setTyped] = useState(0);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    setTyped(0);
  }, [scenario]);

  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    if (!active || reduceMotion) {
      setTyped(joined.length);
      return;
    }
    if (typed >= joined.length) return;
    timer.current = window.setTimeout(() => setTyped((n) => Math.min(joined.length, n + 6)), 18);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [active, typed, joined, reduceMotion]);

  return (
    <div className="grid md:grid-cols-5 gap-5">
      <div className="md:col-span-2 rounded-xl border border-violet-500/25 bg-gradient-to-br from-violet-500/[0.07] to-white/50 p-5">
        <div className="flex items-center gap-2 mb-2 text-[10.5px] font-mono uppercase tracking-[0.14em] text-violet-700">
          <Sparkles className="h-3 w-3" /> prompt
        </div>
        <p className="text-[12.5px] text-foreground/85 leading-relaxed mb-3">
          You are a {scenario.id === 'mandarin' ? 'Mandarin' : 'English'} pronunciation coach. Below is the
          Chivox MCP payload for one utterance. In 3 short bullets, name the single most important issue, the
          root cause, and one concrete correction.
        </p>
        <div className="text-[11px] font-mono text-violet-800 mb-1">model</div>
        <div className="font-mono text-[11.5px] text-zinc-800">o1 · claude-3.5-sonnet · gemini-2-pro</div>
        <div className="text-[11px] font-mono text-violet-800 mt-3 mb-1">input</div>
        <div className="font-mono text-[11px] text-zinc-700">
          the MCP payload from stage 02 ({scenario.details.length} details · {scenario.details.reduce(
            (n, d) => n + (d.phonemes?.length ?? 0),
            0,
          )}{' '}
          phonemes)
        </div>
      </div>

      <div className="md:col-span-3 rounded-xl border border-zinc-900/[0.08] bg-white/75 p-5 min-h-[260px]">
        <div className="flex items-center justify-between mb-3 text-[10.5px] font-mono uppercase tracking-[0.14em] text-amber-700">
          <span>
            LLM output · teacher-mode
          </span>
          <span className="inline-flex items-center gap-1 text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {typed >= joined.length ? 'done' : 'streaming…'}
          </span>
        </div>
        <RichProse text={joined.slice(0, typed)} />
        {typed < joined.length ? (
          <span className="inline-block w-[6px] h-[0.95em] translate-y-[1px] bg-amber-500 animate-pulse align-middle" />
        ) : null}
      </div>
    </div>
  );
}

function RichProse({ text }: { text: string }) {
  // minimal **bold** + paragraph renderer, so we don't drag in a markdown lib
  const paragraphs = text.split(/\n\n+/);
  return (
    <div className="flex flex-col gap-3 text-[13.5px] leading-[1.65] text-foreground/85">
      {paragraphs.map((p, i) => (
        <p key={i}>
          {p.split(/(\*\*[^*]+\*\*)/g).map((chunk, j) =>
            chunk.startsWith('**') && chunk.endsWith('**') ? (
              <strong key={j} className="font-semibold text-zinc-900">
                {chunk.slice(2, -2)}
              </strong>
            ) : (
              <span key={j}>{chunk}</span>
            ),
          )}
        </p>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
 *  Stage 04 — Auto-generated drill
 * ──────────────────────────────────────────────────────────────── */

function Stage04Drill({ scenario }: { scenario: Scenario }) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {scenario.drill.map((group) => (
        <div
          key={group.title}
          className="rounded-xl border border-amber-500/25 bg-gradient-to-br from-amber-500/[0.06] to-white/50 p-5 flex flex-col gap-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-bold tracking-tight text-zinc-900">{group.title}</h3>
            <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-amber-700">drill</span>
          </div>
          <ul className="flex flex-col gap-3">
            {group.items.map((it) => (
              <li key={it.label} className="rounded-lg border border-zinc-900/[0.06] bg-white/85 px-3.5 py-3">
                <div className="flex items-center justify-between text-[12px] font-semibold text-zinc-900 mb-1">
                  <span>{it.label}</span>
                  {it.meta ? (
                    <span className="text-[10.5px] font-mono text-amber-700">{it.meta}</span>
                  ) : null}
                </div>
                <p className="text-[12.5px] text-muted-foreground leading-relaxed">{it.content}</p>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
 *  Payload serialiser
 * ──────────────────────────────────────────────────────────────── */

function buildPayloadPreview(scenario: Scenario) {
  const payload: Record<string, unknown> = {
    overall: scenario.overall,
    pron: scenario.pron,
    fluency: scenario.fluencyMeta,
    audio_quality: scenario.audioQuality,
    details: scenario.details.slice(0, 3).map((d) => ({
      [scenario.id === 'mandarin' ? 'char' : 'word']: d.label,
      ...(d.pinyin ? { pinyin: d.pinyin } : {}),
      score: d.score,
      dp_type: d.dpType,
      start: d.start,
      end: d.end,
      ...(d.toneRef != null
        ? {
            tone: {
              ref: d.toneRef,
              detected: d.toneDetected,
              confidence: d.toneConfidence,
            },
          }
        : {}),
      ...(d.phonemes
        ? {
            phonemes: d.phonemes.map((p) => ({
              ipa: p.ipa,
              score: p.score,
              dp_type: p.tone === 'bad' ? 'mispron' : p.tone === 'weak' ? 'weak' : 'normal',
            })),
          }
        : {}),
    })),
  };
  return JSON.stringify(payload, null, 2);
}
