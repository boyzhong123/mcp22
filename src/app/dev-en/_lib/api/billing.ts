import { invalidate, request } from './client';
import type {
  AccountLimits,
  BillingSummary,
  CoreTypePricingInfo,
  EvaluationPointBatch,
  EvaluationPointBatchListResponse,
  PackageID,
  PricingInfo,
  TopupOrder,
  Transaction,
  TransactionListResponse,
  TransactionStatus,
} from './types';

// doc §5.1 — pass amount_cents to also get the server-authoritative quote.
// Credited points MUST come from quote.quoted_points (or the order's
// quoted_points), never from a client-side formula.
export function pricing(amountCents?: number): Promise<PricingInfo> {
  return request<PricingInfo>('/billing/pricing', {
    query: amountCents && amountCents > 0 ? { amount_cents: Math.round(amountCents) } : undefined,
  });
}

// doc §5.2 — independent CoreType point prices for evaluation descriptions,
// task creation, and cost hints. An empty rate list is a valid 200 response;
// callers must use default_points_per_request for unconfigured CoreTypes.
export function coreTypePricing(): Promise<CoreTypePricingInfo> {
  return request<CoreTypePricingInfo>('/billing/core-type-pricing');
}

// doc §8.1 — the page's authoritative balance + rollups.
export function summary(): Promise<BillingSummary> {
  return request<BillingSummary>('/billing/summary');
}

// doc §10.1 — paginated point batches (signup bonus + paid orders).
export interface BatchesQuery {
  page?: number;
  page_size?: number;
  status?: 'active' | 'exhausted' | 'expired';
  source_type?: 'signup_bonus' | 'paid_order';
  from?: string; // RFC3339, inclusive
  to?: string; // RFC3339, exclusive
}

export function listEvaluationPointBatches(
  q: BatchesQuery = {},
): Promise<EvaluationPointBatchListResponse> {
  return request<EvaluationPointBatchListResponse>('/billing/evaluation-points/batches', {
    query: q,
  });
}

// doc §10.1 — the expiry-distribution chart must see EVERY batch, so walk all
// pages instead of trusting page 1.
export async function listAllEvaluationPointBatches(
  q: Omit<BatchesQuery, 'page' | 'page_size'> = {},
): Promise<EvaluationPointBatch[]> {
  const pageSize = 100;
  let page = 1;
  let total = 0;
  const batches: EvaluationPointBatch[] = [];
  do {
    const data = await listEvaluationPointBatches({ ...q, page, page_size: pageSize });
    const chunk = data.batches ?? [];
    batches.push(...chunk);
    total = data.total ?? batches.length;
    page += 1;
    if (chunk.length === 0) break; // defensive: avoid spinning on a bad total
  } while (batches.length < total);
  return batches;
}

// doc §12.1
export function getLimits(): Promise<AccountLimits> {
  return request<AccountLimits>('/billing/limits');
}

// doc §12.2 — strict partial update; only send fields you mean to change.
export async function setLimits(patch: Partial<AccountLimits>): Promise<AccountLimits> {
  const data = await request<AccountLimits>('/billing/limits', { method: 'PUT', body: patch });
  invalidate('spend-limit');
  return data;
}

// doc §6.1 — create the local order + PayPal Order. The server matches the
// tier from amount_cents; package_id is NOT part of the request.
export function createTopupOrder(params: { amount_cents: number }): Promise<TopupOrder> {
  return request<TopupOrder>('/billing/topups/order', {
    method: 'POST',
    body: { amount_cents: params.amount_cents },
  });
}

// doc §7.1 — capture after PayPal onApprove, keyed by OUR transaction_id.
// Idempotent server-side; on timeout retry the SAME id (never re-create the
// order).
export async function captureTopup(transactionId: number): Promise<Transaction> {
  const data = await request<Transaction>(`/billing/topups/${transactionId}/capture`, {
    method: 'POST',
  });
  invalidate('transactions');
  invalidate('keys');
  return data;
}

// doc §9.1
export interface TransactionsQuery {
  page?: number;
  page_size?: number;
  status?: TransactionStatus;
  package_id?: PackageID;
  pricing_version_id?: number;
  from?: string; // RFC3339, inclusive
  to?: string; // RFC3339, exclusive
}

export function listTransactions(q: TransactionsQuery = {}): Promise<TransactionListResponse> {
  return request<TransactionListResponse>('/billing/transactions', { query: q });
}

// doc §9.2
export function transactionDetail(id: number): Promise<Transaction> {
  return request<Transaction>(`/billing/transactions/${id}`);
}
