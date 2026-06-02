import { request, invalidate } from './client';
import type { ApiKey, ApiKeyUsage, ApiKeyUsageSummary, KeyLimits } from './types';

// doc §3.1
export async function list(): Promise<ApiKey[]> {
  const data = await request<{ keys: ApiKey[] }>('/keys');
  return data.keys || [];
}

// doc §3.2 — create returns the full key wrapped in { api_key }.
export async function create(params: { name: string }): Promise<ApiKey> {
  const data = await request<{ api_key: ApiKey }>('/keys', { method: 'POST', body: params });
  invalidate('keys');
  return data.api_key;
}

// doc §3.4 — reveal the full secret.
export async function reveal(id: number): Promise<string> {
  const data = await request<{ api_key: string }>(`/keys/${id}/reveal`);
  return data.api_key;
}

// doc §3.5 — reset rotates the secret, wrapped in { api_key }.
export async function reset(id: number): Promise<ApiKey> {
  const data = await request<{ api_key: ApiKey }>(`/keys/${id}/reset`, { method: 'POST' });
  invalidate('keys');
  return data.api_key;
}

// doc §3.6 — toggle enabled/disabled, wrapped in { api_key }.
export async function toggle(id: number): Promise<ApiKey> {
  const data = await request<{ api_key: ApiKey }>(`/keys/${id}/toggle`, { method: 'PUT' });
  invalidate('keys');
  return data.api_key;
}

// doc §3.8 — rename returns the bare APIKey object.
export async function rename(id: number, name: string): Promise<ApiKey> {
  const data = await request<{ api_key?: ApiKey } & ApiKey>(`/keys/${id}`, {
    method: 'PATCH',
    body: { name },
  });
  invalidate('keys');
  return data.api_key ?? (data as ApiKey);
}

// doc §3.9 — rotate returns the bare APIKey object with a new secret.
export async function rotate(id: number): Promise<ApiKey> {
  const data = await request<{ api_key?: ApiKey } & ApiKey>(`/keys/${id}/rotate`, {
    method: 'POST',
  });
  invalidate('keys');
  return data.api_key ?? (data as ApiKey);
}

// doc §3.10 — 204 No Content.
export async function pause(id: number): Promise<void> {
  await request<unknown>(`/keys/${id}/pause`, { method: 'POST' });
  invalidate('keys');
}

// doc §3.11 — 204 No Content.
export async function resume(id: number): Promise<void> {
  await request<unknown>(`/keys/${id}/resume`, { method: 'POST' });
  invalidate('keys');
}

// doc §3.12 — 204 No Content (soft delete).
export async function revoke(id: number): Promise<void> {
  await request<unknown>(`/keys/${id}/revoke`, { method: 'POST' });
  invalidate('keys');
}

// doc §3.13 — four-axis per-key limits; all fields optional.
export async function patchSettings(
  id: number,
  patch: Partial<KeyLimits>,
): Promise<ApiKey> {
  const data = await request<{ api_key?: ApiKey } & ApiKey>(`/keys/${id}/settings`, {
    method: 'PATCH',
    body: patch,
  });
  invalidate('keys');
  return data.api_key ?? (data as ApiKey);
}

// doc §3.7
export async function usage(id: number): Promise<ApiKeyUsage> {
  const data = await request<{ usage: ApiKeyUsage }>(`/keys/${id}/usage`);
  return data.usage;
}

// doc §3.14 — window e.g. "7d" | "28d" | "90d".
export async function usageSummary(id: number, window = '28d'): Promise<ApiKeyUsageSummary> {
  return request<ApiKeyUsageSummary>(`/keys/${id}/usage/summary`, { query: { window } });
}

// doc §3.3
export async function remove(id: number): Promise<void> {
  await request<unknown>(`/keys/${id}`, { method: 'DELETE' });
  invalidate('keys');
}
