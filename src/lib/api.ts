import { getApiBaseUrl } from '@/config/endpoints';

export function getApiBase(): string {
  return getApiBaseUrl();
}

const TOKEN_KEY = 'chivox_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  if (typeof window === 'undefined') return;
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean } = {},
): Promise<T> {
  const { method = 'GET', body, auth = true } = options;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${getApiBase()}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try { data = JSON.parse(text); } catch { data = text; }
  }

  if (!res.ok) {
    const msg =
      (data && typeof data === 'object' && 'error' in data && typeof (data as { error: unknown }).error === 'string')
        ? (data as { error: string }).error
        : res.statusText || `HTTP ${res.status}`;
    throw new ApiError(msg, res.status);
  }
  return data as T;
}

// ---------- Types ----------

export type UserRole = 'user' | 'admin';

export interface ApiUser {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface ApiKeyRecord {
  id: number;
  user_id?: number;
  user_email?: string;
  name: string;
  api_key: string;
  enabled: boolean;
  created_at: string;
  total_limit?: number;
  period_limit?: number;
  period_type?: 'daily' | 'monthly';
  total_used?: number;
  period_used?: number;
}

export interface ApiKeyUsage {
  total_used: number;
  period_used: number;
  total_limit: number;
  period_limit: number;
  period_type: 'daily' | 'monthly';
  daily_breakdown: { date: string; count: number }[];
}

export interface ApiAdminUser {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
  key_count: number;
  total_used: number;
}

export interface ApiAdminUserListResponse {
  users: ApiAdminUser[];
  total: number;
  page: number;
  page_size: number;
}

// ---------- Auth ----------

export function authRegister(params: { email: string; password: string; name: string }) {
  return request<{ user: ApiUser }>('/auth/register', { method: 'POST', body: params, auth: false });
}

export function authLogin(params: { email: string; password: string }) {
  return request<{ token: string; user: ApiUser }>('/auth/login', { method: 'POST', body: params, auth: false });
}

export function authMe() {
  return request<{ user: ApiUser }>('/auth/me');
}

// ---------- Keys ----------

type RawApiKey = {
  id: number;
  user_id?: number;
  user_email?: string;
  name: string;
  api_key: string;
  enabled: boolean;
  created_at: string;
  total_limit?: number;
  period_limit?: number;
  period_type?: 'daily' | 'monthly';
  total_used?: number;
  period_used?: number;
};

export function maskApiKey(key: string): string {
  if (!key || key.length < 12) return key;
  return `${key.slice(0, 7)}...${key.slice(-4)}`;
}

function normalizeKey(raw: RawApiKey): ApiKeyRecord {
  // 历史数据里 period_type 可能为 ""（空字符串），后端对更新接口要求该字段必填，
  // 这里统一规范化成合法值，避免前端把空串再回传导致 required 校验失败。
  const pt = raw.period_type === 'monthly' ? 'monthly' : 'daily';
  return {
    id: raw.id,
    user_id: raw.user_id,
    user_email: raw.user_email,
    name: raw.name,
    api_key: raw.api_key,
    enabled: raw.enabled,
    created_at: raw.created_at,
    total_limit: raw.total_limit,
    period_limit: raw.period_limit,
    period_type: pt,
    total_used: raw.total_used,
    period_used: raw.period_used,
  };
}

export async function listKeys(): Promise<ApiKeyRecord[]> {
  const data = await request<{ keys: RawApiKey[] }>('/keys');
  return (data.keys || []).map(normalizeKey);
}

export async function createKey(params: { name: string }): Promise<ApiKeyRecord> {
  // Quota is auto-assigned by the backend:
  //   first key  -> total_limit=900, period_limit=30, period_type=daily
  //   later keys -> all zero (no quota; needs admin to allocate)
  const data = await request<{ api_key: RawApiKey & { limit?: { total_limit: number; period_limit: number; period_type: 'daily' | 'monthly' } } }>(
    '/keys',
    { method: 'POST', body: params },
  );
  const rec = normalizeKey(data.api_key);
  if (data.api_key.limit) {
    rec.total_limit = data.api_key.limit.total_limit;
    rec.period_limit = data.api_key.limit.period_limit;
    rec.period_type = data.api_key.limit.period_type;
  }
  return rec;
}

export async function revealKey(id: number): Promise<string> {
  const data = await request<{ api_key: string }>(`/keys/${id}/reveal`);
  return data.api_key;
}

export async function resetKey(id: number): Promise<ApiKeyRecord> {
  const data = await request<{ api_key: RawApiKey }>(`/keys/${id}/reset`, { method: 'POST' });
  return normalizeKey(data.api_key);
}

export async function toggleKey(id: number): Promise<ApiKeyRecord> {
  const data = await request<{ api_key: RawApiKey }>(`/keys/${id}/toggle`, { method: 'PUT' });
  return normalizeKey(data.api_key);
}

export async function deleteKey(id: number): Promise<void> {
  await request<{ message: string }>(`/keys/${id}`, { method: 'DELETE' });
}

export async function getKeyUsage(id: number): Promise<ApiKeyUsage> {
  const data = await request<{ usage: ApiKeyUsage }>(`/keys/${id}/usage`);
  return data.usage;
}

// ---------- Admin ----------

export async function adminListUsers(params: { page?: number; page_size?: number } = {}): Promise<ApiAdminUserListResponse> {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.page_size) qs.set('page_size', String(params.page_size));
  const query = qs.toString();
  return request<ApiAdminUserListResponse>(`/admin/users${query ? `?${query}` : ''}`);
}

export async function adminListUserKeys(userId: number): Promise<ApiKeyRecord[]> {
  const data = await request<{ keys: RawApiKey[] }>(`/admin/users/${userId}/keys`);
  return (data.keys || []).map(normalizeKey);
}

export async function adminUpdateKeyLimits(keyId: number, params: {
  total_limit?: number;
  period_limit?: number;
  period_type: 'daily' | 'monthly';
}): Promise<void> {
  await request<{ message: string }>(`/admin/keys/${keyId}/limits`, { method: 'PUT', body: params });
}

export async function adminGetKeyUsage(keyId: number): Promise<ApiKeyUsage> {
  const data = await request<{ usage: ApiKeyUsage }>(`/admin/keys/${keyId}/usage`);
  return data.usage;
}
