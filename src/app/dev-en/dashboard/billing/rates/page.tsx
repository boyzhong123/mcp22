'use client';

import { Check, Shield, Sparkles, TrendingDown, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  formatCalls,
  formatCents,
  getAccountBalanceCents,
  getAccountCallsThisMonth,
  getAccountSpendThisMonthCents,
} from '../../../_lib/mock-store';
import { useMockStore } from '../../../_lib/use-mock-store';
import { useLang } from '../../../_lib/use-lang';
import {
  TOPUP_TIERS,
  callsForAmount,
  quoteTopup,
} from '../../../_lib/topup-bonus';

const ALL_PLANS_INCLUDE = [
  { icon: Shield, text: 'Global edge delivery · TLS 1.3 encryption at rest & in flight' },
  { icon: Sparkles, text: 'MCP protocol over stdio and HTTP streaming' },
  { icon: TrendingDown, text: 'Usage analytics, per-key spend caps, and CSV export' },
];

/**
 * Pricing reference page for the wallet-billing model.
 *
 * The product is now a single per-call rate ($0.001/call → 0.1¢) backed by
 * one shared wallet. The "tiers" on this page are top-up bonus tiers — bigger
 * top-ups grant a percentage bonus on top of the loaded credit. Calls/$ is
 * the headline number we compare so customers can see at a glance how much
 * cheaper a $500 top-up is than a $20 one.
 */
export default function PricingPage() {
  const { t, tx } = useLang();
  const calls = useMockStore(getAccountCallsThisMonth, 0);
  const spend = useMockStore(getAccountSpendThisMonthCents, 0);
  const balance = useMockStore(getAccountBalanceCents, 0);

  return (
    <div className="space-y-6">
      {/* Pay-as-you-go hero */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-indigo-500/[0.05] via-transparent to-emerald-500/[0.05] p-6">
        <div className="max-w-xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5" /> {tx('Pay-as-you-go')}
          </div>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">
            {t('One wallet · pay only for what you ship', '一个钱包 · 用多少花多少')}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t(
              'Every account starts with ',
              '每个账户开通后即获 ',
            )}
            <strong className="text-foreground">
              {t('900 free trial calls', '900 次免费试用')}
            </strong>
            {t(
              ' (30/day · 900 lifetime), shared across every API key. After that, calls bill against a single account wallet at ',
              '（每天 30 次 · 终身 900 次），所有 API Key 共享。试用用完后，所有调用统一从账户钱包按 ',
            )}
            <strong className="text-foreground">
              {t('$0.001/call', '$0.001/次')}
            </strong>
            {t(
              ' — no subscriptions, no per-key tracking. Larger top-ups earn bigger bonuses; the table below shows what every dollar is worth.',
              ' 计费 — 无订阅，无需逐 Key 跟踪。一次充值越多，赠送越多 — 下表展示每一美元的价值。',
            )}
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          <Mini
            label={tx('Calls this month')}
            value={calls.toLocaleString('en-US')}
          />
          <Mini label={t('Wallet balance', '钱包余额')} value={formatCents(balance)} />
          <Mini label={tx('Net cost')} value={formatCents(spend)} />
        </div>
      </div>

      {/* Top-up bonus table */}
      <div className="rounded-2xl border border-border bg-background overflow-hidden">
        <div className="px-5 py-4 border-b border-border/60">
          <div className="text-sm font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            {t('Top-up bonus tiers', '充值满赠档位')}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t(
              'Pick how many dollars to load. Bigger top-ups earn a higher bonus, automatically applied at checkout. Calls per dollar shown after bonus.',
              '充值时选择金额，金额越大赠送越多，结算时自动应用。下表“每美元调用次数”均为含赠送后的换算。',
            )}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-2.5">{t('Tier', '档位')}</th>
                <th className="text-left px-5 py-2.5">
                  {t('Top-up amount', '充值金额')}
                </th>
                <th className="text-left px-5 py-2.5">{t('Bonus', '赠送')}</th>
                <th className="text-right px-5 py-2.5">
                  {t('You get', '到账')}
                </th>
                <th className="text-right px-5 py-2.5">
                  {t('Calls / $', '每美元调用')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {TOPUP_TIERS.map((tier, i) => {
                // Use the tier's threshold as the example amount, but the
                // first tier ("Starter", $0+) doesn't have a useful sample
                // at $0 — show the $20 minimum instead.
                const exampleCents = tier.minCents > 0 ? tier.minCents : 2000;
                const quote = quoteTopup(exampleCents);
                const baseCallsPerDollar = callsForAmount(2000) / 20;
                const callsPerDollar = quote.estimatedCalls / (exampleCents / 100);
                const upliftPct = baseCallsPerDollar > 0
                  ? Math.round(((callsPerDollar - baseCallsPerDollar) / baseCallsPerDollar) * 100)
                  : 0;

                return (
                  <tr key={i}>
                    <td className="px-5 py-3 text-sm font-medium">
                      <span
                        className={cn(
                          'inline-flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-bold mr-2 bg-muted text-muted-foreground',
                        )}
                      >
                        {i + 1}
                      </span>
                      {tier.label}
                    </td>
                    <td className="px-5 py-3 text-sm tabular-nums">
                      {formatCents(exampleCents)}
                      {i === 0 && (
                        <span className="ml-1 text-[10px] text-muted-foreground">
                          {t('(min)', '（起充）')}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-sm">
                      {tier.bonusPct > 0 ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">
                          +{Math.round(tier.bonusPct * 100)}% ·{' '}
                          {formatCents(quote.bonusCents)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          {t('No bonus', '无赠送')}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right text-sm tabular-nums">
                      <strong className="font-semibold">
                        {formatCents(quote.totalCents)}
                      </strong>
                      <div className="text-[11px] text-muted-foreground">
                        ≈ {formatCalls(quote.estimatedCalls)}{' '}
                        {t('calls', '次')}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right text-xs tabular-nums">
                      <strong className="text-foreground font-semibold">
                        {formatCalls(Math.round(callsPerDollar))}
                      </strong>
                      {upliftPct > 0 && (
                        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                          +{upliftPct}% {t('vs $20', '相对 $20')}
                        </div>
                      )}
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
              'Every key on your account spends from the same wallet. Bonus credits are non-refundable but never expire.',
              '账户内所有 Key 共用同一钱包。赠送余额不可退款，但永不过期。',
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
