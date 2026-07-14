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
  type NotificationSettings as MockNotifications,
  type SpendLimit as MockSpendLimit,
  type Transaction as MockTransaction,
  type TransactionKind,
  type TrialAllowance,
  type UsagePoint as MockUsagePoint,
} from './mock-store';
import {
  billing,
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
  EvaluationPointBatch as RealEvaluationPointBatch,
  NotificationSettings as RealNotifications,
  Transaction as RealTransaction,
  UsagePoint as RealUsagePoint,
} from './api';
import { centsToWalletPoints } from './topup';

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

function mapKey(k: RealApiKey): MockApiKey {
  const env: Environment = k.env === 'development' ? 'development' : 'production';

  // Heuristic fallback for payloads that don't expose `is_starter`: the
  // auto-provisioned default key is still named "Starter".
  const isStarter = k.is_starter ?? k.name.trim().toLowerCase() === 'starter';

  const status: 'active' | 'paused' | 'revoked' = (() => {
    if (k.status === 'paused' || k.status === 'revoked' || k.status === 'active') return k.status;
    return k.enabled === false ? 'paused' : 'active';
  })();

  const limits = k.limits ?? null;

  // The backend returns the full plaintext key in `api_key`; we keep it as the
  // secret (used by the copy button) and only mask it for display.
  const secret = k.api_key ?? '';

  return {
    id: mockKeyId(k.id),
    name: k.name,
    env,
    secret,
    maskedSecret: maskSecret(secret),
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

// Prefer server-provided trial total; fall back to the product default (600).
function mapTrialFromSummary(summary: BillingSummary): TrialAllowance {
  const totalLimit = Math.max(
    0,
    summary.trial_calls_total ?? TRIAL_DEFAULT_TOTAL,
  );
  const remaining = summary.trial_active
    ? Math.max(0, Math.min(totalLimit, summary.trial_calls_remaining ?? 0))
    : 0;
  const expiresAt = summary.trial_expires_at;
  const expiresAtMs = Date.parse(expiresAt);
  const grantedAt = Number.isFinite(expiresAtMs)
    ? new Date(expiresAtMs - TRIAL_DEFAULT_VALID_DAYS * 86400000).toISOString()
    : new Date().toISOString();

  return {
    totalLimit,
    totalUsed: totalLimit - remaining,
    grantedAt,
    expiresAt: expiresAt || grantedAt,
  };
}

// Wallet balance is authoritative from `balance_mills` (1 USD = 1000 mills =
// 100 cents). The mock wallet derives balance as paidCredits − used, so we
// back-solve those so the difference equals the real balance while keeping
// the cumulative top-up figure for "total recharged" displays.
function mapWalletFromSummary(summary: BillingSummary): AccountWallet {
  const balanceCents = Math.max(0, Math.round((summary.balance_mills ?? 0) / 10));
  const cumulativeTopup = Math.max(0, Math.round((summary.paid_credits_mills ?? 0) / 10));
  const paidCreditsCents = Math.max(cumulativeTopup, balanceCents);
  return {
    paidEvaluationPoints: Math.max(
      summary.evaluation_points_credited_total ?? 0,
      summary.evaluation_points_balance ?? 0,
    ),
    usedEvaluationPoints: Math.max(0, summary.evaluation_points_used_total ?? 0),
    paidCreditsCents,
    paidCreditsUsedCents: paidCreditsCents - balanceCents,
  };
}

function mapTransaction(t: RealTransaction): MockTransaction {
  const status: MockTransaction['status'] =
    t.status === 'succeeded' || t.status === 'pending' || t.status === 'failed'
      ? t.status
      : 'succeeded';
  // PayPal-only billing today; default the method accordingly.
  const method: MockTransaction['method'] = t.method === 'paypal' ? 'paypal' : 'paypal';
  // Both backend kinds map to a wallet top-up in the UI's two-value union.
  const kind: TransactionKind = 'credit-topup';
  return {
    id: mockTxId(t.id),
    createdAt: t.created_at,
    amountCents: t.amount_cents,
    status,
    method,
    last4: '----',
    description: t.description ?? `Top-up ${(t.amount_cents / 100).toFixed(2)}`,
    paypalOrderId: t.paypal_order_id,
    balanceBeforeCents: t.balance_before,
    balanceAfterCents: t.balance_after,
    packageId: t.package_id,
    basePoints: t.base_points,
    bonusPoints: t.bonus_points,
    creditedPoints: t.credited_points ?? centsToWalletPoints(t.amount_cents),
    balanceBeforePoints: t.point_balance_before,
    balanceAfterPoints: t.point_balance_after,
    pointsExpireAt: t.points_expire_at ?? undefined,
    usedPoints: t.used_points,
    remainingPoints: t.remaining_points,
    kind,
  };
}

function mapEvaluationPointBatch(batch: RealEvaluationPointBatch): MockEvaluationPointBatch {
  const status: MockEvaluationPointBatch['status'] =
    batch.status === 'active' || batch.status === 'exhausted' || batch.status === 'expired'
      ? batch.status
      : 'active';
  return {
    id: batch.id,
    transactionId: mockTxId(batch.transaction_id),
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
    warnAtPercents: s.warn_at_percents?.length ? s.warn_at_percents : [50, 75, 90],
  };
}

function mapNotifications(n: Partial<RealNotifications>): MockNotifications {
  return {
    weeklyUsageReport: !!n.weekly_usage_report,
    paymentReceipts: n.payment_receipts ?? true,
    spendLimitAlerts: n.spend_limit_alerts ?? true,
    productUpdates: !!n.product_updates,
    securityAlerts: n.security_alerts ?? true,
  };
}

function mapAccountAlert(n: Partial<RealNotifications>): AccountLowBalanceAlert {
  return {
    enabled: n.low_balance_alerts_master ?? true,
    thresholdPoints: n.low_evaluation_points_threshold
      ?? centsToWalletPoints(n.low_balance_threshold_cents ?? 500),
  };
}

function mapUsagePoint(p: RealUsagePoint): MockUsagePoint {
  return {
    date: (p.date || '').slice(0, 10),
    keyId: p.key_id != null ? mockKeyId(p.key_id) : 'key_*',
    model: p.model || 'mcp-call',
    calls: p.calls ?? 0,
    wordSentenceCalls: p.word_sentence_calls,
    paragraphCalls: p.paragraph_calls,
    wordSentencePoints: p.word_sentence_points,
    paragraphPoints: p.paragraph_points,
    evaluationPoints: p.evaluation_points,
    costMills: p.cost_mills ?? 0,
    savingsMills: p.savings_mills ?? 0,
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
      const body: Partial<RealNotifications> = {};
      if (patch.weeklyUsageReport !== undefined) body.weekly_usage_report = patch.weeklyUsageReport;
      if (patch.paymentReceipts !== undefined) body.payment_receipts = patch.paymentReceipts;
      if (patch.spendLimitAlerts !== undefined) body.spend_limit_alerts = patch.spendLimitAlerts;
      if (patch.productUpdates !== undefined) body.product_updates = patch.productUpdates;
      if (patch.securityAlerts !== undefined) body.security_alerts = patch.securityAlerts;
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
  if (!getToken()) return; // not signed in — keep mock seed
  if (inFlight) return;
  if (!opts.force && Date.now() - lastHydrate < 2000) return;

  inFlight = true;
  __markSeeded(); // prevent seed fallback before first response lands

  try {
    const [keysRes, txRes, batchesRes, limitsRes, notifRes, usageRes, summaryRes] = await Promise.allSettled([
      keysApi.list(),
      billing.listTransactions({ page: 1, page_size: 50 }),
      billing.listEvaluationPointBatches(),
      billing.getLimits(),
      notifApi.get(),
      usageApi.points({ granularity: 'day' }),
      billing.summary(),
    ]);

    const partial: Parameters<typeof __replaceCache>[0] = {};

    if (keysRes.status === 'fulfilled') {
      partial.keys = keysRes.value.map(mapKey);
    }
    if (txRes.status === 'fulfilled') {
      partial.transactions = (txRes.value.transactions ?? []).map(mapTransaction);
    }
    if (batchesRes.status === 'fulfilled') {
      partial.evaluationPointBatches = (batchesRes.value.batches ?? []).map(mapEvaluationPointBatch);
    }
    if (limitsRes.status === 'fulfilled') {
      partial.spendLimit = mapLimits(limitsRes.value);
    }
    if (notifRes.status === 'fulfilled') {
      partial.notifications = mapNotifications(notifRes.value);
      partial.accountAlert = mapAccountAlert(notifRes.value);
    }
    if (usageRes.status === 'fulfilled') {
      partial.usage = (usageRes.value ?? []).map(mapUsagePoint);
    }
    if (summaryRes.status === 'fulfilled') {
      partial.trial = mapTrialFromSummary(summaryRes.value);
      partial.wallet = mapWalletFromSummary(summaryRes.value);
    }

    __replaceCache(partial);
    lastHydrate = Date.now();
  } catch (err) {
    console.warn('[mock-store-bridge] hydrate failed:', describeError(err));
  } finally {
    inFlight = false;
  }
}
