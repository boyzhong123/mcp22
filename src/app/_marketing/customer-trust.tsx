import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Building2, Globe2, GraduationCap } from 'lucide-react';

export const CUSTOMERS = [
  {
    name: 'NowUkan Ltd',
    country: 'United Kingdom',
    website: 'https://nowukan.io',
    image: '/customers/nowukan-white.png',
    width: 983,
    height: 162,
    alt: 'NowUkan customer logo',
    type: 'Offline learning',
    logoClassName: 'max-h-5 max-w-[96px]',
    logoTileClassName: 'border-zinc-900/[0.10] bg-white',
    decor: '/customers/decor/nowukan.jpg',
    decorAlt: 'Soft glass accents in nowUkan orange, green and blue on light gray texture',
    description:
      'An offline English-learning app for learners in connectivity-constrained regions, sold as a one-time purchase with lifetime access and focused on IELTS, TOEFL and Cambridge English listening and speaking practice.',
  },
  {
    name: 'PT Rentris Pentabenua',
    country: 'Indonesia',
    website: 'https://rentris.co.id',
    image: '/customers/rentris-cropped.png',
    width: 160,
    height: 78,
    alt: 'PT Rentris Pentabenua customer logo',
    type: 'School platform',
    logoClassName: 'max-h-5 max-w-[96px]',
    logoTileClassName: 'border-zinc-900/[0.10] bg-white',
    decor: '/customers/decor/rentris.jpg',
    decorAlt: 'Soft crimson and charcoal swoosh accents on light gray texture',
    description:
      'A school-focused technology company expanding from attendance and security systems into a Chinese and English learning platform.',
  },
  {
    name: 'Huahua Learning',
    country: 'Indonesia',
    website: 'https://www.huahualearning.com',
    image: '/customers/huahua-learning-white.png',
    width: 192,
    height: 162,
    alt: 'Huahua Learning customer logo',
    type: 'Online courses',
    logoClassName: 'max-h-6 max-w-[64px]',
    logoTileClassName: 'border-zinc-900/[0.10] bg-white',
    decor: '/customers/decor/huahua.jpg',
    decorAlt: 'Soft blush petal and warm glass pebble on light gray texture',
    description:
      'An online Chinese-learning provider building a structured Mandarin and HSK course experience for local learners.',
  },
] as const;

export function CustomerTrustSection({ compact = false }: { compact?: boolean }) {
  return (
    <section id="customers" className="warm-card-bleed border-b border-[#e9e2d2]/70 py-20 md:py-24 scroll-mt-24">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-emerald-700">/customers</div>
            <h2 className="mt-3 heading-display text-3xl tracking-[-0.025em] md:text-[42px]">
              Built into real learning products.
            </h2>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
              Chivox speech assessment supports teams serving different learners, markets and product models.
              These examples show how the same assessment foundation can fit offline learning, school platforms and online courses.
            </p>
          </div>
          {compact && (
            <div className="lg:col-span-5 lg:text-right">
              <Link href="/about#customers" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:text-emerald-900">
                Meet the teams using Chivox <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>

        <div className="mt-10 flex flex-col gap-4 rounded-2xl border border-zinc-900/[0.08] bg-white/55 px-5 py-4 shadow-[0_16px_40px_-34px_rgba(15,23,42,0.35)] backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500">Trusted by teams building language products</div>
          <div className="flex flex-wrap items-center gap-x-7 gap-y-3 sm:justify-end">
            {CUSTOMERS.map((customer) => (
              <a
                key={customer.name}
                href={customer.website}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex h-9 w-[116px] items-center justify-center rounded-lg border px-2 transition-opacity hover:opacity-100 ${customer.logoTileClassName}`}
                aria-label={`${customer.name} website`}
              >
                <Image
                  src={customer.image}
                  width={customer.width}
                  height={customer.height}
                  alt={customer.alt}
                  className={`h-auto max-w-full object-contain opacity-80 transition-opacity hover:opacity-100 ${customer.logoClassName}`}
                  sizes="116px"
                />
              </a>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {CUSTOMERS.map((customer, index) => {
            const Icon = [Globe2, Building2, GraduationCap][index];
            return (
              <article key={customer.name} className="group relative flex h-full flex-col overflow-hidden rounded-[22px] border border-zinc-900/[0.08] bg-white/72 p-6 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/25 hover:bg-white/90 hover:shadow-[0_30px_68px_-42px_rgba(16,52,33,0.44)]">
                <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div
                  aria-hidden
                  className="pointer-events-none absolute bottom-0 right-0 h-[55%] w-[58%] min-h-[160px] min-w-[160px] opacity-[0.55] transition-opacity duration-300 group-hover:opacity-[0.72]"
                  style={{
                    maskImage: 'radial-gradient(ellipse 95% 95% at 100% 100%, #000 35%, transparent 78%)',
                    WebkitMaskImage: 'radial-gradient(ellipse 95% 95% at 100% 100%, #000 35%, transparent 78%)',
                  }}
                >
                  <Image
                    src={customer.decor}
                    alt=""
                    fill
                    className="object-cover object-[70%_70%]"
                    sizes="240px"
                  />
                </div>
                <div className="relative z-[1] flex items-center justify-between gap-3">
                  <span className="text-[10px] font-mono tracking-[0.16em] text-zinc-400">0{index + 1}</span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-900/[0.08] bg-zinc-50 px-2.5 py-1 text-[9px] font-mono uppercase tracking-[0.12em] text-zinc-600"><Icon className="h-3 w-3 text-emerald-700" aria-hidden />{customer.type}</span>
                </div>
                <div className="relative z-[1] mt-8 flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-[19px] font-semibold tracking-[-0.02em] text-zinc-900">
                      <a
                        href={customer.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition-colors hover:text-emerald-800"
                      >
                        {customer.name}
                      </a>
                    </h3>
                  </div>
                  <div className="mt-1 text-[11px] font-mono uppercase tracking-[0.14em] text-emerald-700">{customer.country}</div>
                  <p className={`mt-5 text-[14px] leading-relaxed text-muted-foreground ${compact ? 'line-clamp-3' : ''}`}>{customer.description}</p>
                  <a
                    href={customer.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-7 inline-flex items-center gap-1.5 text-[12px] font-semibold text-emerald-800 opacity-70 transition-opacity group-hover:opacity-100"
                  >
                    Visit website <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </article>
            );
          })}
        </div>

      </div>
    </section>
  );
}
