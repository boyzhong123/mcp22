import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Clock3 } from 'lucide-react';
import { notFound } from 'next/navigation';
import { BreadcrumbPill, SiteFooter, TopNav } from '@/app/global/_chrome';
import { absoluteUrl } from '@/lib/site';
import { BLOG_POSTS, getBlogPost, type BlogFigure } from '../posts';

export const dynamicParams = false;

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};

  return {
    title: `${post.title} | Chivox AI Blog`,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: absoluteUrl(`/blog/${post.slug}`),
      type: 'article',
      images: [{ url: absoluteUrl(post.image), alt: post.imageAlt }],
    },
  };
}

function ArticleFigure({ figure }: { figure: BlogFigure }) {
  return (
    <figure className="my-10 overflow-hidden rounded-[1.35rem] border border-zinc-900/[0.08] bg-[#eef4ee]">
      <div className="relative aspect-[16/10]">
        <Image
          src={figure.src}
          alt={figure.alt}
          fill
          sizes="(max-width: 768px) 100vw, 720px"
          className="object-cover"
        />
      </div>
      {figure.caption ? (
        <figcaption className="border-t border-zinc-900/[0.06] bg-white/70 px-5 py-3.5 text-[13px] leading-relaxed text-zinc-500">
          {figure.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

function headingId(heading: string) {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function readingMinutes(post: NonNullable<ReturnType<typeof getBlogPost>>) {
  const words = [post.title, post.excerpt, post.intro, ...post.sections.map((section) => section.body)]
    .join(' ')
    .trim()
    .split(/\s+/).length;
  return Math.max(4, Math.ceil(words / 180));
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const currentIndex = BLOG_POSTS.findIndex((item) => item.slug === post.slug);
  const nextPost = BLOG_POSTS[(currentIndex + 1) % BLOG_POSTS.length];
  const readTime = readingMinutes(post);

  return (
    <div
      translate="no"
      lang="en"
      className="blog-article-page min-h-screen bg-[radial-gradient(circle_at_8%_12%,#dcebe1_0,transparent_28%),radial-gradient(circle_at_92%_30%,#f4e7d1_0,transparent_30%),linear-gradient(135deg,#eaf2ec_0%,#f6efe2_52%,#e7f0e9_100%)] text-foreground"
    >
      <style>{`
        html:has(.blog-article-page),
        body:has(.blog-article-page) {
          overflow-x: clip !important;
        }
      `}</style>
      <TopNav />
      <div className="mx-auto w-full bg-white/95 lg:max-w-[1180px] lg:border-x lg:border-zinc-900/[0.07] lg:shadow-[0_30px_90px_-55px_rgba(34,65,47,0.35)]">
        <BreadcrumbPill
          backHref="/blog"
          containerClassName="container mx-auto max-w-5xl px-6 pt-6 lg:-translate-x-4"
          items={[
            { label: 'Home', href: '/' },
            { label: 'Blog', href: '/blog' },
            { label: post.category },
          ]}
        />
        <main className="marketing-page">
          <article>
            <header className="border-b border-[#e9e2d2]/70">
            <div className="container mx-auto max-w-5xl px-6 pb-12 pt-8 md:pb-16 md:pt-10">
              <div className="max-w-4xl">
                <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-emerald-700">
                  /{post.category}
                </div>
                <h1 className="mt-5 max-w-[15ch] font-[family-name:var(--font-hero-serif)] text-[42px] font-semibold leading-[1.02] tracking-[-0.04em] text-zinc-900 sm:text-[60px]">
                  {post.title}
                </h1>
                <p className="mt-6 max-w-3xl text-[18px] leading-[1.65] text-zinc-600">
                  {post.excerpt}
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-zinc-900/[0.08] pt-5 text-[12px] text-zinc-500">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-950 font-[family-name:var(--font-hero-serif)] text-[17px] font-semibold text-white">
                      C
                    </span>
                    <span>
                      <span className="block font-semibold text-zinc-800">Chivox Editorial</span>
                      <span className="block text-[11px]">Speech learning &amp; product</span>
                    </span>
                  </div>
                  <span className="hidden h-7 w-px bg-zinc-900/10 sm:block" aria-hidden />
                  <time>{post.date}</time>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 className="h-3.5 w-3.5" aria-hidden />
                    {readTime} min read
                  </span>
                </div>
              </div>
            </div>
          </header>

          <div className="container mx-auto max-w-5xl px-6 py-9 md:py-12">
            <div className="relative aspect-[16/8] overflow-hidden rounded-[1.5rem] border border-zinc-900/[0.08] bg-[#eef4ee]">
              <Image
                src={post.image}
                alt={post.imageAlt}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 960px"
                className="object-cover"
              />
            </div>

            <div className="mx-auto grid max-w-5xl gap-10 py-12 md:py-16 lg:grid-cols-[minmax(0,720px)_220px] lg:items-start lg:gap-14">
              <div className="min-w-0">
                <p className="font-[family-name:var(--font-hero-serif)] text-[22px] font-medium leading-[1.65] tracking-[-0.018em] text-zinc-800 first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:text-[60px] first-letter:font-semibold first-letter:leading-[0.8] first-letter:text-emerald-900">
                  {post.intro}
                </p>
                <div className="mt-14 space-y-16">
                  {post.sections.map((section, index) => (
                    <section key={section.heading} id={headingId(section.heading)} className="scroll-mt-28">
                      <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-emerald-700">
                        {String(index + 1).padStart(2, '0')}
                      </div>
                      <h2 className="mt-2 font-[family-name:var(--font-hero-serif)] text-[30px] font-semibold leading-tight tracking-[-0.025em] text-zinc-900">
                        {section.heading}
                      </h2>
                      <div className="mt-5 space-y-5 text-[17px] leading-[1.85] text-zinc-700">
                        {section.body
                          .trim()
                          .split(/\n\n+/)
                          .map((paragraph) => (
                            <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                          ))}
                      </div>
                      {section.figure ? <ArticleFigure figure={section.figure} /> : null}
                    </section>
                  ))}
                </div>

                {post.takeaways && post.takeaways.length > 0 ? (
                  <aside id="key-takeaways" className="mt-16 scroll-mt-28 border-y border-emerald-900/15 bg-emerald-50/45 px-6 py-8 md:px-8">
                    <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-emerald-700">
                      Key takeaways
                    </div>
                    <ul className="mt-4 space-y-3">
                      {post.takeaways.map((item) => (
                        <li
                          key={item}
                          className="flex gap-3 text-[15px] leading-relaxed text-zinc-700"
                        >
                          <span
                            className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-700"
                            aria-hidden
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </aside>
                ) : null}

                <div className="mt-16 border-t border-zinc-900/10 pt-8">
                  <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500">
                    Next article
                  </div>
                  <h2 className="mt-3 max-w-xl font-[family-name:var(--font-hero-serif)] text-[27px] font-semibold leading-snug tracking-[-0.02em] text-zinc-900">
                    {nextPost.title}
                  </h2>
                  <Link
                    href={`/blog/${nextPost.slug}`}
                    className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-emerald-800"
                  >
                    Read next article <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              <aside
                className="order-first rounded-xl border border-zinc-900/[0.08] bg-white/80 p-5 shadow-[0_14px_34px_-28px_rgba(16,52,33,0.35)] backdrop-blur-sm lg:order-last lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto"
                aria-label="Article contents"
              >
                <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500">
                  In this article
                </div>
                <nav className="mt-4">
                  <ol className="space-y-1">
                    {post.sections.map((section, index) => (
                      <li key={section.heading}>
                        <a
                          href={`#${headingId(section.heading)}`}
                          className="group -mx-2 flex gap-2.5 rounded-lg px-2 py-2 text-[12.5px] leading-snug text-zinc-600 transition-colors hover:bg-emerald-50/80 hover:text-emerald-800 focus-visible:bg-emerald-50 focus-visible:text-emerald-900 focus-visible:outline-none"
                        >
                          <span className="font-mono text-[9px] text-emerald-700/70">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <span>{section.heading}</span>
                        </a>
                      </li>
                    ))}
                  </ol>
                  {post.takeaways && post.takeaways.length > 0 ? (
                    <a
                      href="#key-takeaways"
                      className="-mx-2 mt-3 block border-t border-zinc-900/[0.07] px-2 pt-4 pb-2 text-[12px] font-semibold text-emerald-800 transition-colors hover:bg-emerald-50/80 focus-visible:bg-emerald-50 focus-visible:outline-none"
                    >
                      Key takeaways
                    </a>
                  ) : null}
                </nav>
              </aside>
            </div>
          </div>
          </article>
        </main>
      </div>
      <SiteFooter />
    </div>
  );
}
