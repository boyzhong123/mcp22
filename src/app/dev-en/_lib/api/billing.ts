import { buildUrl, invalidate, request } from './client';
import type {
  PaymentMethod,
  PricingInfo,
  SpendLimit,
  Transaction,
  TransactionListResponse,
} from './types';

export function pricing(): Promise<PricingInfo> {
  return request<PricingInfo>('/billing/pricing');
}

export function getSpendLimit(): Promise<SpendLimit> {
  return request<SpendLimit>('/billing/spend-limit');
}

export async function setSpendLimit(patch: {
  monthly_limit_cents?: number;
  alert_threshold_pct?: number;
}): Promise<SpendLimit> {
  const data = await request<SpendLimit>('/billing/spend-limit', { method: 'PUT', body: patch });
  invalidate('spend-limit');
  return data;
}

export function listPaymentMethods(): Promise<PaymentMethod[]> {
  return request<PaymentMethod[]>('/billing/payment-methods');
}

export function createSetupIntent(): Promise<{ client_secret: string; setup_intent_id: string }> {
  return request<{ client_secret: string; setup_intent_id: string }>(
    '/billing/payment-methods/setup-intent',
    { method: 'POST' },
  );
}

export async function confirmSetup(params: {
  setup_intent_id: string;
  make_default?: boolean;
}): Promise<PaymentMethod> {
  const data = await request<PaymentMethod>('/billing/payment-methods/confirm', {
    method: 'POST',
    body: params,
  });
  invalidate('payment-methods');
  return data;
}

export async function setDefaultPaymentMethod(id: number): Promise<void> {
  await request<{ message: string }>(`/billing/payment-methods/${id}/default`, { method: 'POST' });
  invalidate('payment-methods');
}

export async function deletePaymentMethod(id: number): Promise<void> {
  await request<unknown>(`/billing/payment-methods/${id}`, { method: 'DELETE' });
  invalidate('payment-methods');
}

export interface TopupIntentParams {
  key_id: number;
  amount_cents: number;
  method: string; // 'card'
  payment_method_id?: number;
  country?: string;
  save_payment_method?: boolean;
}

export function createTopupIntent(
  params: TopupIntentParams,
): Promise<{ client_secret: string; payment_intent_id: string; transaction_id: number }> {
  return request<{
    client_secret: string;
    payment_intent_id: string;
    transaction_id: number;
  }>('/billing/topups/intent', { method: 'POST', body: params });
}

export async function confirmTopup(transactionId: number): Promise<Transaction> {
  const data = await request<Transaction>(`/billing/topups/${transactionId}/confirm`, {
    method: 'POST',
  });
  invalidate('transactions');
  invalidate('keys');
  return data;
}

export interface TransactionsQuery {
  page?: number;
  page_size?: number;
  key_id?: number;
  kind?: string;
  from?: string;
  to?: string;
}

export function listTransactions(q: TransactionsQuery = {}): Promise<TransactionListResponse> {
  return request<TransactionListResponse>('/billing/transactions', { query: q });
}

export async function downloadInvoice(invoiceNumber: string): Promise<{ blob: Blob; filename: string }> {
  const blob = await request<Blob>(`/billing/invoices/${invoiceNumber}`, { asBlob: true });
  const filename = invoiceNumber.endsWith('.pdf') ? invoiceNumber : `${invoiceNumber}.pdf`;
  return { blob, filename };
}

export function invoiceUrl(invoiceNumber: string): string {
  return buildUrl(`/billing/invoices/${invoiceNumber}`);
}
