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
  getAccountSpendThisMonthMills,
} from '../../../_lib/mock-store';
import { useMockStore } from '../../../_lib/use-mock-store';
import { useLang } from '../../../_lib/use-lang';
import { useBillingPricing } from '../../../_lib/use-billing-pricing';
import { previewQuotedPoints } from '../../../_lib/billing-pricing';
import {
  TOPUP_BONUS_TIERS,
  formatBonusPercent,
  formatEvaluationUnitDollars,
  getEvaluationUnitPrices,
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
 * Prefers GET /billing/pricing when available; local topup.ts is Demo fallback.
 */
export default function PricingPage() {
  const { t, tx } = useLang();
  const { catalog } = useBillingPricing();
  const calls = useMockStore(getAccountCallsThisMonth, 0);
  const spendMills = useMockStore(getAccountSpendThisMonthMills, 0);
  const points = useMockStore(getAccountEvaluationPoints, 0);

  const packages = catalog.packages.length ? catalog.packages : TOPUP_BONUS_TIERS;
  const advanced = packages.find((p) => p.id === 'advanced') ?? packages[1] ?? packages[0];
  const exampleAmount = advanced?.presetCents[1] ?? advanced?.minCents ?? 15_000;
  const example = previewQuotedPoints(catalog, exampleAmount, advanced.id);
  const spentPointsThisMonth = Math.round(
    (spendMills / 1000) * catalog.rules.basePointsPerUsd,
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
              `Base ${catalog.rules.basePointsPerUsd} pts per $1 · word/phrase/sentence ${catalog.rules.wordSentencePointsPerUse} pt · paragraph ${catalog.rules.paragraphPointsPerUse} pts · valid ${catalog.rules.validDays} days. Credited points for a payment come from the server quote.`,
              `每 $1 基础 ${catalog.rules.basePointsPerUsd} 积分 · 字/词/句 ${catalog.rules.wordSentencePointsPerUse} 分 · 段落 ${catalog.rules.paragraphPointsPerUse} 分 · 有效期 ${catalog.rules.validDays} 天。正式到账积分以服务端报价为准。`,
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
          <h3 className="text-sm font-semibold">{t('Top-up packages', '充值套餐')}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t(
              'Minimums, bonus %, and presets come from GET /billing/pricing.',
              '最低金额、赠送比例与预设档位来自 GET /billing/pricing。',
            )}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 font-semibold">{t('Package', '套餐')}</th>
                <th className="px-5 py-3 font-semibold">{t('Min top-up', '最低充值')}</th>
                <th className="px-5 py-3 font-semibold">{t('Bonus', '赠送')}</th>
                <th className="px-5 py-3 font-semibold">{t('Presets', '预设金额')}</th>
                <th className="px-5 py-3 font-semibold">{t('Ref. unit price', '参考单价')}</th>
              </tr>
            </thead>
            <tbody>
              {packages.map((pkg) => {
                const unit = getEvaluationUnitPrices(pkg.id);
                const label = PACKAGE_LABELS[pkg.id];
                return (
                  <tr key={pkg.id} className="border-b border-border/70 last:border-0">
                    <td className="px-5 py-3 font-medium">{t(label.en, label.zh)}</td>
                    <td className="px-5 py-3 tabular-nums">{formatCents(pkg.minCents)}</td>
                    <td className="px-5 py-3 tabular-nums">
                      {pkg.bonusPct > 0 ? (
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                          {formatBonusPercent(pkg.bonusPct)}
                        </span>
                      ) : (
                        t('Base', '基准')
                      )}
                    </td>
                    <td className="px-5 py-3 tabular-nums text-muted-foreground">
                      {pkg.presetCents.map((c) => formatCents(c)).join(' · ')}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {formatEvaluationUnitDollars(unit.wordSentenceDollars)} /{' '}
                      {formatEvaluationUnitDollars(unit.paragraphDollars)}
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
          <ul className="text-sm text-muted-foreground space-y-1.5">
            <li className="flex gap-2">
              <Check className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              {t(
                `Word / phrase / sentence: ${catalog.rules.wordSentencePointsPerUse} pt each`,
                `字 / 词 / 句：每次 ${catalog.rules.wordSentencePointsPerUse} 积分`,
              )}
            </li>
            <li className="flex gap-2">
              <AlignLeft className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              {t(
                `Paragraph: ${catalog.rules.paragraphPointsPerUse} pts each`,
                `段落：每次 ${catalog.rules.paragraphPointsPerUse} 积分`,
              )}
            </li>
            <li className="flex gap-2">
              <Wallet className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              {t(
                `Valid ${catalog.rules.validDays} days · FIFO by earliest expiry`,
                `有效期 ${catalog.rules.validDays} 天 · 最早到期优先扣减`,
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
              `${catalog.trialCalls.toLocaleString('en-US')} points for ${catalog.trialDays} days at signup, shared by every key.`,
              `注册赠送 ${catalog.trialCalls.toLocaleString('en-US')} 积分，有效 ${catalog.trialDays} 天，全账号 Key 共享。`,
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
