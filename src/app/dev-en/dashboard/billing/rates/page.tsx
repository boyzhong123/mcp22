'use client';

import {
  AlignLeft,
  Check,
  CheckCircle2,
  Gift,
  KeyRound,
  Shield,
  Sparkles,
  TrendingDown,
  Type,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  formatCents,
  getAccountCallsThisMonth,
  getAccountEvaluationPoints,
  getUsage,
  type UsagePoint,
} from '../../../_lib/mock-store';
import { useMockStore } from '../../../_lib/use-mock-store';
import { useLang } from '../../../_lib/use-lang';
import { useBillingPricing } from '../../../_lib/use-billing-pricing';
import { formatTierAmountRange, previewQuotedPoints } from '../../../_lib/billing-pricing';
import { aggregateEvaluationUsage } from '../../../_lib/evaluation-usage';
import { EvaluationKernelInfo } from '../../../_components/evaluation-kernel-info';
import {
  TOPUP_BONUS_TIERS,
  formatBonusPercent,
  formatEvaluationUnitDollars,
} from '../../../_lib/topup';

const ALL_PLANS_INCLUDE = [
  { icon: Shield, text: 'Global edge delivery · TLS 1.3 encryption at rest & in flight' },
  { icon: Sparkles, text: 'MCP protocol over stdio and HTTP streaming' },
  { icon: TrendingDown, text: 'Usage analytics, per-key point caps, and CSV export' },
];

const PACKAGE_LABELS: Record<
  (typeof TOPUP_BONUS_TIERS)[number]['id'],
  { en: string; zh: string }
> = {
  standard: { en: 'Standard', zh: '标准版' },
  advanced: { en: 'Advanced', zh: '高级版' },
  flagship: { en: 'Flagship', zh: '旗舰版' },
};

/**
 * Pricing reference page for the evaluation-point billing model.
 *
 * Uses GET /billing/pricing for recharge tiers and the independent
 * GET /billing/core-type-pricing endpoint for deduction rules. Local topup.ts
 * is the Demo fallback.
 */
export default function PricingPage() {
  const { t, tx } = useLang();
  const { catalog } = useBillingPricing();
  const calls = useMockStore(getAccountCallsThisMonth, 0);
  const usage = useMockStore(getUsage, [] as UsagePoint[]);
  const points = useMockStore(getAccountEvaluationPoints, 0);

  const packages = catalog.packages.length ? catalog.packages : TOPUP_BONUS_TIERS;
  const advanced = packages.find((p) => p.id === 'advanced') ?? packages[1] ?? packages[0];
  const exampleAmount = advanced?.presetCents[1] ?? advanced?.minCents ?? 15_000;
  const example = previewQuotedPoints(catalog, exampleAmount, advanced.id);
  // Actually deducted points this month, from the usage rollup (never a
  // money-based derivation — the API is points-native).
  const ym = new Date().toISOString().slice(0, 7);
  const spentPointsThisMonth = aggregateEvaluationUsage(
    usage.filter((p) => p.date.startsWith(ym)),
  ).totalPoints;
  const baselinePointsPerUsd = Math.min(
    ...packages.map((p) => p.pointsPerUsd ?? Number.POSITIVE_INFINITY),
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-gradient-to-br from-indigo-500/[0.05] via-transparent to-emerald-500/[0.05] p-6">
        <div className="max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5" /> {t('Evaluation points', '评测积分')}
            {catalog.fromServer ? (
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 normal-case tracking-normal">
                {t('Live from API', '已接定价接口')}
              </span>
            ) : (
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400 normal-case tracking-normal">
                {t('Local fallback', '本地兜底规则')}
              </span>
            )}
          </div>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">
            {t(
              'Top up once, then deduct by evaluation type',
              '充值评测积分，按评测对象扣分',
            )}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {t(
              `From ${baselinePointsPerUsd} pts per $1 · default deduction ${catalog.defaultPointsPerRequest} pt per request · valid ${catalog.validDays} days. Credited points for a payment come from the server quote.`,
              `每 $1 ${baselinePointsPerUsd} 积分起 · 默认每次扣 ${catalog.defaultPointsPerRequest} 积分 · 有效期 ${catalog.validDays} 天。正式到账积分以服务端报价为准。`,
            )}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t('Points remaining', '剩余积分')}
          </div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">
            {points.toLocaleString('en-US')}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t('Used this month', '本月已用')}
          </div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">
            {spentPointsThisMonth.toLocaleString('en-US')}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {calls.toLocaleString('en-US')} {t('calls', '次调用')}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t('Example credit', '到账示例')}
          </div>
          <div className="mt-1 text-2xl font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
            {example.totalPoints.toLocaleString('en-US')}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {formatCents(exampleAmount)} · {PACKAGE_LABELS[advanced.id].en}
            {example.estimate ? ` · ${t('estimate', '预估')}` : ''}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-muted/30">
          <h3 className="text-sm font-semibold">{t('Current recharge tiers', '当前充值档位')}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t(
              'Amount ranges and points per USD from GET /billing/pricing. Discount-style labels are computed on the frontend.',
              '金额区间与每美元积分来自 GET /billing/pricing；折扣等展示文案由前端计算。',
            )}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 font-semibold">{t('Tier', '档位')}</th>
                <th className="px-5 py-3 font-semibold">{t('Amount range', '金额范围')}</th>
                <th className="px-5 py-3 font-semibold">{t('Points per USD', '每美元积分')}</th>
                <th className="px-5 py-3 font-semibold">{t('Display uplift', '展示增益')}</th>
                <th className="px-5 py-3 font-semibold">{t('Ref. unit price', '参考单价')}</th>
              </tr>
            </thead>
            <tbody>
              {packages.map((pkg) => {
                const label = PACKAGE_LABELS[pkg.id];
                const pts = pkg.pointsPerUsd ?? baselinePointsPerUsd;
                // Reference price of one default-rate request at this tier.
                const defaultRequestDollars =
                  pts > 0 ? catalog.defaultPointsPerRequest / pts : 0;
                return (
                  <tr key={pkg.id} className="border-b border-border/70 last:border-0">
                    <td className="px-5 py-3 font-medium">{t(label.en, label.zh)}</td>
                    <td className="px-5 py-3 tabular-nums">{formatTierAmountRange(pkg)}</td>
                    <td className="px-5 py-3 tabular-nums font-semibold">{pts}</td>
                    <td className="px-5 py-3 tabular-nums">
                      {pkg.bonusPct > 0 ? (
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                          {formatBonusPercent(pkg.bonusPct)}
                        </span>
                      ) : (
                        t('Base', '基准')
                      )}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {formatEvaluationUnitDollars(defaultRequestDollars)}{' '}
                      {t('/ request (default rate)', '/ 次（默认费率）')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Type className="h-4 w-4" />
            {t('Deduction rules', '扣分规则')}
          </div>
          <p className="text-xs text-muted-foreground">
            {t(
              'Current rates from GET /billing/core-type-pricing.',
              '当前费率来自 GET /billing/core-type-pricing。',
            )}
          </p>
          <ul className="text-sm text-muted-foreground space-y-1.5">
            {catalog.coreTypeRates.slice(0, 3).map((rate) => (
              <li key={rate.coreType} className="flex gap-2">
                <Check className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                <span>
                  {t(
                    `${rate.displayName}: ${rate.pointsPerRequest} pts per request`,
                    `${rate.displayName}：每次 ${rate.pointsPerRequest} 积分`,
                  )}
                </span>
                <EvaluationKernelInfo className="-my-1" />
              </li>
            ))}
            <li className="flex gap-2">
              <AlignLeft className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>
                {t(
                  `Other CoreTypes: default ${catalog.defaultPointsPerRequest} pt per request`,
                  `其余 CoreType：默认每次 ${catalog.defaultPointsPerRequest} 积分`,
                )}
              </span>
              <EvaluationKernelInfo className="-my-1" />
            </li>
            <li className="flex gap-2">
              <Wallet className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              {t(
                `Valid ${catalog.validDays} days · FIFO by earliest expiry`,
                `有效期 ${catalog.validDays} 天 · 最早到期优先扣减`,
              )}
            </li>
          </ul>
        </div>
        <div className="rounded-xl border border-border p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Gift className="h-4 w-4" />
            {t('Free trial', '免费试用')}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t(
              `${catalog.signupBonusPoints.toLocaleString('en-US')} points for ${catalog.signupBonusValidDays} days at signup, shared by every key.`,
              `注册赠送 ${catalog.signupBonusPoints.toLocaleString('en-US')} 积分，有效 ${catalog.signupBonusValidDays} 天，全账号 Key 共享。`,
            )}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
            <KeyRound className="h-3.5 w-3.5" />
            {tx('One top-up unlocks every key on the account.')}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {t(
              'Quoted points on order creation are authoritative.',
              '下单返回的 quoted_points 为正式到账依据。',
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-border p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          {t('Also included', '套餐均含')}
        </div>
        <ul className="grid gap-2 sm:grid-cols-3">
          {ALL_PLANS_INCLUDE.map((item) => (
            <li key={item.text} className="flex gap-2 text-xs text-muted-foreground">
              <item.icon className={cn('h-3.5 w-3.5 shrink-0 mt-0.5')} />
              {tx(item.text)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
