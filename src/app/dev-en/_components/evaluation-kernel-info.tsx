'use client';

import { ArrowDown, ArrowUpRight, Info, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ModalPortal } from './modal-portal';
import { kernelCategoryLabel } from '../_lib/kernel-category';
import { kernelLanguage } from '../_lib/kernel-language';
import { useLang } from '../_lib/use-lang';
import { useBillingPricing } from '../_lib/use-billing-pricing';

interface EvaluationKernelInfoProps {
  className?: string;
}

function pointRateBadgeClassName(pointsPerRequest: number, defaultRate: number) {
  return cn(
    'inline-flex min-w-7 justify-center rounded-md border px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
    pointsPerRequest > defaultRate
      ? 'border-amber-300/70 bg-amber-50 text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/35 dark:text-amber-200'
      : 'border-slate-300/80 bg-slate-100 text-slate-700 dark:border-slate-600/70 dark:bg-slate-800 dark:text-slate-200',
  );
}

/**
 * "How points are deducted" info dialog. CoreType rates are dynamic and
 * server-configured (`GET /billing/core-type-pricing`); anything not
 * specifically configured deducts `default_points_per_request`. An empty rate
 * list is a normal state, not an error.
 */
export function EvaluationKernelInfo({ className }: EvaluationKernelInfoProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { t } = useLang();
  const { catalog } = useBillingPricing();

  const rates = catalog.coreTypeRates;
  const defaultRate = catalog.defaultPointsPerRequest;
  const defaultCategory = kernelCategoryLabel(undefined, defaultRate);
  // Summarize price levels instead of showing two arbitrary CoreTypes. The
  // full, deterministically sorted list remains available in the table.
  const configuredRateGroups = Array.from(
    rates.reduce((groups, rate) => {
      groups.set(rate.pointsPerRequest, (groups.get(rate.pointsPerRequest) ?? 0) + 1);
      return groups;
    }, new Map<number, number>()),
    ([pointsPerRequest, count]) => ({ pointsPerRequest, count }),
  ).sort((a, b) => b.pointsPerRequest - a.pointsPerRequest);
  const summaryRateGroups = configuredRateGroups.slice(0, 2);

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
          'View CoreType point deduction rates',
          '查看 CoreType 扣分费率',
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
              className="flex max-h-[min(88vh,780px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border/80 bg-background shadow-[0_32px_100px_-28px_rgba(0,0,0,0.65)]"
            >
              <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border/70 px-4 py-4 sm:px-6 sm:py-5">
                <div className="min-w-0">
                    <h2 id={titleId} className="text-base font-semibold tracking-tight sm:text-lg">
                      {t('CoreTypes and point deductions', 'CoreType 与积分扣除')}
                    </h2>
                    <p id={descriptionId} className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {t(
                        'Rates come from the current server pricing version. CoreTypes are case-sensitive; anything without a specific rate deducts the default per request.',
                        '费率来自服务端当前定价版本。CoreType 区分大小写；未单独配置的类型按默认费率每次扣分。',
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
                <div className="overflow-hidden rounded-xl border border-border/80 bg-background/80 sm:flex sm:items-stretch">
                  <div className="min-w-0 flex-1 px-4 py-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      {t('Configured rates', '已配置费率')}
                    </div>
                    {summaryRateGroups.length > 0 ? (
                      <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2">
                        {summaryRateGroups.map((group) => (
                          <div key={group.pointsPerRequest} className="flex items-baseline gap-2">
                            <span
                              className={cn(
                                'text-xl font-semibold tabular-nums tracking-tight',
                                group.pointsPerRequest > defaultRate
                                  ? 'text-amber-700 dark:text-amber-300'
                                  : 'text-slate-700 dark:text-slate-200',
                              )}
                            >
                              {group.pointsPerRequest}
                            </span>
                            <span className="text-xs font-medium">{t('points / request', '积分 / 次')}</span>
                            <span className="text-[11px] text-muted-foreground">
                              {t(
                                `${group.count} kernel${group.count === 1 ? '' : 's'}`,
                                `${group.count} 个内核`,
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {t('No kernel-specific rates', '暂无内核专项费率')}
                      </div>
                    )}
                  </div>
                  <div className="border-t border-border/70 px-4 py-3 sm:w-48 sm:border-l sm:border-t-0">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      {t('Default rate', '默认费率')}
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-xl font-semibold tabular-nums tracking-tight text-slate-700 dark:text-slate-200">
                        {defaultRate}
                      </span>
                      <span className="text-xs font-medium">{t('points / request', '积分 / 次')}</span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                      {t('For unconfigured kernels', '适用于未单独配置的内核')}
                    </div>
                  </div>
                </div>
              </div>

              <div
                ref={scrollAreaRef}
                className="min-h-0 flex-1 overscroll-contain overflow-y-auto px-4 py-3 sm:px-6 sm:py-4"
              >
                <div className="overflow-hidden rounded-xl border border-border/80">
                  <table className="w-full table-fixed text-left text-sm">
                    <thead className="sticky top-0 z-10 bg-muted/95 text-[10px] uppercase tracking-[0.1em] text-muted-foreground backdrop-blur">
                      <tr className="border-b border-border">
                        <th className="w-[22%] px-2 py-2.5 font-semibold sm:w-24 sm:px-4">
                          {t('Category', '类别')}
                        </th>
                        <th className="px-2 py-2.5 font-semibold sm:px-4">{t('Kernel', '内核名')}</th>
                        <th className="w-[16%] px-2 py-2.5 font-semibold sm:w-20 sm:px-4">
                          {t('Language', '语言')}
                        </th>
                        <th
                          className="w-[24%] px-2 py-2.5 text-right font-semibold sm:w-28 sm:px-4"
                          aria-sort="descending"
                        >
                          <span className="inline-flex items-center justify-end gap-1">
                            {t('Points / request', '积分 / 次')}
                            <ArrowDown className="size-3" aria-hidden="true" />
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rates.map((rate) => {
                        const category = kernelCategoryLabel(rate.category, rate.pointsPerRequest);
                        return (
                          <tr key={rate.coreType} className="border-b border-border/60">
                            <td className="break-words px-2 py-2.5 text-xs font-medium sm:px-4">
                              {t(category.en, category.zh)}
                            </td>
                            <td className="px-2 py-2.5 sm:px-4">
                              <code className="break-all font-mono text-[11px] font-medium text-foreground">
                                {rate.coreType}
                              </code>
                            </td>
                            <td className="px-2 py-2.5 sm:px-4">
                              <span className="inline-flex min-w-8 justify-center rounded-md border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                {kernelLanguage(rate.language, rate.coreType)}
                              </span>
                            </td>
                            <td className="px-2 py-2.5 text-right sm:px-4">
                              <span className={pointRateBadgeClassName(rate.pointsPerRequest, defaultRate)}>
                                {rate.pointsPerRequest}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="last:border-0">
                        <td className="break-words px-2 py-2.5 text-xs font-medium text-muted-foreground sm:px-4">
                          {t(defaultCategory.en, defaultCategory.zh)}
                        </td>
                        <td className="px-2 py-2.5 text-xs text-muted-foreground sm:px-4">
                          {t('All unconfigured kernels', '其他未配置内核')}
                        </td>
                        <td className="px-2 py-2.5 sm:px-4">
                          <span className="inline-flex min-w-8 justify-center rounded-md border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                            —
                          </span>
                        </td>
                        <td className="px-2 py-2.5 text-right sm:px-4">
                          <span className={pointRateBadgeClassName(defaultRate, defaultRate)}>
                            {defaultRate}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {rates.length === 0 ? (
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    {t(
                      'No CoreType-specific rates are currently published — every request deducts the default rate above.',
                      '当前没有生效的 CoreType 专项费率——所有请求均按上方默认费率扣分。',
                    )}
                  </p>
                ) : null}
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
