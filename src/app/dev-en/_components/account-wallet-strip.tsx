'use client';

import { Gauge, Plus, Sparkles, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  formatCalls,
  formatCents,
  getAccountBalanceCents,
  getAccountCallsThisMonth,
  getAccountCallsToday,
  getAccountTrialRemaining,
  getSpendLimit,
  getWallet,
  type AccountTrialRemaining,
  type AccountWallet,
  type SpendLimit,
} from '../_lib/mock-store';
import { useMockStore } from '../_lib/use-mock-store';
import { useLang } from '../_lib/use-lang';

const DEFAULT_WALLET: AccountWallet = {
  paidCreditsCents: 0,
  paidCreditsUsedCents: 0,
  bonusReceivedCents: 0,
};
const DEFAULT_TRIAL: AccountTrialRemaining = {
  dailyLeft: 0,
  totalLeft: 0,
  dailyExhausted: true,
  totalExhausted: true,
};
const EMPTY_LIMIT: SpendLimit = {
  monthlyCapCents: null,
  monthlyCallCap: null,
  dailyCapCents: null,
  dailyCallCap: null,
  resetDay: 1,
  warnAtPercents: [50, 75, 90],
};

const TRIAL_DAILY_LIMIT = 30;
const TRIAL_TOTAL_LIMIT = 900;

/**
 * Account-level wallet + trial summary strip.
 *
 * Visual goal is a single cohesive card with two clearly delimited
 * zones — Wallet on the left (money) and Trial on the right (calls) —
 * separated by a soft vertical rule. The CTA sits inline with the
 * wallet headline so users don't read a third "column" of unrelated
 * helper text.
 *
 * The previous version stacked label + number + subtext + bonus chip in
 * a busy column and pushed the CTA into its own micro-column with a
 * helper paragraph; that read as three competing things. This version
 * collapses that into one balance row + one supporting row.
 */
export function AccountWalletStrip({
  onAddCredits,
  variant = 'full',
  className,
}: {
  onAddCredits: () => void;
  /** `full` = two-zone hero strip; `compact` = single-line summary. */
  variant?: 'full' | 'compact';
  className?: string;
}) {
  const wallet = useMockStore(getWallet, DEFAULT_WALLET);
  const balance = useMockStore(getAccountBalanceCents, 0);
  const trial = useMockStore(getAccountTrialRemaining, DEFAULT_TRIAL);
  const spendLimit = useMockStore(getSpendLimit, EMPTY_LIMIT);
  const callsToday = useMockStore(getAccountCallsToday, 0);
  const callsMonth = useMockStore(getAccountCallsThisMonth, 0);
  const { t, tx } = useLang();

  const dailyPct = (trial.dailyLeft / TRIAL_DAILY_LIMIT) * 100;
  const totalPct = (trial.totalLeft / TRIAL_TOTAL_LIMIT) * 100;

  // Once the lifetime trial pool is fully consumed, the trial section
  // is no longer meaningful. We swap it out for a "usage vs your caps"
  // panel so the strip still surfaces a useful right-hand zone post-trial.
  const trialFinished = trial.totalExhausted;
  const hasDailyLimit = spendLimit.dailyCallCap != null && spendLimit.dailyCallCap > 0;
  const hasMonthlyLimit = spendLimit.monthlyCallCap != null && spendLimit.monthlyCallCap > 0;

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'rounded-xl border border-border bg-background px-4 py-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5',
          className,
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground">
            {t('Wallet', '钱包')}
          </span>
          <span className="text-sm font-semibold tabular-nums">
            {formatCents(balance)}
          </span>
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground">
            {t('Free trial', '免费试用')}
          </span>
          <span className="text-sm font-semibold tabular-nums">
            {formatCalls(trial.totalLeft)}/{formatCalls(TRIAL_TOTAL_LIMIT)}
          </span>
        </div>
        <button
          type="button"
          onClick={onAddCredits}
          className="ml-auto inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-foreground text-background text-xs font-semibold hover:brightness-110"
        >
          {tx('Add credits')}
        </button>
      </div>
    );
  }

  // Right-zone selection:
  //  - trial active     → show trial bars
  //  - trial done + caps configured → show usage vs configured caps
  //  - trial done + no caps → hide right zone, wallet takes full width
  const showTrial = !trialFinished;
  const showCapPanel = trialFinished && (hasDailyLimit || hasMonthlyLimit);
  const showRightZone = showTrial || showCapPanel;

  return (
    <div
      className={cn(
        'grid gap-3 md:gap-3',
        showRightZone ? 'md:grid-cols-[1.05fr_1.4fr]' : 'md:grid-cols-1',
        className,
      )}
    >
      {/* ── Zone A · Wallet card ──────────────────────────────────
          Premium credit-card aesthetic: deep slate gradient with a
          decorative wallet glyph in the corner. The balance reads as
          the hero in light-weight display text against the dark panel,
          and the bright "+ Add credits" pill becomes the unmissable
          primary action on the page. */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-100 p-5 shadow-sm">
        {/* Decorative glyphs — pushed off-canvas, very low opacity. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-gradient-to-br from-emerald-400/20 to-transparent blur-2xl"
        />
        <Wallet
          aria-hidden
          className="pointer-events-none absolute right-4 top-4 h-7 w-7 text-white/10"
        />

        <div className="relative">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-300/80">
            {t('Wallet balance', '钱包余额')}
          </div>

          <div className="mt-2 flex items-end gap-3 flex-wrap">
            <div className="text-[34px] font-bold tabular-nums tracking-[-0.025em] leading-none text-white">
              {formatCents(balance)}
            </div>
            {wallet.bonusReceivedCents > 0 && (
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold bg-emerald-400/15 text-emerald-300 border border-emerald-400/25 mb-0.5">
                {t(
                  `+${formatCents(wallet.bonusReceivedCents)} bonus`,
                  `已赠送 +${formatCents(wallet.bonusReceivedCents)}`,
                )}
              </span>
            )}
          </div>

          <div className="mt-2 text-[11.5px] text-slate-400 tabular-nums">
            {t(
              `${formatCents(wallet.paidCreditsUsedCents)} spent · ${formatCents(wallet.paidCreditsCents)} topped up`,
              `已用 ${formatCents(wallet.paidCreditsUsedCents)} · 累计充值 ${formatCents(wallet.paidCreditsCents)}`,
            )}
          </div>

          <button
            type="button"
            onClick={onAddCredits}
            className="mt-4 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-white text-slate-900 text-[13px] font-semibold hover:bg-slate-100 transition-colors shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            {tx('Add credits')}
          </button>
        </div>
      </div>

      {/* ── Zone B · Trial OR account-limit usage ───────────────── */}
      {showRightZone &&
        (showTrial ? (
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-50 via-emerald-50/40 to-background dark:from-emerald-500/[0.08] dark:via-emerald-500/[0.03] dark:to-background p-5">
            <Sparkles
              aria-hidden
              className="pointer-events-none absolute right-4 top-4 h-6 w-6 text-emerald-500/15"
            />
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-400">
              <Sparkles className="h-3 w-3" />
              {t('Free trial allowance', '免费试用额度')}
            </div>
            <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              <UsageBar
                label={t('Today', '今日')}
                left={trial.dailyLeft}
                total={TRIAL_DAILY_LIMIT}
                pct={dailyPct}
                mode="remaining"
              />
              <UsageBar
                label={t('Lifetime', '终身')}
                left={trial.totalLeft}
                total={TRIAL_TOTAL_LIMIT}
                pct={totalPct}
                mode="remaining"
              />
            </div>
            <p className="mt-3 text-[10.5px] text-emerald-700/70 dark:text-emerald-400/60 leading-snug">
              {t(
                'Resets daily at 00:00 UTC · shared by every key on the account.',
                '每日 UTC 00:00 重置 · 所有 Key 共享。',
              )}
            </p>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-2xl border border-border bg-muted/30 p-5">
            <Gauge
              aria-hidden
              className="pointer-events-none absolute right-4 top-4 h-6 w-6 text-foreground/10"
            />
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <Gauge className="h-3 w-3" />
              {t('Account usage', '账户使用')}
            </div>
            <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              {hasDailyLimit && (
                <UsageBar
                  label={t('Today', '今日')}
                  used={callsToday}
                  total={spendLimit.dailyCallCap as number}
                  mode="used"
                />
              )}
              {hasMonthlyLimit && (
                <UsageBar
                  label={t('This month', '本月')}
                  used={callsMonth}
                  total={spendLimit.monthlyCallCap as number}
                  mode="used"
                />
              )}
            </div>
            <p className="mt-3 text-[10.5px] text-muted-foreground/70 leading-snug">
              {t(
                'Configured in Settings · adjust caps anytime.',
                '在「设置」中配置，可随时调整。',
              )}
            </p>
          </div>
        ))}
    </div>
  );
}

/**
 * Compact bar that renders either:
 *  - `remaining` mode (trial): "Today 12 / 30" — full bar = lots left,
 *    drains amber as it nears empty.
 *  - `used` mode (post-trial cap usage): "Today 1,240 / 5,000" — bar
 *    fills up as the user consumes their configured cap, going amber
 *    near the ceiling.
 *
 * Numbers sit on the right of the label so the line reads as a stat,
 * not a labelled gauge.
 */
function UsageBar({
  label,
  left,
  used,
  total,
  pct,
  mode,
}: {
  label: string;
  total: number;
  mode: 'remaining' | 'used';
  /** required when `mode === 'remaining'` */
  left?: number;
  /** required when `mode === 'used'` */
  used?: number;
  /** Optional explicit percentage override (remaining mode only). */
  pct?: number;
}) {
  if (mode === 'remaining') {
    const safeLeft = left ?? 0;
    const remainingPct = Math.max(
      0,
      Math.min(100, pct ?? (total > 0 ? (safeLeft / total) * 100 : 0)),
    );
    const low = remainingPct <= 10;
    const med = remainingPct <= 30 && remainingPct > 10;
    return (
      <div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
          <span className="text-[11.5px] tabular-nums">
            <span className="font-semibold text-foreground">{formatCalls(safeLeft)}</span>
            <span className="text-muted-foreground"> / {formatCalls(total)}</span>
          </span>
        </div>
        <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              low ? 'bg-amber-500' : med ? 'bg-emerald-500/60' : 'bg-emerald-500',
            )}
            style={{ width: `${remainingPct}%` }}
          />
        </div>
      </div>
    );
  }

  const safeUsed = used ?? 0;
  const usedPct = total > 0 ? Math.max(0, Math.min(100, (safeUsed / total) * 100)) : 0;
  const high = usedPct >= 90;
  const med = usedPct >= 70 && usedPct < 90;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
        <span className="text-[11.5px] tabular-nums">
          <span className="font-semibold text-foreground">{formatCalls(safeUsed)}</span>
          <span className="text-muted-foreground"> / {formatCalls(total)}</span>
        </span>
      </div>
      <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            high ? 'bg-amber-500' : med ? 'bg-foreground/60' : 'bg-emerald-500',
          )}
          style={{ width: `${usedPct}%` }}
        />
      </div>
    </div>
  );
}
