/**
 * Server-authoritative billing pricing catalog.
 *
 * Source of truth: `GET /billing/pricing` recharge tiers
 * (`min/max_amount_cents` + `points_per_usd`). Local constants in `topup.ts`
 * are Demo / offline fallbacks only.
 *
 * Amount → credited points for a live checkout must come from
 * `POST /billing/topups/order` → `quoted_points`. `previewQuotedPoints` is
 * UI-only estimate using the matching tier's points_per_usd.
 */

import { billing } from './api';
import type {
  EvaluationPointPackage,
  PricingInfo,
  RechargePricingTier,
} from './api/types';
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
  /** Baseline pts/$ used when a tier has no pointsPerUsd (legacy). */
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
  versionId?: number;
  currency?: string;
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
  packages: TOPUP_BONUS_TIERS.map((t) => ({
    ...t,
    presetCents: [...t.presetCents],
    pointsPerUsd: t.pointsPerUsd ?? BASE_POINTS_PER_USD * (1 + t.bonusPct / 100),
    maxCents: t.maxCents ?? null,
  })),
  rules: { ...FALLBACK_RULES },
  trialCalls: TRIAL_CALLS,
  trialDays: TRIAL_VALID_DAYS,
  minTopupCents: TOPUP_BONUS_TIERS[0]?.minCents ?? 1_990,
  topupPresets: TOPUP_BONUS_TIERS.flatMap((t) => t.presetCents),
};

function bonusPctFromPointsPerUsd(pointsPerUsd: number, base = BASE_POINTS_PER_USD): number {
  if (base <= 0) return 0;
  return Math.round(((pointsPerUsd / base) - 1) * 100);
}

function mapRechargeTier(t: RechargePricingTier): TopupBonusTier {
  const pointsPerUsd = t.points_per_usd;
  return {
    id: t.code,
    minCents: t.min_amount_cents,
    maxCents: t.max_amount_cents,
    pointsPerUsd,
    bonusPct: bonusPctFromPointsPerUsd(pointsPerUsd),
    presetCents: [
      ...(t.preset_amount_cents?.length ? t.preset_amount_cents : [t.min_amount_cents]),
    ],
  };
}

function mapLegacyPackage(p: EvaluationPointPackage): TopupBonusTier {
  const pointsPerUsd =
    p.points_per_usd ??
    BASE_POINTS_PER_USD * (1 + (p.bonus_percent ?? 0) / 100);
  return {
    id: p.id,
    minCents: p.min_amount_cents,
    maxCents: p.max_amount_cents ?? null,
    pointsPerUsd,
    bonusPct: p.bonus_percent ?? bonusPctFromPointsPerUsd(pointsPerUsd),
    presetCents: [...(p.preset_amount_cents?.length ? p.preset_amount_cents : [p.min_amount_cents])],
  };
}

/** Pick packages from new `recharge_tiers` or legacy `topup_packages`. */
function packagesFromPricing(info: PricingInfo): TopupBonusTier[] | null {
  if (info.recharge_tiers?.length) {
    return info.recharge_tiers.map(mapRechargeTier);
  }
  if (info.topup_packages?.length) {
    return info.topup_packages.map(mapLegacyPackage);
  }
  // Some backends reuse `tiers` for recharge bands (have code + points_per_usd).
  const maybe = info.tiers as unknown as RechargePricingTier[] | undefined;
  if (
    Array.isArray(maybe) &&
    maybe.length &&
    typeof (maybe[0] as RechargePricingTier).code === 'string' &&
    typeof (maybe[0] as RechargePricingTier).points_per_usd === 'number'
  ) {
    return maybe.map(mapRechargeTier);
  }
  return null;
}

export function catalogFromPricingInfo(info: PricingInfo): BillingPricingCatalog {
  const packages = packagesFromPricing(info) ?? FALLBACK_BILLING_PRICING.packages;

  const validDays =
    info.validity_days ??
    info.evaluation_point_rules?.valid_days ??
    FALLBACK_RULES.validDays;

  const rules: EvaluationPointRules = {
    basePointsPerUsd:
      info.evaluation_point_rules?.base_points_per_usd ??
      packages[0]?.pointsPerUsd ??
      FALLBACK_RULES.basePointsPerUsd,
    wordSentencePointsPerUse:
      info.evaluation_point_rules?.word_sentence_points_per_use ??
      FALLBACK_RULES.wordSentencePointsPerUse,
    paragraphPointsPerUse:
      info.evaluation_point_rules?.paragraph_points_per_use ??
      FALLBACK_RULES.paragraphPointsPerUse,
    validDays,
  };

  const fromServer = packagesFromPricing(info) != null || !!info.evaluation_point_rules;

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
    versionId: info.version_id,
    currency: info.currency ?? 'USD',
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
 * Resolve tier for an amount using min/max bands.
 * Boundary amounts belong to the higher tier (matches order preview).
 */
export function resolveTierForAmount(
  catalog: BillingPricingCatalog,
  amountCents: number,
): TopupBonusTier {
  const safe = Math.max(0, Math.round(amountCents || 0));
  const sorted = [...catalog.packages].sort((a, b) => a.minCents - b.minCents);
  // Prefer highest min that still covers the amount.
  let matched = sorted[0] ?? TOPUP_BONUS_TIERS[0];
  for (const tier of sorted) {
    const underMax = tier.maxCents == null || safe < tier.maxCents;
    if (safe >= tier.minCents && underMax) matched = tier;
  }
  return matched;
}

/**
 * UI-only estimate from the amount's tier points_per_usd.
 * Live checkout must prefer `TopupOrder.quoted_points`.
 */
export function previewQuotedPoints(
  catalog: BillingPricingCatalog,
  amountCents: number,
  packageId?: TopupBonusTier['id'],
): { basePoints: number; bonusPoints: number; totalPoints: number; estimate: true; tier: TopupBonusTier } {
  const safeCents = Math.max(0, Math.round(amountCents || 0));
  const tier = packageId
    ? findPackage(catalog, packageId)
    : resolveTierForAmount(catalog, safeCents);
  const pointsPerUsd = tier.pointsPerUsd ?? catalog.rules.basePointsPerUsd;
  const totalPoints = Math.floor((safeCents / 100) * pointsPerUsd);
  // Keep base/bonus split for UIs that still show "bonus" as uplift vs baseline.
  const basePoints = Math.floor((safeCents / 100) * catalog.rules.basePointsPerUsd);
  const bonusPoints = Math.max(0, totalPoints - basePoints);
  return {
    basePoints,
    bonusPoints,
    totalPoints,
    estimate: true,
    tier,
  };
}

/** Format amount range for「当前充值档位」表. */
export function formatTierAmountRange(tier: TopupBonusTier): string {
  const min = (tier.minCents / 100).toFixed(2);
  if (tier.maxCents == null) return `$${min} – 不限`;
  const maxInclusive = ((tier.maxCents - 1) / 100).toFixed(2);
  return `$${min} – $${maxInclusive}`;
}

/** Reserved shape for order quote fields the UI already consumes. */
export interface ServerTopupQuote {
  amount_cents: number;
  /** Server-decided tier from amount thresholds (response only). */
  package_id: TopupBonusTier['id'];
  quoted_points: number;
  quoted_base_points?: number;
  quoted_bonus_points?: number;
  points_expire_at?: string | null;
}
