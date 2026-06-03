'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  CreditCard,
  HelpCircle,
  ReceiptText,
  Sparkles,
  Wallet,
} from 'lucide-react';
import {
  formatCalls,
  formatCents,
  getAccountBalanceCents,
  getAccountCallsThisMonth,
  getAccountSpendThisMonthMills,
  getKeyMonthlyCalls,
  getTransactions,
  getUsage,
  getWallet,
  listPaidKeys,
  type AccountWallet,
  type ApiKey,
  type Transaction,
  type UsagePoint,
} from '../../_lib/mock-store';
import { useMockStore } from '../../_lib/use-mock-store';
import { formatMills } from '../../_lib/format';
import { AccountWalletStrip } from '../../_components/account-wallet-strip';
import { StatCard } from '../../_components/stat-card';
import { StripeCheckoutModal } from '../../_components/stripe-checkout-modal';
import { useLang } from '../../_lib/use-lang';

const DEFAULT_WALLET: AccountWallet = {
  paidCreditsCents: 0,
  paidCreditsUsedCents: 0,
};

export default function BillingPage() {
  const { t, tx } = useLang();
  const usage = useMockStore(getUsage, [] as UsagePoint[]);
  // Starter keys are excluded from every view on this page — the freebie
  // has no balance and no billable spend, so mixing it in with paid keys
  // only confuses totals and charts. The starter gets its own dedicated
  // card on the API Keys page.
  const keys = useMockStore(listPaidKeys, [] as ApiKey[]);
  const transactions = useMockStore(getTransactions, [] as Transaction[]);
  const spendThisMonth = useMockStore(getAccountSpendThisMonthMills, 0);
  const callsThisMonth = useMockStore(getAccountCallsThisMonth, 0);
  const wallet = useMockStore(getWallet, DEFAULT_WALLET);
  const balanceCents = useMockStore(getAccountBalanceCents, 0);

  const [addCreditsOpen, setAddCreditsOpen] = useState(false);

  // Legacy deep-link: `/dashboard/billing?edit=spend-limit` used to
  // open the inline cap modal. The cap UI now lives at /dashboard/limits,
  // so we redirect there transparently if the param is present.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('edit') !== 'spend-limit') return;
    window.location.replace('/dashboard/limits');
  }, []);

  // Per-key spend this month (month-to-date), for the Credit balances table.
  // We slice the usage array down to current-month rows once and tally.
  const spendByKeyThisMonth = useMemo(() => {
    const now = new Date();
    const ym = now.toISOString().slice(0, 7); // "YYYY-MM"
    const m = new Map<string, number>();
    for (const p of usage) {
      if (!p.date.startsWith(ym)) continue;
      m.set(p.keyId, (m.get(p.keyId) ?? 0) + p.costMills);
    }
    return m;
  }, [usage]);

  // Per-key MTD calls — the wallet model removes per-key balances, but
  // "how much is each key consuming?" remains a critical question.
  const callsByKeyThisMonth = useMemo(() => {
    const m = new Map<string, number>();
    for (const k of keys) m.set(k.id, getKeyMonthlyCalls(k.id));
    return m;
  }, [keys]);

  const activeKeyCount = useMemo(
    () => keys.filter((k) => k.status === 'active').length,
    [keys],
  );

  const recentTopUps = useMemo(
    () =>
      transactions
        .filter((t) => t.kind === 'credit-topup' && t.status === 'succeeded')
        .slice(0, 3),
    [transactions],
  );

  // Rank: active keys first, ordered by this month's call volume so the
  // hottest workloads sit on top. Revoked sinks to the bottom.
  const sortedKeys = useMemo(() => {
    return [...keys].sort((a, b) => {
      const aRevoked = a.status === 'revoked' ? 1 : 0;
      const bRevoked = b.status === 'revoked' ? 1 : 0;
      if (aRevoked !== bRevoked) return aRevoked - bRevoked;
      const ac = callsByKeyThisMonth.get(a.id) ?? 0;
      const bc = callsByKeyThisMonth.get(b.id) ?? 0;
      return bc - ac;
    });
  }, [keys, callsByKeyThisMonth]);

  const openAddCredits = () => setAddCreditsOpen(true);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-[-0.01em]">
            {t('Billing', '账单')}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t(
              'One wallet shared across every key. Top-ups unlock every key on the account at once.',
              '所有 Key 共享一个钱包。一次充值即可解锁全部 Key。',
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={openAddCredits}
          className="group inline-flex h-10 items-center gap-2 rounded-xl border border-[#4fc9a3]/25 bg-gradient-to-r from-[#10233f] via-[#123047] to-[#153d4c] px-2.5 pr-3.5 text-sm font-semibold text-white shadow-[0_9px_20px_-11px_rgba(13,86,91,0.9)] transition-all hover:-translate-y-px hover:border-[#72dbbd]/45 hover:from-[#132b4b] hover:via-[#15384f] hover:to-[#174b54] hover:shadow-[0_13px_24px_-12px_rgba(24,131,120,0.85)] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5ed7b2]/55 focus-visible:ring-offset-2"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#5ed7b2]/18 text-[#9aefd5] ring-1 ring-[#8be4c9]/30 transition-colors group-hover:bg-[#5ed7b2]/25">
            <Wallet className="h-3.5 w-3.5" strokeWidth={2.5} />
          </span>
          <span>{t('Add credits', '充值')}</span>
          <ArrowUpRight className="h-3.5 w-3.5 text-[#a8ead7]/75 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#c4f4e6]" />
        </button>
      </div>

      {/* Account wallet hero — same component used on Overview/Keys, the
           single canonical "where am I in money + trial?" surface. */}
      <AccountWalletStrip onAddCredits={openAddCredits} />

      {/* KPI strip — money-only. Calls / trial-allowance metrics live on
           Overview & Usage pages; this page is about $$ in / $$ out, so we
           keep the trio focused on spend dynamics and runway. */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard
          icon={Wallet}
          label={t('Account balance', '账户余额')}
          value={formatCents(balanceCents)}
          sub={t(
            'Shared by every key on this account',
            '所有 Key 共享同一余额',
          )}
        />
        <StatCard
          icon={ReceiptText}
          label={t('Spent this month', '本月消费')}
          value={formatMills(spendThisMonth)}
          sub={t(
            `${formatCalls(callsThisMonth)} calls billed`,
            `产生 ${formatCalls(callsThisMonth)} 次调用`,
          )}
        />
        <StatCard
          icon={CreditCard}
          label={t('Lifetime topped up', '累计充值')}
          value={formatCents(wallet.paidCreditsCents)}
          sub={t(
            'Total loaded into the shared wallet',
            '累计充值到共享钱包的金额',
          )}
        />
      </div>


      {/* Per-key spend breakdown — pure money view. Cap-related chrome
           (progress bars, /limit suffixes, per-key spend caps subtext)
           lives on the API Keys page; here we show only what each key
           cost this month. */}
      <div className="rounded-2xl border border-border bg-background overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold flex items-center gap-2">
              <Wallet className="h-4 w-4" /> {t('Spend by key (this month)', '本月各 Key 消费明细')}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t(
                'Every key drains the same wallet — this list shows MTD calls and dollar spend per key.',
                '所有 Key 共用同一钱包；下方按 Key 展示本月调用次数与消费金额。',
              )}
            </p>
          </div>
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {t(
              `${activeKeyCount} active key${activeKeyCount === 1 ? '' : 's'}`,
              `${activeKeyCount} 把活跃 Key`,
            )}
          </span>
        </div>
        {sortedKeys.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            {t(
              "No keys yet. Create one on the API Keys page — your free trial unlocks automatically.",
              '尚无 Key。前往 API Keys 页面创建即可，免费试用次数自动解锁。',
            )}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {sortedKeys.map((k) => {
              const monthCalls = callsByKeyThisMonth.get(k.id) ?? 0;
              const monthSpend = spendByKeyThisMonth.get(k.id) ?? 0;
              const revoked = k.status === 'revoked';

              return (
                <li
                  key={k.id}
                  className="px-5 py-3 flex flex-wrap items-center gap-3"
                >
                  <div className="flex-1 min-w-[140px] text-sm font-medium flex items-center gap-2">
                    <span className="truncate">{k.name}</span>
                    {revoked && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase tracking-wider">
                        {tx('Revoked')}
                      </span>
                    )}
                  </div>

                  <div className="min-w-[120px] font-mono text-[11px] text-muted-foreground truncate">
                    {k.maskedSecret.slice(-12)}
                  </div>

                  <div className="min-w-[120px] text-right">
                    <div className="text-sm font-semibold tabular-nums">
                      {formatMills(monthSpend)}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {tx('Spend MTD')}
                    </div>
                  </div>

                  <div className="min-w-[110px] text-right">
                    <div className="text-sm tabular-nums text-muted-foreground">
                      {formatCalls(monthCalls)}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {t('calls', '次调用')}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Recent top-ups preview */}
      <div className="rounded-2xl border border-border bg-background p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold flex items-center gap-2">
            <ReceiptText className="h-4 w-4" /> {tx('Recent top-ups')}
          </div>
          <Link
            href="/dashboard/billing/history"
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            {tx('View full history')} →
          </Link>
        </div>
        {recentTopUps.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground">
            {tx('No successful top-ups yet. Your first credit purchase will appear here.')}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {recentTopUps.map((t) => {
              const k = t.keyId ? keys.find((kk) => kk.id === t.keyId) : undefined;
              return (
                <li key={t.id} className="py-2.5 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {t.description}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {new Date(t.createdAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                      {k && ` · ${k.name}`}
                      {t.last4 && ` · •••• ${t.last4}`}
                    </div>
                  </div>
                  <div className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                    +{formatCents(t.amountCents)}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground leading-relaxed flex items-start gap-1.5">
        <HelpCircle className="h-3 w-3 mt-0.5 shrink-0" />
        {tx('Payment receipts are emailed to the receipt email on your account. Billing currency is USD.')}
      </p>

      {/* Modals */}
      <StripeCheckoutModal
        open={addCreditsOpen}
        onClose={() => setAddCreditsOpen(false)}
      />
    </div>
  );
}
