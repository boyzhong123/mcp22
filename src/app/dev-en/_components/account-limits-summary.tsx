'use client';

import Link from 'next/link';
import { ArrowRight, CircleDollarSign, Gauge, Zap } from 'lucide-react';
import {
  formatCalls,
  formatCents,
  getSpendLimit,
  type SpendLimit,
} from '../_lib/mock-store';
import { useMockStore } from '../_lib/use-mock-store';
import { useLang } from '../_lib/use-lang';

const EMPTY_LIMIT: SpendLimit = {
  monthlyCapCents: null,
  monthlyCallCap: null,
  dailyCapCents: null,
  dailyCallCap: null,
  resetDay: 1,
  warnAtPercents: [50, 75, 90],
};

/**
 * Read-only summary of the four account-level caps (daily / monthly ×
 * spend / calls). Designed for display surfaces (API Keys page) — the
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
      icon: CircleDollarSign,
      label: t('Daily spend', '每日消费'),
      value:
        limit.dailyCapCents != null
          ? `${formatCents(limit.dailyCapCents)} / ${t('day', '天')}`
          : t('Unlimited', '不限'),
      on: limit.dailyCapCents != null,
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
      icon: CircleDollarSign,
      label: t('Monthly spend', '月度消费'),
      value:
        limit.monthlyCapCents != null
          ? `${formatCents(limit.monthlyCapCents)} / ${t('mo', '月')}`
          : t('Unlimited', '不限'),
      on: limit.monthlyCapCents != null,
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
                'No daily or monthly caps configured — every key uses the wallet without a ceiling.',
                '尚未配置日 / 月上限——所有 Key 仅受钱包余额限制。',
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

  return (
    <Link
      href="/dashboard/limits"
      className={`group rounded-xl border border-border bg-background hover:bg-muted/20 transition-colors block ${className ?? ''}`}
    >
      <div className="px-4 py-3 flex items-center justify-between gap-3 border-b border-border/60">
        <div className="flex items-center gap-2 min-w-0">
          <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            {t('Account limits', '账户上限')}
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground group-hover:text-foreground inline-flex items-center gap-1 shrink-0">
          {t('Manage', '管理')}
          <ArrowRight className="h-3 w-3" />
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-border/60">
        {cells.map((c) => (
          <div key={c.label} className="px-4 py-2.5">
            <div className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
              <c.icon className="h-3 w-3" />
              {c.label}
            </div>
            <div
              className={`mt-0.5 text-[12.5px] font-semibold tabular-nums ${
                c.on ? 'text-foreground' : 'text-muted-foreground'
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
