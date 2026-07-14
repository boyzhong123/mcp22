import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BellRing, Check, Gauge, Sparkles, WalletCards } from 'lucide-react';
import { AmbientBackdrop, ContactSection, OpenContactButton, SiteFooter, TopNav } from '@/app/global/_chrome';
import { ComparePlansModal, type CompareColumn, type CompareRow } from './_components/compare-plans-modal';
import {
  EVALUATION_UNIT_PRICES,
  FIXED_TOPUP_PLANS,
  PARAGRAPH_POINTS_PER_USE,
  TRIAL_CALLS,
  TRIAL_VALID_DAYS,
  WORD_SENTENCE_POINTS_PER_USE,
  formatEvaluationUnitDollars,
} from '@/app/dev-en/_lib/topup';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Pricing – Speech MCP & Pronunciation Assessment | Chivox AI',
  description:
    `Transparent pricing for Chivox speech MCP, speech scoring and pronunciation assessment. Start with ${TRIAL_CALLS} free evaluation points, then top up from $19.90.`,
  alternates: { canonical: '/pricing' },
  openGraph: {
    title: 'Pricing – Speech MCP & Pronunciation Assessment | Chivox AI',
    description: `Transparent speech MCP and pronunciation assessment pricing, with ${TRIAL_CALLS} free evaluation points and flexible top-ups.`,
    url: absoluteUrl('/pricing'),
    type: 'website',
  },
};

const PACK_COPY: Record<(typeof FIXED_TOPUP_PLANS)[number]['id'], { label: string; blurb: string }> = {
  standard: { label: 'Standard', blurb: 'For prototypes and first integrations.' },
  advanced: { label: 'Advanced', blurb: 'For products moving into steady usage.' },
  flagship: { label: 'Flagship', blurb: 'For high-volume production workloads.' },
};

const PACK_SURFACE: Record<(typeof FIXED_TOPUP_PLANS)[number]['id'], string> = {
  standard: 'border-zinc-900/[0.08] bg-gradient-to-b from-white/90 to-white/70',
  advanced:
    'border-emerald-600/45 bg-gradient-to-b from-emerald-50/95 via-white to-white shadow-[0_28px_70px_-36px_rgba(16,52,33,0.55)] lg:-translate-y-1',
  flagship: 'border-amber-700/20 bg-gradient-to-b from-amber-50/80 via-white/90 to-white/70',
};

/** Shared product surface — identical on the free tier and every pack. */
const INCLUDED_EVERYWHERE = [
  'Exam-grade Mandarin & English scoring',
  'Phoneme-level diagnosis',
  'Pronunciation correction feedback',
  'Word · sentence · paragraph granularity',
  'Real-time streaming',
  'LLM-ready MCP JSON',
] as const;

const PRICING_FAQ = [
  {
    question: 'What counts as one evaluation?',
    answer: `One successful scoring call. A word, phrase or sentence evaluation deducts ${WORD_SENTENCE_POINTS_PER_USE} point, a paragraph evaluation deducts ${PARAGRAPH_POINTS_PER_USE} points. Failed or errored calls deduct nothing.`,
  },
  {
    question: 'Do points expire?',
    answer: `Points stay valid for ${TRIAL_VALID_DAYS} days from the date they land. When you top up again, the earliest-expiring batch is spent first.`,
  },
  {
    question: 'Is there a free tier?',
    answer: `Every new account starts with ${TRIAL_CALLS} evaluation points, valid for ${TRIAL_VALID_DAYS} days — no card required. The free points run against the exact same engine and payload as paid usage.`,
  },
  {
    question: 'What if my volume is bigger than the packs?',
    answer:
      'Talk to us about enterprise terms: volume pricing, procurement and invoicing, SLAs, deployment and security review, and pilot support with your own audio.',
  },
] as const;

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: PRICING_FAQ.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: { '@type': 'Answer', text: item.answer },
  })),
};

function formatPackagePrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

/** Columns for the "compare all plans" modal table. */
const COMPARE_COLUMNS: CompareColumn[] = [
  { id: 'free', label: 'Free', price: '$0', accent: false },
  ...FIXED_TOPUP_PLANS.map((plan) => ({
    id: plan.id,
    label: PACK_COPY[plan.id].label,
    price: `from ${formatPackagePrice(plan.amountCents)}`,
    accent: Boolean(plan.recommended),
  })),
];

/** One row per compared attribute; `values` is aligned to COMPARE_COLUMNS. */
const COMPARE_ROWS: CompareRow[] = [
  { label: 'Starting price', values: COMPARE_COLUMNS.map((c) => c.price) },
  {
    label: 'Purchase bonus',
    values: ['—', ...FIXED_TOPUP_PLANS.map((p) => (p.bonusPct > 0 ? `+${p.bonusPct}%` : '—'))],
  },
  {
    label: 'Per word, phrase or sentence',
    values: [
      `${TRIAL_CALLS} free points`,
      ...FIXED_TOPUP_PLANS.map((p) => `${formatEvaluationUnitDollars(EVALUATION_UNIT_PRICES[p.id].wordSentenceDollars)}`),
    ],
  },
  {
    label: 'Per paragraph',
    values: [
      'Included',
      ...FIXED_TOPUP_PLANS.map((p) => `${formatEvaluationUnitDollars(EVALUATION_UNIT_PRICES[p.id].paragraphDollars)}`),
    ],
  },
  {
    label: 'Point validity',
    values: COMPARE_COLUMNS.map(() => `${TRIAL_VALID_DAYS} days`),
  },
  ...INCLUDED_EVERYWHERE.map((feature) => ({
    label: feature,
    values: COMPARE_COLUMNS.map(() => true),
  })),
];

export default function PricingPage() {
  return (
    <div translate="no" lang="en" className="relative min-h-screen text-foreground">
      <AmbientBackdrop />
      <TopNav />
      <main>
        {/* Hero + plans share one atmosphere so the first fold reads as a pricing composition. */}
        <section className="relative overflow-x-clip">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -top-36 left-1/2 h-[520px] w-[920px] -translate-x-1/2 rounded-full bg-gradient-to-b from-emerald-300/35 via-emerald-200/15 to-transparent blur-3xl" />
            <div className="absolute top-24 -left-24 h-[420px] w-[420px] rounded-full bg-amber-200/35 blur-3xl" />
            <div className="absolute top-10 -right-20 h-[380px] w-[380px] rounded-full bg-rose-200/30 blur-3xl" />
            <div className="absolute bottom-0 left-1/2 h-[280px] w-[700px] -translate-x-1/2 rounded-full bg-sky-200/20 blur-3xl" />
            <div
              className="absolute inset-0 opacity-[0.09]"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(16,52,33,0.45) 1px, transparent 1px), linear-gradient(90deg, rgba(16,52,33,0.45) 1px, transparent 1px)',
                backgroundSize: '44px 44px',
                maskImage: 'radial-gradient(ellipse 75% 65% at 50% 28%, black 35%, transparent 78%)',
                WebkitMaskImage: 'radial-gradient(ellipse 75% 65% at 50% 28%, black 35%, transparent 78%)',
              }}
            />
          </div>

          <div className="container mx-auto max-w-5xl px-6 pb-8 pt-12 text-center md:pb-10 md:pt-16">
            <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-emerald-700">/pricing</div>
            <h1 className="mx-auto mt-3 max-w-4xl text-crisp text-[40px] font-black leading-[1.02] tracking-[-0.04em] text-zinc-900 sm:text-[52px]">
              Pricing that follows real speech usage.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-[16px] leading-relaxed text-muted-foreground md:text-[17px]">
              Start with {TRIAL_CALLS} free evaluation points — no card required. Pay only for successful evaluations,
              and top up with published unit prices when you need more.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                href="/register"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-zinc-900 px-5 text-sm font-semibold text-white shadow-[0_12px_28px_-14px_rgba(24,24,27,0.65)] transition-transform hover:-translate-y-px"
              >
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
              <OpenContactButton className="inline-flex h-11 items-center rounded-full border border-emerald-500/40 bg-white/75 px-5 text-sm font-semibold text-emerald-800 backdrop-blur-sm">
                Discuss enterprise pricing
              </OpenContactButton>
            </div>
          </div>

          <div className="container mx-auto max-w-6xl px-6 pb-10 md:pb-12">
            <div className="grid gap-5 pt-3 md:grid-cols-2 lg:grid-cols-4 lg:items-stretch">
              <article className="group relative flex flex-col rounded-2xl border border-sky-500/25 bg-gradient-to-b from-sky-50/90 via-white/85 to-white/70 p-7 shadow-[0_18px_50px_-40px_rgba(14,165,233,0.55)] backdrop-blur-sm transition-transform duration-300 hover:-translate-y-1">
                <div aria-hidden className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-sky-400/80 via-sky-300/50 to-transparent" />
                <div className="flex items-center gap-2">
                  <h2 className="text-[16px] font-semibold text-sky-700">Free</h2>
                  <Sparkles className="h-4 w-4 text-sky-600" aria-hidden />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-crisp text-[34px] font-bold tracking-[-0.035em] text-zinc-900">$0</span>
                  <span className="text-[11px] text-muted-foreground">to start</span>
                </div>
                <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">Every new account. No card required.</p>
                <ul className="mt-5 space-y-2 text-[12.5px] text-foreground/80">
                  <li className="flex gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" strokeWidth={3} />
                    {TRIAL_CALLS} evaluation points
                  </li>
                  <li className="flex gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" strokeWidth={3} />
                    Valid {TRIAL_VALID_DAYS} days
                  </li>
                  <li className="flex gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" strokeWidth={3} />
                    Full engine, full payload
                  </li>
                </ul>
                <div className="mt-auto pt-6">
                  <Link
                    href="/register"
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-zinc-900 px-4 text-[13px] font-semibold text-white transition-colors hover:bg-zinc-800"
                  >
                    Start free <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>

              {FIXED_TOPUP_PLANS.map((plan) => {
                const copy = PACK_COPY[plan.id];
                const rates = EVALUATION_UNIT_PRICES[plan.id];
                const recommended = Boolean(plan.recommended);
                const accentBar =
                  plan.id === 'advanced'
                    ? 'from-emerald-500 via-emerald-400/80 to-transparent'
                    : plan.id === 'flagship'
                      ? 'from-amber-500/80 via-amber-300/50 to-transparent'
                      : 'from-zinc-400/50 via-zinc-300/30 to-transparent';
                return (
                  <article
                    key={plan.id}
                    className={`group relative flex flex-col rounded-2xl border p-7 backdrop-blur-sm transition-transform duration-300 hover:-translate-y-1 ${PACK_SURFACE[plan.id]}`}
                  >
                    <div aria-hidden className={`absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r ${accentBar}`} />
                    {recommended && (
                      <span className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-emerald-700 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white shadow-[0_8px_20px_-10px_rgba(6,78,59,0.8)]">
                        Recommended
                      </span>
                    )}
                    <h2 className={`text-[16px] font-semibold ${recommended ? 'text-emerald-700' : 'text-zinc-900'}`}>
                      {copy.label}
                    </h2>
                    <div className="mt-3 flex flex-wrap items-baseline gap-2">
                      <span className="text-[11px] text-muted-foreground">from</span>
                      <span className="text-crisp text-[34px] font-bold tracking-[-0.035em] text-zinc-900">
                        {formatPackagePrice(plan.amountCents)}
                      </span>
                      {plan.bonusPct > 0 && (
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/[0.1] px-2 py-0.5 text-[9px] font-semibold text-emerald-800">
                          +{plan.bonusPct}% bonus
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">{copy.blurb}</p>
                    <ul className="mt-5 space-y-2 text-[12.5px] text-foreground/80">
                      <li className="flex gap-2">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" strokeWidth={3} />
                        {formatEvaluationUnitDollars(rates.wordSentenceDollars)} / word, phrase or sentence
                      </li>
                      <li className="flex gap-2">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" strokeWidth={3} />
                        {formatEvaluationUnitDollars(rates.paragraphDollars)} / paragraph
                      </li>
                    </ul>
                    <div className="mt-auto pt-6">
                      <Link
                        href="/register"
                        className={`inline-flex h-10 w-full items-center justify-center gap-2 rounded-full px-4 text-[13px] font-semibold transition-colors ${
                          recommended
                            ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                            : 'border border-zinc-900/10 bg-white/80 text-zinc-900 hover:bg-white'
                        }`}
                      >
                        Get started <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="warm-card mt-8 grid gap-5 p-6 sm:grid-cols-3 md:gap-6 md:p-7">
              {[
                {
                  icon: Sparkles,
                  title: `${WORD_SENTENCE_POINTS_PER_USE} point / word, phrase or sentence`,
                  body: 'Deducted only when the evaluation succeeds.',
                },
                {
                  icon: Gauge,
                  title: `${PARAGRAPH_POINTS_PER_USE} points / paragraph`,
                  body: 'Longer reading and speaking tasks cost two points.',
                },
                {
                  icon: WalletCards,
                  title: '0 points / failed call',
                  body: 'Errors and rejected audio never touch your balance.',
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700">
                    <item.icon className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="text-[14px] font-semibold tracking-[-0.01em] text-zinc-900">{item.title}</div>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-zinc-900/[0.07] bg-white/55 p-6 backdrop-blur-sm md:p-7">
              <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-emerald-700/80">
                Included on every plan — free tier and packs alike
              </div>
              <ul className="mt-4 grid gap-x-8 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {INCLUDED_EVERYWHERE.map((item) => (
                  <li key={item} className="flex gap-2.5 text-[13.5px] text-foreground/85">
                    <Check className="mt-[3px] h-3.5 w-3.5 shrink-0 text-emerald-600" strokeWidth={3} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <ComparePlansModal columns={COMPARE_COLUMNS} rows={COMPARE_ROWS} />
          </div>
        </section>

        <section className="pb-16 pt-0 md:pb-20">
          <div className="container mx-auto max-w-6xl px-6">
            <div className="grid gap-5 md:grid-cols-3">
              {[
                {
                  icon: WalletCards,
                  title: 'Evaluate before committing',
                  body: 'Use the free points to test representative audio, languages, devices and agent behavior before choosing a pack.',
                },
                {
                  icon: Gauge,
                  title: 'Usage-aware scaling',
                  body: 'Bigger packs lower the published unit price — only price and bonus change, never the engine or payload.',
                },
                {
                  icon: BellRing,
                  title: 'Controls around spend',
                  body: 'Spend caps, low-balance alerts and account-level visibility keep experiments from becoming surprises.',
                },
              ].map(({ icon: Icon, title, body }) => (
                <article
                  key={title}
                  className="rounded-2xl border border-zinc-900/[0.08] bg-white/72 p-6 shadow-[0_18px_45px_-38px_rgba(15,23,42,0.35)] backdrop-blur-sm transition-transform duration-300 hover:-translate-y-1 md:p-7"
                >
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h2 className="mt-4 text-[20px] font-semibold tracking-[-0.02em] text-zinc-900 md:text-[21px]">{title}</h2>
                  <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">{body}</p>
                </article>
              ))}
            </div>

            <div className="warm-card mt-6 grid gap-7 p-7 md:grid-cols-[1.15fr_0.85fr] md:items-center md:p-9">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-emerald-700">/enterprise</div>
                <h2 className="mt-3 heading-display text-3xl tracking-[-0.02em]">
                  When the plan needs to fit the architecture.
                </h2>
                <p className="mt-4 text-[14px] leading-relaxed text-muted-foreground">
                  Talk with the Chivox team about higher volume, procurement, SLAs, private deployment requirements and
                  evaluation support.
                </p>
              </div>
              <ul className="space-y-3">
                {[
                  'Volume and contract options',
                  'Deployment and security review',
                  'Pilot support with your own audio',
                  'Language, accent and product-fit discussion',
                ].map((item) => (
                  <li key={item} className="flex gap-3 text-[14px]">
                    <Check className="mt-0.5 h-4 w-4 text-emerald-600" strokeWidth={3} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mx-auto mt-12 max-w-3xl md:mt-14">
              <div className="text-center">
                <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-emerald-700">/questions</div>
                <h2 className="mt-3 heading-display text-3xl tracking-[-0.025em]">Pricing questions</h2>
              </div>
              <div className="mt-8 space-y-4">
                {PRICING_FAQ.map((item) => (
                  <article
                    key={item.question}
                    className="rounded-2xl border border-zinc-900/[0.08] bg-white/68 p-6 backdrop-blur-sm"
                  >
                    <h3 className="text-[16px] font-semibold text-zinc-900">{item.question}</h3>
                    <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{item.answer}</p>
                  </article>
                ))}
              </div>
            </div>

            <p className="mt-10 text-center text-[12px] text-muted-foreground">
              Published prices are shown in USD. Your billing console always reflects the current account-level rates and
              entitlements.
            </p>
          </div>
        </section>
      </main>
      <ContactSection />
      <SiteFooter />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
    </div>
  );
}
