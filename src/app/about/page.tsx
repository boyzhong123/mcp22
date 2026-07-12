import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Check, FlaskConical, Globe2, Layers3 } from 'lucide-react';
import { CustomerTrustSection } from '@/app/_marketing/customer-trust';
import { AmbientBackdrop, ContactSection, SiteFooter, TopNav } from '@/app/global/_chrome';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'About Chivox AI | Speech Assessment and Voice AI R&D',
  description:
    'Learn about Chivox AI, its speech assessment and pronunciation-scoring technology, and customer applications across language learning and voice AI.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About Chivox AI | Speech Assessment and Voice AI R&D',
    description: 'Speech assessment R&D translated into practical tools for language-learning and voice-AI products.',
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
          <div className="container mx-auto grid max-w-6xl gap-12 px-6 pb-20 pt-14 md:pb-24 md:pt-20 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-emerald-700">/about-chivox</div>
              <h1 className="mt-4 text-crisp text-[42px] font-black leading-[1.02] tracking-[-0.04em] text-zinc-900 sm:text-[56px] lg:text-[66px]">
                Speech science made useful in real products.
              </h1>
              <p className="mt-7 max-w-3xl text-[17px] leading-relaxed text-muted-foreground md:text-[19px]">
                Chivox AI builds speech assessment and pronunciation-scoring technology for language-learning products, AI tutors and voice agents. Two decades of R&amp;D are exposed through APIs and MCP tools that product teams can integrate without rebuilding the speech stack.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/demo" className="inline-flex h-11 items-center gap-2 rounded-full bg-zinc-900 px-5 text-sm font-semibold text-white hover:-translate-y-0.5 transition-transform">
                  Experience the assessment <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/docs" className="inline-flex h-11 items-center rounded-full border border-emerald-500/35 bg-white/70 px-5 text-sm font-semibold text-emerald-800 hover:bg-white">
                  Read developer docs
                </Link>
              </div>
            </div>
            <div className="lg:col-span-5">
              <div className="overflow-hidden rounded-[28px] border border-emerald-500/20 bg-white/80 p-2 shadow-[0_30px_80px_-42px_rgba(16,52,33,0.52)]">
                <figure className="relative aspect-[4/3] overflow-hidden rounded-[22px] bg-zinc-100">
                  <Image
                    src="/editorial/speech-research-team.webp"
                    alt="Speech scientist and software engineer reviewing pronunciation data together"
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 42vw"
                    className="object-cover"
                  />
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-zinc-950/80 via-zinc-950/30 to-transparent px-5 pb-5 pt-16 text-white">
                    <div className="text-[9.5px] font-mono uppercase tracking-[0.2em] text-white/70">Research × engineering</div>
                    <div className="mt-1 text-[14px] font-semibold">Speech evidence designed to survive the jump from lab to product.</div>
                  </figcaption>
                </figure>
                <div className="px-4 pb-4 pt-5">
                <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">What stays consistent</div>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  {[
                    'Speech evidence remains structured and inspectable.',
                    'Product teams keep control of thresholds and learner UX.',
                    'Language-specific detail is preserved inside a shared integration model.',
                    'MCP and API access fit both prototypes and production systems.',
                  ].map((item) => (
                    <li key={item} className="flex gap-2.5 text-[12px] leading-relaxed text-foreground/80">
                      <Check className="mt-[3px] h-4 w-4 shrink-0 text-emerald-600" strokeWidth={3} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[#e9e2d2]/70 py-20 md:py-24">
          <div className="container mx-auto max-w-6xl px-6">
            <div className="mx-auto max-w-3xl text-center">
              <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-emerald-700">/how-we-work</div>
              <h2 className="mt-3 heading-display text-3xl tracking-[-0.025em] md:text-[42px]">Depth in the engine. Clarity at the integration boundary.</h2>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {[
                { icon: FlaskConical, title: 'Speech R&D', body: 'Pronunciation, fluency, tone and audio-quality signals are developed as assessment capabilities rather than prompt tricks.' },
                { icon: Layers3, title: 'Structured delivery', body: 'Stable response fields let applications combine deterministic product rules with model-generated explanations.' },
                { icon: Globe2, title: 'Global product fit', body: 'The same foundation supports different learner groups, connectivity conditions, curricula and business models.' },
              ].map(({ icon: Icon, title, body }) => (
                <article key={title} className="rounded-2xl border border-zinc-900/[0.08] bg-white/72 p-6">
                  <Icon className="h-6 w-6 text-emerald-700" />
                  <h3 className="mt-5 text-[20px] font-semibold tracking-[-0.02em] text-zinc-900">{title}</h3>
                  <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">{body}</p>
                </article>
              ))}
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
