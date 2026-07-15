/**
 * Server-authoritative billing pricing catalog.
 *
 * Source of truth: `GET /billing/pricing` (evaluation-points doc §5) —
 * `topup_packages[]` amount bands with `points_per_usd`, plus CoreType
 * deduction rates. Local constants in `topup.ts` are Demo / offline
 * fallbacks only.
 *
 * Credited points for a live amount must come from the server quote:
 * `GET /billing/pricing?amount_cents=…` → `quote.quoted_points`, or the
 * created order's `quoted_points`. `previewQuotedPoints` is a UI-only
 * estimate for offline/demo sessions.
 */

import { billing } from './api';
import type {
  BillingPricingPackage,
  PricingInfo,
  PricingQuote,
} from './api/types';
import {
  DEFAULT_POINTS_PER_REQUEST,
  PARAGRAPH_POINTS_PER_USE,
  TOPUP_BONUS_TIERS,
  TRIAL_CALLS,
  TRIAL_VALID_DAYS,
  WORD_SENTENCE_POINTS_PER_USE,
  type TopupBonusTier,
} from './topup';

/** One CoreType deduction rate, camel-cased for UI use. */
export interface CoreTypeRateInfo {
  /** Stable grouping key — case-sensitive, matches usage `core_type`. */
  coreType: string;
  displayName: string;
  pointsPerRequest: number;
}

export interface BillingPricingCatalog {
  /** True when values came from GET /billing/pricing (not local fallback). */
  fromServer: boolean;
  packages: TopupBonusTier[];
  /** Paid point batches' validity, in days. */
  validDays: number;
  /** Per-request deduction for CoreTypes without a configured rate. */
  defaultPointsPerRequest: number;
  /** Specifically configured CoreType rates; [] = default rate only. */
  coreTypeRates: CoreTypeRateInfo[];
  /** Signup grant — unit is POINTS (the API's trial_* names are legacy). */
  signupBonusPoints: number;
  signupBonusValidDays: number;
  minTopupCents: number;
  topupPresets: number[];
  versionId?: number;
  version?: number;
  currency?: string;
  /** Raw API payload when available — reserved for future fields. */
  raw?: PricingInfo;
}

/** Demo-only CoreType rates so offline sessions render a realistic table. */
export const FALLBACK_CORE_TYPE_RATES: CoreTypeRateInfo[] = [
  {
    coreType: 'word_sentence.evaluate',
    displayName: 'Word / Phrase / Sentence',
    pointsPerRequest: WORD_SENTENCE_POINTS_PER_USE,
  },
  {
    coreType: 'paragraph.evaluate',
    displayName: 'Paragraph Evaluation',
    pointsPerRequest: PARAGRAPH_POINTS_PER_USE,
  },
];

export const FALLBACK_BILLING_PRICING: BillingPricingCatalog = {
  fromServer: false,
  packages: TOPUP_BONUS_TIERS.map((t) => ({
    ...t,
    presetCents: [...t.presetCents],
    maxCents: t.maxCents ?? null,
  })),
  validDays: TRIAL_VALID_DAYS,
  defaultPointsPerRequest: DEFAULT_POINTS_PER_REQUEST,
  coreTypeRates: FALLBACK_CORE_TYPE_RATES.map((r) => ({ ...r })),
  signupBonusPoints: TRIAL_CALLS,
  signupBonusValidDays: TRIAL_VALID_DAYS,
  minTopupCents: TOPUP_BONUS_TIERS[0]?.minCents ?? 1_990,
  topupPresets: TOPUP_BONUS_TIERS.flatMap((t) => t.presetCents),
};

/**
 * Preset chips are a pure FE affordance (the API no longer ships presets):
 * reuse the local defaults that fall inside the tier's server band, and
 * always lead with the band minimum.
 */
function presetsForBand(id: TopupBonusTier['id'], minCents: number, maxCents: number | null): number[] {
  const local = TOPUP_BONUS_TIERS.find((t) => t.id === id)?.presetCents ?? [];
  const inBand = local.filter((c) => c >= minCents && (maxCents == null || c < maxCents));
  const presets = [minCents, ...inBand.filter((c) => c !== minCents)];
  return presets.slice(0, 3);
}

function mapPackage(p: BillingPricingPackage, baselinePointsPerUsd: number): TopupBonusTier {
  const uplift = baselinePointsPerUsd > 0
    ? Math.round(((p.points_per_usd / baselinePointsPerUsd) - 1) * 100)
    : 0;
  return {
    id: p.id,
    minCents: p.min_amount_cents,
    maxCents: p.max_amount_cents,
    pointsPerUsd: p.points_per_usd,
    bonusPct: Math.max(0, uplift),
    presetCents: presetsForBand(p.id, p.min_amount_cents, p.max_amount_cents),
  };
}

export function catalogFromPricingInfo(info: PricingInfo): BillingPricingCatalog {
  const serverPackages = info.topup_packages ?? [];
  const baseline = serverPackages.length
    ? Math.min(...serverPackages.map((p) => p.points_per_usd))
    : 0;
  const packages = serverPackages.length
    ? [...serverPackages]
        .sort((a, b) => a.min_amount_cents - b.min_amount_cents)
        .map((p) => mapPackage(p, baseline))
    : FALLBACK_BILLING_PRICING.packages;

  // No active CoreType pricing version is a normal state — everything is
  // deducted at default_points_per_request then.
  const coreTypeRates: CoreTypeRateInfo[] = (info.core_type_rates ?? []).map((r) => ({
    coreType: r.core_type,
    displayName: r.display_name || r.core_type,
    pointsPerRequest: r.points_per_request,
  }));

  return {
    fromServer: serverPackages.length > 0,
    packages,
    validDays: info.valid_days ?? FALLBACK_BILLING_PRICING.validDays,
    defaultPointsPerRequest:
      info.default_points_per_request ?? FALLBACK_BILLING_PRICING.defaultPointsPerRequest,
    coreTypeRates,
    signupBonusPoints: info.signup_bonus_points ?? FALLBACK_BILLING_PRICING.signupBonusPoints,
    signupBonusValidDays:
      info.signup_bonus_valid_days ?? FALLBACK_BILLING_PRICING.signupBonusValidDays,
    minTopupCents: packages[0]?.minCents ?? FALLBACK_BILLING_PRICING.minTopupCents,
    topupPresets: packages.flatMap((t) => t.presetCents),
    versionId: info.topup_pricing_version_id,
    version: info.topup_pricing_version,
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

/**
 * Server-authoritative quote for an amount (doc §5.1). Throws ApiError —
 * notably `AMOUNT_BELOW_MINIMUM` when the amount misses every band — so the
 * caller can render a precise message. Callers should debounce 200–300ms.
 */
export async function fetchServerQuote(amountCents: number): Promise<PricingQuote | null> {
  const safe = Math.round(amountCents || 0);
  if (safe <= 0) return null;
  const info = await billing.pricing(safe);
  return info.quote ?? null;
}

export function findPackage(
  catalog: BillingPricingCatalog,
  id: TopupBonusTier['id'],
): TopupBonusTier {
  return catalog.packages.find((p) => p.id === id) ?? catalog.packages[0] ?? TOPUP_BONUS_TIERS[0];
}

/**
 * Resolve tier for an amount using min/max bands.
 * Boundary amounts belong to the higher tier (min inclusive, max exclusive).
 */
export function resolveTierForAmount(
  catalog: BillingPricingCatalog,
  amountCents: number,
): TopupBonusTier {
  const safe = Math.max(0, Math.round(amountCents || 0));
  const sorted = [...catalog.packages].sort((a, b) => a.minCents - b.minCents);
  let matched = sorted[0] ?? TOPUP_BONUS_TIERS[0];
  for (const tier of sorted) {
    const underMax = tier.maxCents == null || safe < tier.maxCents;
    if (safe >= tier.minCents && underMax) matched = tier;
  }
  return matched;
}

/**
 * UI-only estimate from the amount's tier points_per_usd (ceil like the
 * server). Live checkout must prefer the server quote / order quoted_points.
 */
export function previewQuotedPoints(
  catalog: BillingPricingCatalog,
  amountCents: number,
  packageId?: TopupBonusTier['id'],
): { totalPoints: number; estimate: true; tier: TopupBonusTier } {
  const safeCents = Math.max(0, Math.round(amountCents || 0));
  const tier = packageId
    ? findPackage(catalog, packageId)
    : resolveTierForAmount(catalog, safeCents);
  const pointsPerUsd = tier.pointsPerUsd ?? 0;
  const totalPoints = Math.ceil((safeCents * pointsPerUsd) / 100);
  return { totalPoints, estimate: true, tier };
}

/** Format amount range for the tier table. */
export function formatTierAmountRange(tier: TopupBonusTier): string {
  const min = (tier.minCents / 100).toFixed(2);
  if (tier.maxCents == null) return `$${min} – 不限`;
  const maxInclusive = ((tier.maxCents - 1) / 100).toFixed(2);
  return `$${min} – $${maxInclusive}`;
}
