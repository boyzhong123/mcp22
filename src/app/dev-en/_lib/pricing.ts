/**
 * Tiered call-based pricing for top-ups.
 *
 * Users buy "calls" (API invocations); the dollar amount is derived from
 * the tier their requested quantity falls into. This is FLAT pricing — the
 * whole order is billed at the single tier the call count lands in (NOT
 * marginal/cumulative across tiers).
 *
 * Backend `POST /billing/topups/intent` still receives `amount_cents`; we
 * simply convert calls → dollars on the client and let the backend grow
 * the key's `total_limit` accordingly.
 */

export interface CallTier {
  /** Inclusive upper bound for this tier (use Infinity for the top tier). */
  upTo: number;
  /** Per-call price in cents (may be fractional, e.g. 1.5 = $0.015). */
  unitCents: number;
}

export const CALL_TIERS: CallTier[] = [
  { upTo: 999, unitCents: 2 },
  { upTo: 9999, unitCents: 1.5 },
  { upTo: Infinity, unitCents: 1 },
];

export interface PricingQuote {
  calls: number;
  tierIndex: number;
  unitCents: number;
  /** Total in whole cents (rounded). */
  totalCents: number;
}

/** Resolve a call count to its tier and total price (flat pricing). */
export function priceForCalls(calls: number): PricingQuote {
  const safeCalls = Math.max(0, Math.floor(calls || 0));
  const idx = CALL_TIERS.findIndex((t) => safeCalls <= t.upTo);
  const tierIndex = idx === -1 ? CALL_TIERS.length - 1 : idx;
  const tier = CALL_TIERS[tierIndex];
  const totalCents = Math.round(safeCalls * tier.unitCents);
  return {
    calls: safeCalls,
    tierIndex,
    unitCents: tier.unitCents,
    totalCents,
  };
}

/** Lower bound (inclusive) of a tier — the previous tier's upTo + 1, or 1 for tier 0. */
export function tierStart(i: number): number {
  if (i <= 0) return 1;
  return CALL_TIERS[i - 1].upTo + 1;
}

/** Human-readable tier range, e.g. "1 – 999", "1,000 – 9,999", "10,000+". */
export function tierRangeLabel(i: number): string {
  const start = tierStart(i).toLocaleString('en-US');
  const tier = CALL_TIERS[i];
  if (tier.upTo === Infinity) return `${start}+`;
  return `${start} – ${tier.upTo.toLocaleString('en-US')}`;
}

/** Format a (possibly fractional) per-call price as e.g. "$0.02" or "$0.015". */
export function formatUnitPrice(unitCents: number): string {
  const dollars = unitCents / 100;
  // Strip trailing zeros but keep at least 2 decimals
  const fixed = dollars.toFixed(4);
  const trimmed = fixed.replace(/0+$/, '').replace(/\.$/, '');
  const minTwo = trimmed.includes('.') && trimmed.split('.')[1].length >= 2 ? trimmed : dollars.toFixed(2);
  return `$${minTwo}`;
}

/**
 * Savings vs. base (tier 0) pricing — used to surface "Volume discount applied"
 * messaging when the user lands on a cheaper tier.
 */
export function savingsVsBase(quote: PricingQuote): { savedCents: number; pct: number } {
  const baseUnit = CALL_TIERS[0].unitCents;
  const baseTotal = Math.round(quote.calls * baseUnit);
  const savedCents = Math.max(0, baseTotal - quote.totalCents);
  const pct = baseTotal > 0 ? Math.round((savedCents / baseTotal) * 100) : 0;
  return { savedCents, pct };
}

/** Recommended preset call counts shown as quick-pick chips. */
export const CALL_PRESETS: number[] = [100, 500, 1000, 5000, 10000, 50000];

/** Format a call count with thousands separators. */
export function formatCalls(n: number): string {
  return Math.max(0, Math.floor(n || 0)).toLocaleString('en-US');
}
