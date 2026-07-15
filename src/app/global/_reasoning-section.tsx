'use client';

/* ═══════════════════════════════════════════════════════════════
 *  Voice-agent assessment section — extracted so /global/reasoning can
 *  render it as a dedicated sub-page (while the main landing no
 *  longer carries it).
 * ═══════════════════════════════════════════════════════════ */

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Bot,
  Briefcase,
  Check,
  ChevronDown,
  Headphones,
  Lightbulb,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react';
import { FadeUp, StaggerContainer, StaggerItem } from '@/components/animated-section';

/* ─── Reasoning-demo data ────────────────────────────────── */

const REASONING_TABS = [
  { id: 'diagnose', label: 'Assess turn' },
  { id: 'drill', label: 'Agent response' },
] as const;

type ReasoningTabId = (typeof REASONING_TABS)[number]['id'];

const REASONING_INPUT: Record<ReasoningTabId, string> = {
  diagnose: `const assessment = await chivox.assess({
  audio: currentTurn.audio,
  language: "en-US",
  referenceText: currentTurn.expectedText,
});

const grade = applyRubric(assessment, {
  pass: 80,
  requestRetryBelow: 65,
  checkAudioQualityFirst: true,
});`,
  drill: `const nextTurn = await agent.generate({
  instruction:
    "Respond only from the approved assessment. " +
    "Give one short cue and invite a retry.",
  input: {
    transcript: currentTurn.transcript,
    grade: approvedGrade,
    evidence: approvedEvidence
  },
  output: AgentTurnSchema
});`,
};

const REASONING_OUTPUT: Record<ReasoningTabId, string> = {
  diagnose: `{
  "overall": 76,
  "pronunciation": 72,
  "fluency": 88,
  "audio_quality": "clear",
  "grade": "focused_retry",
  "priority_issue": {
    "word": "think",
    "phoneme": "θ",
    "score": 58,
    "observed_as": "s"
  }
}`,
  drill: `## Approved agent turn

**Almost there.** The first sound in “think” came
out closer to /s/. Keep your tongue lightly between
your teeth for /θ/, then try the sentence once more.

action: request_focused_retry
target: think · /θ/
audio_quality: clear
continue_after_pass: true`,
};

/* ─── Main exported section ──────────────────────────────── */

export function ReasoningSection() {
  return (
    <section
      id="voice-agent"
      className="relative py-16 md:py-20 border-b border-[#e9e2d2]/70 scroll-mt-24"
    >
      <div className="container mx-auto px-6 max-w-7xl">
        <FadeUp className="mb-12 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-14">
          <div>
            <div className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-3">
              /voice-agent
            </div>
            <h1 className="heading-display text-3xl md:text-[42px] tracking-[-0.02em] mb-3 leading-[1.1]">
              Voice Agent Pronunciation Assessment &amp; Speech Scoring
            </h1>
            <p className="text-lg font-medium leading-relaxed text-foreground/85">
              Speech evidence your voice agent can act on—across LiveKit, Pipecat, and custom voice runtimes.
            </p>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Add a listening layer to LiveKit, Pipecat, or any voice-native agent stack. Chivox turns every spoken
              turn into structured evidence—pronunciation, fluency, tone, and audio quality—so your application keeps
              grading deterministic while the agent responds naturally.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/docs#response-schema"
                className="inline-flex h-10 items-center gap-2 rounded-full bg-zinc-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
              >
                Explore MCP &amp; API integration <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/runtime"
                className="inline-flex h-10 items-center gap-2 rounded-full border border-zinc-900/10 bg-white/70 px-4 text-sm font-semibold text-zinc-800 transition-colors hover:border-emerald-500/35 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
              >
                Plan real-time runtime
              </Link>
            </div>
          </div>

          <FeedbackPreviewPanel />
        </FadeUp>

        <IntegrationStrip />

        <AssessmentDifference />

        <AudienceAndOutcomes />

        <FeedbackWorkflow />

        <TechnicalProof />

        <VoiceAgentFaq />

        <FeedbackCta />
      </div>
    </section>
  );
}

function FeedbackPreviewPanel() {
  return (
    <aside
      aria-label="Example voice-agent speech assessment response"
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
            <div className="mt-0.5 text-sm font-semibold tracking-[-0.01em]">Assessment ready</div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.07] px-2.5 py-1 font-mono text-[10px] text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            grounded
          </span>
        </div>

        <div className="relative mb-3 aspect-[3/1.35] overflow-hidden rounded-2xl bg-zinc-950">
          <Image
            src="/solutions/voice-agent/voice-agent-hero.webp"
            alt="Professional speaking with a real-time voice agent at a laptop"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 610px"
            className="object-cover object-center"
          />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-zinc-950/35" />
          <div className="absolute right-3 top-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-zinc-950/75 px-3 py-1.5 font-mono text-[9.5px] text-white shadow-lg backdrop-blur-md">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            live turn · listening
          </div>
          <div className="absolute bottom-3 right-3 flex h-9 items-end gap-1 rounded-xl border border-white/15 bg-zinc-950/75 px-3 py-2 shadow-lg backdrop-blur-md" aria-label="Live audio waveform">
            {[38, 72, 48, 92, 64, 82, 44, 70, 52, 34].map((height, index) => (
              <span
                key={`${height}-${index}`}
                aria-hidden
                className="w-1 rounded-full bg-emerald-300"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
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
              <Target className="h-3.5 w-3.5" /> Pronunciation signal
            </div>
            <p className="text-[15px] font-semibold leading-snug tracking-[-0.015em]">Soften the /sh/ → /s/ substitution.</p>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              Detected in 3 of 4 target words. Fluency is strong, so correct this sound first.
            </p>
          </div>

          <div className="rounded-2xl bg-zinc-950 p-4 text-white">
            <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" /> Agent response
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
          <span className="text-[11px] font-medium text-emerald-900">Assessment returned to the live agent</span>
          <span className="shrink-0 font-mono text-[9.5px] text-emerald-700">ready to respond</span>
        </div>
      </div>
    </aside>
  );
}

function IntegrationStrip() {
  return (
    <FadeUp className="mb-14 md:mb-18">
      <div className="flex flex-col gap-5 rounded-2xl border border-zinc-900/[0.08] bg-white/65 px-5 py-5 shadow-[0_18px_50px_-42px_rgba(15,23,42,0.35)] sm:flex-row sm:items-center sm:justify-between md:px-7">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-700">Framework-neutral by design</div>
          <p className="mt-1 text-sm font-medium text-zinc-800">Bring the transport and orchestration you already use.</p>
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Supported integration patterns">
          {['LiveKit', 'Pipecat', 'MCP', 'REST API', 'Custom runtime'].map((item) => (
            <span
              key={item}
              className="rounded-full border border-zinc-900/[0.08] bg-[#fbfaf7] px-3 py-1.5 font-mono text-[10.5px] text-zinc-700"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </FadeUp>
  );
}

function AssessmentDifference() {
  const layers = [
    {
      icon: Headphones,
      eyebrow: 'Transcription layer',
      title: 'What did the user say?',
      body: 'Speech-to-text converts the turn into words so the agent can understand intent and continue the conversation.',
      meta: 'audio → transcript',
    },
    {
      icon: ShieldCheck,
      eyebrow: 'Chivox assessment layer',
      title: 'How was it spoken?',
      body: 'Pronunciation, fluency, tone, completeness, and audio-quality evidence reveal performance that a transcript cannot show.',
      meta: 'audio → scoring evidence',
    },
    {
      icon: Bot,
      eyebrow: 'Agent layer',
      title: 'What should happen next?',
      body: 'Your application applies its rubric, then the agent can continue, clarify, correct, grade, or invite a focused retry.',
      meta: 'approved result → response',
    },
  ];

  return (
    <FadeUp className="mb-14 md:mb-18">
      <div className="mb-7 grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
        <div>
          <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-violet-700">/beyond-transcription</div>
          <h2 className="text-2xl font-semibold leading-tight tracking-[-0.025em] md:text-3xl">
            Transcription hears the words. Assessment hears how they were spoken.
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground lg:max-w-2xl lg:justify-self-end md:text-base">
          A transcript is essential context, but it cannot reliably grade pronunciation or delivery. Chivox adds the
          missing speech-performance evidence without replacing your STT, model, or TTS provider.
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {layers.map(({ icon: Icon, eyebrow, title, body, meta }, index) => (
          <article
            key={title}
            className="relative overflow-hidden rounded-2xl border border-zinc-900/[0.08] bg-white/70 p-5 shadow-[0_18px_50px_-42px_rgba(15,23,42,0.4)] md:p-6"
          >
            <div className="mb-5 flex items-center justify-between">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${index === 1 ? 'bg-violet-600 text-white' : 'bg-zinc-950 text-white'}`}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="font-mono text-[10px] text-zinc-400">0{index + 1}</span>
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-violet-700">{eyebrow}</div>
            <h3 className="mt-2 text-lg font-semibold tracking-[-0.02em]">{title}</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{body}</p>
            <div className="mt-5 border-t border-zinc-900/[0.07] pt-3 font-mono text-[10.5px] text-emerald-700">{meta}</div>
            {index < layers.length - 1 ? (
              <ArrowRight className="absolute -right-2 top-10 hidden h-4 w-4 text-violet-400 lg:block" />
            ) : null}
          </article>
        ))}
      </div>
    </FadeUp>
  );
}

/* ─── Field overview — one screenful listing what "rich payload" means ─ */
function PayloadFieldStrip() {
  return (
    <div className="mb-10 md:mb-12 rounded-2xl border border-violet-200/60 bg-gradient-to-br from-violet-500/[0.05] via-white/85 to-amber-500/[0.04] p-4 md:p-6 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset]">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-4">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-violet-700 mb-1">Live audio · structured evidence</p>
          <p className="text-[15px] font-semibold text-foreground tracking-tight">The listening layer behind reliable voice agents</p>
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
            v: 'Stable fields let your application grade the turn, route the conversation, and constrain the agent response.',
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
      icon: Headphones,
      title: 'LiveKit agents',
      body: 'Score a spoken turn inside a real-time room and return pronunciation evidence without breaking the conversation.',
    },
    {
      icon: Bot,
      title: 'Pipecat pipelines',
      body: 'Insert assessment alongside speech-to-text, model, and text-to-speech services in an existing pipeline.',
    },
    {
      icon: Briefcase,
      title: 'Custom voice runtimes',
      body: 'Call Chivox through MCP or API from any orchestration layer that can send audio and accept structured JSON.',
    },
  ];

  return (
    <FadeUp className="mb-12 md:mb-16">
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end mb-6">
        <div>
          <div className="text-[11px] tracking-[0.18em] uppercase text-emerald-700 font-mono mb-2">
            /your-voice-stack
          </div>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-[-0.025em] leading-tight">
            Agent-Native Speech Assessment Workflows
          </h2>
        </div>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed lg:max-w-2xl lg:justify-self-end">
          Use MCP or API wherever you can pass audio in and structured JSON back. Chivox handles assessment;
          your runtime still owns turn-taking, orchestration, and the user experience.
        </p>
      </div>

      <StaggerContainer className="grid gap-3 md:grid-cols-3">
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
      icon: Headphones,
      label: 'Listen',
      body: 'Capture the relevant user turn from LiveKit, Pipecat, or your own voice runtime.',
      meta: 'live turn → audio',
    },
    {
      icon: ShieldCheck,
      label: 'Assess',
      body: 'Score pronunciation, fluency, tone, completeness, and recording quality.',
      meta: 'audio → assessment',
    },
    {
      icon: Target,
      label: 'Grade',
      body: 'Apply deterministic thresholds and select the evidence the agent is allowed to use.',
      meta: 'scores → approved result',
    },
    {
      icon: Bot,
      label: 'Respond',
      body: 'Let the agent explain, clarify, continue, or request a focused retry in the same session.',
      meta: 'result → agent turn',
    },
  ];

  return (
    <FadeUp className="mb-12 md:mb-16">
      <div className="mb-6 max-w-2xl">
        <div className="text-[11px] tracking-[0.18em] uppercase text-violet-700 font-mono mb-2">
          /decision-boundary
        </div>
        <h2 className="text-2xl md:text-3xl font-semibold tracking-[-0.025em] mb-2">
          Real-time speech assessment integration for voice AI
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Keep scoring, grade logic, and safety rules in your application. Give the model only the approved
          evidence it needs to guide the next turn.
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
    <FadeUp className="mb-12 md:mb-16">
      <div className="mb-6 grid gap-4 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
        <div>
          <div className="text-[11px] tracking-[0.18em] uppercase text-violet-700 font-mono mb-2">
            /technical-example
          </div>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-[-0.025em]">
            Adding Listening and Grading to Agents
          </h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed lg:max-w-2xl lg:justify-self-end">
          This provider-neutral example shows the handoff: audio and product rules in, structured evidence out,
          then an approved response back into the conversation.
        </p>
      </div>

      <details open id="integration-example" className="group rounded-2xl border border-violet-500/20 bg-white/60 shadow-[0_20px_70px_-50px_rgba(76,29,149,0.35)]">
        <summary className="group/summary flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-5 py-4 transition-colors hover:bg-violet-500/[0.045] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-inset md:px-6">
          <span className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-500/15 bg-violet-500/10 text-violet-700 transition-transform group-hover/summary:scale-[1.04]">
              <Lightbulb className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-sm font-semibold">Voice-agent turn contract</span>
              <span className="block text-[11px] text-muted-foreground">LiveKit, Pipecat, or custom stack · MCP and API</span>
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

function VoiceAgentFaq() {
  const questions = [
    {
      question: 'Does Chivox replace speech-to-text?',
      answer:
        'No. Speech-to-text tells the agent what was said. Chivox adds evidence about how it was spoken, including pronunciation, fluency, tone, completeness, and recording quality. The two layers can work together in the same voice pipeline.',
    },
    {
      question: 'How does Chivox connect to LiveKit or Pipecat?',
      answer:
        'Capture the relevant user turn in your existing pipeline, send the audio and assessment context through MCP or API, then pass the approved scoring fields back to your agent. Your framework continues to control turn-taking, VAD, STT, the model, and TTS.',
    },
    {
      question: 'Can we keep grading rules outside the LLM?',
      answer:
        'Yes. Keep pass thresholds, retry rules, routing, and high-impact decisions in application code. The model can explain the approved result naturally without becoming the source of truth for the score.',
    },
    {
      question: 'Which speech signals can the agent use?',
      answer:
        'Depending on the assessment, the response can include pronunciation and fluency scores, audio-quality signals, completeness, word or character detail, phonemes, stress, liaison, Pinyin, and tones.',
    },
    {
      question: 'How should assessment fit into a live conversation?',
      answer:
        'Assess only the turns that need scoring. Your product can evaluate a completed turn before the next response, run selected checks alongside other pipeline work, or reserve detailed grading for explicit practice and verification moments.',
    },
  ];

  return (
    <FadeUp className="mb-14 md:mb-18">
      <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-12">
        <div>
          <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-emerald-700">/voice-agent-faq</div>
          <h2 className="text-2xl font-semibold leading-tight tracking-[-0.025em] md:text-3xl">
            Integration questions, answered.
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            Keep your current voice stack and add assessment only where the product needs reliable speech evidence.
          </p>
          <Link
            href="/faq"
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800 transition-colors hover:text-emerald-950"
          >
            Read all FAQs <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="divide-y divide-zinc-900/[0.07] overflow-hidden rounded-2xl border border-zinc-900/[0.08] bg-white/70">
          {questions.map(({ question, answer }, index) => (
            <details key={question} className="group" open={index === 0}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 px-5 py-4 text-sm font-semibold text-zinc-900 transition-colors hover:bg-emerald-500/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-600 md:px-6">
                {question}
                <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400 transition-transform group-open:rotate-180" />
              </summary>
              <p className="px-5 pb-5 pr-12 text-[13px] leading-relaxed text-muted-foreground md:px-6 md:pb-6 md:pr-16">
                {answer}
              </p>
            </details>
          ))}
        </div>
      </div>
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
              /build-your-agent
            </div>
            <h2 className="mb-3 text-2xl font-semibold tracking-[-0.03em] md:text-4xl">
              Start with one speech turn, then scale your agent loop.
            </h2>
            <p className="text-sm leading-relaxed text-zinc-300 md:text-base">
              Connect Chivox to LiveKit, Pipecat, or your own voice-native stack. Assess the turns that matter,
              grade them with product-owned rules, and let the agent respond from approved evidence.
            </p>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[12px] text-zinc-300">
              {['Real-time speech assessment', 'MCP or API integration', 'Deterministic grading rules'].map((item) => (
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
              Read integration guide <ArrowRight className="h-4 w-4" />
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

/* ─── Live agent demo — assessment evidence → approved response ─── */
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
              How a voice agent turns a live speech turn into an approved response
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 border border-rose-500/25 px-2 py-0.5 text-[10px] font-mono text-rose-700 dark:text-rose-400">
              <span className="h-1 w-1 rounded-full bg-rose-500" />
              Live audio · en-US
            </span>
          </div>
          <div
            className="flex rounded-md border border-border/60 bg-background p-0.5 self-start sm:self-auto"
            role="group"
            aria-label="Voice agent assessment step"
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
                Audio turn + product rubric
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                {tab === 'diagnose' ? 'assess-turn.ts' : 'agent-response.ts'}
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
                {tab === 'diagnose' ? 'Chivox returns — scoring evidence' : 'Agent writes — approved response'}
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
            LiveKit, Pipecat, or any agent stack that accepts JSON. Keep thresholds, pass/fail decisions, and safety
            rules in application code.
          </span>
        </div>
      </div>
    </FadeUp>
  );
}
