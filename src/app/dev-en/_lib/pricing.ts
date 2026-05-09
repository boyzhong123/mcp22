/**
 * Account-wallet pricing helpers.
 *
 * Under the wallet model the user buys *dollars* (with a satte-tier bonus
 * on larger top-ups), and calls are derived from that wallet balance at a
 * single flat per-call rate. The legacy per-call quantity tiers
 * (`CALL_TIERS` / `priceForCalls` / etc.) are gone — the only "tiers" left
 * are the top-up bonus tiers, which live in `_lib/topup-bonus.ts`.
 *
 * This file used to export the old call-quantity API. We keep a thin
 * deprecated compatibility layer here so external imports keep type-
 * checking until each call site has been migrated; new code should import
 * from `topup-bonus.ts` directly.
 */

import {
  TOPUP_TIERS,
  TOPUP_PRESETS_CENTS,
  callsForAmount,
  quoteTopup,
} from './topup-bonus';

/** Format a call count with US thousands separators. */
export function formatCalls(n: number): string {
  return Math.max(0, Math.floor(n || 0)).toLocaleString('en-US');
}

// ─── Legacy call-quantity API (deprecated) ──────────────────────────────────
// Several pages still import these. Each is rewired to the new bonus model
// so the numbers stay coherent during the migration window.

export interface CallTier {
  /** @deprecated */
  upTo: number;
  /** @deprecated */
  unitCents: number;
}

/**
 * @deprecated Call-quantity tiers are gone. We surface the **top-up bonus**
 * tiers under the same name so the legacy "Rates" page still renders a
 * useful three-row table while it's being rewritten.
 */
export const CALL_TIERS: CallTier[] = TOPUP_TIERS.map((t) => ({
  upTo: t.minCents,
  unitCents: 0.1 * (1 - t.bonusPct), // dollars per 1k after bonus, in cents
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
 * @deprecated Old "buy N calls" surface. Forwards to the bonus model by
 * computing the cents needed to fund N calls at the flat rate, then
 * quoting that amount. Not exact (no bonus is applied to inputs that
 * happen to land in a higher tier) but close enough for the rates page
 * during migration.
 */
export function priceForCalls(calls: number): PricingQuote {
  const safe = Math.max(0, Math.floor(calls || 0));
  // 1 call = 0.1¢ at the flat rate.
  const baseCents = Math.round(safe * 0.1);
  const q = quoteTopup(baseCents);
  return {
    calls: safe,
    tierIndex: q.tierIndex,
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

/** @deprecated Tier ranges are dollar amounts now. */
export function tierStart(i: number): number {
  if (i <= 0) return 0;
  return TOPUP_TIERS[i]?.minCents ?? 0;
}

/** @deprecated Returns dollar-tier label, e.g. "$50+ → +10% bonus". */
export function tierRangeLabel(i: number): string {
  const tier = TOPUP_TIERS[i];
  if (!tier) return '';
  const dollars = (tier.minCents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
  return `${dollars}+ → ${tier.label}`;
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
export { TOPUP_TIERS, TOPUP_PRESETS_CENTS, callsForAmount, quoteTopup };
