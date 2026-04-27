'use client';

/**
 * Fully client-side, localStorage-backed mock data store for the English
 * developer preview. No network calls, no API keys are real — everything
 * resets when the user clears site data.
 *
 * Billing model (two-tier):
 *
 *   STARTER KEY — exactly one per account, provisioned automatically at
 *   signup. Flagged with `isStarter: true`. Carries a hard, non-refillable
 *   free allowance (30 calls/day, 900 calls lifetime). Cannot be deleted
 *   and never receives credits. Runs until the lifetime cap is exhausted,
 *   then stops serving traffic forever.
 *
 *   PAID KEYS — everything the user creates after signup. No daily/lifetime
 *   caps; they run purely off `paidCreditsCents` (credit balance). A key
 *   with $0 balance is "needs credits" and cannot serve traffic until
 *   topped up. Each paid key optionally carries:
 *     - `spendCapCents`: monthly spend cap (null = uncapped)
 *     - `lowBalanceAlert`: email when balance drops below a threshold
 *
 *   Account-level state covers the global monthly spend limit (a safety
 *   net across all keys) and saved payment methods.
 *
 * An in-memory cache + observable pattern powers `useSyncExternalStore`
 * consumers without violating React 19's strict set-state-in-effect rule.
 */

// ─── Types ──────────────────────────────────────────────────────────────────
export type Environment = 'development' | 'production';
/**
 *  - `starter`: the freebie, still has lifetime allowance remaining.
 *  - `starter-exhausted`: freebie lifetime cap hit; dead key.
 *  - `paid-active`: paid key with remaining balance.
 *  - `needs-credits`: paid key with $0 balance; blocked until top-up.
 *  - `revoked`: user rotated/revoked; kept for audit.
 */
export type BillingTier =
  | 'starter'
  | 'starter-exhausted'
  | 'paid-active'
  | 'needs-credits'
  | 'paused'
  | 'revoked';
export type CardBrand = 'visa' | 'mastercard' | 'amex';

export interface LowBalanceAlert {
  enabled: boolean;
  thresholdCents: number;
}

export interface Project {
  id: string;
  slug: string;
  name: string;
  createdAt: string;
}

export interface ApiKey {
  id: string;
  name: string;
  env: Environment;
  projectId: string;
  secret: string;
  maskedSecret: string;
  createdAt: string;
  lastUsedAt: string | null;
  /**
   * Lifecycle status:
   *  - `active`:  normal — key can authenticate and serve traffic.
   *  - `paused`:  reversible, user-initiated disable. Stops serving traffic
   *               but keeps the secret valid so it can be re-enabled later.
   *  - `revoked`: permanent — the secret is dead. Requires rotate/create
   *               to resume. Kept around for audit/history.
   */
  status: 'active' | 'paused' | 'revoked';
  /**
   * True for the account's one-and-only starter key. Non-starter keys can be
   * created/revoked freely; the starter key is system-provisioned at signup
   * and cannot be deleted (though it *can* be rotated — same id, new secret).
   */
  isStarter: boolean;
  // Free-tier allowance. Only the starter key carries non-zero limits;
  // every paid key has freeDailyLimit = freeTotalLimit = 0.
  freeDailyLimit: number;
  freeDailyUsed: number;
  freeDailyResetAt: string; // ISO; refreshed whenever UTC date changes
  freeTotalLimit: number;
  freeTotalUsed: number;
  // Per-key paid credits (in cents). Starter key stays at 0/0 forever.
  paidCreditsCents: number;
  paidCreditsUsedCents: number;
  /**
   * Optional monthly spend cap in cents. `null` = uncapped. Applies only
   * to paid keys; starter ignores this field.
   */
  spendCapCents: number | null;
  /**
   * Optional low-balance email alert config. `null` = feature disabled.
   * Applies only to paid keys.
   */
  lowBalanceAlert: LowBalanceAlert | null;
}

export interface UsagePoint {
  date: string; // YYYY-MM-DD (UTC)
  keyId: string;
  model: string;
  calls: number;
  costCents: number;
  savingsCents: number;
}

export interface SpendLimit {
  monthlyCapCents: number;
  resetDay: number; // 1 = first of month
  warnAtPercents: number[]; // e.g., [50, 75, 90]
}

export interface PaymentMethod {
  id: string;
  brand: CardBrand;
  last4: string;
  expMonth: number;
  expYear: number;
  name: string;
  isDefault: boolean;
  createdAt: string;
}

export type TransactionKind = 'credit-topup' | 'card-added';

export interface Transaction {
  id: string;
  createdAt: string;
  amountCents: number;
  status: 'succeeded' | 'pending' | 'failed';
  method:
    | 'card'
    | 'apple-pay'
    | 'google-pay'
    | 'link'
    | 'cashapp'
    | 'paypal'
    | 'amazon-pay'
    | 'ach'
    | 'wire';
  last4: string;
  description: string;
  invoiceNumber: string;
  kind: TransactionKind;
  keyId?: string;
  projectId?: string;
}

export type TeamRole = 'owner' | 'admin' | 'developer' | 'viewer';
export type TeamInviteStatus = 'active' | 'invited';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  status: TeamInviteStatus;
  createdAt: string;
  lastActiveAt: string | null;
  // Colour seed for avatar gradient — deterministic per-member.
  avatarSeed: number;
}

/**
 * Account-level notification preferences. Per-key low-balance alerts live
 * on `ApiKey.lowBalanceAlert`; those are orthogonal to these account-wide
 * master switches.
 */
export interface NotificationSettings {
  // Product / ops
  weeklyUsageReport: boolean;
  paymentReceipts: boolean;
  invoiceReady: boolean;
  // Health
  spendLimitAlerts: boolean;
  lowBalanceAlertsMaster: boolean; // master switch for per-key alerts
  // Lifecycle
  productUpdates: boolean;
  securityAlerts: boolean; // always recommended on
}

export interface Model {
  id: string;
  label: string;
  description: string;
  perKCalls: number; // USD per 1,000 calls
}

export interface VolumeTier {
  upTo: number; // calls per month upper bound
  discount: number | null; // null = contact sales
  label: string;
}

// ─── Pricing (static) ───────────────────────────────────────────────────────
// We bill per successful MCP tool call — one flat base rate, no model tiers.
// The `MODELS` array is intentionally a single entry so any lingering
// per-model plumbing (UsagePoint.model, CSV export) keeps working while the
// UI surfaces a single "MCP call" dimension.
export const MCP_CALL_RATE_PER_K = 1.0; // USD per 1,000 successful calls
export const MCP_CALL_MODEL_ID = 'mcp-call';

export const MODELS: Model[] = [
  {
    id: MCP_CALL_MODEL_ID,
    label: 'MCP call',
    description: 'Billed per successful MCP tool invocation.',
    perKCalls: MCP_CALL_RATE_PER_K,
  },
];

export const VOLUME_TIERS: VolumeTier[] = [
  { upTo: 100_000, discount: 0, label: '0 – 100K calls' },
  { upTo: 1_000_000, discount: 0.15, label: '100K – 1M calls' },
  { upTo: 10_000_000, discount: 0.3, label: '1M – 10M calls' },
  { upTo: Number.POSITIVE_INFINITY, discount: null, label: '10M+ calls' },
];

// ─── Keys & cache ───────────────────────────────────────────────────────────
// Bump this whenever the shape of anything in STORAGE changes. On mismatch we
// wipe dev-en:* keys (but keep dev-en-auth) so the user keeps their login and
// the seeder re-populates fresh data in the new shape. This is the root fix
// for `$NaN` values caused by old v1 UsagePoint records lacking costCents.
// v3: first-key-only free allowance (30/day + 900 total); subsequent keys
// have freeDailyLimit=0 and freeTotalLimit=0.
// v4: starter-key model. Exactly one key per account is flagged
// `isStarter: true` and carries the lifetime free allowance; every other
// key is paid-only with optional `spendCapCents` and `lowBalanceAlert`
// fields. Old ApiKey records lack these fields → reseed.
const SCHEMA_VERSION = 7;
const SCHEMA_KEY = 'dev-en:schema-version';

const STORAGE = {
  projects: 'dev-en:projects',
  keys: 'dev-en:keys',
  usage: 'dev-en:usage',
  transactions: 'dev-en:transactions',
  spendLimit: 'dev-en:spend-limit',
  paymentMethods: 'dev-en:payment-methods',
  teamMembers: 'dev-en:team-members',
  notifications: 'dev-en:notifications',
};

function migrateIfNeeded() {
  if (!isBrowser()) return;
  try {
    const stored = Number(window.localStorage.getItem(SCHEMA_KEY) ?? '1');
    if (stored === SCHEMA_VERSION) return;
    for (const k of Object.values(STORAGE)) {
      window.localStorage.removeItem(k);
    }
    window.localStorage.setItem(SCHEMA_KEY, String(SCHEMA_VERSION));
  } catch {
    /* ignore storage errors */
  }
}

interface Cache {
  projects: Project[] | null;
  keys: ApiKey[] | null;
  usage: UsagePoint[] | null;
  transactions: Transaction[] | null;
  spendLimit: SpendLimit | null;
  paymentMethods: PaymentMethod[] | null;
  teamMembers: TeamMember[] | null;
  notifications: NotificationSettings | null;
  seeded: boolean;
}

const cache: Cache = {
  projects: null,
  keys: null,
  usage: null,
  transactions: null,
  spendLimit: null,
  paymentMethods: null,
  teamMembers: null,
  notifications: null,
  seeded: false,
};

function isBrowser() {
  return typeof window !== 'undefined';
}

function read<T>(k: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(k);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(k: string, v: T) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* ignore quota errors */
  }
}

// ─── Observable ─────────────────────────────────────────────────────────────
const listeners = new Set<() => void>();
export function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
function notify() {
  listeners.forEach((cb) => cb());
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function uuid(prefix = ''): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const t = Date.now().toString(36);
  return `${prefix}${t}-${rand}`;
}

function randomSecret(env: Environment): string {
  const prefix = env === 'production' ? 'sk_live_' : 'sk_test_';
  const body = Array.from({ length: 32 }, () =>
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[
      Math.floor(Math.random() * 62)
    ],
  ).join('');
  return prefix + body;
}

function randomSlug(): string {
  const body = Array.from({ length: 10 }, () =>
    '0123456789'[Math.floor(Math.random() * 10)],
  ).join('');
  return `mcp-project-${body}`;
}

export function maskSecret(secret: string): string {
  if (secret.length <= 12) return secret;
  return secret.slice(0, 8) + '••••••••••••••••' + secret.slice(-4);
}

export function keyLast4(secret: string): string {
  return '...' + secret.slice(-4);
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Seed ───────────────────────────────────────────────────────────────────
/**
 * Rich demo data — every module should tell a clear story on first login.
 * Under the first-key-only free-tier rule, exactly one key in the seed
 * carries a real allowance; the other six demonstrate every paid state.
 *
 *   Overview: mid-range KPIs, the sole free-tier key surfaces in "most
 *             active", 6-entry recent activity.
 *   Keys: 7 rows covering Free-tier active / Post-paid healthy / low / drained
 *         / awaiting-first-topup / paid-light / revoked.
 *   Usage: 120 days of stacked-per-model data with a spike + weekend trough.
 *   Billing: 28-day chart with visible trend, spend at ~55% of $200 limit,
 *            two saved cards (one expiring next month).
 *   Pricing: monthly volume lands in the "100K – 1M calls" tier.
 *   Recharge history: 4 credit top-ups + 2 card-added events over ~45 days.
 */
function seedIfNeeded() {
  if (!isBrowser() || cache.seeded) return;
  migrateIfNeeded();

  const now = Date.now();
  const today = todayUtc();

  // ── Projects ──
  const existingProjects = read<Project[] | null>(STORAGE.projects, null);
  if (!existingProjects || existingProjects.length === 0) {
    const seeded: Project[] = [
      {
        id: 'proj_production',
        slug: 'mcp-production',
        name: 'Production API',
        createdAt: new Date(now - 92 * 86400000).toISOString(),
      },
      {
        id: 'proj_staging',
        slug: 'mcp-staging',
        name: 'Staging',
        createdAt: new Date(now - 60 * 86400000).toISOString(),
      },
      {
        id: 'proj_internal',
        slug: 'mcp-internal',
        name: 'Internal tools',
        createdAt: new Date(now - 40 * 86400000).toISOString(),
      },
    ];
    write(STORAGE.projects, seeded);
    cache.projects = seeded;
  } else {
    cache.projects = existingProjects;
  }

  // ── Keys ──
  const existingKeys = read<ApiKey[] | null>(STORAGE.keys, null);
  if (!existingKeys || existingKeys.length === 0) {
    // Defaults describe a paid key — no free allowance, no spend cap, no
    // alert. Overrides flip in the starter flag, per-key credits, or cap.
    const mk = (
      overrides: Partial<ApiKey> & Pick<ApiKey, 'name' | 'env' | 'projectId'>,
    ): ApiKey => {
      const secret = randomSecret(overrides.env);
      const defaults: Omit<ApiKey, 'name' | 'env' | 'projectId'> = {
        id: uuid('key_'),
        secret,
        maskedSecret: maskSecret(secret),
        createdAt: new Date(now - 30 * 86400000).toISOString(),
        lastUsedAt: new Date(now - 15 * 60000).toISOString(),
        status: 'active',
        isStarter: false,
        freeDailyLimit: 0,
        freeDailyUsed: 0,
        freeDailyResetAt: today,
        freeTotalLimit: 0,
        freeTotalUsed: 0,
        paidCreditsCents: 0,
        paidCreditsUsedCents: 0,
        spendCapCents: null,
        lowBalanceAlert: null,
      };
      return { ...defaults, ...overrides };
    };

    const seeded: ApiKey[] = [
      // ── STARTER KEY ──────────────────────────────────────────────
      // The one-and-only freebie. Mid-consumption state shows the quota
      // UI in a useful, non-full, non-empty position.
      mk({
        name: 'Starter key',
        env: 'development',
        projectId: 'proj_internal',
        createdAt: new Date(now - 115 * 86400000).toISOString(),
        lastUsedAt: new Date(now - 42 * 60000).toISOString(),
        isStarter: true,
        freeDailyLimit: 30,
        freeDailyUsed: 18, // 60 % of today used
        freeTotalLimit: 900,
        freeTotalUsed: 420, // ~47 % of lifetime used
      }),

      // ── PAID KEYS ────────────────────────────────────────────────
      // 1. Healthy production key with $100 loaded, ~$76 remaining.
      //    Has a $250/mo cap and a $5 low-balance alert configured.
      mk({
        name: 'Web App — Prod',
        env: 'production',
        projectId: 'proj_production',
        createdAt: new Date(now - 85 * 86400000).toISOString(),
        lastUsedAt: new Date(now - 2 * 60000).toISOString(),
        paidCreditsCents: 10000,
        paidCreditsUsedCents: 2380,
        spendCapCents: 25000, // $250/mo cap
        lowBalanceAlert: { enabled: true, thresholdCents: 500 },
      }),
      // 2. Drained — ran out of credits, awaiting refill.
      mk({
        name: 'Mobile — Prod',
        env: 'production',
        projectId: 'proj_production',
        createdAt: new Date(now - 70 * 86400000).toISOString(),
        lastUsedAt: new Date(now - 6 * 3600000).toISOString(),
        paidCreditsCents: 5000,
        paidCreditsUsedCents: 5000,
        lowBalanceAlert: { enabled: true, thresholdCents: 500 },
      }),
      // 3. Low balance — triggers the "Low balance" warning pill.
      mk({
        name: 'Web App — Prod (secondary)',
        env: 'production',
        projectId: 'proj_production',
        createdAt: new Date(now - 45 * 86400000).toISOString(),
        lastUsedAt: new Date(now - 12 * 60000).toISOString(),
        paidCreditsCents: 2500,
        paidCreditsUsedCents: 2120, // $3.80 left
        lowBalanceAlert: { enabled: true, thresholdCents: 500 },
      }),
      // 4. Revoked — kept for audit, greyed out.
      mk({
        name: 'Old demo key',
        env: 'development',
        projectId: 'proj_internal',
        createdAt: new Date(now - 110 * 86400000).toISOString(),
        lastUsedAt: new Date(now - 40 * 86400000).toISOString(),
        status: 'revoked',
      }),
      // 5. Just created, never funded — "Needs credits" CTA state.
      mk({
        name: 'Staging',
        env: 'development',
        projectId: 'proj_staging',
        createdAt: new Date(now - 22 * 86400000).toISOString(),
        lastUsedAt: null,
        paidCreditsCents: 0,
        paidCreditsUsedCents: 0,
      }),
      // 6. Paid-light — small $15 top-up for a load-test suite. No cap,
      //    no alert — represents a developer who just wants it to work.
      mk({
        name: 'Load test',
        env: 'development',
        projectId: 'proj_staging',
        createdAt: new Date(now - 18 * 86400000).toISOString(),
        lastUsedAt: new Date(now - 7 * 60000).toISOString(),
        paidCreditsCents: 1500,
        paidCreditsUsedCents: 450, // $10.50 left
      }),
    ];
    write(STORAGE.keys, seeded);
    cache.keys = seeded;
  } else {
    cache.keys = existingKeys;
  }

  // Safety net — the starter key is conceptually "provisioned with the
  // account", so the account should never exist without one. If we got
  // here with a keys array that somehow lacks a starter (legacy data from
  // before the two-tier refactor, manual localStorage tampering during
  // demo, etc.) we mint a fresh one so the Starter Key zone on the API
  // Keys page isn't mysteriously empty.
  if (!cache.keys.some((k) => k.isStarter)) {
    const starterSecret = randomSecret('development');
    const starter: ApiKey = {
      id: uuid('key_'),
      name: 'Starter key',
      env: 'development',
      projectId: cache.projects?.find((p) => p.id === 'proj_internal')?.id
        ?? cache.projects?.[0]?.id
        ?? 'proj_internal',
      secret: starterSecret,
      maskedSecret: maskSecret(starterSecret),
      createdAt: new Date(now).toISOString(),
      lastUsedAt: null,
      status: 'active',
      isStarter: true,
      freeDailyLimit: 30,
      freeDailyUsed: 0,
      freeDailyResetAt: today,
      freeTotalLimit: 900,
      freeTotalUsed: 0,
      paidCreditsCents: 0,
      paidCreditsUsedCents: 0,
      spendCapCents: null,
      lowBalanceAlert: null,
    };
    cache.keys = [starter, ...cache.keys];
    write(STORAGE.keys, cache.keys);
  }

  // ── Usage (120 days × keys × models) ──
  const existingUsage = read<UsagePoint[] | null>(STORAGE.usage, null);
  if (!existingUsage || existingUsage.length === 0) {
    // Volume target: ~110K calls/month landing solidly in the 100K–1M tier.
    // Per-key weekday traffic rate (average calls across all models).
    // Keys not listed here → no historical traffic (e.g. revoked, or the
    // freshly-created "Staging" key that still awaits its first top-up and
    // therefore has never served a request).
    const perKeyDailyBase: Record<string, number> = {
      'Web App — Prod': 2200,
      'Web App — Prod (secondary)': 900,
      'Mobile — Prod': 1400,
      'Load test': 320,
      // Starter key: light experimentation usage, cumulative total ≈ 420
      // calls over 120 days matches `freeTotalUsed` on the seed entry.
      'Starter key': 4,
    };
    const points: UsagePoint[] = [];
    const todayDate = new Date();
    todayDate.setUTCHours(0, 0, 0, 0);

    // 120 days of history (covers the 90-day Usage window + padding).
    for (let i = 119; i >= 0; i--) {
      const d = new Date(todayDate.getTime() - i * 86400000);
      const date = d.toISOString().slice(0, 10);
      const dow = d.getUTCDay();
      const weekend = dow === 0 || dow === 6;
      // One-time spike ~10 days ago — visible on the 28-day Billing chart.
      const spike = i === 10 ? 2.6 : 1;
      // Gentle recent-month ramp so there's a visible trend on the 90-day view.
      const ramp = i < 30 ? 1 : i < 60 ? 0.85 : i < 90 ? 0.7 : 0.55;
      const dayMult = (weekend ? 0.35 : 1) * spike * ramp;

      for (const key of cache.keys!) {
        if (key.status === 'revoked' || key.status === 'paused') continue;
        const base = perKeyDailyBase[key.name];
        if (!base) continue;
        // +-18% per-day noise
        const dailyNoise = 0.82 + Math.random() * 0.36;
        const keyDailyTotal = base * dayMult * dailyNoise;

        const calls = Math.round(keyDailyTotal);
        if (calls <= 0) continue;
        const grossCents = Math.round((calls / 1000) * MCP_CALL_RATE_PER_K * 100);
        const savingsCents =
          key.env === 'production' ? Math.round(grossCents * 0.12) : 0;
        points.push({
          date,
          keyId: key.id,
          model: MCP_CALL_MODEL_ID,
          calls,
          costCents: grossCents - savingsCents,
          savingsCents,
        });
      }
    }
    write(STORAGE.usage, points);
    cache.usage = points;
  } else {
    cache.usage = existingUsage;
  }

  // ── Spend limit ──
  const existingLimit = read<SpendLimit | null>(STORAGE.spendLimit, null);
  if (!existingLimit) {
    const seeded: SpendLimit = {
      // $200 default lets the demo's ~$90-110/mo spend land at ~50% used
      // (meaningful amber zone for the Overview KPI and Billing chart).
      monthlyCapCents: 200_00,
      resetDay: 1,
      warnAtPercents: [50, 75, 90],
    };
    write(STORAGE.spendLimit, seeded);
    cache.spendLimit = seeded;
  } else {
    cache.spendLimit = existingLimit;
  }

  // ── Payment methods ──
  const existingPm = read<PaymentMethod[] | null>(STORAGE.paymentMethods, null);
  if (!existingPm) {
    // One default card, one expiring next month (triggers "Expiring soon" pill).
    const nowDate = new Date();
    const nextMonth = new Date(nowDate.getFullYear(), nowDate.getMonth() + 1, 1);
    const seeded: PaymentMethod[] = [
      {
        id: 'pm_seed_visa',
        brand: 'visa',
        last4: '4242',
        expMonth: 12,
        expYear: nowDate.getFullYear() + 2,
        name: 'Alex Developer',
        isDefault: true,
        createdAt: new Date(now - 44 * 86400000).toISOString(),
      },
      {
        id: 'pm_seed_mc',
        brand: 'mastercard',
        last4: '8210',
        expMonth: nextMonth.getMonth() + 1, // 1-indexed
        expYear: nextMonth.getFullYear(),
        name: 'Alex Developer',
        isDefault: false,
        createdAt: new Date(now - 22 * 86400000).toISOString(),
      },
    ];
    write(STORAGE.paymentMethods, seeded);
    cache.paymentMethods = seeded;
  } else {
    cache.paymentMethods = existingPm;
  }

  // ── Transactions (realistic 45-day timeline) ──
  const existingTxn = read<Transaction[] | null>(STORAGE.transactions, null);
  if (!existingTxn) {
    const keyByName = new Map(cache.keys!.map((k) => [k.name, k]));
    const prodMain = keyByName.get('Web App — Prod');
    const prodSecondary = keyByName.get('Web App — Prod (secondary)');
    const prodMobile = keyByName.get('Mobile — Prod');

    const mkTxn = (o: Omit<Transaction, 'id' | 'invoiceNumber'>): Transaction => ({
      ...o,
      id: uuid('txn_'),
      invoiceNumber: 'INV-' + (10000 + Math.floor(Math.random() * 89999)),
    });

    const seeded: Transaction[] = [
      // newest first
      mkTxn({
        createdAt: new Date(now - 1 * 86400000).toISOString(),
        amountCents: 1000,
        status: 'succeeded',
        method: 'apple-pay',
        last4: '•••',
        description: `Credits added to ${prodSecondary?.name ?? 'key'}`,
        kind: 'credit-topup',
        keyId: prodSecondary?.id,
        projectId: prodSecondary?.projectId,
      }),
      mkTxn({
        createdAt: new Date(now - 6 * 86400000).toISOString(),
        amountCents: 5000,
        status: 'succeeded',
        method: 'card',
        last4: '4242',
        description: `Credits added to ${prodMain?.name ?? 'key'}`,
        kind: 'credit-topup',
        keyId: prodMain?.id,
        projectId: prodMain?.projectId,
      }),
      mkTxn({
        createdAt: new Date(now - 10 * 86400000).toISOString(),
        amountCents: 2000,
        status: 'succeeded',
        method: 'cashapp',
        last4: 'cash',
        description: `Cash App Pay · Credits added to ${prodMobile?.name ?? 'key'}`,
        kind: 'credit-topup',
        keyId: prodMobile?.id,
        projectId: prodMobile?.projectId,
      }),
      mkTxn({
        createdAt: new Date(now - 14 * 86400000).toISOString(),
        amountCents: 2500,
        status: 'succeeded',
        method: 'link',
        last4: '•••',
        description: `Credits added to ${prodMobile?.name ?? 'key'}`,
        kind: 'credit-topup',
        keyId: prodMobile?.id,
        projectId: prodMobile?.projectId,
      }),
      mkTxn({
        createdAt: new Date(now - 18 * 86400000).toISOString(),
        amountCents: 3000,
        status: 'succeeded',
        method: 'paypal',
        last4: 'ppal',
        description: `PayPal · Credits added to ${prodSecondary?.name ?? 'key'}`,
        kind: 'credit-topup',
        keyId: prodSecondary?.id,
        projectId: prodSecondary?.projectId,
      }),
      mkTxn({
        createdAt: new Date(now - 22 * 86400000).toISOString(),
        amountCents: 0,
        status: 'succeeded',
        method: 'card',
        last4: '8210',
        description: 'Mastercard •••• 8210 added',
        kind: 'card-added',
      }),
      mkTxn({
        createdAt: new Date(now - 30 * 86400000).toISOString(),
        amountCents: 5000,
        status: 'succeeded',
        method: 'card',
        last4: '4242',
        description: `Credits added to ${prodMain?.name ?? 'key'}`,
        kind: 'credit-topup',
        keyId: prodMain?.id,
        projectId: prodMain?.projectId,
      }),
      mkTxn({
        createdAt: new Date(now - 44 * 86400000).toISOString(),
        amountCents: 0,
        status: 'succeeded',
        method: 'card',
        last4: '4242',
        description: 'Visa •••• 4242 added',
        kind: 'card-added',
      }),
    ];
    write(STORAGE.transactions, seeded);
    cache.transactions = seeded;
  } else {
    cache.transactions = existingTxn;
  }

  // ── Team members ──
  const existingTeam = read<TeamMember[] | null>(STORAGE.teamMembers, null);
  if (!existingTeam) {
    const seeded: TeamMember[] = [
      {
        id: 'tm_owner',
        name: 'You (Owner)',
        email: 'you@example.dev',
        role: 'owner',
        status: 'active',
        createdAt: new Date(now - 180 * 86400000).toISOString(),
        lastActiveAt: new Date(now - 2 * 60000).toISOString(),
        avatarSeed: 12,
      },
      {
        id: 'tm_alex',
        name: 'Alex Rivera',
        email: 'alex.rivera@gmail.com',
        role: 'admin',
        status: 'active',
        createdAt: new Date(now - 90 * 86400000).toISOString(),
        lastActiveAt: new Date(now - 3 * 3600000).toISOString(),
        avatarSeed: 5,
      },
      {
        id: 'tm_jordan',
        name: 'Jordan Lee',
        email: 'jordan.lee@users.noreply.github.com',
        role: 'developer',
        status: 'active',
        createdAt: new Date(now - 45 * 86400000).toISOString(),
        lastActiveAt: new Date(now - 18 * 3600000).toISOString(),
        avatarSeed: 19,
      },
      {
        id: 'tm_priya',
        name: 'Priya Patel',
        email: 'priya@example.com',
        role: 'viewer',
        status: 'invited',
        createdAt: new Date(now - 2 * 86400000).toISOString(),
        lastActiveAt: null,
        avatarSeed: 27,
      },
    ];
    write(STORAGE.teamMembers, seeded);
    cache.teamMembers = seeded;
  } else {
    cache.teamMembers = existingTeam;
  }

  // ── Notification settings ──
  const existingNotif = read<NotificationSettings | null>(STORAGE.notifications, null);
  if (!existingNotif) {
    const seeded: NotificationSettings = {
      weeklyUsageReport: true,
      paymentReceipts: true,
      invoiceReady: true,
      spendLimitAlerts: true,
      lowBalanceAlertsMaster: true,
      productUpdates: false,
      securityAlerts: true,
    };
    write(STORAGE.notifications, seeded);
    cache.notifications = seeded;
  } else {
    cache.notifications = existingNotif;
  }

  cache.seeded = true;
}

// ─── Readers ────────────────────────────────────────────────────────────────
export function listProjects(): Project[] {
  seedIfNeeded();
  return cache.projects ?? [];
}

export function listKeys(): ApiKey[] {
  seedIfNeeded();
  return cache.keys ?? [];
}

export function getKey(id: string): ApiKey | undefined {
  return listKeys().find((k) => k.id === id);
}

export function getUsage(): UsagePoint[] {
  seedIfNeeded();
  return cache.usage ?? [];
}

export function getTransactions(): Transaction[] {
  seedIfNeeded();
  return cache.transactions ?? [];
}

export function getSpendLimit(): SpendLimit {
  seedIfNeeded();
  return cache.spendLimit!;
}

export function listPaymentMethods(): PaymentMethod[] {
  seedIfNeeded();
  return cache.paymentMethods ?? [];
}

export function getDefaultPaymentMethod(): PaymentMethod | undefined {
  return listPaymentMethods().find((p) => p.isDefault);
}

export function listTeamMembers(): TeamMember[] {
  seedIfNeeded();
  return cache.teamMembers ?? [];
}

export function inviteTeamMember(input: {
  email: string;
  role: TeamRole;
  name?: string;
}): TeamMember {
  seedIfNeeded();
  const existing = (cache.teamMembers ?? []).find(
    (m) => m.email.toLowerCase() === input.email.toLowerCase(),
  );
  if (existing) return existing;
  const member: TeamMember = {
    id: uuid('tm_'),
    name: input.name?.trim() || input.email.split('@')[0],
    email: input.email,
    role: input.role,
    status: 'invited',
    createdAt: new Date().toISOString(),
    lastActiveAt: null,
    avatarSeed: Math.floor(Math.random() * 100),
  };
  cache.teamMembers = [...(cache.teamMembers ?? []), member];
  write(STORAGE.teamMembers, cache.teamMembers);
  notify();
  return member;
}

export function updateTeamMemberRole(id: string, role: TeamRole): void {
  seedIfNeeded();
  cache.teamMembers = (cache.teamMembers ?? []).map((m) =>
    m.id === id && m.role !== 'owner' ? { ...m, role } : m,
  );
  write(STORAGE.teamMembers, cache.teamMembers);
  notify();
}

export function removeTeamMember(id: string): void {
  seedIfNeeded();
  cache.teamMembers = (cache.teamMembers ?? []).filter(
    (m) => !(m.id === id && m.role !== 'owner'),
  );
  write(STORAGE.teamMembers, cache.teamMembers);
  notify();
}

export function resendTeamInvite(id: string): void {
  seedIfNeeded();
  // Mock: just bump createdAt so the UI shows "Invited just now"
  cache.teamMembers = (cache.teamMembers ?? []).map((m) =>
    m.id === id ? { ...m, createdAt: new Date().toISOString() } : m,
  );
  write(STORAGE.teamMembers, cache.teamMembers);
  notify();
}

export function getNotificationSettings(): NotificationSettings {
  seedIfNeeded();
  return cache.notifications!;
}

export function updateNotificationSettings(
  patch: Partial<NotificationSettings>,
): NotificationSettings {
  seedIfNeeded();
  const next = { ...cache.notifications!, ...patch };
  cache.notifications = next;
  write(STORAGE.notifications, next);
  notify();
  return next;
}

// ─── Derived helpers ────────────────────────────────────────────────────────
/**
 * Classify a key's current billing state. Used across the UI to decide
 * which badges, CTAs, and progress bars to show.
 */
export function getBillingTier(k: ApiKey): BillingTier {
  if (k.status === 'revoked') return 'revoked';
  if (k.status === 'paused') return 'paused';
  if (k.isStarter) {
    return k.freeTotalUsed >= k.freeTotalLimit ? 'starter-exhausted' : 'starter';
  }
  const balance = k.paidCreditsCents - k.paidCreditsUsedCents;
  return balance > 0 ? 'paid-active' : 'needs-credits';
}

/** True if this key is the account's starter/freebie key. */
export function isStarterKey(k: ApiKey): boolean {
  return k.isStarter === true;
}

/** Backwards-compatible alias used by older call sites. */
export function hasFreeAllowance(k: ApiKey): boolean {
  return k.isStarter === true && k.freeTotalLimit > 0;
}

/** Remaining balance in cents for a paid key (0 for revoked).
 *  Starter keys start at $0 and, once topped up, behave like paid keys —
 *  their balance is tracked the same way. */
export function getKeyBalanceCents(k: ApiKey): number {
  if (k.status === 'revoked') return 0;
  return Math.max(0, k.paidCreditsCents - k.paidCreditsUsedCents);
}

/** True if the Starter key has been topped up with credits, which lifts
 *  its daily trial cap and makes it behave like a paid key on top of the
 *  original lifetime free allowance. */
export function isStarterUpgraded(k: ApiKey): boolean {
  return k.isStarter === true && k.paidCreditsCents > 0;
}

/**
 * True if the key is currently eligible to serve traffic — not revoked,
 * and (for starter) still has lifetime allowance, or (for paid) has a
 * positive credit balance.
 */
export function isKeyServing(k: ApiKey): boolean {
  if (k.status === 'revoked' || k.status === 'paused') return false;
  if (k.isStarter) return k.freeTotalUsed < k.freeTotalLimit;
  return getKeyBalanceCents(k) > 0;
}

/**
 * True if a paid key's alert is configured AND its remaining balance has
 * fallen to/below the alert threshold. Returns false for starter / revoked
 * / no-alert-configured / healthy keys.
 */
export function isLowBalance(k: ApiKey): boolean {
  if (k.isStarter || k.status === 'revoked') return false;
  if (!k.lowBalanceAlert || !k.lowBalanceAlert.enabled) return false;
  const balance = getKeyBalanceCents(k);
  // Only surface as low if there's still SOME balance — a $0 balance is
  // "needs credits", a stronger state which takes precedence.
  return balance > 0 && balance <= k.lowBalanceAlert.thresholdCents;
}

/**
 * Memoised derivations off `cache.keys`. `useSyncExternalStore` requires a
 * stable reference between mutations, so we cannot recompute `.filter()` /
 * `.find()` on every read — React would treat each call as new data and
 * hit "Maximum update depth exceeded" / "getSnapshot should be cached".
 *
 * Both slots are keyed off the identity of the `cache.keys` array we last
 * saw; since every mutation creates a new array, a reference mismatch is a
 * reliable trigger for invalidation.
 */
const derivedCache: {
  keysRef: ApiKey[] | null;
  starter: ApiKey | undefined;
  paid: ApiKey[];
} = {
  keysRef: null,
  starter: undefined,
  paid: [],
};

function ensureDerivedCache(): void {
  const all = listKeys();
  if (derivedCache.keysRef === all) return;
  derivedCache.keysRef = all;
  derivedCache.starter = all.find((k) => k.isStarter);
  derivedCache.paid = all.filter((k) => !k.isStarter);
}

/** Returns the account's starter key, or undefined if somehow missing. */
export function getStarterKey(): ApiKey | undefined {
  ensureDerivedCache();
  return derivedCache.starter;
}

/**
 * All non-starter keys, regardless of status (including revoked). Callers
 * that want only billable, active paid keys should filter further.
 */
export function listPaidKeys(): ApiKey[] {
  ensureDerivedCache();
  return derivedCache.paid;
}

export interface KeyUsageSummary {
  calls: number;
  costCents: number;
  savingsCents: number;
}

export function getKeyUsageSummary(keyId: string): KeyUsageSummary {
  const points = getUsage().filter((p) => p.keyId === keyId);
  return {
    calls: points.reduce((acc, p) => acc + (p.calls ?? 0), 0),
    costCents: points.reduce((acc, p) => acc + (p.costCents ?? 0), 0),
    savingsCents: points.reduce((acc, p) => acc + (p.savingsCents ?? 0), 0),
  };
}

/** Rolling window (UTC calendar days) used for credit runway / burn estimates. */
export const KEY_BURN_WINDOW_DAYS = 28;

/**
 * Net spend (after volume discounts) for one key in the last `windowDays` UTC
 * days. Smoothed daily burn = netCents / windowDays.
 */
export function getKeyNetBurnLastDays(
  keyId: string,
  windowDays: number,
): { netCents: number; calls: number; daysWithUsage: number } {
  seedIfNeeded();
  const usage = getUsage().filter((p) => p.keyId === keyId);
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - windowDays);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  const recent = usage.filter((p) => p.date >= cutoffStr);
  let netCents = 0;
  let calls = 0;
  const daySet = new Set<string>();
  for (const p of recent) {
    netCents += (p.costCents ?? 0) - (p.savingsCents ?? 0);
    calls += p.calls ?? 0;
    if ((p.calls ?? 0) > 0 || (p.costCents ?? 0) > 0) daySet.add(p.date);
  }
  return { netCents, calls, daysWithUsage: daySet.size };
}

export interface KeyCreditRunwayEstimate {
  windowDays: number;
  avgDailyNetCents: number;
  balanceAfterCents: number;
  estimatedDays: number | null;
  estimatedCallsAtPace: number | null;
  confidence: 'high' | 'low' | 'none';
}

/**
 * How long `balanceAfterCents` might last given this key's recent burn rate.
 * Uses smoothed daily net spend over {@link KEY_BURN_WINDOW_DAYS}. When there
 * is no meaningful spend in the window, `estimatedDays` is null.
 */
export function estimateKeyCreditRunway(
  keyId: string,
  additionalCents: number,
): KeyCreditRunwayEstimate {
  const windowDays = KEY_BURN_WINDOW_DAYS;
  const { netCents, calls, daysWithUsage } = getKeyNetBurnLastDays(
    keyId,
    windowDays,
  );
  const key = getKey(keyId);
  const remaining = key
    ? Math.max(0, key.paidCreditsCents - key.paidCreditsUsedCents)
    : 0;
  const balanceAfterCents = remaining + Math.max(0, additionalCents);

  const avgDailyNetCents = netCents / windowDays;

  let estimatedDays: number | null = null;
  if (avgDailyNetCents >= 1) {
    estimatedDays = balanceAfterCents / avgDailyNetCents;
  }

  let estimatedCallsAtPace: number | null = null;
  if (calls > 0 && netCents > 0) {
    const avgNetPerCall = netCents / calls;
    if (avgNetPerCall >= 0.01) {
      estimatedCallsAtPace = Math.floor(balanceAfterCents / avgNetPerCall);
    }
  }

  let confidence: 'high' | 'low' | 'none' = 'none';
  if (avgDailyNetCents >= 1) {
    confidence = daysWithUsage >= 10 ? 'high' : 'low';
  }

  return {
    windowDays,
    avgDailyNetCents,
    balanceAfterCents,
    estimatedDays,
    estimatedCallsAtPace,
    confidence,
  };
}

export function getAccountCallsThisMonth(): number {
  const yyyymm = new Date().toISOString().slice(0, 7);
  return getUsage()
    .filter((p) => p.date?.startsWith(yyyymm))
    .reduce((acc, p) => acc + (p.calls ?? 0), 0);
}

export function getAccountSpendThisMonthCents(): number {
  const yyyymm = new Date().toISOString().slice(0, 7);
  return getUsage()
    .filter((p) => p.date?.startsWith(yyyymm))
    .reduce((acc, p) => acc + (p.costCents ?? 0), 0);
}

export function getAccountSavingsThisMonthCents(): number {
  const yyyymm = new Date().toISOString().slice(0, 7);
  return getUsage()
    .filter((p) => p.date?.startsWith(yyyymm))
    .reduce((acc, p) => acc + (p.savingsCents ?? 0), 0);
}

export function getCurrentVolumeTier(): VolumeTier {
  const calls = getAccountCallsThisMonth();
  for (const t of VOLUME_TIERS) {
    if (calls <= t.upTo) return t;
  }
  return VOLUME_TIERS[VOLUME_TIERS.length - 1];
}

// ─── Mutations ──────────────────────────────────────────────────────────────
export function addProject(name: string): Project {
  seedIfNeeded();
  const next: Project = {
    id: uuid('proj_'),
    slug: randomSlug(),
    name: name.trim() || 'Untitled project',
    createdAt: new Date().toISOString(),
  };
  const list = [...(cache.projects ?? []), next];
  cache.projects = list;
  write(STORAGE.projects, list);
  notify();
  return next;
}

/**
 * Create a paid key. Paid keys are inactive (cannot serve traffic) until
 * funded with credits — the UI should prompt the user to top up immediately
 * after creation. The starter key is created automatically by the seeder
 * and can never be created via this function.
 */
export function createKey(name: string, env: Environment, projectId: string): ApiKey {
  seedIfNeeded();
  const secret = randomSecret(env);
  const today = todayUtc();
  const newKey: ApiKey = {
    id: uuid('key_'),
    name: name.trim() || 'Untitled key',
    env,
    projectId,
    secret,
    maskedSecret: maskSecret(secret),
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
    status: 'active',
    isStarter: false,
    freeDailyLimit: 0,
    freeDailyUsed: 0,
    freeDailyResetAt: today,
    freeTotalLimit: 0,
    freeTotalUsed: 0,
    paidCreditsCents: 0,
    paidCreditsUsedCents: 0,
    spendCapCents: null,
    lowBalanceAlert: null,
  };
  const next = [newKey, ...(cache.keys ?? [])];
  cache.keys = next;
  write(STORAGE.keys, next);
  notify();
  return newKey;
}

export function renameKey(id: string, name: string): void {
  seedIfNeeded();
  const next = (cache.keys ?? []).map((k) =>
    k.id === id ? { ...k, name: name.trim() || k.name } : k,
  );
  cache.keys = next;
  write(STORAGE.keys, next);
  notify();
}

/**
 * Rotating a key issues a new secret while preserving its id, usage history
 * and (for paid keys) credit balance. Works for both the starter and paid
 * keys — callers that need to prevent starter rotation should gate the UI.
 */
export function rotateKeySecret(id: string): ApiKey | undefined {
  seedIfNeeded();
  let updated: ApiKey | undefined;
  const next = (cache.keys ?? []).map((k) => {
    if (k.id !== id) return k;
    const secret = randomSecret(k.env);
    updated = { ...k, secret, maskedSecret: maskSecret(secret) };
    return updated;
  });
  cache.keys = next;
  write(STORAGE.keys, next);
  notify();
  return updated;
}

/**
 * Update a paid key's optional per-key settings. Passing `undefined` leaves
 * a field untouched; passing `null` for `spendCapCents` / `lowBalanceAlert`
 * clears it. No-ops on the starter key.
 */
export function updateKeySettings(
  id: string,
  patch: {
    spendCapCents?: number | null;
    lowBalanceAlert?: LowBalanceAlert | null;
  },
): void {
  seedIfNeeded();
  const next = (cache.keys ?? []).map((k) => {
    if (k.id !== id) return k;
    if (k.isStarter) return k;
    return {
      ...k,
      ...(patch.spendCapCents !== undefined
        ? { spendCapCents: patch.spendCapCents }
        : {}),
      ...(patch.lowBalanceAlert !== undefined
        ? { lowBalanceAlert: patch.lowBalanceAlert }
        : {}),
    };
  });
  cache.keys = next;
  write(STORAGE.keys, next);
  notify();
}

/**
 * Revoke (soft-delete) a key. Refuses to revoke the starter key — it's a
 * permanent fixture of the account.
 */
export function revokeKey(id: string): void {
  seedIfNeeded();
  const next = (cache.keys ?? []).map((k) =>
    k.id === id && !k.isStarter ? { ...k, status: 'revoked' as const } : k,
  );
  cache.keys = next;
  write(STORAGE.keys, next);
  notify();
}

/**
 * Pause / resume a paid key. Paused keys stop serving traffic but keep
 * their secret intact, so flipping back to active instantly re-enables
 * them — unlike {@link revokeKey}, which is terminal. Refuses to act on
 * the starter key and on keys that are already revoked.
 */
export function setKeyPaused(id: string, paused: boolean): void {
  seedIfNeeded();
  const next = (cache.keys ?? []).map((k) => {
    if (k.id !== id || k.isStarter) return k;
    if (k.status === 'revoked') return k;
    return { ...k, status: (paused ? 'paused' : 'active') as 'paused' | 'active' };
  });
  cache.keys = next;
  write(STORAGE.keys, next);
  notify();
}

/**
 * Hard-delete a key. Also refuses the starter key. Used by the admin UI
 * for permanently removing already-revoked keys.
 */
export function deleteKey(id: string): void {
  seedIfNeeded();
  const next = (cache.keys ?? []).filter((k) => !(k.id === id && !k.isStarter));
  cache.keys = next;
  write(STORAGE.keys, next);
  notify();
}

/**
 * Add credits to a key. Works for both paid keys and the Starter key —
 * funding the Starter key lifts its daily trial cap while preserving the
 * original lifetime free allowance on top of the purchased credits.
 * Returns the updated key, or undefined if the id wasn't found.
 */
export function addKeyCreditsCents(id: string, amountCents: number): ApiKey | undefined {
  seedIfNeeded();
  let updated: ApiKey | undefined;
  const next = (cache.keys ?? []).map((k) => {
    if (k.id !== id) return k;
    updated = {
      ...k,
      paidCreditsCents: k.paidCreditsCents + amountCents,
    };
    return updated;
  });
  cache.keys = next;
  write(STORAGE.keys, next);
  notify();
  return updated;
}

export function setSpendLimitCents(monthlyCapCents: number, warnAtPercents?: number[]): void {
  seedIfNeeded();
  const current = cache.spendLimit!;
  const next: SpendLimit = {
    ...current,
    monthlyCapCents: Math.max(0, Math.round(monthlyCapCents)),
    warnAtPercents: warnAtPercents ?? current.warnAtPercents,
  };
  cache.spendLimit = next;
  write(STORAGE.spendLimit, next);
  notify();
}

export function addPaymentMethod(input: {
  brand: CardBrand;
  last4: string;
  expMonth: number;
  expYear: number;
  name: string;
  makeDefault?: boolean;
}): PaymentMethod {
  seedIfNeeded();
  const pm: PaymentMethod = {
    id: uuid('pm_'),
    brand: input.brand,
    last4: input.last4,
    expMonth: input.expMonth,
    expYear: input.expYear,
    name: input.name,
    isDefault: input.makeDefault ?? (cache.paymentMethods?.length ?? 0) === 0,
    createdAt: new Date().toISOString(),
  };
  let list = [...(cache.paymentMethods ?? [])];
  if (pm.isDefault) {
    list = list.map((x) => ({ ...x, isDefault: false }));
  }
  list.push(pm);
  cache.paymentMethods = list;
  write(STORAGE.paymentMethods, list);
  notify();
  return pm;
}

export function removePaymentMethod(id: string): void {
  seedIfNeeded();
  let list = (cache.paymentMethods ?? []).filter((p) => p.id !== id);
  // if we removed the default, promote the first remaining
  if (list.length > 0 && !list.some((p) => p.isDefault)) {
    list = list.map((p, i) => ({ ...p, isDefault: i === 0 }));
  }
  cache.paymentMethods = list;
  write(STORAGE.paymentMethods, list);
  notify();
}

export function setDefaultPaymentMethod(id: string): void {
  seedIfNeeded();
  const list = (cache.paymentMethods ?? []).map((p) => ({
    ...p,
    isDefault: p.id === id,
  }));
  cache.paymentMethods = list;
  write(STORAGE.paymentMethods, list);
  notify();
}

export function addTransaction(
  t: Omit<Transaction, 'id' | 'createdAt' | 'invoiceNumber'>,
): Transaction {
  seedIfNeeded();
  const newT: Transaction = {
    ...t,
    id: uuid('txn_'),
    createdAt: new Date().toISOString(),
    invoiceNumber: 'INV-' + (10000 + Math.floor(Math.random() * 89999)),
  };
  const next = [newT, ...(cache.transactions ?? [])];
  cache.transactions = next;
  write(STORAGE.transactions, next);
  notify();
  return newT;
}

// ─── Formatters ─────────────────────────────────────────────────────────────
export function formatCents(cents: number, currency = 'USD'): string {
  const safe = Number.isFinite(cents) ? cents : 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(safe / 100);
}

export function formatUsd(dollars: number): string {
  const safe = Number.isFinite(dollars) ? dollars : 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(safe);
}

export function formatCallRate(perKCalls: number): string {
  return `${formatUsd(perKCalls)} / 1K calls`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}
