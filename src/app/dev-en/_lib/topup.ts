/**
 * Account-wallet top-up helpers — single frontend source of truth for the
 * published pricing. Keep in sync with the backend (`GET /billing/pricing`).
 *
 * Pricing is tiered by monthly call volume:
 *   0 – 999 calls/mo      → $0.007/call
 *   1,000 – 9,999 /mo     → $0.006/call
 *   10,000+ /mo           → $0.005/call
 *
 * Top-up rules: minimum top-up $10; the paid amount lands 1:1 in the shared
 * account wallet. Every new account also gets 600 free trial calls valid for
 * 30 days, consumed before wallet credit.
 */

export interface PricingTier {
  /** Upper bound of monthly call volume for this tier (null = unbounded). */
  upToPerMonth: number | null;
  /** Price per call, in cents (0.7 = $0.007). */
  unitCents: number;
}

export const PRICING_TIERS: PricingTier[] = [
  { upToPerMonth: 999, unitCents: 0.7 },
  { upToPerMonth: 9_999, unitCents: 0.6 },
  { upToPerMonth: null, unitCents: 0.5 },
];

/** Unit price at the entry tier (< 1,000 calls/mo) — worst case. */
export const BASE_UNIT_CENTS = PRICING_TIERS[0].unitCents;
/** Unit price at the highest-volume tier (10,000+ calls/mo) — best case. */
export const BEST_UNIT_CENTS = PRICING_TIERS[PRICING_TIERS.length - 1].unitCents;

/** Minimum top-up: $10. */
export const MIN_TOPUP_CENTS = 1_000;

/** Free trial granted on signup. */
export const TRIAL_CALLS = 600;
export const TRIAL_VALID_DAYS = 30;

/** Quick-pick chip values, in cents ($10 – $500). */
export const TOPUP_PRESETS_CENTS: number[] = [
  1000, 2000, 5000, 10000, 30000, 50000,
];

/** "$0.007" style formatter for a per-call unit price in cents. */
export function formatUnitDollars(unitCents: number): string {
  return `$${(unitCents / 100).toFixed(3)}`;
}

export interface TopupQuote {
  /** Amount the user pays, in cents. Always >= 0. */
  baseCents: number;
  /** Total credit landing in the wallet (1:1 with baseCents). */
  totalCents: number;
  /**
   * Conservative call estimate at the entry-tier rate ($0.007/call).
   * The actual rate depends on monthly volume, so this is the floor.
   */
  estimatedCalls: number;
  /** Best-case call estimate at the highest-volume rate ($0.005/call). */
  estimatedCallsMax: number;
}

/**
 * Quote a top-up: total credit plus a min–max call estimate. The per-call
 * price is tiered by monthly usage, so a single number would be wrong —
 * surface the honest range instead.
 * Pure function — safe to call on every keystroke in the modal.
 */
export function quoteTopup(amountCents: number): TopupQuote {
  const base = Math.max(0, Math.round(amountCents || 0));
  return {
    baseCents: base,
    totalCents: base,
    estimatedCalls: Math.floor(base / BASE_UNIT_CENTS),
    estimatedCallsMax: Math.floor(base / BEST_UNIT_CENTS),
  };
}

/** Conservative calls/dollar at a given amount. Returns floor(calls). */
export function callsForAmount(amountCents: number): number {
  return quoteTopup(amountCents).estimatedCalls;
}

/** "1,428 – 2,000" style range for a top-up amount. */
export function formatCallsRange(amountCents: number): string {
  const q = quoteTopup(amountCents);
  return `${q.estimatedCalls.toLocaleString('en-US')} – ${q.estimatedCallsMax.toLocaleString('en-US')}`;
}

/** Compact "1.4K – 2K" style range — for tight UI like preset chips. */
export function formatCallsRangeCompact(amountCents: number): string {
  const q = quoteTopup(amountCents);
  return `${compactCalls(q.estimatedCalls)} – ${compactCalls(q.estimatedCallsMax)}`;
}

function compactCalls(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    const rounded = k >= 100 ? Math.round(k) : Math.round(k * 10) / 10;
    return `${rounded}K`;
  }
  return String(n);
}

/** Which pricing tier applies given calls already made this month. */
export function getTierIndexForMonthlyCalls(callsThisMonth: number): number {
  const safe = Math.max(0, Math.floor(callsThisMonth || 0));
  for (let i = 0; i < PRICING_TIERS.length; i++) {
    const tier = PRICING_TIERS[i];
    if (tier.upToPerMonth == null || safe <= tier.upToPerMonth) return i;
  }
  return PRICING_TIERS.length - 1;
}

/** Human-readable monthly volume band for tier index `i`. */
export function tierVolumeLabel(
  i: number,
  t: (en: string, zh: string) => string,
): string {
  const tier = PRICING_TIERS[i];
  if (!tier) return '';
  const prev = i === 0 ? 0 : (PRICING_TIERS[i - 1].upToPerMonth ?? 0) + 1;
  if (tier.upToPerMonth == null) {
    return t(
      `${prev.toLocaleString('en-US')}+ / mo`,
      `${prev.toLocaleString('en-US')}+ 次/月`,
    );
  }
  if (prev === 0) {
    return t(
      `< ${(tier.upToPerMonth + 1).toLocaleString('en-US')} / mo`,
      `< ${(tier.upToPerMonth + 1).toLocaleString('en-US')} 次/月`,
    );
  }
  return t(
    `${prev.toLocaleString('en-US')} – ${tier.upToPerMonth.toLocaleString('en-US')} / mo`,
    `${prev.toLocaleString('en-US')} – ${tier.upToPerMonth.toLocaleString('en-US')} 次/月`,
  );
}

/** Calls purchasable at a specific tier's unit price. */
export function callsAtTierForAmount(amountCents: number, tierIndex: number): number {
  const base = Math.max(0, Math.round(amountCents || 0));
  const unitCents = PRICING_TIERS[tierIndex]?.unitCents ?? BASE_UNIT_CENTS;
  return Math.floor(base / unitCents);
}

export function formatCallsAtTier(amountCents: number, tierIndex: number): string {
  return callsAtTierForAmount(amountCents, tierIndex).toLocaleString('en-US');
}

/** Chip subtitle: calls at the user's current monthly tier. */
export function formatCallsAtCurrentTierCompact(
  amountCents: number,
  callsThisMonth: number,
): string {
  const idx = getTierIndexForMonthlyCalls(callsThisMonth);
  const unit = PRICING_TIERS[idx]?.unitCents ?? BASE_UNIT_CENTS;
  return `≈ ${compactCalls(callsAtTierForAmount(amountCents, idx))} @ ${formatUnitDollars(unit)}`;
}
