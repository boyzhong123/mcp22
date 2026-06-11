/**
 * Account-wallet pricing helpers.
 *
 * Under the wallet model the user buys dollars into a shared account wallet.
 * Calls are billed at a tiered per-call rate based on monthly usage (see
 * `topup.ts` for the published tiers and top-up rules).
 *
 * This file used to export the old call-quantity API. We keep a thin
 * deprecated compatibility layer here so external imports keep type-
 * checking until each call site has been migrated; new code should import
 * from `topup.ts` directly.
 */

import {
  BASE_UNIT_CENTS,
  BEST_UNIT_CENTS,
  MIN_TOPUP_CENTS,
  PRICING_TIERS,
  TOPUP_PRESETS_CENTS,
  TRIAL_CALLS,
  TRIAL_VALID_DAYS,
  callsForAmount,
  formatCallsRange,
  formatCallsRangeCompact,
  formatUnitDollars,
  quoteTopup,
} from './topup';

/** Format a call count with US thousands separators. */
export function formatCalls(n: number): string {
  return Math.max(0, Math.floor(n || 0)).toLocaleString('en-US');
}

// ─── Legacy call-quantity API (deprecated) ──────────────────────────────────
// Several pages still import these, so retain a flat compatibility layer.

export interface CallTier {
  /** @deprecated */
  upTo: number;
  /** @deprecated */
  unitCents: number;
}

/**
 * @deprecated Call-quantity tiers are gone.
 */
export const CALL_TIERS: CallTier[] = PRICING_TIERS.map((tier) => ({
  upTo: tier.upToPerMonth ?? Number.POSITIVE_INFINITY,
  unitCents: tier.unitCents,
}));

/** @deprecated Unused under the wallet model. Kept as an empty export. */
export const CALL_PRESETS: number[] = [];

export interface PricingQuote {
  calls: number;
  tierIndex: number;
  unitCents: number;
  totalCents: number;
}

/**
 * @deprecated Old "buy N calls" surface. Computes the cents needed to fund
 * N calls at the flat rate.
 */
export function priceForCalls(calls: number): PricingQuote {
  const safe = Math.max(0, Math.floor(calls || 0));
  // Conservative estimate at the entry-tier rate.
  const baseCents = Math.round(safe * BASE_UNIT_CENTS);
  return {
    calls: safe,
    tierIndex: 0,
    unitCents: BASE_UNIT_CENTS,
    totalCents: baseCents,
  };
}

/** @deprecated Always returns 0 — there's no per-call discount any more. */
export function savingsVsBase(_quote: PricingQuote): {
  savedCents: number;
  pct: number;
} {
  return { savedCents: 0, pct: 0 };
}

/** @deprecated Flat pricing starts at zero. */
export function tierStart(_i: number): number { return 0; }

/** @deprecated Use `PRICING_TIERS` from `topup.ts` instead. */
export function tierRangeLabel(i: number): string {
  const tier = PRICING_TIERS[i];
  if (!tier) return '';
  if (tier.upToPerMonth == null) {
    const prev = i === 0 ? 0 : (PRICING_TIERS[i - 1].upToPerMonth ?? 0) + 1;
    return `${prev.toLocaleString('en-US')}+ calls / mo`;
  }
  const prev = i === 0 ? 0 : (PRICING_TIERS[i - 1].upToPerMonth ?? 0) + 1;
  return `${prev.toLocaleString('en-US')} – ${tier.upToPerMonth.toLocaleString('en-US')} calls / mo`;
}

/** @deprecated Format helper carried over from the old per-call tiers. */
export function formatUnitPrice(unitCents: number): string {
  const dollars = unitCents / 100;
  const fixed = dollars.toFixed(4);
  const trimmed = fixed.replace(/0+$/, '').replace(/\.$/, '');
  const minTwo =
    trimmed.includes('.') && trimmed.split('.')[1].length >= 2
      ? trimmed
      : dollars.toFixed(2);
  return `$${minTwo}`;
}

// Re-export the new helpers so callers can keep a single import path.
export {
  BASE_UNIT_CENTS,
  BEST_UNIT_CENTS,
  MIN_TOPUP_CENTS,
  PRICING_TIERS,
  TOPUP_PRESETS_CENTS,
  TRIAL_CALLS,
  TRIAL_VALID_DAYS,
  callsForAmount,
  formatCallsRange,
  formatCallsRangeCompact,
  formatUnitDollars,
  quoteTopup,
};
