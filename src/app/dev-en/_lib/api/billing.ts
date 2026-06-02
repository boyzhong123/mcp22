import { invalidate, request } from './client';
import type {
  AccountBalance,
  AccountLimits,
  BillingSummary,
  PricingInfo,
  TopupOrder,
  Transaction,
  TransactionListResponse,
} from './types';

// doc §5.1
export function balance(): Promise<AccountBalance> {
  return request<AccountBalance>('/billing/balance');
}

// doc §5.2
export function pricing(): Promise<PricingInfo> {
  return request<PricingInfo>('/billing/pricing');
}

// doc §5.10
export function summary(): Promise<BillingSummary> {
  return request<BillingSummary>('/billing/summary');
}

// doc §5.8 — account-level four-axis limits.
export function getLimits(): Promise<AccountLimits> {
  return request<AccountLimits>('/billing/limits');
}

// doc §5.9 — all fields optional; only the ones sent are updated.
export async function setLimits(patch: Partial<AccountLimits>): Promise<AccountLimits> {
  const data = await request<AccountLimits>('/billing/limits', { method: 'PUT', body: patch });
  invalidate('spend-limit');
  return data;
}

// doc §5.3 — create a PayPal order; returns the PayPal order id + our
// transaction id. The browser then drives buyer approval via the PayPal SDK.
export function createTopupOrder(params: { amount_cents: number }): Promise<TopupOrder> {
  return request<TopupOrder>('/billing/topups/order', { method: 'POST', body: params });
}

// doc §5.4 — capture an approved order by our transaction id.
export async function captureTopup(transactionId: number): Promise<Transaction> {
  const data = await request<Transaction>(`/billing/topups/${transactionId}/capture`, {
    method: 'POST',
  });
  invalidate('transactions');
  invalidate('keys');
  return data;
}

// doc §5.5
export interface TransactionsQuery {
  page?: number;
  page_size?: number;
  kind?: string;
  from?: string;
  to?: string;
}

export function listTransactions(q: TransactionsQuery = {}): Promise<TransactionListResponse> {
  return request<TransactionListResponse>('/billing/transactions', { query: q });
}

// doc §5.6
export function transactionDetail(id: number): Promise<Transaction> {
  return request<Transaction>(`/billing/transactions/${id}`);
}
