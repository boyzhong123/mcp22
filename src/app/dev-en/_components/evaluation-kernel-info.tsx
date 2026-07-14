'use client';

import { ArrowUpRight, Info, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ModalPortal } from './modal-portal';
import { useLang } from '../_lib/use-lang';

type PointRule = 'wordSentence' | 'paragraph';

const EVALUATION_KERNELS: Array<{
  type: { en: string; zh: string };
  pointRule: PointRule;
  kernels: Array<{
    id: string;
    language: 'EN' | 'ZH';
  }>;
}> = [
  {
    type: { en: 'Character / word', zh: '字词' },
    pointRule: 'wordSentence',
    kernels: [
      { id: 'cn.word.raw', language: 'ZH' },
      { id: 'cn.word.score', language: 'ZH' },
      { id: 'cn.vocab.raw', language: 'ZH' },
      { id: 'en.word.score', language: 'EN' },
      { id: 'en.word.child', language: 'EN' },
      { id: 'en.word.pron', language: 'EN' },
      { id: 'en.vocabs.pron', language: 'EN' },
    ],
  },
  {
    type: { en: 'Sentence', zh: '句子' },
    pointRule: 'wordSentence',
    kernels: [
      { id: 'cn.sent.raw', language: 'ZH' },
      { id: 'cn.sent.score', language: 'ZH' },
      { id: 'cn.rec.raw', language: 'ZH' },
      { id: 'cn.recscore.raw', language: 'ZH' },
      { id: 'en.sent.score', language: 'EN' },
      { id: 'en.sent.child', language: 'EN' },
      { id: 'en.sent.pron', language: 'EN' },
      { id: 'en.rltm.score', language: 'EN' },
      { id: 'en.nsp.score', language: 'EN' },
      { id: 'en.choc.score', language: 'EN' },
      { id: 'en.sent.rec', language: 'EN' },
      { id: 'en.sent.recscore', language: 'EN' },
    ],
  },
  {
    type: { en: 'Paragraph', zh: '段落' },
    pointRule: 'paragraph',
    kernels: [
      { id: 'cn.pred.raw', language: 'ZH' },
      { id: 'cn.pred.score', language: 'ZH' },
      { id: 'en.pred.score', language: 'EN' },
      { id: 'en.pred.exam', language: 'EN' },
      { id: 'en.asr.rec', language: 'EN' },
      { id: 'en.scne.exam', language: 'EN' },
      { id: 'en.prtl.exam', language: 'EN' },
      { id: 'en.oesy.exam', language: 'EN' },
    ],
  },
];

interface EvaluationKernelInfoProps {
  wordSentencePoints: number;
  paragraphPoints: number;
  className?: string;
}

export function EvaluationKernelInfo({
  wordSentencePoints,
  paragraphPoints,
  className,
}: EvaluationKernelInfoProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { t } = useLang();

  const pointsFor = (rule: PointRule) =>
    rule === 'paragraph' ? paragraphPoints : wordSentencePoints;

  useEffect(() => {
    if (!open) return;

    const scrollY = window.scrollY;
    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyPosition = document.body.style.position;
    const previousBodyTop = document.body.style.top;
    const previousBodyWidth = document.body.style.width;
    const previousBodyPaddingRight = document.body.style.paddingRight;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const trigger = triggerRef.current;

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    document.documentElement.style.overflow = 'hidden';
    closeRef.current?.focus();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    const preventBackgroundScroll = (event: WheelEvent | TouchEvent) => {
      const target = event.target;
      if (target instanceof Node && scrollAreaRef.current?.contains(target)) return;
      event.preventDefault();
    };

    window.addEventListener('keydown', closeOnEscape);
    window.addEventListener('wheel', preventBackgroundScroll, { passive: false });
    window.addEventListener('touchmove', preventBackgroundScroll, { passive: false });
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.position = previousBodyPosition;
      document.body.style.top = previousBodyTop;
      document.body.style.width = previousBodyWidth;
      document.body.style.paddingRight = previousBodyPaddingRight;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('wheel', preventBackgroundScroll);
      window.removeEventListener('touchmove', preventBackgroundScroll);
      window.scrollTo(0, scrollY);
      trigger?.focus();
    };
  }, [open]);

  return (
    <>
      <Button
        ref={triggerRef}
        type="button"
        variant="ghost"
        size="icon-xs"
        className={cn(
          'size-5 rounded-full border-0 bg-transparent p-0 text-muted-foreground/45 shadow-none hover:bg-muted/60 hover:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring/35',
          className,
        )}
        aria-label={t(
          'View evaluation kernels and point deductions',
          '查看评测对象对应的内核与积分',
        )}
        onClick={() => setOpen(true)}
      >
        <Info className="size-3" strokeWidth={1.65} />
      </Button>

      {open ? (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[120] grid place-items-center overscroll-none bg-zinc-950/55 p-3 backdrop-blur-[3px] sm:p-6"
            onMouseDown={(event) => {
              if (event.currentTarget === event.target) setOpen(false);
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={descriptionId}
              className="flex max-h-[min(88vh,780px)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border/80 bg-background shadow-[0_32px_100px_-28px_rgba(0,0,0,0.65)]"
            >
              <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border/70 px-4 py-4 sm:px-6 sm:py-5">
                <div className="min-w-0">
                    <h2 id={titleId} className="text-base font-semibold tracking-tight sm:text-lg">
                      {t('Evaluation types, kernels and points', '评测对象、内核与积分')}
                    </h2>
                    <p id={descriptionId} className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {t(
                        'Kernel identifiers follow the current billing classification. Points are deducted only after a successful evaluation.',
                        '内核名以当前计费分类为准；仅成功评测扣分。',
                      )}
                    </p>
                </div>
                <Button
                  ref={closeRef}
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 rounded-full"
                  aria-label={t('Close', '关闭')}
                  onClick={() => setOpen(false)}
                >
                  <X />
                </Button>
              </div>

              <div className="shrink-0 border-b border-border/60 bg-muted/20 px-4 py-3 sm:px-6">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5">
                    <span className="text-2xl font-semibold tabular-nums tracking-tight">{wordSentencePoints}</span>
                    <div className="min-w-0">
                      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        {t('points / use', '积分 / 次')}
                      </div>
                      <div className="mt-0.5 truncate text-xs font-medium">
                        {t('Character / word · sentence · 19 kernels', '字词、句子 · 19 个内核')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-foreground/20 bg-foreground/[0.035] px-3 py-2.5">
                    <span className="text-2xl font-semibold tabular-nums tracking-tight">{paragraphPoints}</span>
                    <div className="min-w-0">
                      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        {t('points / use', '积分 / 次')}
                      </div>
                      <div className="mt-0.5 truncate text-xs font-medium">
                        {t('Paragraph · 8 kernels', '段落 · 8 个内核')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                ref={scrollAreaRef}
                className="min-h-0 flex-1 overscroll-contain overflow-y-auto px-4 py-3 sm:px-6 sm:py-4"
              >
                <div className="hidden overflow-hidden rounded-xl border border-border/80 sm:block">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 z-10 bg-muted/95 text-[10px] uppercase tracking-[0.1em] text-muted-foreground backdrop-blur">
                      <tr className="border-b border-border">
                        <th className="w-28 px-4 py-2.5 font-semibold">{t('Type', '评测对象')}</th>
                        <th className="px-4 py-2.5 font-semibold">{t('Kernel identifier', '内核名')}</th>
                        <th className="w-20 px-4 py-2.5 text-right font-semibold">{t('Points', '积分 / 次')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {EVALUATION_KERNELS.flatMap((group) =>
                        group.kernels.map((kernel, index) => (
                          <tr key={kernel.id} className="border-b border-border/60 last:border-0">
                            {index === 0 ? (
                              <td
                                rowSpan={group.kernels.length}
                                className="bg-muted/20 px-4 py-3 align-top"
                              >
                                <span className="text-xs font-semibold text-foreground">
                                  {t(group.type.en, group.type.zh)}
                                </span>
                              </td>
                            ) : null}
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-2">
                                <code className="font-mono text-[11px] font-medium text-foreground">
                                  {kernel.id}
                                </code>
                                <span className="rounded border border-border bg-muted/40 px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
                                  {kernel.language}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <span
                                className={cn(
                                  'inline-flex min-w-7 justify-center rounded-md border px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
                                  group.pointRule === 'paragraph'
                                    ? 'border-foreground bg-foreground text-background'
                                    : 'border-border bg-muted/35 text-muted-foreground',
                                )}
                              >
                                {pointsFor(group.pointRule)}
                              </span>
                            </td>
                          </tr>
                        )),
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-3 sm:hidden">
                  {EVALUATION_KERNELS.map((group) => (
                    <section key={group.type.en} className="overflow-hidden rounded-xl border border-border/80">
                      <div className="flex items-center justify-between border-b border-border bg-muted/20 px-3 py-2.5">
                        <span className="text-sm font-semibold">{t(group.type.en, group.type.zh)}</span>
                        <span
                          className={cn(
                            'rounded-md border px-1.5 py-0.5 text-xs font-semibold tabular-nums',
                            group.pointRule === 'paragraph'
                              ? 'border-foreground bg-foreground text-background'
                              : 'border-border bg-background text-muted-foreground',
                          )}
                        >
                          {pointsFor(group.pointRule)} {t('pt / use', '积分 / 次')}
                        </span>
                      </div>
                      <ul className="divide-y divide-border/60">
                        {group.kernels.map((kernel) => (
                          <li key={kernel.id} className="px-3 py-2.5">
                            <div className="flex items-center justify-between gap-3">
                              <code className="break-all font-mono text-[11px] font-medium">{kernel.id}</code>
                              <span className="shrink-0 rounded border border-border bg-muted/40 px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
                                {kernel.language}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              </div>

              <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border/70 bg-muted/20 px-4 py-3 sm:px-6">
                <p className="text-[10px] leading-relaxed text-muted-foreground sm:text-xs">
                  {t(
                    'Successful evaluations are billed per use; failed requests do not deduct points.',
                    '成功评测按次扣分；失败请求不扣积分。',
                  )}
                </p>
                <a
                  href="/global/docs#tools-en"
                  className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                >
                  {t('Developer docs', '开发者文档')}
                  <ArrowUpRight className="size-3" />
                </a>
              </div>
            </div>
          </div>
        </ModalPortal>
      ) : null}
    </>
  );
}
