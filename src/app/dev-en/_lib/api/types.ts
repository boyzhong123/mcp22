// Data models aligned with the backend "Global API Portal" doc (api.md).
// Base URL: /api · JWT Bearer auth.

export type UserRole = 'user' | 'admin';
export type PeriodType = 'daily' | 'monthly';
// Backend OAuth providers. The doc only ships google + github today.
export type OAuthProvider = 'google' | 'github';

export interface ApiUser {
  id: number;
  account_id?: number;
  email: string;
  name: string;
  avatar_url?: string;
  method?: string; // 'email' | 'google' | 'github'
  role: UserRole;
  email_verified?: boolean;
  created_at: string;
  updated_at?: string;
}

// ─── API Keys (doc §3) ──────────────────────────────────────────────────────

export interface KeyLimits {
  daily_call_cap: number; // 0 = unlimited
  monthly_call_cap: number; // 0 = unlimited
  daily_evaluation_point_cap: number; // 0 = unlimited
  monthly_evaluation_point_cap: number; // 0 = unlimited
  /** @deprecated Legacy money cap; clients must not use this for traffic. */
  daily_spend_cap_mills?: number;
  /** @deprecated Legacy money cap; clients must not use this for traffic. */
  monthly_spend_cap_mills?: number;
}

export interface ApiKey {
  id: number;
  name: string;
  api_key: string; // masked in list, full on create/reveal/reset/rotate
  enabled: boolean;
  status?: 'active' | 'paused' | 'revoked';
  is_starter?: boolean;
  created_at: string;
  total_used?: number;
  period_used?: number;
  last_used_at?: string | null; // ISO 8601 or null
  limits?: KeyLimits | null; // null when unset
  env?: string;
}

// doc §3.7 GET /keys/:id/usage
export interface ApiKeyUsage {
  total_used: number;
  total_events: number;
  deducted_points: number;
  uncovered_points: number;
  period_used: number;
  period_limit: number;
  period_type: PeriodType;
  daily_breakdown: { date: string; count: number }[];
}

// ─── Usage (doc §11) ────────────────────────────────────────────────────────

// One CoreType bucket inside a UsagePoint. `core_type` is the stable grouping
// key (case-sensitive after trim); `display_name` is display-only.
export interface UsagePointCoreType {
  core_type: string;
  display_name: string;
  /** Optional display category; absent on older backend versions. */
  category?: string | null;
  /** Language code returned by the backend (`zh` or `en`). */
  language?: string | null;
  calls: number;
  events: number;
  /** Actually deducted points (SUM(deducted_points)). */
  evaluation_points: number;
  /** Theoretical points (= evaluation_points + uncovered_points). */
  required_points: number;
  /** Executed but not covered by balance; never clawed back. */
  uncovered_points: number;
}

export type EvaluationKernelStatus = 'active' | 'deprecated';

/** Stable product metadata from GET /catalog/evaluation-kernels. */
export interface EvaluationKernel {
  core_type: string;
  display_name: string;
  category_code: string;
  category_name: string;
  category_parent_code: string;
  language: string;
  billing_unit: string;
  modality: string;
  granularity: string;
  documentation_url: string;
  status: EvaluationKernelStatus;
  sort_order: number;
}

export interface EvaluationKernelListResponse {
  items: EvaluationKernel[];
  total: number;
}

// doc §11.1 — GET /usage/points returns a bare []UsagePoint (no envelope),
// aggregated by UTC day × API key × CoreType.
export interface UsagePoint {
  date: string; // UTC RFC3339, day precision
  key_id: number;
  api_key_id: number; // alias of key_id
  key_name: string;
  calls: number;
  events: number;
  evaluation_points: number;
  required_points: number;
  uncovered_points: number;
  core_types: UsagePointCoreType[];
}

// ─── Billing (evaluation-points doc v1.0) ───────────────────────────────────

export type PackageID = 'standard' | 'advanced' | 'flagship';
export type BatchStatus = 'active' | 'exhausted' | 'expired';

/** One top-up amount band (doc §5.1). Credited pts = usd × points_per_usd. */
export interface BillingPricingPackage {
  id: PackageID;
  min_amount_cents: number;
  /** Exclusive upper bound; flagship has null (unbounded). */
  max_amount_cents: number | null;
  points_per_usd: number;
}

/** Per-CoreType deduction rate (doc §5.1/§5.2). Empty list = default rate only. */
export interface CoreTypeRate {
  core_type: string;
  display_name: string;
  /** Optional display category; absent on older backend versions. */
  category?: string | null;
  /** Language code returned by the backend (`zh` or `en`). */
  language?: string | null;
  points_per_request: number;
}

// doc §5.2 GET /billing/core-type-pricing. This endpoint is independent of
// top-up pricing, so CoreType cost hints can still load when no recharge
// pricing version is configured.
export interface CoreTypePricingInfo {
  /** Deduction per request for CoreTypes without a specific rate. */
  default_points_per_request: number;
  core_type_pricing_version_id: number | null;
  core_type_pricing_version: number | null;
  core_type_rates: CoreTypeRate[];
}

/** Server-authoritative quote for `?amount_cents=` (doc §5.1). */
export interface PricingQuote {
  amount_cents: number;
  package_id: PackageID;
  /** Points this amount buys — already rounded up server-side. */
  quoted_points: number;
}

// doc §5.1 GET /billing/pricing[?amount_cents=...]
export interface PricingInfo {
  currency: string; // "USD"
  /** Paid batches' validity in days. */
  valid_days: number;
  /** Signup grant, in points (not calls). */
  signup_bonus_points: number;
  signup_bonus_valid_days: number;
  /** Deduction per request for CoreTypes without a specific rate. */
  default_points_per_request: number;
  topup_pricing_version_id: number;
  topup_pricing_version: number;
  topup_packages: BillingPricingPackage[];
  core_type_pricing_version_id: number | null;
  core_type_pricing_version: number | null;
  core_type_rates: CoreTypeRate[];
  /** Present only when the request carried `amount_cents`. */
  quote: PricingQuote | null;
}

/** One expiring point batch (doc §10). Signup-bonus batches have no order. */
export interface EvaluationPointBatch {
  id: number;
  transaction_id: number | null;
  package_id: PackageID | null;
  credited_points: number;
  used_points: number;
  remaining_points: number;
  expires_at: string;
  created_at: string;
  status: BatchStatus;
}

export interface EvaluationPointBatchListResponse {
  batches: EvaluationPointBatch[];
  page: number;
  page_size: number;
  total: number;
}

// doc §12 — account-level four-axis guardrails. PUT is a strict partial
// update: send only known fields (unknown keys → 400 INVALID_REQUEST).
export interface AccountLimits {
  monthly_evaluation_point_cap: number; // 0 = unlimited
  daily_evaluation_point_cap: number;
  daily_call_cap: number;
  monthly_call_cap: number;
  /** Unique ints in 1–100; [] disables thresholds. Config-only today. */
  warn_at_percents: number[];
}

/** UTC calendar-month rollup inside the billing summary (doc §8.1). */
export interface BillingSummaryCurrentMonth {
  granted_points: number;
  deducted_points: number;
  uncovered_points: number;
  expired_points: number;
  usage_count: number;
  usage_events: number;
  blocked_events: number;
}

// doc §8.1 GET /billing/summary — the authoritative balance source. The page's
// main balance must come from `evaluation_points_balance` (never batch sums).
export interface BillingSummary {
  as_of: string;
  evaluation_points_balance: number;
  evaluation_points_credited_total: number;
  evaluation_points_used_total: number;
  evaluation_points_expired_total: number;
  /** Points expiring within the next 7 days. */
  evaluation_points_expiring_soon: number;
  /** Earliest expiry among active batches; null when none. */
  evaluation_points_next_expiry_at: string | null;
  signup_bonus_total_points: number;
  signup_bonus_remaining_points: number;
  signup_bonus_granted_at: string | null;
  signup_bonus_expires_at: string | null;
  signup_bonus_active: boolean;
  /** @deprecated Compatibility with pre-2026-07-16 deployments. */
  trial_calls_total?: number;
  /** @deprecated Compatibility with pre-2026-07-16 deployments. */
  trial_calls_remaining?: number;
  /** @deprecated Compatibility with pre-2026-07-16 deployments. */
  trial_expires_at?: string | null;
  /** @deprecated Compatibility with pre-2026-07-16 deployments. */
  trial_active?: boolean;
  /** Same value as evaluation_points_balance. */
  available_points: number;
  signup_bonus_remaining: number;
  paid_points_remaining: number;
  /** Remaining points expiring within N days; the windows nest (3⊂7⊂30). */
  expiring_in_3_days: number;
  expiring_in_7_days: number;
  expiring_in_30_days: number;
  current_month: BillingSummaryCurrentMonth;
}

// ─── Usage charge/event detail (2026-07-16 contract §9) ───────────────────

export type UsageRateSource = 'configured' | 'default';
export type UsageChargeStatus =
  | 'fully_charged'
  | 'partially_charged'
  | 'uncovered_after_check';

export interface UsageCharge {
  id: number;
  account_id: number;
  api_key_id: number;
  key_id: number;
  api_key_name: string;
  key_name: string;
  core_type: string;
  core_type_display_name: string;
  count: number;
  pricing_version_id: number | null;
  pricing_version: number | null;
  points_per_request: number;
  rate_source: UsageRateSource;
  required_points: number;
  deducted_points: number;
  charged_points: number;
  uncovered_points: number;
  available_before: number;
  charge_status: UsageChargeStatus;
  occurred_at: string;
  created_at: string;
}

export interface UsageEvent extends UsageCharge {
  event_id: number;
  available_after: number;
  billing_status: UsageChargeStatus;
}

export interface UsageChargeListResponse {
  items: UsageCharge[];
  page: number;
  page_size: number;
  total: number;
}

export interface UsageEventListResponse {
  items: UsageEvent[];
  page: number;
  page_size: number;
  total: number;
}

export type TransactionStatus = 'pending' | 'succeeded' | 'failed';

// doc §9 Transaction object — one row per top-up order (never usage events).
// pending/failed rows keep the order quote in points_to_grant with all batch
// fields at 0 and null balance snapshots.
export interface Transaction {
  id: number;
  transaction_id: number;
  status: TransactionStatus;
  amount_cents: number;
  currency: string;
  method: string; // "paypal"
  /** Native alias of package_id. */
  tier_code: PackageID;
  package_id: PackageID;
  pricing_version_id: number;
  pricing_version: number;
  tier_min_amount_cents?: number;
  tier_max_amount_cents?: number | null;
  /** Exchange-rate snapshot fixed at order creation. */
  points_per_usd: number;
  validity_days: number;
  /** Points quoted when the order was created. */
  points_to_grant: number;
  /** Points actually granted by the batch (== credited_points today). */
  base_points: number;
  credited_points: number;
  /** Actually consumed (excludes expired): credited = used + remaining + expired. */
  used_points: number;
  remaining_points: number;
  /** Returned by list/detail; the capture response omits it. */
  expired_points?: number;
  point_balance_before: number | null;
  point_balance_after: number | null;
  paypal_order_id: string;
  paypal_capture_id: string | null;
  effective_at: string | null;
  effective_at_source?: string;
  points_expires_at: string | null;
  /** Third-party compat alias of points_expires_at. */
  points_expire_at: string | null;
  point_lot_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionListResponse {
  transactions: Transaction[];
  page: number;
  page_size: number;
  total: number;
}

// doc §6.1 POST /billing/topups/order — order created, points NOT yet
// credited; only a successful capture flips it to `succeeded`.
export interface TopupOrder {
  transaction_id: number;
  status: TransactionStatus;
  amount_cents: number;
  currency: string;
  /** Hand this to the PayPal JS SDK createOrder (NOT transaction_id). */
  paypal_order_id: string;
  paypal_capture_id: string | null;
  pricing_version_id: number;
  pricing_version: number;
  /** Tier matched server-side from amount_cents. */
  package_id: PackageID;
  tier_min_amount_cents?: number;
  tier_max_amount_cents?: number | null;
  points_per_usd: number;
  /** Points fixed into the order — the authoritative credited amount. */
  quoted_points: number;
  validity_days: number;
  effective_at: string | null;
  points_expires_at: string | null;
  point_lot_id: number | null;
  created_at: string;
  updated_at?: string;
}

// ─── Notifications (doc §13) ────────────────────────────────────────────────

export interface NotificationSettings {
  id?: number;
  account_id?: number;
  weekly_usage_report: boolean;
  payment_receipts: boolean;
  /** Master switch for low-POINTS alerts (name keeps "balance" for compat). */
  low_balance_alerts_master: boolean;
  /** Low-points threshold, non-negative, unit is points. */
  low_evaluation_points_threshold: number;
  product_updates: boolean;
  security_alerts: boolean;
}

// ─── Webhooks (doc §8) ──────────────────────────────────────────────────────

export interface WebhookEndpoint {
  id: number;
  account_id?: number;
  url: string;
  secret: string;
  enabled_events: string[]; // parsed from the JSON-string the API returns
  created_at?: string;
}

// ─── Admin (doc §9) — out of the developer portal scope, kept for typing. ────

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  method?: string;
  email_verified?: boolean;
  created_at?: string;
}

export interface AdminUserListResponse {
  users: AdminUser[];
  total: number;
  page: number;
  page_size: number;
}

// ─── Auth results ───────────────────────────────────────────────────────────

export interface LoginResult {
  token: string;
  user: ApiUser;
  is_new_user?: boolean;
}
