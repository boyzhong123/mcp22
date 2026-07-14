/**
 * Server-authoritative billing pricing catalog.
 *
 * Source of truth: `GET /billing/pricing` (`evaluation_point_rules` +
 * `topup_packages`). Local constants in `topup.ts` are Demo / offline
 * fallbacks only — never treat them as contractual once the API returns.
 *
 * Amount → credited points for a live checkout must come from
 * `POST /billing/topups/order` → `quoted_points` (and capture response
 * fields after payment). `previewQuotedPoints` is UI-only estimate.
 */

import { billing } from './api';
import type { EvaluationPointPackage, PricingInfo } from './api/types';
import {
  BASE_POINTS_PER_USD,
  PARAGRAPH_POINTS_PER_USE,
  TOPUP_BONUS_TIERS,
  TRIAL_CALLS,
  TRIAL_VALID_DAYS,
  WORD_SENTENCE_POINTS_PER_USE,
  type TopupBonusTier,
} from './topup';

export interface EvaluationPointRules {
  basePointsPerUsd: number;
  wordSentencePointsPerUse: number;
  paragraphPointsPerUse: number;
  validDays: number;
}

export interface BillingPricingCatalog {
  /** True when values came from GET /billing/pricing (not local fallback). */
  fromServer: boolean;
  packages: TopupBonusTier[];
  rules: EvaluationPointRules;
  trialCalls: number;
  trialDays: number;
  minTopupCents: number;
  topupPresets: number[];
  /** Raw API payload when available — reserved for future fields. */
  raw?: PricingInfo;
}

const FALLBACK_RULES: EvaluationPointRules = {
  basePointsPerUsd: BASE_POINTS_PER_USD,
  wordSentencePointsPerUse: WORD_SENTENCE_POINTS_PER_USE,
  paragraphPointsPerUse: PARAGRAPH_POINTS_PER_USE,
  validDays: TRIAL_VALID_DAYS,
};

export const FALLBACK_BILLING_PRICING: BillingPricingCatalog = {
  fromServer: false,
  packages: TOPUP_BONUS_TIERS.map((t) => ({ ...t, presetCents: [...t.presetCents] })),
  rules: { ...FALLBACK_RULES },
  trialCalls: TRIAL_CALLS,
  trialDays: TRIAL_VALID_DAYS,
  minTopupCents: TOPUP_BONUS_TIERS[0]?.minCents ?? 1_990,
  topupPresets: TOPUP_BONUS_TIERS.flatMap((t) => t.presetCents),
};

function mapPackage(p: EvaluationPointPackage): TopupBonusTier {
  return {
    id: p.id,
    minCents: p.min_amount_cents,
    bonusPct: p.bonus_percent,
    presetCents: [...(p.preset_amount_cents?.length ? p.preset_amount_cents : [p.min_amount_cents])],
  };
}

export function catalogFromPricingInfo(info: PricingInfo): BillingPricingCatalog {
  const packages =
    info.topup_packages?.length
      ? info.topup_packages.map(mapPackage)
      : FALLBACK_BILLING_PRICING.packages;

  const rules: EvaluationPointRules = info.evaluation_point_rules
    ? {
        basePointsPerUsd: info.evaluation_point_rules.base_points_per_usd,
        wordSentencePointsPerUse: info.evaluation_point_rules.word_sentence_points_per_use,
        paragraphPointsPerUse: info.evaluation_point_rules.paragraph_points_per_use,
        validDays: info.evaluation_point_rules.valid_days,
      }
    : { ...FALLBACK_RULES };

  const fromServer = !!(info.topup_packages?.length || info.evaluation_point_rules);

  return {
    fromServer,
    packages,
    rules,
    trialCalls: info.trial_calls ?? TRIAL_CALLS,
    trialDays: info.trial_days ?? TRIAL_VALID_DAYS,
    minTopupCents: info.min_topup_cents ?? packages[0]?.minCents ?? FALLBACK_BILLING_PRICING.minTopupCents,
    topupPresets: info.topup_presets?.length
      ? [...info.topup_presets]
      : packages.flatMap((t) => t.presetCents),
    raw: info,
  };
}

/** Fetch pricing; on failure / empty, return local fallback (Demo-safe). */
export async function loadBillingPricing(): Promise<BillingPricingCatalog> {
  try {
    const info = await billing.pricing();
    return catalogFromPricingInfo(info);
  } catch {
    return FALLBACK_BILLING_PRICING;
  }
}

export function findPackage(
  catalog: BillingPricingCatalog,
  id: TopupBonusTier['id'],
): TopupBonusTier {
  return catalog.packages.find((p) => p.id === id) ?? catalog.packages[0] ?? TOPUP_BONUS_TIERS[0];
}

/**
 * UI-only estimate from catalog rules. Live checkout must prefer
 * `TopupOrder.quoted_points` from the create-order response.
 */
export function previewQuotedPoints(
  catalog: BillingPricingCatalog,
  amountCents: number,
  packageId: TopupBonusTier['id'],
): { basePoints: number; bonusPoints: number; totalPoints: number; estimate: true } {
  const tier = findPackage(catalog, packageId);
  const safeCents = Math.max(0, Math.round(amountCents || 0));
  const basePoints = Math.floor((safeCents / 100) * catalog.rules.basePointsPerUsd);
  const bonusPoints = Math.round(basePoints * (tier.bonusPct / 100));
  return {
    basePoints,
    bonusPoints,
    totalPoints: basePoints + bonusPoints,
    estimate: true,
  };
}

/** Reserved shape for order quote fields the UI already consumes. */
export interface ServerTopupQuote {
  amount_cents: number;
  package_id: TopupBonusTier['id'];
  quoted_points: number;
  /** Optional future fields — keep reserved on the FE type. */
  quoted_base_points?: number;
  quoted_bonus_points?: number;
  points_expire_at?: string | null;
}
