'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, CalendarDays, Gauge, Sparkles, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  formatCalls,
  getAccountEvaluationPoints,
  getAccountCallsThisMonth,
  getAccountCallsToday,
  getAccountTrialRemaining,
  getSpendLimit,
  getTrial,
  getWallet,
  TRIAL_DEFAULT_TOTAL,
  type AccountTrialRemaining,
  type AccountWallet,
  type SpendLimit,
  type TrialAllowance,
} from '../_lib/mock-store';
import { useMockStore } from '../_lib/use-mock-store';
import { useLang } from '../_lib/use-lang';
import { getTrialValidityRemainingProgress } from '../_lib/trial-validity-progress.mjs';

const DEFAULT_WALLET: AccountWallet = {
  paidEvaluationPoints: 0,
  usedEvaluationPoints: 0,
  paidCreditsCents: 0,
  paidCreditsUsedCents: 0,
};
const DEFAULT_TRIAL: AccountTrialRemaining = {
  totalLeft: 0,
  totalExhausted: true,
  expired: false,
  expiresAt: new Date().toISOString(),
  daysLeft: 0,
};
const DEFAULT_TRIAL_PACKAGE: TrialAllowance = {
  totalLimit: TRIAL_DEFAULT_TOTAL,
  totalUsed: 0,
  grantedAt: new Date().toISOString(),
  expiresAt: new Date().toISOString(),
};
const EMPTY_LIMIT: SpendLimit = {
  monthlyPointCap: null,
  monthlyCallCap: null,
  dailyPointCap: null,
  dailyCallCap: null,
  resetDay: 1,
  warnAtPercents: [50, 75, 90],
};

/**
 * Account-level paid points + trial summary strip.
 *
 * Two zones: paid evaluation points on the left, free-trial points on the
 * right. Product-facing availability is expressed only in evaluation points.
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
  const evaluationPoints = useMockStore(getAccountEvaluationPoints, 0);
  const trial = useMockStore(getAccountTrialRemaining, DEFAULT_TRIAL);
  const trialPackage = useMockStore(getTrial, DEFAULT_TRIAL_PACKAGE);
  const spendLimit = useMockStore(getSpendLimit, EMPTY_LIMIT);
  const callsToday = useMockStore(getAccountCallsToday, 0);
  const callsMonth = useMockStore(getAccountCallsThisMonth, 0);
  const { t, tx, lang } = useLang();
  const [validityNow, setValidityNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setValidityNow(Date.now()), 60 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, []);

  const totalPct =
    trialPackage.totalLimit > 0
      ? (trial.totalLeft / trialPackage.totalLimit) * 100
      : 0;
  const validityRemainingPct = getTrialValidityRemainingProgress(
    trialPackage.grantedAt,
    trial.expiresAt,
    validityNow,
  );
  const expiresAtMs = Date.parse(trial.expiresAt);
  const liveDaysLeft = Number.isFinite(expiresAtMs)
    ? Math.max(0, Math.ceil((expiresAtMs - validityNow) / 86400000))
    : trial.daysLeft;
  const allowanceStatus =
    totalPct <= 10
      ? t('Almost spent', '评测积分不足')
      : totalPct <= 30
        ? t('Running low', '评测积分较少')
        : t('Plenty left', '评测积分充足');

  // Once the signup trial package is consumed or expired, the trial section
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
          <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground">
            {t('Points', '评测积分')}
          </span>
          <span className="text-sm font-semibold tabular-nums">
            {evaluationPoints.toLocaleString('en-US')}
          </span>
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground">
            {t('Free trial', '免费试用')}
          </span>
          <span className="text-sm font-semibold tabular-nums">
            {formatCalls(trial.totalLeft)}/{formatCalls(trialPackage.totalLimit)}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {trial.expired
              ? t('expired', '已过期')
              : t(`${liveDaysLeft}d left`, `剩余 ${liveDaysLeft} 天`)}
          </span>
        </div>
        <button
          type="button"
          onClick={onAddCredits}
          className="ml-auto inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-foreground text-background text-xs font-semibold hover:brightness-110"
        >
          {tx('Add points')}
        </button>
      </div>
    );
  }

  // Right-zone selection:
  //  - trial active     → show trial bars
  //  - trial done + call caps configured → show usage vs configured caps
  //  - trial done + no call caps → still show the trial panel (exhausted),
  //    so the strip keeps its two-zone layout instead of a sparse full-width
  //    wallet card. (Spend-only caps don't drive the usage panel.)
  const showCapPanel = trialFinished && (hasDailyLimit || hasMonthlyLimit);
  const showTrial = !showCapPanel;

  return (
    <div
      className={cn(
        'grid gap-3 md:gap-3 md:grid-cols-[1.05fr_1.4fr]',
        className,
      )}
    >
      {/* ── Zone A · Paid evaluation points ─────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-100 p-5 shadow-sm">
        {/* Decorative底纹 — a faint dot-grid weave + a diagonal sheen so the
            dark panel reads as textured stock rather than a flat fill. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage:
              'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)',
            backgroundSize: '14px 14px',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'repeating-linear-gradient(135deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 11px)',
          }}
        />
        {/* Decorative glyphs — pushed off-canvas, very low opacity. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-gradient-to-br from-emerald-400/20 to-transparent blur-2xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-10 -bottom-12 h-36 w-36 rounded-full bg-gradient-to-tr from-sky-400/10 to-transparent blur-2xl"
        />
        <Sparkles
          aria-hidden
          className="pointer-events-none absolute right-4 top-4 h-7 w-7 text-white/10"
        />

        <div className="relative">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-300/80">
            {t('Evaluation points', '评测积分')}
          </div>

          <div className="mt-2 flex items-end gap-3 flex-wrap">
            <div className="text-[34px] font-bold tabular-nums tracking-[-0.025em] leading-none text-white">
              {evaluationPoints.toLocaleString('en-US')}
            </div>
          </div>

          <div className="mt-2 text-[11.5px] text-slate-400 tabular-nums">
            {t(
              `${wallet.usedEvaluationPoints.toLocaleString('en-US')} used · ${wallet.paidEvaluationPoints.toLocaleString('en-US')} credited`,
              `已用 ${wallet.usedEvaluationPoints.toLocaleString('en-US')} · 累计到账 ${wallet.paidEvaluationPoints.toLocaleString('en-US')}`,
            )}
          </div>

          <button
            type="button"
            onClick={onAddCredits}
            className="group relative mt-4 inline-flex h-10 items-center gap-2 overflow-hidden rounded-xl border border-zinc-200/80 bg-white px-3 pr-3.5 text-[13px] font-semibold text-[#10233f] shadow-[0_8px_20px_-12px_rgba(0,0,0,0.45)] transition-all hover:-translate-y-px hover:shadow-[0_12px_24px_-12px_rgba(0,0,0,0.55)] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            {/* Green top accent — the one deliberate flourish that keeps this
                from reading as a default white pill; echoes the card's glow. */}
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-emerald-400 to-teal-400"
            />
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-emerald-400/15 to-teal-400/15 text-emerald-600 ring-1 ring-emerald-500/20">
              <Wallet className="h-3.5 w-3.5" strokeWidth={2.5} />
            </span>
            {tx('Add points')}
            <ArrowRight className="h-3.5 w-3.5 text-[#10233f]/45 transition-all group-hover:translate-x-0.5 group-hover:text-[#10233f]" />
          </button>
        </div>
      </div>

      {/* ── Zone B · Trial OR account-limit usage ───────────────── */}
      {showTrial ? (
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/25 bg-white dark:bg-emerald-950/20 p-5">
            {/* Decorative底纹 — a soft emerald dot-grid that echoes the wallet
                card's weave, keeping the two zones a matched pair. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-60"
              style={{
                backgroundImage:
                  'radial-gradient(rgba(16,185,129,0.10) 1px, transparent 1px)',
                backgroundSize: '14px 14px',
              }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br from-emerald-400/20 to-transparent blur-2xl"
            />
            <div className="relative">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-400">
                <Sparkles className="h-3 w-3" />
                {t('Free trial allowance', '免费试用评测积分')}
              </div>

              <div className="mt-3.5 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-stretch">
                <div className="flex min-w-0 flex-col justify-between py-1">
                  <UsageBar
                    label={t('Points remaining', '剩余评测积分')}
                    left={trial.totalLeft}
                    total={trialPackage.totalLimit}
                    pct={totalPct}
                    mode="remaining"
                    prominent
                    status={allowanceStatus}
                  />
                  <p className="mt-4 text-[10.5px] leading-snug text-emerald-700/70 dark:text-emerald-400/60">
                    {t(
                      'Granted at signup · shared by every key on the account · expires when the window ends.',
                      '注册试用 · 所有 Key 共享 · 到期后自动失效。',
                    )}
                  </p>
                </div>

                <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] p-4 shadow-sm shadow-emerald-950/[0.04] dark:bg-emerald-500/[0.08]">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700/80 dark:text-emerald-300/80">
                    <CalendarDays className="h-3 w-3" />
                    {t('Valid through', '有效期至')}
                  </div>
                  <div className="mt-2 text-[14px] font-semibold tabular-nums tracking-[-0.01em] text-foreground">
                    {new Date(trial.expiresAt).toLocaleDateString(
                      lang === 'zh' ? 'zh-CN' : 'en-US',
                      { month: 'short', day: 'numeric', year: 'numeric' },
                    )}
                  </div>
                  <div className="mt-1 text-[10.5px] text-muted-foreground">
                    {trial.expired
                      ? t('Trial window has ended', '试用期已结束')
                      : t(`${liveDaysLeft} days left`, `剩余 ${liveDaysLeft} 天`)}
                  </div>
                  <div
                    role="progressbar"
                    aria-label={t('Trial time remaining', '试用期剩余时间')}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={validityRemainingPct}
                    className="mt-3 h-1 overflow-hidden rounded-full bg-emerald-950/10 dark:bg-emerald-50/10"
                  >
                    <div
                      className="h-full rounded-full bg-emerald-500/65 transition-all"
                      style={{ width: `${validityRemainingPct}%` }}
                    />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[9px] text-muted-foreground/80">
                    <span>{t('Time remaining', '剩余有效期')}</span>
                    <span>{t(`${liveDaysLeft}d left`, `剩余 ${liveDaysLeft} 天`)}</span>
                  </div>
                </div>
              </div>
            </div>
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
        )}
    </div>
  );
}

/**
 * Compact bar that renders either:
 *  - `remaining` mode (trial): "Remaining 780 / 900" — full bar = lots left,
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
  prominent = false,
  status,
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
  /** Larger trial-allowance treatment for the hero strip. */
  prominent?: boolean;
  /** Optional status chip displayed beside a prominent value. */
  status?: string;
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
        {prominent && (
          <div className="text-xs font-medium text-muted-foreground">
            {label}
          </div>
        )}
        <div className={cn('flex justify-between gap-2', prominent ? 'mt-1.5 items-center' : 'items-baseline')}>
          {!prominent && (
            <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
          )}
          <span className={cn('tabular-nums', prominent ? 'text-[24px] leading-none' : 'text-[11.5px]')}>
            <span className="font-semibold text-foreground">{formatCalls(safeLeft)}</span>
            <span className="text-muted-foreground"> / {formatCalls(total)}</span>
          </span>
          {prominent && status && (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {status}
            </span>
          )}
        </div>
        <div
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(remainingPct)}
          className={cn('mt-1.5 overflow-hidden rounded-full bg-muted', prominent ? 'h-2' : 'h-1.5')}
        >
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
