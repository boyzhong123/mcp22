import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';
import { AmbientBackdrop, ContactSection, SiteFooter, TopNav } from '@/app/global/_chrome';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Blog – Voice AI & Pronunciation Assessment | Chivox AI',
  description:
    'Insights on speech assessment, pronunciation scoring, voice AI and MCP server integration, plus speech recognition and language-learning technology trends.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'Blog – Voice AI & Pronunciation Assessment | Chivox AI',
    description:
      'Speech assessment, pronunciation scoring, voice AI and MCP server integration insights.',
    url: absoluteUrl('/blog'),
    type: 'website',
  },
};

const RESOURCES = [
  {
    href: '/reasoning',
    eyebrow: 'Understand the payload',
    title: 'How structured speech evidence grounds an LLM',
    body: 'Follow pronunciation, fluency, and audio-quality fields from assessment response to learner-facing explanation.',
    stage: 'Architecture',
    art: '/blog-guides/reasoning.jpg',
    artAlt: 'Speech performance score card with accuracy and fluency meters',
    featured: true,
  },
  {
    href: '/runtime',
    eyebrow: 'Prepare for launch',
    title: 'The day-two work behind a reliable speech tool',
    body: 'Plan keys, limits, observability, privacy, and failure handling before production traffic arrives.',
    stage: 'Operations',
    art: '/blog-guides/runtime.jpg',
    artAlt: 'API keys and spend controls in a clean dashboard panel',
    featured: true,
  },
  {
    href: '/products/mandarin-chinese-assessment',
    eyebrow: 'Design better feedback',
    title: 'Why tone-level evidence changes the coaching loop',
    body: 'See how tone and Pinyin detail help a tutor move from a generic score to a focused retry.',
    stage: 'Mandarin',
    art: '/products/mandarin/depth.jpg',
    artAlt: 'Mandarin tone and Pinyin assessment detail',
  },
  {
    href: '/solutions/ai-language-tutor',
    eyebrow: 'Build the experience',
    title: 'Turn assessment evidence into an AI tutor loop',
    body: 'Connect structured scoring, grounded explanations, and targeted retries into one learner experience.',
    stage: 'Product pattern',
    art: '/solutions/ai-tutor/tutor-loop.jpg',
    artAlt: 'AI tutor coaching loop with pronunciation feedback',
  },
  {
    href: '/solutions/function-calling',
    eyebrow: 'Choose the interface',
    title: 'Use typed speech tools inside an agent workflow',
    body: 'Understand where function calling fits when your agent needs predictable inputs and inspectable outputs.',
    stage: 'Integration',
    art: '/solutions/function-calling/contract.jpg',
    artAlt: 'Typed function-calling contract for speech assessment',
  },
  {
    href: '/faq',
    eyebrow: 'Resolve a blocker',
    title: 'Get quick answers before you start building',
    body: 'Check language coverage, client compatibility, streaming, accuracy, and commercial questions.',
    stage: 'FAQ',
    art: '/blog-guides/faq.jpg',
    artAlt: 'FAQ accordion with language coverage answers',
  },
] as const;

export default function BlogPage() {
  const featured = RESOURCES.filter((r) => 'featured' in r && r.featured);
  const rest = RESOURCES.filter((r) => !('featured' in r && r.featured));

  return (
    <div translate="no" lang="en" className="min-h-screen bg-background text-foreground">
      <AmbientBackdrop />
      <TopNav />
      <main>
        <section className="border-b border-[#e9e2d2]/70">
          <div className="container mx-auto max-w-6xl px-6 pb-14 pt-16 md:pb-16 md:pt-20">
            <div className="max-w-3xl">
              <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-emerald-700">
                /guides-and-insights
              </div>
              <h1 className="mt-4 text-crisp text-[40px] font-black leading-[1.05] tracking-[-0.04em] text-zinc-900 sm:text-[52px]">
                Find the next answer for your speech product.
              </h1>
              <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-muted-foreground">
                Payload design, AI tutor feedback, integration choices, and production ops — start
                with the question closest to your work.
              </p>
            </div>
          </div>
        </section>

        <section className="py-14 md:py-16" aria-labelledby="resource-library-heading">
          <div className="container mx-auto max-w-6xl px-6">
            <div className="mb-7 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-emerald-700">
                  /choose-by-question
                </div>
                <h2
                  id="resource-library-heading"
                  className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-zinc-900"
                >
                  Six practical starting points.
                </h2>
              </div>
              <p className="max-w-sm text-[13px] leading-relaxed text-muted-foreground">
                Each guide opens an existing deep dive — orientation to implementation, no dead ends.
              </p>
            </div>

            {/* Featured pair — larger visual */}
            <div className="grid gap-4 md:grid-cols-2">
              {featured.map((item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-900/[0.08] bg-white/75 transition-all duration-300 hover:-translate-y-[2px] hover:border-emerald-500/20 hover:shadow-[0_18px_40px_-28px_rgba(16,52,33,0.4)]"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#eef5ef]">
                    <Image
                      src={item.art}
                      alt={item.artAlt}
                      fill
                      quality={88}
                      className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority={index === 0}
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-5 md:p-6">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-emerald-700">
                        /{item.eyebrow}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">0{index + 1}</span>
                    </div>
                    <h3 className="mt-2 text-[19px] font-semibold leading-snug tracking-[-0.02em] text-zinc-900">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                      {item.body}
                    </p>
                    <div className="mt-4 flex items-center justify-between border-t border-zinc-900/[0.06] pt-3">
                      <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-500">
                        {item.stage}
                      </span>
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-800 group-hover:text-emerald-900">
                        Open guide
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Remaining four */}
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {rest.map((item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-900/[0.08] bg-white/75 transition-all duration-300 hover:-translate-y-[2px] hover:border-emerald-500/20 hover:shadow-[0_16px_36px_-28px_rgba(16,52,33,0.35)]"
                >
                  <div className="relative aspect-[5/3.2] w-full overflow-hidden bg-[#f5f1e8]">
                    <Image
                      src={item.art}
                      alt={item.artAlt}
                      fill
                      quality={85}
                      className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9.5px] font-mono uppercase tracking-[0.14em] text-emerald-700">
                        /{item.eyebrow}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">0{index + 3}</span>
                    </div>
                    <h3 className="mt-1.5 text-[15px] font-semibold leading-snug tracking-[-0.015em] text-zinc-900">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
                      {item.body}
                    </p>
                    <div className="mt-3 flex items-center justify-between border-t border-zinc-900/[0.06] pt-2.5">
                      <span className="text-[9.5px] font-mono uppercase tracking-[0.12em] text-zinc-500">
                        {item.stage}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-emerald-800">
                        Open
                        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="warm-card mt-10 flex flex-col items-start justify-between gap-5 p-6 md:flex-row md:items-center md:p-8">
              <div>
                <BookOpen className="h-5 w-5 text-emerald-700" aria-hidden />
                <h2 className="mt-3 text-[22px] font-semibold tracking-[-0.025em] text-zinc-900">
                  Ready for implementation details?
                </h2>
                <p className="mt-1.5 max-w-xl text-[13.5px] leading-relaxed text-muted-foreground">
                  Quickstarts, response fields, endpoints, limits, and integration recipes.
                </p>
              </div>
              <Link
                href="/docs"
                className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-zinc-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
              >
                Open docs <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <ContactSection />
      <SiteFooter />
    </div>
  );
}
