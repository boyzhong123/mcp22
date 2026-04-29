'use client';

// Hydration bridge: pulls data from the real backend API (via _lib/api) and
// pushes it into the legacy mock-store cache so the original UI components
// (which still read via listKeys/getStarterKey/etc.) display real data.
//
// Fields the backend doesn't provide are filled with sensible placeholders
// and marked with `// TODO: backend missing field` so we can wire them up
// later without changing UI markup.

import {
  __markSeeded,
  __replaceCache,
  __setMutationProxy,
  maskSecret,
  type ApiKey as MockApiKey,
  type Environment,
  type LowBalanceAlert as MockLowBalanceAlert,
  type NotificationSettings as MockNotifications,
  type PaymentMethod as MockPaymentMethod,
  type Project as MockProject,
  type SpendLimit as MockSpendLimit,
  type TeamMember as MockTeamMember,
  type TeamRole,
  type Transaction as MockTransaction,
  type TransactionKind,
  type UsagePoint as MockUsagePoint,
  type CardBrand,
} from './mock-store';
import {
  billing,
  describeError,
  getToken,
  keys as keysApi,
  notifications as notifApi,
  team as teamApi,
  usage as usageApi,
} from './api';
import type {
  ApiKey as RealApiKey,
  PaymentMethod as RealPaymentMethod,
  SpendLimit as RealSpendLimit,
  TeamMember as RealTeamMember,
  Transaction as RealTransaction,
} from './api';

// ────────────────────────────────────────────────────────────────────────────
// ID encoding: mock-store uses string ids ("key_xxx", "tm_xxx", "proj_xxx").
// Real backend uses numeric ids. We encode the numeric id as `<prefix><id>`
// so all UI string-id pathways still work; idFromMockKey() decodes back.

export function mockKeyId(id: number): string {
  return `key_${id}`;
}
export function realKeyId(mockId: string): number {
  const m = mockId.match(/^key_(\d+)$/);
  return m ? Number(m[1]) : Number(mockId);
}
export function mockTeamMemberId(id: number): string {
  return `tm_${id}`;
}
export function realTeamMemberId(mockId: string): number {
  const m = mockId.match(/^tm_(\d+)$/);
  return m ? Number(m[1]) : Number(mockId);
}
export function mockTxId(id: number): string {
  return `tx_${id}`;
}
export function mockPmId(id: number): string {
  return `pm_${id}`;
}
export function realPmId(mockId: string): number {
  const m = mockId.match(/^pm_(\d+)$/);
  return m ? Number(m[1]) : Number(mockId);
}

// ────────────────────────────────────────────────────────────────────────────
// Mappers

function mapKey(k: RealApiKey): MockApiKey {
  const env: Environment = k.api_key?.startsWith('sk_test_') ? 'development' : 'production';
  const totalLimit = k.total_limit ?? k.limit?.total_limit ?? 0;
  const periodLimit = k.period_limit ?? k.limit?.period_limit ?? 0;
  const totalUsed = k.total_used ?? 0;
  const periodUsed = k.period_used ?? 0;

  // Heuristic: starter key has both lifetime and per-day caps (the backend
  // seeds it with total_limit=900, period_limit=30). Paid keys may have a
  // total_limit (their purchased calls) but no per-day cap.
  const isStarter = k.is_starter ?? (periodLimit > 0 && totalLimit > 0);

  const status: 'active' | 'paused' | 'revoked' = (() => {
    if (k.status === 'paused' || k.status === 'revoked' || k.status === 'active') return k.status;
    return k.enabled === false ? 'paused' : 'active';
  })();

  return {
    id: mockKeyId(k.id),
    name: k.name,
    env,
    // TODO: backend missing project_id on key — fall back to default project
    projectId: k.project_id != null ? `proj_${k.project_id}` : 'proj_default',
    secret: k.api_key,
    maskedSecret: maskSecret(k.api_key || ''),
    createdAt: k.created_at,
    // TODO: backend missing last_used_at
    lastUsedAt: null,
    status,
    isStarter,
    // Calls model: every key uses freeTotalLimit/Used as its "calls remaining"
    // pool. For paid keys, this grows when the user tops up. The legacy
    // freeDaily* fields stay as the per-day cap (only meaningful for starter).
    freeDailyLimit: periodLimit,
    freeDailyUsed: periodUsed,
    freeDailyResetAt: new Date().toISOString().slice(0, 10),
    freeTotalLimit: totalLimit,
    freeTotalUsed: totalUsed,
    // Dollar-balance model is deprecated. Backend doesn't expose it on this
    // endpoint and the UI should read calls remaining via getKeyCallsRemaining().
    paidCreditsCents: 0,
    paidCreditsUsedCents: 0,
    spendCapCents: k.spend_cap_cents ?? null,
    lowBalanceAlert: k.low_balance_alert
      ? {
          enabled: k.low_balance_alert.enabled,
          thresholdCents: k.low_balance_alert.threshold_cents,
        }
      : null,
  };
}

function mapTransaction(t: RealTransaction): MockTransaction {
  const status: MockTransaction['status'] =
    t.status === 'succeeded' || t.status === 'pending' || t.status === 'failed'
      ? t.status
      : 'succeeded';
  const allowedMethods: MockTransaction['method'][] = [
    'card',
    'apple-pay',
    'google-pay',
    'link',
    'cashapp',
    'paypal',
    'amazon-pay',
    'ach',
    'wire',
  ];
  const method = (allowedMethods as string[]).includes(t.method)
    ? (t.method as MockTransaction['method'])
    : 'card';
  const kind: TransactionKind = t.kind === 'card-added' ? 'card-added' : 'credit-topup';
  // Calls model: surface the purchased-call count in the transaction copy
  // when the backend reports it. Falls back to a generic "Top-up" line so
  // historical rows (created before the migration) still render sensibly.
  const purchasedCalls =
    typeof (t as { calls?: number }).calls === 'number'
      ? (t as { calls?: number }).calls
      : undefined;
  const description =
    kind === 'card-added'
      ? 'Card added'
      : purchasedCalls && purchasedCalls > 0
        ? `+${purchasedCalls.toLocaleString('en-US')} calls`
        : `Top-up · ${t.last4 ?? ''}`.trim();
  return {
    id: mockTxId(t.id),
    createdAt: t.created_at,
    amountCents: t.amount_cents,
    status,
    method,
    last4: t.last4 ?? '----',
    description,
    invoiceNumber: t.invoice_number ?? '',
    kind,
    keyId: t.key_id != null ? mockKeyId(t.key_id) : undefined,
    // TODO: backend missing project on transaction
    projectId: undefined,
  };
}

function mapPaymentMethod(p: RealPaymentMethod): MockPaymentMethod {
  const brand = (['visa', 'mastercard', 'amex'] as CardBrand[]).includes(p.brand as CardBrand)
    ? (p.brand as CardBrand)
    : 'visa';
  return {
    id: mockPmId(p.id),
    brand,
    last4: p.last4,
    expMonth: p.exp_month,
    expYear: p.exp_year,
    name: p.name ?? '',
    isDefault: p.is_default,
    // TODO: backend missing created_at on payment method
    createdAt: new Date().toISOString(),
  };
}

function mapSpendLimit(s: RealSpendLimit): MockSpendLimit {
  return {
    monthlyCapCents: Number.isFinite(s.monthly_limit_cents) ? s.monthly_limit_cents : 0,
    // TODO: backend missing reset day; assume 1st of month
    resetDay: 1,
    // Original UI expects multiple thresholds, backend has one.
    warnAtPercents: [s.alert_threshold_pct ?? 80],
  };
}

function mapTeamMember(m: RealTeamMember): MockTeamMember {
  const role: TeamRole = (['owner', 'admin', 'developer', 'viewer'] as TeamRole[]).includes(m.role)
    ? m.role
    : 'developer';
  const status: 'active' | 'invited' = m.status === 'invited' ? 'invited' : 'active';
  // Deterministic avatar seed from id so colours are stable.
  const avatarSeed = m.id % 100;
  return {
    id: mockTeamMemberId(m.id),
    name: m.name ?? m.email.split('@')[0],
    email: m.email,
    role,
    status,
    // TODO: backend missing created_at / last_active_at on team member
    createdAt: new Date().toISOString(),
    lastActiveAt: null,
    avatarSeed,
  };
}

function mapNotifications(n: Partial<{
  weekly_usage_report: boolean;
  payment_receipts: boolean;
  invoice_ready: boolean;
  spend_limit_alerts: boolean;
  low_balance_alerts_master: boolean;
  product_updates: boolean;
  security_alerts: boolean;
}>): MockNotifications {
  return {
    weeklyUsageReport: !!n.weekly_usage_report,
    paymentReceipts: n.payment_receipts ?? true,
    invoiceReady: n.invoice_ready ?? true,
    spendLimitAlerts: n.spend_limit_alerts ?? true,
    lowBalanceAlertsMaster: n.low_balance_alerts_master ?? true,
    productUpdates: !!n.product_updates,
    securityAlerts: n.security_alerts ?? true,
  };
}

// Default project so original UI's project selector still has at least one
// entry. TODO: backend has no projects API yet.
const DEFAULT_PROJECT: MockProject = {
  id: 'proj_default',
  slug: 'default',
  name: 'Default project',
  createdAt: new Date(0).toISOString(),
};

// ────────────────────────────────────────────────────────────────────────────
// Mutation proxy: legacy mutators in mock-store fire these in addition to
// updating the local cache. We push to the real backend in the background;
// the underlying invalidate() call from the api/* modules triggers the
// DataHydrator to re-pull, replacing optimistic data with authoritative.

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
    addKeyCreditsCents: (mockId, amountCents) => {
      const id = realKeyId(mockId);
      if (!Number.isFinite(id) || amountCents <= 0) return;
      // Legacy entry point — the new top-up flow (calls model) drives the
      // intent/confirm calls directly from stripe-checkout-modal so we have
      // the purchased-call count in scope. Keep this for compat: still hits
      // the backend in case any older path lands here.
      safe(
        billing
          .createTopupIntent({ key_id: id, amount_cents: amountCents, method: 'card' })
          .then((res) => billing.confirmTopup(res.transaction_id)),
      );
    },
    addKeyCalls: (_mockId, _calls) => {
      // No-op proxy — the real top-up call is fired by stripe-checkout-modal
      // (which knows the purchased call count and the resulting amount_cents).
      // The local-store mutation already optimistically grew freeTotalLimit;
      // the modal's billing.confirmTopup() invalidate('keys') triggers a
      // hydrate so authoritative state lands shortly after.
    },
    updateKeySettings: (mockId, patch) => {
      const id = realKeyId(mockId);
      if (!Number.isFinite(id)) return;
      const apiPatch: { spend_cap_cents?: number | null; low_balance_alert?: { enabled: boolean; threshold_cents: number } } = {};
      if (patch.spendCapCents !== undefined) apiPatch.spend_cap_cents = patch.spendCapCents;
      if (patch.lowBalanceAlert !== undefined && patch.lowBalanceAlert !== null) {
        apiPatch.low_balance_alert = {
          enabled: patch.lowBalanceAlert.enabled,
          threshold_cents: patch.lowBalanceAlert.thresholdCents,
        };
      }
      safe(keysApi.patchSettings(id, apiPatch));
    },
    inviteTeamMember: (input) => {
      safe(teamApi.invite({ email: input.email, role: input.role, name: input.name }));
    },
    updateTeamMemberRole: (mockId, role) => {
      const id = realTeamMemberId(mockId);
      if (!Number.isFinite(id)) return;
      safe(teamApi.patchRole(id, role));
    },
    removeTeamMember: (mockId) => {
      const id = realTeamMemberId(mockId);
      if (!Number.isFinite(id)) return;
      safe(teamApi.remove(id));
    },
    resendTeamInvite: (mockId) => {
      const id = realTeamMemberId(mockId);
      if (!Number.isFinite(id)) return;
      safe(teamApi.resend(id));
    },
    updateNotificationSettings: (patch) => {
      const body: Partial<{
        weekly_usage_report: boolean;
        payment_receipts: boolean;
        invoice_ready: boolean;
        spend_limit_alerts: boolean;
        low_balance_alerts_master: boolean;
        product_updates: boolean;
        security_alerts: boolean;
      }> = {};
      if (patch.weeklyUsageReport !== undefined) body.weekly_usage_report = patch.weeklyUsageReport;
      if (patch.paymentReceipts !== undefined) body.payment_receipts = patch.paymentReceipts;
      if (patch.invoiceReady !== undefined) body.invoice_ready = patch.invoiceReady;
      if (patch.spendLimitAlerts !== undefined) body.spend_limit_alerts = patch.spendLimitAlerts;
      if (patch.lowBalanceAlertsMaster !== undefined) body.low_balance_alerts_master = patch.lowBalanceAlertsMaster;
      if (patch.productUpdates !== undefined) body.product_updates = patch.productUpdates;
      if (patch.securityAlerts !== undefined) body.security_alerts = patch.securityAlerts;
      safe(notifApi.patch(body));
    },
    setSpendLimitCents: (cents, warnAtPercents) => {
      safe(
        billing.setSpendLimit({
          monthly_limit_cents: cents,
          alert_threshold_pct: warnAtPercents?.[0],
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
    const [
      keysRes,
      txRes,
      spendRes,
      pmRes,
      teamRes,
      notifRes,
      usageRes,
    ] = await Promise.allSettled([
      keysApi.list(),
      billing.listTransactions({ page: 1, page_size: 50 }),
      billing.getSpendLimit(),
      billing.listPaymentMethods(),
      teamApi.list(),
      notifApi.get(),
      usageApi.points({ granularity: 'day' }),
    ]);

    const partial: Parameters<typeof __replaceCache>[0] = {};

    if (keysRes.status === 'fulfilled') {
      partial.keys = keysRes.value.map(mapKey);
      // Synthesise project list from distinct project_ids on keys.
      const seen = new Map<number, MockProject>();
      for (const k of keysRes.value) {
        if (k.project_id != null && !seen.has(k.project_id)) {
          seen.set(k.project_id, {
            id: `proj_${k.project_id}`,
            slug: `project-${k.project_id}`,
            name: `Project ${k.project_id}`,
            createdAt: new Date(0).toISOString(),
          });
        }
      }
      partial.projects = seen.size > 0 ? Array.from(seen.values()) : [DEFAULT_PROJECT];
    }
    if (txRes.status === 'fulfilled') {
      partial.transactions = (txRes.value.transactions ?? []).map(mapTransaction);
    }
    if (spendRes.status === 'fulfilled') {
      partial.spendLimit = mapSpendLimit(spendRes.value);
    }
    if (pmRes.status === 'fulfilled') {
      partial.paymentMethods = (pmRes.value ?? []).map(mapPaymentMethod);
    }
    if (teamRes.status === 'fulfilled') {
      partial.teamMembers = (teamRes.value ?? []).map(mapTeamMember);
    }
    if (notifRes.status === 'fulfilled') {
      partial.notifications = mapNotifications(notifRes.value);
    }
    if (usageRes.status === 'fulfilled') {
      // Map UsagePoint{time, calls} → MockUsagePoint{date, keyId, model, calls, costCents, savingsCents}.
      // TODO: backend points endpoint is single-series; doesn't break down by key/model. We aggregate to one synthetic row per day.
      partial.usage = (usageRes.value ?? []).map<MockUsagePoint>((p) => ({
        date: p.time.slice(0, 10),
        keyId: 'key_*',
        model: 'mcp-call',
        calls: p.calls,
        costCents: 0,
        savingsCents: 0,
      }));
    }

    __replaceCache(partial);
    lastHydrate = Date.now();
  } catch (err) {
    // Silent failure — fall back to whatever's in cache. Surface in console.
    console.warn('[mock-store-bridge] hydrate failed:', describeError(err));
  } finally {
    inFlight = false;
  }
}
