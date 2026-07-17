'use client';

// Hydration bridge: pulls data from the real backend API (via _lib/api) and
// pushes it into the legacy mock-store cache so the original UI components
// (which still read via listKeys/getWallet/getSpendLimit/etc.) display real
// data. Mutations made through the legacy mock-store mutators are forwarded to
// the real backend here; the api/* modules then `invalidate(...)` which makes
// DataHydrator re-pull authoritative data.

import {
  __markSeeded,
  __replaceCache,
  __setMutationProxy,
  maskSecret,
  TRIAL_DEFAULT_TOTAL,
  TRIAL_DEFAULT_VALID_DAYS,
  type AccountLowBalanceAlert,
  type AccountWallet,
  type ApiKey as MockApiKey,
  type Environment,
  type EvaluationPointBatch as MockEvaluationPointBatch,
  type MonthlyUsageTotals,
  type NotificationSettings as MockNotifications,
  type SpendLimit as MockSpendLimit,
  type Transaction as MockTransaction,
  type TransactionKind,
  type TrialAllowance,
  type UsagePoint as MockUsagePoint,
} from './mock-store';
import {
  billing,
  catalog as catalogApi,
  describeError,
  getToken,
  keys as keysApi,
  notifications as notifApi,
  usage as usageApi,
} from './api';
import type {
  AccountLimits as RealAccountLimits,
  ApiKey as RealApiKey,
  BillingSummary,
  EvaluationKernel,
  EvaluationPointBatch as RealEvaluationPointBatch,
  NotificationSettings as RealNotifications,
  Transaction as RealTransaction,
  UsagePoint as RealUsagePoint,
} from './api';

// ────────────────────────────────────────────────────────────────────────────
// ID encoding: mock-store uses string ids ("key_xxx"); the backend uses numeric
// ids. We encode `<prefix><id>` so the string-id UI pathways keep working.

export function mockKeyId(id: number): string {
  return `key_${id}`;
}
export function realKeyId(mockId: string): number {
  const m = mockId.match(/^key_(\d+)$/);
  return m ? Number(m[1]) : Number(mockId);
}
export function mockTxId(id: number): string {
  return `tx_${id}`;
}

// A backend cap of 0 means "unlimited"; the mock-store represents that as null.
function capOrNull(v: number | undefined | null): number | null {
  return typeof v === 'number' && v > 0 ? v : null;
}

// ────────────────────────────────────────────────────────────────────────────
// Mappers

export function mapApiKeyToMock(k: RealApiKey): MockApiKey {
  const env: Environment = k.env === 'dev' || k.env === 'development'
    ? 'development'
    : 'production';

  // Heuristic fallback for payloads that don't expose `is_starter`: the
  // auto-provisioned default key is still named "Starter".
  const isStarter = k.is_starter ?? k.name.trim().toLowerCase() === 'starter';

  const status: 'active' | 'paused' | 'revoked' = (() => {
    if (k.status === 'paused' || k.status === 'revoked' || k.status === 'active') return k.status;
    return k.enabled === false ? 'paused' : 'active';
  })();

  const limits = k.limits ?? null;

  // List responses contain only a masked key. Create/rotate responses contain
  // the one-time full secret and use the same mapper.
  const secret = k.api_key ?? '';

  return {
    id: mockKeyId(k.id),
    name: k.name,
    env,
    secret,
    maskedSecret: secret.includes('...') || secret.includes('****') ? secret : maskSecret(secret),
    createdAt: k.created_at,
    lastUsedAt: k.last_used_at ?? null,
    status,
    isStarter,
    monthlyPointCap: capOrNull(limits?.monthly_evaluation_point_cap),
    monthlyCallCap: capOrNull(limits?.monthly_call_cap),
    dailyPointCap: capOrNull(limits?.daily_evaluation_point_cap),
    dailyCallCap: capOrNull(limits?.daily_call_cap),
    // ── Legacy fields (account-wallet model) ──────────────────────────────
    freeDailyLimit: 0,
    freeDailyUsed: 0,
    freeDailyResetAt: new Date().toISOString().slice(0, 10),
    freeTotalLimit: 0,
    freeTotalUsed: k.total_used ?? 0,
    paidCreditsCents: 0,
    paidCreditsUsedCents: 0,
    lowBalanceAlert: null,
  };
}

function mapTrialFromSummary(summary: BillingSummary): TrialAllowance {
  const totalLimit = Math.max(
    0,
    summary.signup_bonus_total_points ?? summary.trial_calls_total ?? TRIAL_DEFAULT_TOTAL,
  );
  const active = summary.signup_bonus_active ?? summary.trial_active ?? false;
  const remaining = active
    ? Math.max(
        0,
        Math.min(
          totalLimit,
          summary.signup_bonus_remaining_points ?? summary.trial_calls_remaining ?? 0,
        ),
      )
    : 0;
  const expiresAt = summary.signup_bonus_expires_at ?? summary.trial_expires_at ?? '';
  const expiresAtMs = Date.parse(expiresAt);
  const grantedAt = summary.signup_bonus_granted_at ?? (
    Number.isFinite(expiresAtMs)
      ? new Date(expiresAtMs - TRIAL_DEFAULT_VALID_DAYS * 86400000).toISOString()
      : new Date().toISOString()
  );

  return {
    totalLimit,
    totalUsed: totalLimit - remaining,
    grantedAt,
    expiresAt: expiresAt || grantedAt,
  };
}

// The summary is points-only now: `evaluation_points_balance` is the
// authoritative main balance; money mirrors stay zeroed (nothing reads them
// for real accounts).
function mapWalletFromSummary(summary: BillingSummary): AccountWallet {
  return {
    paidEvaluationPoints: Math.max(0, summary.evaluation_points_credited_total ?? 0),
    usedEvaluationPoints: Math.max(0, summary.evaluation_points_used_total ?? 0),
    balanceEvaluationPoints: Math.max(
      0,
      summary.evaluation_points_balance ?? summary.available_points ?? 0,
    ),
    paidPointsRemaining: Math.max(0, summary.paid_points_remaining ?? 0),
    signupBonusRemaining: Math.max(
      0,
      summary.signup_bonus_remaining_points ?? summary.signup_bonus_remaining ?? 0,
    ),
    expiredEvaluationPoints: Math.max(0, summary.evaluation_points_expired_total ?? 0),
    paidCreditsCents: 0,
    paidCreditsUsedCents: 0,
  };
}

/**
 * doc §8.1 `current_month` — the authoritative UTC-month rollup. Same axes the
 * backend enforces caps on: `usage_count` is SUM(count), `deducted_points`
 * excludes uncovered points.
 */
function mapCurrentMonthFromSummary(summary: BillingSummary): MonthlyUsageTotals {
  const m = summary.current_month;
  return {
    calls: Math.max(0, m?.usage_count ?? 0),
    events: Math.max(0, m?.usage_events ?? 0),
    deductedPoints: Math.max(0, m?.deducted_points ?? 0),
    uncoveredPoints: Math.max(0, m?.uncovered_points ?? 0),
  };
}

function mapTransaction(t: RealTransaction): MockTransaction {
  const status: MockTransaction['status'] =
    t.status === 'succeeded' || t.status === 'pending' || t.status === 'failed'
      ? t.status
      : 'succeeded';
  // PayPal-only billing today; default the method accordingly.
  const method: MockTransaction['method'] = t.method === 'paypal' ? 'paypal' : 'paypal';
  const kind: TransactionKind = 'credit-topup';
  return {
    id: mockTxId(t.transaction_id ?? t.id),
    createdAt: t.created_at,
    amountCents: t.amount_cents,
    status,
    method,
    last4: '----',
    description: `PayPal · Evaluation points · $${(t.amount_cents / 100).toFixed(2)}`,
    paypalOrderId: t.paypal_order_id,
    paypalCaptureId: t.paypal_capture_id ?? undefined,
    packageId: t.package_id ?? t.tier_code,
    pointsPerUsd: t.points_per_usd,
    validityDays: t.validity_days,
    pointsToGrant: t.points_to_grant,
    basePoints: t.base_points,
    creditedPoints: t.credited_points ?? 0,
    balanceBeforePoints: t.point_balance_before ?? undefined,
    balanceAfterPoints: t.point_balance_after ?? undefined,
    pointsExpireAt: t.points_expires_at ?? t.points_expire_at ?? undefined,
    effectiveAt: t.effective_at ?? undefined,
    usedPoints: t.used_points,
    remainingPoints: t.remaining_points,
    expiredPoints: t.expired_points,
    kind,
  };
}

function mapEvaluationPointBatch(batch: RealEvaluationPointBatch): MockEvaluationPointBatch {
  const status: MockEvaluationPointBatch['status'] =
    batch.status === 'active' || batch.status === 'exhausted' || batch.status === 'expired'
      ? batch.status
      : 'active';
  return {
    id: String(batch.id),
    // Signup-bonus batches carry no order / package (both null).
    transactionId: batch.transaction_id != null ? mockTxId(batch.transaction_id) : null,
    packageId: batch.package_id,
    creditedPoints: batch.credited_points,
    usedPoints: batch.used_points,
    remainingPoints: batch.remaining_points,
    createdAt: batch.created_at,
    expiresAt: batch.expires_at,
    status,
  };
}

function mapLimits(s: RealAccountLimits): MockSpendLimit {
  return {
    monthlyPointCap: capOrNull(s.monthly_evaluation_point_cap),
    monthlyCallCap: capOrNull(s.monthly_call_cap),
    dailyPointCap: capOrNull(s.daily_evaluation_point_cap),
    dailyCallCap: capOrNull(s.daily_call_cap),
    resetDay: 1,
    warnAtPercents: s.warn_at_percents ?? [50, 75, 90],
  };
}

function mapNotifications(n: Partial<RealNotifications>): MockNotifications {
  return {
    weeklyUsageReport: !!n.weekly_usage_report,
    paymentReceipts: n.payment_receipts ?? true,
    productUpdates: !!n.product_updates,
    securityAlerts: n.security_alerts ?? true,
  };
}

function mapAccountAlert(n: Partial<RealNotifications>): AccountLowBalanceAlert {
  return {
    enabled: n.low_balance_alerts_master ?? true,
    // Threshold unit is evaluation POINTS (doc §13); 0 is a valid value.
    thresholdPoints: n.low_evaluation_points_threshold ?? 0,
  };
}

// New usage contract: one record per UTC day × key, with a dynamic,
// case-sensitive CoreType split. No money fields.
function mapUsagePoint(
  p: RealUsagePoint,
  kernelsByCoreType: Map<string, EvaluationKernel>,
): MockUsagePoint {
  return {
    date: (p.date || '').slice(0, 10),
    keyId: p.key_id != null ? mockKeyId(p.key_id) : 'key_*',
    model: 'mcp-call',
    calls: p.calls ?? 0,
    events: p.events ?? 0,
    evaluationPoints: p.evaluation_points ?? 0,
    requiredPoints: p.required_points ?? 0,
    uncoveredPoints: p.uncovered_points ?? 0,
    coreTypes: (p.core_types ?? []).map((ct) => {
      const kernel = kernelsByCoreType.get(ct.core_type);
      return {
        coreType: ct.core_type,
        displayName: kernel?.display_name || ct.display_name || ct.core_type,
        category: kernel?.category_name || kernel?.category_code || ct.category,
        categoryCode: kernel?.category_code || null,
        categoryName: kernel?.category_name || null,
        language: kernel?.language || ct.language,
        calls: ct.calls ?? 0,
        events: ct.events ?? 0,
        evaluationPoints: ct.evaluation_points ?? 0,
        requiredPoints: ct.required_points ?? 0,
        uncoveredPoints: ct.uncovered_points ?? 0,
      };
    }),
    costMills: 0,
    savingsMills: 0,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Mutation proxy: legacy mutators in mock-store fire these in addition to
// updating the local cache. We push to the real backend; the underlying
// invalidate() from the api/* modules triggers a re-pull.

function safe(p: Promise<unknown>) {
  p.catch((err) => console.warn('[mock-store-bridge] mutation failed:', describeError(err)));
}

export function installMutationProxy(): void {
  __setMutationProxy({
    createKey: (name) => safe(keysApi.create({ name })),
    renameKey: (mockId, name) => {
      const id = realKeyId(mockId);
      if (!Number.isFinite(id)) return;
      safe(keysApi.rename(id, name));
    },
    rotateKeySecret: (mockId) => {
      const id = realKeyId(mockId);
      if (!Number.isFinite(id)) return;
      safe(keysApi.rotate(id));
    },
    setKeyPaused: (mockId, paused) => {
      const id = realKeyId(mockId);
      if (!Number.isFinite(id)) return;
      safe(paused ? keysApi.pause(id) : keysApi.resume(id));
    },
    revokeKey: (mockId) => {
      const id = realKeyId(mockId);
      if (!Number.isFinite(id)) return;
      safe(keysApi.revoke(id));
    },
    deleteKey: (mockId) => {
      const id = realKeyId(mockId);
      if (!Number.isFinite(id)) return;
      safe(keysApi.remove(id));
    },
    addKeyCreditsCents: () => {
      // Account-wallet model — top-ups go through PayPal order/capture, not
      // a per-key credit grant. No-op here.
    },
    addKeyCalls: () => {
      // No-op — see addKeyCreditsCents.
    },
    topupAccount: () => {
      // Real top-ups are driven by the PayPal checkout (order → capture) in
      // the billing modal, which calls billing.captureTopup directly and then
      // invalidates. Nothing to forward here.
    },
    updateAccountAlert: (alert) => {
      safe(
        notifApi.patch({
          low_balance_alerts_master: alert.enabled,
          low_evaluation_points_threshold: alert.thresholdPoints,
        }),
      );
    },
    updateKeySettings: (mockId, patch) => {
      const id = realKeyId(mockId);
      if (!Number.isFinite(id)) return;
      // Map the mock per-key caps onto the backend's four-axis settings.
      const apiPatch: Partial<{
        daily_call_cap: number;
        monthly_call_cap: number;
        daily_evaluation_point_cap: number;
        monthly_evaluation_point_cap: number;
      }> = {};
      if (patch.monthlyPointCap !== undefined) {
        apiPatch.monthly_evaluation_point_cap = patch.monthlyPointCap ?? 0;
      }
      if (patch.monthlyCallCap !== undefined) {
        apiPatch.monthly_call_cap = patch.monthlyCallCap ?? 0;
      }
      if (patch.dailyPointCap !== undefined) {
        apiPatch.daily_evaluation_point_cap = patch.dailyPointCap ?? 0;
      }
      if (patch.dailyCallCap !== undefined) {
        apiPatch.daily_call_cap = patch.dailyCallCap ?? 0;
      }
      if (Object.keys(apiPatch).length === 0) return;
      safe(keysApi.patchSettings(id, apiPatch));
    },
    updateNotificationSettings: (patch) => {
      // Strict PATCH: unknown fields → 400, so map only contract fields.
      const body: Parameters<typeof notifApi.patch>[0] = {};
      if (patch.weeklyUsageReport !== undefined) body.weekly_usage_report = patch.weeklyUsageReport;
      if (patch.paymentReceipts !== undefined) body.payment_receipts = patch.paymentReceipts;
      if (patch.productUpdates !== undefined) body.product_updates = patch.productUpdates;
      if (patch.securityAlerts !== undefined) body.security_alerts = patch.securityAlerts;
      if (Object.keys(body).length === 0) return;
      safe(notifApi.patch(body));
    },
    updateAccountLimits: (limit) => {
      // Full four-axis persistence (account-wide guardrails). null = unlimited
      // = 0 to the backend.
      safe(
        billing.setLimits({
          monthly_evaluation_point_cap: limit.monthlyPointCap ?? 0,
          monthly_call_cap: limit.monthlyCallCap ?? 0,
          daily_evaluation_point_cap: limit.dailyPointCap ?? 0,
          daily_call_cap: limit.dailyCallCap ?? 0,
          warn_at_percents: limit.warnAtPercents,
        }),
      );
    },
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Hydrate

let inFlight = false;
let lastHydrate = 0;

export async function hydrateFromApi(opts: { force?: boolean } = {}): Promise<void> {
  if (typeof window === 'undefined') return;
  const sessionToken = getToken();
  if (!sessionToken) return; // not signed in — keep mock seed
  if (inFlight) return;
  if (!opts.force && Date.now() - lastHydrate < 2000) return;

  inFlight = true;
  __markSeeded(); // prevent seed fallback before first response lands

  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const usageFrom = new Date(today.getTime() - 89 * 86400000).toISOString().slice(0, 10);
    const usageTo = today.toISOString().slice(0, 10);
    const [keysRes, txRes, batchesRes, limitsRes, notifRes, usageRes, summaryRes, kernelsRes] = await Promise.allSettled([
      keysApi.list(),
      billing.listAllTransactions(),
      // Expiry views need every batch, so walk all pages (doc §10).
      billing.listAllEvaluationPointBatches(),
      billing.getLimits(),
      notifApi.get(),
      usageApi.points({ from: usageFrom, to: usageTo, granularity: 'day' }),
      billing.summary(),
      catalogApi.evaluationKernels(),
    ]);

    const partial: Parameters<typeof __replaceCache>[0] = {};

    if (keysRes.status === 'fulfilled') {
      partial.keys = keysRes.value.map(mapApiKeyToMock);
    }
    if (txRes.status === 'fulfilled') {
      partial.transactions = txRes.value.map(mapTransaction);
    }
    if (batchesRes.status === 'fulfilled') {
      partial.evaluationPointBatches = (batchesRes.value ?? []).map(mapEvaluationPointBatch);
    }
    if (limitsRes.status === 'fulfilled') {
      partial.spendLimit = mapLimits(limitsRes.value);
    }
    if (notifRes.status === 'fulfilled') {
      partial.notifications = mapNotifications(notifRes.value);
      partial.accountAlert = mapAccountAlert(notifRes.value);
    }
    if (usageRes.status === 'fulfilled') {
      const kernels = kernelsRes.status === 'fulfilled' ? kernelsRes.value.items ?? [] : [];
      const kernelsByCoreType = new Map(kernels.map((kernel) => [kernel.core_type, kernel]));
      partial.usage = (usageRes.value ?? []).map((point) => mapUsagePoint(point, kernelsByCoreType));
    }
    if (summaryRes.status === 'fulfilled') {
      partial.trial = mapTrialFromSummary(summaryRes.value);
      partial.wallet = mapWalletFromSummary(summaryRes.value);
      partial.currentMonth = mapCurrentMonthFromSummary(summaryRes.value);
    }

    // The user may have signed out or entered the isolated demo while these
    // requests were in flight. Never let a stale real-account response cross
    // that session boundary and overwrite the new store.
    if (getToken() === sessionToken) {
      __replaceCache(partial);
      lastHydrate = Date.now();
    }
  } catch (err) {
    console.warn('[mock-store-bridge] hydrate failed:', describeError(err));
  } finally {
    inFlight = false;
  }
}
