import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { AmbientBackdrop, BackToOverview, ContactSection, SiteFooter, TopNav } from '@/app/global/_chrome';
import { absoluteUrl } from '@/lib/site';
import { BLOG_POSTS } from './posts';

export const metadata: Metadata = {
  title: 'Blog – Voice AI & Pronunciation Assessment | Chivox AI',
  description:
    'Insights on speech assessment, pronunciation scoring, voice AI, agent workflows, and language-learning product design.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'Blog – Voice AI & Pronunciation Assessment | Chivox AI',
    description: 'Practical ideas for building speech-enabled products and voice agents.',
    url: absoluteUrl('/blog'),
    type: 'website',
  },
};

export default function BlogPage() {
  const [featured, ...articles] = BLOG_POSTS;

  return (
    <div translate="no" lang="en" className="min-h-screen bg-background text-foreground">
      <AmbientBackdrop />
      <TopNav />
      <BackToOverview current="Blog" />
      <main className="marketing-page">
        <section className="border-b border-[#e9e2d2]/70">
          <div className="container mx-auto max-w-6xl px-6 pb-12 pt-8 md:pb-14 md:pt-10">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div className="max-w-3xl">
                <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-emerald-700">
                  /blog
                </div>
                <h1 className="mt-4 text-crisp text-[42px] font-black leading-[1.02] tracking-[-0.045em] text-zinc-900 sm:text-[58px]">
                  Ideas for products that listen better.
                </h1>
                <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-muted-foreground md:hidden">
                  Practical notes on speech assessment, voice agents, learning design, and the work
                  behind reliable production integrations.
                </p>
              </div>
              <p className="hidden max-w-sm text-[14px] leading-relaxed text-muted-foreground md:block md:pb-1">
                Practical notes on speech assessment, voice agents, learning design, and the work
                behind reliable production integrations—from structured speech evidence to tutor
                loops and launch checklists.
              </p>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16" aria-labelledby="featured-article-heading">
          <div className="container mx-auto max-w-6xl px-6">
            <Link
              href={`/blog/${featured.slug}`}
              className="group grid overflow-hidden rounded-[1.75rem] border border-zinc-900/[0.08] bg-white/75 shadow-[0_24px_60px_-42px_rgba(16,52,33,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-500/25 md:grid-cols-[1.15fr_0.85fr]"
            >
              <div className="relative min-h-[290px] overflow-hidden bg-[#edf5ef] md:min-h-[430px]">
                <Image
                  src={featured.image}
                  alt={featured.imageAlt}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 58vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.025]"
                />
                <span className="absolute left-5 top-5 rounded-full border border-white/70 bg-white/85 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.16em] text-emerald-800 shadow-sm backdrop-blur-md">
                  Featured
                </span>
              </div>
              <div className="flex flex-col justify-center p-7 md:p-10">
                <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-emerald-700">
                  /{featured.category}
                </div>
                <h2
                  id="featured-article-heading"
                  className="mt-4 text-[28px] font-semibold leading-[1.12] tracking-[-0.035em] text-zinc-900 md:text-[36px]"
                >
                  {featured.title}
                </h2>
                <p className="mt-4 text-[14px] leading-relaxed text-muted-foreground">
                  {featured.excerpt}
                </p>
                <div className="mt-7 flex items-center justify-between border-t border-zinc-900/[0.07] pt-4">
                  <span className="text-[11px] text-zinc-500">{featured.date}</span>
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-emerald-800">
                    Read article
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </Link>

            <div className="mb-7 mt-14 flex items-end justify-between">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-emerald-700">
                  /latest
                </div>
                <h2 className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-zinc-900">
                  Latest articles
                </h2>
              </div>
              <span className="hidden text-[11px] font-mono uppercase tracking-[0.14em] text-zinc-400 sm:block">
                {BLOG_POSTS.length} stories
              </span>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <Link
                  key={article.slug}
                  href={`/blog/${article.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-900/[0.08] bg-white/75 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-500/20 hover:shadow-[0_18px_40px_-30px_rgba(16,52,33,0.4)]"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-[#f1f4ee]">
                    <Image
                      src={article.image}
                      alt={article.imageAlt}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="text-[9.5px] font-mono uppercase tracking-[0.15em] text-emerald-700">
                      /{article.category}
                    </div>
                    <h3 className="mt-3 text-[19px] font-semibold leading-snug tracking-[-0.025em] text-zinc-900">
                      {article.title}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-[12.5px] leading-relaxed text-muted-foreground">
                      {article.excerpt}
                    </p>
                    <div className="mt-auto flex items-center justify-between border-t border-zinc-900/[0.06] pt-4 text-[11px] text-zinc-500">
                      <span>{article.date}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-emerald-800 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

          </div>
        </section>
      </main>
      <ContactSection />
      <SiteFooter />
    </div>
  );
}
