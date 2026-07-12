'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  CalendarClock,
  ChevronDown,
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
  getAccountEvaluationPoints,
  getAccountLifetimeEvaluationPoints,
  getAccountSpendThisMonthMills,
  getKeyMonthlyCalls,
  getTransactions,
  getEvaluationPointBatches,
  getUsage,
  getWallet,
  listKeys,
  type AccountWallet,
  type ApiKey,
  type EvaluationPointBatch,
  type Transaction,
  type UsagePoint,
} from '../../_lib/mock-store';
import { useMockStore } from '../../_lib/use-mock-store';
import { formatMills } from '../../_lib/format';
import {
  millsToWalletPoints,
} from '../../_lib/topup';
import { AccountWalletStrip } from '../../_components/account-wallet-strip';
import { StatCard } from '../../_components/stat-card';
import { StripeCheckoutModal } from '../../_components/stripe-checkout-modal';
import { useLang } from '../../_lib/use-lang';

const DEFAULT_WALLET: AccountWallet = {
  paidEvaluationPoints: 0,
  usedEvaluationPoints: 0,
  paidCreditsCents: 0,
  paidCreditsUsedCents: 0,
};

export default function BillingPage() {
  const { t, tx, lang } = useLang();
  const usage = useMockStore(getUsage, [] as UsagePoint[]);
  const keys = useMockStore(listKeys, [] as ApiKey[]);
  const transactions = useMockStore(getTransactions, [] as Transaction[]);
  const pointBatches = useMockStore(getEvaluationPointBatches, [] as EvaluationPointBatch[]);
  const spendThisMonth = useMockStore(getAccountSpendThisMonthMills, 0);
  const callsThisMonth = useMockStore(getAccountCallsThisMonth, 0);
  const wallet = useMockStore(getWallet, DEFAULT_WALLET);
  const balanceCents = useMockStore(getAccountBalanceCents, 0);
  const evaluationPoints = useMockStore(getAccountEvaluationPoints, 0);
  const lifetimeEvaluationPoints = useMockStore(getAccountLifetimeEvaluationPoints, 0);

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
              'All keys share one pool of evaluation points. One top-up unlocks every key.',
              '所有 Key 共享同一评测积分。一次充值即可解锁全部 Key。',
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
          <span>{t('Add points', '充值')}</span>
          <ArrowUpRight className="h-3.5 w-3.5 text-[#a8ead7]/75 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#c4f4e6]" />
        </button>
      </div>

      {/* Account wallet hero — same component used on Overview/Keys, the
           single canonical "where am I in money + trial?" surface. */}
      <AccountWalletStrip onAddCredits={openAddCredits} />

      {/* KPI strip — points-first. Dollar amounts only as secondary "worth". */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard
          icon={Sparkles}
          label={t('Points remaining', '剩余评测积分')}
          value={evaluationPoints.toLocaleString('en-US')}
          sub={t(
            `Worth ${formatCents(balanceCents)} · shared by every key`,
            `价值 ${formatCents(balanceCents)} · 所有 Key 共享`,
          )}
        />
        <StatCard
          icon={ReceiptText}
          label={t('Spent this month', '本月消耗')}
          value={millsToWalletPoints(spendThisMonth).toLocaleString('en-US')}
          sub={t(
            `${formatCalls(callsThisMonth)} calls · worth ${formatMills(spendThisMonth)}`,
            `${formatCalls(callsThisMonth)} 次调用 · 价值 ${formatMills(spendThisMonth)}`,
          )}
        />
        <StatCard
          icon={CreditCard}
          label={t('Lifetime points credited', '累计到账积分')}
          value={lifetimeEvaluationPoints.toLocaleString('en-US')}
          sub={t(
            `${wallet.usedEvaluationPoints.toLocaleString('en-US')} points used · worth ${formatCents(wallet.paidCreditsCents)} paid`,
            `已使用 ${wallet.usedEvaluationPoints.toLocaleString('en-US')} 积分 · 累计支付价值 ${formatCents(wallet.paidCreditsCents)}`,
          )}
        />
      </div>

      <PointExpiryBreakdown batches={pointBatches} lang={lang} t={t} />


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
            {tx('No successful top-ups yet. Your first points purchase will appear here.')}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {recentTopUps.map((transaction) => {
              const k = transaction.keyId ? keys.find((kk) => kk.id === transaction.keyId) : undefined;
              return (
                <li key={transaction.id} className="py-2.5 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {transaction.description}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {new Date(transaction.createdAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                      {k && ` · ${k.name}`}
                      {transaction.last4 && ` · •••• ${transaction.last4}`}
                    </div>
                  </div>
                  <div className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                    +{(transaction.creditedPoints ?? 0).toLocaleString('en-US')} {t('pts', '积分')}
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

function PointExpiryBreakdown({
  batches,
  lang,
  t,
}: {
  batches: EvaluationPointBatch[];
  lang: string;
  t: (en: string, zh: string) => string;
}) {
  const [expanded, setExpanded] = useState(false);
  const now = Date.now();
  const activeBatches = useMemo(
    () =>
      batches.filter(
        (batch) =>
          batch.status === 'active' &&
          batch.remainingPoints > 0 &&
          Date.parse(batch.expiresAt) > now,
      ),
    [batches, now],
  );
  const availablePoints = activeBatches.reduce(
    (total, batch) => total + batch.remainingPoints,
    0,
  );
  const nextExpiry = activeBatches[0];
  const locale = lang === 'zh' ? 'zh-CN' : 'en-US';
  const daysUntilNextExpiry = nextExpiry
    ? Math.max(0, Math.ceil((Date.parse(nextExpiry.expiresAt) - now) / 86400000))
    : 0;
  const colors = ['bg-sky-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500'];

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-background">
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-700 dark:text-sky-300">
            <CalendarClock className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold">
              {t('Point balance by expiry', '按有效期查看积分余额')}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {nextExpiry
                ? t(
                    `${nextExpiry.remainingPoints.toLocaleString('en-US')} points expire in ${daysUntilNextExpiry} days. Points are used from the earliest-expiring batch first.`,
                    `${nextExpiry.remainingPoints.toLocaleString('en-US')} 积分将在 ${daysUntilNextExpiry} 天后到期；调用时优先扣除最早到期批次。`,
                  )
                : t(
                    'No active paid point batches.',
                    '当前没有可用的付费积分批次。',
                  )}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-semibold transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          aria-expanded={expanded}
        >
          {expanded ? t('Hide details', '收起明细') : t('View details', '查看明细')}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <div className="border-y border-border bg-muted/[0.16] px-5 py-4">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            {t('Available point distribution', '可用积分分布')}
          </span>
          <span className="text-sm font-semibold tabular-nums">
            {availablePoints.toLocaleString('en-US')} {t('pts', '积分')}
          </span>
        </div>
        <div
          className="flex h-3 overflow-hidden rounded-full bg-muted"
          role="img"
          aria-label={t('Available points grouped by expiry', '按到期日划分的可用积分')}
        >
          {activeBatches.map((batch, index) => {
            const width = availablePoints > 0 ? (batch.remainingPoints / availablePoints) * 100 : 0;
            return (
              <div
                key={batch.id}
                className={`${colors[index % colors.length]} min-w-[3px] border-r border-background/70 last:border-r-0`}
                style={{ width: `${width}%` }}
                title={`${batch.remainingPoints.toLocaleString('en-US')} ${t('pts', '积分')} · ${new Date(batch.expiresAt).toLocaleDateString(locale)}`}
              />
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
          {activeBatches.map((batch, index) => (
            <span key={batch.id} className="inline-flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-sm ${colors[index % colors.length]}`} />
              {new Date(batch.expiresAt).toLocaleDateString(locale, { month: 'short', day: 'numeric' })}
              {' · '}
              {batch.remainingPoints.toLocaleString('en-US')}
            </span>
          ))}
        </div>
      </div>

      {expanded && (
        <div className="divide-y divide-border">
          {activeBatches.map((batch, index) => {
            const daysLeft = Math.max(0, Math.ceil((Date.parse(batch.expiresAt) - now) / 86400000));
            return (
              <div key={batch.id} className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-3.5">
                <span className={`h-2.5 w-2.5 rounded-full ${colors[index % colors.length]}`} />
                <div className="min-w-[150px] flex-1">
                  <p className="text-sm font-medium">
                    {packageLabel(batch.packageId, t)} · {t('recharge batch', '充值批次')}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {t('Credited', '到账')} {batch.creditedPoints.toLocaleString('en-US')} {t('pts', '积分')}
                    {' · '}
                    {t('Used', '已用')} {batch.usedPoints.toLocaleString('en-US')} {t('pts', '积分')}
                  </p>
                </div>
                <div className="min-w-[130px] text-right">
                  <p className="text-sm font-semibold tabular-nums">
                    {batch.remainingPoints.toLocaleString('en-US')} {t('pts', '积分')}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {t('Valid through', '有效期至')} {new Date(batch.expiresAt).toLocaleDateString(locale)}
                    {' · '}
                    {t(`${daysLeft}d left`, `剩余 ${daysLeft} 天`)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function packageLabel(
  packageId: EvaluationPointBatch['packageId'],
  t: (en: string, zh: string) => string,
) {
  if (packageId === 'advanced') return t('Advanced', '高级');
  if (packageId === 'flagship') return t('Flagship', '旗舰');
  return t('Standard', '标准');
}
