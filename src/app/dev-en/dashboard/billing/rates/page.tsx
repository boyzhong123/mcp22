'use client';

import Link from 'next/link';
import { Check, Shield, Sparkles, TrendingDown, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  formatCallRate,
  formatCents,
  getAccountCallsThisMonth,
  getAccountSavingsThisMonthCents,
  getAccountSpendThisMonthCents,
  getCurrentVolumeTier,
  MCP_CALL_RATE_PER_K,
  VOLUME_TIERS,
} from '../../../_lib/mock-store';
import { useMockStore } from '../../../_lib/use-mock-store';
import { useLang } from '../../../_lib/use-lang';

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
  const currentTier = useMockStore(getCurrentVolumeTier, VOLUME_TIERS[0]);
  const { t, tx } = useLang();

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
              ' you fund with credits at the per-1K rates below. No daily caps, no subscriptions — volume discounts apply automatically.',
              ' 上，按下方每千次调用费率以预付余额计费。无每日上限，无订阅 — 批量折扣自动应用。',
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
          <Mini label={tx('Current tier')} value={currentTier.label} />
        </div>
      </div>

      {/* MCP call pricing — single flat rate */}
      <div className="rounded-2xl border border-border bg-background overflow-hidden">
        <div className="px-5 py-4 border-b border-border/60">
          <div className="text-sm font-semibold">{tx('MCP call rate')}</div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {tx('Charged per 1,000 successful MCP calls. Errors (4xx/5xx) are not billed.')}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-5">
          <div className="min-w-0">
            <div className="text-sm font-medium">{tx('Per successful call')}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {t(
                'A single flat rate for every MCP tool invocation — no model tiers, no surprises.',
                '每次 MCP 工具调用统一计费 — 无模型分层，透明简单。',
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold tabular-nums">
              {formatCallRate(MCP_CALL_RATE_PER_K)}
            </div>
            <div className="text-[11px] text-muted-foreground">{tx('Base rate · USD')}</div>
          </div>
        </div>
      </div>

      {/* Volume tiers */}
      <div className="rounded-2xl border border-border bg-background overflow-hidden">
        <div className="px-5 py-4 border-b border-border/60">
          <div className="text-sm font-semibold">{tx('Automatic volume discounts')}</div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {tx('Applied in real-time as your monthly call volume crosses each threshold.')}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-2.5">{tx('Calls per month')}</th>
                <th className="text-left px-5 py-2.5">{tx('Effective savings')}</th>
                <th className="text-right px-5 py-2.5">{tx('Status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {VOLUME_TIERS.map((t) => {
                const isCurrent = t === currentTier;
                return (
                  <tr key={t.label} className={cn(isCurrent && 'bg-foreground/[0.03]')}>
                    <td className="px-5 py-3 text-sm font-medium">{t.label}</td>
                    <td className="px-5 py-3 text-sm">
                      {t.discount === null ? (
                        <span className="text-muted-foreground">{tx('Custom — contact sales')}</span>
                      ) : t.discount === 0 ? (
                        <span className="text-muted-foreground">{tx('Base rates')}</span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          {(t.discount * 100).toFixed(0)}% {tx('off base rate')}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {isCurrent ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-foreground text-background text-[10px] font-semibold uppercase tracking-wider">
                          {tx('Current tier')}
                        </span>
                      ) : t.discount === null ? (
                        <Link
                          href="#contact-sales"
                          className="text-[11px] font-medium text-muted-foreground hover:text-foreground"
                        >
                          {tx('Contact sales →')}
                        </Link>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
