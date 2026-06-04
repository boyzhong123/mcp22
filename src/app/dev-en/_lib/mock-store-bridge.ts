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
  getFullSecret,
  maskSecret,
  rememberFullSecret,
  TRIAL_DEFAULT_TOTAL,
  TRIAL_DEFAULT_VALID_DAYS,
  type AccountLowBalanceAlert,
  type AccountWallet,
  type ApiKey as MockApiKey,
  type Environment,
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

  // The list endpoint masks `api_key`. If we captured this key's plaintext
  // earlier (on create / rotate, stashed in the local vault), surface that as
  // the secret so the copy button can yield the full key; the render still
  // shows the masked form.
  const retained = getFullSecret(mockKeyId(k.id));
  const secret = retained ?? k.api_key ?? '';

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
    spendCapCents: capOrNull(limits?.monthly_spend_cap_mills != null ? Math.round(limits.monthly_spend_cap_mills / 10) : undefined),
    monthlyCallCap: capOrNull(limits?.monthly_call_cap),
    dailySpendCapCents: capOrNull(limits?.daily_spend_cap_mills != null ? Math.round(limits.daily_spend_cap_mills / 10) : undefined),
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

// The trial total isn't returned by the backend, so we keep the product
// default (600) and derive used = total − remaining from the summary.
function mapTrialFromSummary(summary: BillingSummary): TrialAllowance {
  const remaining = summary.trial_active
    ? Math.max(0, Math.min(TRIAL_DEFAULT_TOTAL, summary.trial_calls_remaining ?? 0))
    : 0;
  const expiresAt = summary.trial_expires_at;
  const expiresAtMs = Date.parse(expiresAt);
  const grantedAt = Number.isFinite(expiresAtMs)
    ? new Date(expiresAtMs - TRIAL_DEFAULT_VALID_DAYS * 86400000).toISOString()
    : new Date().toISOString();

  return {
    totalLimit: TRIAL_DEFAULT_TOTAL,
    totalUsed: TRIAL_DEFAULT_TOTAL - remaining,
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
    balanceBeforeCents: t.balance_before,
    balanceAfterCents: t.balance_after,
    kind,
  };
}

function mapLimits(s: RealAccountLimits): MockSpendLimit {
  return {
    monthlyCapCents: capOrNull(s.monthly_spend_cap_mills != null ? Math.round(s.monthly_spend_cap_mills / 10) : undefined),
    monthlyCallCap: capOrNull(s.monthly_call_cap),
    dailyCapCents: capOrNull(s.daily_spend_cap_mills != null ? Math.round(s.daily_spend_cap_mills / 10) : undefined),
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
    thresholdCents: n.low_balance_threshold_cents ?? 1000,
  };
}

function mapUsagePoint(p: RealUsagePoint): MockUsagePoint {
  return {
    date: (p.date || '').slice(0, 10),
    keyId: p.key_id != null ? mockKeyId(p.key_id) : 'key_*',
    model: p.model || 'mcp-call',
    calls: p.calls ?? 0,
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
    createKey: (name) =>
      safe(
        keysApi.create({ name }).then((created) => {
          // Backend returns the plaintext exactly once — stash it so the list's
          // copy button keeps yielding the full secret after hydration masks it.
          rememberFullSecret(mockKeyId(created.id), created.api_key);
        }),
      ),
    renameKey: (mockId, name) => {
      const id = realKeyId(mockId);
      if (!Number.isFinite(id)) return;
      safe(keysApi.rename(id, name));
    },
    rotateKeySecret: (mockId) => {
      const id = realKeyId(mockId);
      if (!Number.isFinite(id)) return;
      safe(
        keysApi.rotate(id).then((rotated) => {
          rememberFullSecret(mockKeyId(rotated.id), rotated.api_key);
        }),
      );
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
          low_balance_threshold_cents: alert.thresholdCents,
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
        daily_spend_cap_mills: number;
        monthly_spend_cap_mills: number;
      }> = {};
      if (patch.spendCapCents !== undefined) {
        apiPatch.monthly_spend_cap_mills = (patch.spendCapCents ?? 0) * 10;
      }
      if (patch.monthlyCallCap !== undefined) {
        apiPatch.monthly_call_cap = patch.monthlyCallCap ?? 0;
      }
      if (patch.dailySpendCapCents !== undefined) {
        apiPatch.daily_spend_cap_mills = (patch.dailySpendCapCents ?? 0) * 10;
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
          monthly_spend_cap_mills: (limit.monthlyCapCents ?? 0) * 10,
          monthly_call_cap: limit.monthlyCallCap ?? 0,
          daily_spend_cap_mills: (limit.dailyCapCents ?? 0) * 10,
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
    const [keysRes, txRes, limitsRes, notifRes, usageRes, summaryRes] = await Promise.allSettled([
      keysApi.list(),
      billing.listTransactions({ page: 1, page_size: 50 }),
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
