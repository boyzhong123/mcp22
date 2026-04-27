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
  Calendar,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Gauge,
  Gift,
  Key,
  PiggyBank,
  Plus,
  Receipt,
  Sparkles,
  XOctagon,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMockAuth } from '../../_lib/mock-auth';
import {
  formatCents,
  formatDate,
  getAccountCallsThisMonth,
  getAccountSavingsThisMonthCents,
  getAccountSpendThisMonthCents,
  getKeyBalanceCents,
  getKeyUsageSummary,
  getSpendLimit,
  getStarterKey,
  getTransactions,
  isLowBalance,
  isStarterUpgraded,
  keyLast4,
  listPaidKeys,
  type ApiKey,
  type Transaction,
} from '../../_lib/mock-store';
import { useMockStore } from '../../_lib/use-mock-store';
import { StripeCheckoutModal } from '../../_components/stripe-checkout-modal';
import { StatCard } from '../../_components/stat-card';
import { useLang } from '../../_lib/use-lang';

export default function OverviewPage() {
  const { user } = useMockAuth();
  const { t, tx, lang } = useLang();
  const calls = useMockStore(getAccountCallsThisMonth, 0);
  const spend = useMockStore(getAccountSpendThisMonthCents, 0);
  const savings = useMockStore(getAccountSavingsThisMonthCents, 0);
  const starter = useMockStore(() => getStarterKey() ?? null, null);
  const paidKeys = useMockStore(listPaidKeys, [] as ApiKey[]);
  const transactions = useMockStore(getTransactions, [] as Transaction[]);
  const spendLimit = useMockStore(getSpendLimit, {
    monthlyCapCents: 5000_00,
    resetDay: 1,
    warnAtPercents: [50, 75, 90],
  });

  const [addCreditsOpen, setAddCreditsOpen] = useState(false);
  const [addCreditsKeyId, setAddCreditsKeyId] = useState<string | null>(null);
  const openAddCreditsFor = (kid?: string) => {
    setAddCreditsKeyId(kid ?? null);
    setAddCreditsOpen(true);
  };

  const activePaidKeys = paidKeys.filter((k) => k.status === 'active');
  const recent = transactions.slice(0, 5);
  const hasFundedPaid = activePaidKeys.some(
    (k) => getKeyBalanceCents(k) > 0,
  );
  // We keep the raw percent (uncapped) so the KPI card reads correct when
  // the user has genuinely blown past the limit, but clamp the UI bar.
  const limitUsedPctRaw = (spend / Math.max(1, spendLimit.monthlyCapCents)) * 100;
  const limitUsedPct = Math.min(100, limitUsedPctRaw);

  // Rank paid keys by lifetime call volume for the "most active" section.
  const rankedPaidKeys = activePaidKeys
    .map((k) => ({ key: k, summary: getKeyUsageSummary(k.id) }))
    .sort((a, b) => b.summary.calls - a.summary.calls)
    .slice(0, 3);

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
            "Here's a snapshot of your Chivox MCP workspace — 1 free starter key + pay-as-you-go on paid keys.",
            '你的 Chivox MCP 工作区概览 — 1 把免费 Starter Key + 付费 Key 按用量计费。',
          )}
        </p>
      </div>

      {/* Account-wide alert stack — the overview's #1 job is to tell the
           developer the moment traffic is being throttled/blocked somewhere.
           Previously we only surfaced Starter-lifetime-exhausted here; now
           every production-relevant limit state is folded in (spend-cap,
           zero-balance paid keys, Starter daily cap, low-balance warnings,
           etc.) so the home page reflects the same reality Keys & Billing
           already know about. Renders nothing when the account is healthy. */}
      <AccountAlerts
        starter={starter}
        activePaidKeys={activePaidKeys}
        hasFundedPaid={hasFundedPaid}
        spendCents={spend}
        spendLimitCents={spendLimit.monthlyCapCents}
        limitUsedPctRaw={limitUsedPctRaw}
        onAddCredits={openAddCreditsFor}
      />

      {/* KPI row */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Activity}
          label={t('Calls this month', '本月调用次数')}
          value={calls.toLocaleString('en-US')}
          sub={t(
            `${activePaidKeys.length} active paid key${activePaidKeys.length === 1 ? '' : 's'} + 1 starter`,
            `${activePaidKeys.length} 把付费 Key + 1 把 Starter`,
          )}
          href="/dashboard/usage"
          cta={t('View usage', '查看用量')}
        />
        <StatCard
          icon={DollarSign}
          label={t('Spend this month', '本月消费')}
          value={formatCents(spend)}
          sub={t('Net cost · deducted from paid key credits', '净消费 · 从付费 Key 余额扣除')}
          href="/dashboard/billing"
          cta={t('Open billing', '打开账单')}
        />
        <StatCard
          icon={PiggyBank}
          label={t('Savings this month', '本月优惠')}
          value={formatCents(savings)}
          sub={t('Volume discounts applied automatically', '批量折扣自动应用')}
          href="/dashboard/billing/rates"
          cta={t('See tiers', '查看阶梯价')}
          tone="emerald"
        />
        <StatCard
          icon={Gauge}
          label={t('Spend limit used', '支出上限已用')}
          value={`${limitUsedPct.toFixed(1)}%`}
          sub={`${formatCents(spend)} / ${formatCents(spendLimit.monthlyCapCents)}`}
          href="/dashboard/billing?edit=spend-limit#spend-limit"
          cta={t('Adjust limit', '调整上限')}
          progressPct={limitUsedPct}
          progressColor={
            limitUsedPct >= 90
              ? 'bg-red-500'
              : limitUsedPct >= 75
                ? 'bg-amber-500'
                : 'bg-foreground'
          }
        />
      </div>

      {/* Starter key strip — ambient reminder the freebie is there. */}
      {starter && (
        <StarterKeyStrip apiKey={starter} />
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Paid keys list */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-background p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold">{tx('Your most active paid keys')}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {tx('Balance, spend cap and low-balance alerts at a glance.')}
              </p>
            </div>
            <Link
              href="/dashboard/keys"
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              {tx('All keys')} <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {rankedPaidKeys.length === 0 ? (
            <div className="text-center py-10 rounded-lg border border-dashed border-border">
              <Key className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium">{tx('No paid keys yet')}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {tx("You're fine on the starter key. When you need more, create a paid key.")}
              </p>
              <Link
                href="/dashboard/keys"
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-foreground hover:underline underline-offset-4"
              >
                {tx('Create a paid key')} <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {rankedPaidKeys.map(({ key, summary }) => {
                const balance = getKeyBalanceCents(key);
                const totalLoaded = key.paidCreditsCents;
                const paidPct =
                  totalLoaded > 0
                    ? Math.min(
                        100,
                        (key.paidCreditsUsedCents / totalLoaded) * 100,
                      )
                    : 0;
                const needsCredits = totalLoaded === 0 || balance === 0;
                return (
                  <li
                    key={key.id}
                    className="rounded-lg border border-border px-4 py-3 flex items-center gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium truncate">
                          {key.name}
                        </span>
                        <code className="font-mono text-[11px] text-muted-foreground">
                          {keyLast4(key.secret)}
                        </code>
                        <span
                          className={cn(
                            'text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded',
                            key.env === 'production'
                              ? 'bg-foreground/[0.04] text-foreground border border-border'
                              : 'bg-muted text-muted-foreground border border-border',
                          )}
                        >
                          {tx(key.env === 'production' ? 'Prod' : 'Dev')}
                        </span>
                        {needsCredits && (
                          <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400">
                            {tx('Needs credits')}
                          </span>
                        )}
                      </div>
                      <div className="mt-2">
                        {totalLoaded > 0 ? (
                          <BalanceBar
                            label={tx('Credits remaining')}
                            text={`${formatCents(balance)} ${t('of', '/')} ${formatCents(totalLoaded)}`}
                            pct={paidPct}
                          />
                        ) : (
                          <div className="text-[11px] text-muted-foreground">
                            {tx('No credits loaded — add some to activate this key.')}
                          </div>
                        )}
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                          {key.spendCapCents !== null && key.spendCapCents > 0 ? (
                            <span className="inline-flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {t(`Cap ${formatCents(key.spendCapCents)}/mo`, `上限 ${formatCents(key.spendCapCents)}/月`)}
                            </span>
                          ) : null}
                          {key.lowBalanceAlert?.enabled ? (
                            <span className="inline-flex items-center gap-1">
                              <Bell className="h-3 w-3" />
                              {t('Alert ≤', '提醒 ≤')}{' '}
                              {formatCents(key.lowBalanceAlert.thresholdCents)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs text-muted-foreground">{tx('Lifetime')}</div>
                      <div className="text-sm font-semibold tabular-nums">
                        {summary.calls.toLocaleString('en-US')}
                      </div>
                      <button
                        type="button"
                        onClick={() => openAddCreditsFor(key.id)}
                        className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-foreground hover:underline underline-offset-4"
                      >
                        <Plus className="h-3 w-3" /> {tx('Credits')}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Recent activity */}
        <div className="rounded-xl border border-border bg-background p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">{tx('Recent activity')}</h2>
            <Link
              href="/dashboard/billing/history"
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              {tx('View all')} <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              {tx('No activity yet. Add credits to a key to see them here.')}
            </p>
          ) : (
            <ul className="space-y-3">
              {recent.map((t) => {
                const isCard = t.kind === 'card-added';
                return (
                  <li key={t.id} className="flex items-center gap-3">
                    <div
                      className={cn(
                        'h-7 w-7 shrink-0 rounded-md flex items-center justify-center',
                        isCard
                          ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
                      )}
                    >
                      {isCard ? (
                        <CreditCard className="h-3.5 w-3.5" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">
                        {t.description}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatDate(t.createdAt)}
                      </p>
                    </div>
                    {!isCard && (
                      <span className="text-xs font-semibold tabular-nums">
                        +{formatCents(t.amountCents)}
                      </span>
                    )}
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
              {tx('Common next steps for pay-as-you-go teams.')}
            </p>
          </div>
          <Sparkles className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction
            href="/dashboard/keys"
            title={tx('Create paid key')}
            desc={tx('Spin up a scoped paid key under any project.')}
            icon={Key}
          />
          <QuickAction
            onClick={() => openAddCreditsFor()}
            title={tx('Add credits')}
            desc={tx('Pick a project + key, top up with Stripe.')}
            icon={DollarSign}
          />
          <QuickAction
            href="/dashboard/billing#spend-limit"
            title={tx('Review billing')}
            desc={tx('Spend, limit, credit balances per key.')}
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
            {tx('— volume discounts apply automatically.')}
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
        mode="add-credits"
        keyId={addCreditsKeyId ?? undefined}
      />
    </div>
  );
}

// ─── Alert stack ───────────────────────────────────────────────────────────
// The overview's single source of truth for "is anything wrong right now?".
// All inputs are pure derivations of data the page already loads; no new
// endpoints needed. Keep the evaluator pure (no hooks) so it's trivially
// unit-testable and the render function stays dumb.
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
  starter: ApiKey | null;
  activePaidKeys: ApiKey[];
  hasFundedPaid: boolean;
  spendCents: number;
  spendLimitCents: number;
  limitUsedPctRaw: number;
  onAddCredits: (keyId?: string) => void;
  t: (en: string, zh: string) => string;
  tx: (en: string) => string;
}

/**
 * Collect every production-impacting alert the account has right now and
 * return them in "what do I look at first" order (critical → warning, then
 * most actionable). Pure function, easy to exhaust-test.
 */
function buildAccountAlerts(i: AlertInputs): AlertRow[] {
  const { starter, activePaidKeys, hasFundedPaid, spendCents, spendLimitCents,
    limitUsedPctRaw, onAddCredits, t, tx } = i;

  const rows: AlertRow[] = [];

  // 1 ── Account monthly spend cap exceeded. Hardest stop: every paid call
  // is currently being rejected. Must top the list.
  if (limitUsedPctRaw >= 100) {
    rows.push({
      id: 'spend-cap-hit',
      severity: 'critical',
      icon: XOctagon,
      title: t('Monthly spend cap reached', '已达到本月支出上限'),
      desc: t(
        `You spent ${formatCents(spendCents)} of ${formatCents(spendLimitCents)}. Further paid calls are being rejected (SPEND_CAP_EXCEEDED) until you raise the cap or next UTC month.`,
        `本月消费 ${formatCents(spendCents)}/${formatCents(spendLimitCents)}。后续付费调用会被拒绝（SPEND_CAP_EXCEEDED），直到提高上限或进入下个 UTC 月。`,
      ),
      actions: [
        {
          label: t('Raise spend limit', '提高上限'),
          href: '/dashboard/billing?edit=spend-limit#spend-limit',
          primary: true,
        },
        { label: tx('Review usage'), href: '/dashboard/usage' },
      ],
    });
  }

  // 2 ── Active paid keys that were funded at some point but are now at
  // $0 balance. Calls through these keys will return INSUFFICIENT_CREDITS.
  // Ignore "never funded" keys here — those get their own softer alert
  // (#7 below) because they're a setup-in-progress state, not a regression.
  const depletedPaid = activePaidKeys.filter(
    (k) => k.paidCreditsCents > 0 && getKeyBalanceCents(k) === 0,
  );
  if (depletedPaid.length > 0) {
    const first = depletedPaid[0];
    rows.push({
      id: 'paid-zero-balance',
      severity: 'critical',
      icon: AlertTriangle,
      title: t(
        `${depletedPaid.length} paid key${depletedPaid.length === 1 ? '' : 's'} out of credits`,
        `${depletedPaid.length} 把付费 Key 余额耗尽`,
      ),
      desc: t(
        `${first.name} has $0 left — calls return INSUFFICIENT_CREDITS. Top up to resume traffic.`,
        `${first.name} 余额为 $0，调用会返回 INSUFFICIENT_CREDITS。充值后恢复服务。`,
      ),
      actions: [
        {
          label: t(`Top up ${first.name}`, `充值 ${first.name}`),
          onClick: () => onAddCredits(first.id),
          primary: true,
        },
        { label: tx('Open keys'), href: '/dashboard/keys' },
      ],
    });
  }

  // 3 ── Starter lifetime exhausted. Severity depends on whether a funded
  // paid key can take over traffic. If no funded fallback: critical
  // (examples & quickstarts stop working). If paid is funded: warning
  // (still worth noting so they know to re-point tutorials to a paid key).
  if (starter && starter.freeTotalUsed >= starter.freeTotalLimit && !isStarterUpgraded(starter)) {
    const firstPaid = activePaidKeys[0];
    if (!hasFundedPaid) {
      rows.push({
        id: 'starter-exhausted',
        severity: 'critical',
        icon: Zap,
        title: t('Starter key is used up (900 / 900)', 'Starter Key 已用尽（900 / 900）'),
        desc: tx(
          'The 900 free lifetime calls are spent. Fund a paid key or top up the Starter to keep your integrations running.',
        ),
        actions: firstPaid
          ? [
              {
                label: t(`Top up ${firstPaid.name}`, `充值 ${firstPaid.name}`),
                onClick: () => onAddCredits(firstPaid.id),
                primary: true,
              },
              { label: tx('View pricing'), href: '/dashboard/billing/rates' },
            ]
          : [
              {
                label: tx('Top up Starter'),
                onClick: () => onAddCredits(starter.id),
                primary: true,
              },
              {
                label: tx('Create paid key'),
                href: '/dashboard/keys#create-paid-key',
              },
            ],
      });
    } else {
      rows.push({
        id: 'starter-exhausted-soft',
        severity: 'warning',
        icon: Zap,
        title: tx('Starter key is used up'),
        desc: tx(
          'Lifetime 900 spent. Your paid keys still serve traffic; switch samples / tutorials off the Starter when convenient.',
        ),
        actions: [{ label: tx('Open keys'), href: '/dashboard/keys' }],
      });
    }
  }

  // 4 ── Starter daily cap hit today (resets at next UTC midnight). Only
  // surface when lifetime is NOT exhausted — otherwise #3 subsumes it.
  if (
    starter &&
    !isStarterUpgraded(starter) &&
    starter.freeDailyUsed >= starter.freeDailyLimit &&
    starter.freeTotalUsed < starter.freeTotalLimit
  ) {
    rows.push({
      id: 'starter-daily-hit',
      severity: 'warning',
      icon: Calendar,
      title: t(
        `Starter daily cap hit (${starter.freeDailyUsed}/${starter.freeDailyLimit})`,
        `Starter 今日额度已用完（${starter.freeDailyUsed}/${starter.freeDailyLimit}）`,
      ),
      desc: tx(
        'Today\'s Starter calls will 429 until UTC midnight. Top up the Starter to lift the daily cap, or route traffic to a paid key.',
      ),
      actions: [
        {
          label: tx('Top up Starter'),
          onClick: () => onAddCredits(starter.id),
          primary: true,
        },
        { label: tx('Open keys'), href: '/dashboard/keys' },
      ],
    });
  }

  // 5 ── One or more paid keys crossed their low-balance alert threshold.
  // Not blocking yet, but the developer asked to be told early.
  const lowPaid = activePaidKeys.filter(isLowBalance);
  if (lowPaid.length > 0) {
    const first = lowPaid[0];
    const remaining = getKeyBalanceCents(first);
    rows.push({
      id: 'paid-low-balance',
      severity: 'warning',
      icon: Bell,
      title: t(
        `${lowPaid.length} paid key${lowPaid.length === 1 ? '' : 's'} low on credits`,
        `${lowPaid.length} 把付费 Key 余额偏低`,
      ),
      desc: t(
        `${first.name} has ${formatCents(remaining)} left (alert set at ${formatCents(first.lowBalanceAlert!.thresholdCents)}).`,
        `${first.name} 余额 ${formatCents(remaining)}（告警阈值 ${formatCents(first.lowBalanceAlert!.thresholdCents)}）。`,
      ),
      actions: [
        {
          label: t(`Top up ${first.name}`, `充值 ${first.name}`),
          onClick: () => onAddCredits(first.id),
          primary: true,
        },
      ],
    });
  }

  // 6 ── Spend cap approaching. We only bother at ≥ 90% so we don't spam
  // noisy banners at 75%; the KPI tile already shows amber there.
  if (limitUsedPctRaw >= 90 && limitUsedPctRaw < 100) {
    rows.push({
      id: 'spend-cap-near',
      severity: 'warning',
      icon: Gauge,
      title: t(
        `Spend cap ${limitUsedPctRaw.toFixed(0)}% used`,
        `支出上限已用 ${limitUsedPctRaw.toFixed(0)}%`,
      ),
      desc: t(
        `${formatCents(spendCents)} of ${formatCents(spendLimitCents)} used this month. Calls will be rejected once the cap is hit.`,
        `本月已消费 ${formatCents(spendCents)}/${formatCents(spendLimitCents)}。到达上限后调用会被拒绝。`,
      ),
      actions: [
        {
          label: tx('Adjust limit'),
          href: '/dashboard/billing?edit=spend-limit#spend-limit',
          primary: true,
        },
      ],
    });
  }

  // 7 ── Paid keys that were created but never funded. Lowest priority —
  // it's a setup TODO more than a regression. Skip if we already surfaced
  // a depleted-paid alert; they'd be redundant signals.
  const neverFundedPaid = activePaidKeys.filter((k) => k.paidCreditsCents === 0);
  if (neverFundedPaid.length > 0 && depletedPaid.length === 0) {
    const first = neverFundedPaid[0];
    rows.push({
      id: 'paid-not-activated',
      severity: 'warning',
      icon: Key,
      title: t(
        `${neverFundedPaid.length} paid key${neverFundedPaid.length === 1 ? '' : 's'} not yet activated`,
        `${neverFundedPaid.length} 把付费 Key 尚未激活`,
      ),
      desc: tx(
        'Paid keys need credits before they can serve traffic. Top up any amount to activate.',
      ),
      actions: [
        {
          label: t(`Fund ${first.name}`, `为 ${first.name} 充值`),
          onClick: () => onAddCredits(first.id),
          primary: true,
        },
      ],
    });
  }

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

/**
 * Thin highlight strip for the starter key. Keeps the freebie visible
 * without dominating the layout. Tap-target links to the Keys page where
 * the full starter card lives.
 *
 * Three visual states, driven by `isStarterUpgraded` + exhaustion:
 *  - **Free (default)**  — emerald gradient, "Free · complimentary" badge,
 *                          today/lifetime quota bars in emerald.
 *  - **Upgraded**        — purple gradient, "Upgraded · cap lifted" badge.
 *                          The daily/lifetime bars are de-emphasised (muted
 *                          + line-through numbers) to signal that those
 *                          caps no longer gate traffic, and a Balance
 *                          sparkline is added showing paid credits so the
 *                          developer sees exactly where calls are being
 *                          charged post top-up.
 *  - **Exhausted (free)**— same emerald chrome, but with an Exhausted
 *                          badge; bars stay at 100%.
 */
function StarterKeyStrip({ apiKey }: { apiKey: ApiKey }) {
  const { t, tx } = useLang();
  const upgraded = isStarterUpgraded(apiKey);
  const exhausted = !upgraded && apiKey.freeTotalUsed >= apiKey.freeTotalLimit;
  const dailyPct = Math.min(
    100,
    (apiKey.freeDailyUsed / Math.max(1, apiKey.freeDailyLimit)) * 100,
  );
  const totalPct = Math.min(
    100,
    (apiKey.freeTotalUsed / Math.max(1, apiKey.freeTotalLimit)) * 100,
  );
  const balanceCents = getKeyBalanceCents(apiKey);
  const paidPct =
    apiKey.paidCreditsCents > 0
      ? Math.min(
          100,
          (apiKey.paidCreditsUsedCents / apiKey.paidCreditsCents) * 100,
        )
      : 0;

  return (
    <Link
      href="/dashboard/keys"
      className={cn(
        'block rounded-xl border transition-colors',
        upgraded
          ? 'border-purple-500/25 bg-gradient-to-br from-purple-500/[0.05] to-background hover:from-purple-500/[0.09]'
          : 'border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.04] to-background hover:from-emerald-500/[0.07]',
      )}
    >
      <div className="p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={cn(
              'h-8 w-8 rounded-md border flex items-center justify-center shrink-0',
              upgraded
                ? 'bg-purple-500/10 border-purple-500/30'
                : 'bg-emerald-500/10 border-emerald-500/30',
            )}
          >
            <Gift
              className={cn(
                'h-4 w-4',
                upgraded
                  ? 'text-purple-600 dark:text-purple-400'
                  : 'text-emerald-600 dark:text-emerald-400',
              )}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold">{tx('Starter key')}</span>
              {upgraded ? (
                <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-700 dark:text-purple-400">
                  {t('Upgraded · cap lifted', '已升级 · 解除封顶')}
                </span>
              ) : exhausted ? (
                <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  {tx('Exhausted')}
                </span>
              ) : (
                <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                  {tx('Free · complimentary')}
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              {upgraded
                ? t(
                    `Calls now billed from credits · ${formatCents(balanceCents)} left`,
                    `现从付费余额扣费 · 余额 ${formatCents(balanceCents)}`,
                  )
                : tx('Included with your account · 30/day · 900 lifetime')}
            </p>
          </div>
        </div>

        <div
          className={cn(
            'flex-1 min-w-[200px] grid gap-4 max-w-xl',
            upgraded ? 'grid-cols-3' : 'grid-cols-2',
          )}
        >
          <MiniQuota
            label={tx('Today')}
            used={apiKey.freeDailyUsed}
            limit={apiKey.freeDailyLimit}
            pct={dailyPct}
            struck={upgraded}
          />
          <MiniQuota
            label={tx('Lifetime')}
            used={apiKey.freeTotalUsed}
            limit={apiKey.freeTotalLimit}
            pct={totalPct}
            struck={upgraded}
          />
          {upgraded && (
            <MiniQuota
              label={tx('Balance')}
              used={apiKey.paidCreditsUsedCents}
              limit={apiKey.paidCreditsCents}
              pct={paidPct}
              tone="purple"
              formatAsMoney
            />
          )}
        </div>

        <ArrowUpRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </div>
    </Link>
  );
}

/**
 * Two rendering modes:
 *  - Integer counts (default) — used for free daily/lifetime call quotas.
 *  - Money (`formatAsMoney`)  — used for the paid credit balance bar so
 *                               numbers read "$12.34" instead of "1234".
 * `struck` mutes the bar + line-throughs the numbers to communicate that
 * the cap is no longer applicable (e.g. Starter upgraded).
 */
function MiniQuota({
  label,
  used,
  limit,
  pct,
  struck = false,
  tone = 'emerald',
  formatAsMoney = false,
}: {
  label: string;
  used: number;
  limit: number;
  pct: number;
  struck?: boolean;
  tone?: 'emerald' | 'purple';
  formatAsMoney?: boolean;
}) {
  const fmt = (n: number) => (formatAsMoney ? formatCents(n) : n.toLocaleString());
  return (
    <div className={cn(struck && 'opacity-60')}>
      <div className="flex items-baseline justify-between text-[10px]">
        <span className="font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </span>
        <span
          className={cn(
            'tabular-nums text-muted-foreground',
            struck && 'line-through',
          )}
        >
          <span
            className={cn(
              'text-foreground',
              struck ? 'font-normal' : 'font-semibold',
            )}
          >
            {fmt(used)}
          </span>{' '}
          / {fmt(limit)}
        </span>
      </div>
      <div className="mt-1 h-1 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            'h-full transition-all',
            struck
              ? 'bg-muted-foreground/30'
              : pct >= 90
                ? 'bg-amber-500'
                : tone === 'purple'
                  ? 'bg-purple-500/80'
                  : 'bg-emerald-500/80',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function BalanceBar({
  label,
  text,
  pct,
  className,
}: {
  label: string;
  text: string;
  pct: number;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{label}</span>
        <span className="tabular-nums">{text}</span>
      </div>
      <div className="mt-1 h-1 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            'h-full',
            pct >= 90 ? 'bg-amber-500' : 'bg-foreground/70',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
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
