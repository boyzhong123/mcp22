'use client';

/**
 * Fully client-side, localStorage-backed mock data store for the English
 * developer preview. No network calls, no API keys are real — everything
 * resets when the user clears site data.
 *
 * Billing model (account wallet, evaluation points):
 *
 *   ACCOUNT WALLET — single source of truth for paid credit. Top-ups grow
 *   `paidEvaluationPoints`; consumption grows `usedEvaluationPoints`. All
 *   keys on the account share this pool. The payment amount is retained only
 *   for receipts and reconciliation; the product balance is evaluation points.
 *
 *   TRIAL ALLOWANCE — every new account is granted a fixed call package,
 *   free of charge, valid for a limited time window after signup. Trial is
 *   consumed first; once the package expires or is exhausted the account
 *   falls back to wallet credit (and stops serving once that too is empty).
 *
 *   ACCOUNT LOW-BALANCE ALERT — single account-level toggle that emails
 *   when the wallet balance drops below a configured threshold.
 *
 *   API KEYS — Lightweight access tokens that all draw from the account
 *   wallet. The first key on an account is flagged `isStarter: true` and
 *   is provisioned automatically at signup; it has no special billing
 *   behaviour (no per-key free allowance) and cannot be deleted. Optional
 *   per-key safety nets:
 *     - `monthlyPointCap`: monthly evaluation-point cap (null = uncapped)
 *     - `monthlyCallCap`: monthly call-count cap (null = uncapped)
 *
 *   Account-level state also covers the global monthly point limit (cross-
 *   key safety net) and saved payment methods.
 *
 * An in-memory cache + observable pattern powers `useSyncExternalStore`
 * consumers without violating React 19's strict set-state-in-effect rule.
 */

// ─── Types ──────────────────────────────────────────────────────────────────
export type Environment = 'development' | 'production';
/**
 *  - `starter`: legacy label for a freebie that still has allowance.
 *  - `starter-exhausted`: legacy label for an exhausted/expired freebie.
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

export interface ApiKey {
  id: string;
  name: string;
  env: Environment;
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
   * True for the account's first / default key, provisioned at signup.
   * Cannot be deleted (though it *can* be rotated — same id, new secret).
   * Carries no special billing behaviour in the account-wallet model.
   */
  isStarter: boolean;
  /**
   * User-pinned to the top of the API Keys list. Optional — defaults
   * to false for legacy snapshots.
   */
  pinned?: boolean;
  /** Optional monthly evaluation-point cap (per-key safety net). */
  monthlyPointCap: number | null;
  /**
   * Optional monthly call-count cap (per-key safety net). `null` = uncapped.
   * When the key's calls in the current month hit this cap, it stops
   * serving traffic until the next billing cycle or the cap is raised.
   */
  monthlyCallCap: number | null;
  /**
   * Optional daily evaluation-point cap for this key; `null` = uncapped.
   * Resets at midnight UTC.
   */
  dailyPointCap?: number | null;
  /**
   * Optional daily call-count cap for this key; `null` = uncapped.
   * Resets at midnight UTC.
   */
  dailyCallCap?: number | null;

  // ─── Legacy fields (account-wallet model deprecates these) ─────────────
  // Preserved so the bridge and a few historical helpers keep compiling.
  // - `freeDaily*` / `freeTotal*` were mirrored from the old account
  //   TrialAllowance shape. The current trial has no daily cap; these stay
  //   zeroed for old bridge/UI compatibility.
  // - `paidCredits*` are no longer used (account wallet replaces them).
  // - `lowBalanceAlert` was per-key; it now lives on AccountLowBalanceAlert.
  /** @deprecated Mirrored from account trial on starter key only. */
  freeDailyLimit: number;
  /** @deprecated Mirrored from account trial on starter key only. */
  freeDailyUsed: number;
  /** @deprecated Mirrored from account trial on starter key only. */
  freeDailyResetAt: string;
  /** @deprecated Mirrored from account trial on starter key only. */
  freeTotalLimit: number;
  /** @deprecated Mirrored from account trial on starter key only. */
  freeTotalUsed: number;
  /** @deprecated Replaced by AccountWallet. */
  paidCreditsCents: number;
  /** @deprecated Replaced by AccountWallet. */
  paidCreditsUsedCents: number;
  /** @deprecated Replaced by AccountLowBalanceAlert. */
  lowBalanceAlert: LowBalanceAlert | null;
}

/**
 * Account-level wallet — the single source of paid credit on the account.
 * Top-ups grow `paidCreditsCents`; usage grows `paidCreditsUsedCents`.
 * Remaining balance is the simple difference.
 */
export interface AccountWallet {
  /** Canonical user-facing balance model. These fields come from the billing API. */
  paidEvaluationPoints: number;
  usedEvaluationPoints: number;
  /**
   * Authoritative current balance from `GET /billing/summary`
   * (`evaluation_points_balance`, signup bonus included). When present it
   * overrides any locally derived figure — batch sums are display-only.
   */
  balanceEvaluationPoints?: number;
  /** Paid-only remainder (summary.paid_points_remaining). */
  paidPointsRemaining?: number;
  /** Signup-bonus remainder (summary.signup_bonus_remaining). */
  signupBonusRemaining?: number;
  /** Lifetime expired total (summary.evaluation_points_expired_total). */
  expiredEvaluationPoints?: number;
  /**
   * Compatibility mirrors for legacy spend/runway code. Do not use these for
   * new UI or API contracts — points above are the source of truth.
   */
  paidCreditsCents: number;
  paidCreditsUsedCents: number;
}

/**
 * Account-level free trial. Granted on signup and consumed before wallet
 * credit. The package is valid until `expiresAt`; once the total call count
 * is exhausted or the expiry time passes, the account must top up to keep
 * serving traffic.
 */
export interface TrialAllowance {
  totalLimit: number;
  totalUsed: number;
  grantedAt: string;
  expiresAt: string;
}

/** Starter trial seed defaults. Easy to tune in one place. */
export const TRIAL_DEFAULT_TOTAL = 600;
export const TRIAL_DEFAULT_VALID_DAYS = 30;

/**
 * Single account-level low-balance email alert. The previous per-key
 * version has been retired; one threshold across the wallet is plenty.
 */
export interface AccountLowBalanceAlert {
  enabled: boolean;
  /** Product alert threshold. Money is only retained for payment reconciliation. */
  thresholdPoints: number;
}

/**
 * One CoreType bucket in a day×key usage record. CoreTypes are dynamic and
 * case-sensitive — `coreType` is the stable grouping key, `displayName` is
 * display-only. Never hardcode business categories off this list.
 */
export interface UsageCoreTypeBreakdown {
  coreType: string;
  displayName: string;
  /** Server-provided display category, when available. */
  category?: string | null;
  /** Server-provided language code (`zh` or `en`), when available. */
  language?: string | null;
  calls: number;
  events: number;
  /** Actually deducted points. */
  evaluationPoints: number;
  /** Theoretical points (= evaluationPoints + uncoveredPoints). */
  requiredPoints: number;
  /** Executed but not covered by balance; never clawed back. */
  uncoveredPoints: number;
}

export interface UsagePoint {
  date: string; // YYYY-MM-DD (UTC)
  keyId: string;
  model: string;
  calls: number;
  /** `/internal/usage` event rows — retries can double-count. */
  events?: number;
  /** Actually deducted points for the day×key. */
  evaluationPoints?: number;
  requiredPoints?: number;
  uncoveredPoints?: number;
  /** Dynamic per-CoreType split. */
  coreTypes?: UsageCoreTypeBreakdown[];
  /** Demo-only money mirrors; the real usage API has no money fields. */
  costMills: number;
  savingsMills: number;
}

/**
 * Account-wide guardrails.
 *
 * Mirrors the per-key shape (`monthlyPointCap` / `monthlyCallCap`) but adds
 * daily counterparts so users can throttle a noisy day without blowing
 * the entire month. Every cap is independently nullable — `null` means
 * "no limit on that axis", which is what the UI surfaces as
 * "Unlimited".
 *
 * Evaluation points and calls are deliberately separate axes. Payment money
 * is only retained in recharge receipts; it never controls traffic.
 */
export interface SpendLimit {
  /** Monthly evaluation-point cap; null = unlimited. */
  monthlyPointCap: number | null;
  /** Monthly call-count cap; null = unlimited. */
  monthlyCallCap: number | null;
  /** Daily evaluation-point cap; null = unlimited. */
  dailyPointCap: number | null;
  /** Daily call-count cap; null = unlimited. */
  dailyCallCap: number | null;
  /** Day-of-month the monthly counter resets. Always 1 today. */
  resetDay: number;
  /** Email warning thresholds for an active point/call cap (e.g. [50, 75, 90]). */
  warnAtPercents: number[];
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
  paypalOrderId?: string;
  balanceBeforeCents?: number;
  balanceAfterCents?: number;
  /** Point-led receipt data returned by the billing transaction API. */
  packageId?: 'standard' | 'advanced' | 'flagship';
  /** Exchange-rate snapshot fixed at order creation (pts per $1). */
  pointsPerUsd?: number;
  /** Batch validity snapshot, in days. */
  validityDays?: number;
  /** Points quoted at order creation (points_to_grant). */
  pointsToGrant?: number;
  basePoints?: number;
  creditedPoints?: number;
  balanceBeforePoints?: number;
  balanceAfterPoints?: number;
  pointsExpireAt?: string;
  /** Current usage snapshot for this top-up's point batch. */
  usedPoints?: number;
  remainingPoints?: number;
  /** Batch points forfeited by expiry (credited = used + remaining + expired). */
  expiredPoints?: number;
  paypalCaptureId?: string;
  effectiveAt?: string;
  kind: TransactionKind;
  keyId?: string;
}

/**
 * An individual, expiring lot of paid evaluation points. The server creates
 * one after each successful capture and debits the earliest expiry first.
 */
export interface EvaluationPointBatch {
  id: string;
  /** Null for the signup-bonus batch (no payment order behind it). */
  transactionId: string | null;
  /** Null for the signup-bonus batch (no purchased package). */
  packageId: 'standard' | 'advanced' | 'flagship' | null;
  creditedPoints: number;
  usedPoints: number;
  remainingPoints: number;
  createdAt: string;
  expiresAt: string;
  status: 'active' | 'exhausted' | 'expired';
}

/**
 * Account-level notification preferences. The account wallet low-balance
 * toggle and threshold live separately in `AccountLowBalanceAlert`.
 */
export interface NotificationSettings {
  // Product / ops
  weeklyUsageReport: boolean;
  paymentReceipts: boolean;
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
// We bill per successful MCP tool call. The published rate is tiered by
// monthly volume ($0.007 → $0.006 → $0.005/call, see `topup.ts`); local
// estimates here use the conservative entry-tier rate so "calls remaining"
// never over-promises. The `MODELS` array is intentionally a single entry so
// any lingering per-model plumbing (UsagePoint.model, CSV export) keeps
// working while the UI surfaces a single "MCP call" dimension.
export const MCP_CALL_RATE_PER_K = 7.0; // USD per 1,000 calls at the entry tier ($0.007/call)
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
// the seeder re-populates fresh data in the new shape.
// v11: trial allowance moved from daily/lifetime caps to a time-limited
// signup package (`totalLimit`, `totalUsed`, `grantedAt`, `expiresAt`).
// v12: removed top-up gifts and the retired multi-seat member demo.
// v13: removed the project concept (keys no longer belong to a project).
// v14: signup trial is now 900 calls valid for 30 days.
// v15: removed retired billing metadata and aligned demo transactions with PayPal-only.
// v16: added transaction detail fields for the billing history drawer.
// v17: signup trial corrected to 600 calls valid for 30 days.
// v18: purge stale masked keys cached from a previous backend hydration so
// demo reseeds with full-plaintext mock keys (copy must yield plaintext).
// v19: wallet and recharge records are evaluation-point based.
// v20: paid points are tracked as expiring recharge batches.
// v21: low-credit alerts are denominated in evaluation points, not dollars.
// v22: expiry-batch demo data includes same-day, different-time top-ups.
// v23: usage records include word/sentence and paragraph point breakdowns.
// v24: account and key guardrails are evaluation points, not money.
// v25: seed an expired point batch with leftover points for billing history UI.
// v26: reliably link the voided (30-day unused) batch to the oldest top-up and
// stamp usage fields on transactions so history always shows 已作废.
// v27: evaluation-points API v1.0 — usage carries dynamic CoreType splits
// (word/paragraph fields removed), transactions drop bonusPoints in favour of
// pointsPerUsd snapshots, and spend-limit alert toggles left notifications.
const SCHEMA_VERSION = 27;
const SCHEMA_KEY = 'dev-en:schema-version';

const STORAGE = {
  keys: 'dev-en:keys',
  usage: 'dev-en:usage',
  transactions: 'dev-en:transactions',
  evaluationPointBatches: 'dev-en:evaluation-point-batches',
  spendLimit: 'dev-en:spend-limit',
  paymentMethods: 'dev-en:payment-methods',
  notifications: 'dev-en:notifications',
  wallet: 'dev-en:wallet',
  trial: 'dev-en:trial',
  accountAlert: 'dev-en:account-alert',
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
  keys: ApiKey[] | null;
  usage: UsagePoint[] | null;
  transactions: Transaction[] | null;
  evaluationPointBatches: EvaluationPointBatch[] | null;
  spendLimit: SpendLimit | null;
  paymentMethods: PaymentMethod[] | null;
  notifications: NotificationSettings | null;
  wallet: AccountWallet | null;
  trial: TrialAllowance | null;
  accountAlert: AccountLowBalanceAlert | null;
  seeded: boolean;
}

const cache: Cache = {
  keys: null,
  usage: null,
  transactions: null,
  evaluationPointBatches: null,
  spendLimit: null,
  paymentMethods: null,
  notifications: null,
  wallet: null,
  trial: null,
  accountAlert: null,
  seeded: false,
};

let pointBatchSnapshotFor: EvaluationPointBatch[] | null = null;
let pointBatchSnapshot: EvaluationPointBatch[] = [];

/**
 * Start a fresh, isolated demo session.
 *
 * Real-account API responses and demo data intentionally share this legacy
 * store while the dashboard is being migrated. Crossing into demo mode must
 * therefore clear both persistence and module-level state before the demo
 * seeder runs, otherwise the previous account remains visible.
 */
export function resetAccountDataForDemo(): void {
  if (isBrowser()) {
    try {
      for (const key of Object.values(STORAGE)) {
        window.localStorage.removeItem(key);
      }
    } catch {
      /* ignore storage errors */
    }
  }

  for (const key of Object.keys(cache) as (keyof Cache)[]) {
    if (key === 'seeded') continue;
    cache[key] = null;
  }
  cache.seeded = false;
  pointBatchSnapshotFor = null;
  pointBatchSnapshot = [];
  mutationProxy = {};
  notify();
}

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

// ─── Bridge: real-backend mutation hook. mock-store-bridge.ts registers a
// proxy here so legacy mutators (createKey/renameKey/...) fire to the real
// API in addition to updating the local cache optimistically. If unset,
// mutators stay local-only (used when the user is signed out or the bridge
// hasn't loaded yet).
type MutationProxy = {
  createKey?: (name: string) => void;
  renameKey?: (mockId: string, name: string) => void;
  rotateKeySecret?: (mockId: string) => void;
  setKeyPaused?: (mockId: string, paused: boolean) => void;
  revokeKey?: (mockId: string) => void;
  deleteKey?: (mockId: string) => void;
  updateKeySettings?: (
    mockId: string,
    patch: {
      monthlyPointCap?: number | null;
      monthlyCallCap?: number | null;
      dailyPointCap?: number | null;
      dailyCallCap?: number | null;
      lowBalanceAlert?: LowBalanceAlert | null;
    },
  ) => void;
  /** @deprecated Account-wallet model — wallet topups are local-only. */
  addKeyCreditsCents?: (mockId: string, amountCents: number) => void;
  /** @deprecated Account-wallet model — wallet topups are local-only. */
  addKeyCalls?: (mockId: string, calls: number) => void;
  /** Account-level wallet top-up. */
  topupAccount?: (input: { baseCents: number; creditedPoints: number }) => void;
  /** Account-level low-balance alert update. */
  updateAccountAlert?: (alert: AccountLowBalanceAlert) => void;
  updateNotificationSettings?: (patch: Partial<NotificationSettings>) => void;
  setMonthlyPointLimit?: (points: number, warnAtPercents?: number[]) => void;
  /** Full four-axis account-limit update (account-wide guardrails). */
  updateAccountLimits?: (limit: SpendLimit) => void;
};

let mutationProxy: MutationProxy = {};
export function __setMutationProxy(p: MutationProxy): void {
  mutationProxy = p;
}

// ─── Bridge: external cache replacement (used by mock-store-bridge.ts to
// hydrate from real backend API). Marks cache as seeded so seedIfNeeded()
// doesn't overwrite real data with seed data on next call.
export function __replaceCache(partial: {
  keys?: ApiKey[];
  usage?: UsagePoint[];
  transactions?: Transaction[];
  evaluationPointBatches?: EvaluationPointBatch[];
  spendLimit?: SpendLimit;
  paymentMethods?: PaymentMethod[];
  notifications?: NotificationSettings;
  wallet?: AccountWallet;
  trial?: TrialAllowance;
  accountAlert?: AccountLowBalanceAlert;
}): void {
  if (partial.keys !== undefined) cache.keys = partial.keys;
  if (partial.usage !== undefined) cache.usage = partial.usage;
  if (partial.transactions !== undefined) cache.transactions = partial.transactions;
  if (partial.evaluationPointBatches !== undefined) cache.evaluationPointBatches = partial.evaluationPointBatches;
  if (partial.spendLimit !== undefined) cache.spendLimit = partial.spendLimit;
  if (partial.paymentMethods !== undefined) cache.paymentMethods = partial.paymentMethods;
  if (partial.notifications !== undefined) cache.notifications = partial.notifications;
  if (partial.wallet !== undefined) cache.wallet = partial.wallet;
  if (partial.trial !== undefined) cache.trial = partial.trial;
  if (partial.accountAlert !== undefined) cache.accountAlert = partial.accountAlert;
  cache.seeded = true;
  notify();
}

// Mark cache as "do not seed" — call before first read if you want the
// hydrator to populate it instead of falling back to mock seed data.
export function __markSeeded(): void {
  cache.seeded = true;
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

function addDaysIso(baseMs: number, days: number): string {
  return new Date(baseMs + days * 86400000).toISOString();
}

function isTrialExpired(t: TrialAllowance): boolean {
  return Date.now() >= Date.parse(t.expiresAt);
}

function trialDaysLeft(t: TrialAllowance): number {
  const ms = Date.parse(t.expiresAt) - Date.now();
  return Math.max(0, Math.ceil(ms / 86400000));
}

// ─── Seed ───────────────────────────────────────────────────────────────────
/**
 * Rich demo data — every module should tell a clear story on first login.
 *
 * Under the account-wallet model:
 *   - Wallet seeded with $72.50 remaining of $100 paid credit.
 *   - Trial allowance partly consumed (120/300), with 9 days left.
 *   - 6 keys total: 1 starter (default), 5 paid demonstrating different
 *     monthly-cap, monthly-call-cap and revoked states.
 *   - Account-level low-balance alert enabled with threshold $5.
 *
 *   Overview / Billing / Keys: surface the wallet, trial, and per-key
 *   monthly-cap progress.
 *   Usage: 120 days of stacked data with a spike + weekend trough.
 *   Recharge history: 4 credit top-ups +
 *     2 card-added events over ~45 days.
 */
function seedIfNeeded() {
  if (!isBrowser() || cache.seeded) return;
  migrateIfNeeded();

  const now = Date.now();
  const today = todayUtc();

  // ── Keys ──
  const existingKeys = read<ApiKey[] | null>(STORAGE.keys, null);
  if (!existingKeys || existingKeys.length === 0) {
    // Defaults describe a paid key — no per-key billing state. Overrides
    // flip the starter flag, set caps, etc.
    const mk = (
      overrides: Partial<ApiKey> & Pick<ApiKey, 'name' | 'env'>,
    ): ApiKey => {
      const secret = randomSecret(overrides.env);
      const defaults: Omit<ApiKey, 'name' | 'env'> = {
        id: uuid('key_'),
        secret,
        maskedSecret: maskSecret(secret),
        createdAt: new Date(now - 30 * 86400000).toISOString(),
        lastUsedAt: new Date(now - 15 * 60000).toISOString(),
        status: 'active',
        isStarter: false,
        monthlyPointCap: null,
        monthlyCallCap: null,
        // Legacy fields (deprecated, kept for back-compat with bridge/UI).
        freeDailyLimit: 0,
        freeDailyUsed: 0,
        freeDailyResetAt: today,
        freeTotalLimit: 0,
        freeTotalUsed: 0,
        paidCreditsCents: 0,
        paidCreditsUsedCents: 0,
        lowBalanceAlert: null,
      };
      return { ...defaults, ...overrides };
    };

    const seeded: ApiKey[] = [
      // ── STARTER (default first key) ──────────────────────────────
      // No per-key billing state under the new model — just a regular key
      // flagged as the account default. Trial allowance lives on the
      // account, not on this key.
      mk({
        name: 'Starter key',
        env: 'development',
        createdAt: new Date(now - 115 * 86400000).toISOString(),
        lastUsedAt: new Date(now - 42 * 60000).toISOString(),
        isStarter: true,
      }),
      // 1. Healthy production key with a per-key point cap. The wallet
      //    funds it; the cap protects against a runaway bug on this key.
      mk({
        name: 'Web App — Prod',
        env: 'production',
        createdAt: new Date(now - 85 * 86400000).toISOString(),
        lastUsedAt: new Date(now - 2 * 60000).toISOString(),
        monthlyPointCap: 25_000,
        monthlyCallCap: 20000, // 20K calls/mo cap
      }),
      // 2. Mobile prod — high-traffic key bumping into its monthly call
      //    cap (about 60% used this month against a 12K cap).
      mk({
        name: 'Mobile — Prod',
        env: 'production',
        createdAt: new Date(now - 70 * 86400000).toISOString(),
        lastUsedAt: new Date(now - 6 * 3600000).toISOString(),
        monthlyCallCap: 12000,
      }),
      // 3. Secondary prod — no cap configured.
      mk({
        name: 'Web App — Prod (secondary)',
        env: 'production',
        createdAt: new Date(now - 45 * 86400000).toISOString(),
        lastUsedAt: new Date(now - 12 * 60000).toISOString(),
      }),
      // 4. Staging — recently created, light usage, capped tight to keep
      //    test runs from chewing through wallet balance.
      mk({
        name: 'Staging',
        env: 'development',
        createdAt: new Date(now - 22 * 86400000).toISOString(),
        lastUsedAt: null,
        monthlyCallCap: 5000,
      }),
      // 5. Load test — uncapped dev key for occasional bursts.
      mk({
        name: 'Load test',
        env: 'development',
        createdAt: new Date(now - 18 * 86400000).toISOString(),
        lastUsedAt: new Date(now - 7 * 60000).toISOString(),
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
      secret: starterSecret,
      maskedSecret: maskSecret(starterSecret),
      createdAt: new Date(now).toISOString(),
      lastUsedAt: null,
      status: 'active',
      isStarter: true,
      monthlyPointCap: null,
      monthlyCallCap: null,
      // Legacy fields stay zeroed under the new account-wallet model.
      freeDailyLimit: 0,
      freeDailyUsed: 0,
      freeDailyResetAt: today,
      freeTotalLimit: 0,
      freeTotalUsed: 0,
      paidCreditsCents: 0,
      paidCreditsUsedCents: 0,
      lowBalanceAlert: null,
    };
    cache.keys = [starter, ...cache.keys];
    write(STORAGE.keys, cache.keys);
  }

  // ── Usage (120 days × keys × models) ──
  const existingUsage = read<UsagePoint[] | null>(STORAGE.usage, null);
  if (!existingUsage || existingUsage.length === 0) {
    // Volume target: ~26K calls/month ≈ 40K evaluation points — keeps the
    // "spent this month" KPI comfortably below the wallet's lifetime story
    // (68,750 credited / 50,625 used) so the demo ledger stays coherent.
    // Per-key weekday traffic rate (average calls across all models).
    // Keys not listed here → no historical traffic (e.g. revoked, or the
    // freshly-created "Staging" key that still awaits its first top-up and
    // therefore has never served a request).
    const perKeyDailyBase: Record<string, number> = {
      'Web App — Prod': 515,
      'Web App — Prod (secondary)': 210,
      'Mobile — Prod': 330,
      'Load test': 75,
      // Starter key: light experimentation usage for the trial story.
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
        // Dynamic CoreType split mirroring the real usage contract: a
        // 1-pt word/sentence kernel plus a 2-pt paragraph kernel.
        const paragraphCalls = Math.max(1, Math.round(calls * 0.18));
        const wordSentenceCalls = Math.max(0, calls - paragraphCalls);
        const coreTypes: UsageCoreTypeBreakdown[] = [
          {
            coreType: 'word_sentence.evaluate',
            displayName: 'Word / Phrase / Sentence',
            language: 'zh',
            calls: wordSentenceCalls,
            events: wordSentenceCalls,
            evaluationPoints: wordSentenceCalls,
            requiredPoints: wordSentenceCalls,
            uncoveredPoints: 0,
          },
          {
            coreType: 'paragraph.evaluate',
            displayName: 'Paragraph Evaluation',
            language: 'en',
            calls: paragraphCalls,
            events: paragraphCalls,
            evaluationPoints: paragraphCalls * 2,
            requiredPoints: paragraphCalls * 2,
            uncoveredPoints: 0,
          },
        ].filter((ct) => ct.calls > 0);
        const evaluationPoints = coreTypes.reduce((a, ct) => a + ct.evaluationPoints, 0);
        const grossMills = Math.round((calls / 1000) * MCP_CALL_RATE_PER_K * 1000);
        const savingsMills =
          key.env === 'production' ? Math.round(grossMills * 0.12) : 0;
        points.push({
          date,
          keyId: key.id,
          model: MCP_CALL_MODEL_ID,
          calls,
          events: calls,
          evaluationPoints,
          requiredPoints: evaluationPoints,
          uncoveredPoints: 0,
          coreTypes,
          costMills: grossMills - savingsMills,
          savingsMills,
        });
      }
    }
    write(STORAGE.usage, points);
    cache.usage = points;
  } else {
    cache.usage = existingUsage;
  }

  // ── Account limits ──
  const existingLimit = read<Partial<SpendLimit> | null>(STORAGE.spendLimit, null);
  if (!existingLimit) {
    const seeded: SpendLimit = {
      monthlyPointCap: 30_000,
      monthlyCallCap: null,
      dailyPointCap: null,
      dailyCallCap: null,
      resetDay: 1,
      warnAtPercents: [50, 75, 90],
    };
    write(STORAGE.spendLimit, seeded);
    cache.spendLimit = seeded;
  } else {
    const migrated: SpendLimit = {
      monthlyPointCap:
        existingLimit.monthlyPointCap != null
          ? existingLimit.monthlyPointCap
          : null,
      monthlyCallCap:
        existingLimit.monthlyCallCap != null
          ? existingLimit.monthlyCallCap
          : null,
      dailyPointCap:
        existingLimit.dailyPointCap != null ? existingLimit.dailyPointCap : null,
      dailyCallCap:
        existingLimit.dailyCallCap != null ? existingLimit.dailyCallCap : null,
      resetDay: existingLimit.resetDay ?? 1,
      warnAtPercents:
        existingLimit.warnAtPercents && existingLimit.warnAtPercents.length
          ? existingLimit.warnAtPercents
          : [50, 75, 90],
    };
    cache.spendLimit = migrated;
    write(STORAGE.spendLimit, migrated);
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

  // ── Transactions (realistic 45-day timeline, wallet model) ──
  // Wallet-billing change: top-ups land on the *account*, not a specific
  // key, so transactions no longer carry keyId/projectId. The current
  // overseas checkout supports PayPal only.
  const existingTxn = read<Transaction[] | null>(STORAGE.transactions, null);
  if (!existingTxn) {
    const mkTxn = (
      o: Omit<Transaction, 'id'> & { id?: string },
    ): Transaction => {
      // Tier snapshot follows the current points_per_usd bands: standard 250,
      // advanced 275, flagship 300 pts/$ (no bonus split under the new model).
      const packageId =
        o.amountCents >= 19_990 ? 'flagship' : o.amountCents >= 9_990 ? 'advanced' : 'standard';
      const pointsPerUsd = packageId === 'flagship' ? 300 : packageId === 'advanced' ? 275 : 250;
      const credited = Math.ceil((o.amountCents / 100) * pointsPerUsd);
      const { id: preferredId, usedPoints, remainingPoints, ...rest } = o;
      return {
        ...rest,
        id: preferredId ?? uuid('txn_'),
        packageId,
        pointsPerUsd,
        validityDays: 30,
        pointsToGrant: credited,
        basePoints: credited,
        creditedPoints: credited,
        balanceBeforePoints: Math.floor(((o.balanceBeforeCents ?? 0) / 100) * 250),
        balanceAfterPoints: Math.floor(((o.balanceAfterCents ?? 0) / 100) * 250),
        effectiveAt: o.createdAt,
        paypalCaptureId: o.paypalOrderId ? `${o.paypalOrderId}-CAP` : undefined,
        pointsExpireAt: new Date(new Date(o.createdAt).getTime() + 30 * 86400000).toISOString(),
        // Usage snapshot mirrors the matching point batch (fallback when
        // batch join misses). Remaining > 0 past expiry → voided in UI.
        usedPoints: usedPoints ?? 0,
        remainingPoints: remainingPoints ?? credited,
      };
    };

    const seeded: Transaction[] = [
      // newest first — usage numbers stay in sync with point batches below
      mkTxn({
        id: 'txn_seed_d1',
        createdAt: new Date(now - 1 * 86400000).toISOString(),
        amountCents: 2000,
        status: 'succeeded',
        method: 'paypal',
        last4: 'ppal',
        description: 'PayPal · Evaluation points · $20.00',
        paypalOrderId: 'PAYPAL-ORDER-260531-001',
        balanceBeforeCents: 24500,
        balanceAfterCents: 26500,
        kind: 'credit-topup',
        usedPoints: 2_000,
        remainingPoints: 3_000,
      }),
      mkTxn({
        id: 'txn_seed_d6',
        createdAt: new Date(now - 6 * 86400000).toISOString(),
        amountCents: 10000,
        status: 'succeeded',
        method: 'paypal',
        last4: 'ppal',
        description: 'PayPal · Evaluation points · $100.00',
        paypalOrderId: 'PAYPAL-ORDER-260526-002',
        balanceBeforeCents: 14500,
        balanceAfterCents: 24500,
        kind: 'credit-topup',
        usedPoints: 27_500,
        remainingPoints: 0,
      }),
      mkTxn({
        id: 'txn_seed_d10',
        createdAt: new Date(now - 10 * 86400000).toISOString(),
        amountCents: 2000,
        status: 'succeeded',
        method: 'paypal',
        last4: 'ppal',
        description: 'PayPal · Evaluation points · $20.00',
        paypalOrderId: 'PAYPAL-ORDER-260522-003',
        balanceBeforeCents: 12500,
        balanceAfterCents: 14500,
        kind: 'credit-topup',
        usedPoints: 2_000,
        remainingPoints: 3_000,
      }),
      mkTxn({
        id: 'txn_seed_d14',
        createdAt: new Date(now - 14 * 86400000).toISOString(),
        amountCents: 2500,
        status: 'succeeded',
        method: 'paypal',
        last4: 'ppal',
        description: 'PayPal · Evaluation points · $25.00',
        paypalOrderId: 'PAYPAL-ORDER-260518-004',
        balanceBeforeCents: 10000,
        balanceAfterCents: 12500,
        kind: 'credit-topup',
        usedPoints: 1_125,
        remainingPoints: 5_125,
      }),
      mkTxn({
        id: 'txn_seed_d18',
        createdAt: new Date(now - 18 * 86400000).toISOString(),
        amountCents: 5000,
        status: 'succeeded',
        method: 'paypal',
        last4: 'ppal',
        description: 'PayPal · Evaluation points · $50.00',
        paypalOrderId: 'PAYPAL-ORDER-260514-005',
        balanceBeforeCents: 5000,
        balanceAfterCents: 10000,
        kind: 'credit-topup',
        usedPoints: 5_500,
        remainingPoints: 7_000,
      }),
      // Oldest top-up: 30-day window elapsed with leftover points → voided.
      mkTxn({
        id: 'txn_seed_d30',
        createdAt: new Date(now - 35 * 86400000).toISOString(),
        amountCents: 5000,
        status: 'succeeded',
        method: 'paypal',
        last4: 'ppal',
        description: 'PayPal · Evaluation points · $50.00',
        paypalOrderId: 'PAYPAL-ORDER-260502-006',
        balanceBeforeCents: 0,
        balanceAfterCents: 5000,
        kind: 'credit-topup',
        usedPoints: 10_000,
        remainingPoints: 2_500,
      }),
    ];
    write(STORAGE.transactions, seeded);
    cache.transactions = seeded;
  } else {
    cache.transactions = existingTxn;
  }

  // ── Notification settings ──
  const existingNotif = read<NotificationSettings | null>(STORAGE.notifications, null);
  if (!existingNotif) {
    const seeded: NotificationSettings = {
      weeklyUsageReport: true,
      paymentReceipts: true,
      productUpdates: false,
      securityAlerts: true,
    };
    write(STORAGE.notifications, seeded);
    cache.notifications = seeded;
  } else {
    cache.notifications = existingNotif;
  }

  // ── Account wallet ── (18,125 paid evaluation points remaining)
  const existingWallet = read<AccountWallet | null>(STORAGE.wallet, null);
  if (!existingWallet) {
    const seeded: AccountWallet = {
      // Canonical point balance: 68,750 credited, 48,125 used.
      // Active remaining stays 18,125; the oldest batch is expired with
      // 2,500 leftover points (forfeited, not counted as available).
      paidEvaluationPoints: 68_750,
      usedEvaluationPoints: 48_125,
      // Total credits ever loaded.
      paidCreditsCents: 26_500,
      // Already consumed: $265 - $72.50 remaining = $192.50
      paidCreditsUsedCents: 19_250,
    };
    write(STORAGE.wallet, seeded);
    cache.wallet = seeded;
  } else {
    cache.wallet = existingWallet;
  }

  // ── Evaluation point batches ──
  // The balance is deliberately split across multiple purchases so the UI can
  // demonstrate the real FIFO-by-expiry model. New successful top-ups append
  // another batch; the server is authoritative once the API is connected.
  const existingPointBatches = read<EvaluationPointBatch[] | null>(
    STORAGE.evaluationPointBatches,
    null,
  );
  if (!existingPointBatches) {
    const txId = (id: string) =>
      (cache.transactions ?? []).find((transaction) => transaction.id === id)?.id ?? id;
    const mkBatch = (
      transactionId: string,
      daysAgo: number,
      creditedPoints: number,
      remainingPoints: number,
      daysUntilExpiry: number,
      packageId: EvaluationPointBatch['packageId'],
      expiryHourOffset = 0,
    ): EvaluationPointBatch => {
      const pastExpiry = daysUntilExpiry < 0;
      const status: EvaluationPointBatch['status'] = pastExpiry
        ? remainingPoints > 0
          ? 'expired'
          : 'exhausted'
        : remainingPoints > 0
          ? 'active'
          : 'exhausted';
      return {
        id: uuid('point_batch_'),
        transactionId: txId(transactionId),
        packageId,
        creditedPoints,
        usedPoints: creditedPoints - remainingPoints,
        remainingPoints,
        createdAt: new Date(now - daysAgo * 86400000).toISOString(),
        expiresAt: new Date(now + daysUntilExpiry * 86400000 + expiryHourOffset * 3600000).toISOString(),
        status,
      };
    };
    const seeded = [
      // Voided: 30-day window ended with leftover points (not counted as available).
      mkBatch('txn_seed_d30', 35, 12_500, 2_500, -5, 'standard'),
      mkBatch('txn_seed_d18', 18, 12_500, 7_000, 12, 'standard'),
      // Two independent top-ups expire on the same day but at different
      // times, so the billing UI demonstrates why date-only grouping loses
      // real batch information.
      mkBatch('txn_seed_d14', 14, 6_250, 5_125, 16, 'standard', -3),
      mkBatch('txn_seed_d10', 10, 5_000, 3_000, 16, 'standard', 4),
      mkBatch('txn_seed_d6', 6, 27_500, 0, 24, 'advanced'),
      mkBatch('txn_seed_d1', 1, 5_000, 3_000, 29, 'standard'),
    ];
    write(STORAGE.evaluationPointBatches, seeded);
    cache.evaluationPointBatches = seeded;
  } else {
    cache.evaluationPointBatches = existingPointBatches;
  }

  // ── Trial allowance ── (mid-consumption: 120/600, 25 days left)
  const existingTrial = read<TrialAllowance | null>(STORAGE.trial, null);
  if (!existingTrial) {
    const seeded: TrialAllowance = {
      totalLimit: TRIAL_DEFAULT_TOTAL,
      totalUsed: 120,
      grantedAt: addDaysIso(now, -5),
      expiresAt: addDaysIso(now, 25),
    };
    write(STORAGE.trial, seeded);
    cache.trial = seeded;
  } else {
    cache.trial = existingTrial;
  }

  // ── Account-level low-points alert ── (1,250-point threshold, enabled)
  const existingAlert = read<AccountLowBalanceAlert | null>(STORAGE.accountAlert, null);
  if (!existingAlert) {
    const seeded: AccountLowBalanceAlert = {
      enabled: true,
      thresholdPoints: 1_250,
    };
    write(STORAGE.accountAlert, seeded);
    cache.accountAlert = seeded;
  } else {
    cache.accountAlert = existingAlert;
  }

  cache.seeded = true;
}

// ─── Readers ────────────────────────────────────────────────────────────────
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

/** All paid-point batches, soonest expiry first. */
export function getEvaluationPointBatches(): EvaluationPointBatch[] {
  seedIfNeeded();
  const source = cache.evaluationPointBatches ?? [];
  if (pointBatchSnapshotFor === source) return pointBatchSnapshot;
  pointBatchSnapshotFor = source;
  pointBatchSnapshot = [...source].sort(
    (a, b) => Date.parse(a.expiresAt) - Date.parse(b.expiresAt),
  );
  return pointBatchSnapshot;
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
  mutationProxy.updateNotificationSettings?.(patch);
  return next;
}

// ─── Account-level readers ──────────────────────────────────────────────────

const DEFAULT_WALLET: AccountWallet = {
  paidEvaluationPoints: 0,
  usedEvaluationPoints: 0,
  paidCreditsCents: 0,
  paidCreditsUsedCents: 0,
};
const DEFAULT_TRIAL: TrialAllowance = {
  totalLimit: TRIAL_DEFAULT_TOTAL,
  totalUsed: 0,
  grantedAt: new Date().toISOString(),
  expiresAt: addDaysIso(Date.now(), TRIAL_DEFAULT_VALID_DAYS),
};
const DEFAULT_ACCOUNT_ALERT: AccountLowBalanceAlert = {
  enabled: false,
  thresholdPoints: 1_250,
};

export function getWallet(): AccountWallet {
  seedIfNeeded();
  return cache.wallet ?? DEFAULT_WALLET;
}

export function getTrial(): TrialAllowance {
  seedIfNeeded();
  return cache.trial ?? DEFAULT_TRIAL;
}

export function getAccountAlert(): AccountLowBalanceAlert {
  seedIfNeeded();
  return cache.accountAlert ?? DEFAULT_ACCOUNT_ALERT;
}

/** Wallet balance in cents (paid credits minus consumed). */
export function getAccountBalanceCents(): number {
  const w = getWallet();
  return Math.max(0, w.paidCreditsCents - w.paidCreditsUsedCents);
}

/** Remaining evaluation points. This is the balance shown to users. */
export function getAccountEvaluationPoints(): number {
  const w = getWallet();
  // Authoritative balance hydrated from GET /billing/summary — the API
  // contract forbids deriving the main balance from batch sums.
  if (typeof w.balanceEvaluationPoints === 'number') {
    return Math.max(0, w.balanceEvaluationPoints);
  }
  // Demo/offline fallbacks only.
  const batches = getEvaluationPointBatches();
  if (batches.length > 0) {
    return batches.reduce(
      (total, batch) => total + (batch.status === 'active' ? batch.remainingPoints : 0),
      0,
    );
  }
  return Math.max(0, w.paidEvaluationPoints - w.usedEvaluationPoints);
}

/** Total paid evaluation points ever credited, excluding the free trial. */
export function getAccountLifetimeEvaluationPoints(): number {
  return Math.max(0, getWallet().paidEvaluationPoints);
}

/** Add one server-equivalent, expiring point lot after a successful top-up. */
export function addEvaluationPointBatch(input: {
  transactionId: string;
  packageId: EvaluationPointBatch['packageId'];
  creditedPoints: number;
  expiresAt: string;
}): EvaluationPointBatch {
  seedIfNeeded();
  const creditedPoints = Math.max(0, Math.round(input.creditedPoints));
  const batch: EvaluationPointBatch = {
    id: uuid('point_batch_'),
    transactionId: input.transactionId,
    packageId: input.packageId,
    creditedPoints,
    usedPoints: 0,
    remainingPoints: creditedPoints,
    createdAt: new Date().toISOString(),
    expiresAt: input.expiresAt,
    status: 'active',
  };
  const next = [batch, ...(cache.evaluationPointBatches ?? [])];
  cache.evaluationPointBatches = next;
  write(STORAGE.evaluationPointBatches, next);
  notify();
  return batch;
}

export interface AccountTrialRemaining {
  totalLeft: number;
  totalExhausted: boolean;
  expired: boolean;
  expiresAt: string;
  daysLeft: number;
}

// Identity-stable cache: `useSyncExternalStore` re-reads the snapshot on
// every render and compares with `Object.is`, so any selector that
// allocates a fresh object causes an infinite re-render loop. We memoize
// the derived `AccountTrialRemaining` against the underlying trial
// reference and invalidate whenever the trial cache changes.
let _trialRemainingFor: TrialAllowance | null = null;
let _trialRemainingValue: AccountTrialRemaining | null = null;

export function getAccountTrialRemaining(): AccountTrialRemaining {
  const t = getTrial();
  if (_trialRemainingFor === t && _trialRemainingValue) {
    return _trialRemainingValue;
  }
  const rawTotalLeft = Math.max(0, t.totalLimit - t.totalUsed);
  const expired = isTrialExpired(t);
  const totalLeft = expired ? 0 : rawTotalLeft;
  const next: AccountTrialRemaining = {
    totalLeft,
    totalExhausted: expired || rawTotalLeft <= 0,
    expired,
    expiresAt: t.expiresAt,
    daysLeft: trialDaysLeft(t),
  };
  _trialRemainingFor = t;
  _trialRemainingValue = next;
  return next;
}

/** USD cost per 1 call (mirror of MCP_CALL_RATE_PER_K but per-call). */
export const MCP_CALL_RATE_PER_CALL_DOLLARS = MCP_CALL_RATE_PER_K / 1000;
/** USD cents per 1 call at the entry tier: $0.007 → 0.7 cent. */
export const MCP_CALL_RATE_PER_CALL_CENTS = MCP_CALL_RATE_PER_CALL_DOLLARS * 100;

/**
 * Estimated calls remaining at the current rate, summing the unexpired
 * trial allowance plus the dollar-converted wallet balance.
 */
export function getAccountCallsRemaining(): number {
  const trial = getAccountTrialRemaining();
  const walletCalls = Math.floor(
    getAccountBalanceCents() / Math.max(0.0001, MCP_CALL_RATE_PER_CALL_CENTS),
  );
  return trial.totalLeft + walletCalls;
}

/**
 * Total calls ever provisioned to this account: trial total + wallet credit
 * converted to calls. Stable across consumption.
 */
export function getAccountCallsTotal(): number {
  const trial = getTrial();
  const w = getWallet();
  const walletCalls = Math.floor(
    w.paidCreditsCents / Math.max(0.0001, MCP_CALL_RATE_PER_CALL_CENTS),
  );
  return trial.totalLimit + walletCalls;
}

/** True if available evaluation points have dropped below the configured alert threshold. */
export function isAccountLowPoints(): boolean {
  const a = getAccountAlert();
  if (!a.enabled) return false;
  const points = getAccountEvaluationPoints();
  return points > 0 && points <= a.thresholdPoints;
}

/** @deprecated Use `isAccountLowPoints` for product-facing alerts. */
export function isAccountLowBalance(): boolean {
  return isAccountLowPoints();
}

/** This-month call count for one key, derived from usage history. */
export function getKeyMonthlyCalls(keyId: string): number {
  const ym = new Date().toISOString().slice(0, 7);
  return getUsage()
    .filter((p) => p.keyId === keyId && p.date.startsWith(ym))
    .reduce((acc, p) => acc + (p.calls ?? 0), 0);
}

/** Today's UTC call count for one key, derived from the daily usage records. */
export function getKeyTodayCalls(keyId: string): number {
  const today = new Date().toISOString().slice(0, 10);
  return getUsage()
    .filter((p) => p.keyId === keyId && p.date.startsWith(today))
    .reduce((acc, p) => acc + (p.calls ?? 0), 0);
}

/** Today's UTC deducted evaluation points for one key. */
export function getKeyTodayEvaluationPoints(keyId: string): number {
  const today = new Date().toISOString().slice(0, 10);
  return getUsage()
    .filter((p) => p.keyId === keyId && p.date.startsWith(today))
    .reduce((acc, p) => acc + (p.evaluationPoints ?? 0), 0);
}

/** Current UTC month's deducted evaluation points for one key. */
export function getKeyMonthlyEvaluationPoints(keyId: string): number {
  const month = new Date().toISOString().slice(0, 7);
  return getUsage()
    .filter((p) => p.keyId === keyId && p.date.startsWith(month))
    .reduce((acc, p) => acc + (p.evaluationPoints ?? 0), 0);
}

/** Net spend (mills, after discounts) for one key in the current UTC month. */
export function getKeyMonthlySpendMills(keyId: string): number {
  const ym = new Date().toISOString().slice(0, 7);
  return getUsage()
    .filter((p) => p.keyId === keyId && p.date.startsWith(ym))
    .reduce((acc, p) => acc + (p.costMills ?? 0), 0);
}

// ─── Derived helpers ────────────────────────────────────────────────────────

/**
 * Calls remaining that this key can make. In the account-wallet model the
 * answer is **the same for every active key** — they all draw from the
 * same wallet+trial pool. Returns 0 for revoked/paused keys, otherwise
 * the account-level remaining count.
 */
export function getKeyCallsRemaining(k: ApiKey): number {
  if (k.status === 'revoked' || k.status === 'paused') return 0;
  return getAccountCallsRemaining();
}

export function getKeyCallsTotal(k: ApiKey): number {
  if (k.status === 'revoked') return 0;
  return getAccountCallsTotal();
}

export function getKeyCallsUsed(k: ApiKey): number {
  if (k.status === 'revoked') return 0;
  return Math.max(0, getKeyCallsTotal(k) - getKeyCallsRemaining(k));
}

/**
 * Classify a key's billing state. With the wallet model everything is
 * either active (account has balance/trial), needs-credits (account dry),
 * paused, or revoked. The legacy `starter` / `starter-exhausted` values
 * are no longer returned by this helper but remain in the `BillingTier`
 * union for type compatibility with older code paths.
 */
export function getBillingTier(k: ApiKey): BillingTier {
  if (k.status === 'revoked') return 'revoked';
  if (k.status === 'paused') return 'paused';
  return getAccountCallsRemaining() > 0 ? 'paid-active' : 'needs-credits';
}

/** True if this key is the account's default ("starter") key. */
export function isStarterKey(k: ApiKey): boolean {
  return k.isStarter === true;
}

/** @deprecated Use `getAccountTrialRemaining()` — trial lives on the account now. */
export function hasFreeAllowance(_k: ApiKey): boolean {
  const trial = getAccountTrialRemaining();
  return !trial.totalExhausted && trial.totalLeft > 0;
}

/** @deprecated Use `getAccountBalanceCents()`. Returns the same value for every key now. */
export function getKeyBalanceCents(k: ApiKey): number {
  if (k.status === 'revoked') return 0;
  return getAccountBalanceCents();
}

/**
 * @deprecated Legacy constant — under the new model the trial total is
 * `TRIAL_DEFAULT_TOTAL` and lives on the account. Kept for back-compat
 * with any UI still importing it.
 */
export const STARTER_INITIAL_TOTAL_LIMIT = TRIAL_DEFAULT_TOTAL;

/**
 * @deprecated The "starter upgraded" concept is gone — under the wallet
 * model the trial allowance is independent of any top-up. Returns true
 * whenever the wallet has been funded at least once, so any UI gated on
 * this flag still progresses sensibly.
 */
export function isStarterUpgraded(_k: ApiKey): boolean {
  return getWallet().paidCreditsCents > 0;
}

/**
 * True if the key is currently eligible to serve traffic — not
 * revoked/paused, and the account still has either trial or wallet
 * credit available.
 */
export function isKeyServing(k: ApiKey): boolean {
  if (k.status === 'revoked' || k.status === 'paused') return false;
  return getAccountCallsRemaining() > 0;
}

/**
 * @deprecated Per-key low-balance is gone in the wallet model. Returns
 * true whenever the **account-wide** alert is configured and tripped, so
 * any caller still using this signal lights up correctly. New code should
 * call `isAccountLowBalance()` directly.
 */
export function isLowBalance(_k: ApiKey): boolean {
  return isAccountLowBalance();
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
  costMills: number;
  savingsMills: number;
}

export function getKeyUsageSummary(keyId: string): KeyUsageSummary {
  const points = getUsage().filter((p) => p.keyId === keyId);
  return {
    calls: points.reduce((acc, p) => acc + (p.calls ?? 0), 0),
    costMills: points.reduce((acc, p) => acc + (p.costMills ?? 0), 0),
    savingsMills: points.reduce((acc, p) => acc + (p.savingsMills ?? 0), 0),
  };
}

/** Rolling window (UTC calendar days) used for credit runway / burn estimates. */
export const KEY_BURN_WINDOW_DAYS = 28;

/**
 * Net spend (after volume discounts) for one key in the last `windowDays` UTC
 * days. Smoothed daily burn = netMills / windowDays.
 */
export function getKeyNetBurnLastDays(
  keyId: string,
  windowDays: number,
): { netMills: number; calls: number; daysWithUsage: number } {
  seedIfNeeded();
  const usage = getUsage().filter((p) => p.keyId === keyId);
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - windowDays);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  const recent = usage.filter((p) => p.date >= cutoffStr);
  let netMills = 0;
  let calls = 0;
  const daySet = new Set<string>();
  for (const p of recent) {
    netMills += (p.costMills ?? 0) - (p.savingsMills ?? 0);
    calls += p.calls ?? 0;
    if ((p.calls ?? 0) > 0 || (p.costMills ?? 0) > 0) daySet.add(p.date);
  }
  return { netMills, calls, daysWithUsage: daySet.size };
}

export interface KeyCreditRunwayEstimate {
  windowDays: number;
  avgDailyNetMills: number;
  balanceAfterMills: number;
  estimatedDays: number | null;
  estimatedCallsAtPace: number | null;
  confidence: 'high' | 'low' | 'none';
}

/**
 * How long the account balance might last given this key's recent burn rate.
 * Uses smoothed daily net spend over {@link KEY_BURN_WINDOW_DAYS}. When there
 * is no meaningful spend in the window, `estimatedDays` is null.
 */
export function estimateKeyCreditRunway(
  keyId: string,
  additionalCents: number,
): KeyCreditRunwayEstimate {
  const windowDays = KEY_BURN_WINDOW_DAYS;
  const { netMills, calls, daysWithUsage } = getKeyNetBurnLastDays(
    keyId,
    windowDays,
  );
  // Wallet model: runway is funded by the **account** balance (any key
  // can deplete it). The keyId remains in the signature so the burn rate
  // is still computed per-key, but the dollar pool is shared.
  // Balance is in cents; convert to mills for comparison.
  const remaining = getAccountBalanceCents();
  const balanceAfterMills = (remaining + Math.max(0, additionalCents)) * 10;

  const avgDailyNetMills = netMills / windowDays;

  let estimatedDays: number | null = null;
  if (avgDailyNetMills >= 1) {
    estimatedDays = balanceAfterMills / avgDailyNetMills;
  }

  let estimatedCallsAtPace: number | null = null;
  if (calls > 0 && netMills > 0) {
    const avgNetPerCall = netMills / calls;
    if (avgNetPerCall >= 0.01) {
      estimatedCallsAtPace = Math.floor(balanceAfterMills / avgNetPerCall);
    }
  }

  let confidence: 'high' | 'low' | 'none' = 'none';
  if (avgDailyNetMills >= 1) {
    confidence = daysWithUsage >= 10 ? 'high' : 'low';
  }

  return {
    windowDays,
    avgDailyNetMills,
    balanceAfterMills,
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

/**
 * Total calls billed to the account *today* (across all keys).
 *
 * Used by the wallet strip post-trial to show progress against the
 * account-level daily call cap that the user has configured in
 * Settings → Account limits.
 */
export function getAccountCallsToday(): number {
  const yyyymmdd = new Date().toISOString().slice(0, 10);
  return getUsage()
    .filter((p) => p.date === yyyymmdd)
    .reduce((acc, p) => acc + (p.calls ?? 0), 0);
}

export function getAccountSpendThisMonthMills(): number {
  const yyyymm = new Date().toISOString().slice(0, 7);
  return getUsage()
    .filter((p) => p.date?.startsWith(yyyymm))
    .reduce((acc, p) => acc + (p.costMills ?? 0), 0);
}

export function getAccountSavingsThisMonthMills(): number {
  const yyyymm = new Date().toISOString().slice(0, 7);
  return getUsage()
    .filter((p) => p.date?.startsWith(yyyymm))
    .reduce((acc, p) => acc + (p.savingsMills ?? 0), 0);
}

export function getCurrentVolumeTier(): VolumeTier {
  const calls = getAccountCallsThisMonth();
  for (const t of VOLUME_TIERS) {
    if (calls <= t.upTo) return t;
  }
  return VOLUME_TIERS[VOLUME_TIERS.length - 1];
}

// ─── Mutations ──────────────────────────────────────────────────────────────
/**
 * Create a paid key. Paid keys are inactive (cannot serve traffic) until
 * funded with credits — the UI should prompt the user to top up immediately
 * after creation. The starter key is created automatically by the seeder
 * and can never be created via this function.
 */
// `env` is retained on the data model for back-compat with usage / billing
// charts that still slice by environment, but the UI no longer asks for it
// on creation — every new key defaults to `'production'`. Callers that
// pass an explicit env (legacy paths, tests) keep working as before.
export function createKey(
  name: string,
  env: Environment = 'production',
): ApiKey {
  seedIfNeeded();
  const secret = randomSecret(env);
  const today = todayUtc();
  const newKey: ApiKey = {
    id: uuid('key_'),
    name: name.trim() || 'Untitled key',
    env,
    secret,
    maskedSecret: maskSecret(secret),
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
    status: 'active',
    isStarter: false,
    monthlyPointCap: null,
    monthlyCallCap: null,
    // Legacy fields zeroed under the wallet model.
    freeDailyLimit: 0,
    freeDailyUsed: 0,
    freeDailyResetAt: today,
    freeTotalLimit: 0,
    freeTotalUsed: 0,
    paidCreditsCents: 0,
    paidCreditsUsedCents: 0,
    lowBalanceAlert: null,
  };
  const next = [newKey, ...(cache.keys ?? [])];
  cache.keys = next;
  write(STORAGE.keys, next);
  notify();
  mutationProxy.createKey?.(newKey.name);
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
  mutationProxy.renameKey?.(id, name);
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
  mutationProxy.rotateKeySecret?.(id);
  return updated;
}

/**
 * Update a paid key's optional per-key settings. Passing `undefined` leaves
 * a field untouched; passing `null` clears it. The `lowBalanceAlert` field
 * is kept in the patch type for back-compat but no longer applied — the
 * account-level alert (see `updateAccountAlert`) supersedes it.
 */
export function updateKeySettings(
  id: string,
  patch: {
    monthlyPointCap?: number | null;
    monthlyCallCap?: number | null;
    dailyPointCap?: number | null;
    dailyCallCap?: number | null;
    /** @deprecated Account-level alert replaces this. Field ignored. */
    lowBalanceAlert?: LowBalanceAlert | null;
  },
): void {
  seedIfNeeded();
  const next = (cache.keys ?? []).map((k) => {
    if (k.id !== id) return k;
    return {
      ...k,
      ...(patch.monthlyPointCap !== undefined
        ? { monthlyPointCap: patch.monthlyPointCap }
        : {}),
      ...(patch.monthlyCallCap !== undefined
        ? { monthlyCallCap: patch.monthlyCallCap }
        : {}),
      ...(patch.dailyPointCap !== undefined
        ? { dailyPointCap: patch.dailyPointCap }
        : {}),
      ...(patch.dailyCallCap !== undefined
        ? { dailyCallCap: patch.dailyCallCap }
        : {}),
    };
  });
  cache.keys = next;
  write(STORAGE.keys, next);
  notify();
  mutationProxy.updateKeySettings?.(id, patch);
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
  mutationProxy.revokeKey?.(id);
}

/**
 * Pause / resume a paid key. Paused keys stop serving traffic but keep
 * their secret intact, so flipping back to active instantly re-enables
 * them — unlike {@link revokeKey}, which is terminal. Refuses to act on
 * the starter key and on keys that are already revoked.
 */
/**
 * Pin / unpin a key. Pinned keys float to the top of the API Keys list
 * regardless of their last-used or created-at order. Purely cosmetic —
 * doesn't affect billing, traffic, or any backend semantics.
 */
export function setKeyPinned(id: string, pinned: boolean): void {
  seedIfNeeded();
  const next = (cache.keys ?? []).map((k) =>
    k.id === id ? { ...k, pinned } : k,
  );
  cache.keys = next;
  write(STORAGE.keys, next);
  notify();
}

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
  mutationProxy.setKeyPaused?.(id, paused);
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
  mutationProxy.deleteKey?.(id);
}

/**
 * Top up the account wallet. `creditedPoints` is the product balance that
 * lands in the account; `baseCents` is retained for payment reconciliation.
 *
 * Returns the new wallet snapshot.
 */
export function topupAccount(input: { baseCents: number; creditedPoints?: number }): AccountWallet {
  seedIfNeeded();
  const base = Math.max(0, Math.round(input.baseCents));
  const creditedPoints = Math.max(0, Math.round(input.creditedPoints ?? 0));
  const current = cache.wallet ?? DEFAULT_WALLET;
  const next: AccountWallet = {
    paidEvaluationPoints: current.paidEvaluationPoints + creditedPoints,
    usedEvaluationPoints: current.usedEvaluationPoints,
    paidCreditsCents: current.paidCreditsCents + base,
    paidCreditsUsedCents: current.paidCreditsUsedCents,
  };
  cache.wallet = next;
  write(STORAGE.wallet, next);
  notify();
  mutationProxy.topupAccount?.({ baseCents: base, creditedPoints });
  return next;
}

/**
 * Update the account-level low-points alert. Passing `enabled: false`
 * disables it; setting `thresholdPoints` updates the trip wire.
 */
export function updateAccountAlert(alert: AccountLowBalanceAlert): AccountLowBalanceAlert {
  seedIfNeeded();
  const next: AccountLowBalanceAlert = {
    enabled: !!alert.enabled,
    thresholdPoints: Math.max(0, Math.round(alert.thresholdPoints ?? 0)),
  };
  cache.accountAlert = next;
  write(STORAGE.accountAlert, next);
  notify();
  mutationProxy.updateAccountAlert?.(next);
  return next;
}

/**
 * @deprecated Per-key credits are gone. Forwards to the account wallet so
 * legacy call sites keep working — the `id` argument is ignored. Use
 * `topupAccount({ baseCents })` directly in new code.
 */
export function addKeyCreditsCents(_id: string, amountCents: number): ApiKey | undefined {
  topupAccount({ baseCents: amountCents });
  return getKey(_id);
}

/**
 * @deprecated Per-key call quotas are gone. No-op under the wallet model
 * (calls are derived from wallet balance + trial). Returns the key as-is
 * so legacy callers don't break.
 */
export function addKeyCalls(id: string, _calls: number): ApiKey | undefined {
  return getKey(id);
}

// ─── Consumption (mock simulation only — UI doesn't drive this in demo) ────
/**
 * Simulate consuming `calls` API calls under the wallet model. The trial
 * pool is debited first while it is still valid; whatever can't be covered
 * by trial is paid for from the wallet at the per-call rate. Returns the
 * billing breakdown so callers can render an explanation.
 *
 * Used by the demo's "what happens when I press send?" affordance — not
 * called from any production code path.
 */
export interface ConsumeResult {
  trialCalls: number;
  paidCalls: number;
  paidCents: number;
  rejectedCalls: number;
  reason?: 'INSUFFICIENT_CREDITS' | 'KEY_MONTHLY_CAP';
}

export function consumeCalls(keyId: string, calls: number): ConsumeResult {
  seedIfNeeded();
  const want = Math.max(0, Math.floor(calls || 0));
  const result: ConsumeResult = {
    trialCalls: 0,
    paidCalls: 0,
    paidCents: 0,
    rejectedCalls: 0,
  };
  if (want <= 0) return result;
  const key = getKey(keyId);
  if (!key || key.status === 'revoked' || key.status === 'paused') {
    result.rejectedCalls = want;
    return result;
  }

  // Per-key monthly call-cap check first.
  if (key.monthlyCallCap != null && key.monthlyCallCap > 0) {
    const used = getKeyMonthlyCalls(keyId);
    if (used >= key.monthlyCallCap) {
      result.rejectedCalls = want;
      result.reason = 'KEY_MONTHLY_CAP';
      return result;
    }
  }

  const trial = cache.trial ?? DEFAULT_TRIAL;
  let remaining = want;

  // Step 1: drain the time-limited signup trial package.
  const totalLeft = isTrialExpired(trial)
    ? 0
    : Math.max(0, trial.totalLimit - trial.totalUsed);
  const trialAvailable = totalLeft;
  if (trialAvailable > 0) {
    const fromTrial = Math.min(trialAvailable, remaining);
    cache.trial = {
      ...trial,
      totalUsed: trial.totalUsed + fromTrial,
    };
    write(STORAGE.trial, cache.trial);
    result.trialCalls += fromTrial;
    remaining -= fromTrial;
  }

  // Step 2: anything left bills against the wallet.
  if (remaining > 0) {
    const w = cache.wallet ?? DEFAULT_WALLET;
    const balance = Math.max(0, w.paidCreditsCents - w.paidCreditsUsedCents);
    const perCall = MCP_CALL_RATE_PER_CALL_CENTS;
    const affordable = Math.floor(balance / Math.max(0.0001, perCall));
    const fromWallet = Math.min(affordable, remaining);
    if (fromWallet > 0) {
      const cost = Math.round(fromWallet * perCall);
      cache.wallet = {
        ...w,
        paidCreditsUsedCents: w.paidCreditsUsedCents + cost,
      };
      write(STORAGE.wallet, cache.wallet);
      result.paidCalls += fromWallet;
      result.paidCents += cost;
      remaining -= fromWallet;
    }
    if (remaining > 0) {
      result.rejectedCalls = remaining;
      result.reason = 'INSUFFICIENT_CREDITS';
    }
  }

  notify();
  return result;
}

/** Format a call count with US thousands separators. */
export function formatCalls(n: number): string {
  return Math.max(0, Math.floor(n || 0)).toLocaleString('en-US');
}

/**
 * Legacy single-axis setter, kept for backward compatibility with the old
 * "Modify call limit" modal. New UI should call `updateSpendLimit` with
 * the full set of axes.
 */
export function setMonthlyPointLimit(monthlyPointCap: number, warnAtPercents?: number[]): void {
  // updateSpendLimit fires the full-axis `updateAccountLimits` proxy hook,
  // so we don't dispatch a second backend write here.
  updateSpendLimit({
    monthlyPointCap:
      monthlyPointCap > 0 ? Math.max(0, Math.round(monthlyPointCap)) : null,
    warnAtPercents,
  });
}

/**
 * Update one or more axes of the account-wide point/call limit. Pass `null`
 * for an axis to mark it unlimited; omit it entirely to leave it
 * unchanged.
 */
export function updateSpendLimit(
  patch: Partial<Pick<SpendLimit, 'monthlyPointCap' | 'monthlyCallCap' | 'dailyPointCap' | 'dailyCallCap' | 'warnAtPercents' | 'resetDay'>>,
): void {
  seedIfNeeded();
  const current = cache.spendLimit!;
  const sanitiseCap = (v: number | null | undefined, fallback: number | null) => {
    if (v === undefined) return fallback;
    if (v === null) return null;
    const n = Math.max(0, Math.round(v));
    return n > 0 ? n : null;
  };
  const next: SpendLimit = {
    ...current,
    monthlyPointCap: sanitiseCap(patch.monthlyPointCap, current.monthlyPointCap),
    monthlyCallCap: sanitiseCap(patch.monthlyCallCap, current.monthlyCallCap),
    dailyPointCap: sanitiseCap(patch.dailyPointCap, current.dailyPointCap),
    dailyCallCap: sanitiseCap(patch.dailyCallCap, current.dailyCallCap),
    resetDay: patch.resetDay ?? current.resetDay,
    warnAtPercents: patch.warnAtPercents ?? current.warnAtPercents,
  };
  cache.spendLimit = next;
  write(STORAGE.spendLimit, next);
  notify();
  mutationProxy.updateAccountLimits?.(next);
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
  t: Omit<Transaction, 'id' | 'createdAt'>,
): Transaction {
  seedIfNeeded();
  const newT: Transaction = {
    ...t,
    id: uuid('txn_'),
    createdAt: new Date().toISOString(),
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
