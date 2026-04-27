'use client';

/* ═══════════════════════════════════════════════════════════════
 *  Reasoning-engine section — extracted so /global/reasoning can
 *  render it as a dedicated sub-page (while the main landing no
 *  longer carries it).
 * ═══════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Lightbulb, Sparkles, Terminal } from 'lucide-react';
import { FadeUp, StaggerContainer, StaggerItem } from '@/components/animated-section';
import { SAMPLE_MCP_RICH_JSON } from './_chrome';

/* ─── Reasoning-demo data ────────────────────────────────── */

const REASONING_TABS = [
  { id: 'diagnose', label: 'Pass ② · Diagnose' },
  { id: 'drill', label: 'Pass ③ · Generate drill' },
] as const;

type ReasoningTabId = (typeof REASONING_TABS)[number]['id'];

const REASONING_INPUT: Record<ReasoningTabId, string> = {
  diagnose: `// pass 2 — feed the phonetic matrix to your LLM
const diag = await openai.chat.completions.create({
  model: "o1-mini",
  messages: [{
    role: "system",
    content:
      "You are a Mandarin pronunciation coach. " +
      "Given the Chivox MCP assessment payload, identify " +
      "the learner's 3 most impactful issues. Be concrete."
  }, {
    role: "user",
    content: JSON.stringify(assessment)
    // ↓ the payload Chivox MCP just returned (same wide schema as
    // English: pron, fluency, audio_quality, details[]; zh adds tone maps)
    // { "pron":{...,"tone":76}, "details":[
    //     { "char":"上","pinyin":"shang4","tone":{"ref":4,"detected":3,"score":58,"confidence":[...]}}
    // ] }
  }]
});`,
  drill: `// pass 3 — turn the diagnosis into a targeted practice
const drill = await openai.chat.completions.create({
  model: "claude-3-5-sonnet",
  messages: [{
    role: "system",
    content:
      "You're a Mandarin coach. Given the diagnosis below, " +
      "generate ONE tongue-twister (绕口令) that forces the " +
      "learner to repeat the failing phonemes + tones at " +
      "least 3× each. Include pinyin + English gloss."
  }, {
    role: "user",
    content: diagnosis
    // ↓ pass 2's diagnosis text, e.g.:
    // "Key issue: retroflex /sh/ collapses to /s/
    //  on 上. Tone 3 sandhi on 你好 is not applied.
    //  Target: /sh/ + T3-T3 combos."
  }]
});`,
};

const REASONING_OUTPUT: Record<ReasoningTabId, string> = {
  diagnose: `# Diagnosis

**1. Retroflex /sh/ is softening.**
On 上 (shàng, T4) the initial /ʂ/ came out closer
to a flat /s/. Score 58. Tip: curl the tongue
tip back and up — think "dr" in "drop".

**2. Tone 3 + Tone 3 sandhi not applied.**
你好 was read as T3 + T3 instead of T2 + T3.
This is the #1 textbook-to-speech gap.

**3. Overall tone 3 is shallow.**
Your T3 dips (hǎo, hǎi) don't reach the low
register — they sound like T2 halfway.`,
  drill: `## Drill · tongue-twister

**四是四，十是十，十四是十四，
四十是四十 —— 十四不要说四十。**

sì shì sì, shí shì shí,
shí sì shì shí sì, sì shí shì sì shí ——
shí sì bú yào shuō sì shí.

> Four is four, ten is ten, fourteen is fourteen,
> forty is forty — don't say "forty" for "fourteen".

**Targets:**
• /ʂ/ × 6 (shì, shí, shuō)
• /s/ × 6  (sì) — force the contrast
• T2 ↔ T4 minimal pair (shí ↔ sì)
• Bù → Bú sandhi × 1 (不要)

⏱ 45 s · repeat 3× · record and compare to
the reference MCP score.`,
};

/* ─── Main exported section ──────────────────────────────── */

export function ReasoningSection() {
  return (
    <section
      id="reasoning-engine-trigger"
      className="relative py-20 md:py-24 border-b border-[#e9e2d2]/70 scroll-mt-24"
    >
      <div className="container mx-auto px-6 max-w-7xl">
        <FadeUp className="mb-8 max-w-3xl">
          <div className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-3">
            /reasoning-engine-trigger
          </div>
          <h2 className="heading-display text-3xl md:text-[42px] tracking-[-0.02em] mb-3 leading-[1.1]">
            It&apos;s not just a score.
            <br />
            <span className="text-muted-foreground/90">It&apos;s a reasoning engine trigger.</span>
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            You saw how simple the integration is. Now look at what actually comes back. The MCP response
            is a <strong className="text-foreground/90">wide JSON surface</strong>: not only overall and{' '}
            <span className="font-mono text-foreground/80">pron.*</span> sub-scores, but fluency (WPM, pauses),{' '}
            <span className="font-mono text-foreground/80">audio_quality</span> (SNR, clip, level), and a{' '}
            <span className="font-mono text-foreground/80">details[]</span> array where each word or character carries millisecond
            windows, <span className="font-mono text-foreground/80">dp_type</span>, stress, liaison, <span className="font-mono text-foreground/80">phonemes[]</span> with IPA, plus Mandarin{' '}
            <span className="font-mono text-foreground/80">tone</span> objects and confidence distributions. That density is what lets an LLM do secondary diagnosis and
            tertiary profiling &mdash; not a one-number API.
          </p>
        </FadeUp>

        <PayloadFieldStrip />

        <PipelineStages />

        {/* concrete code proof — the Aha moment */}
        <div className="mt-14">
          <FadeUp>
            <div className="mb-4 flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 border border-violet-500/25 px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-violet-700">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                Live demo
              </span>
              <span className="text-[12.5px] text-muted-foreground">
                Watch pass ② run. <span className="text-foreground/85">A Mandarin payload in</span> — a
                textbook-grade diagnosis out, streamed by o1-mini.
              </span>
            </div>
          </FadeUp>
          <ReasoningDemo />
        </div>

        <FadeUp delay={0.3}>
          <ul className="mt-10 grid md:grid-cols-3 gap-3 text-[13px] leading-relaxed">
            {[
              {
                t: 'Secondary · Pattern mining',
                b: 'Agent surfaces session-level regularities: "unvoiced consonants failing 3 sessions in a row." No rule engine — pure LLM reasoning over dense data.',
              },
              {
                t: 'Tertiary · Student profiling',
                b: 'Stack sessions in any vector DB or row store. Your agent plots learning curves and predicts next-exam CEFR / HSK band.',
              },
              {
                t: 'Combo · Diagnose + prescribe',
                b: 'Chain Chivox MCP with O1 / Sonnet 3.5 / Gemini 2 for a world-class diagnosis-to-prescription loop, out of the box.',
              },
            ].map((c) => (
              <li
                key={c.t}
                className="flex gap-3 rounded-xl border border-zinc-900/[0.08] bg-white/55 backdrop-blur-sm px-4 py-3.5"
              >
                <span className="mt-1.5 inline-block h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0" />
                <div>
                  <div className="font-semibold tracking-tight mb-0.5">{c.t}</div>
                  <div className="text-muted-foreground">{c.b}</div>
                </div>
              </li>
            ))}
          </ul>
        </FadeUp>
      </div>
    </section>
  );
}

/* ─── Field overview — one screenful listing what "rich payload" means ─ */
function PayloadFieldStrip() {
  return (
    <div className="mb-10 md:mb-12 rounded-2xl border border-violet-200/60 bg-gradient-to-br from-violet-500/[0.05] via-white/85 to-amber-500/[0.04] p-4 md:p-6 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset]">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-4">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-violet-700 mb-1">Dense metadata · one response</p>
          <p className="text-[15px] font-semibold text-foreground tracking-tight">Structured for LLM reasoning, not a leaderboard cell</p>
        </div>
        <span className="shrink-0 self-start text-[10px] font-mono text-muted-foreground border border-dashed border-violet-300/50 rounded-md px-2 py-0.5">
          en + zh code paths
        </span>
      </div>
      <ul className="grid sm:grid-cols-2 gap-2.5 text-[12.5px] leading-snug">
        {[
          {
            k: 'Session + audio QA',
            v: 'overall · refText / session id · audio_quality: snr, clip, volume (UGC & mic checks)',
          },
          {
            k: 'pron + fluency blocks',
            v: 'accuracy, integrity, fluency, rhythm; tone row for Chinese; WPM, pause count, broader fluency',
          },
          {
            k: 'details[] entries',
            v: 'per word or 汉字: start/end ms, dp_type, stress, liaison, char-level tone + confidence[], phonemes[] with IPA & scores',
          },
          {
            k: 'Error hooks',
            v: 'phoneme_error, omissions, affricate quality — the signals agents turn into feedback without custom DSP',
          },
        ].map((row) => (
          <li key={row.k} className="rounded-xl border border-zinc-900/[0.08] bg-white/75 px-3 py-2.5">
            <div className="font-mono text-[11px] text-violet-800 mb-0.5">{row.k}</div>
            <div className="text-muted-foreground">{row.v}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─── Three-pass pipeline: assess → diagnose → drill ─────── */
function PipelineStages() {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="hidden md:block absolute top-[88px] left-[16.6%] right-[16.6%] h-px bg-gradient-to-r from-emerald-400/0 via-emerald-400/60 to-sky-400/0"
      />

      <StaggerContainer className="grid md:grid-cols-3 gap-5 md:gap-4">
        <StaggerItem>
          <StageCard
            tone="emerald"
            num="01"
            runner="Chivox MCP"
            runnerKind="tool"
            title="Assess"
            sub="Audio in → structured scores out"
            inLabel="audio_file_path"
            outLabel="scores.json"
          >
            <pre className="font-mono text-[10px] leading-[1.5] text-zinc-700 dark:text-zinc-300 whitespace-pre overflow-x-auto max-h-[200px] overflow-y-auto">
              {SAMPLE_MCP_RICH_JSON}
            </pre>
          </StageCard>
        </StaggerItem>

        <StaggerItem>
          <StageCard
            tone="sky"
            num="02"
            runner="Your LLM · pass 1"
            runnerKind="llm"
            title="Diagnose"
            sub="Scores → teacher-style feedback"
            inLabel="scores.json"
            outLabel="diagnosis.md"
          >
            <div className="font-sans text-[12.5px] leading-[1.6] text-zinc-700 dark:text-zinc-200 space-y-2">
              <p>
                <span className="font-semibold">Fluency (88)</span> is strong &mdash; good rhythm and chunking.
              </p>
              <p>
                The weak spot is <span className="font-semibold text-rose-500">/ɔː/</span> in{' '}
                <span className="font-mono bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded px-1">gorgeous</span>
                : lips aren&apos;t rounded enough, coming out closer to /ɒ/.
              </p>
              <p className="text-muted-foreground text-[11.5px]">
                Also review <span className="font-mono">/dʒ/</span> affricate &mdash; stop-to-fricative transition is too soft.
              </p>
            </div>
          </StageCard>
        </StaggerItem>

        <StaggerItem>
          <StageCard
            tone="violet"
            num="03"
            runner="Your LLM · pass 2"
            runnerKind="llm"
            title="Drill"
            sub="Diagnosis → personalized practice"
            inLabel="diagnosis.md"
            outLabel="practice.json"
          >
            <div className="space-y-2.5">
              <div className="rounded-lg bg-violet-500/5 border border-violet-500/20 p-2.5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-violet-600 dark:text-violet-400 mb-1">
                  /ɔː/ minimal pairs
                </div>
                <div className="font-mono text-[12px] text-zinc-800 dark:text-zinc-200">
                  caught · cot · bought · pot
                </div>
              </div>
              <div className="rounded-lg bg-violet-500/5 border border-violet-500/20 p-2.5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-violet-600 dark:text-violet-400 mb-1">
                  Shadow read · 2×
                </div>
                <div className="text-[12px] text-zinc-700 dark:text-zinc-300 italic">
                  &ldquo;The gorgeous storm poured all morning.&rdquo;
                </div>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                  3 tasks
                </span>
                <span>·</span>
                <span>~90s</span>
                <span>·</span>
                <span>targets 2 phonemes</span>
              </div>
            </div>
          </StageCard>
        </StaggerItem>
      </StaggerContainer>
    </div>
  );
}

function StageCard({
  tone,
  num,
  runner,
  runnerKind,
  title,
  sub,
  inLabel,
  outLabel,
  children,
}: {
  tone: 'emerald' | 'sky' | 'violet';
  num: string;
  runner: string;
  runnerKind: 'tool' | 'llm';
  title: string;
  sub: string;
  inLabel: string;
  outLabel: string;
  children: React.ReactNode;
}) {
  const toneMap = {
    emerald: {
      dot: 'bg-emerald-500',
      chip: 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      num: 'bg-emerald-500 text-white',
      runnerPill: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    },
    sky: {
      dot: 'bg-sky-500',
      chip: 'text-sky-700 dark:text-sky-400 bg-sky-500/10 border-sky-500/30',
      num: 'bg-sky-500 text-white',
      runnerPill: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30',
    },
    violet: {
      dot: 'bg-violet-500',
      chip: 'text-violet-700 dark:text-violet-400 bg-violet-500/10 border-violet-500/30',
      num: 'bg-violet-500 text-white',
      runnerPill: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30',
    },
  }[tone];

  return (
    <div className="relative h-full glass-card overflow-hidden hover:border-foreground/20 transition-colors">
      <div className="p-5 border-b border-zinc-900/[0.08]">
        <div className="flex items-center gap-3 mb-3">
          <div
            className={`h-9 w-9 rounded-lg ${toneMap.num} flex items-center justify-center font-mono text-sm font-semibold`}
          >
            {num}
          </div>
          <div>
            <div className="text-[10.5px] tracking-[0.18em] uppercase text-muted-foreground font-mono">
              Pass {num.replace(/^0/, '')}
            </div>
            <h3 className="text-lg font-semibold tracking-[-0.01em]">{title}</h3>
          </div>
        </div>
        <p className="text-[13px] text-muted-foreground leading-relaxed mb-3">{sub}</p>
        <div
          className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10.5px] font-mono ${toneMap.runnerPill}`}
        >
          {runnerKind === 'tool' ? (
            <Terminal className="h-3 w-3" />
          ) : (
            <Sparkles className="h-3 w-3" />
          )}
          {runner}
        </div>
      </div>

      <div className="p-5 min-h-[180px] bg-white/20 backdrop-blur-sm">{children}</div>

      <div className="px-5 py-3 border-t border-zinc-900/[0.08] bg-white/30 backdrop-blur-sm flex items-center justify-between text-[10.5px] font-mono">
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <span className="text-muted-foreground/60">in</span>
          <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 ${toneMap.chip}`}>
            <span className={`h-1 w-1 rounded-full ${toneMap.dot}`} />
            {inLabel}
          </span>
        </span>
        <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <span className="text-muted-foreground/60">out</span>
          <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 ${toneMap.chip}`}>
            <span className={`h-1 w-1 rounded-full ${toneMap.dot}`} />
            {outLabel}
          </span>
        </span>
      </div>
    </div>
  );
}

/* ─── The live reasoning demo — same payload → any LLM ─── */
function ReasoningDemo() {
  const [tab, setTab] = useState<ReasoningTabId>('diagnose');
  const [typed, setTyped] = useState(0);
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    prefersReducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const output = REASONING_OUTPUT[tab];
  const input = REASONING_INPUT[tab];

  useEffect(() => {
    setTyped(0);
  }, [tab]);

  useEffect(() => {
    if (prefersReducedMotion.current) {
      setTyped(output.length);
      return;
    }
    if (typed >= output.length) return;
    const t = setTimeout(() => setTyped((n) => Math.min(output.length, n + 4)), 18);
    return () => clearTimeout(t);
  }, [typed, output]);

  return (
    <FadeUp>
      <div className="glass-card overflow-hidden relative">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-900/[0.06] bg-white/30 backdrop-blur-sm px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-500" />
            <span className="text-[13px] font-semibold tracking-[-0.005em] text-foreground">
              How an LLM reasons over a Chivox payload
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 border border-rose-500/25 px-2 py-0.5 text-[10px] font-mono text-rose-700 dark:text-rose-400">
              <span className="h-1 w-1 rounded-full bg-rose-500" />
              中文 · 你好 / 上海
            </span>
          </div>
          <div className="flex rounded-md border border-border/60 bg-background p-0.5 self-start sm:self-auto">
            {REASONING_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`px-3 py-1 text-[11px] font-mono rounded-[5px] transition-colors whitespace-nowrap ${
                  t.id === tab
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 relative">
          <div
            aria-hidden
            className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 h-9 w-9 items-center justify-center rounded-full bg-white border border-violet-500/30 shadow-[0_6px_20px_-8px_rgba(139,92,246,0.35)]"
          >
            <ArrowRight className="h-4 w-4 text-violet-600" />
          </div>

          <div
            className="relative border-b lg:border-b-0 lg:border-r border-zinc-900/[0.06]"
            style={{
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(253,247,234,0.35) 50%, rgba(255,255,255,0.5) 100%)',
            }}
          >
            <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-900/[0.08] bg-white/40 backdrop-blur-sm">
              <span className="inline-flex items-center gap-2 text-[11px] font-mono text-zinc-700 tracking-wide">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-sm bg-zinc-900 text-white text-[9px] font-bold">
                  IN
                </span>
                You send — Chivox payload + 1-line prompt
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                {tab === 'diagnose' ? 'diagnose.ts' : 'drill.ts'}
              </span>
            </div>
            <pre className="text-[11.5px] leading-[1.6] font-mono p-5 whitespace-pre overflow-x-auto max-h-[420px] text-zinc-800">
              <code>{input}</code>
            </pre>
          </div>

          <div className="relative bg-gradient-to-br from-violet-500/[0.05] via-background to-background">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border/60 bg-white/40 backdrop-blur-sm">
              <span className="inline-flex items-center gap-2 text-[11px] font-mono text-zinc-700 tracking-wide">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-sm bg-violet-600 text-white text-[9px] font-bold">
                  OUT
                </span>
                LLM writes — {tab === 'diagnose' ? 'diagnosis' : 'drill plan'} ({tab === 'diagnose' ? 'o1-mini' : 'claude-3.5-sonnet'})
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {typed >= output.length ? 'done' : 'thinking…'}
              </span>
            </div>
            <pre className="text-[12.5px] leading-[1.7] font-mono p-5 whitespace-pre-wrap text-foreground/85 max-h-[420px] overflow-auto">
              {output.slice(0, typed)}
              {typed < output.length && (
                <span className="inline-block w-[6px] h-[0.95em] translate-y-[1px] bg-violet-400 animate-pulse align-middle" />
              )}
            </pre>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-t border-border/60 bg-muted/40 text-[11px] text-muted-foreground">
          <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
          <span>
            The <strong className="text-foreground/85 font-semibold">same payload</strong> plugs into{' '}
            <code className="font-mono text-foreground/80">o1</code>,{' '}
            <code className="font-mono text-foreground/80">claude-3.5-sonnet</code>,{' '}
            <code className="font-mono text-foreground/80">gemini-2.0-pro</code>,{' '}
            <code className="font-mono text-foreground/80">qwen-max</code>,{' '}
            <code className="font-mono text-foreground/80">deepseek-v3</code> — any model that reads JSON.
          </span>
        </div>
      </div>
    </FadeUp>
  );
}
