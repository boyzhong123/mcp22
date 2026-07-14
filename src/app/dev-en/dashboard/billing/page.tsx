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
  getAccountEvaluationPoints,
  getAccountLifetimeEvaluationPoints,
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
import {
  aggregateEvaluationUsage,
  aggregateEvaluationUsageByKey,
} from '../../_lib/evaluation-usage';
import { AccountWalletStrip } from '../../_components/account-wallet-strip';
import { StatCard } from '../../_components/stat-card';
import { StripeCheckoutModal } from '../../_components/stripe-checkout-modal';
import { EvaluationKernelInfo } from '../../_components/evaluation-kernel-info';
import { useLang } from '../../_lib/use-lang';
import {
  PARAGRAPH_POINTS_PER_USE,
  WORD_SENTENCE_POINTS_PER_USE,
} from '../../_lib/topup';
import { cn } from '@/lib/utils';

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
  const wallet = useMockStore(getWallet, DEFAULT_WALLET);
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

  const monthlyEvaluationUsage = useMemo(() => {
    const now = new Date();
    const ym = now.toISOString().slice(0, 7); // "YYYY-MM"
    return aggregateEvaluationUsage(usage.filter((point) => point.date.startsWith(ym)));
  }, [usage]);

  const usageByKeyThisMonth = useMemo(() => {
    const ym = new Date().toISOString().slice(0, 7);
    return aggregateEvaluationUsageByKey(usage.filter((point) => point.date.startsWith(ym)));
  }, [usage]);

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
      const ac = usageByKeyThisMonth.get(a.id)?.totalPoints ?? 0;
      const bc = usageByKeyThisMonth.get(b.id)?.totalPoints ?? 0;
      return bc - ac;
    });
  }, [keys, usageByKeyThisMonth]);

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

      {/* KPI strip — all product-facing availability is expressed in points. */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard
          icon={Sparkles}
          label={t('Points remaining', '剩余评测积分')}
          value={evaluationPoints.toLocaleString('en-US')}
          sub={t(
            'Shared by every key on this account',
            '所有 Key 共享',
          )}
        />
        <StatCard
          icon={ReceiptText}
          label={t('Evaluation points used this month', '本月消耗评测积分')}
          value={monthlyEvaluationUsage.totalPoints.toLocaleString('en-US')}
          sub={t(
            `${formatCalls(monthlyEvaluationUsage.calls)} calls · word/phrase/sentence ${monthlyEvaluationUsage.wordSentenceCalls.toLocaleString('en-US')} (${monthlyEvaluationUsage.wordSentencePoints.toLocaleString('en-US')} pts) · paragraph ${monthlyEvaluationUsage.paragraphCalls.toLocaleString('en-US')} (${monthlyEvaluationUsage.paragraphPoints.toLocaleString('en-US')} pts)`,
            `${formatCalls(monthlyEvaluationUsage.calls)} 次调用 · 字词句 ${monthlyEvaluationUsage.wordSentenceCalls.toLocaleString('en-US')} 次（${monthlyEvaluationUsage.wordSentencePoints.toLocaleString('en-US')} 积分）· 段落 ${monthlyEvaluationUsage.paragraphCalls.toLocaleString('en-US')} 次（${monthlyEvaluationUsage.paragraphPoints.toLocaleString('en-US')} 积分）`,
          )}
        />
        <StatCard
          icon={CreditCard}
          label={t('Lifetime points credited', '累计到账积分')}
          value={lifetimeEvaluationPoints.toLocaleString('en-US')}
          sub={t(
            `${wallet.usedEvaluationPoints.toLocaleString('en-US')} points used`,
            `已使用 ${wallet.usedEvaluationPoints.toLocaleString('en-US')} 积分`,
          )}
        />
      </div>

      <PointExpiryBreakdown batches={pointBatches} lang={lang} t={t} />


      {/* Per-key point-consumption breakdown. Cap-related chrome
           (progress bars, /limit suffixes, per-key point-cap subtext)
           lives on the API Keys page; here we show only what each key
           cost this month. */}
      <div className="rounded-2xl border border-border bg-background overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold flex items-center gap-2">
              <Wallet className="h-4 w-4" /> {t('Evaluation-point usage by key (this month)', '本月各 Key 积分消耗明细')}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t(
                'Every key drains the same point pool — see calls and the word/phrase/sentence versus paragraph point split for each key.',
                '所有 Key 共用同一积分池；下方按 Key 展示调用次数，以及字词句与段落的积分消耗。',
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
          <div className="overflow-x-auto">
            <div className="min-w-[920px]">
              <div className="grid grid-cols-[minmax(220px,1.5fr)_120px_175px_155px_145px] gap-5 border-b border-border bg-muted/20 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <div>{tx('Key')}</div>
                <div className="text-right">{t('Total calls', '总调用')}</div>
                <div className="flex items-center justify-end gap-1.5 text-right">
                  {t('Word / phrase / sentence', '字词句')}
                  <EvaluationKernelInfo
                    wordSentencePoints={WORD_SENTENCE_POINTS_PER_USE}
                    paragraphPoints={PARAGRAPH_POINTS_PER_USE}
                  />
                </div>
                <div className="flex items-center justify-end gap-1.5 text-right">
                  {t('Paragraph', '段落')}
                  <EvaluationKernelInfo
                    wordSentencePoints={WORD_SENTENCE_POINTS_PER_USE}
                    paragraphPoints={PARAGRAPH_POINTS_PER_USE}
                  />
                </div>
                <div className="text-right">{t('Points consumed', '消耗积分')}</div>
              </div>
              <ul className="divide-y divide-border">
                {sortedKeys.map((k) => {
                  const monthUsage = usageByKeyThisMonth.get(k.id);
                  const monthCalls = monthUsage?.calls ?? 0;
                  const revoked = k.status === 'revoked';

                  return (
                    <li
                      key={k.id}
                      className="grid grid-cols-[minmax(220px,1.5fr)_120px_175px_155px_145px] items-center gap-5 px-5 py-4"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <span className="truncate">{k.name}</span>
                          {revoked && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase tracking-wider">
                              {tx('Revoked')}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                          {k.maskedSecret.slice(-12)}
                        </div>
                      </div>
                      <div className="text-right text-sm tabular-nums">
                        {formatCalls(monthCalls)}
                      </div>
                      <div className="text-right tabular-nums">
                        <div className="text-sm font-medium">{monthUsage?.wordSentenceCalls.toLocaleString('en-US') ?? 0} {t('calls', '次')}</div>
                        <div className="mt-0.5 text-[11px] text-muted-foreground">{monthUsage?.wordSentencePoints.toLocaleString('en-US') ?? 0} {t('pts', '积分')}</div>
                      </div>
                      <div className="text-right tabular-nums">
                        <div className="text-sm font-medium">{monthUsage?.paragraphCalls.toLocaleString('en-US') ?? 0} {t('calls', '次')}</div>
                        <div className="mt-0.5 text-[11px] text-muted-foreground">{monthUsage?.paragraphPoints.toLocaleString('en-US') ?? 0} {t('pts', '积分')}</div>
                      </div>
                      <div className="text-right text-sm font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                        {(monthUsage?.totalPoints ?? 0).toLocaleString('en-US')} {t('pts', '积分')}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
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
  const [hoveredBatchId, setHoveredBatchId] = useState<string | null>(null);
  const [now] = useState(() => Date.now());
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
  // Do not merge batches by calendar day. A customer can recharge several
  // times on the same day, and each successful recharge has its own exact
  // expiry timestamp and remaining balance.
  const expiryBatches = useMemo(
    () => [...activeBatches].sort((a, b) => Date.parse(a.expiresAt) - Date.parse(b.expiresAt)),
    [activeBatches],
  );
  const availablePoints = activeBatches.reduce(
    (total, batch) => total + batch.remainingPoints,
    0,
  );
  const availablePercentages = allocateWholePercentages(expiryBatches, availablePoints);
  const nextExpiry = expiryBatches[0];
  const hoveredBatch = expiryBatches.find((batch) => batch.id === hoveredBatchId) ?? null;
  const locale = lang === 'zh' ? 'zh-CN' : 'en-US';
  const daysUntilNextExpiry = nextExpiry
    ? Math.max(0, Math.ceil((Date.parse(nextExpiry.expiresAt) - now) / 86400000))
    : 0;
  const colors = ['bg-sky-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500'];
  const chartColors = ['#0ea5e9', '#10b981', '#8b5cf6', '#f59e0b'];

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-background">
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-700 dark:text-sky-300">
            <CalendarClock className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold">
              {t('Available points by expiry', '按有效期查看可用积分')}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {nextExpiry
                ? t(
                    `Next expiry: ${formatExpiryTimestamp(nextExpiry.expiresAt, locale)} · ${nextExpiry.remainingPoints.toLocaleString('en-US')} points remaining · ${daysUntilNextExpiry}d left.`,
                    `下一批到期：${formatExpiryTimestamp(nextExpiry.expiresAt, locale)} · 剩余 ${nextExpiry.remainingPoints.toLocaleString('en-US')} 积分 · ${daysUntilNextExpiry} 天后到期。`,
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
          {expanded ? t('Hide batch details', '收起批次明细') : t('View batch details', '查看批次明细')}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <div className="border-y border-border bg-muted/[0.16] px-5 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <ExpiryDonut
            batches={expiryBatches}
            availablePoints={availablePoints}
            displayPercentages={availablePercentages}
            colors={chartColors}
            hoveredBatchId={hoveredBatchId}
            onHoverBatch={setHoveredBatchId}
            locale={locale}
            t={t}
          />
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <span className="text-xs text-muted-foreground">
                {t('Available point distribution', '可用积分分布')}
              </span>
              <span className="text-sm font-semibold tabular-nums">
                {availablePoints.toLocaleString('en-US')} {t('pts', '积分')}
              </span>
            </div>
            {hoveredBatch ? (
              <div className="rounded-xl border border-border bg-background px-3 py-2.5 shadow-sm animate-in fade-in duration-150">
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 shrink-0 rounded-sm"
                    style={{
                      backgroundColor:
                        chartColors[
                          Math.max(
                            0,
                            expiryBatches.findIndex((batch) => batch.id === hoveredBatch.id),
                          ) % chartColors.length
                        ],
                    }}
                  />
                  <span className="text-[11px] font-semibold tabular-nums leading-tight">
                    {formatExpiryTimestamp(hoveredBatch.expiresAt, locale)}
                  </span>
                </div>
                <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                  <div className="flex justify-between gap-2">
                    <span>{t('Remaining', '剩余')}</span>
                    <span className="font-medium tabular-nums text-foreground">
                      {hoveredBatch.remainingPoints.toLocaleString('en-US')} {t('pts', '积分')}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span>{t('Share', '占比')}</span>
                    <span className="font-medium tabular-nums text-foreground">
                      {availablePercentages.get(hoveredBatch.id) ?? 0}%
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span>{t('Expires in', '到期')}</span>
                    <span className="font-medium tabular-nums text-foreground">
                      {t(
                        `${Math.max(0, Math.ceil((Date.parse(hoveredBatch.expiresAt) - now) / 86400000))}d`,
                        `${Math.max(0, Math.ceil((Date.parse(hoveredBatch.expiresAt) - now) / 86400000))} 天`,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span>{t('Used', '已用')}</span>
                    <span className="font-medium tabular-nums text-foreground">
                      {hoveredBatch.usedPoints.toLocaleString('en-US')} {t('pts', '积分')}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                {t(
                  'Each color represents one top-up batch; the percentage is its share of available points. Hover a slice for details.',
                  '每种颜色代表一笔充值批次；百分比为该批次占可用积分的比例。悬停扇区可查看详情。',
                )}
              </p>
            )}
        <div className="mt-3 grid gap-x-5 gap-y-1.5 text-[11px] text-muted-foreground sm:grid-cols-2">
          {expiryBatches.map((batch, index) => {
            const percentage = availablePercentages.get(batch.id) ?? 0;
            const isHovered = hoveredBatchId === batch.id;
            return (
            <span
              key={batch.id}
              onMouseEnter={() => setHoveredBatchId(batch.id)}
              onMouseLeave={() => setHoveredBatchId(null)}
              className={cn(
                'inline-flex min-w-0 items-center gap-1.5 rounded-md px-1.5 py-0.5 -mx-1.5 cursor-default transition-colors',
                isHovered && 'bg-background text-foreground shadow-sm',
              )}
            >
              <span className={`h-2 w-2 shrink-0 rounded-sm ${colors[index % colors.length]}`} />
              <span className="truncate">{formatExpiryTimestamp(batch.expiresAt, locale)}</span>
              {' · '}
              {batch.remainingPoints.toLocaleString('en-US')} {t('pts', '积分')} ({percentage}%)
            </span>
            );
          })}
        </div>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="divide-y divide-border">
          {expiryBatches.map((batch, index) => {
            const daysLeft = Math.max(0, Math.ceil((Date.parse(batch.expiresAt) - now) / 86400000));
            const remainingPercent = batch.creditedPoints > 0
              ? Math.round((batch.remainingPoints / batch.creditedPoints) * 100)
              : 0;
            const availablePercent = availablePercentages.get(batch.id) ?? 0;
            return (
              <div key={batch.id} className="px-5 py-4">
                <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
                  <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${colors[index % colors.length]}`} />
                  <div className="min-w-[200px] flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="text-sm font-semibold tabular-nums">
                        {formatExpiryTimestamp(batch.expiresAt, locale)}
                      </p>
                      <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {t(`Batch ${index + 1}`, `第 ${index + 1} 笔充值`)}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {t('Credited', '到账')} {batch.creditedPoints.toLocaleString('en-US')} {t('pts', '积分')}
                      {' · '}
                      {t('Used', '已用')} {batch.usedPoints.toLocaleString('en-US')} {t('pts', '积分')}
                      {' · '}
                      {t(`Expires in ${daysLeft}d`, `${daysLeft} 天后到期`)}
                    </p>
                  </div>
                  <div className="min-w-[170px] text-right">
                    <p className="text-sm font-semibold tabular-nums">
                      {batch.remainingPoints.toLocaleString('en-US')} / {batch.creditedPoints.toLocaleString('en-US')} {t('pts', '积分')}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {t(`${remainingPercent}% remaining`, `剩余 ${remainingPercent}%`)}
                      {' · '}
                      {t(`${availablePercent}% of available`, `占可用积分 ${availablePercent}%`)}
                    </p>
                  </div>
                </div>
                <div
                  className="mt-3 h-1.5 overflow-hidden rounded-full bg-emerald-500/10"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={remainingPercent}
                  aria-label={t(
                    `${remainingPercent}% of the points in this batch remain`,
                    `此笔充值剩余 ${remainingPercent}%`,
                  )}
                >
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-[width] duration-300"
                    style={{ width: `${remainingPercent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function ExpiryDonut({
  batches,
  availablePoints,
  displayPercentages,
  colors,
  hoveredBatchId,
  onHoverBatch,
  locale,
  t,
}: {
  batches: EvaluationPointBatch[];
  availablePoints: number;
  displayPercentages: Map<string, number>;
  colors: string[];
  hoveredBatchId: string | null;
  onHoverBatch: (id: string | null) => void;
  locale: string;
  t: (en: string, zh: string) => string;
}) {
  // Leave room on both sides for outside callout labels. Previous cx=84
  // crushed left labels into the ring (e.g. "17%" sitting on the arc).
  const centerX = 150;
  const centerY = 85;
  const ringR = 44;
  const ringStroke = 18;
  const innerR = ringR - ringStroke / 2;
  const outerR = ringR + ringStroke / 2;
  const touchR = outerR + 2;
  const elbowPad = 14;
  const leftLabelX = 36;
  const leftLineEndX = 40;
  const rightLabelX = 264;
  const rightLineEndX = 260;
  const labelMinY = 14;
  const labelMaxY = 156;
  const labelGap = 20;
  const liftPx = 6;

  const segments = batches.map((batch, index) => {
    const percent = availablePoints > 0 ? (batch.remainingPoints / availablePoints) * 100 : 0;
    const previousPercent = batches
      .slice(0, index)
      .reduce((total, item) => total + (availablePoints > 0 ? (item.remainingPoints / availablePoints) * 100 : 0), 0);
    const startAngle = (previousPercent / 100) * Math.PI * 2 - Math.PI / 2;
    const endAngle = ((previousPercent + percent) / 100) * Math.PI * 2 - Math.PI / 2;
    const labelAngle = (startAngle + endAngle) / 2;
    const side = Math.cos(labelAngle) >= 0 ? 'right' : 'left';
    return {
      batch,
      index,
      percent,
      startAngle,
      endAngle,
      labelAngle,
      side,
      rawLabelY: centerY + Math.sin(labelAngle) * (outerR + 18),
    };
  });

  // Keep leader-line labels separated even when several small batches sit
  // next to each other on one side of the ring.
  const placeLabels = (side: 'left' | 'right') => {
    const onSide = segments
      .filter((segment) => segment.side === side)
      .sort((a, b) => a.rawLabelY - b.rawLabelY);
    if (onSide.length === 0) return [];

    let previousY = labelMinY - labelGap;
    const packed = onSide.map((segment) => {
      const labelY = Math.max(
        labelMinY,
        Math.min(labelMaxY, Math.max(segment.rawLabelY, previousY + labelGap)),
      );
      previousY = labelY;
      return { ...segment, labelY };
    });

    const lastY = packed.at(-1)?.labelY ?? labelMinY;
    if (lastY <= labelMaxY) return packed;

    if (packed.length === 1) {
      return [{ ...packed[0], labelY: (labelMinY + labelMaxY) / 2 }];
    }
    return packed.map((segment, i) => ({
      ...segment,
      labelY: labelMinY + (i * (labelMaxY - labelMinY)) / (packed.length - 1),
    }));
  };
  const labeledSegments = [...placeLabels('left'), ...placeLabels('right')].sort(
    (a, b) => a.index - b.index,
  );

  const hovered = labeledSegments.find((segment) => segment.batch.id === hoveredBatchId) ?? null;

  return (
    <div
      className="relative h-44 w-full max-w-[300px] shrink-0 sm:w-[300px]"
      role="img"
      aria-label={t('Available points split by individual expiry batch', '按单笔有效期批次划分的可用积分')}
    >
      <svg viewBox="0 0 300 170" className="h-full w-full overflow-visible">
        {/* Track */}
        <circle
          cx={centerX}
          cy={centerY}
          r={ringR}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.08"
          strokeWidth={ringStroke}
        />
        {labeledSegments.map(({ batch, index, percent, startAngle, endAngle, labelAngle }) => {
          const isHovered = hoveredBatchId === batch.id;
          const dimmed = hoveredBatchId !== null && !isHovered;
          const dx = isHovered ? Math.cos(labelAngle) * liftPx : 0;
          const dy = isHovered ? Math.sin(labelAngle) * liftPx : 0;
          const r0 = isHovered ? innerR - 1 : innerR;
          const r1 = isHovered ? outerR + 3 : outerR;
          return (
            <g
              key={batch.id}
              style={{
                transform: `translate(${dx}px, ${dy}px)`,
                transition: 'transform 180ms ease, opacity 180ms ease',
              }}
              opacity={dimmed ? 0.38 : 1}
              onMouseEnter={() => onHoverBatch(batch.id)}
              onMouseLeave={() => onHoverBatch(null)}
              className="cursor-pointer"
            >
              <title>
                {`${formatExpiryTimestamp(batch.expiresAt, locale)} · ${batch.remainingPoints.toLocaleString('en-US')} ${t('pts', '积分')} · ${displayPercentages.get(batch.id) ?? Math.round(percent)}%`}
              </title>
              <path
                d={donutSlicePath(centerX, centerY, r0, r1, startAngle, endAngle)}
                fill={colors[index % colors.length]}
                style={{
                  transition: 'opacity 180ms ease',
                  filter: isHovered
                    ? 'drop-shadow(0 4px 8px rgba(15, 23, 42, 0.22))'
                    : undefined,
                }}
              />
              {/* Wider invisible hit area for thin slices */}
              <path
                d={donutSlicePath(centerX, centerY, innerR - 4, outerR + 8, startAngle, endAngle)}
                fill="transparent"
              />
            </g>
          );
        })}
        {labeledSegments.map(({ batch, index, percent, labelAngle, labelY, side }) => {
          const isHovered = hoveredBatchId === batch.id;
          const dimmed = hoveredBatchId !== null && !isHovered;
          const liftX = isHovered ? Math.cos(labelAngle) * liftPx : 0;
          const liftY = isHovered ? Math.sin(labelAngle) * liftPx : 0;
          const startX = centerX + Math.cos(labelAngle) * touchR + liftX;
          const startY = centerY + Math.sin(labelAngle) * touchR + liftY;
          const elbowX =
            side === 'right'
              ? Math.min(
                  Math.max(
                    centerX + Math.cos(labelAngle) * (touchR + elbowPad) + liftX,
                    centerX + outerR + elbowPad,
                  ),
                  rightLineEndX - 8,
                )
              : Math.max(
                  Math.min(
                    centerX + Math.cos(labelAngle) * (touchR + elbowPad) + liftX,
                    centerX - outerR - elbowPad,
                  ),
                  leftLineEndX + 8,
                );
          const lineEndX = side === 'right' ? rightLineEndX : leftLineEndX;
          const labelX = side === 'right' ? rightLabelX : leftLabelX;
          return (
            <g
              key={`label-${batch.id}`}
              opacity={dimmed ? 0.35 : 1}
              style={{ transition: 'opacity 180ms ease' }}
              onMouseEnter={() => onHoverBatch(batch.id)}
              onMouseLeave={() => onHoverBatch(null)}
              className="cursor-pointer"
            >
              <polyline
                points={`${startX},${startY} ${elbowX},${labelY} ${lineEndX},${labelY}`}
                fill="none"
                stroke={colors[index % colors.length]}
                strokeWidth={isHovered ? 2 : 1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={isHovered ? 1 : 0.8}
              />
              <text
                x={labelX}
                y={labelY}
                fill="currentColor"
                fontSize={isHovered ? 13 : 12}
                fontWeight="700"
                textAnchor={side === 'right' ? 'start' : 'end'}
                dominantBaseline="middle"
              >
                {displayPercentages.get(batch.id) ?? Math.round(percent)}%
              </text>
            </g>
          );
        })}
      </svg>

      <div className="pointer-events-none absolute left-1/2 top-1/2 flex w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center text-center">
        <span className="text-base font-semibold tabular-nums leading-none">
          {(hovered?.batch.remainingPoints ?? availablePoints).toLocaleString('en-US')}
        </span>
        <span className="mt-1 text-[10px] text-muted-foreground">
          {hovered
            ? t('This batch', '此批次')
            : t('Available', '可用积分')}
        </span>
      </div>
    </div>
  );
}

/** SVG donut slice path from startAngle → endAngle (radians, 0 = east, CCW). */
function donutSlicePath(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  startAngle: number,
  endAngle: number,
): string {
  const sweep = endAngle - startAngle;
  if (sweep <= 0.0001) return '';
  // Near-full ring: draw as two half-arcs to avoid SVG full-circle edge cases.
  const clampedEnd = sweep >= Math.PI * 2 - 0.0001 ? startAngle + Math.PI * 2 - 0.0001 : endAngle;
  const large = clampedEnd - startAngle > Math.PI ? 1 : 0;
  const polar = (r: number, angle: number) => [
    cx + Math.cos(angle) * r,
    cy + Math.sin(angle) * r,
  ] as const;
  const [ox0, oy0] = polar(rOuter, startAngle);
  const [ox1, oy1] = polar(rOuter, clampedEnd);
  const [ix1, iy1] = polar(rInner, clampedEnd);
  const [ix0, iy0] = polar(rInner, startAngle);
  return [
    `M ${ox0} ${oy0}`,
    `A ${rOuter} ${rOuter} 0 ${large} 1 ${ox1} ${oy1}`,
    `L ${ix1} ${iy1}`,
    `A ${rInner} ${rInner} 0 ${large} 0 ${ix0} ${iy0}`,
    'Z',
  ].join(' ');
}

/**
 * Display percentages must total exactly 100. Independent Math.round calls
 * can otherwise show e.g. 39% + 28% + 17% + 17% = 101% for valid batches.
 * The largest-remainder method keeps the visual labels truthful and stable.
 */
function allocateWholePercentages(
  batches: EvaluationPointBatch[],
  totalPoints: number,
): Map<string, number> {
  if (totalPoints <= 0) return new Map(batches.map((batch) => [batch.id, 0]));

  const allocations = batches.map((batch, index) => {
    const raw = (batch.remainingPoints / totalPoints) * 100;
    const whole = Math.floor(raw);
    return { id: batch.id, index, whole, remainder: raw - whole };
  });
  let remaining = 100 - allocations.reduce((sum, item) => sum + item.whole, 0);
  for (const item of [...allocations].sort((a, b) => b.remainder - a.remainder || a.index - b.index)) {
    if (remaining <= 0) break;
    item.whole += 1;
    remaining -= 1;
  }
  return new Map(allocations.map((item) => [item.id, item.whole]));
}

function formatExpiryTimestamp(value: string, locale: string): string {
  return new Date(value).toLocaleString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}
