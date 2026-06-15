// Centralized request helper for the dev-en (English Global) dashboard.
//
// All requests go to same-origin `/api/*`, which is forwarded by
// `src/app/api/[...path]/route.ts` to the real backend (default
// http://10.0.10.3:8081/api). This keeps JWT/cookie handling on
// same-origin and avoids browser CORS.

const TOKEN_KEY = 'chivox_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  if (typeof window === 'undefined') return;
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  retryAfterSec?: number;
}

export class ApiError extends Error {
  status: number;
  code: string;
  retryAfterSec?: number;

  constructor(message: string, status: number, code = 'UNKNOWN', retryAfterSec?: number) {
    super(message);
    this.status = status;
    this.code = code;
    this.retryAfterSec = retryAfterSec;
  }
}

// Detect user's preferred language (zh = Chinese, otherwise English).
function isZh(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const lang = window.navigator.language || '';
    return lang.toLowerCase().startsWith('zh');
  } catch {
    return false;
  }
}

// Bilingual helper: returns Chinese if browser is zh-*, otherwise English.
function t(en: string, zh: string): string {
  return isZh() ? zh : en;
}

// Recognize common raw error patterns (e.g. MySQL errors leaked by backend).
function friendlyMessage(raw: string): string | null {
  // MySQL duplicate entry: Error 1062 (23000): Duplicate entry 'xxx' for key 'idx_users_email'
  if (/Error 1062.*Duplicate entry.*idx_users_email/i.test(raw)) {
    return t('This email is already registered. Try signing in instead.', '该邮箱已注册，请直接登录。');
  }
  // Generic duplicate key fallback
  if (/Error 1062.*Duplicate entry/i.test(raw)) {
    return t('This record already exists.', '该记录已存在。');
  }
  // Connection refused / unreachable
  if (/ECONNREFUSED|unreachable|network error/i.test(raw)) {
    return t('Service is temporarily unavailable. Please try again later.', '服务暂时不可用，请稍后重试。');
  }
  return null;
}

// Context hint for describeError: 'login' means a 401 is "wrong credentials",
// not "session expired". Default (undefined) = session context.
export type ErrorContext = 'login' | undefined;

// Map server error codes to user-facing copy. Pages can use this directly to
// avoid duplicating the mapping. Falls back to err.message for unknown codes.
export function describeError(err: unknown, ctx?: ErrorContext): string {
  if (err instanceof ApiError) {
    // First check for known codes
    switch (err.code) {
      case 'UNAUTHENTICATED':
        // In login context, 401 means wrong credentials, not expired session.
        if (ctx === 'login') {
          return t('Invalid email or password.', '邮箱或密码错误。');
        }
        return t('Your session has expired. Please sign in again.', '会话已过期，请重新登录。');
      case 'INVALID_CREDENTIALS':
        return t('Invalid email or password.', '邮箱或密码错误。');
      case 'INVALID_OTP':
        return t('Invalid or expired verification code.', '验证码无效或已过期。');
      case 'RATE_LIMITED':
        return err.retryAfterSec
          ? t(`Too many requests. Try again in ${err.retryAfterSec}s.`, `请求过于频繁，请 ${err.retryAfterSec} 秒后重试。`)
          : t('Too many requests. Please slow down.', '请求过于频繁，请稍后重试。');
      case 'STARTER_KEY_READONLY':
        return t('This action is not allowed for the Starter key.', 'Starter 密钥不允许此操作。');
      case 'NOT_FOUND':
        return t('Resource not found.', '资源未找到。');
      case 'INVALID_INPUT':
        return err.message || t('Invalid input.', '输入无效。');
      case 'EMAIL_EXISTS':
        return t('This email is already registered. Try signing in instead.', '该邮箱已注册，请直接登录。');
      default:
        // Fallback: try to recognize raw error patterns
        return friendlyMessage(err.message) ?? err.message;
    }
  }
  if (err instanceof Error) {
    return friendlyMessage(err.message) ?? err.message;
  }
  const str = String(err);
  return friendlyMessage(str) ?? str;
}

// Cross-component event bus so list pages can re-fetch after a mutation
// elsewhere (e.g. Stripe checkout modal triggers transactions invalidation).
const bus = typeof window !== 'undefined' ? new EventTarget() : null;

export type InvalidationKey =
  | 'auth'
  | 'keys'
  | 'usage'
  | 'transactions'
  | 'spend-limit'
  | 'payment-methods'
  | 'notifications'
  | 'webhooks'
  | 'admin-users';

export function invalidate(key: InvalidationKey) {
  bus?.dispatchEvent(new CustomEvent(`invalidate:${key}`));
}

export function onInvalidate(key: InvalidationKey, cb: () => void): () => void {
  if (!bus) return () => {};
  const handler = () => cb();
  bus.addEventListener(`invalidate:${key}`, handler);
  return () => bus.removeEventListener(`invalidate:${key}`, handler);
}

// Global UNAUTHENTICATED hook so the auth context can react to it.
let onUnauthenticated: (() => void) | null = null;
export function registerUnauthenticatedHandler(fn: () => void) {
  onUnauthenticated = fn;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: QueryParams;
  auth?: boolean;
  signal?: AbortSignal;
  // when true the response is returned as Blob (for CSV/PDF download)
  asBlob?: boolean;
  // when true, no Content-Type is set (caller may pass FormData / raw body)
  rawBody?: boolean;
}

export type QueryValue = string | number | boolean | undefined | null;
// Permissive query type: any object literal works. We coerce values at runtime.
export type QueryParams = object;

export function buildUrl(path: string, query?: QueryParams): string {
  const base = '/api';
  const cleaned = path.startsWith('/') ? path : `/${path}`;
  const url = `${base}${cleaned}`;
  if (!query) return url;
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(query as Record<string, unknown>)) {
    if (v === undefined || v === null) continue;
    sp.set(k, String(v));
  }
  const qs = sp.toString();
  return qs ? `${url}?${qs}` : url;
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, auth = true, signal, asBlob = false, rawBody = false } = opts;
  const headers: Record<string, string> = {};
  if (body !== undefined && !rawBody) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: body !== undefined ? (rawBody ? (body as BodyInit) : JSON.stringify(body)) : undefined,
    signal,
    cache: 'no-store',
  });

  if (asBlob) {
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new ApiError(txt || `HTTP ${res.status}`, res.status);
    }
    return (await res.blob()) as unknown as T;
  }

  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try { data = JSON.parse(text); } catch { data = text; }
  }

  if (!res.ok) {
    let code = 'UNKNOWN';
    let message = res.statusText || `HTTP ${res.status}`;
    let retryAfterSec: number | undefined;
    if (data && typeof data === 'object') {
      const obj = data as Record<string, unknown>;
      const errAny = obj.error;
      if (errAny && typeof errAny === 'object') {
        const err = errAny as Record<string, unknown>;
        if (typeof err.code === 'string') code = err.code;
        if (typeof err.message === 'string') message = err.message;
        if (typeof err.retryAfterSec === 'number') retryAfterSec = err.retryAfterSec;
      } else if (typeof errAny === 'string') {
        message = errAny;
      }
    }
    if (res.status === 401 && onUnauthenticated) onUnauthenticated();
    throw new ApiError(message, res.status, code, retryAfterSec);
  }

  return data as T;
}
