'use client';

import { TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLang } from '../_lib/use-lang';
import {
  MIN_TOPUP_CENTS,
  PRICING_TIERS,
  TRIAL_CALLS,
  TRIAL_VALID_DAYS,
  formatUnitDollars,
  getTierIndexForMonthlyCalls,
  tierVolumeLabel,
} from '../_lib/topup';
import { formatCents } from '../_lib/mock-store';

interface PricingTierLadderProps {
  /** Calls made this calendar month — highlights the active tier when set. */
  callsThisMonth?: number;
  /** `compact` fits inside modals; `card` is for full-width pages. */
  variant?: 'compact' | 'card';
  showTrial?: boolean;
  showFooter?: boolean;
  className?: string;
}

/**
 * Visual tier ladder — monthly volume on the left, unit price on the right.
 * Highlights the row that matches `callsThisMonth` so the stepped pricing
 * reads at a glance instead of hiding inside a min–max call range.
 */
export function PricingTierLadder({
  callsThisMonth,
  variant = 'compact',
  showTrial = true,
  showFooter = true,
  className,
}: PricingTierLadderProps) {
  const { t } = useLang();
  const activeTier =
    callsThisMonth != null ? getTierIndexForMonthlyCalls(callsThisMonth) : -1;

  const compact = variant === 'compact';

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-background',
        compact ? 'text-[11px]' : 'text-sm',
        className,
      )}
    >
      <div
        className={cn(
          'flex items-center gap-1.5 border-b border-border/70 bg-muted/25 font-semibold text-muted-foreground',
          compact ? 'px-3 py-2 text-[10px] uppercase tracking-wider' : 'px-5 py-2.5 text-[11px] uppercase tracking-wider',
        )}
      >
        <TrendingDown className={cn('text-emerald-500', compact ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
        {t('Monthly volume tiers', '月用量阶梯价')}
        {activeTier >= 0 && (
          <span className="ml-auto normal-case tracking-normal font-medium text-emerald-700 dark:text-emerald-400">
            {t('Your tier', '当前档位')}
          </span>
        )}
      </div>

      <div className="divide-y divide-border/80">
        {showTrial && (
          <LadderRow
            compact={compact}
            volume={t('Free trial', '免费试用')}
            price={t(
              `$0 · ${TRIAL_CALLS} calls / ${TRIAL_VALID_DAYS} days`,
              `$0 · ${TRIAL_CALLS} 次 / ${TRIAL_VALID_DAYS} 天`,
            )}
            tone="trial"
          />
        )}

        {PRICING_TIERS.map((tier, i) => (
          <LadderRow
            key={String(tier.upToPerMonth)}
            compact={compact}
            volume={tierVolumeLabel(i, t)}
            price={`${formatUnitDollars(tier.unitCents)} / ${t('call', '次')}`}
            active={i === activeTier}
            step={i + 1}
            discountPct={
              i > 0
                ? Math.round((1 - tier.unitCents / PRICING_TIERS[0].unitCents) * 100)
                : 0
            }
          />
        ))}
      </div>

      {showFooter && (
        <div
          className={cn(
            'border-t border-border/70 bg-muted/15 text-muted-foreground leading-relaxed',
            compact ? 'px-3 py-2 text-[10px]' : 'px-5 py-3 text-[11px]',
          )}
        >
          {t(
            `Minimum top-up ${formatCents(MIN_TOPUP_CENTS)}. Rate is set by calls shipped this month — more volume unlocks the next tier.`,
            `最低充值 ${formatCents(MIN_TOPUP_CENTS)}。单价按当月调用量定档 — 用量越大，档位越低。`,
          )}
        </div>
      )}
    </div>
  );
}

function LadderRow({
  volume,
  price,
  active = false,
  tone,
  step,
  discountPct = 0,
  compact,
}: {
  volume: string;
  price: string;
  active?: boolean;
  tone?: 'trial';
  step?: number;
  discountPct?: number;
  compact: boolean;
}) {
  const { t } = useLang();

  return (
    <div
      className={cn(
        'relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3',
        compact ? 'px-3 py-2' : 'px-5 py-3',
        active && 'bg-emerald-500/[0.08] ring-1 ring-inset ring-emerald-500/25',
        tone === 'trial' && 'bg-sky-500/[0.04]',
      )}
    >
      {/* Stepped accent — width grows with tier so the ladder reads visually. */}
      {step != null && (
        <span
          aria-hidden
          className={cn(
            'absolute left-0 top-1 bottom-1 rounded-r-full bg-gradient-to-b from-emerald-400 to-teal-500 transition-all',
            active ? 'opacity-100' : 'opacity-35',
          )}
          style={{ width: `${6 + step * 4}px` }}
        />
      )}

      <div className={cn('min-w-0 pl-2', compact ? 'space-y-0' : 'space-y-0.5')}>
        <div className={cn('font-medium text-foreground', compact && 'text-[11px]')}>
          {volume}
        </div>
        {active && (
          <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
            {t('← your current rate', '← 你当前的单价')}
          </div>
        )}
      </div>

      <div className="text-right shrink-0">
        <div
          className={cn(
            'font-semibold tabular-nums text-foreground',
            compact ? 'text-[11px]' : 'text-sm',
            active && 'text-emerald-800 dark:text-emerald-300',
          )}
        >
          {price}
        </div>
        {discountPct > 0 && (
          <div className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
            −{discountPct}%
          </div>
        )}
      </div>
    </div>
  );
}
