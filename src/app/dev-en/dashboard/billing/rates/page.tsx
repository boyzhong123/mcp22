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
import {
  BASE_POINTS_PER_USD,
  PARAGRAPH_POINTS_PER_USE,
  TOPUP_BONUS_TIERS,
  TRIAL_CALLS,
  TRIAL_VALID_DAYS,
  WORD_SENTENCE_POINTS_PER_USE,
  formatBonusPercent,
  formatEvaluationUnitDollars,
  getEvaluationUnitPrices,
  getTopupPointMath,
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
 * Every account draws from one shared point pool. Dollars only exist at
 * checkout: a top-up converts to base points ($1 = 250) plus the package
 * bonus (see `_lib/topup.ts`, authoritative source: GET /billing/pricing).
 */
export default function PricingPage() {
  const { t, tx } = useLang();
  const calls = useMockStore(getAccountCallsThisMonth, 0);
  const spendMills = useMockStore(getAccountSpendThisMonthMills, 0);
  const points = useMockStore(getAccountEvaluationPoints, 0);

  // Example row: $150 on the Advanced package (matches the billing doc).
  const example = getTopupPointMath(15_000, TOPUP_BONUS_TIERS[1]);
  const spentPointsThisMonth = Math.round((spendMills / 1000) * BASE_POINTS_PER_USD);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-gradient-to-br from-indigo-500/[0.05] via-transparent to-emerald-500/[0.05] p-6">
        <div className="max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5" /> {t('Evaluation points', '评测积分')}
          </div>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">
            {t(
              'Top up once, then deduct by evaluation type',
              '充值评测积分，按评测对象扣分',
            )}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t('Every account starts with ', '每个账户开通后即获 ')}
            <strong className="text-foreground">
              {t(
                `${TRIAL_CALLS} free points`,
                `${TRIAL_CALLS} 免费评测积分`,
              )}
            </strong>
            {t(
              ` (valid for ${TRIAL_VALID_DAYS} days), shared across every API key. Paid top-ups also go into this shared point pool. `,
              `（${TRIAL_VALID_DAYS} 天内有效），所有 API Key 共享。后续购买的积分也进入同一个共享积分池。`,
            )}
            <strong className="text-foreground">
              {t(
                'There is no separate balance for each key.',
                '无需为每个 Key 单独充值或维护额度。',
              )}
            </strong>
            {t(
              ' Points are deducted only after a successful evaluation; failed or errored calls do not deduct points.',
              '仅评测成功后扣分，失败或报错的调用不扣分。',
            )}
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-[0.9fr_1.1fr_1.1fr]">
          <Mini
            label={t('Available points', '可用评测积分')}
            value={points.toLocaleString('en-US')}
            hint={t('Shared across every API key', '账户内所有 API Key 共享')}
            tone="emerald"
            icon={Wallet}
          />
          <EvaluationCostCard
            icon={Type}
            label={t('Character, word, phrase & sentence', '字、词、句评测')}
            points={WORD_SENTENCE_POINTS_PER_USE}
            hint={t('Each successful evaluation', '每次成功评测')}
            unitLabel={t('points / use', '积分 / 次')}
            tone="sky"
          />
          <EvaluationCostCard
            icon={AlignLeft}
            label={t('Paragraph evaluation', '段落评测')}
            points={PARAGRAPH_POINTS_PER_USE}
            hint={t('2× character / word / sentence usage', '消耗为字、词、句评测的 2 倍')}
            unitLabel={t('points / use', '积分 / 次')}
            tone="amber"
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            {t('Successful evaluations only', '仅成功评测扣分')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <KeyRound className="h-3.5 w-3.5 text-indigo-500" />
            {t('One shared point pool for all keys', '所有 Key 共用一个积分池')}
          </span>
          <span className="tabular-nums">
            {t(
              `${spentPointsThisMonth.toLocaleString('en-US')} points across ${calls.toLocaleString('en-US')} successful evaluations this month`,
              `本月 ${calls.toLocaleString('en-US')} 次成功评测，共消耗 ${spentPointsThisMonth.toLocaleString('en-US')} 积分`,
            )}
          </span>
        </div>
      </div>

      {/* Packages & published unit prices — the contractual display values,
          not point-derived estimates. Server (GET /billing/pricing) is
          authoritative once connected. */}
      <div className="rounded-2xl border border-border bg-background overflow-hidden">
        <div className="px-5 py-4 border-b border-border/60">
          <div className="text-sm font-semibold flex items-center gap-2">
            <Gift className="h-4 w-4 text-emerald-500" />
            {t('Packages & published unit prices', '套餐与公布单价')}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t(
              'Higher packages include more bonus points, so each evaluation costs less.',
              '档位越高赠送越多，折算到每次评测越便宜。',
            )}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-2.5">{t('Package', '套餐')}</th>
                <th className="text-left px-5 py-2.5">{t('Minimum top-up', '最低充值')}</th>
                <th className="text-left px-5 py-2.5">{t('Bonus points', '赠送')}</th>
                <th className="text-right px-5 py-2.5">
                  {t('Character / word / sentence', '字、词、句单价')}
                </th>
                <th className="text-right px-5 py-2.5">{t('Paragraph', '段落单价')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr className="bg-sky-500/[0.04]">
                <td className="px-5 py-3 font-medium">{t('Free trial', '免费试用')}</td>
                <td className="px-5 py-3 text-muted-foreground">$0</td>
                <td className="px-5 py-3 text-muted-foreground">
                  {t(
                    `${TRIAL_CALLS} pts · ${TRIAL_VALID_DAYS} days`,
                    `送 ${TRIAL_CALLS} 分 · ${TRIAL_VALID_DAYS} 天`,
                  )}
                </td>
                <td className="px-5 py-3 text-right text-muted-foreground" colSpan={2}>
                  {t(
                    `${WORD_SENTENCE_POINTS_PER_USE} pt / word or sentence · ${PARAGRAPH_POINTS_PER_USE} pts / paragraph`,
                    `字、词、句每次 ${WORD_SENTENCE_POINTS_PER_USE} 分 · 段落每次 ${PARAGRAPH_POINTS_PER_USE} 分`,
                  )}
                </td>
              </tr>
              {TOPUP_BONUS_TIERS.map((tier) => {
                const unit = getEvaluationUnitPrices(tier.id);
                const recommended = tier.id === 'advanced';
                return (
                  <tr
                    key={tier.id}
                    className={cn(
                      recommended &&
                        'bg-emerald-500/[0.06] ring-1 ring-inset ring-emerald-500/20',
                    )}
                  >
                    <td className="px-5 py-3 font-medium">
                      {t(PACKAGE_LABELS[tier.id].en, PACKAGE_LABELS[tier.id].zh)}
                      {recommended && (
                        <span className="ml-2 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                          {t('Recommended', '推荐')}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 tabular-nums text-muted-foreground">
                      {formatCents(tier.minCents)}
                    </td>
                    <td className="px-5 py-3 font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                      {formatBonusPercent(tier.bonusPct)}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold tabular-nums">
                      {formatEvaluationUnitDollars(unit.wordSentenceDollars)}
                      <span className="text-[10px] font-normal text-muted-foreground">
                        /{t('use', '次')}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold tabular-nums">
                      {formatEvaluationUnitDollars(unit.paragraphDollars)}
                      <span className="text-[10px] font-normal text-muted-foreground">
                        /{t('use', '次')}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-border/60 bg-muted/15 text-[11px] text-muted-foreground leading-relaxed">
          {t(
            'Published unit prices are contractual display values; points are the billing source of truth. Bonus percentages, packages, and validity come from the server pricing endpoint.',
            '公布单价为合同展示价，实际计费以积分为准。赠送比例、档位与有效期以服务端定价接口为准。',
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-background overflow-hidden">
        <div className="px-5 py-4 border-b border-border/60">
          <div className="text-sm font-semibold flex items-center gap-2">
            <Wallet className="h-4 w-4 text-emerald-500" />
            {t('Point rules', '积分规则')}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t(
              'Every top-up credits one point batch into the shared account pool.',
              '每笔充值生成一个积分批次，充进账号共享池。',
            )}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-2.5">{t('Item', '项目')}</th>
                <th className="text-left px-5 py-2.5">{t('Rule', '规则')}</th>
                <th className="text-right px-5 py-2.5">{t('Value', '数值')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="px-5 py-3 font-medium">{t('Conversion', '换算')}</td>
                <td className="px-5 py-3 text-muted-foreground">
                  {t('Base points, before bonus', '基础积分，赠送另计')}
                </td>
                <td className="px-5 py-3 text-right font-semibold tabular-nums">
                  $1 → {BASE_POINTS_PER_USD} {t('pts', '分')}
                </td>
              </tr>
              <tr>
                <td className="px-5 py-3 font-medium">{t('Deduction', '扣减')}</td>
                <td className="px-5 py-3 text-muted-foreground">
                  {t('Successful evaluations only', '仅评测成功时')}
                </td>
                <td className="px-5 py-3 text-right font-semibold tabular-nums">
                  {t(
                    `Character / word / sentence −${WORD_SENTENCE_POINTS_PER_USE} · paragraph −${PARAGRAPH_POINTS_PER_USE}`,
                    `字、词、句 −${WORD_SENTENCE_POINTS_PER_USE} · 段落 −${PARAGRAPH_POINTS_PER_USE}`,
                  )}
                </td>
              </tr>
              <tr>
                <td className="px-5 py-3 font-medium">{t('Validity', '有效期')}</td>
                <td className="px-5 py-3 text-muted-foreground">
                  {t(
                    'Per top-up batch · earliest-expiring batch deducts first',
                    '每笔充值独立计时 · 先扣最早到期批次',
                  )}
                </td>
                <td className="px-5 py-3 text-right font-semibold tabular-nums">
                  {TRIAL_VALID_DAYS} {t('days', '天')}
                </td>
              </tr>
              <tr>
                <td className="px-5 py-3 font-medium">{t('Example', '示例')}</td>
                <td className="px-5 py-3 text-muted-foreground">
                  {t('$150 on Advanced (+10%)', '高级版充 $150（+10%）')}
                </td>
                <td className="px-5 py-3 text-right font-semibold tabular-nums">
                  {example.basePoints.toLocaleString('en-US')} + {example.bonusPoints.toLocaleString('en-US')} ={' '}
                  {example.totalPoints.toLocaleString('en-US')} {t('pts', '分')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-border/60 bg-muted/20 text-[11px] text-muted-foreground leading-relaxed flex items-start gap-1.5">
          <Wallet className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>
            {t(
              'Every key on your account draws from the same point pool.',
              '账户内所有 Key 共用同一积分池。',
            )}
          </span>
        </div>
      </div>

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
          'Pricing subject to change with 30 days notice. Commercial terms are available for annual commitments starting at $10K.',
        )}
      </p>
    </div>
  );
}

function Mini({
  label,
  value,
  hint,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'default' | 'emerald';
  icon?: typeof Wallet;
}) {
  return (
    <div className="rounded-lg bg-background border border-border px-3 py-2">
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        <span>{label}</span>
      </div>
      <div
        className={cn(
          'mt-0.5 text-sm font-semibold tabular-nums',
          tone === 'emerald' && 'text-emerald-600 dark:text-emerald-400',
        )}
      >
        {value}
      </div>
      {hint && (
        <div className="mt-0.5 text-[10.5px] text-muted-foreground tabular-nums">
          {hint}
        </div>
      )}
    </div>
  );
}

function EvaluationCostCard({
  icon: Icon,
  label,
  points,
  hint,
  unitLabel,
  tone,
}: {
  icon: typeof Type;
  label: string;
  points: number;
  hint: string;
  unitLabel: string;
  tone: 'sky' | 'amber';
}) {
  return (
    <div
      className={cn(
        'rounded-xl border px-4 py-3',
        tone === 'sky'
          ? 'border-sky-500/20 bg-sky-500/[0.05]'
          : 'border-amber-500/20 bg-amber-500/[0.05]',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
              tone === 'sky'
                ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300'
                : 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <div className="text-xs font-semibold leading-tight">{label}</div>
            <div className="mt-0.5 text-[10.5px] text-muted-foreground">{hint}</div>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-xl font-bold tabular-nums leading-none">{points}</div>
          <div className="mt-1 text-[10px] font-medium text-muted-foreground">{unitLabel}</div>
        </div>
      </div>
    </div>
  );
}
