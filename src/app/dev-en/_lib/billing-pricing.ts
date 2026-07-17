/**
 * Server-authoritative billing pricing catalog.
 *
 * Sources of truth (evaluation-points doc §5):
 * - `GET /billing/pricing` for top-up packages and server quotes.
 * - `GET /billing/core-type-pricing` for current CoreType deductions.
 *
 * The two endpoints are intentionally independent. Local constants in
 * `topup.ts` are Demo / offline fallbacks only.
 *
 * Credited points for a live amount must come from the server quote:
 * `GET /billing/pricing?amount_cents=…` → `quote.quoted_points`, or the
 * created order's `quoted_points`. `previewQuotedPoints` is a UI-only
 * estimate for offline/demo sessions.
 */

import { billing, catalog as catalogApi } from './api';
import type {
  BillingPricingPackage,
  CoreTypePricingInfo,
  CoreTypeRate,
  EvaluationKernel,
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
  /** Server-provided display category, when available. */
  category?: string | null;
  categoryCode?: string | null;
  categoryName?: string | null;
  /** Server-provided language code (`zh` or `en`), when available. */
  language?: string | null;
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
  kernelCatalog: EvaluationKernel[];
  /** Signup grant — unit is POINTS (the API's trial_* names are legacy). */
  signupBonusPoints: number;
  signupBonusValidDays: number;
  minTopupCents: number;
  topupPresets: number[];
  versionId?: number;
  version?: number;
  coreTypeVersionId?: number | null;
  coreTypeVersion?: number | null;
  currency?: string;
  /** Raw API payload when available — reserved for future fields. */
  raw?: PricingInfo;
  /** Raw payload from the independent CoreType pricing endpoint. */
  rawCoreTypePricing?: CoreTypePricingInfo;
  /** True only after the on-demand detail view read both live endpoints. */
  kernelDetailsFromServer?: boolean;
}

/** Snapshot of the current authenticated Catalog response for Demo/offline
 * sessions. The live app still replaces this with the server response. */
export const FALLBACK_EVALUATION_KERNELS: EvaluationKernel[] = [
  {
    core_type: 'cn.pred.score',
    display_name: 'cn.pred.score',
    category_code: 'paragraph',
    category_name: '中文段落',
    category_parent_code: '',
    language: 'zh-CN',
    billing_unit: 'evaluation_request',
    modality: '',
    granularity: '',
    documentation_url: '',
    status: 'active',
    sort_order: 0,
  },
  {
    core_type: 'en.pred.score',
    display_name: 'en.pred.score',
    category_code: 'paragraph',
    category_name: '英文段落',
    category_parent_code: '',
    language: 'en',
    billing_unit: 'evaluation_request',
    modality: '',
    granularity: '',
    documentation_url: '',
    status: 'active',
    sort_order: 0,
  },
  {
    core_type: 'cn.sent.score',
    display_name: 'cn.sent.score',
    category_code: 'sentence',
    category_name: '中文句子',
    category_parent_code: '',
    language: 'zh-CN',
    billing_unit: 'evaluation_request',
    modality: '',
    granularity: '',
    documentation_url: '',
    status: 'active',
    sort_order: 0,
  },
  {
    core_type: 'en.sent.score',
    display_name: 'en.sent.score',
    category_code: 'sentence',
    category_name: '英文句子',
    category_parent_code: '',
    language: 'en',
    billing_unit: 'evaluation_request',
    modality: '',
    granularity: '',
    documentation_url: '',
    status: 'active',
    sort_order: 0,
  },
  {
    core_type: 'cn.word.raw',
    display_name: 'cn.word.raw',
    category_code: 'word',
    category_name: '中文字词',
    category_parent_code: '',
    language: 'zh-CN',
    billing_unit: 'evaluation_request',
    modality: '',
    granularity: '',
    documentation_url: '',
    status: 'active',
    sort_order: 0,
  },
  {
    core_type: 'cn.word.score',
    display_name: 'cn.word.score',
    category_code: 'word',
    category_name: '中文字词',
    category_parent_code: '',
    language: 'zh-CN',
    billing_unit: 'evaluation_request',
    modality: '',
    granularity: '',
    documentation_url: '',
    status: 'active',
    sort_order: 0,
  },
  {
    core_type: 'en.word.score',
    display_name: 'en.word.score',
    category_code: 'word',
    category_name: '英文单词',
    category_parent_code: '',
    language: 'en',
    billing_unit: 'evaluation_request',
    modality: '',
    granularity: '',
    documentation_url: '',
    status: 'active',
    sort_order: 0,
  },
];

/** Current point deductions returned alongside the Catalog snapshot above. */
export const FALLBACK_CORE_TYPE_RATES: CoreTypeRateInfo[] =
  FALLBACK_EVALUATION_KERNELS.map((kernel) => ({
    coreType: kernel.core_type,
    displayName: kernel.display_name,
    category: kernel.category_name,
    categoryCode: kernel.category_code,
    categoryName: kernel.category_name,
    language: kernel.language,
    pointsPerRequest:
      kernel.category_code === 'paragraph'
        ? PARAGRAPH_POINTS_PER_USE
        : WORD_SENTENCE_POINTS_PER_USE,
  }));

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
  kernelCatalog: FALLBACK_EVALUATION_KERNELS.map((kernel) => ({ ...kernel })),
  signupBonusPoints: TRIAL_CALLS,
  signupBonusValidDays: TRIAL_VALID_DAYS,
  minTopupCents: TOPUP_BONUS_TIERS[0]?.minCents ?? 1_990,
  topupPresets: TOPUP_BONUS_TIERS.flatMap((t) => t.presetCents),
  kernelDetailsFromServer: false,
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

function mapCoreTypeRates(rates: CoreTypeRate[]): CoreTypeRateInfo[] {
  return rates
    .map((rate) => ({
      coreType: rate.core_type,
      displayName: rate.display_name || rate.core_type,
      category: rate.category ?? null,
      categoryCode: null,
      categoryName: rate.category ?? null,
      language: rate.language ?? null,
      pointsPerRequest: rate.points_per_request,
    }))
    .sort(
      (a, b) =>
        b.pointsPerRequest - a.pointsPerRequest || a.coreType.localeCompare(b.coreType),
    );
}

/** Merge pricing with independent product metadata. Catalog entries without a
 * configured price use the server default rate; priced-but-uncatalogued
 * CoreTypes remain visible as unassigned instead of being guessed. */
export function catalogWithEvaluationKernels(
  catalog: BillingPricingCatalog,
  kernels: EvaluationKernel[],
): BillingPricingCatalog {
  const rates = new Map(catalog.coreTypeRates.map((rate) => [rate.coreType, rate]));
  const merged: CoreTypeRateInfo[] = kernels.map((kernel) => {
    const configured = rates.get(kernel.core_type);
    rates.delete(kernel.core_type);
    return {
      coreType: kernel.core_type,
      displayName: kernel.display_name || configured?.displayName || kernel.core_type,
      category: kernel.category_name || kernel.category_code || null,
      categoryCode: kernel.category_code || null,
      categoryName: kernel.category_name || null,
      language: kernel.language || null,
      pointsPerRequest: configured?.pointsPerRequest ?? catalog.defaultPointsPerRequest,
    } satisfies CoreTypeRateInfo;
  });
  merged.push(...rates.values());
  merged.sort(
    (a, b) => b.pointsPerRequest - a.pointsPerRequest || a.coreType.localeCompare(b.coreType),
  );
  return { ...catalog, kernelCatalog: kernels, coreTypeRates: merged };
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
  // Kept as a compatibility source for backends that expose the rates only
  // on the combined endpoint. A successful independent request overrides it.
  const coreTypeRates = mapCoreTypeRates(info.core_type_rates ?? []);

  return {
    fromServer: serverPackages.length > 0,
    packages,
    validDays: info.valid_days ?? FALLBACK_BILLING_PRICING.validDays,
    defaultPointsPerRequest:
      info.default_points_per_request ?? FALLBACK_BILLING_PRICING.defaultPointsPerRequest,
    coreTypeRates,
    kernelCatalog: [],
    signupBonusPoints: info.signup_bonus_points ?? FALLBACK_BILLING_PRICING.signupBonusPoints,
    signupBonusValidDays:
      info.signup_bonus_valid_days ?? FALLBACK_BILLING_PRICING.signupBonusValidDays,
    minTopupCents: packages[0]?.minCents ?? FALLBACK_BILLING_PRICING.minTopupCents,
    topupPresets: packages.flatMap((t) => t.presetCents),
    versionId: info.topup_pricing_version_id,
    version: info.topup_pricing_version,
    coreTypeVersionId: info.core_type_pricing_version_id,
    coreTypeVersion: info.core_type_pricing_version,
    currency: info.currency ?? 'USD',
    raw: info,
  };
}

/** Override only CoreType pricing; recharge catalog data stays untouched. */
export function catalogWithCoreTypePricing(
  catalog: BillingPricingCatalog,
  info: CoreTypePricingInfo,
): BillingPricingCatalog {
  return {
    ...catalog,
    defaultPointsPerRequest:
      info.default_points_per_request ?? FALLBACK_BILLING_PRICING.defaultPointsPerRequest,
    // [] is meaningful: no active version means every CoreType uses default.
    coreTypeRates: mapCoreTypeRates(info.core_type_rates ?? []),
    coreTypeVersionId: info.core_type_pricing_version_id,
    coreTypeVersion: info.core_type_pricing_version,
    rawCoreTypePricing: info,
  };
}

/** Load the recharge catalog used by the page shell. Kernel details are kept
 * out of this request path and loaded only when the user opens the detail UI. */
export async function loadBillingPricing(): Promise<BillingPricingCatalog> {
  try {
    return catalogFromPricingInfo(await billing.pricing());
  } catch {
    return FALLBACK_BILLING_PRICING;
  }
}

/** Read the technical CoreType rate table and product metadata on demand.
 * The two endpoints remain independent: partial success still produces a
 * useful table, while `kernelDetailsFromServer` is true only when both are
 * current live responses. */
export async function loadBillingKernelDetails(
  baseCatalog: BillingPricingCatalog = FALLBACK_BILLING_PRICING,
): Promise<BillingPricingCatalog> {
  const [coreTypeResult, kernelResult] = await Promise.allSettled([
    billing.coreTypePricing(),
    catalogApi.evaluationKernels(),
  ]);

  let catalog = baseCatalog;
  if (coreTypeResult.status === 'fulfilled') {
    catalog = catalogWithCoreTypePricing(catalog, coreTypeResult.value);
  }
  if (kernelResult.status === 'fulfilled') {
    catalog = catalogWithEvaluationKernels(catalog, kernelResult.value.items ?? []);
  }

  return {
    ...catalog,
    kernelDetailsFromServer:
      coreTypeResult.status === 'fulfilled' && kernelResult.status === 'fulfilled',
  };
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
