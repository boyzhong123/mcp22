import { request } from './client';
import type { AdminUserListResponse, ApiKey, ApiKeyUsage, PeriodType } from './types';

export function listUsers(params: { page?: number; page_size?: number } = {}) {
  return request<AdminUserListResponse>('/admin/users', { query: params });
}

export async function listUserKeys(userId: number): Promise<ApiKey[]> {
  const data = await request<{ keys: ApiKey[] }>(`/admin/users/${userId}/keys`);
  return data.keys || [];
}

export async function updateLimits(
  keyId: number,
  patch: { total_limit?: number; period_limit?: number; period_type: PeriodType },
): Promise<void> {
  await request<{ message: string }>(`/admin/keys/${keyId}/limits`, {
    method: 'PUT',
    body: patch,
  });
}

export async function keyUsage(keyId: number): Promise<ApiKeyUsage> {
  const data = await request<{ usage: ApiKeyUsage }>(`/admin/keys/${keyId}/usage`);
  return data.usage;
}
