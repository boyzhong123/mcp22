'use client';

import Link from 'next/link';
import { ArrowRight, Gauge, Sparkles, Zap } from 'lucide-react';
import {
  formatCalls,
  getSpendLimit,
  type SpendLimit,
} from '../_lib/mock-store';
import { useMockStore } from '../_lib/use-mock-store';
import { useLang } from '../_lib/use-lang';

const EMPTY_LIMIT: SpendLimit = {
  monthlyPointCap: null,
  monthlyCallCap: null,
  dailyPointCap: null,
  dailyCallCap: null,
  resetDay: 1,
  warnAtPercents: [50, 75, 90],
};

/**
 * Read-only summary of the four account-level caps (daily / monthly ×
 * evaluation points / calls). Designed for display surfaces (API Keys page) — the
 * actual editor lives at `/dashboard/limits`. The whole card is a link
 * so users can drill into the editor with one click.
 *
 * When *no* caps are configured, we render a compact "Set limits" CTA
 * row instead of four "Unlimited" pills, which would just be visual
 * noise.
 */
export function AccountLimitsSummary({ className }: { className?: string }) {
  const { t } = useLang();
  const limit = useMockStore(getSpendLimit, EMPTY_LIMIT);

  const cells: { label: string; value: string; icon: typeof Gauge; on: boolean }[] = [
    {
      icon: Sparkles,
      label: t('Daily points', '每日积分'),
      value:
        limit.dailyPointCap != null
          ? `${formatCalls(limit.dailyPointCap)} ${t('points', '积分')} / ${t('day', '天')}`
          : t('Unlimited', '不限'),
      on: limit.dailyPointCap != null,
    },
    {
      icon: Zap,
      label: t('Daily calls', '每日调用'),
      value:
        limit.dailyCallCap != null
          ? `${formatCalls(limit.dailyCallCap)} / ${t('day', '天')}`
          : t('Unlimited', '不限'),
      on: limit.dailyCallCap != null,
    },
    {
      icon: Sparkles,
      label: t('Monthly points', '月度积分'),
      value:
        limit.monthlyPointCap != null
          ? `${formatCalls(limit.monthlyPointCap)} ${t('points', '积分')} / ${t('mo', '月')}`
          : t('Unlimited', '不限'),
      on: limit.monthlyPointCap != null,
    },
    {
      icon: Zap,
      label: t('Monthly calls', '月度调用'),
      value:
        limit.monthlyCallCap != null
          ? `${formatCalls(limit.monthlyCallCap)} / ${t('mo', '月')}`
          : t('Unlimited', '不限'),
      on: limit.monthlyCallCap != null,
    },
  ];

  const anyOn = cells.some((c) => c.on);

  // Compact CTA when nothing configured — keeps the Keys page from
  // dedicating real estate to four "Unlimited" placeholder cells.
  if (!anyOn) {
    return (
      <Link
        href="/dashboard/limits"
        className={`group rounded-xl border border-dashed border-border bg-muted/10 hover:bg-muted/20 px-4 py-3 flex items-center justify-between gap-3 transition-colors ${className ?? ''}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-background border border-border flex items-center justify-center shrink-0">
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium">
              {t('Account limits', '账户上限')}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {t(
                'No daily or monthly caps configured — every key draws from the shared point pool without a ceiling.',
                '尚未配置日 / 月上限——所有 Key 共享评测积分池，未设置调用或积分上限。',
              )}
            </p>
          </div>
        </div>
        <span className="text-xs text-muted-foreground group-hover:text-foreground inline-flex items-center gap-1 shrink-0">
          {t('Set limits', '设置上限')}
          <ArrowRight className="h-3 w-3" />
        </span>
      </Link>
    );
  }

  const activeCount = cells.filter((c) => c.on).length;

  return (
    <Link
      href="/dashboard/limits"
      className={`group rounded-2xl border border-border bg-card hover:border-foreground/20 hover:shadow-sm transition-all block overflow-hidden ${className ?? ''}`}
    >
      <div className="px-5 pt-4 pb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold leading-tight">
              {t('Account limits', '账户上限')}
            </div>
            <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">
              {t(
                `${activeCount} of 4 caps active`,
                `已启用 ${activeCount} / 4 项上限`,
              )}
            </div>
          </div>
        </div>
        <span className="text-xs text-muted-foreground group-hover:text-foreground inline-flex items-center gap-1 shrink-0 transition-colors">
          {t('Manage', '管理')}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 px-3 pb-3">
        {cells.map((c) => (
          <div
            key={c.label}
            className={`rounded-xl px-3.5 py-3 transition-colors ${
              c.on
                ? 'bg-muted/60 ring-1 ring-inset ring-border'
                : 'bg-transparent'
            }`}
          >
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <c.icon
                className={`h-3.5 w-3.5 shrink-0 ${
                  c.on ? 'text-foreground' : 'text-muted-foreground/70'
                }`}
              />
              <span className="truncate">{c.label}</span>
            </div>
            <div
              className={`mt-1.5 text-sm font-semibold tabular-nums ${
                c.on ? 'text-foreground' : 'text-muted-foreground/60'
              }`}
            >
              {c.value}
            </div>
          </div>
        ))}
      </div>
    </Link>
  );
}
