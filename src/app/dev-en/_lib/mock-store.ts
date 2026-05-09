'use client';

/**
 * Fully client-side, localStorage-backed mock data store for the English
 * developer preview. No network calls, no API keys are real — everything
 * resets when the user clears site data.
 *
 * Billing model (account wallet, calls + dollars):
 *
 *   ACCOUNT WALLET — single source of truth for paid credit. Top-ups grow
 *   `paidCreditsCents`; consumption grows `paidCreditsUsedCents`. All keys
 *   on the account share this pool. Top-up amount tiers grant a bonus on
 *   top of the base amount (see `_lib/topup-bonus.ts`).
 *
 *   TRIAL ALLOWANCE — every new account is granted 30 calls/day + 900
 *   total lifetime, free of charge. Trial is consumed first; once exhausted
 *   the account falls back to wallet credit (and stops serving once that
 *   too is empty).
 *
 *   ACCOUNT LOW-BALANCE ALERT — single account-level toggle that emails
 *   when the wallet balance drops below a configured threshold.
 *
 *   API KEYS — Lightweight access tokens that all draw from the account
 *   wallet. The first key on an account is flagged `isStarter: true` and
 *   is provisioned automatically at signup; it has no special billing
 *   behaviour (no per-key free allowance) and cannot be deleted. Optional
 *   per-key safety nets:
 *     - `spendCapCents`: monthly spend cap in cents (null = uncapped)
 *     - `monthlyCallCap`: monthly call-count cap (null = uncapped)
 *
 *   Account-level state also covers the global monthly spend limit (cross-
 *   key safety net) and saved payment methods.
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
  /**
   * Optional monthly spend cap in cents (per-key safety net). `null` =
   * uncapped. Independent from the account-wide `SpendLimit`.
   */
  spendCapCents: number | null;
  /**
   * Optional monthly call-count cap (per-key safety net). `null` = uncapped.
   * When the key's calls in the current month hit this cap, it stops
   * serving traffic until the next billing cycle or the cap is raised.
   */
  monthlyCallCap: number | null;
  /**
   * Optional daily $ cap for this key; `null` = uncapped. Resets at
   * midnight UTC. Useful when a key is exposed to user traffic that can
   * spike unexpectedly.
   */
  dailySpendCapCents?: number | null;
  /**
   * Optional daily call-count cap for this key; `null` = uncapped.
   * Resets at midnight UTC.
   */
  dailyCallCap?: number | null;

  // ─── Legacy fields (account-wallet model deprecates these) ─────────────
  // Preserved so the bridge and a few historical helpers keep compiling.
  // - `freeDaily*` / `freeTotal*` are mirrored from the account TrialAllowance
  //   on the starter key only, and stay at 0 elsewhere.
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
 * Top-ups grow `paidCreditsCents` (sum of base + bonus); usage grows
 * `paidCreditsUsedCents`. Remaining balance is the simple difference.
 * `bonusReceivedCents` is purely informational (lifetime bonus accrued).
 */
export interface AccountWallet {
  paidCreditsCents: number;
  paidCreditsUsedCents: number;
  bonusReceivedCents: number;
}

/**
 * Account-level free trial. Granted on signup and consumed before wallet
 * credit. `dailyLimit` resets at UTC midnight; `totalLimit` is a lifetime
 * cap that never replenishes. Once both are exhausted the account must
 * top up to keep serving traffic.
 */
export interface TrialAllowance {
  dailyLimit: number;
  dailyUsed: number;
  dailyResetAt: string; // YYYY-MM-DD UTC
  totalLimit: number;
  totalUsed: number;
}

/** Starter trial seed defaults. Easy to tune in one place. */
export const TRIAL_DEFAULT_DAILY = 30;
export const TRIAL_DEFAULT_TOTAL = 900;

/**
 * Single account-level low-balance email alert. The previous per-key
 * version has been retired; one threshold across the wallet is plenty.
 */
export interface AccountLowBalanceAlert {
  enabled: boolean;
  thresholdCents: number;
}

export interface UsagePoint {
  date: string; // YYYY-MM-DD (UTC)
  keyId: string;
  model: string;
  calls: number;
  costCents: number;
  savingsCents: number;
}

/**
 * Account-wide guardrails.
 *
 * Mirrors the per-key shape (`spendCapCents` / `monthlyCallCap`) but adds
 * daily counterparts so users can throttle a noisy day without blowing
 * the entire month. Every cap is independently nullable — `null` means
 * "no limit on that axis", which is what the UI surfaces as
 * "Unlimited".
 *
 * Historical note: the original schema only had `monthlyCapCents`, and
 * for a stretch the field was overloaded as "monthly call cap" (with 1
 * cent ≡ 1 call). That hack is gone now: dollars and calls live in
 * separate fields. The legacy field is still read so older
 * localStorage snapshots migrate cleanly via `seedIfNeeded`.
 */
export interface SpendLimit {
  /** Monthly $ cap; null = unlimited. */
  monthlyCapCents: number | null;
  /** Monthly call-count cap; null = unlimited. */
  monthlyCallCap: number | null;
  /** Daily $ cap; null = unlimited. */
  dailyCapCents: number | null;
  /** Daily call-count cap; null = unlimited. */
  dailyCallCap: number | null;
  /** Day-of-month the monthly counter resets. Always 1 today. */
  resetDay: number;
  /** Email warning thresholds for the monthly $ cap (e.g. [50, 75, 90]). */
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
// the seeder re-populates fresh data in the new shape.
// v8: account-wallet model. Per-key paid credits, free allowance and
// low-balance alerts have been promoted to account-level slots
// (`wallet`, `trial`, `accountAlert`); `monthlyCallCap` is a new per-key
// safety net. Old ApiKey records still parse but their billing-related
// fields are ignored, so we wipe + reseed.
const SCHEMA_VERSION = 10;
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
  projects: Project[] | null;
  keys: ApiKey[] | null;
  usage: UsagePoint[] | null;
  transactions: Transaction[] | null;
  spendLimit: SpendLimit | null;
  paymentMethods: PaymentMethod[] | null;
  teamMembers: TeamMember[] | null;
  notifications: NotificationSettings | null;
  wallet: AccountWallet | null;
  trial: TrialAllowance | null;
  accountAlert: AccountLowBalanceAlert | null;
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
  wallet: null,
  trial: null,
  accountAlert: null,
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
      spendCapCents?: number | null;
      monthlyCallCap?: number | null;
      lowBalanceAlert?: LowBalanceAlert | null;
    },
  ) => void;
  /** @deprecated Account-wallet model — wallet topups are local-only. */
  addKeyCreditsCents?: (mockId: string, amountCents: number) => void;
  /** @deprecated Account-wallet model — wallet topups are local-only. */
  addKeyCalls?: (mockId: string, calls: number) => void;
  /** Account-level wallet top-up (base + bonus already merged). */
  topupAccount?: (input: { baseCents: number; bonusCents: number }) => void;
  /** Account-level low-balance alert update. */
  updateAccountAlert?: (alert: AccountLowBalanceAlert) => void;
  inviteTeamMember?: (input: { email: string; role: TeamRole; name?: string }) => void;
  updateTeamMemberRole?: (mockId: string, role: TeamRole) => void;
  removeTeamMember?: (mockId: string) => void;
  resendTeamInvite?: (mockId: string) => void;
  updateNotificationSettings?: (patch: Partial<NotificationSettings>) => void;
  setSpendLimitCents?: (cents: number, warnAtPercents?: number[]) => void;
};

let mutationProxy: MutationProxy = {};
export function __setMutationProxy(p: MutationProxy): void {
  mutationProxy = p;
}

// ─── Bridge: external cache replacement (used by mock-store-bridge.ts to
// hydrate from real backend API). Marks cache as seeded so seedIfNeeded()
// doesn't overwrite real data with seed data on next call.
export function __replaceCache(partial: {
  projects?: Project[];
  keys?: ApiKey[];
  usage?: UsagePoint[];
  transactions?: Transaction[];
  spendLimit?: SpendLimit;
  paymentMethods?: PaymentMethod[];
  teamMembers?: TeamMember[];
  notifications?: NotificationSettings;
  wallet?: AccountWallet;
  trial?: TrialAllowance;
  accountAlert?: AccountLowBalanceAlert;
}): void {
  if (partial.projects !== undefined) cache.projects = partial.projects;
  if (partial.keys !== undefined) cache.keys = partial.keys;
  if (partial.usage !== undefined) cache.usage = partial.usage;
  if (partial.transactions !== undefined) cache.transactions = partial.transactions;
  if (partial.spendLimit !== undefined) cache.spendLimit = partial.spendLimit;
  if (partial.paymentMethods !== undefined) cache.paymentMethods = partial.paymentMethods;
  if (partial.teamMembers !== undefined) cache.teamMembers = partial.teamMembers;
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
 *
 * Under the account-wallet model:
 *   - Wallet seeded with $87.50 remaining of $100 paid + $15 bonus accrued.
 *   - Trial allowance partly consumed (18/30 today, 420/900 lifetime).
 *   - 6 keys total: 1 starter (default), 5 paid demonstrating different
 *     monthly-cap, monthly-call-cap and revoked states.
 *   - Account-level low-balance alert enabled with threshold $5.
 *
 *   Overview / Billing / Keys: surface the wallet, trial, and per-key
 *   monthly-cap progress.
 *   Usage: 120 days of stacked data with a spike + weekend trough.
 *   Recharge history: 4 credit top-ups (with bonus where applicable) +
 *     2 card-added events over ~45 days.
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
    // Defaults describe a paid key — no per-key billing state. Overrides
    // flip the starter flag, set caps, etc.
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
        spendCapCents: null,
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
        projectId: 'proj_internal',
        createdAt: new Date(now - 115 * 86400000).toISOString(),
        lastUsedAt: new Date(now - 42 * 60000).toISOString(),
        isStarter: true,
      }),
      // 1. Healthy production key with a per-key spend cap. The wallet
      //    funds it; the cap protects against a runaway bug on this key.
      mk({
        name: 'Web App — Prod',
        env: 'production',
        projectId: 'proj_production',
        createdAt: new Date(now - 85 * 86400000).toISOString(),
        lastUsedAt: new Date(now - 2 * 60000).toISOString(),
        spendCapCents: 25000, // $250/mo cap
        monthlyCallCap: 80000, // 80K calls/mo cap
      }),
      // 2. Mobile prod — high-traffic key bumping into its monthly call
      //    cap (about 60% used this month against a 50K cap).
      mk({
        name: 'Mobile — Prod',
        env: 'production',
        projectId: 'proj_production',
        createdAt: new Date(now - 70 * 86400000).toISOString(),
        lastUsedAt: new Date(now - 6 * 3600000).toISOString(),
        monthlyCallCap: 50000,
      }),
      // 3. Secondary prod — no cap configured.
      mk({
        name: 'Web App — Prod (secondary)',
        env: 'production',
        projectId: 'proj_production',
        createdAt: new Date(now - 45 * 86400000).toISOString(),
        lastUsedAt: new Date(now - 12 * 60000).toISOString(),
      }),
      // 4. Staging — recently created, light usage, capped tight to keep
      //    test runs from chewing through wallet balance.
      mk({
        name: 'Staging',
        env: 'development',
        projectId: 'proj_staging',
        createdAt: new Date(now - 22 * 86400000).toISOString(),
        lastUsedAt: null,
        monthlyCallCap: 5000,
      }),
      // 5. Load test — uncapped dev key for occasional bursts.
      mk({
        name: 'Load test',
        env: 'development',
        projectId: 'proj_staging',
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
      projectId: cache.projects?.find((p) => p.id === 'proj_internal')?.id
        ?? cache.projects?.[0]?.id
        ?? 'proj_internal',
      secret: starterSecret,
      maskedSecret: maskSecret(starterSecret),
      createdAt: new Date(now).toISOString(),
      lastUsedAt: null,
      status: 'active',
      isStarter: true,
      spendCapCents: null,
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
  // Migration note: legacy snapshots stored a single `monthlyCapCents`
  // number (sometimes overloaded as "monthly calls"). We read whatever is
  // there, then fill the new daily / call-cap fields with `null`
  // (unlimited) so older sessions don't suddenly start rejecting traffic.
  const existingLimit = read<Partial<SpendLimit> | null>(STORAGE.spendLimit, null);
  if (!existingLimit) {
    const seeded: SpendLimit = {
      // $200 default lets the demo's ~$90-110/mo spend land at ~50% used
      // (meaningful amber zone for the Overview KPI and Billing chart).
      monthlyCapCents: 200_00,
      monthlyCallCap: null,
      dailyCapCents: null,
      dailyCallCap: null,
      resetDay: 1,
      warnAtPercents: [50, 75, 90],
    };
    write(STORAGE.spendLimit, seeded);
    cache.spendLimit = seeded;
  } else {
    const migrated: SpendLimit = {
      monthlyCapCents:
        existingLimit.monthlyCapCents != null
          ? existingLimit.monthlyCapCents
          : null,
      monthlyCallCap:
        existingLimit.monthlyCallCap != null
          ? existingLimit.monthlyCallCap
          : null,
      dailyCapCents:
        existingLimit.dailyCapCents != null ? existingLimit.dailyCapCents : null,
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
  // key, so transactions no longer carry keyId/projectId. We mix in two
  // bonus tiers ($100 → +15% and $50 → +10%) to demo the bonus column on
  // the History page, plus a couple of card-added events for variety.
  const existingTxn = read<Transaction[] | null>(STORAGE.transactions, null);
  if (!existingTxn) {
    const mkTxn = (o: Omit<Transaction, 'id' | 'invoiceNumber'>): Transaction => ({
      ...o,
      id: uuid('txn_'),
      invoiceNumber: 'INV-' + (10000 + Math.floor(Math.random() * 89999)),
    });

    const seeded: Transaction[] = [
      // newest first
      mkTxn({
        createdAt: new Date(now - 1 * 86400000).toISOString(),
        amountCents: 2000,
        status: 'succeeded',
        method: 'apple-pay',
        last4: '•••',
        description: 'Wallet top-up · $20.00',
        kind: 'credit-topup',
      }),
      mkTxn({
        createdAt: new Date(now - 6 * 86400000).toISOString(),
        amountCents: 10000,
        status: 'succeeded',
        method: 'card',
        last4: '4242',
        description: 'Wallet top-up · $100.00 (+$15.00 bonus)',
        kind: 'credit-topup',
      }),
      mkTxn({
        createdAt: new Date(now - 10 * 86400000).toISOString(),
        amountCents: 2000,
        status: 'succeeded',
        method: 'cashapp',
        last4: 'cash',
        description: 'Cash App Pay · Wallet top-up · $20.00',
        kind: 'credit-topup',
      }),
      mkTxn({
        createdAt: new Date(now - 14 * 86400000).toISOString(),
        amountCents: 2500,
        status: 'succeeded',
        method: 'link',
        last4: '•••',
        description: 'Wallet top-up · $25.00',
        kind: 'credit-topup',
      }),
      mkTxn({
        createdAt: new Date(now - 18 * 86400000).toISOString(),
        amountCents: 5000,
        status: 'succeeded',
        method: 'paypal',
        last4: 'ppal',
        description: 'PayPal · Wallet top-up · $50.00 (+$5.00 bonus)',
        kind: 'credit-topup',
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
        description: 'Wallet top-up · $50.00 (+$5.00 bonus)',
        kind: 'credit-topup',
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

  // ── Account wallet ── ($87.50 left of $100 paid + $15 bonus accrued)
  const existingWallet = read<AccountWallet | null>(STORAGE.wallet, null);
  if (!existingWallet) {
    const seeded: AccountWallet = {
      // Total credits ever loaded (paid base + bonus): $100 + $15 = $115
      paidCreditsCents: 11500,
      // Already consumed: $115 − $87.50 remaining = $27.50
      paidCreditsUsedCents: 2750,
      bonusReceivedCents: 1500,
    };
    write(STORAGE.wallet, seeded);
    cache.wallet = seeded;
  } else {
    cache.wallet = existingWallet;
  }

  // ── Trial allowance ── (mid-consumption: 18/30 today, 420/900 lifetime)
  const existingTrial = read<TrialAllowance | null>(STORAGE.trial, null);
  if (!existingTrial) {
    const seeded: TrialAllowance = {
      dailyLimit: TRIAL_DEFAULT_DAILY,
      dailyUsed: 18,
      dailyResetAt: today,
      totalLimit: TRIAL_DEFAULT_TOTAL,
      totalUsed: 420,
    };
    write(STORAGE.trial, seeded);
    cache.trial = seeded;
  } else {
    cache.trial = existingTrial;
  }

  // ── Account-level low-balance alert ── ($5 threshold, enabled)
  const existingAlert = read<AccountLowBalanceAlert | null>(STORAGE.accountAlert, null);
  if (!existingAlert) {
    const seeded: AccountLowBalanceAlert = {
      enabled: true,
      thresholdCents: 500,
    };
    write(STORAGE.accountAlert, seeded);
    cache.accountAlert = seeded;
  } else {
    cache.accountAlert = existingAlert;
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
  mutationProxy.inviteTeamMember?.(input);
  return member;
}

export function updateTeamMemberRole(id: string, role: TeamRole): void {
  seedIfNeeded();
  cache.teamMembers = (cache.teamMembers ?? []).map((m) =>
    m.id === id && m.role !== 'owner' ? { ...m, role } : m,
  );
  write(STORAGE.teamMembers, cache.teamMembers);
  notify();
  mutationProxy.updateTeamMemberRole?.(id, role);
}

export function removeTeamMember(id: string): void {
  seedIfNeeded();
  cache.teamMembers = (cache.teamMembers ?? []).filter(
    (m) => !(m.id === id && m.role !== 'owner'),
  );
  write(STORAGE.teamMembers, cache.teamMembers);
  notify();
  mutationProxy.removeTeamMember?.(id);
}

export function resendTeamInvite(id: string): void {
  seedIfNeeded();
  // Mock: just bump createdAt so the UI shows "Invited just now"
  cache.teamMembers = (cache.teamMembers ?? []).map((m) =>
    m.id === id ? { ...m, createdAt: new Date().toISOString() } : m,
  );
  write(STORAGE.teamMembers, cache.teamMembers);
  notify();
  mutationProxy.resendTeamInvite?.(id);
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
  paidCreditsCents: 0,
  paidCreditsUsedCents: 0,
  bonusReceivedCents: 0,
};
const DEFAULT_TRIAL: TrialAllowance = {
  dailyLimit: TRIAL_DEFAULT_DAILY,
  dailyUsed: 0,
  dailyResetAt: todayUtc(),
  totalLimit: TRIAL_DEFAULT_TOTAL,
  totalUsed: 0,
};
const DEFAULT_ACCOUNT_ALERT: AccountLowBalanceAlert = {
  enabled: false,
  thresholdCents: 500,
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

/** Wallet balance in cents (paid + bonus credits, minus consumed). */
export function getAccountBalanceCents(): number {
  const w = getWallet();
  return Math.max(0, w.paidCreditsCents - w.paidCreditsUsedCents);
}

export interface AccountTrialRemaining {
  dailyLeft: number;
  totalLeft: number;
  dailyExhausted: boolean;
  totalExhausted: boolean;
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
  const dailyLeft = Math.max(0, t.dailyLimit - t.dailyUsed);
  const totalLeft = Math.max(0, t.totalLimit - t.totalUsed);
  const next: AccountTrialRemaining = {
    dailyLeft,
    totalLeft,
    dailyExhausted: dailyLeft <= 0,
    totalExhausted: totalLeft <= 0,
  };
  _trialRemainingFor = t;
  _trialRemainingValue = next;
  return next;
}

/** USD cost per 1 call (mirror of MCP_CALL_RATE_PER_K but per-call). */
export const MCP_CALL_RATE_PER_CALL_DOLLARS = MCP_CALL_RATE_PER_K / 1000;
/** USD cents per 1 call. Default: $0.001 → 0.1 cent. */
export const MCP_CALL_RATE_PER_CALL_CENTS = MCP_CALL_RATE_PER_CALL_DOLLARS * 100;

/**
 * Estimated calls remaining at the current rate, summing trial allowance
 * (lifetime cap or daily cap, whichever is the binding limit) plus the
 * dollar-converted wallet balance.
 *
 * The "calls available right now" view uses `min(trialDailyLeft +
 * trialTotalLeft - already-counted, walletConverted)` — but for a
 * back-of-envelope sum we add trial.totalLeft + walletCalls. Good enough
 * for KPI surfaces.
 */
export function getAccountCallsRemaining(): number {
  const trial = getAccountTrialRemaining();
  const walletCalls = Math.floor(
    getAccountBalanceCents() / Math.max(0.0001, MCP_CALL_RATE_PER_CALL_CENTS),
  );
  return trial.totalLeft + walletCalls;
}

/**
 * Total calls ever provisioned to this account: trial total + wallet
 * (purchased + bonus) converted to calls. Stable across consumption.
 */
export function getAccountCallsTotal(): number {
  const trial = getTrial();
  const w = getWallet();
  const walletCalls = Math.floor(
    w.paidCreditsCents / Math.max(0.0001, MCP_CALL_RATE_PER_CALL_CENTS),
  );
  return trial.totalLimit + walletCalls;
}

/** True if wallet balance has dropped below the configured alert threshold. */
export function isAccountLowBalance(): boolean {
  const a = getAccountAlert();
  if (!a.enabled) return false;
  const bal = getAccountBalanceCents();
  return bal > 0 && bal <= a.thresholdCents;
}

/** This-month call count for one key, derived from usage history. */
export function getKeyMonthlyCalls(keyId: string): number {
  const ym = new Date().toISOString().slice(0, 7);
  return getUsage()
    .filter((p) => p.keyId === keyId && p.date.startsWith(ym))
    .reduce((acc, p) => acc + (p.calls ?? 0), 0);
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
  return getAccountTrialRemaining().totalLeft > 0;
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
  // Wallet model: runway is funded by the **account** balance (any key
  // can deplete it). The keyId remains in the signature so the burn rate
  // is still computed per-key, but the dollar pool is shared.
  const remaining = getAccountBalanceCents();
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
// `env` is retained on the data model for back-compat with usage / billing
// charts that still slice by environment, but the UI no longer asks for it
// on creation — every new key defaults to `'production'`. Callers that
// pass an explicit env (legacy paths, tests) keep working as before.
export function createKey(
  name: string,
  env: Environment = 'production',
  projectId?: string,
): ApiKey {
  seedIfNeeded();
  const resolvedProjectId =
    projectId ?? cache.projects?.[0]?.id ?? 'proj_default';
  const secret = randomSecret(env);
  const today = todayUtc();
  const newKey: ApiKey = {
    id: uuid('key_'),
    name: name.trim() || 'Untitled key',
    env,
    projectId: resolvedProjectId,
    secret,
    maskedSecret: maskSecret(secret),
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
    status: 'active',
    isStarter: false,
    spendCapCents: null,
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
    spendCapCents?: number | null;
    monthlyCallCap?: number | null;
    dailySpendCapCents?: number | null;
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
      ...(patch.spendCapCents !== undefined
        ? { spendCapCents: patch.spendCapCents }
        : {}),
      ...(patch.monthlyCallCap !== undefined
        ? { monthlyCallCap: patch.monthlyCallCap }
        : {}),
      ...(patch.dailySpendCapCents !== undefined
        ? { dailySpendCapCents: patch.dailySpendCapCents }
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
 * Top up the account wallet. `baseCents` is the amount the user paid;
 * `bonusCents` is the matching bonus granted by the active satte tier
 * (see `_lib/topup-bonus.ts`). Both land in `paidCreditsCents`; the
 * bonus is also tracked separately on `bonusReceivedCents` so the UI
 * can show "lifetime bonus accrued".
 *
 * Returns the new wallet snapshot.
 */
export function topupAccount(input: {
  baseCents: number;
  bonusCents?: number;
}): AccountWallet {
  seedIfNeeded();
  const base = Math.max(0, Math.round(input.baseCents));
  const bonus = Math.max(0, Math.round(input.bonusCents ?? 0));
  const current = cache.wallet ?? DEFAULT_WALLET;
  const next: AccountWallet = {
    paidCreditsCents: current.paidCreditsCents + base + bonus,
    paidCreditsUsedCents: current.paidCreditsUsedCents,
    bonusReceivedCents: current.bonusReceivedCents + bonus,
  };
  cache.wallet = next;
  write(STORAGE.wallet, next);
  notify();
  mutationProxy.topupAccount?.({ baseCents: base, bonusCents: bonus });
  return next;
}

/**
 * Update the account-level low-balance alert. Passing `enabled: false`
 * disables it; setting `thresholdCents` updates the trip wire.
 */
export function updateAccountAlert(alert: AccountLowBalanceAlert): AccountLowBalanceAlert {
  seedIfNeeded();
  const next: AccountLowBalanceAlert = {
    enabled: !!alert.enabled,
    thresholdCents: Math.max(0, Math.round(alert.thresholdCents ?? 0)),
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
 * pool is debited first (daily then lifetime); whatever can't be covered
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

  // Step 1: drain trial — daily cap binds first, then lifetime.
  const dailyLeft = Math.max(0, trial.dailyLimit - trial.dailyUsed);
  const totalLeft = Math.max(0, trial.totalLimit - trial.totalUsed);
  const trialAvailable = Math.min(dailyLeft, totalLeft);
  if (trialAvailable > 0) {
    const fromTrial = Math.min(trialAvailable, remaining);
    cache.trial = {
      ...trial,
      dailyUsed: trial.dailyUsed + fromTrial,
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
export function setSpendLimitCents(monthlyCapCents: number, warnAtPercents?: number[]): void {
  updateSpendLimit({
    monthlyCapCents:
      monthlyCapCents > 0 ? Math.max(0, Math.round(monthlyCapCents)) : null,
    warnAtPercents,
  });
  mutationProxy.setSpendLimitCents?.(monthlyCapCents, warnAtPercents);
}

/**
 * Update one or more axes of the account-wide spend limit. Pass `null`
 * for an axis to mark it unlimited; omit it entirely to leave it
 * unchanged.
 */
export function updateSpendLimit(
  patch: Partial<Pick<SpendLimit, 'monthlyCapCents' | 'monthlyCallCap' | 'dailyCapCents' | 'dailyCallCap' | 'warnAtPercents' | 'resetDay'>>,
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
    monthlyCapCents: sanitiseCap(patch.monthlyCapCents, current.monthlyCapCents),
    monthlyCallCap: sanitiseCap(patch.monthlyCallCap, current.monthlyCallCap),
    dailyCapCents: sanitiseCap(patch.dailyCapCents, current.dailyCapCents),
    dailyCallCap: sanitiseCap(patch.dailyCallCap, current.dailyCallCap),
    resetDay: patch.resetDay ?? current.resetDay,
    warnAtPercents: patch.warnAtPercents ?? current.warnAtPercents,
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
