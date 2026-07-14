'use client';

/* ═══════════════════════════════════════════════════════════════
 *  AI feedback-engine section — extracted so /global/reasoning can
 *  render it as a dedicated sub-page (while the main landing no
 *  longer carries it).
 * ═══════════════════════════════════════════════════════════ */

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Bot,
  Briefcase,
  Check,
  ChevronDown,
  GraduationCap,
  Headphones,
  Lightbulb,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react';
import { FadeUp, StaggerContainer, StaggerItem } from '@/components/animated-section';

/* ─── Reasoning-demo data ────────────────────────────────── */

const REASONING_TABS = [
  { id: 'diagnose', label: 'Diagnose' },
  { id: 'drill', label: 'Generate drill' },
] as const;

type ReasoningTabId = (typeof REASONING_TABS)[number]['id'];

const REASONING_INPUT: Record<ReasoningTabId, string> = {
  diagnose: `const diagnosis = await agent.generate({
  instruction:
    "Use only the returned speech evidence. " +
    "Choose the single most useful correction.",
  input: {
    scores: assessment.pron,
    fluency: assessment.fluency,
    audioQuality: assessment.audio_quality,
    details: assessment.details
  },
  output: DiagnosisSchema
});`,
  drill: `const drill = await agent.generate({
  instruction:
    "Create one short practice activity for the " +
    "approved target. Include a measurable retry.",
  input: {
    target: diagnosis.priority_issue,
    evidence: diagnosis.supporting_evidence,
    learnerLevel: "intermediate"
  },
  output: PracticeSchema
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
      id="ai-feedback-engine"
      className="relative py-20 md:py-24 border-b border-[#e9e2d2]/70 scroll-mt-24"
    >
      <div className="container mx-auto px-6 max-w-7xl">
        <FadeUp className="mb-12 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-14">
          <div>
            <div className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-3">
              /ai-feedback-engine
            </div>
            <h1 className="heading-display text-3xl md:text-[42px] tracking-[-0.02em] mb-3 leading-[1.1]">
              Turn speech evidence into useful AI feedback.
              <br />
              <span className="text-muted-foreground/90">Diagnose, prioritize, coach, and generate the next drill.</span>
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              The AI feedback engine turns structured pronunciation, fluency, tone, and audio-quality
              evidence into an approved next action. It can identify the most important issue, explain it
              in learner-friendly language, and generate focused practice while your application keeps
              thresholds and product rules deterministic.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/docs#response-schema"
                className="inline-flex h-10 items-center gap-2 rounded-full bg-zinc-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
              >
                Explore response evidence <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/runtime"
                className="inline-flex h-10 items-center gap-2 rounded-full border border-zinc-900/10 bg-white/70 px-4 text-sm font-semibold text-zinc-800 transition-colors hover:border-emerald-500/35 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
              >
                Plan production runtime
              </Link>
            </div>
          </div>

          <FeedbackPreviewPanel />
        </FadeUp>

        <AudienceAndOutcomes />

        <FeedbackWorkflow />

        <TechnicalProof />

        <FeedbackCta />
      </div>
    </section>
  );
}

function FeedbackPreviewPanel() {
  return (
    <aside
      aria-label="Example AI feedback response"
      className="relative mx-auto w-full max-w-[610px] lg:mx-0 lg:justify-self-end"
    >
      <div
        aria-hidden
        className="absolute -inset-5 rounded-[2rem] bg-gradient-to-br from-emerald-300/20 via-white/20 to-violet-300/25 blur-2xl"
      />
      <div className="relative overflow-hidden rounded-[26px] border border-zinc-900/[0.09] bg-white/88 p-3 shadow-[0_28px_90px_-50px_rgba(24,24,27,0.5)] backdrop-blur-xl md:p-4">
        <div className="mb-3 flex items-center justify-between px-1 py-1">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Example response
            </div>
            <div className="mt-0.5 text-sm font-semibold tracking-[-0.01em]">Feedback ready</div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.07] px-2.5 py-1 font-mono text-[10px] text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            grounded
          </span>
        </div>

        <div className="rounded-2xl border border-zinc-900/[0.07] bg-[#fbfaf7] p-4">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-white">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[12px] font-semibold">Speech evidence</span>
                <span className="font-mono text-[10px] text-muted-foreground">12.4 sec</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-900/[0.07]">
                <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              ['Pronunciation', '72'],
              ['Fluency', '88'],
              ['Audio quality', 'Clear'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-zinc-900/[0.06] bg-white px-2 py-2.5">
                <div className="text-sm font-semibold tracking-tight">{value}</div>
                <div className="mt-0.5 text-[9px] leading-tight text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="my-2.5 flex justify-center">
          <ArrowRight className="h-3.5 w-3.5 rotate-90 text-violet-500" />
        </div>

        <div className="grid gap-2.5 md:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-2xl border border-violet-500/15 bg-violet-500/[0.045] p-4">
            <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-violet-700">
              <Target className="h-3.5 w-3.5" /> Priority issue
            </div>
            <p className="text-[15px] font-semibold leading-snug tracking-[-0.015em]">Soften the /sh/ → /s/ substitution.</p>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              Detected in 3 of 4 target words. Fluency is strong, so correct this sound first.
            </p>
          </div>

          <div className="rounded-2xl bg-zinc-950 p-4 text-white">
            <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" /> Coach & drill
            </div>
            <p className="text-[13px] leading-relaxed text-zinc-200">
              Curl the tongue slightly back for <strong className="font-semibold text-white">sh</strong>, then contrast
              “she–see” before retrying the sentence.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5 font-mono text-[9.5px] text-zinc-300">
              <span className="rounded-full border border-white/15 px-2 py-1">45 sec</span>
              <span className="rounded-full border border-white/15 px-2 py-1">3 contrasts</span>
              <span className="rounded-full border border-white/15 px-2 py-1">re-score retry</span>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.045] px-3 py-2.5">
          <span className="text-[11px] font-medium text-emerald-900">Next action approved by product rules</span>
          <span className="shrink-0 font-mono text-[9.5px] text-emerald-700">ready to deliver</span>
        </div>
      </div>
    </aside>
  );
}

/* ─── Field overview — one screenful listing what "rich payload" means ─ */
function PayloadFieldStrip() {
  return (
    <div className="mb-10 md:mb-12 rounded-2xl border border-violet-200/60 bg-gradient-to-br from-violet-500/[0.05] via-white/85 to-amber-500/[0.04] p-4 md:p-6 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset]">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-4">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-violet-700 mb-1">Grounded input · approved output</p>
          <p className="text-[15px] font-semibold text-foreground tracking-tight">The evidence layer behind reliable AI feedback</p>
        </div>
        <span className="shrink-0 self-start text-[10px] font-mono text-muted-foreground border border-dashed border-violet-300/50 rounded-md px-2 py-0.5">
          en + zh code paths
        </span>
      </div>
      <ul className="grid sm:grid-cols-2 gap-2.5 text-[12.5px] leading-snug">
        {[
          {
            k: 'Recording quality',
            v: 'Signal-to-noise, clipping, and volume indicate when a re-record is more useful than coaching.',
          },
          {
            k: 'Pronunciation & fluency',
            v: 'Accuracy, integrity, rhythm, pace, pauses, and tone provide the high-level performance picture.',
          },
          {
            k: 'Word-level evidence',
            v: 'Timestamps, word or character errors, stress, liaison, tones, and phonemes support precise explanations.',
          },
          {
            k: 'Decision hooks',
            v: 'Stable fields let your application prioritize issues and approve the action before AI writes the feedback.',
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

function AudienceAndOutcomes() {
  const audiences = [
    {
      icon: GraduationCap,
      title: 'AI language tutors',
      body: 'Give learners a clear correction, an explanation, and a focused retry after every recording.',
    },
    {
      icon: Headphones,
      title: 'Voice agents',
      body: 'Decide whether to continue, clarify, or ask for a re-record using speech and audio-quality evidence.',
    },
    {
      icon: Briefcase,
      title: 'Interview & training products',
      body: 'Turn fluency and delivery signals into explainable, consistent coaching for candidates and teams.',
    },
    {
      icon: Bot,
      title: 'Learning analytics',
      body: 'Summarize recurring issues and progress across sessions without hiding the evidence behind the insight.',
    },
  ];

  return (
    <FadeUp className="mb-14 md:mb-18">
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end mb-6">
        <div>
          <div className="text-[11px] tracking-[0.18em] uppercase text-emerald-700 font-mono mb-2">
            /who-it-serves
          </div>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-[-0.025em] leading-tight">
            Built for products that need the next action—not another score.
          </h2>
        </div>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed lg:max-w-2xl lg:justify-self-end">
          Each response stays tied to structured speech evidence, while your product controls what to prioritize,
          how to explain it, and what the learner or agent should do next.
        </p>
      </div>

      <div className="mb-5 grid gap-2 sm:grid-cols-3">
        {['Evidence-backed responses', 'One prioritized correction', 'A measurable retry loop'].map((outcome) => (
          <div
            key={outcome}
            className="flex items-center gap-2 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.045] px-3 py-2.5 text-[12px] font-medium text-emerald-900"
          >
            <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
            {outcome}
          </div>
        ))}
      </div>

      <StaggerContainer className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {audiences.map(({ icon: Icon, title, body }) => (
          <StaggerItem key={title}>
            <article className="h-full rounded-2xl border border-zinc-900/[0.08] bg-white/65 p-5 shadow-[0_14px_45px_-35px_rgba(15,23,42,0.35)]">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/[0.07] text-emerald-700">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 text-base font-semibold tracking-[-0.015em]">{title}</h3>
              <p className="text-[13px] leading-relaxed text-muted-foreground">{body}</p>
            </article>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </FadeUp>
  );
}

function FeedbackWorkflow() {
  const steps = [
    {
      icon: ShieldCheck,
      label: 'Evidence',
      body: 'Assess speech and audio quality with deterministic scoring.',
      meta: 'audio → structured JSON',
    },
    {
      icon: Sparkles,
      label: 'Diagnose',
      body: 'Explain the issue using the exact score, word, tone, or phoneme signal.',
      meta: 'evidence → diagnosis',
    },
    {
      icon: Target,
      label: 'Prioritize',
      body: 'Apply your product rules and select the single most useful correction.',
      meta: 'diagnosis → approved target',
    },
    {
      icon: Bot,
      label: 'Coach & drill',
      body: 'Deliver clear feedback and generate a short, measurable practice retry.',
      meta: 'target → next action',
    },
  ];

  return (
    <FadeUp className="mb-14 md:mb-18">
      <div className="mb-6 max-w-2xl">
        <div className="text-[11px] tracking-[0.18em] uppercase text-violet-700 font-mono mb-2">
          /feedback-loop
        </div>
        <h2 className="text-2xl md:text-3xl font-semibold tracking-[-0.025em] mb-2">
          A four-step loop from evidence to improvement.
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          AI handles explanation and generation. Your application keeps scoring thresholds, priorities, and safety
          rules predictable.
        </p>
      </div>

      <StaggerContainer className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {steps.map(({ icon: Icon, label, body, meta }, index) => (
          <StaggerItem key={label}>
            <article className="relative h-full overflow-hidden rounded-2xl border border-zinc-900/[0.08] bg-white/70 p-5">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-950 text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="font-mono text-[11px] text-muted-foreground">0{index + 1}</span>
              </div>
              <h3 className="mb-2 text-lg font-semibold tracking-[-0.02em]">{label}</h3>
              <p className="mb-5 text-[13px] leading-relaxed text-muted-foreground">{body}</p>
              <div className="mt-auto border-t border-zinc-900/[0.07] pt-3 font-mono text-[10.5px] text-violet-700">
                {meta}
              </div>
              {index < steps.length - 1 && (
                <ArrowRight className="absolute -right-2 top-8 hidden h-4 w-4 text-violet-400 lg:block" />
              )}
            </article>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </FadeUp>
  );
}

function TechnicalProof() {
  return (
    <FadeUp className="mb-14 md:mb-18">
      <div className="mb-6 grid gap-4 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
        <div>
          <div className="text-[11px] tracking-[0.18em] uppercase text-violet-700 font-mono mb-2">
            /technical-example
          </div>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-[-0.025em]">
            Inspect the evidence when you need it.
          </h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed lg:max-w-2xl lg:justify-self-end">
          The page stays focused on product value. Developers can expand this provider-neutral example to inspect
          the response fields, diagnosis instruction, and structured drill output.
        </p>
      </div>

      <details className="group rounded-2xl border border-violet-500/20 bg-white/60 shadow-[0_20px_70px_-50px_rgba(76,29,149,0.35)]">
        <summary className="group/summary flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-5 py-4 transition-colors hover:bg-violet-500/[0.045] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-inset md:px-6">
          <span className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-500/15 bg-violet-500/10 text-violet-700 transition-transform group-hover/summary:scale-[1.04]">
              <Lightbulb className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-sm font-semibold">Open technical example</span>
              <span className="block text-[11px] text-muted-foreground">Provider-neutral · structured input and output</span>
            </span>
          </span>
          <span className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full bg-zinc-950 px-3.5 text-[11px] font-semibold text-white shadow-sm transition-colors group-hover/summary:bg-violet-700">
            <span className="group-open:hidden">View details</span>
            <span className="hidden group-open:inline">Hide details</span>
            <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 group-open:rotate-180" />
          </span>
        </summary>
        <div className="border-t border-violet-500/15 p-4 md:p-6">
          <PayloadFieldStrip />
          <ReasoningDemo />
        </div>
      </details>
    </FadeUp>
  );
}

function FeedbackCta() {
  return (
    <FadeUp>
      <div className="relative overflow-hidden rounded-3xl bg-zinc-950 px-6 py-8 text-white md:px-10 md:py-10">
        <div aria-hidden className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-violet-500/25 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-2xl">
            <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-emerald-300">
              /build-your-loop
            </div>
            <h2 className="mb-3 text-2xl font-semibold tracking-[-0.03em] md:text-4xl">
              Build a feedback loop your product can trust.
            </h2>
            <p className="text-sm leading-relaxed text-zinc-300 md:text-base">
              Start with a language tutor, voice agent, interview workflow, or training product. Use the same
              evidence contract to diagnose, prioritize, coach, and measure the retry.
            </p>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[12px] text-zinc-300">
              {['Grounded in speech evidence', 'Deterministic product rules', 'Measurable retries'].map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-300" /> {item}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link
              href="/docs#response-schema"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            >
              Read implementation guide <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/demo"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-white/20 px-5 text-sm font-semibold text-white transition-colors hover:border-white/45 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Run live assessment
            </Link>
          </div>
        </div>
      </div>
    </FadeUp>
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
              How an agent turns speech evidence into an approved action
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 border border-rose-500/25 px-2 py-0.5 text-[10px] font-mono text-rose-700 dark:text-rose-400">
              <span className="h-1 w-1 rounded-full bg-rose-500" />
              中文 · 你好 / 上海
            </span>
          </div>
          <div
            className="flex rounded-md border border-border/60 bg-background p-0.5 self-start sm:self-auto"
            role="group"
            aria-label="Feedback step"
          >
            {REASONING_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTab(t.id);
                  setTyped(0);
                }}
                aria-pressed={t.id === tab}
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
                Evidence + product instruction
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                {tab === 'diagnose' ? 'diagnose.ts' : 'drill.ts'}
              </span>
            </div>
            <pre className="text-[11.5px] leading-[1.6] font-mono p-5 whitespace-pre overflow-x-auto max-h-[340px] text-zinc-800">
              <code>{input}</code>
            </pre>
          </div>

          <div
            id="reasoning-output"
            className="relative bg-gradient-to-br from-violet-500/[0.05] via-background to-background"
          >
            <div className="flex items-center justify-between px-4 py-2 border-b border-border/60 bg-white/40 backdrop-blur-sm">
              <span className="inline-flex items-center gap-2 text-[11px] font-mono text-zinc-700 tracking-wide">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-sm bg-violet-600 text-white text-[9px] font-bold">
                  OUT
                </span>
                Agent writes — {tab === 'diagnose' ? 'diagnosis' : 'drill plan'}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {typed >= output.length ? 'done' : 'thinking…'}
              </span>
            </div>
            <pre className="text-[12.5px] leading-[1.7] font-mono p-5 whitespace-pre-wrap text-foreground/85 max-h-[340px] overflow-auto">
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
            The <strong className="text-foreground/85 font-semibold">same structured evidence</strong> works with
            any model or agent stack that accepts JSON. Keep thresholds, pass/fail decisions, and safety rules in
            application code.
          </span>
        </div>
      </div>
    </FadeUp>
  );
}
