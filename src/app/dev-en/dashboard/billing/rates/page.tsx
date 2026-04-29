'use client';

import Link from 'next/link';
import { Check, Shield, Sparkles, TrendingDown, Users, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  formatCalls,
  formatCents,
  getAccountCallsThisMonth,
  getAccountSavingsThisMonthCents,
  getAccountSpendThisMonthCents,
} from '../../../_lib/mock-store';
import { useMockStore } from '../../../_lib/use-mock-store';
import { useLang } from '../../../_lib/use-lang';
import {
  CALL_TIERS,
  formatUnitPrice,
  priceForCalls,
  tierRangeLabel,
} from '../../../_lib/pricing';

const ALL_PLANS_INCLUDE = [
  { icon: Shield, text: 'Global edge delivery · TLS 1.3 encryption at rest & in flight' },
  { icon: Sparkles, text: 'MCP protocol over stdio and HTTP streaming' },
  { icon: TrendingDown, text: 'Usage analytics, per-key spend caps, and CSV export' },
  { icon: Users, text: 'Unlimited team members · SSO (SAML / OIDC) on request' },
];

export default function PricingPage() {
  const calls = useMockStore(getAccountCallsThisMonth, 0);
  const spend = useMockStore(getAccountSpendThisMonthCents, 0);
  const savings = useMockStore(getAccountSavingsThisMonthCents, 0);
  const { t, tx } = useLang();

  // Rate that this month's call volume would land at if it were a single
  // top-up — used for the "Current rate" mini card so the user sees what
  // discount tier their usage corresponds to.
  const currentQuote = priceForCalls(Math.max(1, calls));
  const currentTierLabel =
    currentQuote.tierIndex === 0
      ? tierRangeLabel(0)
      : `${tierRangeLabel(currentQuote.tierIndex)}`;

  return (
    <div className="space-y-6">
      {/* Pay-as-you-go hero */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-indigo-500/[0.05] via-transparent to-emerald-500/[0.05] p-6">
        <div className="max-w-xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5" /> {tx('Pay-as-you-go')}
          </div>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">
            {tx('Only pay for what you ship')}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t('Every account gets one ', '每个账号都可以获得一个')}
            <strong className="text-foreground">{tx('free starter key')}</strong>
            {t(
              ' — 30 calls/day, 900 total lifetime — for learning and sandboxing. Production workloads run on ',
              ' — 每天 30 次调用，总计 900 次 — 用于学习和沙盒测试。生产工作负载运行在 ',
            )}
            <strong className="text-foreground">{tx('paid keys')}</strong>
            {t(
              ' you top up by purchasing calls at the flat per-call rates below. No daily caps, no subscriptions — bigger top-ups land you on a cheaper tier automatically.',
              ' 上，通过下方阶梯单价购买调用次数。无每日上限，无订阅 — 一次性购买的次数越多，单价越低。',
            )}
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          <Mini label={tx('Calls this month')} value={calls.toLocaleString('en-US')} />
          <Mini label={tx('Net cost')} value={formatCents(spend)} />
          <Mini
            label={tx('Savings')}
            value={formatCents(savings)}
            tone="emerald"
          />
          <Mini
            label={t('Current rate', '当前单价')}
            value={formatUnitPrice(currentQuote.unitCents)}
          />
        </div>
      </div>

      {/* Per-call tiered pricing — the new flat-tier model. */}
      <div className="rounded-2xl border border-border bg-background overflow-hidden">
        <div className="px-5 py-4 border-b border-border/60">
          <div className="text-sm font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            {t('Per-call pricing', '按次定价')}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t(
              'Pick how many calls to buy when you top up — the entire purchase is billed at the single tier your call count lands in. No marginal math, no monthly minimums.',
              '充值时选择购买次数 — 整笔订单按你所选次数所在的档位单价计费。不分段计算，无月度最低消费。',
            )}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-2.5">{t('Tier', '档位')}</th>
                <th className="text-left px-5 py-2.5">{t('Calls per top-up', '单次充值次数')}</th>
                <th className="text-left px-5 py-2.5">{t('Per call', '单价')}</th>
                <th className="text-right px-5 py-2.5">{t('Example', '示例')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {CALL_TIERS.map((tier, i) => {
                const exampleCalls =
                  i === 0 ? 500 : i === 1 ? 5000 : 25000;
                const exampleQuote = priceForCalls(exampleCalls);
                const isCurrent = i === currentQuote.tierIndex;
                const baseUnit = CALL_TIERS[0].unitCents;
                const savedPct = Math.round(((baseUnit - tier.unitCents) / baseUnit) * 100);
                return (
                  <tr key={i} className={cn(isCurrent && 'bg-foreground/[0.03]')}>
                    <td className="px-5 py-3 text-sm font-medium tabular-nums">
                      <span
                        className={cn(
                          'inline-flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-bold mr-2',
                          isCurrent
                            ? 'bg-foreground text-background'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {i + 1}
                      </span>
                      {i === 0
                        ? t('Standard', '标准价')
                        : i === 1
                          ? t('Volume', '批量价')
                          : t('Bulk', '大批量价')}
                    </td>
                    <td className="px-5 py-3 text-sm tabular-nums">{tierRangeLabel(i)}</td>
                    <td className="px-5 py-3 text-sm">
                      <span className="font-mono font-semibold tabular-nums">
                        {formatUnitPrice(tier.unitCents)}
                      </span>
                      {savedPct > 0 && (
                        <span className="ml-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                          −{savedPct}%
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right text-xs text-muted-foreground tabular-nums">
                      {formatCalls(exampleCalls)} × {formatUnitPrice(tier.unitCents)} ={' '}
                      <strong className="text-foreground font-semibold">
                        {formatCents(exampleQuote.totalCents)}
                      </strong>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-border/60 bg-muted/20 text-[11px] text-muted-foreground leading-relaxed flex items-start gap-1.5">
          <TrendingDown className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>
            {t(
              'Pick a quantity that lands in the next tier and the whole purchase prices at that lower rate — buying 1,000 calls saves you 25% per call vs. buying 999.',
              '选择刚好达到下一档的数量，整笔订单都会按更低单价计费 — 一次买 1,000 次比买 999 次每次便宜 25%。',
            )}
          </span>
        </div>
      </div>

      {/* All plans include */}
      <div className="rounded-2xl border border-border bg-background p-5">
        <div className="text-sm font-semibold">{tx('All accounts include')}</div>
        <ul className="mt-3 grid sm:grid-cols-2 gap-3">
          {ALL_PLANS_INCLUDE.map((row) => (
            <li key={row.text} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>{tx(row.text)}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-[11px] text-muted-foreground text-center">
        {tx(
          'Pricing subject to change with 30 days notice. Commercial terms and invoiced billing are available for annual commitments starting at $10K.',
        )}
      </p>
    </div>
  );
}

function Mini({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'default' | 'emerald';
}) {
  return (
    <div className="rounded-lg bg-background border border-border px-3 py-2">
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          'mt-0.5 text-sm font-semibold tabular-nums',
          tone === 'emerald' && 'text-emerald-600 dark:text-emerald-400',
        )}
      >
        {value}
      </div>
    </div>
  );
}
