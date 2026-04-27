'use client';

import { Link } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { ChevronDown, HelpCircle, MessageSquare, BookOpen, ArrowUpRight } from 'lucide-react';
import { SALES_CHAT_URL } from '@/lib/links';

export function FAQ() {
  const t = useTranslations('FAQ');
  const locale = useLocale();
  const isZh = locale.startsWith('zh');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const items = [
    { q: t('q1'), a: t('a1') },
    { q: t('q2'), a: t('a2') },
    { q: t('q3'), a: t('a3') },
    { q: t('q4'), a: t('a4') },
    { q: t('q5'), a: t('a5') },
    { q: t('q6'), a: t('a6') },
    { q: t('q7'), a: t('a7') },
  ];

  return (
    <section className="py-14 md:py-20 w-full">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-5 gap-10 lg:gap-14 max-w-6xl mx-auto">
          {/* 左栏：标题 + 联系入口 */}
          <div className="lg:col-span-2 lg:sticky lg:top-24 self-start">
            <span className="inline-block text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-3">FAQ</span>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">
              {t('title')}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-8">
              {isZh
                ? '最常被问到的问题都收在这里。没找到答案？直接跟我们聊，从协议细节到私有化部署都可以一起对。'
                : 'Most frequently asked questions are collected here. Still missing an answer? Talk to us directly—from protocol details to private deployment.'}
            </p>

            <div className="space-y-2.5">
              <a
                href={SALES_CHAT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between rounded-lg border border-border/60 bg-background hover:bg-muted/40 px-4 py-3 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-md bg-foreground/5 flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-foreground" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{isZh ? '联系我们' : 'Contact Us'}</div>
                    <div className="text-xs text-muted-foreground">{isZh ? '商务合作 / 技术咨询' : 'Business / Technical Consulting'}</div>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </a>

              <Link
                href="/docs"
                className="group flex items-center justify-between rounded-lg border border-border/60 bg-background hover:bg-muted/40 px-4 py-3 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-md bg-foreground/5 flex items-center justify-center">
                    <BookOpen className="h-4 w-4 text-foreground" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{isZh ? '开发者文档' : 'Developer Docs'}</div>
                    <div className="text-xs text-muted-foreground">{isZh ? '接入指南 / API / 排障' : 'Integration / API / Troubleshooting'}</div>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>

              <Link
                href="/demo"
                className="group flex items-center justify-between rounded-lg border border-border/60 bg-background hover:bg-muted/40 px-4 py-3 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-md bg-foreground/5 flex items-center justify-center">
                    <HelpCircle className="h-4 w-4 text-foreground" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{isZh ? '在线体验' : 'Try Demo'}</div>
                    <div className="text-xs text-muted-foreground">{isZh ? '无需注册，立即试一下' : 'No signup needed, try now'}</div>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
            </div>
          </div>

          {/* 右栏：FAQ 手风琴 */}
          <div className="lg:col-span-3">
            <div className="rounded-xl border border-border/60 bg-background/60 backdrop-blur-sm overflow-hidden">
              {items.map((item, i) => (
                <div
                  key={i}
                  className={i < items.length - 1 ? 'border-b border-border/50' : ''}
                >
                  <button
                    onClick={() => setOpenIndex(openIndex === i ? null : i)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left group"
                  >
                    <div className="flex items-start gap-3 min-w-0 pr-4">
                      <span className="text-[11px] font-mono text-muted-foreground/60 mt-0.5 shrink-0">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="text-sm md:text-[15px] font-medium group-hover:text-foreground/80 transition-colors">
                        {item.q}
                      </span>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                        openIndex === i ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      openIndex === i ? 'max-h-96 pb-4' : 'max-h-0'
                    }`}
                  >
                    <p className="text-sm text-muted-foreground leading-relaxed px-5 pl-[3.25rem]">
                      {item.a}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

