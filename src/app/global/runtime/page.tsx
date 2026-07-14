'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  Bell,
  Check,
  Gauge,
  Key,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { FadeUp, StaggerContainer, StaggerItem } from '@/components/animated-section';
import {
  AmbientBackdrop,
  BackToOverview,
  OpenContactButton,
  SiteFooter,
  TopNav,
} from '../_chrome';

const CONTROLS = [
  {
    icon: Key,
    eyebrow: 'Keys',
    title: 'Move from testing to paid traffic without re-integrating',
    body: 'Create environment-scoped keys, rotate them from the dashboard, and keep the same endpoint and JSON contract as usage grows.',
    proof: 'Free → paid · no migration',
    tone: 'emerald',
    art: '/runtime/keys.jpg',
    artAlt: 'Chivox API keys dashboard with starter and paid production keys',
  },
  {
    icon: Gauge,
    eyebrow: 'Usage controls',
    title: 'Put a hard ceiling on every environment',
    body: 'Set monthly limits per key. When a cap is reached, the API returns a structured 429 your product can handle predictably.',
    proof: 'Hard cap · structured 429',
    tone: 'amber',
    art: '/runtime/budgets.jpg',
    artAlt: 'Monthly speech assessment API usage cap settings',
  },
  {
    icon: Bell,
    eyebrow: 'Alerts',
    title: 'Know before usage becomes an incident',
    body: 'Trigger email or webhook alerts at 80%, 90%, and 100% of spend or credit balance for finance and operations workflows.',
    proof: '80 · 90 · 100% thresholds',
    tone: 'rose',
    art: '/runtime/alerts.jpg',
    artAlt: 'Low-balance alert thresholds and notification channels',
  },
] as const;

const TONES = {
  emerald: 'text-emerald-800 bg-emerald-500/10 border-emerald-500/20',
  amber: 'text-amber-800 bg-amber-500/10 border-amber-500/20',
  rose: 'text-rose-800 bg-rose-500/10 border-rose-500/20',
} as const;

const FAQS = [
  {
    question: 'Can I set usage limits for each speech assessment API key?',
    answer:
      'Yes. Each key can have its own monthly limit and environment scope. When the hard cap is reached, calls return a structured 429 response instead of failing ambiguously.',
  },
  {
    question: 'Does Chivox retain audio used for speech assessment?',
    answer:
      'Streaming audio is scored in memory and is not retained for model training. Your application receives structured assessment JSON without creating an additional stored audio copy in the scoring runtime.',
  },
  {
    question: 'What production monitoring is available?',
    answer:
      'The dashboard shows per-key usage, latency percentiles, tool breakdowns, and error reasons. Teams can also export usage data through the API and route threshold alerts through email or webhooks.',
  },
] as const;

const schema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      name: 'Speech Assessment API Runtime, Usage Controls and SLA',
      description:
        'Production controls for Chivox speech assessment and pronunciation scoring APIs.',
      url: 'https://chivox.voiceagent.bond/runtime',
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQS.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    },
  ],
};

export default function GlobalRuntimePage() {
  return (
    <div className="relative">
      <AmbientBackdrop />
      <TopNav />
      <BackToOverview />

      <main>
        <section className="relative overflow-hidden border-b border-[#e9e2d2]/70 pb-16 pt-10 md:pb-24 md:pt-14">
          <div className="container mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-[0.88fr_1.12fr] lg:gap-16 lg:px-8">
            <FadeUp>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-700/15 bg-white/65 px-3 py-1.5 text-[10.5px] font-mono uppercase tracking-[0.16em] text-emerald-800 shadow-sm backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Speech assessment infrastructure
              </div>
              <h1 className="heading-display max-w-3xl text-[clamp(2.65rem,5vw,4.65rem)] leading-[0.98] tracking-[-0.045em] text-zinc-950">
                Production controls for your speech assessment API.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-zinc-600 md:text-lg md:leading-8">
                Ship pronunciation scoring with the operational layer already in place: scoped API
                keys, hard usage caps, threshold alerts, live analytics, zero-retention streaming,
                and an enterprise SLA.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-zinc-950 px-6 text-sm font-semibold text-white shadow-[0_14px_34px_-16px_rgba(0,0,0,0.7)] transition-all hover:-translate-y-0.5 hover:bg-emerald-800"
                >
                  Start with free credits
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/docs"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-900/10 bg-white/65 px-6 text-sm font-semibold text-zinc-900 backdrop-blur transition-colors hover:border-emerald-600/30 hover:bg-white"
                >
                  Read the API docs
                </Link>
              </div>

              <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[12px] text-zinc-600">
                {['No credit card', 'Same API contract', 'Dashboard + API'].map((item) => (
                  <li key={item} className="inline-flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-700" />
                    {item}
                  </li>
                ))}
              </ul>
            </FadeUp>

            <FadeUp delay={0.08} className="relative">
              <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.16),transparent_67%)] blur-2xl" />
              <div className="overflow-hidden rounded-[1.75rem] border border-zinc-900/10 bg-white/75 p-2.5 shadow-[0_34px_80px_-38px_rgba(31,41,55,0.38)] backdrop-blur-xl md:p-3">
                <div className="flex items-center justify-between px-3 pb-2.5 pt-1 text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-500">
                  <span>Production overview</span>
                  <span className="inline-flex items-center gap-1.5 text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
                    Operational
                  </span>
                </div>
                <div className="relative aspect-[16/10] overflow-hidden rounded-[1.25rem] border border-zinc-900/[0.07] bg-[#f5f1e8]">
                  <Image
                    src="/runtime/observability.jpg"
                    alt="Chivox speech assessment API usage and latency analytics dashboard"
                    fill
                    priority
                    quality={90}
                    sizes="(max-width: 1024px) 100vw, 58vw"
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="relative -mt-5 mx-4 grid grid-cols-3 overflow-hidden rounded-2xl border border-zinc-900/10 bg-[#fffdf8]/95 shadow-[0_18px_44px_-25px_rgba(0,0,0,0.45)] backdrop-blur-xl md:mx-8">
                {[
                  ['99.95%', 'enterprise SLA'],
                  ['240 ms', 'p50 latency'],
                  ['0 sec', 'audio retention'],
                ].map(([value, label], index) => (
                  <div key={label} className={`px-3 py-4 text-center ${index ? 'border-l border-zinc-900/[0.07]' : ''}`}>
                    <div className="text-base font-semibold tabular-nums tracking-[-0.02em] text-zinc-950 md:text-lg">{value}</div>
                    <div className="mt-0.5 text-[9px] uppercase tracking-[0.12em] text-zinc-500 md:text-[10px]">{label}</div>
                  </div>
                ))}
              </div>
            </FadeUp>
          </div>
        </section>

        <section className="relative py-20 md:py-28" aria-labelledby="controls-heading">
          <div className="container mx-auto max-w-7xl px-6 lg:px-8">
            <FadeUp className="mb-10 grid gap-5 md:grid-cols-[0.75fr_1fr] md:items-end md:gap-16">
              <div>
                <div className="mb-3 text-[10.5px] font-mono uppercase tracking-[0.18em] text-emerald-700">01 / Control</div>
                <h2 id="controls-heading" className="heading-display text-3xl leading-tight text-zinc-950 md:text-[2.75rem]">
                  Keep usage predictable from the first key.
                </h2>
              </div>
              <p className="max-w-2xl text-sm leading-7 text-zinc-600 md:text-base">
                Production speech scoring touches engineering, finance, and support. Give each team
                the controls it needs without adding a separate billing or monitoring stack.
              </p>
            </FadeUp>

            <StaggerContainer className="grid gap-4 lg:grid-cols-3">
              {CONTROLS.map((item) => {
                const tone = TONES[item.tone];
                return (
                  <StaggerItem key={item.title}>
                    <article className="group flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-zinc-900/[0.08] bg-white/72 shadow-[0_20px_60px_-45px_rgba(0,0,0,0.42)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-zinc-900/[0.14] hover:shadow-[0_28px_64px_-38px_rgba(0,0,0,0.3)]">
                      <div className="relative aspect-[16/9] overflow-hidden bg-[#f5f1e8]">
                        <Image src={item.art} alt={item.artAlt} fill quality={88} sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.025]" />
                      </div>
                      <div className="flex flex-1 flex-col p-6">
                        <div className={`mb-5 inline-flex h-9 w-9 items-center justify-center rounded-xl border ${tone}`}>
                          <item.icon className="h-4 w-4" />
                        </div>
                        <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-zinc-500">{item.eyebrow}</div>
                        <h3 className="mt-2 text-lg font-semibold leading-snug tracking-[-0.02em] text-zinc-950">{item.title}</h3>
                        <p className="mt-3 text-[13px] leading-6 text-zinc-600">{item.body}</p>
                        <div className={`mt-5 self-start rounded-full border px-2.5 py-1 text-[10px] font-mono ${tone}`}>{item.proof}</div>
                      </div>
                    </article>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </div>
        </section>

        <section className="relative border-y border-zinc-900/[0.07] bg-white/30 py-20 md:py-28" aria-labelledby="visibility-heading">
          <div className="container mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
              <FadeUp>
                <div className="mb-3 text-[10.5px] font-mono uppercase tracking-[0.18em] text-sky-700">02 / Observe</div>
                <h2 id="visibility-heading" className="heading-display text-3xl leading-tight text-zinc-950 md:text-[2.75rem]">
                  See what production is doing before users tell you.
                </h2>
                <p className="mt-5 max-w-xl text-sm leading-7 text-zinc-600 md:text-base">
                  Track usage by key, inspect latency percentiles, compare assessment tools, and
                  diagnose error reasons in the dashboard or through an export API.
                </p>
                <ul className="mt-7 grid gap-3 text-sm text-zinc-700 sm:grid-cols-2">
                  {['Per-key usage', 'Latency percentiles', 'Tool breakdown', 'Structured error reasons'].map((item) => (
                    <li key={item} className="flex items-center gap-2.5">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/10 text-sky-700"><Check className="h-3.5 w-3.5" /></span>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/docs" className="group mt-8 inline-flex items-center gap-2 text-sm font-semibold text-zinc-950 hover:text-emerald-800">
                  Explore monitoring in the docs
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </FadeUp>
              <FadeUp delay={0.08}>
                <div className="overflow-hidden rounded-[1.75rem] border border-zinc-900/10 bg-white/70 p-2.5 shadow-[0_30px_70px_-40px_rgba(0,0,0,0.35)] backdrop-blur">
                  <div className="relative aspect-[16/11] overflow-hidden rounded-[1.25rem]">
                    <Image src="/runtime/observability.jpg" alt="Per-key speech assessment API usage charts" fill quality={90} sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
                  </div>
                </div>
              </FadeUp>
            </div>
          </div>
        </section>

        <section className="relative py-20 md:py-28" aria-labelledby="trust-heading">
          <div className="container mx-auto max-w-7xl px-6 lg:px-8">
            <FadeUp className="mx-auto mb-11 max-w-3xl text-center">
              <div className="mb-3 text-[10.5px] font-mono uppercase tracking-[0.18em] text-violet-700">03 / Trust</div>
              <h2 id="trust-heading" className="heading-display text-3xl leading-tight text-zinc-950 md:text-[2.75rem]">
                Designed for sensitive audio and real production load.
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-zinc-600 md:text-base">
                Keep audio ephemeral while relying on a runtime already operating at billions of
                evaluations per year.
              </p>
            </FadeUp>

            <div className="grid gap-4 lg:grid-cols-2">
              {[
                {
                  icon: ShieldCheck,
                  label: 'Zero-retention streaming',
                  title: 'Audio in. Assessment JSON out.',
                  body: 'Audio is scored in memory, never used for training, and not stockpiled by the scoring runtime.',
                  stat: 'TTL 0s',
                  art: '/runtime/privacy.jpg',
                  alt: 'Stateless speech assessment streaming and zero audio retention',
                  tone: 'text-violet-800 bg-violet-500/10',
                },
                {
                  icon: Activity,
                  label: 'Production scale',
                  title: 'A runtime built for peak traffic.',
                  body: '9.2B+ evaluations per year, p50 latency of 240 ms, and a 99.95% uptime SLA on the enterprise tier.',
                  stat: '9.2B+ / year',
                  art: '/runtime/scale.jpg',
                  alt: 'Global speech assessment API status and latency',
                  tone: 'text-indigo-800 bg-indigo-500/10',
                },
              ].map((item) => (
                <FadeUp key={item.title} className="group overflow-hidden rounded-[1.6rem] border border-zinc-900/[0.08] bg-white/70 backdrop-blur">
                  <div className="relative aspect-[16/8] overflow-hidden bg-[#f5f1e8]">
                    <Image src={item.art} alt={item.alt} fill quality={88} sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.02]" />
                  </div>
                  <div className="p-6 md:p-7">
                    <div className="flex items-center justify-between gap-4">
                      <span className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.15em] text-zinc-500"><item.icon className="h-4 w-4" />{item.label}</span>
                      <span className={`rounded-full px-3 py-1 text-[10px] font-mono ${item.tone}`}>{item.stat}</span>
                    </div>
                    <h3 className="mt-5 text-xl font-semibold tracking-[-0.025em] text-zinc-950">{item.title}</h3>
                    <p className="mt-2 max-w-xl text-[13px] leading-6 text-zinc-600">{item.body}</p>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        <section className="relative border-y border-zinc-900/[0.07] bg-white/35 py-20" aria-labelledby="faq-heading">
          <div className="container mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20 lg:px-8">
            <FadeUp>
              <div className="mb-3 text-[10.5px] font-mono uppercase tracking-[0.18em] text-emerald-700">Runtime FAQ</div>
              <h2 id="faq-heading" className="heading-display text-3xl leading-tight text-zinc-950">Questions teams ask before launch.</h2>
            </FadeUp>
            <div className="divide-y divide-zinc-900/[0.08] border-y border-zinc-900/[0.08]">
              {FAQS.map((item, index) => (
                <details key={item.question} open={index === 0} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 rounded-md text-[15px] font-semibold text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/50">
                    {item.question}
                    <span aria-hidden className="text-xl font-normal text-zinc-400 group-open:rotate-45">+</span>
                  </summary>
                  <p className="max-w-2xl pt-3 text-sm leading-7 text-zinc-600">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="relative py-20 md:py-28">
          <FadeUp className="container mx-auto max-w-6xl px-6 lg:px-8">
            <div className="overflow-hidden rounded-[2rem] bg-zinc-950 px-6 py-12 text-center text-white shadow-[0_30px_80px_-40px_rgba(0,0,0,0.65)] md:px-12 md:py-16">
              <Zap className="mx-auto h-6 w-6 text-emerald-400" />
              <h2 className="heading-display mx-auto mt-5 max-w-3xl text-3xl leading-tight md:text-[2.75rem]">Ready to put speech assessment into production?</h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-zinc-300">Start with free credits, or talk with the team about volume, security, and enterprise SLA requirements.</p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="/register" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-zinc-950 transition-transform hover:-translate-y-0.5">Start building <ArrowRight className="h-4 w-4" /></Link>
                <OpenContactButton className="inline-flex h-12 items-center justify-center rounded-full border border-white/20 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10">Talk to an expert</OpenContactButton>
              </div>
            </div>
          </FadeUp>
        </section>
      </main>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} />
      <SiteFooter />
    </div>
  );
}
