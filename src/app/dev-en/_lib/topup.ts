/**
 * Account-wallet top-up helpers.
 *
 * The current product model is intentionally simple: the user picks a
 * dollar amount and the same amount lands in the shared wallet. Calls are
 * derived from that credit at the standard per-call rate.
 */

import { MCP_CALL_RATE_PER_CALL_CENTS } from './mock-store';

/** Quick-pick chip values, in cents. */
export const TOPUP_PRESETS_CENTS: number[] = [
  2000, 5000, 10000, 30000, 50000, 100000,
];

export interface TopupQuote {
  /** Amount the user pays, in cents. Always >= 0. */
  baseCents: number;
  /** Total credit landing in the wallet. */
  totalCents: number;
  /** Total credit converted to call count at the per-call rate. */
  estimatedCalls: number;
  /** Effective dollar per call, in cents. */
  effectiveUnitCents: number;
}

/**
 * Quote a top-up: total credit and estimated calls.
 * Pure function — safe to call on every keystroke in the modal.
 */
export function quoteTopup(amountCents: number): TopupQuote {
  const base = Math.max(0, Math.round(amountCents || 0));
  const estimatedCalls = Math.floor(
    base / Math.max(0.0001, MCP_CALL_RATE_PER_CALL_CENTS),
  );
  const effectiveUnitCents =
    estimatedCalls > 0 ? base / estimatedCalls : MCP_CALL_RATE_PER_CALL_CENTS;

  return {
    baseCents: base,
    totalCents: base,
    estimatedCalls,
    effectiveUnitCents,
  };
}

/**
 * Calls/dollar at a given amount — useful for the "1 K calls per $X"
 * comparison row on the pricing page. Returns floor(calls).
 */
export function callsForAmount(amountCents: number): number {
  return quoteTopup(amountCents).estimatedCalls;
}
