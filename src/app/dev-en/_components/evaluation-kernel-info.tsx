'use client';

import { ArrowDown, ArrowUpRight, Info, LoaderCircle, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ModalPortal } from './modal-portal';
import { kernelCategoryLabel } from '../_lib/kernel-category';
import { kernelLanguage } from '../_lib/kernel-language';
import { useLang } from '../_lib/use-lang';
import { useEvaluationKernelDetails } from '../_lib/use-evaluation-kernel-details';

interface EvaluationKernelInfoProps {
  className?: string;
  trigger?: 'icon' | 'button';
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
export function EvaluationKernelInfo({
  className,
  trigger = 'icon',
}: EvaluationKernelInfoProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { t } = useLang();
  const { catalog, load, loaded, loading } = useEvaluationKernelDetails();

  const rates = catalog.coreTypeRates;
  const defaultRate = catalog.defaultPointsPerRequest;
  // The final row is a pricing fallback, not an uncatalogued real kernel.
  // Label it as a rule so it is not mistaken for missing Catalog metadata.
  const defaultCategory = { en: 'Default rule', zh: '默认规则' };
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

  const openDetails = () => {
    setOpen(true);
    void load();
  };

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
      {trigger === 'button' ? (
        <Button
          ref={triggerRef}
          type="button"
          variant="outline"
          size="sm"
          className={cn('h-7 gap-1.5 rounded-lg px-2.5 text-xs', className)}
          onClick={openDetails}
        >
          <Info className="size-3.5" />
          {t('View details', '查看详细')}
        </Button>
      ) : (
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
            'View kernel point deduction rates',
            '查看内核扣分费率',
          )}
          onClick={openDetails}
        >
          <Info className="size-3" strokeWidth={1.65} />
        </Button>
      )}

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
                      {t('Kernel names and point deductions', '内核名与积分扣除')}
                    </h2>
                    <p id={descriptionId} className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {t(
                        'Rates come from the current server pricing version. Kernel names are case-sensitive; anything without a specific rate deducts the default per request.',
                        '费率来自服务端当前定价版本。内核名区分大小写；未单独配置的内核按默认费率每次扣分。',
                      )}
                    </p>
                    <p className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                      {loading || !loaded ? (
                        <>
                          <LoaderCircle className="size-3 animate-spin" />
                          {t('Reading the latest point rules…', '正在读取最新积分规则…')}
                        </>
                      ) : catalog.kernelDetailsFromServer ? (
                        <>
                          <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
                          {t('Latest rules loaded from the server', '已读取服务端最新积分规则')}
                        </>
                      ) : (
                        <>
                          <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
                          {t('Latest Demo reference rules', '当前最新 Demo 参考规则')}
                        </>
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
                      {loading || !loaded ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-10 text-center text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-2">
                              <LoaderCircle className="size-4 animate-spin" />
                              {t('Loading kernel rates…', '正在加载内核费率…')}
                            </span>
                          </td>
                        </tr>
                      ) : rates.map((rate) => {
                        const category = kernelCategoryLabel(
                          rate.categoryCode,
                          rate.categoryName || rate.category,
                        );
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
                                {kernelLanguage(rate.language)}
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
                      {!loading && loaded ? (
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
                      ) : null}
                    </tbody>
                  </table>
                </div>
                {rates.length === 0 ? (
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    {t(
                      'No kernel-specific rates are currently published — every request deducts the default rate above.',
                      '当前没有生效的内核专项费率——所有请求均按上方默认费率扣分。',
                    )}
                  </p>
                ) : null}
              </div>

              <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border/70 bg-muted/20 px-4 py-3 sm:px-6">
                <p className="text-[10px] leading-relaxed text-muted-foreground sm:text-xs">
                  {t(
                    'Recorded usage is billed per request. Billing status describes point coverage, not the evaluation result.',
                    '已上报的用量按请求扣分；计费状态只表示积分覆盖情况，不代表评测成功或失败。',
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
