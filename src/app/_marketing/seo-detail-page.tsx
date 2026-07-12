import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Check, Code2, MessageSquareText, ShieldCheck, Sparkles } from 'lucide-react';
import { AmbientBackdrop, ContactSection, SiteFooter, TopNav } from '@/app/global/_chrome';
import { DEFAULT_MARKETING_PAYLOAD, type MarketingPageData } from './seo-content';

const SECTION_ICONS = [Sparkles, MessageSquareText, ShieldCheck] as const;

/** Show-not-tell: the concrete request/response behind the page's claims. */
function PayloadSection({ payload }: { payload: NonNullable<MarketingPageData['payload']> }) {
  return (
    <section className="border-b border-[#e9e2d2]/70 py-20 md:py-24">
      <div className="container mx-auto grid max-w-6xl items-center gap-10 px-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-emerald-700">/show-not-tell</div>
          <h2 className="mt-3 heading-display text-3xl tracking-[-0.025em] md:text-[40px]">{payload.title}</h2>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">{payload.body}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/docs" className="inline-flex h-10 items-center gap-2 rounded-full bg-zinc-900 px-4 text-[13px] font-semibold text-white transition-colors hover:bg-zinc-800">
              Full response schema <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link href="/demo" className="inline-flex h-10 items-center gap-2 rounded-full border border-emerald-500/35 bg-white/70 px-4 text-[13px] font-semibold text-emerald-800 hover:bg-white">
              Run it live
            </Link>
          </div>
        </div>
        <div className="lg:col-span-7">
          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-[0_30px_80px_-42px_rgba(15,23,42,0.7)]">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-2.5">
              <span className="text-[11px] font-mono text-zinc-400">{payload.filename}</span>
              <span className="flex gap-1.5" aria-hidden>
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-600/80" />
              </span>
            </div>
            <pre className="overflow-x-auto px-5 py-5 text-[12.5px] leading-[1.7] text-emerald-100/90"><code>{payload.code}</code></pre>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SeoDetailPage({ page }: { page: MarketingPageData }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: page.title,
    description: page.description,
    provider: { '@type': 'Organization', name: 'Chivox AI' },
    areaServed: 'Worldwide',
    serviceType: page.eyebrow,
  };

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: '/' },
      { '@type': 'ListItem', position: 2, name: `${page.group}s`, item: page.path.split('/').slice(0, 2).join('/') },
      { '@type': 'ListItem', position: 3, name: page.eyebrow, item: page.path },
    ],
  };

  return (
    <div translate="no" lang="en" className="min-h-screen bg-background text-foreground">
      <AmbientBackdrop />
      <TopNav />
      <main>
        <section className="border-b border-[#e9e2d2]/70">
          <div className="container mx-auto max-w-6xl px-6 pb-20 pt-12 md:pb-24 md:pt-20">
            <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-2 text-[12px] text-muted-foreground">
              <Link href="/" className="hover:text-emerald-800">Home</Link>
              <span aria-hidden>/</span>
              <span>{page.group}s</span>
              <span aria-hidden>/</span>
              <span className="text-foreground/75">{page.eyebrow}</span>
            </nav>

            <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-7">
                <div className="mb-4 text-[11px] font-mono uppercase tracking-[0.22em] text-emerald-700">
                  /{page.slug}
                </div>
                <h1 className="text-crisp max-w-4xl text-[40px] font-black leading-[1.02] tracking-[-0.04em] text-zinc-900 sm:text-[52px] lg:text-[64px]">
                  {page.title}
                </h1>
                <p className="mt-7 max-w-3xl text-[17px] leading-relaxed text-muted-foreground md:text-[19px]">
                  {page.intro}
                </p>
                <div className="mt-9 flex flex-wrap gap-3">
                  <Link href="/demo" className="inline-flex h-11 items-center gap-2 rounded-full bg-zinc-900 px-5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5">
                    Try the live demo <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/docs" className="inline-flex h-11 items-center gap-2 rounded-full border border-emerald-500/35 bg-white/70 px-5 text-sm font-semibold text-emerald-800 hover:bg-white">
                    Read developer docs <Code2 className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="overflow-hidden rounded-[28px] border border-emerald-500/20 bg-white/75 p-2 shadow-[0_30px_80px_-42px_rgba(16,52,33,0.5),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-xl">
                  <figure className="relative aspect-[4/3] overflow-hidden rounded-[22px] bg-[#f4efe4]">
                    <Image
                      src="/editorial/speech-assessment-data-dark.webp"
                      alt="Speech waveform transformed into structured pronunciation data and an AI agent graph"
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 42vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-zinc-950/65 via-zinc-950/10 to-transparent px-5 pb-5 pt-16 text-white">
                      <div className="text-[9.5px] font-mono uppercase tracking-[0.2em] text-white/70">Speech → evidence → action</div>
                      <div className="mt-1 text-[14px] font-semibold">One assessment layer, structured for product logic and AI reasoning.</div>
                    </div>
                  </figure>
                  <div className="grid grid-cols-3 gap-2 p-2 pt-4">
                    {page.outcomes.map((outcome) => (
                      <div key={outcome.value} className="rounded-xl border border-zinc-900/[0.07] bg-[#fbfaf6] p-3">
                        <div className="text-[14px] font-bold tracking-[-0.02em] text-zinc-900 sm:text-[16px]">{outcome.value}</div>
                        <div className="mt-1 text-[10px] leading-snug text-muted-foreground">{outcome.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[#e9e2d2]/70 py-20 md:py-24">
          <div className="container mx-auto max-w-6xl px-6">
            <div className="grid gap-5 lg:grid-cols-3">
              {page.sections.map((section, index) => {
                const Icon = SECTION_ICONS[index % SECTION_ICONS.length];
                return (
                  <article key={section.title} className="group relative overflow-hidden rounded-2xl border border-zinc-900/[0.08] bg-white/72 p-6 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/20 hover:shadow-[0_28px_60px_-38px_rgba(16,52,33,0.45)] md:p-7">
                    <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/55 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="mt-5 text-[10px] font-mono uppercase tracking-[0.18em] text-emerald-700">/{section.eyebrow}</div>
                    <h2 className="mt-2 text-[23px] font-bold leading-tight tracking-[-0.025em] text-zinc-900">{section.title}</h2>
                    <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">{section.body}</p>
                    <ul className="mt-6 space-y-3">
                      {section.points.map((point) => (
                        <li key={point} className="flex gap-2.5 text-[13px] leading-relaxed text-foreground/85">
                          <Check className="mt-[3px] h-3.5 w-3.5 shrink-0 text-emerald-600" strokeWidth={3} />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <PayloadSection payload={page.payload ?? DEFAULT_MARKETING_PAYLOAD} />

        <section className="border-b border-[#e9e2d2]/70 py-20 md:py-24">
          <div className="container mx-auto max-w-6xl px-6">
            <div className="mx-auto max-w-3xl text-center">
              <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-emerald-700">/workflow</div>
              <h2 className="mt-3 heading-display text-3xl tracking-[-0.025em] md:text-[42px]">A clear path from speech to useful feedback</h2>
              <p className="mt-4 text-muted-foreground">The assessment stays grounded in speech evidence while your product controls the final experience.</p>
            </div>
            <ol className="mt-12 grid gap-4 md:grid-cols-4">
              {page.workflow.map((step, index) => (
                <li key={step} className="relative rounded-2xl border border-zinc-900/[0.08] bg-white/70 p-5">
                  <div className="text-[11px] font-mono text-emerald-700">0{index + 1}</div>
                  <div className="mt-6 text-[15px] font-semibold leading-snug text-zinc-900">{step}</div>
                  {index < page.workflow.length - 1 && <ArrowRight aria-hidden className="absolute -right-3 top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 text-emerald-600 md:block" />}
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="py-20 md:py-24">
          <div className="container mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-emerald-700">/questions</div>
              <h2 className="mt-3 heading-display text-3xl tracking-[-0.025em] md:text-[40px]">Common implementation questions</h2>
              <div className="mt-8 space-y-4">
                {page.faq.map((item) => (
                  <article key={item.question} className="rounded-2xl border border-zinc-900/[0.08] bg-white/68 p-6">
                    <h3 className="text-[16px] font-semibold text-zinc-900">{item.question}</h3>
                    <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{item.answer}</p>
                  </article>
                ))}
              </div>
            </div>
            <aside className="lg:col-span-5">
              <div className="warm-card p-6 md:p-7">
                <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground">Continue exploring</div>
                <div className="mt-5 space-y-3">
                  {page.related.map((item) => (
                    <Link key={item.href} href={item.href} className="group block rounded-xl border border-zinc-900/[0.08] bg-white/65 p-4 hover:border-emerald-500/30 hover:bg-white">
                      <div className="flex items-center justify-between gap-3 text-[14px] font-semibold text-zinc-900">
                        {item.label}<ArrowRight className="h-4 w-4 text-emerald-700 transition-transform group-hover:translate-x-1" />
                      </div>
                      <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{item.description}</p>
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>
      <ContactSection />
      <SiteFooter />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
    </div>
  );
}
