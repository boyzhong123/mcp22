/**
 * Account-wallet pricing helpers.
 *
 * Under the wallet model the user buys dollars, and calls are derived from
 * that wallet balance at a single flat per-call rate.
 *
 * This file used to export the old call-quantity API. We keep a thin
 * deprecated compatibility layer here so external imports keep type-
 * checking until each call site has been migrated; new code should import
 * from `topup.ts` directly.
 */

import { TOPUP_PRESETS_CENTS, callsForAmount, quoteTopup } from './topup';

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
export const CALL_TIERS: CallTier[] = [{ upTo: Number.POSITIVE_INFINITY, unitCents: 0.1 }];

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
  // 1 call = 0.1¢ at the flat rate.
  const baseCents = Math.round(safe * 0.1);
  return {
    calls: safe,
    tierIndex: 0,
    unitCents: 0.1,
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

/** @deprecated Flat pricing has no tier range. */
export function tierRangeLabel(_i: number): string { return 'Flat rate'; }

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
export { TOPUP_PRESETS_CENTS, callsForAmount, quoteTopup };
