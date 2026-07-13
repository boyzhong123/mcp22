'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Filter, Receipt, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  formatCents,
  formatDate,
  getEvaluationPointBatches,
  getTransactions,
  type EvaluationPointBatch,
  type Transaction,
} from '../../../_lib/mock-store';
import { useMockStore } from '../../../_lib/use-mock-store';
import { useLang } from '../../../_lib/use-lang';
import { billing } from '../../../_lib/api';
import { RechargeTrends } from '../../../_components/recharge-trends';
import { centsToWalletPoints } from '../../../_lib/topup';

type StatusFilter = 'all' | Transaction['status'];

export default function RechargeHistoryPage() {
  const { t, tx, lang } = useLang();
  const all = useMockStore(getTransactions, [] as Transaction[]);
  const pointBatches = useMockStore(getEvaluationPointBatches, [] as EvaluationPointBatch[]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!selectedTransaction) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedTransaction(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTransaction]);

  const openTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    const match = transaction.id.match(/^tx_(\d+)$/);
    if (!match) return;

    setDetailLoading(true);
    void billing
      .transactionDetail(Number(match[1]))
      .then((detail) => {
        setSelectedTransaction((current) =>
          current?.id === transaction.id
            ? {
                ...current,
                description: detail.description ?? current.description,
                balanceBeforeCents: detail.balance_before ?? current.balanceBeforeCents,
                balanceAfterCents: detail.balance_after ?? current.balanceAfterCents,
                basePoints: detail.base_points ?? current.basePoints,
                bonusPoints: detail.bonus_points ?? current.bonusPoints,
                creditedPoints: detail.credited_points ?? current.creditedPoints,
                balanceBeforePoints: detail.point_balance_before ?? current.balanceBeforePoints,
                balanceAfterPoints: detail.point_balance_after ?? current.balanceAfterPoints,
                pointsExpireAt: detail.points_expire_at ?? current.pointsExpireAt,
                usedPoints: detail.used_points ?? current.usedPoints,
                remainingPoints: detail.remaining_points ?? current.remainingPoints,
              }
            : current,
        );
      })
      .catch(() => {
        // The list payload already contains enough detail to render the drawer.
      })
      .finally(() => setDetailLoading(false));
  };

  const filtered = useMemo(() => {
    return all
      .filter((t) => (status === 'all' ? true : t.status === status))
      .filter((t) => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return (
          t.id.toLowerCase().includes(q) ||
          t.last4.includes(q) ||
          t.description.toLowerCase().includes(q) ||
          (t.packageId ?? '').includes(q)
        );
      });
  }, [all, query, status]);

  const succeeded = useMemo(
    () => all.filter((t) => t.status === 'succeeded'),
    [all],
  );

  const totalSucceeded = useMemo(
    () => succeeded.reduce((acc, t) => acc + t.amountCents, 0),
    [succeeded],
  );

  const totalCreditedPoints = useMemo(
    () => succeeded.reduce((acc, transaction) => acc + creditedPoints(transaction), 0),
    [succeeded],
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label={t('Successful top-ups', '成功充值笔数')}
          value={succeeded.length.toString()}
          hint={tx('Succeeded only')}
        />
        <SummaryCard
          label={t('Points credited', '累计到账积分')}
          value={formatPoints(totalCreditedPoints)}
          hint={t(`Paid ${formatCents(totalSucceeded)} in total`, `累计支付 ${formatCents(totalSucceeded)}`)}
        />
        <SummaryCard
          label={t('Latest credit', '最近到账积分')}
          value={all[0] ? formatPoints(creditedPoints(all[0])) : '—'}
          hint={all[0] ? formatDate(all[0].createdAt) : tx('No payments yet')}
          badge={all[0] ? <StatusPill status={all[0].status} /> : undefined}
        />
      </div>

      {/* Recharge trend — top-ups bucketed by day / month / year / custom range. */}
      <RechargeTrends />

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('Search transaction ID or package…', '搜索交易 ID 或套餐…')}
              className="w-full h-9 pl-9 pr-3 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-foreground/30"
            />
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-1 text-xs">
            <Filter className="h-3 w-3 text-muted-foreground ml-1" />
            {(['all', 'succeeded', 'pending', 'failed'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={cn(
                  'px-2.5 h-7 rounded-md capitalize font-medium transition-colors',
                  status === s
                    ? 'bg-background text-foreground shadow-sm border border-border'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {tx(s.charAt(0).toUpperCase() + s.slice(1))}
              </button>
            ))}
          </div>
        </div>

        <div className="hidden md:grid grid-cols-[1.45fr_0.82fr_0.65fr_0.8fr_1.25fr_0.65fr_auto] gap-4 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/20 border-b border-border">
          <div>{tx('Description')}</div>
          <div>{tx('Date')}</div>
          <div>{t('Paid', '支付金额')}</div>
          <div>{t('Points credited', '到账积分')}</div>
          <div>{t('Point usage progress', '积分使用进度')}</div>
          <div>{tx('Status')}</div>
          <div />
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto h-10 w-10 rounded-lg bg-muted flex items-center justify-center mb-3">
              <Receipt className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">{tx('No matching transactions')}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {tx('Adjust your filters or add funds from the billing page.')}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((transaction) => {
              const usage = pointUsage(transaction, pointBatches);
              return (
              <li key={transaction.id}>
                <button
                  type="button"
                  onClick={() => openTransaction(transaction)}
                  className="w-full px-5 py-3.5 md:grid md:grid-cols-[1.45fr_0.82fr_0.65fr_0.8fr_1.25fr_0.65fr_auto] md:gap-4 md:items-center flex flex-col gap-1.5 text-left hover:bg-muted/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/30 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{transaction.description}</p>
                  </div>
                  <div className="text-xs text-muted-foreground tabular-nums">{formatTransactionTimestamp(transaction.createdAt, lang)}</div>
                  <div className="text-sm font-semibold tabular-nums">
                    {formatCents(transaction.amountCents)}
                  </div>
                  <div className="text-sm font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                    <span className="mr-1 text-[11px] font-medium text-muted-foreground md:hidden">
                      {t('Credited', '到账')}
                    </span>
                    +{formatPoints(creditedPoints(transaction))}
                  </div>
                  <PointUsageProgress
                    creditedPoints={creditedPoints(transaction)}
                    usage={usage}
                  />
                  <div>
                    <StatusPill status={transaction.status} />
                  </div>
                  <ChevronRight className="hidden md:block h-4 w-4 text-muted-foreground/60" />
                </button>
              </li>
              );
            })}
          </ul>
        )}
      </div>
      <TransactionDetailDrawer
        transaction={selectedTransaction}
        pointUsage={selectedTransaction ? pointUsage(selectedTransaction, pointBatches) : null}
        loading={detailLoading}
        onClose={() => setSelectedTransaction(null)}
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  hint,
  badge,
}: {
  label: string;
  value: string;
  hint?: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="mt-2 flex items-center gap-2">
        <div className="text-2xl font-semibold tracking-[-0.02em]">{value}</div>
        {badge}
      </div>
      {hint && <div className="text-[11px] text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

function TransactionDetailDrawer({
  transaction,
  pointUsage,
  loading,
  onClose,
}: {
  transaction: Transaction | null;
  pointUsage: PointUsage | null;
  loading: boolean;
  onClose: () => void;
}) {
  const { t, tx, lang } = useLang();
  if (!transaction) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label={tx('Close')}
        onClick={onClose}
        className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-detail-title"
        className="absolute inset-y-0 right-0 w-full max-w-md bg-background border-l border-border shadow-2xl flex flex-col"
      >
        <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t('Billing history', '充值记录')}
            </p>
            <h2 id="transaction-detail-title" className="mt-1 text-lg font-semibold">
              {t('Transaction details', '交易详情')}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={tx('Close')}
            className="h-8 w-8 rounded-md border border-border inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">{t('Top-up amount', '充值金额')}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                  +{formatPoints(creditedPoints(transaction))}
                </p>
              </div>
              <StatusPill status={transaction.status} />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{transaction.description}</p>
          </div>

          <div className="rounded-xl border border-border divide-y divide-border">
            <DetailRow label={t('Paid amount', '支付金额')} value={formatCents(transaction.amountCents)} />
            <DetailRow label={t('Payment method', '支付方式')} value={methodLabel(transaction.method, transaction.last4)} />
            <DetailRow label={t('Transaction time', '交易时间')} value={formatTransactionTimestamp(transaction.createdAt, lang)} />
            <DetailRow label={t('PayPal order ID', 'PayPal 订单号')} value={transaction.paypalOrderId ?? '—'} mono />
            <DetailRow label={t('Transaction ID', '交易 ID')} value={transaction.id} mono />
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('Evaluation point breakdown', '评测积分到账明细')}
            </h3>
            <div className="rounded-xl border border-border divide-y divide-border">
              <DetailRow
                label={t('Package', '充值套餐')}
                value={packageLabel(transaction.packageId, t)}
              />
              <DetailRow
                label={t('Base points', '基础积分')}
                value={formatPoints(transaction.basePoints ?? creditedPoints(transaction))}
              />
              <DetailRow
                label={t('Bonus points', '赠送积分')}
                value={formatPoints(transaction.bonusPoints ?? 0)}
              />
              <DetailRow
                label={t('Points credited', '实际到账')}
                value={`+${formatPoints(creditedPoints(transaction))}`}
              />
              <DetailRow
                label={t('Valid through', '有效期至')}
                value={transaction.pointsExpireAt ? formatDate(transaction.pointsExpireAt) : '—'}
              />
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('Available point change', '可用积分变化')}
            </h3>
            <div className="rounded-xl border border-border divide-y divide-border">
              <DetailRow
                label={t('Available before top-up', '充值前可用积分')}
                value={formatOptionalPoints(transaction.balanceBeforePoints)}
              />
              <DetailRow
                label={t('Available after top-up', '充值后可用积分')}
                value={formatOptionalPoints(transaction.balanceAfterPoints)}
              />
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('Current usage for this top-up', '本次充值当前使用情况')}
            </h3>
            <div className="rounded-xl border border-border divide-y divide-border">
              <DetailRow
                label={t('Points used', '已用积分')}
                value={formatPoints(pointUsage?.usedPoints ?? 0)}
              />
              <DetailRow
                label={t('Points remaining', '剩余积分')}
                value={formatPoints(pointUsage?.remainingPoints ?? creditedPoints(transaction))}
              />
            </div>
            <div className="mt-3 rounded-xl border border-border bg-muted/20 p-4">
              <PointUsageProgress
                creditedPoints={creditedPoints(transaction)}
                usage={pointUsage ?? {
                  usedPoints: 0,
                  remainingPoints: creditedPoints(transaction),
                }}
                detailed
              />
            </div>
          </div>

          {loading && (
            <p className="text-xs text-muted-foreground">
              {t('Refreshing transaction details…', '正在刷新交易详情…')}
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('text-right font-medium break-all', mono && 'font-mono text-xs')}>
        {value}
      </span>
    </div>
  );
}

function creditedPoints(transaction: Transaction): number {
  return Math.max(0, transaction.creditedPoints ?? centsToWalletPoints(transaction.amountCents));
}

type PointUsage = {
  usedPoints: number;
  remainingPoints: number;
};

function PointUsageProgress({
  creditedPoints: credited,
  usage,
  detailed = false,
}: {
  creditedPoints: number;
  usage: PointUsage;
  detailed?: boolean;
}) {
  const { t } = useLang();
  const usedPercent = credited > 0
    ? Math.min(100, Math.max(0, (usage.usedPoints / credited) * 100))
    : 0;

  return (
    <div className={cn('min-w-0', detailed ? 'space-y-2' : 'py-0.5')}>
      <div className="flex items-baseline justify-between gap-2 tabular-nums">
        <span className={cn('font-semibold', detailed ? 'text-sm' : 'text-[12px]')}>
          {formatPoints(usage.usedPoints)}
          <span className="ml-1 font-normal text-muted-foreground">
            {t('used', '已用')}
          </span>
        </span>
        <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
          {usedPercent.toFixed(0)}%
        </span>
      </div>
      <div
        className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-500/15"
        role="progressbar"
        aria-label={t('Points used from this top-up', '本次充值已用积分')}
        aria-valuemin={0}
        aria-valuemax={credited}
        aria-valuenow={usage.usedPoints}
      >
        <div
          className="h-full rounded-full bg-emerald-500 transition-[width]"
          style={{ width: `${usedPercent}%` }}
        />
      </div>
      <div className="mt-1 text-[11px] text-muted-foreground tabular-nums">
        {t(
          `${formatPoints(usage.remainingPoints)} remaining of ${formatPoints(credited)}`,
          `剩余 ${formatPoints(usage.remainingPoints)} / 到账 ${formatPoints(credited)}`,
        )}
      </div>
    </div>
  );
}

function pointUsage(transaction: Transaction, batches: EvaluationPointBatch[]): PointUsage {
  const matchingBatches = batches.filter((batch) => batch.transactionId === transaction.id);
  if (matchingBatches.length > 0) {
    return matchingBatches.reduce(
      (total, batch) => ({
        usedPoints: total.usedPoints + batch.usedPoints,
        remainingPoints: total.remainingPoints + batch.remainingPoints,
      }),
      { usedPoints: 0, remainingPoints: 0 },
    );
  }
  const usedPoints = Math.max(0, transaction.usedPoints ?? 0);
  return {
    usedPoints,
    remainingPoints: Math.max(
      0,
      transaction.remainingPoints ?? creditedPoints(transaction) - usedPoints,
    ),
  };
}

function formatPoints(points: number): string {
  return `${Math.max(0, Math.round(points)).toLocaleString('en-US')} pts`;
}

function formatOptionalPoints(points?: number): string {
  return typeof points === 'number' ? formatPoints(points) : '—';
}

function formatTransactionTimestamp(value: string, lang: string): string {
  return new Date(value).toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: lang !== 'zh',
  });
}

function packageLabel(
  packageId: Transaction['packageId'],
  t: (en: string, zh: string) => string,
): string {
  if (packageId === 'advanced') return t('Advanced', '高级');
  if (packageId === 'flagship') return t('Flagship', '旗舰');
  if (packageId === 'standard') return t('Standard', '标准');
  return '—';
}

function methodLabel(method: Transaction['method'], last4: string) {
  switch (method) {
    case 'apple-pay':
      return 'Apple Pay';
    case 'google-pay':
      return 'Google Pay';
    case 'link':
      return 'Stripe Link';
    case 'cashapp':
      return 'Cash App Pay';
    case 'paypal':
      return 'PayPal';
    case 'amazon-pay':
      return 'Amazon Pay';
    case 'ach':
      return `ACH •••• ${last4}`;
    case 'wire':
      return 'Wire transfer';
    default:
      return `Card •••• ${last4}`;
  }
}

function StatusPill({ status }: { status: Transaction['status'] }) {
  const { tx } = useLang();
  const cls =
    status === 'succeeded'
      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
      : status === 'pending'
        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
        : 'bg-destructive/15 text-destructive border-destructive/30';
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border',
        cls,
      )}
    >
      {tx(status.charAt(0).toUpperCase() + status.slice(1))}
    </span>
  );
}
