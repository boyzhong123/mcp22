import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BellRing, Check, Gauge, Sparkles, WalletCards } from 'lucide-react';
import { AmbientBackdrop, ContactSection, SiteFooter, TopNav } from '@/app/global/_chrome';
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
  openGraph: { title: 'Pricing – Speech MCP & Pronunciation Assessment | Chivox AI', description: `Transparent speech MCP and pronunciation assessment pricing, with ${TRIAL_CALLS} free evaluation points and flexible top-ups.`, url: absoluteUrl('/pricing'), type: 'website' },
};

const PACK_COPY: Record<(typeof FIXED_TOPUP_PLANS)[number]['id'], { label: string; blurb: string }> = {
  standard: { label: 'Standard', blurb: 'For prototypes and first integrations.' },
  advanced: { label: 'Advanced', blurb: 'For products moving into steady usage.' },
  flagship: { label: 'Flagship', blurb: 'For high-volume production workloads.' },
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
    answer: `One successful scoring call. A word or sentence evaluation deducts ${WORD_SENTENCE_POINTS_PER_USE} point, a paragraph evaluation deducts ${PARAGRAPH_POINTS_PER_USE} points. Failed or errored calls deduct nothing.`,
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
    answer: 'Talk to us about enterprise terms: volume pricing, procurement and invoicing, SLAs, deployment and security review, and pilot support with your own audio.',
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

export default function PricingPage() {
  return (
    <div translate="no" lang="en" className="min-h-screen bg-background text-foreground">
      <AmbientBackdrop /><TopNav />
      <main>
        <section className="border-b border-[#e9e2d2]/70">
          <div className="container mx-auto max-w-5xl px-6 pb-16 pt-16 text-center md:pb-20 md:pt-24">
            <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-emerald-700">/pricing</div>
            <h1 className="mx-auto mt-4 max-w-4xl text-crisp text-[44px] font-black leading-[1.02] tracking-[-0.04em] text-zinc-900 sm:text-[58px]">Pricing that follows real speech usage.</h1>
            <p className="mx-auto mt-7 max-w-2xl text-[17px] leading-relaxed text-muted-foreground">
              Start with {TRIAL_CALLS} free evaluation points — no card required. Pay only for successful
              evaluations, and top up with published unit prices when you need more.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link href="/register" className="inline-flex h-11 items-center gap-2 rounded-full bg-zinc-900 px-5 text-sm font-semibold text-white">Start free <ArrowRight className="h-4 w-4" /></Link>
              <a href="mailto:ming.zhao@chivox.com?subject=Chivox%20MCP%20pricing" className="inline-flex h-11 items-center rounded-full border border-emerald-500/35 bg-white/70 px-5 text-sm font-semibold text-emerald-800">Discuss enterprise pricing</a>
            </div>
          </div>
        </section>

        <section className="border-b border-[#e9e2d2]/70 py-16 md:py-20">
          <div className="container mx-auto max-w-6xl px-6">
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              <article className="flex flex-col rounded-2xl border border-zinc-900/[0.08] bg-white/72 p-7">
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
                  <li className="flex gap-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" strokeWidth={3} />{TRIAL_CALLS} evaluation points</li>
                  <li className="flex gap-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" strokeWidth={3} />Valid {TRIAL_VALID_DAYS} days</li>
                  <li className="flex gap-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" strokeWidth={3} />Full engine, full payload</li>
                </ul>
                <Link href="/register" className="mt-6 inline-flex h-10 items-center justify-center gap-2 self-start rounded-full bg-zinc-900 px-4 text-[13px] font-semibold text-white transition-colors hover:bg-zinc-800">
                  Start free <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </article>

              {FIXED_TOPUP_PLANS.map((plan) => {
                const copy = PACK_COPY[plan.id];
                const rates = EVALUATION_UNIT_PRICES[plan.id];
                const recommended = Boolean(plan.recommended);
                return (
                  <article
                    key={plan.id}
                    className={`relative flex flex-col rounded-2xl border p-7 ${recommended ? 'border-emerald-600/40 bg-white shadow-[0_24px_60px_-38px_rgba(16,52,33,0.5)]' : 'border-zinc-900/[0.08] bg-white/72'}`}
                  >
                    {recommended && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-700 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white">Recommended</span>
                    )}
                    <h2 className={`text-[16px] font-semibold ${recommended ? 'text-emerald-700' : 'text-zinc-900'}`}>{copy.label}</h2>
                    <div className="mt-3 flex flex-wrap items-baseline gap-2">
                      <span className="text-[11px] text-muted-foreground">from</span>
                      <span className="text-crisp text-[34px] font-bold tracking-[-0.035em] text-zinc-900">{formatPackagePrice(plan.amountCents)}</span>
                      {plan.bonusPct > 0 && (
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/[0.08] px-2 py-0.5 text-[9px] font-semibold text-emerald-800">+{plan.bonusPct}% bonus</span>
                      )}
                    </div>
                    <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">{copy.blurb}</p>
                    <ul className="mt-5 space-y-2 text-[12.5px] text-foreground/80">
                      <li className="flex gap-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" strokeWidth={3} />{formatEvaluationUnitDollars(rates.wordSentenceDollars)} / word or sentence</li>
                      <li className="flex gap-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" strokeWidth={3} />{formatEvaluationUnitDollars(rates.paragraphDollars)} / paragraph</li>
                    </ul>
                  </article>
                );
              })}
            </div>

            <div className="mt-8 grid gap-4 rounded-2xl border border-zinc-900/[0.08] bg-white/60 p-6 sm:grid-cols-3 md:p-7">
              {[
                { title: `${WORD_SENTENCE_POINTS_PER_USE} point / word or sentence`, body: 'Deducted only when the evaluation succeeds.' },
                { title: `${PARAGRAPH_POINTS_PER_USE} points / paragraph`, body: 'Longer reading and speaking tasks cost two points.' },
                { title: '0 points / failed call', body: 'Errors and rejected audio never touch your balance.' },
              ].map((item) => (
                <div key={item.title}>
                  <div className="text-[14px] font-semibold tracking-[-0.01em] text-zinc-900">{item.title}</div>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{item.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500">Included on every plan — free tier and packs alike</div>
              <ul className="mt-4 grid gap-x-8 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {INCLUDED_EVERYWHERE.map((item) => (
                  <li key={item} className="flex gap-2.5 text-[13.5px] text-foreground/85">
                    <Check className="mt-[3px] h-3.5 w-3.5 shrink-0 text-emerald-600" strokeWidth={3} />{item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-20">
          <div className="container mx-auto max-w-6xl px-6">
            <div className="grid gap-5 md:grid-cols-3">
              {[
                { icon: WalletCards, title: 'Evaluate before committing', body: 'Use the free points to test representative audio, languages, devices and agent behavior before choosing a pack.' },
                { icon: Gauge, title: 'Usage-aware scaling', body: 'Bigger packs lower the published unit price — only price and bonus change, never the engine or payload.' },
                { icon: BellRing, title: 'Controls around spend', body: 'Spend caps, low-balance alerts and account-level visibility keep experiments from becoming surprises.' },
              ].map(({ icon: Icon, title, body }) => (
                <article key={title} className="rounded-2xl border border-zinc-900/[0.08] bg-white/72 p-7">
                  <Icon className="h-6 w-6 text-emerald-700" /><h2 className="mt-5 text-[22px] font-semibold tracking-[-0.02em] text-zinc-900">{title}</h2><p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">{body}</p>
                </article>
              ))}
            </div>

            <div className="warm-card mt-10 grid gap-8 p-7 md:grid-cols-2 md:p-10">
              <div><div className="text-[11px] font-mono uppercase tracking-[0.2em] text-emerald-700">/enterprise</div><h2 className="mt-3 heading-display text-3xl tracking-[-0.02em]">When the plan needs to fit the architecture.</h2><p className="mt-4 text-[14px] leading-relaxed text-muted-foreground">Talk with the Chivox team about higher volume, procurement, SLAs, private deployment requirements and evaluation support.</p></div>
              <ul className="space-y-3">
                {['Volume and contract options', 'Deployment and security review', 'Pilot support with your own audio', 'Language, accent and product-fit discussion'].map((item) => <li key={item} className="flex gap-3 text-[14px]"><Check className="mt-0.5 h-4 w-4 text-emerald-600" strokeWidth={3}/>{item}</li>)}
              </ul>
            </div>

            <div className="mx-auto mt-16 max-w-3xl">
              <div className="text-center">
                <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-emerald-700">/questions</div>
                <h2 className="mt-3 heading-display text-3xl tracking-[-0.025em]">Pricing questions</h2>
              </div>
              <div className="mt-8 space-y-4">
                {PRICING_FAQ.map((item) => (
                  <article key={item.question} className="rounded-2xl border border-zinc-900/[0.08] bg-white/68 p-6">
                    <h3 className="text-[16px] font-semibold text-zinc-900">{item.question}</h3>
                    <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{item.answer}</p>
                  </article>
                ))}
              </div>
            </div>

            <p className="mt-10 text-center text-[12px] text-muted-foreground">Published prices are shown in USD. Your billing console always reflects the current account-level rates and entitlements.</p>
          </div>
        </section>
      </main>
      <ContactSection /><SiteFooter />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
    </div>
  );
}
