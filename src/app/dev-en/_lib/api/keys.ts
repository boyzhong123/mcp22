import { request, invalidate } from './client';
import type { ApiKey, ApiKeyRunway, ApiKeyUsage, ApiKeyUsageSummary, LowBalanceAlert } from './types';

export async function list(): Promise<ApiKey[]> {
  const data = await request<{ keys: ApiKey[] }>('/keys');
  return data.keys || [];
}

export async function create(params: { name: string }): Promise<ApiKey> {
  const data = await request<{ api_key: ApiKey }>('/keys', { method: 'POST', body: params });
  invalidate('keys');
  return data.api_key;
}

export async function reveal(id: number): Promise<string> {
  const data = await request<{ api_key: string }>(`/keys/${id}/reveal`);
  return data.api_key;
}

export async function reset(id: number): Promise<ApiKey> {
  const data = await request<{ api_key: ApiKey }>(`/keys/${id}/reset`, { method: 'POST' });
  invalidate('keys');
  return data.api_key;
}

export async function toggle(id: number): Promise<ApiKey> {
  const data = await request<{ api_key: ApiKey }>(`/keys/${id}/toggle`, { method: 'PUT' });
  invalidate('keys');
  return data.api_key;
}

export async function rename(id: number, name: string): Promise<ApiKey> {
  const data = await request<{ api_key: ApiKey } | ApiKey>(`/keys/${id}`, {
    method: 'PATCH',
    body: { name },
  });
  invalidate('keys');
  // Backend may return either the bare key or wrapped in {api_key: ...}.
  return (data as { api_key?: ApiKey }).api_key ?? (data as ApiKey);
}

export async function rotate(id: number): Promise<ApiKey> {
  const data = await request<{ api_key: ApiKey }>(`/keys/${id}/rotate`, { method: 'POST' });
  invalidate('keys');
  return data.api_key;
}

export async function pause(id: number): Promise<void> {
  await request<unknown>(`/keys/${id}/pause`, { method: 'POST' });
  invalidate('keys');
}

export async function resume(id: number): Promise<void> {
  await request<unknown>(`/keys/${id}/resume`, { method: 'POST' });
  invalidate('keys');
}

export async function revoke(id: number): Promise<void> {
  await request<unknown>(`/keys/${id}/revoke`, { method: 'POST' });
  invalidate('keys');
}

export async function patchSettings(
  id: number,
  patch: { spend_cap_cents?: number | null; low_balance_alert?: Partial<LowBalanceAlert> },
): Promise<ApiKey> {
  const data = await request<{ api_key: ApiKey } | ApiKey>(`/keys/${id}/settings`, {
    method: 'PATCH',
    body: patch,
  });
  invalidate('keys');
  return (data as { api_key?: ApiKey }).api_key ?? (data as ApiKey);
}

export async function usage(id: number): Promise<ApiKeyUsage> {
  const data = await request<{ usage: ApiKeyUsage }>(`/keys/${id}/usage`);
  return data.usage;
}

export async function usageSummary(id: number, window: string = '28d'): Promise<ApiKeyUsageSummary> {
  return request<ApiKeyUsageSummary>(`/keys/${id}/usage/summary`, { query: { window } });
}

export async function runway(id: number, additionalCents = 0): Promise<ApiKeyRunway> {
  return request<ApiKeyRunway>(`/keys/${id}/runway`, { query: { additionalCents } });
}

export async function remove(id: number): Promise<void> {
  await request<unknown>(`/keys/${id}`, { method: 'DELETE' });
  invalidate('keys');
}
