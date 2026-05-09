/**
 * Account-wallet top-up bonus tiers.
 *
 * The user picks a dollar amount; the active tier (highest `minCents`
 * threshold the amount clears) grants a percentage bonus on top. Both
 * base and bonus credits land in the wallet at the same moment.
 *
 * Schedule (preset_a, agreed in product spec):
 *   $20  → no bonus
 *   $50  → +10%   ($5 bonus)
 *   $100 → +15%   ($15 bonus)
 *   $300 → +20%   ($60 bonus)
 *   $500 → +25%   ($125 bonus)
 *   $1000+ → +30% ($300 bonus on $1000; scales with amount)
 *
 * Calls are derived from the resulting wallet credit at the standard
 * per-call rate ($0.001/call → 0.1¢/call).
 */

import { MCP_CALL_RATE_PER_CALL_CENTS } from './mock-store';

export interface TopupTier {
  /** Inclusive lower bound, in cents. */
  minCents: number;
  /** Bonus rate (e.g. 0.10 = +10%). */
  bonusPct: number;
  /** Short label for badges, e.g. "+10% bonus". */
  label: string;
}

/**
 * Bonus tiers ordered by ascending threshold. Helpers below pick the
 * **highest** tier whose `minCents` the amount clears.
 */
export const TOPUP_TIERS: TopupTier[] = [
  { minCents: 0, bonusPct: 0, label: 'Starter' },
  { minCents: 5000, bonusPct: 0.1, label: '+10% bonus' },
  { minCents: 10000, bonusPct: 0.15, label: '+15% bonus' },
  { minCents: 30000, bonusPct: 0.2, label: '+20% bonus' },
  { minCents: 50000, bonusPct: 0.25, label: '+25% bonus' },
  { minCents: 100000, bonusPct: 0.3, label: '+30% bonus' },
];

/** Quick-pick chip values (cents). Mirrors the tier breakpoints exactly. */
export const TOPUP_PRESETS_CENTS: number[] = [
  2000, 5000, 10000, 30000, 50000, 100000,
];

export interface TopupQuote {
  /** Amount the user pays, in cents. Always >= 0. */
  baseCents: number;
  /** Bonus granted, in cents (rounded down). */
  bonusCents: number;
  /** Total credit landing in the wallet (base + bonus). */
  totalCents: number;
  /** Active tier index inside `TOPUP_TIERS`. */
  tierIndex: number;
  /** Active tier's bonus rate (0.0 – 0.3). */
  bonusPct: number;
  /** Total credit converted to call count at the per-call rate. */
  estimatedCalls: number;
  /** Effective dollar per call after bonus, in cents. */
  effectiveUnitCents: number;
  /**
   * If a higher tier exists, the cents needed to reach it and the
   * additional bonus bps gained. Useful for "Add $X more to unlock +Y%"
   * upsell hints. Null when already at the top tier.
   */
  nextTier?: {
    minCents: number;
    bonusPct: number;
    deltaCents: number;
    deltaBonusPct: number;
  } | null;
}

/** Find the highest tier whose threshold the amount clears. */
export function findActiveTierIndex(amountCents: number): number {
  let idx = 0;
  for (let i = 0; i < TOPUP_TIERS.length; i++) {
    if (amountCents >= TOPUP_TIERS[i].minCents) idx = i;
    else break;
  }
  return idx;
}

/**
 * Quote a top-up: how much bonus, total credit, and estimated calls.
 * Pure function — safe to call on every keystroke in the modal.
 */
export function quoteTopup(amountCents: number): TopupQuote {
  const base = Math.max(0, Math.round(amountCents || 0));
  const tierIndex = findActiveTierIndex(base);
  const tier = TOPUP_TIERS[tierIndex];
  const bonus = Math.floor(base * tier.bonusPct);
  const total = base + bonus;
  const estimatedCalls = Math.floor(
    total / Math.max(0.0001, MCP_CALL_RATE_PER_CALL_CENTS),
  );
  const effectiveUnitCents =
    estimatedCalls > 0 ? base / estimatedCalls : MCP_CALL_RATE_PER_CALL_CENTS;

  const next = TOPUP_TIERS[tierIndex + 1];
  return {
    baseCents: base,
    bonusCents: bonus,
    totalCents: total,
    tierIndex,
    bonusPct: tier.bonusPct,
    estimatedCalls,
    effectiveUnitCents,
    nextTier: next
      ? {
          minCents: next.minCents,
          bonusPct: next.bonusPct,
          deltaCents: Math.max(0, next.minCents - base),
          deltaBonusPct: next.bonusPct - tier.bonusPct,
        }
      : null,
  };
}

/** Render a tier's headline label (e.g. "+10% bonus" or "No bonus"). */
export function tierBonusLabel(tierIndex: number): string {
  const t = TOPUP_TIERS[tierIndex] ?? TOPUP_TIERS[0];
  if (t.bonusPct <= 0) return 'No bonus';
  return `+${Math.round(t.bonusPct * 100)}% bonus`;
}

/**
 * Calls/dollar at a given amount — useful for the "1 K calls per $X"
 * comparison row on the pricing page. Returns floor(calls).
 */
export function callsForAmount(amountCents: number): number {
  return quoteTopup(amountCents).estimatedCalls;
}
