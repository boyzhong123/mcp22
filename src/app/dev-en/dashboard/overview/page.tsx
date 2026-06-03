'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  BookOpen,
  CheckCircle2,
  Clock,
  CreditCard,
  Gauge,
  Key,
  Receipt,
  Sparkles,
  Wallet,
  XOctagon,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMockAuth } from '../../_lib/mock-auth';
import {
  formatCalls,
  formatCents,
  formatDate,
  getAccountAlert,
  getAccountBalanceCents,
  getAccountCallsThisMonth,
  getAccountSpendThisMonthMills,
  getAccountTrialRemaining,
  getKeyMonthlyCalls,
  getKeyMonthlySpendMills,
  getSpendLimit,
  getTransactions,
  getWallet,
  isAccountLowBalance,
  keyLast4,
  listKeys,
  type AccountLowBalanceAlert,
  type AccountTrialRemaining,
  type AccountWallet,
  type ApiKey,
  type Transaction,
  TRIAL_DEFAULT_TOTAL,
  TRIAL_DEFAULT_VALID_DAYS,
} from '../../_lib/mock-store';
import { rankActiveKeysThisMonth } from '../../_lib/overview-key-ranking.mjs';
import { useMockStore } from '../../_lib/use-mock-store';
import { StripeCheckoutModal } from '../../_components/stripe-checkout-modal';
import { StatCard } from '../../_components/stat-card';
import { useLang } from '../../_lib/use-lang';
import { formatMills } from '../../_lib/format';

const DEFAULT_WALLET: AccountWallet = {
  paidCreditsCents: 0,
  paidCreditsUsedCents: 0,
};

const DEFAULT_TRIAL_REMAINING: AccountTrialRemaining = {
  totalLeft: TRIAL_DEFAULT_TOTAL,
  totalExhausted: false,
  expired: false,
  expiresAt: new Date(Date.now() + TRIAL_DEFAULT_VALID_DAYS * 86400000).toISOString(),
  daysLeft: TRIAL_DEFAULT_VALID_DAYS,
};

const DEFAULT_ACCOUNT_ALERT: AccountLowBalanceAlert = {
  enabled: true,
  thresholdCents: 500,
};

export default function OverviewPage() {
  const { user } = useMockAuth();
  const { t, tx, lang } = useLang();
  const calls = useMockStore(getAccountCallsThisMonth, 0);
  const spend = useMockStore(getAccountSpendThisMonthMills, 0);
  const wallet = useMockStore(getWallet, DEFAULT_WALLET);
  const balanceCents = useMockStore(getAccountBalanceCents, 0);
  const trialRemaining = useMockStore(
    getAccountTrialRemaining,
    DEFAULT_TRIAL_REMAINING,
  );
  const accountAlert = useMockStore(getAccountAlert, DEFAULT_ACCOUNT_ALERT);
  const lowBalance = useMockStore(isAccountLowBalance, false);
  const keys = useMockStore(listKeys, [] as ApiKey[]);
  const transactions = useMockStore(getTransactions, [] as Transaction[]);
  const spendLimit = useMockStore(getSpendLimit, {
    monthlyCapCents: 5000_00,
    monthlyCallCap: null,
    dailyCapCents: null,
    dailyCallCap: null,
    resetDay: 1,
    warnAtPercents: [50, 75, 90],
  });

  const [addCreditsOpen, setAddCreditsOpen] = useState(false);
  const openAddCredits = () => setAddCreditsOpen(true);

  const activeKeys = keys.filter((k) => k.status === 'active');
  // Only top-ups in the "近期充值" sidebar — `card-added` rows aren't
  // financial activity, they cluttered the list and the section title
  // now reads as money-in only. `failed` top-ups never landed, so they're
  // dropped entirely; `pending` ones are kept but rendered distinctly (a
  // pending badge + muted amount) so they don't read as money already in
  // the wallet.
  const recent = transactions
    .filter((tr) => tr.kind === 'credit-topup' && tr.status !== 'failed')
    .slice(0, 5);

  // We keep the raw percent (uncapped) so the KPI card reads correct when
  // the user has genuinely blown past the limit, but clamp the UI bar.
  // The "call limit used" tile compares against the account-wide monthly
  // **call** cap (semantically correct), falling back to the legacy
  // dollar cap purely so older snapshots without the new field still
  // show *something*.
  const monthlyCallCap = spendLimit.monthlyCallCap ?? null;
  const hasSpendLimit = monthlyCallCap != null && monthlyCallCap > 0;
  const limitUsedPctRaw = hasSpendLimit
    ? (calls / monthlyCallCap!) * 100
    : 0;
  const limitUsedPct = Math.min(100, limitUsedPctRaw);

  // Trial KPI tile derivations.
  const trialPct = Math.max(
    0,
    Math.min(100, (trialRemaining.totalLeft / TRIAL_DEFAULT_TOTAL) * 100),
  );
  const trialExpiryLabel = new Date(trialRemaining.expiresAt).toLocaleDateString(
    lang === 'zh' ? 'zh-CN' : 'en-US',
    { month: 'short', day: 'numeric' },
  );

  const rankedKeys = rankActiveKeysThisMonth(keys, getKeyMonthlyCalls);
  // "Top keys this month" should only list keys that actually saw traffic —
  // a key with 0 calls isn't "active". We still surface the three distinct
  // states below: no keys at all, keys-but-no-usage, and real usage.
  const usedKeys = rankedKeys.filter(({ monthCalls }) => monthCalls > 0);

  return (
    <div className="space-y-6" translate="no" lang="en">
      <div>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </p>
        <h1 className="text-2xl font-semibold tracking-[-0.02em] mt-0.5">
          {t(
            `Welcome back${user ? `, ${user.name.split(' ')[0]}` : ''}.`,
            `欢迎回来${user ? `，${user.name.split(' ')[0]}` : ''}。`,
          )}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t(
            "Here's a snapshot of your Chivox MCP workspace — one shared wallet, free trial, and pay-as-you-go from there.",
            '你的 Chivox MCP 工作区概览 — 一个共享钱包 + 免费试用，超出后按用量计费。',
          )}
        </p>
      </div>

      {/* Account-wide alert stack — surface every account-level limit
           state that's affecting traffic right now. Renders nothing
           when the account is healthy. Inputs are pure derivations of
           data already loaded above; no new endpoints. */}
      <AccountAlerts
        wallet={wallet}
        balanceCents={balanceCents}
        trialRemaining={trialRemaining}
        accountAlert={accountAlert}
        lowBalance={lowBalance}
        activeKeys={activeKeys}
        callsThisMonth={calls}
        callsLimit={monthlyCallCap ?? 0}
        limitUsedPctRaw={limitUsedPctRaw}
        onAddCredits={openAddCredits}
      />

      {/* Unified KPI grid — wallet, trial and this-month activity in one
           consistent set of tiles. The rich wallet/trial hero lives on the
           API Keys page (where "all keys share this wallet/trial" is the
           point); the overview keeps a lighter dashboard summary so the two
           pages don't read as duplicates. */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Wallet}
          label={t('Wallet balance', '钱包余额')}
          value={formatCents(balanceCents)}
          sub={t(
            `${formatCents(wallet.paidCreditsUsedCents)} spent · ${formatCents(wallet.paidCreditsCents)} topped up`,
            `已用 ${formatCents(wallet.paidCreditsUsedCents)} · 累计充值 ${formatCents(wallet.paidCreditsCents)}`,
          )}
          onClick={openAddCredits}
          cta={tx('Add credits')}
        />
        <StatCard
          icon={Sparkles}
          tone="emerald"
          label={t('Free trial', '免费试用')}
          value={`${formatCalls(trialRemaining.totalLeft)} / ${formatCalls(TRIAL_DEFAULT_TOTAL)}`}
          sub={
            trialRemaining.totalExhausted
              ? trialRemaining.expired
                ? t('Trial expired', '试用已过期')
                : t('Trial used up', '试用次数已用完')
              : t(
                  `${trialRemaining.daysLeft} days left · valid to ${trialExpiryLabel}`,
                  `剩余 ${trialRemaining.daysLeft} 天 · 有效期至 ${trialExpiryLabel}`,
                )
          }
          progressPct={trialPct}
          progressColor={trialPct <= 10 ? 'bg-amber-500' : 'bg-emerald-500'}
        />
        <StatCard
          icon={Receipt}
          label={t('Spent this month', '本月消费')}
          value={formatMills(spend)}
          sub={t(
            `${formatCalls(calls)} calls · ${activeKeys.length} active key${activeKeys.length === 1 ? '' : 's'}`,
            `${formatCalls(calls)} 次调用 · ${activeKeys.length} 把活跃 Key`,
          )}
          href="/dashboard/billing"
          cta={t('View billing', '查看账单')}
        />
        <StatCard
          icon={Activity}
          label={t('Calls this month', '本月调用')}
          value={formatCalls(calls)}
          sub={
            hasSpendLimit
              ? t(
                  `${formatCalls(calls)} / ${formatCalls(monthlyCallCap ?? 0)} of monthly cap`,
                  `${formatCalls(calls)} / ${formatCalls(monthlyCallCap ?? 0)}（月度上限）`,
                )
              : t('No monthly cap set', '未设置月度上限')
          }
          href={hasSpendLimit ? '/dashboard/usage' : '/dashboard/limits'}
          cta={hasSpendLimit ? t('View usage', '查看用量') : t('Set limit', '设置上限')}
          progressPct={hasSpendLimit ? limitUsedPct : undefined}
          progressColor={
            limitUsedPct >= 90
              ? 'bg-red-500'
              : limitUsedPct >= 75
                ? 'bg-amber-500'
                : 'bg-foreground'
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Active keys list — wallet model removes per-key balance bars; we
             now show how much each key is consuming this month vs its own
             monthlyCallCap (if any) so accounts can see hot keys
             at a glance without duplicating the wallet info above. */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-background p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold">
                {t('Top keys this month', '本月活跃 Key')}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t(
                  'Ranked by call volume. Every key shares the same wallet.',
                  '按本月调用量排序。所有 Key 共享同一钱包。',
                )}
              </p>
            </div>
            <Link
              href="/dashboard/keys"
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              {t('All keys', '全部 Key')} <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {rankedKeys.length === 0 ? (
            <div className="text-center py-10 rounded-lg border border-dashed border-border">
              <Key className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium">{tx('No keys yet')}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t(
                  "Create your first API key to start integrating. Free trial calls are unlocked automatically.",
                  '创建第一把 API 密钥即可开始接入，免费试用次数自动解锁。',
                )}
              </p>
              <Link
                href="/dashboard/keys"
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-foreground hover:underline underline-offset-4"
              >
                {tx('Create a key')} <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          ) : usedKeys.length === 0 ? (
            <div className="text-center py-10 rounded-lg border border-dashed border-border">
              <Activity className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium">
                {t('No calls yet this month', '本月还没有调用')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t(
                  'Make your first request with one of your keys — usage shows up here.',
                  '用你的任一 Key 发起第一次请求，调用量会显示在这里。',
                )}
              </p>
              <Link
                href="/global/docs?from=dev"
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-foreground hover:underline underline-offset-4"
              >
                {t('Quick start', '快速入门')} <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {usedKeys.map(({ key, monthCalls }) => {
                const monthSpend = getKeyMonthlySpendMills(key.id);
                const cap = key.monthlyCallCap ?? null;
                const capUsedPct = cap && cap > 0
                  ? Math.min(100, (monthCalls / cap) * 100)
                  : null;
                const capHit = cap !== null && cap > 0 && monthCalls >= cap;
                return (
                  <li
                    key={key.id}
                    className="rounded-lg border border-border px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-medium truncate">
                          {key.name}
                        </span>
                        <code className="font-mono text-[10.5px] text-muted-foreground">
                          {keyLast4(key.secret)}
                        </code>
                        {capHit && (
                          <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-500/15 text-red-600 dark:text-red-400">
                            {t('Cap reached', '已触顶')}
                          </span>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-semibold tabular-nums">
                          {formatCalls(monthCalls)}
                          {cap !== null && cap > 0 && (
                            <span className="text-muted-foreground font-normal">
                              {' / '}{formatCalls(cap)}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground tabular-nums mt-0.5">
                          {formatMills(monthSpend)} {t('this month', '本月')}
                        </div>
                      </div>
                    </div>
                    {capUsedPct !== null ? (
                      <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            capUsedPct >= 90
                              ? 'bg-red-500'
                              : capUsedPct >= 75
                                ? 'bg-amber-500'
                                : 'bg-foreground/60',
                          )}
                          style={{ width: `${capUsedPct}%` }}
                        />
                      </div>
                    ) : (
                      <div className="mt-1 text-[10.5px] text-muted-foreground">
                        {t('No per-key cap', '未设置单 Key 上限')}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Recent top-ups */}
        <div className="rounded-xl border border-border bg-background p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">{tx('Recent top-ups')}</h2>
            <Link
              href="/dashboard/billing/history"
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              {tx('View all')} <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              {t(
                'No activity yet. Add credits to see top-ups and consumption here.',
                '暂无记录。充值后将显示充值与扣费明细。',
              )}
            </p>
          ) : (
            <ul className="space-y-3">
              {recent.map((tr) => {
                const isPending = tr.status === 'pending';
                return (
                  <li key={tr.id} className="flex items-center gap-3">
                    <div
                      className={cn(
                        'h-7 w-7 shrink-0 rounded-md flex items-center justify-center',
                        isPending
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
                      )}
                    >
                      {isPending ? (
                        <Clock className="h-3.5 w-3.5" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">
                        {tr.description}
                      </p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                        {formatDate(tr.createdAt)}
                        {isPending && (
                          <span className="inline-flex items-center rounded px-1.5 py-px text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            {t('Pending', '待处理')}
                          </span>
                        )}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'text-xs font-semibold tabular-nums',
                        isPending && 'text-muted-foreground font-normal',
                      )}
                    >
                      {isPending ? formatCents(tr.amountCents) : `+${formatCents(tr.amountCents)}`}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="rounded-xl border border-border bg-background p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold">{tx('Quick actions')}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t(
                'Common next steps for pay-as-you-go accounts.',
                '按量计费账户的常见后续操作。',
              )}
            </p>
          </div>
          <Sparkles className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction
            href="/dashboard/keys"
            title={tx('Create key')}
            desc={t(
              'Spin up a new API key for this account.',
              '为当前账户新建 API Key。',
            )}
            icon={Key}
          />
          <QuickAction
            onClick={openAddCredits}
            title={tx('Add credits')}
            desc={t(
              'Top up the shared account wallet.',
              '为账户共享钱包充值。',
            )}
            icon={Wallet}
          />
          <QuickAction
            href="/dashboard/billing"
            title={tx('Review billing')}
            desc={t(
              'Wallet, top-ups, and per-key spend this month.',
              '钱包余额、充值历史、本月各 Key 消费。',
            )}
            icon={Receipt}
          />
          <QuickAction
            href="/global/docs?from=dev"
            title={tx('Read the docs')}
            desc={tx('MCP spec, quickstarts, error codes.')}
            icon={BookOpen}
          />
        </div>
      </div>

      {/* Bottom row: pricing quick nav */}
      <div className="rounded-xl border border-border bg-muted/20 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <BarChart3 className="h-4 w-4" />
          <span>
            {tx('Need to review rates? Check')}{' '}
            <Link
              href="/dashboard/billing/rates"
              className="underline underline-offset-4 text-foreground"
            >
              {tx('pay-as-you-go pricing')}
            </Link>{' '}
            {t('— flat usage pricing.', '— 固定用量计费。')}
          </span>
        </div>
        <Link
          href="/dashboard/billing/rates"
          className="inline-flex items-center gap-1 text-xs font-medium text-foreground hover:underline underline-offset-4"
        >
          {tx('See pricing')} <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      <StripeCheckoutModal
        open={addCreditsOpen}
        onClose={() => setAddCreditsOpen(false)}
      />
    </div>
  );
}

// ─── Alert stack ───────────────────────────────────────────────────────────
// The overview's single source of truth for "is anything wrong right now?"
// under the wallet model. All inputs are pure derivations of data the page
// already loads; no new endpoints needed. Keep the evaluator pure (no hooks)
// so it's trivially unit-testable and the render function stays dumb.
type AlertSeverity = 'critical' | 'warning';

interface AlertAction {
  label: string;
  onClick?: () => void;
  href?: string;
  primary?: boolean;
}

interface AlertRow {
  id: string;
  severity: AlertSeverity;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  actions: AlertAction[];
}

interface AlertInputs {
  wallet: AccountWallet;
  balanceCents: number;
  trialRemaining: AccountTrialRemaining;
  accountAlert: AccountLowBalanceAlert;
  lowBalance: boolean;
  activeKeys: ApiKey[];
  callsThisMonth: number;
  callsLimit: number;
  limitUsedPctRaw: number;
  onAddCredits: () => void;
  t: (en: string, zh: string) => string;
  tx: (en: string) => string;
}

/**
 * Collect every production-impacting alert the account has right now and
 * return them in priority order (critical → warning).
 *
 * Wallet-model alerts:
 *   - wallet-empty            wallet at $0 AND trial gone (full block)
 *   - trial-exhausted         trial gone but wallet still has runway
 *   - wallet-low              under user-configured low-balance threshold
 *   - trial-expired           signup trial window elapsed
 *   - spend-cap-hit / -near   account monthly call cap
 *   - key-monthly-cap-near    any single key approaching its own cap
 */
function buildAccountAlerts(i: AlertInputs): AlertRow[] {
  const {
    wallet,
    balanceCents,
    trialRemaining,
    accountAlert,
    lowBalance,
    activeKeys,
    callsThisMonth,
    callsLimit,
    limitUsedPctRaw,
    onAddCredits,
    t,
    tx,
  } = i;

  const rows: AlertRow[] = [];

  // 1 ── Account monthly call cap exceeded. Hardest stop: every paid call
  // is currently being rejected with SPEND_CAP_EXCEEDED.
  if (limitUsedPctRaw >= 100) {
    rows.push({
      id: 'spend-cap-hit',
      severity: 'critical',
      icon: XOctagon,
      title: t('Monthly call cap reached', '已达到本月调用上限'),
      desc: t(
        `You used ${formatCalls(callsThisMonth)} of ${formatCalls(callsLimit)} calls. Further calls are being rejected (SPEND_CAP_EXCEEDED) until you raise the cap or next UTC month.`,
        `本月已调用 ${formatCalls(callsThisMonth)}/${formatCalls(callsLimit)} 次。后续调用会被拒绝（SPEND_CAP_EXCEEDED），直到提高上限或进入下个 UTC 月。`,
      ),
      actions: [
        {
          label: t('Raise spend limit', '提高上限'),
          href: '/dashboard/limits',
          primary: true,
        },
        { label: tx('Review usage'), href: '/dashboard/usage' },
      ],
    });
  }

  // 2 ── Wallet empty AND trial gone → every key on the account is now
  // failing INSUFFICIENT_CREDITS. This is the single most important
  // signal under the wallet model.
  if (balanceCents === 0 && trialRemaining.totalExhausted) {
    const reason = trialRemaining.expired
      ? t('the signup trial window has expired', '注册试用已过期')
      : t('the signup trial calls are spent', '注册试用次数已用完');
    rows.push({
      id: 'wallet-empty',
      severity: 'critical',
      icon: AlertTriangle,
      title: t('Account out of credit', '账户余额已耗尽'),
      desc: t(
        `Wallet is $0 and ${reason}. Every key returns INSUFFICIENT_CREDITS until you top up.`,
        `钱包余额为 $0，且${reason}。所有 Key 都会返回 INSUFFICIENT_CREDITS，请充值。`,
      ),
      actions: [
        { label: tx('Add credits'), onClick: onAddCredits, primary: true },
        { label: tx('View pricing'), href: '/dashboard/billing/rates' },
      ],
    });
  }

  // 3 ── Trial exhausted but wallet still has dollars left. Not blocking,
  // just a heads-up that all calls now bill against paid credits.
  if (
    trialRemaining.totalExhausted &&
    balanceCents > 0 &&
    !(balanceCents === 0)
  ) {
    const reason = trialRemaining.expired
      ? t('The signup trial window has expired', '注册试用已过期')
      : t('The signup trial calls are all spent', '注册试用次数已用完');
    rows.push({
      id: 'trial-exhausted',
      severity: 'warning',
      icon: Sparkles,
      title: trialRemaining.expired
        ? t('Free trial expired', '免费试用已过期')
        : t('Free trial exhausted', '免费试用已用完'),
      desc: t(
        `${reason}. From here on calls draw from your wallet (${formatCents(balanceCents)} left).`,
        `${reason}。后续调用从钱包扣费（剩余 ${formatCents(balanceCents)}）。`,
      ),
      actions: [
        { label: tx('Add credits'), onClick: onAddCredits, primary: true },
      ],
    });
  }

  // 4 ── Wallet under user-configured low-balance threshold. Only when
  // the user opted into the alert and balance > 0 (the empty case is
  // already covered by alert 2).
  if (lowBalance && balanceCents > 0) {
    rows.push({
      id: 'wallet-low',
      severity: 'warning',
      icon: Bell,
      title: t('Account balance low', '账户余额偏低'),
      desc: t(
        `Wallet is at ${formatCents(balanceCents)}, below your alert threshold of ${formatCents(accountAlert.thresholdCents)}. Top up before traffic stalls.`,
        `钱包剩余 ${formatCents(balanceCents)}，已低于阈值 ${formatCents(accountAlert.thresholdCents)}。请尽快充值。`,
      ),
      actions: [
        { label: tx('Add credits'), onClick: onAddCredits, primary: true },
        {
          label: tx('Adjust threshold'),
          href: '/dashboard/settings#account-alert-threshold',
        },
      ],
    });
  }

  // 5 ── Account spend cap approaching (≥ 90%). KPI tile already turns
  // amber at 75%; we only banner at 90% to avoid noise.
  if (limitUsedPctRaw >= 90 && limitUsedPctRaw < 100) {
    rows.push({
      id: 'spend-cap-near',
      severity: 'warning',
      icon: Gauge,
      title: t(
        `Call cap ${limitUsedPctRaw.toFixed(0)}% used`,
        `调用上限已用 ${limitUsedPctRaw.toFixed(0)}%`,
      ),
      desc: t(
        `${formatCalls(callsThisMonth)} of ${formatCalls(callsLimit)} calls used this month. Calls will be rejected once the cap is hit.`,
        `本月已调用 ${formatCalls(callsThisMonth)}/${formatCalls(callsLimit)} 次。到达上限后调用会被拒绝。`,
      ),
      actions: [
        {
          label: tx('Adjust limit'),
          href: '/dashboard/limits',
          primary: true,
        },
      ],
    });
  }

  // 6 ── Per-key monthly cap approaching. Surfaced as a single rolled-up
  // alert listing the worst offender — the Keys page has the per-key
  // breakdown.
  const keysNearCap = activeKeys
    .map((k) => ({
      key: k,
      cap: k.monthlyCallCap,
      monthCalls: getKeyMonthlyCalls(k.id),
    }))
    .filter(
      (r) =>
        r.cap !== null &&
        r.cap !== undefined &&
        r.cap > 0 &&
        r.monthCalls / r.cap >= 0.8,
    )
    .map((r) => ({ ...r, pct: (r.monthCalls / (r.cap as number)) * 100 }))
    .sort((a, b) => b.pct - a.pct);

  if (keysNearCap.length > 0) {
    const worst = keysNearCap[0];
    const worstHit = worst.pct >= 100;
    rows.push({
      id: 'key-monthly-cap-near',
      severity: worstHit ? 'critical' : 'warning',
      icon: Zap,
      title: worstHit
        ? t(
            `${worst.key.name} hit its monthly call cap`,
            `${worst.key.name} 已触顶单 Key 月度调用上限`,
          )
        : t(
            `${worst.key.name} approaching its call cap (${worst.pct.toFixed(0)}%)`,
            `${worst.key.name} 接近单 Key 月度上限（${worst.pct.toFixed(0)}%）`,
          ),
      desc: t(
        `${formatCalls(worst.monthCalls)} of ${formatCalls(worst.cap as number)} calls used. ${keysNearCap.length > 1 ? `+${keysNearCap.length - 1} more key${keysNearCap.length === 2 ? '' : 's'} near limit.` : ''}`,
        `本月已 ${formatCalls(worst.monthCalls)}/${formatCalls(worst.cap as number)} 次。${keysNearCap.length > 1 ? `还有 ${keysNearCap.length - 1} 把 Key 接近上限。` : ''}`,
      ),
      actions: [
        { label: tx('Adjust caps'), href: '/dashboard/keys', primary: true },
      ],
    });
  }

  // Wallet model removes the suppression we used to do for "wallet model
  // unused" since per-key topup state is gone. Keep wallet stat as a
  // silent reference so React keeps the prop dependency for fast refresh.
  void wallet;

  return rows;
}

function AccountAlerts(props: Omit<AlertInputs, 't' | 'tx'>) {
  const { t, tx } = useLang();
  const rows = buildAccountAlerts({ ...props, t, tx });
  if (rows.length === 0) return null;

  // Visual budget: show up to 3 rows, collapse the rest behind a "+N more"
  // link to the Keys page (where every per-key state is reachable). This
  // keeps the overview skim-friendly even when multiple things are on
  // fire at once.
  const MAX_VISIBLE = 3;
  const visible = rows.slice(0, MAX_VISIBLE);
  const overflow = rows.length - visible.length;

  return (
    <div className="rounded-xl border border-border bg-background overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border bg-muted/30 flex items-center gap-2">
        <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {tx('Needs attention')}
        </span>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          · {rows.length}
        </span>
      </div>
      <ul className="divide-y divide-border">
        {visible.map((row) => (
          <AlertItem key={row.id} row={row} />
        ))}
      </ul>
      {overflow > 0 && (
        <div className="px-4 py-2 border-t border-border bg-muted/20 text-right">
          <Link
            href="/dashboard/keys"
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            {t(`+${overflow} more — see keys`, `还有 ${overflow} 条 — 查看全部 Key`)}
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
}

function AlertItem({ row }: { row: AlertRow }) {
  const Icon = row.icon;
  const isCritical = row.severity === 'critical';
  return (
    <li
      className={cn(
        'px-4 py-3 flex flex-col md:flex-row md:items-center gap-3',
        // Use a left accent bar instead of a full background tint so the
        // component sits harmoniously among the neutral cards below it.
        'border-l-2',
        isCritical ? 'border-l-red-500/70' : 'border-l-amber-500/70',
      )}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div
          className={cn(
            'h-7 w-7 rounded-md border flex items-center justify-center shrink-0 mt-0.5',
            isCritical
              ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400',
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-tight">{row.title}</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {row.desc}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 flex-wrap md:justify-end">
        {row.actions.map((a, idx) => {
          const cls = cn(
            'inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium transition-colors',
            a.primary
              ? 'bg-foreground text-background hover:brightness-110'
              : 'border border-border bg-background hover:bg-muted/50',
          );
          if (a.onClick) {
            return (
              <button key={idx} type="button" onClick={a.onClick} className={cls}>
                {a.primary && <CreditCard className="h-3.5 w-3.5" />}
                {a.label}
              </button>
            );
          }
          return (
            <Link key={idx} href={a.href!} className={cls}>
              {a.label}
            </Link>
          );
        })}
      </div>
    </li>
  );
}

function QuickAction({
  href,
  onClick,
  title,
  desc,
  icon: Icon,
  external,
}: {
  href?: string;
  onClick?: () => void;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  external?: boolean;
}) {
  const content = (
    <div className="flex items-start gap-3">
      <div className="h-8 w-8 rounded-md bg-background border border-border flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
          {desc}
        </p>
      </div>
      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0 mt-1" />
    </div>
  );
  const cls =
    'group rounded-lg border border-border bg-muted/30 hover:bg-muted/50 p-3.5 transition-colors text-left';

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cls}>
        {content}
      </button>
    );
  }
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={cls}>
        {content}
      </a>
    );
  }
  return (
    <Link href={href!} className={cls}>
      {content}
    </Link>
  );
}
