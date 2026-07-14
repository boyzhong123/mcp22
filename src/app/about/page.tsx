import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Check, FlaskConical, Globe2, Layers3 } from 'lucide-react';
import { CustomerTrustSection } from '@/app/_marketing/customer-trust';
import { AmbientBackdrop, ContactSection, SiteFooter, TopNav } from '@/app/global/_chrome';
import { absoluteUrl } from '@/lib/site';

const WORK_PILLARS = [
  {
    icon: FlaskConical,
    step: '01',
    eyebrow: 'Speech R&D',
    title: 'Model the speech signal, not just the transcript.',
    body:
      'Pronunciation, fluency, tone and audio-quality signals are developed as assessment capabilities rather than prompt-level guesses.',
    proof: '20 years of speech R&D',
  },
  {
    icon: Layers3,
    step: '02',
    eyebrow: 'Structured delivery',
    title: 'Return evidence applications can actually use.',
    body:
      'Stable response fields let teams combine deterministic product rules with model-generated explanations and learner feedback.',
    proof: 'API + MCP · stable JSON',
  },
  {
    icon: Globe2,
    step: '03',
    eyebrow: 'Global product fit',
    title: 'Keep one integration model across products and markets.',
    body:
      'The same foundation supports different learner groups, connectivity conditions, curricula and business models without flattening language detail.',
    proof: 'English + Mandarin',
  },
] as const;

export const metadata: Metadata = {
  title: 'About Chivox AI – Speech Assessment & Voice AI R&D',
  description:
    'Chivox AI is a voice AI company specializing in speech assessment, pronunciation scoring and speech recognition, backed by 20 years of language-learning technology R&D.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About Chivox AI – Speech Assessment & Voice AI R&D',
    description: 'Speech assessment, pronunciation scoring and speech recognition backed by 20 years of language-learning technology R&D.',
    url: absoluteUrl('/about'),
    type: 'website',
  },
};

export default function AboutPage() {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Chivox AI',
    url: absoluteUrl('/'),
    description: metadata.description,
    knowsAbout: ['speech assessment', 'pronunciation scoring', 'voice AI', 'language learning technology'],
  };

  return (
    <div translate="no" lang="en" className="min-h-screen bg-background text-foreground">
      <AmbientBackdrop />
      <TopNav />
      <main>
        <section className="border-b border-[#e9e2d2]/70">
          <div className="container mx-auto grid max-w-7xl gap-10 px-6 pb-14 pt-12 md:pb-16 md:pt-16 lg:grid-cols-12 lg:items-center lg:gap-16">
            <div className="min-w-0 lg:col-span-7">
              <div className="flex items-center gap-3 text-[11px] font-mono uppercase tracking-[0.22em] text-emerald-700">
                <span className="h-px w-8 bg-emerald-600/60" aria-hidden="true" />
                /about-chivox
              </div>
              <h1 className="mt-5 max-w-[720px] heading-display text-crisp text-[40px] leading-[0.98] tracking-[-0.045em] text-zinc-950 sm:text-[52px] lg:text-[60px] xl:text-[64px]">
                Speech science made useful in real products.
              </h1>
              <p className="mt-6 max-w-[660px] text-[16px] leading-[1.7] text-zinc-600 sm:text-[17px]">
                Chivox AI builds speech assessment and pronunciation-scoring technology for language-learning products, AI tutors and voice agents. Two decades of R&amp;D are exposed through APIs and MCP tools that product teams can integrate without rebuilding the speech stack.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/demo" className="group inline-flex h-12 items-center gap-2 rounded-full bg-zinc-900 px-6 text-sm font-semibold text-white shadow-sm transition-[transform,background-color,box-shadow] hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900">
                  Experience the assessment
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link href="/docs" className="inline-flex h-12 items-center rounded-full border border-emerald-500/35 bg-white/80 px-6 text-sm font-semibold text-emerald-800 transition-[background-color,border-color,transform] hover:-translate-y-0.5 hover:border-emerald-500/55 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">
                  Read developer docs
                </Link>
              </div>
            </div>
            <div className="min-w-0 lg:col-span-5">
              <div className="overflow-hidden rounded-[30px] border border-emerald-500/20 bg-white/85 p-2.5 shadow-[0_32px_90px_-48px_rgba(16,52,33,0.58)] backdrop-blur-sm">
                <figure className="relative aspect-[16/10] overflow-hidden rounded-[22px] bg-zinc-100">
                  <Image
                    src="/editorial/speech-research-team.webp"
                    alt="Speech scientist and software engineer reviewing pronunciation data together"
                    fill
                    priority
                    sizes="(max-width: 1024px) calc(100vw - 48px), 38vw"
                    className="object-cover"
                  />
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-zinc-950/85 via-zinc-950/35 to-transparent px-5 pb-5 pt-20 text-white sm:px-6 sm:pb-6">
                    <div className="text-[9.5px] font-mono uppercase tracking-[0.22em] text-white/70">Research × engineering</div>
                    <div className="mt-1.5 max-w-md text-[14px] font-semibold leading-snug sm:text-[15px]">Speech evidence designed to survive the jump from lab to product.</div>
                  </figcaption>
                </figure>
                <div className="px-3 pb-3 pt-5 sm:px-4 sm:pb-4">
                  <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground">What stays consistent</div>
                  <ul className="mt-3 grid gap-x-6 gap-y-0 sm:grid-cols-2">
                    {[
                      'Structured, inspectable speech evidence.',
                      'Product-owned thresholds and learner UX.',
                      'Language detail within one integration model.',
                      'One path from prototype to production.',
                    ].map((item) => (
                      <li key={item} className="flex min-h-14 gap-2.5 border-t border-zinc-900/[0.07] py-3 text-[12px] leading-[1.55] text-foreground/75">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50" aria-hidden="true">
                          <Check className="h-3.5 w-3.5 text-emerald-700" strokeWidth={3} />
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="warm-card-bleed border-b border-[#e9e2d2]/70 py-14 md:py-20" aria-labelledby="how-we-work-heading">
          <div className="container mx-auto max-w-7xl px-6">
            <div className="grid gap-5 lg:grid-cols-12 lg:items-end lg:gap-12">
              <div className="lg:col-span-7">
                <div className="flex items-center gap-3 text-[10.5px] font-mono uppercase tracking-[0.22em] text-emerald-700">
                  <span className="h-px w-8 bg-emerald-600/60" aria-hidden="true" />
                  /how-we-work
                </div>
                <h2 id="how-we-work-heading" className="mt-4 max-w-3xl heading-display text-3xl leading-[1.05] tracking-[-0.035em] text-zinc-950 md:text-[46px]">
                  Speech science underneath. Stable evidence at the API.
                </h2>
              </div>
              <p className="max-w-xl text-[14px] leading-7 text-zinc-600 md:text-[15px] lg:col-span-5 lg:pb-1">
                Chivox turns deep speech research into production-ready pronunciation scoring:
                detailed enough for diagnosis, structured enough for product logic, and consistent
                enough to operate across languages and markets.
              </p>
            </div>

            <div className="mt-9 grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
              <figure className="group relative min-h-[390px] overflow-hidden rounded-[28px] border border-zinc-900/10 bg-zinc-950 shadow-[0_30px_70px_-42px_rgba(15,23,42,0.55)] lg:min-h-full">
                <Image
                  src="/editorial/speech-assessment-data-dark.webp"
                  alt="Structured pronunciation and speech assessment data reviewed in a product workflow"
                  fill
                  quality={90}
                  sizes="(max-width: 1024px) calc(100vw - 48px), 45vw"
                  className="object-cover opacity-75 transition-transform duration-700 group-hover:scale-[1.02]"
                />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-zinc-950/5" />
                <figcaption className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
                  <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-300">
                    From signal to product decision
                  </div>
                  <p className="mt-3 max-w-lg text-[22px] font-semibold leading-[1.25] tracking-[-0.025em] sm:text-[28px]">
                    A score is useful. Inspectable evidence is what makes the next product decision possible.
                  </p>
                  <div className="mt-6 grid grid-cols-3 divide-x divide-white/15 border-t border-white/15 pt-5">
                    {[
                      ['20 years', 'speech R&D'],
                      ['9.2B+', 'evaluations / year'],
                      ['API + MCP', 'one delivery model'],
                    ].map(([value, label], index) => (
                      <div key={label} className={index ? 'pl-4 sm:pl-5' : ''}>
                        <div className="text-[15px] font-semibold tabular-nums sm:text-[17px]">{value}</div>
                        <div className="mt-1 text-[8.5px] uppercase tracking-[0.13em] text-white/55 sm:text-[9.5px]">{label}</div>
                      </div>
                    ))}
                  </div>
                </figcaption>
              </figure>

              <ol className="overflow-hidden rounded-[28px] border border-zinc-900/[0.08] bg-white/78 shadow-[0_24px_60px_-46px_rgba(15,23,42,0.5)] backdrop-blur-sm divide-y divide-zinc-900/[0.07]">
                {WORK_PILLARS.map(({ icon: Icon, step, eyebrow, title, body, proof }) => (
                  <li key={step} className="group grid gap-4 p-6 transition-colors hover:bg-white/85 sm:grid-cols-[48px_1fr] sm:gap-5 md:p-7">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-600/15 bg-emerald-500/[0.07] text-emerald-700 transition-transform duration-300 group-hover:-translate-y-0.5">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[10px] font-mono uppercase tracking-[0.17em] text-emerald-700">{eyebrow}</span>
                        <span className="text-[10px] font-mono text-zinc-400" aria-hidden="true">{step}</span>
                      </div>
                      <h3 className="mt-2 text-[18px] font-semibold leading-snug tracking-[-0.02em] text-zinc-950 md:text-[20px]">{title}</h3>
                      <p className="mt-2 text-[13px] leading-6 text-zinc-600 md:text-[13.5px]">{body}</p>
                      <div className="mt-3 inline-flex rounded-full border border-zinc-900/[0.07] bg-zinc-50/80 px-2.5 py-1 text-[9.5px] font-mono text-zinc-600">{proof}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-7 flex flex-col gap-3 border-t border-zinc-900/[0.07] pt-5 text-[12.5px] text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
              <span>See how structured speech evidence becomes product-ready reasoning.</span>
              <Link href="/reasoning" className="group inline-flex items-center gap-1.5 font-semibold text-emerald-800 hover:text-emerald-900">
                Explore the reasoning engine
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </section>

        <CustomerTrustSection />
      </main>
      <ContactSection />
      <SiteFooter />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
    </div>
  );
}
