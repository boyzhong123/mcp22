import type { CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Check, Code2, MessageSquareText, ShieldCheck, Sparkles } from 'lucide-react';
import { AmbientBackdrop, ContactSection, SiteFooter, TopNav } from '@/app/global/_chrome';
import { absoluteUrl } from '@/lib/site';
import {
  DEFAULT_MARKETING_PAYLOAD,
  DEFAULT_MARKETING_THEME,
  type MarketingClosingLayout,
  type MarketingFaq,
  type MarketingPageData,
  type MarketingSection,
  type MarketingSectionLayout,
  type MarketingWorkflowLayout,
} from './seo-content';

const SECTION_ICONS = [Sparkles, MessageSquareText, ShieldCheck] as const;

function SectionEyebrow({ text }: { text: string }) {
  return <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--accent)]">/{text}</div>;
}

function SectionPoints({ points }: { points: string[] }) {
  return (
    <ul className="mt-6 space-y-3">
      {points.map((point) => (
        <li key={point} className="flex gap-2.5 text-[13px] leading-relaxed text-foreground/85">
          <Check className="mt-[3px] h-3.5 w-3.5 shrink-0 text-[var(--accent)]" strokeWidth={3} />
          <span>{point}</span>
        </li>
      ))}
    </ul>
  );
}

function SectionCopy({ section }: { section: MarketingSection }) {
  return (
    <>
      <SectionEyebrow text={section.eyebrow} />
      <h2 className="mt-2 text-[23px] font-bold leading-tight tracking-[-0.025em] text-zinc-900 md:text-[26px]">{section.title}</h2>
      <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground md:text-[15px]">{section.body}</p>
      <SectionPoints points={section.points} />
    </>
  );
}

function SectionImage({ section, className, sizes }: { section: MarketingSection; className?: string; sizes: string }) {
  if (!section.image) return null;
  return (
    <div className={`relative overflow-hidden bg-[#f4efe4] ${className ?? ''}`}>
      <Image
        src={section.image}
        alt={section.imageAlt ?? ''}
        fill
        sizes={sizes}
        className="object-cover object-[center_28%] transition-transform duration-500 group-hover:scale-[1.03]"
      />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-white/12 to-transparent" />
    </div>
  );
}

function SectionIcon({ index }: { index: number }) {
  const Icon = SECTION_ICONS[index % SECTION_ICONS.length];
  return (
    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
      <Icon className="h-5 w-5" />
    </span>
  );
}

/** Equal three-up cards — used by Mandarin (image headers) and as fallback. */
function CardsLayout({ sections }: { sections: MarketingSection[] }) {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {sections.map((section, index) => (
        <article
          key={section.title}
          className="group relative overflow-hidden rounded-2xl border border-zinc-900/[0.08] bg-white/72 p-6 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/20 hover:shadow-[0_28px_60px_-38px_rgba(16,52,33,0.45)] md:p-7"
        >
          <div aria-hidden className="absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-emerald-500/55 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          {section.image ? (
            <SectionImage
              section={section}
              className="relative -mx-6 -mt-6 aspect-[16/9] md:-mx-7 md:-mt-7"
              sizes="(max-width: 1024px) 100vw, 33vw"
            />
          ) : (
            <SectionIcon index={index} />
          )}
          <div className={section.image ? 'mt-5' : ''}>
            <SectionCopy section={section} />
          </div>
        </article>
      ))}
    </div>
  );
}

/** Featured lead + two supporting cards — English / Function calling. */
function SpotlightLayout({ sections }: { sections: MarketingSection[] }) {
  const [lead, ...rest] = sections;
  if (!lead) return null;

  return (
    <div className="space-y-5">
      <article className="group overflow-hidden rounded-[28px] border border-zinc-900/[0.08] bg-white/75 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.4)]">
        <div className="grid lg:grid-cols-12 lg:items-stretch">
          {lead.image ? (
            <SectionImage
              section={lead}
              className="aspect-[16/10] lg:col-span-6 lg:aspect-auto lg:min-h-[340px]"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          ) : null}
          <div className={`flex flex-col justify-center p-7 md:p-9 ${lead.image ? 'lg:col-span-6' : 'lg:col-span-12'}`}>
            {!lead.image ? <SectionIcon index={0} /> : null}
            <div className={!lead.image ? 'mt-5' : ''}>
              <SectionCopy section={lead} />
            </div>
          </div>
        </div>
      </article>

      {rest.length > 0 ? (
        <div className={`grid gap-5 ${rest.length === 1 ? 'lg:grid-cols-1' : 'lg:grid-cols-2'}`}>
          {rest.map((section, index) => (
            <article
              key={section.title}
              className="group overflow-hidden rounded-2xl border border-zinc-900/[0.08] bg-white/72 p-0 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.35)] transition-all duration-300 hover:-translate-y-1"
            >
              {section.image ? (
                <SectionImage section={section} className="aspect-[21/9]" sizes="(max-width: 1024px) 100vw, 50vw" />
              ) : null}
              <div className="p-6 md:p-7">
                {!section.image ? <SectionIcon index={index + 1} /> : null}
                <div className={!section.image ? 'mt-5' : ''}>
                  <SectionCopy section={section} />
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Full-bleed alternating rows — MCP / agent pages. */
function AlternatingLayout({ sections }: { sections: MarketingSection[] }) {
  return (
    <div className="space-y-10 md:space-y-14">
      {sections.map((section, index) => {
        const flip = index % 2 === 1;
        return (
          <article key={section.title} className="group grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
            <div className={`lg:col-span-5 ${flip ? 'lg:order-2' : ''}`}>
              <SectionCopy section={section} />
            </div>
            <div className={`lg:col-span-7 ${flip ? 'lg:order-1' : ''}`}>
              {section.image ? (
                <SectionImage
                  section={section}
                  className="aspect-[16/10] rounded-[24px] border border-zinc-900/[0.06] shadow-[0_28px_70px_-48px_rgba(15,23,42,0.55)]"
                  sizes="(max-width: 1024px) 100vw, 58vw"
                />
              ) : (
                <div className="flex aspect-[16/10] items-center justify-center rounded-[24px] border border-dashed border-zinc-900/10 bg-[var(--accent-soft)]">
                  <SectionIcon index={index} />
                </div>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

/** Asymmetric mosaic — Kids / AI tutor. */
function MosaicLayout({ sections }: { sections: MarketingSection[] }) {
  const [lead, second, third] = sections;
  if (!lead) return null;

  return (
    <div className="grid gap-5 lg:grid-cols-12 lg:grid-rows-2">
      <article className="group overflow-hidden rounded-[28px] border border-zinc-900/[0.08] bg-white/75 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.4)] lg:col-span-7 lg:row-span-2">
        {lead.image ? (
          <SectionImage section={lead} className="aspect-[16/11] lg:aspect-auto lg:h-[42%]" sizes="(max-width: 1024px) 100vw, 58vw" />
        ) : null}
        <div className="p-7 md:p-8">
          {!lead.image ? <SectionIcon index={0} /> : null}
          <div className={!lead.image ? 'mt-5' : ''}>
            <SectionCopy section={lead} />
          </div>
        </div>
      </article>

      {[second, third].filter(Boolean).map((section, index) => (
        <article
          key={section!.title}
          className="group overflow-hidden rounded-2xl border border-zinc-900/[0.08] bg-white/72 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.35)] lg:col-span-5"
        >
          {section!.image ? (
            <SectionImage section={section!} className="aspect-[16/9]" sizes="(max-width: 1024px) 100vw, 42vw" />
          ) : null}
          <div className="p-6 md:p-7">
            {!section!.image ? <SectionIcon index={index + 1} /> : null}
            <div className={!section!.image ? 'mt-5' : ''}>
              <SectionCopy section={section!} />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function SectionsBlock({
  sections,
  layout,
}: {
  sections: MarketingSection[];
  layout: MarketingSectionLayout;
}) {
  switch (layout) {
    case 'spotlight':
      return <SpotlightLayout sections={sections} />;
    case 'alternating':
      return <AlternatingLayout sections={sections} />;
    case 'mosaic':
      return <MosaicLayout sections={sections} />;
    case 'cards':
    default:
      return <CardsLayout sections={sections} />;
  }
}

/** Show-not-tell: the concrete request/response behind the page's claims. */
function PayloadSection({ payload }: { payload: NonNullable<MarketingPageData['payload']> }) {
  return (
    <section className="border-b border-[#e9e2d2]/70 py-20 md:py-24">
      <div className="container mx-auto grid max-w-6xl items-center gap-10 px-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-[var(--accent)]">/show-not-tell</div>
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

function WorkflowHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-[var(--accent)]">/workflow</div>
      <h2 className="mt-3 heading-display text-3xl tracking-[-0.025em] md:text-[42px]">{title}</h2>
      <p className="mt-4 text-muted-foreground">{description}</p>
    </div>
  );
}

/** One continuous process surface — compact enough to read as a single journey. */
function WorkflowSteps({ steps }: { steps: string[] }) {
  return (
    <ol className="overflow-hidden rounded-[24px] border border-zinc-900/[0.08] bg-white/72 shadow-[0_24px_60px_-48px_rgba(15,23,42,0.42)] sm:grid sm:grid-cols-2">
      {steps.map((step, index) => (
        <li
          key={step}
          className={`group relative flex min-h-32 items-start gap-4 border-b border-zinc-900/[0.07] p-5 transition-colors hover:bg-[color-mix(in_srgb,var(--accent-soft)_38%,white)] sm:min-h-36 sm:p-6 sm:odd:border-r ${
            index === steps.length - 1 ? 'border-b-0' : ''
          } ${index >= steps.length - 2 ? 'sm:border-b-0' : ''}`}
        >
          <div aria-hidden className="absolute inset-y-5 left-0 w-0.5 rounded-full bg-[var(--accent)] opacity-0 transition-opacity group-hover:opacity-100 sm:inset-y-6" />
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[11px] font-bold tabular-nums text-[var(--accent)]">
            0{index + 1}
          </div>
          <div className="pt-1.5">
            <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground">Step {index + 1}</div>
            <div className="mt-2 max-w-[15rem] text-[16px] font-semibold leading-snug text-zinc-900">{step}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Numbered nodes on one horizontal track — Stripe / Linear style. */
function WorkflowRail({ steps }: { steps: string[] }) {
  return (
    <ol className="relative mt-14 grid gap-8 md:grid-cols-4 md:gap-6">
      <div
        aria-hidden
        className="absolute left-[12%] right-[12%] top-[18px] hidden h-px bg-[color-mix(in_srgb,var(--accent)_28%,transparent)] md:block"
      />
      {steps.map((step, index) => (
        <li key={step} className="relative flex flex-col items-center text-center md:px-2">
          <div className="relative z-[1] flex h-9 w-9 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--accent)_40%,transparent)] bg-white text-[12px] font-bold tabular-nums text-[var(--accent)] shadow-[0_8px_20px_-12px_rgba(15,23,42,0.35)]">
            0{index + 1}
          </div>
          <div className="mt-5 max-w-[11rem] text-[15px] font-semibold leading-snug text-zinc-900">{step}</div>
        </li>
      ))}
    </ol>
  );
}

/** Vertical spine with stacked steps — docs / developer rhythm. */
function WorkflowTimeline({ steps, title, description }: { steps: string[]; title: string; description: string }) {
  return (
    <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:items-start">
      <div className="lg:col-span-4 lg:sticky lg:top-28">
        <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-[var(--accent)]">/workflow</div>
        <h2 className="mt-3 heading-display text-3xl tracking-[-0.025em] md:text-[36px]">{title}</h2>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <ol className="relative space-y-0 lg:col-span-8">
        <div aria-hidden className="absolute bottom-4 left-[17px] top-4 w-px bg-[color-mix(in_srgb,var(--accent)_22%,transparent)]" />
        {steps.map((step, index) => (
          <li key={step} className="group relative flex gap-5 pb-8 last:pb-0">
            <div className="relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--accent)_35%,transparent)] bg-white text-[12px] font-bold tabular-nums text-[var(--accent)]">
              0{index + 1}
            </div>
            <div className="flex-1 rounded-2xl border border-zinc-900/[0.08] bg-white/70 px-5 py-4 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-[color-mix(in_srgb,var(--accent)_30%,transparent)] group-hover:bg-white">
              <div className="text-[15px] font-semibold leading-snug text-zinc-900">{step}</div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** A contained practice loop — keeps tutor pages conversational instead of linear. */
function WorkflowLoop({
  steps,
  title,
  description,
}: {
  steps: string[];
  title: string;
  description: string;
}) {
  const phaseLabels = ['Learner turn', 'Speech evidence', 'Tutor decision', 'Focused retry'];

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
      <div className="lg:col-span-5">
        <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-[var(--accent)]">/conversation-loop</div>
        <h2 className="mt-3 heading-display text-3xl tracking-[-0.025em] md:text-[42px]">{title}</h2>
        <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-muted-foreground">{description}</p>
        <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--accent)_22%,transparent)] bg-white/75 px-4 py-2 text-[12px] font-semibold text-[var(--accent)]">
          Context stays with the learner
          <ArrowRight aria-hidden className="h-3.5 w-3.5" />
        </div>
      </div>
      <ol className="grid gap-3 rounded-[28px] border border-[color-mix(in_srgb,var(--accent)_20%,transparent)] bg-[color-mix(in_srgb,var(--accent-soft)_52%,white)] p-3 sm:grid-cols-2 lg:col-span-7 md:p-4">
        {steps.map((step, index) => (
          <li
            key={step}
            className={`min-h-40 rounded-[20px] border border-zinc-900/[0.07] bg-white/90 p-5 shadow-[0_18px_45px_-38px_rgba(15,23,42,0.4)] ${
              index % 2 === 1 ? 'sm:translate-y-5' : ''
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--accent)]">{phaseLabels[index]}</span>
              <span className="text-[12px] font-bold tabular-nums text-zinc-400">0{index + 1}</span>
            </div>
            <div className="mt-8 text-[17px] font-semibold leading-snug text-zinc-900">{step}</div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function WorkflowBlock({
  steps,
  layout,
  title,
  description,
}: {
  steps: string[];
  layout: MarketingWorkflowLayout;
  title: string;
  description: string;
}) {
  if (layout === 'timeline') {
    return (
      <section className="border-b border-[#e9e2d2]/70 py-20 md:py-24">
        <div className="container mx-auto max-w-6xl px-6">
          <WorkflowTimeline steps={steps} title={title} description={description} />
        </div>
      </section>
    );
  }

  if (layout === 'loop') {
    return (
      <section className="border-b border-[#e9e2d2]/70 py-20 md:py-24">
        <div className="container mx-auto max-w-6xl px-6">
          <WorkflowLoop steps={steps} title={title} description={description} />
        </div>
      </section>
    );
  }

  return (
    <section className="border-b border-[#e9e2d2]/70 py-16 md:py-20">
      <div className="container mx-auto max-w-6xl px-6">
        {layout === 'rail' ? (
          <>
            <WorkflowHeader title={title} description={description} />
            <WorkflowRail steps={steps} />
          </>
        ) : (
          <div className="grid gap-9 lg:grid-cols-12 lg:items-center lg:gap-12">
            <div className="lg:col-span-5">
              <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-[var(--accent)]">/workflow</div>
              <h2 className="mt-3 max-w-md heading-display text-3xl leading-[1.08] tracking-[-0.025em] md:text-[40px]">{title}</h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground">{description}</p>
            </div>
            <div className="lg:col-span-7">
              <WorkflowSteps steps={steps} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function RelatedLink({
  item,
  className,
}: {
  item: MarketingPageData['related'][number];
  className?: string;
}) {
  return (
    <Link
      href={item.href}
      className={
        className ??
        'group block rounded-xl border border-zinc-900/[0.08] bg-white/65 p-4 transition-colors hover:border-[color-mix(in_srgb,var(--accent)_35%,transparent)] hover:bg-white'
      }
    >
      <div className="flex items-center justify-between gap-3 text-[14px] font-semibold text-zinc-900">
        {item.label}
        <ArrowRight className="h-4 w-4 shrink-0 text-[var(--accent)] transition-transform group-hover:translate-x-1" />
      </div>
      <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{item.description}</p>
    </Link>
  );
}

function FaqCard({ item }: { item: MarketingFaq }) {
  return (
    <article className="group rounded-2xl border border-zinc-900/[0.08] bg-white/68 p-6 transition-colors hover:border-[color-mix(in_srgb,var(--accent)_30%,transparent)] hover:bg-white">
      <h3 className="flex items-start gap-2.5 text-[16px] font-semibold text-zinc-900">
        <span aria-hidden className="mt-px select-none font-mono text-[13px] text-[var(--accent)]">
          Q.
        </span>
        <span>{item.question}</span>
      </h3>
      <p className="mt-2 pl-[26px] text-[14px] leading-relaxed text-muted-foreground">{item.answer}</p>
    </article>
  );
}

/** FAQ left + related sidebar — balanced Western marketing close. */
function ClosingAside({
  faq,
  related,
}: {
  faq: MarketingFaq[];
  related: MarketingPageData['related'];
}) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-zinc-900/[0.08] bg-white/64 shadow-[0_30px_80px_-58px_rgba(15,23,42,0.4)] lg:grid lg:grid-cols-12">
      <div className="p-6 md:p-9 lg:col-span-7 lg:p-10">
        <div className="max-w-xl">
          <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-[var(--accent)]">/questions</div>
          <h2 className="mt-3 heading-display text-3xl leading-[1.08] tracking-[-0.025em] md:text-[38px]">Common implementation questions</h2>
        </div>
        <div className="mt-7 divide-y divide-zinc-900/[0.08] border-y border-zinc-900/[0.08]">
          {faq.map((item) => (
            <article key={item.question} className="grid gap-2 py-6 sm:grid-cols-[2rem_1fr] sm:gap-3">
              <span aria-hidden className="font-mono text-[12px] font-semibold text-[var(--accent)]">Q.</span>
              <div>
                <h3 className="text-[16px] font-semibold leading-snug text-zinc-900">{item.question}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{item.answer}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
      <aside className="border-t border-zinc-900/[0.08] bg-[color-mix(in_srgb,var(--accent-soft)_42%,white)] p-6 md:p-9 lg:col-span-5 lg:border-l lg:border-t-0 lg:p-10">
        <div className="flex h-full flex-col">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-[var(--accent)]">Continue exploring</div>
            <h3 className="mt-3 max-w-sm text-[23px] font-semibold leading-tight tracking-[-0.025em] text-zinc-900">Keep building the learner experience</h3>
            <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-muted-foreground">Choose the next layer—from product feedback logic to the live assessment flow.</p>
          </div>
          <nav aria-label="Continue exploring" className="mt-7 divide-y divide-zinc-900/[0.08] border-y border-zinc-900/[0.08]">
            {related.map((item) => (
              <Link key={item.href} href={item.href} className="group flex items-center justify-between gap-4 py-5">
                <div>
                  <div className="text-[14px] font-semibold text-zinc-900">{item.label}</div>
                  <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{item.description}</p>
                </div>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--accent)_22%,transparent)] bg-white/80 text-[var(--accent)] transition-all group-hover:translate-x-1 group-hover:border-[color-mix(in_srgb,var(--accent)_42%,transparent)]">
                  <ArrowRight aria-hidden className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </nav>
        </div>
      </aside>
    </div>
  );
}

/** FAQ two-up + related three-up strip — editorial magazine close. */
function ClosingGrid({
  faq,
  related,
}: {
  faq: MarketingFaq[];
  related: MarketingPageData['related'];
}) {
  return (
    <div className="space-y-14">
      <div>
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-[var(--accent)]">/questions</div>
          <h2 className="mt-3 heading-display text-3xl tracking-[-0.025em] md:text-[40px]">Common implementation questions</h2>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {faq.map((item) => (
            <FaqCard key={item.question} item={item} />
          ))}
        </div>
      </div>
      <div>
        <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground">Continue exploring</div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {related.map((item) => (
            <RelatedLink
              key={item.href}
              item={item}
              className="group block rounded-2xl border border-zinc-900/[0.08] bg-white/70 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--accent)_35%,transparent)] hover:bg-white hover:shadow-[0_20px_40px_-36px_rgba(15,23,42,0.45)]"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Related discovery band first, FAQ stacked — product-tour close. */
function ClosingBand({
  faq,
  related,
}: {
  faq: MarketingFaq[];
  related: MarketingPageData['related'];
}) {
  return (
    <div className="space-y-14">
      <div className="rounded-[28px] border border-zinc-900/[0.07] bg-[color-mix(in_srgb,var(--accent-soft)_55%,white)] p-6 md:p-8">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground">Continue exploring</div>
            <h2 className="mt-2 heading-display text-2xl tracking-[-0.025em] md:text-[32px]">Related paths worth opening next</h2>
          </div>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {related.map((item) => (
            <RelatedLink
              key={item.href}
              item={item}
              className="group block rounded-2xl border border-zinc-900/[0.08] bg-white/80 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--accent)_35%,transparent)] hover:bg-white"
            />
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-3xl">
        <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-[var(--accent)]">/questions</div>
        <h2 className="mt-3 heading-display text-3xl tracking-[-0.025em] md:text-[40px]">Common implementation questions</h2>
        <div className="mt-8 space-y-4">
          {faq.map((item) => (
            <FaqCard key={item.question} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Dark implementation brief + quiet link rail — for developer-first solution pages. */
function ClosingBrief({
  faq,
  related,
}: {
  faq: MarketingFaq[];
  related: MarketingPageData['related'];
}) {
  return (
    <div>
      <div className="overflow-hidden rounded-[30px] bg-zinc-950 px-6 py-8 text-white shadow-[0_36px_90px_-58px_rgba(15,23,42,0.85)] md:px-9 md:py-10">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-[color-mix(in_srgb,var(--accent)_75%,white)]">/implementation-brief</div>
            <h2 className="mt-3 heading-display text-3xl tracking-[-0.025em] text-white md:text-[40px]">Decisions to make before the tool call</h2>
            <p className="mt-4 text-[14px] leading-relaxed text-white/60">Two practical questions that keep the model, product rules and assessment service in the right roles.</p>
          </div>
          <div className="grid gap-0 border-t border-white/10 lg:col-span-8 lg:border-l lg:border-t-0">
            {faq.map((item, index) => (
              <article key={item.question} className="grid gap-3 border-b border-white/10 py-6 last:border-b-0 lg:px-8 first:lg:pt-1 last:lg:pb-1">
                <div className="flex items-start gap-4">
                  <span className="font-mono text-[11px] text-[color-mix(in_srgb,var(--accent)_75%,white)]">0{index + 1}</span>
                  <div>
                    <h3 className="text-[17px] font-semibold text-white">{item.question}</h3>
                    <p className="mt-2 text-[14px] leading-relaxed text-white/65">{item.answer}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <nav aria-label="Continue exploring" className="mt-7 border-y border-zinc-900/[0.08]">
        <div className="grid md:grid-cols-3">
          {related.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex min-h-28 items-center justify-between gap-4 border-b border-zinc-900/[0.08] py-5 md:border-b-0 md:border-r md:px-6 md:first:pl-0 md:last:border-r-0 md:last:pr-0"
            >
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground">Next 0{index + 1}</div>
                <div className="mt-1 text-[15px] font-semibold text-zinc-900">{item.label}</div>
                <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{item.description}</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-[var(--accent)] transition-transform group-hover:translate-x-1" />
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

function ClosingBlock({
  faq,
  related,
  layout,
}: {
  faq: MarketingFaq[];
  related: MarketingPageData['related'];
  layout: MarketingClosingLayout;
}) {
  return (
    <section className={layout === 'aside' ? 'py-16 md:py-20' : 'py-20 md:py-24'}>
      <div className="container mx-auto max-w-6xl px-6">
        {layout === 'grid' ? (
          <ClosingGrid faq={faq} related={related} />
        ) : layout === 'band' ? (
          <ClosingBand faq={faq} related={related} />
        ) : layout === 'brief' ? (
          <ClosingBrief faq={faq} related={related} />
        ) : (
          <ClosingAside faq={faq} related={related} />
        )}
      </div>
    </section>
  );
}

function HeroBreadcrumb({ page }: { page: MarketingPageData }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
      <Link href="/" className="hover:text-emerald-800">Home</Link>
      <span aria-hidden>/</span>
      <span>{page.group}s</span>
      <span aria-hidden>/</span>
      <span className="text-foreground/75">{page.eyebrow}</span>
    </nav>
  );
}

function HeroCopy({ page, compact = false }: { page: MarketingPageData; compact?: boolean }) {
  return (
    <>
      <div className="mb-4 text-[11px] font-mono uppercase tracking-[0.22em] text-[var(--accent)]">/{page.slug}</div>
      <h1
        className={`text-crisp max-w-5xl font-black leading-[1.02] tracking-[-0.04em] text-zinc-900 ${
          compact ? 'text-[38px] sm:text-[48px] lg:text-[58px]' : 'text-[40px] sm:text-[52px] lg:text-[64px]'
        }`}
      >
        {page.title}
      </h1>
      <p className="mt-7 max-w-3xl text-[17px] leading-relaxed text-muted-foreground md:text-[19px]">{page.intro}</p>
    </>
  );
}

function HeroActions() {
  return (
    <div className="mt-9 flex flex-wrap gap-3">
      <Link href="/demo" className="inline-flex h-11 items-center gap-2 rounded-full bg-zinc-900 px-5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5">
        Try the live demo <ArrowRight className="h-4 w-4" />
      </Link>
      <Link href="/docs" className="inline-flex h-11 items-center gap-2 rounded-full border border-emerald-500/35 bg-white/80 px-5 text-sm font-semibold text-emerald-800 hover:bg-white">
        Read developer docs <Code2 className="h-4 w-4" />
      </Link>
    </div>
  );
}

function HeroOutcomes({ page, stacked = false }: { page: MarketingPageData; stacked?: boolean }) {
  return (
    <div className={stacked ? 'grid gap-2 sm:grid-cols-3 lg:grid-cols-1' : 'grid grid-cols-3 gap-2'}>
      {page.outcomes.map((outcome) => (
        <div key={outcome.value} className="rounded-xl border border-zinc-900/[0.07] bg-[#fbfaf6]/95 p-3.5 backdrop-blur-sm">
          <div className="text-[14px] font-bold tracking-[-0.02em] text-zinc-900 sm:text-[16px]">{outcome.value}</div>
          <div className="mt-1 text-[10px] leading-snug text-muted-foreground">{outcome.label}</div>
        </div>
      ))}
    </div>
  );
}

function HeroArtwork({ page, className }: { page: MarketingPageData; className: string }) {
  const theme = page.theme ?? DEFAULT_MARKETING_THEME;
  return (
    <figure className={`relative overflow-hidden bg-[#f4efe4] ${className}`}>
      <Image
        src={theme.hero.src}
        alt={theme.hero.alt}
        fill
        priority
        sizes="(max-width: 1024px) 100vw, 58vw"
        className="object-cover object-[center_28%]"
      />
      <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-zinc-950/75 via-zinc-950/30 to-transparent px-5 pb-5 pt-20 text-white md:px-7 md:pb-6">
        <div className="text-[9.5px] font-mono uppercase tracking-[0.2em] text-white/75">{theme.hero.kicker}</div>
        <div className="mt-1 max-w-xl text-[14px] font-semibold md:text-[15px]">{theme.hero.caption}</div>
      </figcaption>
    </figure>
  );
}

function DetailHero({ page }: { page: MarketingPageData }) {
  const layout = page.heroLayout ?? 'split';

  if (layout === 'editorial') {
    return (
      <section className="border-b border-[#e9e2d2]/70">
        <div className="container mx-auto max-w-6xl px-6 pb-20 pt-12 md:pb-24 md:pt-20">
          <HeroBreadcrumb page={page} />
          <div className="mb-4 text-[11px] font-mono uppercase tracking-[0.22em] text-[var(--accent)]">/{page.slug}</div>
          <div className="grid gap-7 lg:grid-cols-12 lg:gap-12">
            <h1 className="text-crisp max-w-4xl text-[40px] font-black leading-[1.02] tracking-[-0.04em] text-zinc-900 sm:text-[52px] lg:col-span-7 lg:text-[60px]">
              {page.title}
            </h1>
            <div className="lg:col-span-5 lg:pt-2">
              <p className="max-w-xl text-[17px] leading-relaxed text-muted-foreground md:text-[19px]">{page.intro}</p>
              <HeroActions />
            </div>
          </div>
          <div className="mt-10 overflow-hidden rounded-[28px] border border-[color-mix(in_srgb,var(--accent)_24%,transparent)] bg-white/75 p-2 shadow-[0_30px_80px_-46px_rgba(16,52,33,0.45)] md:mt-12">
            <HeroArtwork page={page} className="aspect-[4/3] rounded-[22px] md:aspect-[21/9]" />
            <div className="p-2 pt-4"><HeroOutcomes page={page} /></div>
          </div>
        </div>
      </section>
    );
  }

  if (layout === 'contract') {
    return (
      <section className="border-b border-[#e9e2d2]/70 bg-[linear-gradient(145deg,color-mix(in_srgb,var(--accent-soft)_72%,white),white_58%)]">
        <div className="container mx-auto max-w-6xl px-6 pb-20 pt-12 md:pb-24 md:pt-20">
          <HeroBreadcrumb page={page} />
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <HeroCopy page={page} compact />
              <HeroActions />
            </div>
            <aside
              aria-label="Function contract overview"
              className="rounded-[30px] border border-[color-mix(in_srgb,var(--accent)_22%,transparent)] bg-white/85 p-3 shadow-[0_36px_90px_-50px_rgba(76,29,149,0.45)] backdrop-blur-xl lg:col-span-5"
            >
              <div className="flex items-center justify-between gap-3 px-2 pb-3 pt-1">
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--accent)]">
                  <Code2 className="h-3.5 w-3.5" />
                  Function contract
                </div>
                <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[10px] font-semibold text-[var(--accent)]">validated args</span>
              </div>
              <HeroArtwork page={page} className="aspect-[16/10] rounded-[22px]" />
              <div className="mx-2 mt-3 rounded-2xl bg-zinc-950 px-4 py-3 font-mono text-[11px] leading-relaxed text-violet-100">
                <span className="text-violet-400">assess_speech</span>
                <span className="text-white/55">{'({ language, audio, reference_text })'}</span>
              </div>
              <div className="mt-3 grid divide-y divide-zinc-900/[0.08] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                {page.outcomes.map((outcome, index) => (
                  <div key={outcome.value} className="px-3 py-3 sm:py-2">
                    <div className="text-[9px] font-mono text-[var(--accent)]">0{index + 1}</div>
                    <div className="mt-1 text-[13px] font-bold leading-tight text-zinc-900">{outcome.value}</div>
                    <div className="mt-1 text-[9.5px] leading-snug text-muted-foreground">{outcome.label}</div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>
    );
  }

  if (layout === 'technical') {
    return (
      <section className="border-b border-[#e9e2d2]/70 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent-soft)_55%,white),white_60%)]">
        <div className="container mx-auto max-w-6xl px-6 pb-20 pt-12 md:pb-24 md:pt-20">
          <HeroBreadcrumb page={page} />
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <HeroCopy page={page} compact />
              <HeroActions />
            </div>
            <div className="rounded-[28px] border border-zinc-900/[0.09] bg-zinc-950 p-2 shadow-[0_34px_90px_-45px_rgba(15,23,42,0.75)] lg:col-span-5">
              <HeroArtwork page={page} className="aspect-[16/10] rounded-[22px]" />
              <div className="grid gap-2 p-2 pt-4"><HeroOutcomes page={page} stacked /></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="border-b border-[#e9e2d2]/70">
      <div className="container mx-auto max-w-6xl px-6 pb-20 pt-12 md:pb-24 md:pt-20">
        <HeroBreadcrumb page={page} />
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <HeroCopy page={page} />
            <HeroActions />
          </div>
          <div className="overflow-hidden rounded-[28px] border border-[color-mix(in_srgb,var(--accent)_28%,transparent)] bg-white/75 p-2 shadow-[0_30px_80px_-42px_rgba(16,52,33,0.5)] backdrop-blur-xl lg:col-span-5">
            <HeroArtwork page={page} className="aspect-[4/3] rounded-[22px]" />
            <div className="p-2 pt-4"><HeroOutcomes page={page} /></div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SeoDetailPage({ page }: { page: MarketingPageData }) {
  const theme = page.theme ?? DEFAULT_MARKETING_THEME;
  const sectionLayout = page.sectionLayout ?? 'cards';
  const workflowLayout = page.workflowLayout ?? 'steps';
  const closingLayout = page.closingLayout ?? 'aside';
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: page.title,
    description: page.description,
    provider: { '@type': 'Organization', name: 'Chivox AI' },
    areaServed: 'Worldwide',
    serviceType: page.eyebrow,
    url: absoluteUrl(page.path),
  };

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: `${page.group}s` },
      { '@type': 'ListItem', position: 3, name: page.eyebrow, item: absoluteUrl(page.path) },
    ],
  };
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: page.faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
  const serializeJsonLd = (value: object) => JSON.stringify(value).replace(/</g, '\\u003c');

  return (
    <div
      translate="no"
      lang="en"
      className="min-h-screen bg-background text-foreground"
      style={{ '--accent': theme.accent, '--accent-soft': theme.accentSoft } as CSSProperties}
    >
      <AmbientBackdrop />
      <TopNav />
      <main className="marketing-page">
        <DetailHero page={page} />

        <section className="border-b border-[#e9e2d2]/70 py-20 md:py-24">
          <div className="container mx-auto max-w-6xl px-6">
            <SectionsBlock sections={page.sections} layout={sectionLayout} />
          </div>
        </section>

        <PayloadSection payload={page.payload ?? DEFAULT_MARKETING_PAYLOAD} />

        <WorkflowBlock
          steps={page.workflow}
          layout={workflowLayout}
          title={page.workflowTitle}
          description={page.workflowDescription}
        />
        <ClosingBlock faq={page.faq} related={page.related} layout={closingLayout} />
      </main>
      <ContactSection />
      <SiteFooter />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqSchema) }} />
    </div>
  );
}
