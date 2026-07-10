'use client';

import { Check, Shield, Sparkles, TrendingDown, Wallet } from 'lucide-react';
import { PricingTierLadder } from '../../../_components/pricing-tier-ladder';
import { cn } from '@/lib/utils';
import {
  formatCents,
  getAccountBalanceCents,
  getAccountCallsThisMonth,
  getAccountSpendThisMonthMills,
} from '../../../_lib/mock-store';
import { useMockStore } from '../../../_lib/use-mock-store';
import { formatMills } from '../../../_lib/format';
import { useLang } from '../../../_lib/use-lang';
import {
  BASE_UNIT_CENTS,
  BEST_UNIT_CENTS,
  MIN_TOPUP_CENTS,
  TOPUP_PRESETS_CENTS,
  TRIAL_CALLS,
  TRIAL_VALID_DAYS,
  formatBaseWalletPoints,
  formatCallsRange,
  formatUnitDollars,
} from '../../../_lib/topup';

const ALL_PLANS_INCLUDE = [
  { icon: Shield, text: 'Global edge delivery · TLS 1.3 encryption at rest & in flight' },
  { icon: Sparkles, text: 'MCP protocol over stdio and HTTP streaming' },
  { icon: TrendingDown, text: 'Usage analytics, per-key spend caps, and CSV export' },
];

/**
 * Pricing reference page for the wallet-billing model.
 *
 * Every account uses one shared wallet; the per-call rate is tiered by
 * monthly call volume (see `_lib/topup.ts`). A top-up loads the same dollar
 * amount into the wallet.
 */
export default function PricingPage() {
  const { t, tx } = useLang();
  const calls = useMockStore(getAccountCallsThisMonth, 0);
  const spend = useMockStore(getAccountSpendThisMonthMills, 0);
  const balance = useMockStore(getAccountBalanceCents, 0);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-gradient-to-br from-indigo-500/[0.05] via-transparent to-emerald-500/[0.05] p-6">
        <div className="max-w-xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5" /> {tx('Pay-as-you-go')}
          </div>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">
            {t('One wallet · pay only for what you ship', '一个钱包 · 用多少花多少')}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t('Every account starts with ', '每个账户开通后即获 ')}
            <strong className="text-foreground">
              {t(
                `${TRIAL_CALLS} free trial calls`,
                `${TRIAL_CALLS} 次免费试用`,
              )}
            </strong>
            {t(
              ` (valid for ${TRIAL_VALID_DAYS} days), shared across every API key. After the time window ends or the calls are used up, calls bill against a single account wallet at `,
              `（${TRIAL_VALID_DAYS} 天内有效），所有 API Key 共享。到期或次数用完后，所有调用统一从账户钱包按 `,
            )}
            <strong className="text-foreground">
              {t(
                `${formatUnitDollars(BEST_UNIT_CENTS)}–${formatUnitDollars(BASE_UNIT_CENTS)}/call (tiered by monthly usage)`,
                `${formatUnitDollars(BEST_UNIT_CENTS)}–${formatUnitDollars(BASE_UNIT_CENTS)}/次（按月用量阶梯）`,
              )}
            </strong>
            {t(
              ' — no subscriptions and no per-key billing balance.',
              ' 计费 — 无订阅，也无需为每个 Key 单独维护余额。',
            )}
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          <Mini label={tx('Calls this month')} value={calls.toLocaleString('en-US')} />
          <Mini
            label={t('Evaluation points', '评测积分')}
            value={formatBaseWalletPoints(balance)}
            hint={t(`Worth ${formatCents(balance)}`, `价值 ${formatCents(balance)}`)}
          />
          <Mini label={tx('Net cost')} value={formatMills(spend)} />
        </div>
      </div>

      <PricingTierLadder
        variant="card"
        callsThisMonth={calls}
        className="rounded-2xl"
      />
      <p className="text-[11px] text-muted-foreground leading-relaxed -mt-3 px-1">
        {t(
          'Only successful calls are billed — failed calls are free.',
          '仅对成功调用计费 — 失败的调用不收费。',
        )}
      </p>

      <div className="rounded-2xl border border-border bg-background overflow-hidden">
        <div className="px-5 py-4 border-b border-border/60">
          <div className="text-sm font-semibold flex items-center gap-2">
            <Wallet className="h-4 w-4 text-emerald-500" />
            {t('Top-up rules', '充值规则')}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t(
              'Top up any supported amount and the same amount lands in the shared wallet.',
              '选择任一支持的充值金额，同等金额会直接进入共享钱包。',
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
                <td className="px-5 py-3 font-medium">{t('Minimum top-up', '最低充值')}</td>
                <td className="px-5 py-3 text-muted-foreground">{t('Account wallet', '账户钱包')}</td>
                <td className="px-5 py-3 text-right font-semibold tabular-nums">
                  {formatCents(MIN_TOPUP_CENTS)}
                </td>
              </tr>
              <tr>
                <td className="px-5 py-3 font-medium">{t('Top-up options', '充值选项')}</td>
                <td className="px-5 py-3 text-muted-foreground">{t('Preset amounts', '预设金额')}</td>
                <td className="px-5 py-3 text-right font-semibold tabular-nums">
                  {TOPUP_PRESETS_CENTS.map((cents) => formatCents(cents)).join(' / ')}
                </td>
              </tr>
              <tr>
                <td className="px-5 py-3 font-medium">{t('Example', '示例')}</td>
                <td className="px-5 py-3 text-muted-foreground">{t('$50 top-up', '充值 $50')}</td>
                <td className="px-5 py-3 text-right font-semibold tabular-nums">
                  ≈ {formatCallsRange(5000)} {t('calls', '次调用')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-border/60 bg-muted/20 text-[11px] text-muted-foreground leading-relaxed flex items-start gap-1.5">
          <Wallet className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>
            {t(
              'Every key on your account spends from the same wallet.',
              '账户内所有 Key 共用同一钱包。',
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
}: {
  label: string;
  value: string;
  hint?: string;
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
      {hint && (
        <div className="mt-0.5 text-[10.5px] text-muted-foreground tabular-nums">
          {hint}
        </div>
      )}
    </div>
  );
}
