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
  daily_spend_cap_mills: number; // 0 = unlimited
  monthly_spend_cap_mills: number; // 0 = unlimited
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
  env?: string; // e.g. "production"
  last_used_at?: string | null; // ISO 8601 or null
  limits?: KeyLimits | null; // null when unset
}

// doc §3.7 GET /keys/:id/usage
export interface ApiKeyUsage {
  total_used: number;
  period_used: number;
  period_limit: number;
  period_type: PeriodType;
  daily_breakdown: { date: string; count: number }[];
}

// doc §3.14 GET /keys/:id/usage/summary
export interface ApiKeyUsageSummary {
  calls: number;
  cost_mills: number;
  savings_mills: number;
  avg_daily_net_mills: number;
  days_with_usage: number;
}

// ─── Usage (doc §4) ─────────────────────────────────────────────────────────

// doc §4.1 — GET /usage/points returns a bare []UsagePoint.
export interface UsagePoint {
  id: number;
  account_id: number;
  key_id: number;
  date: string; // ISO 8601, day precision
  model: string; // default "mcp-call"
  calls: number;
  cost_mills: number;
  savings_mills: number;
}

export interface VolumeTier {
  up_to: number | null; // null = no upper bound
  discount: number;
  label: string;
}

// doc §4.2 GET /usage/account-summary
export interface AccountSummary {
  calls_this_month: number;
  spend_mills_this_month: number;
  savings_mills_this_month: number;
  current_volume_tier: VolumeTier;
  active_keys: number;
}

// ─── Billing (doc §5) ───────────────────────────────────────────────────────

// doc §5.1 GET /billing/balance
export interface AccountBalance {
  balance_mills: number; // 1 USD = 1000 mills (0.1 cent each)
  balance_usd: string; // formatted, e.g. "$5.00"
  /** Canonical product balance; money fields are reconciliation metadata. */
  evaluation_points_balance: number;
  evaluation_points_used?: number;
  evaluation_points_expires_at?: string | null;
}

export interface PricingTier {
  up_to: number | null;
  unit_cents: number;
  label: string;
}

// doc §5.2 GET /billing/pricing
export interface PricingInfo {
  tiers: PricingTier[];
  min_topup_cents: number;
  topup_presets: number[];
  pricing_mode: string;
  trial_calls: number;
  trial_days: number;
  evaluation_point_rules?: {
    base_points_per_usd: number;
    word_sentence_points_per_use: number;
    paragraph_points_per_use: number;
    valid_days: number;
  };
  topup_packages?: EvaluationPointPackage[];
}

export interface EvaluationPointPackage {
  id: 'standard' | 'advanced' | 'flagship';
  min_amount_cents: number;
  bonus_percent: number;
  preset_amount_cents: number[];
}

/** One expiring batch created by a successful top-up. */
export interface EvaluationPointBatch {
  id: string;
  transaction_id: number;
  package_id: 'standard' | 'advanced' | 'flagship';
  credited_points: number;
  used_points: number;
  remaining_points: number;
  expires_at: string;
  created_at: string;
  status: 'active' | 'exhausted' | 'expired';
}

export interface EvaluationPointBatchListResponse {
  batches: EvaluationPointBatch[];
  total: number;
}

// doc §5.8 / §5.9 — account-level four-axis limits.
export interface AccountLimits {
  monthly_spend_cap_mills: number; // 0 = unlimited
  daily_spend_cap_mills: number;
  daily_call_cap: number;
  monthly_call_cap: number;
  warn_at_percents: number[];
}

// doc §5.10 GET /billing/summary
export interface BillingSummary {
  balance_mills: number;
  balance_usd: string;
  month_spend_mills: number;
  month_call_count: number;
  transaction_count_month: number;
  trial_active: boolean;
  trial_calls_remaining: number;
  trial_expires_at: string;
  trial_days_remaining: number;
  trial_burn_rate: number;
  trial_est_days_left: number;
  current_tier: string; // base | mid | high
  current_unit_mills: number;
  next_tier_at: number;
  calls_to_next_tier: number;
  est_runway_days: number;
  active_keys: number;
  paid_credits_mills: number;
  paid_credits_used_mills: number;
  /** Point-led fields used by billing, recharge history, and overview UI. */
  evaluation_points_balance: number;
  evaluation_points_credited_total: number;
  evaluation_points_used_total: number;
  evaluation_points_expiring_soon?: number;
  evaluation_points_next_expiry_at?: string | null;
}

export type TransactionKind = 'balance-topup' | 'credit-topup' | string;
export type TransactionStatus = 'pending' | 'succeeded' | 'failed' | string;

// doc §5.5 / §5.6 Transaction object
export interface Transaction {
  id: number;
  user_id?: number;
  account_id?: number;
  amount_cents: number;
  status: TransactionStatus;
  method: string; // "paypal"
  description?: string;
  invoice_number?: string;
  kind: TransactionKind;
  balance_before?: number;
  balance_after?: number;
  package_id?: 'standard' | 'advanced' | 'flagship';
  base_points?: number;
  bonus_points?: number;
  credited_points?: number;
  point_balance_before?: number;
  point_balance_after?: number;
  points_expire_at?: string | null;
  created_at: string;
}

export interface TransactionListResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  page_size: number;
}

// doc §5.3 POST /billing/topups/order
export interface TopupOrder {
  paypal_order_id: string;
  transaction_id: number;
  amount_cents: number;
  package_id: 'standard' | 'advanced' | 'flagship';
  quoted_points: number;
}

// ─── Notifications (doc §6) ─────────────────────────────────────────────────

export interface NotificationSettings {
  weekly_usage_report: boolean;
  payment_receipts: boolean;
  invoice_ready?: boolean;
  spend_limit_alerts: boolean;
  low_balance_alerts_master: boolean;
  low_balance_threshold_cents: number;
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
