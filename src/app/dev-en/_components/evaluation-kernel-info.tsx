'use client';

import { ArrowUpRight, Info, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ModalPortal } from './modal-portal';
import { useLang } from '../_lib/use-lang';
import { useBillingPricing } from '../_lib/use-billing-pricing';

interface EvaluationKernelInfoProps {
  className?: string;
}

/**
 * "How points are deducted" info dialog. CoreType rates are dynamic and
 * server-configured (`GET /billing/pricing` → `core_type_rates[]`); anything
 * not specifically configured deducts `default_points_per_request`. An empty
 * rate list is a normal state, not an error.
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
  // Distinct configured rates, for the summary chips (max 2 + default chip).
  const topRates = rates.slice(0, 2);

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
                <div className={cn('grid gap-2', topRates.length > 0 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1')}>
                  {topRates.map((rate) => (
                    <div
                      key={rate.coreType}
                      className="flex items-center gap-3 rounded-xl border border-foreground/20 bg-foreground/[0.035] px-3 py-2.5"
                    >
                      <span className="text-2xl font-semibold tabular-nums tracking-tight">
                        {rate.pointsPerRequest}
                      </span>
                      <div className="min-w-0">
                        <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          {t('points / request', '积分 / 次')}
                        </div>
                        <div className="mt-0.5 truncate text-xs font-medium" title={rate.coreType}>
                          {rate.displayName}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5">
                    <span className="text-2xl font-semibold tabular-nums tracking-tight">{defaultRate}</span>
                    <div className="min-w-0">
                      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        {t('points / request', '积分 / 次')}
                      </div>
                      <div className="mt-0.5 truncate text-xs font-medium">
                        {t('Default (unconfigured CoreTypes)', '默认（未单独配置）')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                ref={scrollAreaRef}
                className="min-h-0 flex-1 overscroll-contain overflow-y-auto px-4 py-3 sm:px-6 sm:py-4"
              >
                <div className="overflow-hidden rounded-xl border border-border/80">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 z-10 bg-muted/95 text-[10px] uppercase tracking-[0.1em] text-muted-foreground backdrop-blur">
                      <tr className="border-b border-border">
                        <th className="px-4 py-2.5 font-semibold">{t('CoreType', 'CoreType')}</th>
                        <th className="px-4 py-2.5 font-semibold">{t('Display name', '显示名')}</th>
                        <th className="w-28 px-4 py-2.5 text-right font-semibold">
                          {t('Points / request', '积分 / 次')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rates.map((rate) => (
                        <tr key={rate.coreType} className="border-b border-border/60">
                          <td className="px-4 py-2.5">
                            <code className="break-all font-mono text-[11px] font-medium text-foreground">
                              {rate.coreType}
                            </code>
                          </td>
                          <td className="px-4 py-2.5 text-xs">{rate.displayName}</td>
                          <td className="px-4 py-2.5 text-right">
                            <span className="inline-flex min-w-7 justify-center rounded-md border border-foreground bg-foreground px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-background">
                              {rate.pointsPerRequest}
                            </span>
                          </td>
                        </tr>
                      ))}
                      <tr className="last:border-0">
                        <td className="px-4 py-2.5">
                          <span className="text-xs text-muted-foreground">
                            {t('All other CoreTypes', '其余所有 CoreType')}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">
                          {t('Default rate', '默认费率')}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <span className="inline-flex min-w-7 justify-center rounded-md border border-border bg-muted/35 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground">
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
