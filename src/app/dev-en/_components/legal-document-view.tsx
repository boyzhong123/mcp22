'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, ChevronDown, Clock, FileText, Mail, ScrollText } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { useLang } from '../_lib/use-lang';
import {
  LEGAL_LAST_UPDATED,
  SECTION_SUMMARIES,
  type Bilingual,
  type LegalKind,
  type LegalSection,
} from '../_lib/legal-content';

export function LegalDocumentView({
  kind,
  title,
  zhTitle,
  lede,
  sections,
}: {
  kind: LegalKind;
  title: string;
  zhTitle: string;
  lede: Bilingual;
  sections: LegalSection[];
}) {
  const { t, lang } = useLang();
  const isZh = lang === 'zh';
  const [active, setActive] = useState<string>(sections[0]?.id ?? '');

  // Scroll-spy: highlight the TOC entry for the section nearest the top of
  // the viewport (accounting for the sticky header via rootMargin).
  useEffect(() => {
    const els = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-88px 0px -65% 0px', threshold: 0 },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  const isTerms = kind === 'terms';
  const otherHref = isTerms ? '/legal/privacy' : '/legal/terms';
  const otherLabel = isTerms ? t('Privacy Policy', '隐私政策') : t('Terms of Service', '服务条款');
  const contactEmail = isTerms ? 'legal@chivox.com' : 'privacy@chivox.com';

  // Rough reading estimate — Chinese counts characters, English counts words.
  const readingMin = useMemo(() => {
    const text = sections
      .flatMap((s) => s.paragraphs.map((p) => (isZh ? p.zh : p.en)))
      .join(' ');
    const units = isZh ? text.replace(/\s/g, '').length / 2.6 : text.trim().split(/\s+/).length;
    return Math.max(2, Math.round(units / 200));
  }, [sections, isZh]);

  const tocLabel = (s: LegalSection) => (isZh ? s.zhTitle : s.title);

  return (
    <main className="min-h-dvh bg-background text-foreground scroll-smooth">
      {/* Sticky header: back link + Terms ⇄ Privacy segmented switcher */}
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/65">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t('Back to sign in', '返回登录')}
          </Link>

          <nav className="inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5 text-xs font-medium">
            <SwitchLink href="/legal/terms" active={isTerms}>
              {t('Terms', '服务条款')}
            </SwitchLink>
            <SwitchLink href="/legal/privacy" active={!isTerms}>
              {t('Privacy', '隐私政策')}
            </SwitchLink>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-6 pt-10 lg:pt-14">
        <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <ScrollText className="h-3.5 w-3.5" />
          {t('Legal', '法律条款')}
        </div>
        <h1 className="mt-3 text-3xl lg:text-[34px] font-semibold tracking-[-0.025em]">
          {t(title, zhTitle)}
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          {isZh ? lede.zh : lede.en}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <MetaPill icon={<Clock className="h-3 w-3" />}>
            {t('Updated ', '更新于 ')}
            {LEGAL_LAST_UPDATED}
          </MetaPill>
          <MetaPill icon={<FileText className="h-3 w-3" />}>
            {t(`${readingMin} min read`, `约 ${readingMin} 分钟`)}
          </MetaPill>
          <MetaPill>{t('Chivox, Inc.', 'Chivox, Inc.')}</MetaPill>
        </div>
      </div>

      {/* Body: sticky TOC + content */}
      <div className="max-w-5xl mx-auto px-6 py-10 lg:py-14 grid lg:grid-cols-[220px_minmax(0,1fr)] gap-10 lg:gap-16 items-start">
        {/* Desktop TOC */}
        <aside className="hidden lg:block sticky top-[5.5rem] self-start">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-3">
            {t('On this page', '本页目录')}
          </div>
          <nav className="border-l border-border">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={cn(
                  'block -ml-px border-l-2 pl-3 py-1.5 text-[13px] leading-snug transition-colors',
                  active === s.id
                    ? 'border-foreground text-foreground font-medium'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
                )}
              >
                {tocLabel(s)}
              </a>
            ))}
          </nav>
        </aside>

        <article className="min-w-0">
          {/* Mobile TOC */}
          <details className="group lg:hidden mb-8 rounded-xl border border-border bg-muted/20">
            <summary className="flex items-center justify-between px-4 py-3 cursor-pointer list-none text-sm font-medium [&::-webkit-details-marker]:hidden">
              {t('On this page', '本页目录')}
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <nav className="px-2 pb-2 pt-1 grid">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="rounded-md px-2 py-1.5 text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted/60"
                >
                  {tocLabel(s)}
                </a>
              ))}
            </nav>
          </details>

          <div className="space-y-10">
            {sections.map((s) => {
              const summary = SECTION_SUMMARIES[s.id];
              return (
                <section key={s.id} id={s.id} className="scroll-mt-20">
                  <h2 className="text-[18px] font-semibold tracking-[-0.01em] text-foreground">
                    {isZh ? s.zhTitle : s.title}
                  </h2>

                  {summary && (
                    <div className="mt-3 flex gap-2.5 rounded-lg border border-border/60 bg-muted/30 px-3.5 py-2.5">
                      <span className="mt-px shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                        {t('In short', '摘要')}
                      </span>
                      <p className="text-[13px] leading-relaxed text-foreground/75">
                        {isZh ? summary.zh : summary.en}
                      </p>
                    </div>
                  )}

                  <div className="mt-3.5 space-y-3 max-w-[68ch] text-[14.5px] leading-[1.75] text-foreground/80">
                    {s.paragraphs.map((p, i) => (
                      <p key={i}>{isZh ? p.zh : p.en}</p>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

          {/* Contact card */}
          <div className="mt-14 rounded-2xl border border-border bg-muted/20 p-6">
            <div className="flex items-start gap-3.5">
              <div className="h-9 w-9 shrink-0 rounded-lg bg-background border border-border flex items-center justify-center">
                <Mail className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium">
                  {t('Questions about this document?', '对本文档有疑问？')}
                </div>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  {t(
                    'Reach our team and we’ll usually reply within two business days.',
                    '联系我们，通常会在两个工作日内回复。',
                  )}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={`mailto:${contactEmail}`}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-foreground text-background text-xs font-semibold hover:brightness-110 transition-all"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    {contactEmail}
                  </a>
                  <Link
                    href={otherHref}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border bg-background text-xs font-medium text-foreground hover:bg-muted/50 transition-colors"
                  >
                    {t('Read the ', '查看')}
                    {otherLabel}
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-6 text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} Chivox, Inc. ·{' '}
            {t('Last updated ', '最后更新 ')}
            {LEGAL_LAST_UPDATED}
          </p>
        </article>
      </div>
    </main>
  );
}

function SwitchLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'px-2.5 py-1 rounded-md transition-colors',
        active
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </Link>
  );
}

function MetaPill({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full border border-border bg-muted/30 text-[11px] font-medium text-muted-foreground">
      {icon}
      {children}
    </span>
  );
}
