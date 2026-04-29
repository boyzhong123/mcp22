// Data models aligned with the Account API doc (host:8081).

export type UserRole = 'user' | 'admin';
export type PeriodType = 'daily' | 'monthly';
export type OAuthProvider = 'google' | 'github' | 'microsoft';

export interface ApiUser {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
}

export interface Project {
  id: number;
  account_id: number;
  name: string;
  created_at: string;
}

export interface LowBalanceAlert {
  enabled: boolean;
  threshold_cents: number;
}

export interface ApiKey {
  id: number;
  user_id?: number;
  account_id?: number;
  name: string;
  api_key: string;
  enabled: boolean;
  status?: 'active' | 'paused' | 'revoked';
  is_starter?: boolean;
  project_id?: number;
  created_at: string;
  total_limit?: number;
  period_limit?: number;
  period_type?: PeriodType;
  total_used?: number;
  period_used?: number;
  balance_cents?: number;
  spend_cap_cents?: number | null;
  low_balance_alert?: LowBalanceAlert;
  limit?: { total_limit: number; period_limit: number; period_type: PeriodType };
}

export interface ApiKeyUsage {
  total_used: number;
  period_used: number;
  total_limit: number;
  period_limit: number;
  period_type: PeriodType;
  daily_breakdown: { date: string; count: number }[];
}

export interface ApiKeyUsageSummary {
  key_id: number;
  window_days: number;
  total_calls: number;
  daily_avg: number;
  daily_points: { date: string; calls: number }[];
}

export interface ApiKeyRunway {
  key_id: number;
  balance_cents: number;
  daily_burn_cents: number;
  estimated_days: number;
  runway_date: string;
}

export interface UsagePoint {
  time: string;
  calls: number;
}

export interface AccountSummary {
  month: string;
  total_calls: number;
  total_cost_cents: number;
  by_key: { key_id: number; key_name: string; calls: number; cost_cents: number }[];
}

export interface VolumeTier {
  up_to: number | null;
  discount: number;
  label: string;
}

export interface PricingInfo {
  mcp_call_rate_per_k: number;
  volume_tiers: VolumeTier[];
}

export interface SpendLimit {
  monthly_limit_cents: number;
  alert_threshold_pct: number;
}

export interface PaymentMethod {
  id: number;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  name?: string;
  is_default: boolean;
}

export type TransactionKind = 'credit-topup' | 'card-added' | string;
export type TransactionStatus = 'pending' | 'succeeded' | 'failed' | string;

export interface Transaction {
  id: number;
  amount_cents: number;
  status: TransactionStatus;
  method: string;
  last4?: string;
  kind: TransactionKind;
  invoice_number?: string;
  created_at: string;
  key_id?: number;
}

export interface TransactionListResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  page_size: number;
}

export type TeamRole = 'owner' | 'admin' | 'developer' | 'viewer';
export type TeamMemberStatus = 'active' | 'invited';

export interface TeamMember {
  id: number;
  email: string;
  name?: string;
  role: TeamRole;
  status: TeamMemberStatus;
}

export interface NotificationSettings {
  weekly_usage_report: boolean;
  payment_receipts: boolean;
  invoice_ready: boolean;
  spend_limit_alerts: boolean;
  low_balance_alerts_master: boolean;
  product_updates: boolean;
  security_alerts: boolean;
}

export interface WebhookEndpoint {
  id: number;
  url: string;
  secret: string;
  enabled_events: string[];
}

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  key_count: number;
  total_used: number;
  created_at?: string;
}

export interface AdminUserListResponse {
  users: AdminUser[];
  total: number;
  page: number;
  page_size: number;
}

export interface LoginResult {
  token: string;
  user: ApiUser;
  is_new_user?: boolean;
}
