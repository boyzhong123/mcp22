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
    index: '01',
    eyebrow: 'Environment access',
    title: 'Separate environments without changing your integration',
    body: 'Use scoped keys for development, staging, and production. Rotate access safely while every environment keeps the same endpoint and response contract.',
    proofs: ['Scoped keys', 'Safe rotation'],
    tone: 'emerald',
    art: '/runtime/keys-v2.jpg',
    artAlt: 'API keys dashboard floating over a desk — Dev, Staging, and Prod keys with usage bars',
  },
  {
    icon: Gauge,
    index: '02',
    eyebrow: 'Usage protection',
    title: 'Set enforceable limits before traffic scales',
    body: 'Assign a monthly cap to each key. When a limit is reached, the API returns a structured 429 so your product can degrade gracefully.',
    proofs: ['Per-key cap', 'Structured 429'],
    tone: 'amber',
    art: '/runtime/budgets-v2.jpg',
    artAlt: 'Spend limits panel with evaluation-point gauge and monthly or daily caps',
  },
  {
    icon: Bell,
    index: '03',
    eyebrow: 'Proactive alerts',
    title: 'Catch usage risk before users feel it',
    body: 'Notify engineering and operations by email or webhook as usage approaches a limit, leaving time to investigate, increase capacity, or adjust traffic.',
    proofs: ['Email alerts', 'Webhook thresholds'],
    tone: 'rose',
    art: '/runtime/alerts-v2.jpg',
    artAlt: 'Notification settings with alert thresholds and a low-balance toast',
  },
] as const;

const TONE_ICON = {
  emerald: 'text-emerald-800 bg-emerald-500/10 border-emerald-500/25',
  amber: 'text-amber-800 bg-amber-500/10 border-amber-500/25',
  rose: 'text-rose-800 bg-rose-500/10 border-rose-500/25',
} as const;

const TONE_CHIP = {
  emerald: 'text-emerald-800 bg-emerald-500/[0.08] border-emerald-500/20',
  amber: 'text-amber-900 bg-amber-500/[0.08] border-amber-500/20',
  rose: 'text-rose-800 bg-rose-500/[0.08] border-rose-500/20',
} as const;

const TONE_GLOW = {
  emerald: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
  amber: 'from-amber-500/20 via-amber-500/5 to-transparent',
  rose: 'from-rose-500/20 via-rose-500/5 to-transparent',
} as const;

const TONE_INDEX = {
  emerald: 'text-emerald-700',
  amber: 'text-amber-700',
  rose: 'text-rose-700',
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
      name: 'Speech Assessment Runtime & Operations',
      description:
        'Production controls, observability, privacy, and scale for Chivox speech assessment APIs.',
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
      <BackToOverview
        current="Runtime & operations"
        containerClassName="container mx-auto px-6 lg:px-8 max-w-7xl pt-6"
      />

      <main className="marketing-page">
        <section className="relative overflow-hidden border-b border-[#e9e2d2]/70 pb-16 pt-10 md:pb-24 md:pt-14">
          <div className="container mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-[0.88fr_1.12fr] lg:gap-16 lg:px-8">
            <FadeUp>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-700/15 bg-white/65 px-3 py-1.5 text-[10.5px] font-mono uppercase tracking-[0.16em] text-emerald-800 shadow-sm backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Runtime &amp; operations
              </div>
              <h1 className="heading-display max-w-3xl text-[clamp(2.65rem,4.4vw,4.2rem)] leading-[0.99] tracking-[-0.045em] text-zinc-950">
                Operate speech assessment with confidence.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-zinc-600 md:text-lg md:leading-8">
                Manage environments, protect usage, monitor performance, and meet privacy
                requirements with production controls built around the same assessment API.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-zinc-950 px-6 text-sm font-semibold text-white shadow-[0_14px_34px_-16px_rgba(0,0,0,0.7)] transition-all hover:-translate-y-0.5 hover:bg-emerald-800"
                >
                  Start building free
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/docs"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-900/10 bg-white/65 px-6 text-sm font-semibold text-zinc-900 backdrop-blur transition-colors hover:border-emerald-600/30 hover:bg-white"
                >
                  Read developer docs
                </Link>
              </div>

              <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[12px] text-zinc-600">
                {['Scoped API keys', 'Hard usage caps', 'Zero audio retention'].map((item) => (
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
                    src="/runtime/observability-v2.jpg"
                    alt="Chivox speech assessment API usage and latency analytics dashboard"
                    fill
                    priority
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
            <FadeUp className="mb-12 max-w-3xl md:mb-16">
              <div className="mb-3 text-[10.5px] font-mono uppercase tracking-[0.18em] text-emerald-700">01 / Control</div>
              <h2 id="controls-heading" className="heading-display text-3xl leading-tight text-zinc-950 md:text-[2.75rem]">
                Control access and usage before traffic scales.
              </h2>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-zinc-600 md:text-base">
                Separate environments, enforce limits, and route alerts without rebuilding the
                integration or adding a second operations stack.
              </p>
            </FadeUp>

            <div className="space-y-6 md:space-y-8">
              {CONTROLS.map((item, i) => {
                const reverse = i % 2 === 1;
                return (
                  <FadeUp key={item.title} delay={i * 0.04}>
                    <article
                      className={`group grid overflow-hidden rounded-[1.75rem] border border-zinc-900/[0.08] bg-white/70 shadow-[0_24px_70px_-48px_rgba(0,0,0,0.45)] backdrop-blur-md transition-all duration-500 hover:border-zinc-900/[0.14] hover:shadow-[0_32px_80px_-42px_rgba(0,0,0,0.32)] lg:grid-cols-2 ${
                        reverse ? 'lg:[&>*:first-child]:order-2' : ''
                      }`}
                    >
                      <div className="relative aspect-[16/10] overflow-hidden bg-[#f3eee4] lg:aspect-auto lg:min-h-[320px]">
                        <div className={`pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t ${TONE_GLOW[item.tone]} opacity-80`} />
                        <Image
                          src={item.art}
                          alt={item.artAlt}
                          fill
                          sizes="(max-width: 1024px) 100vw, 50vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                        />
                      </div>

                      <div className="flex flex-col justify-center p-7 md:p-9 lg:p-10">
                        <div className="mb-5 flex items-center gap-3">
                          <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border ${TONE_ICON[item.tone]}`}>
                            <item.icon className="h-4 w-4" />
                          </div>
                          <span className={`text-[11px] font-mono uppercase tracking-[0.18em] ${TONE_INDEX[item.tone]}`}>
                            {item.index} / {item.eyebrow}
                          </span>
                        </div>
                        <h3 className="max-w-md text-xl font-semibold leading-snug tracking-[-0.025em] text-zinc-950 md:text-[1.35rem]">
                          {item.title}
                        </h3>
                        <p className="mt-3 max-w-md text-[14px] leading-7 text-zinc-600">{item.body}</p>
                        <div className="mt-6 flex flex-wrap gap-2">
                          {item.proofs.map((proof) => (
                            <span
                              key={proof}
                              className={`rounded-full border px-3 py-1 text-[11px] font-mono ${TONE_CHIP[item.tone]}`}
                            >
                              {proof}
                            </span>
                          ))}
                        </div>
                      </div>
                    </article>
                  </FadeUp>
                );
              })}
            </div>
          </div>
        </section>

        <section className="relative border-y border-zinc-900/[0.07] bg-white/30 py-20 md:py-28" aria-labelledby="visibility-heading">
          <div className="container mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
              <FadeUp>
                <div className="mb-3 text-[10.5px] font-mono uppercase tracking-[0.18em] text-sky-700">02 / Observe</div>
                <h2 id="visibility-heading" className="heading-display text-3xl leading-tight text-zinc-950 md:text-[2.75rem]">
                  See issues before they reach users.
                </h2>
                <p className="mt-5 max-w-xl text-sm leading-7 text-zinc-600 md:text-base">
                  Track usage by key, inspect latency and error reasons, and understand which tools
                  are driving traffic from the dashboard or export API.
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
                    <Image src="/runtime/observability-v2.jpg" alt="Per-key speech assessment API usage charts" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
                  </div>
                </div>
              </FadeUp>
            </div>
          </div>
        </section>

        <section className="relative py-20 md:py-28" aria-labelledby="trust-heading">
          <div className="container mx-auto max-w-7xl px-6 lg:px-8">
            <FadeUp className="mx-auto mb-11 max-w-3xl text-center">
              <div className="mb-3 text-[10.5px] font-mono uppercase tracking-[0.18em] text-emerald-700">03 / Trust</div>
              <h2 id="trust-heading" className="heading-display text-3xl leading-tight text-zinc-950 md:text-[2.75rem]">
                Built for sensitive audio and production traffic.
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-zinc-600 md:text-base">
                Keep audio ephemeral while relying on a runtime already operating at billions of
                evaluations per year.
              </p>
            </FadeUp>

            <StaggerContainer className="grid gap-4 lg:grid-cols-2">
              {[
                {
                  icon: ShieldCheck,
                  label: 'Zero-retention streaming',
                  title: 'Audio in. Assessment JSON out.',
                  body: 'Audio is scored in memory, never used for training, and not stockpiled by the scoring runtime.',
                  stat: 'TTL 0s',
                  art: '/runtime/privacy-v2.jpg',
                  alt: 'Stateless speech assessment streaming and zero audio retention',
                  tone: 'text-emerald-800 bg-emerald-500/10',
                },
                {
                  icon: Activity,
                  label: 'Production scale',
                  title: 'A runtime built for peak traffic.',
                  body: '9.2B+ evaluations per year, p50 latency of 240 ms, and a 99.95% uptime SLA on the enterprise tier.',
                  stat: '9.2B+ / year',
                  art: '/runtime/scale-v2.jpg',
                  alt: 'Global speech assessment API status and latency',
                  tone: 'text-sky-800 bg-sky-500/10',
                },
              ].map((item) => (
                <StaggerItem key={item.title}>
                  <div className="group h-full overflow-hidden rounded-[1.6rem] border border-zinc-900/[0.08] bg-white/70 backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-zinc-900/[0.14]">
                    <div className="relative aspect-[16/8] overflow-hidden bg-[#f5f1e8]">
                      <Image src={item.art} alt={item.alt} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.02]" />
                    </div>
                    <div className="p-6 md:p-7">
                      <div className="flex items-center justify-between gap-4">
                        <span className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.15em] text-zinc-500"><item.icon className="h-4 w-4" />{item.label}</span>
                        <span className={`rounded-full px-3 py-1 text-[10px] font-mono ${item.tone}`}>{item.stat}</span>
                      </div>
                      <h3 className="mt-5 text-xl font-semibold tracking-[-0.025em] text-zinc-950">{item.title}</h3>
                      <p className="mt-2 max-w-xl text-[13px] leading-6 text-zinc-600">{item.body}</p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        <section className="relative border-y border-zinc-900/[0.07] bg-white/35 py-20" aria-labelledby="faq-heading">
          <div className="container mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20 lg:px-8">
            <FadeUp>
              <div className="mb-3 text-[10.5px] font-mono uppercase tracking-[0.18em] text-emerald-700">Runtime &amp; operations FAQ</div>
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
