import { request, buildUrl } from './client';
import type { ApiUser, LoginResult, OAuthProvider } from './types';

// ─── Public endpoints (doc §1) ──────────────────────────────────────────────

// §1.1 — register returns a "verification code sent" envelope, not a user.
export function register(params: { email: string; password: string; name: string }) {
  return request<{ message: string; email: string }>('/auth/register', {
    method: 'POST',
    body: params,
    auth: false,
  });
}

// §1.2
export function login(params: { email: string; password: string }) {
  return request<LoginResult>('/auth/login', { method: 'POST', body: params, auth: false });
}

// §1.3
export function otpSend(params: { channel: 'email'; identifier: string }) {
  return request<{ cooldown_sec: number; ttl_sec: number }>('/auth/otp/send', {
    method: 'POST',
    body: params,
    auth: false,
  });
}

// §1.4
export function otpVerify(params: {
  channel: 'email';
  identifier: string;
  code: string;
  terms_accepted?: boolean;
}) {
  return request<LoginResult>('/auth/otp/verify', { method: 'POST', body: params, auth: false });
}

// §1.5
export function verifyEmail(params: { email: string; code: string }) {
  return request<LoginResult>('/auth/verify-email', { method: 'POST', body: params, auth: false });
}

// §1.6
export function resendVerification(params: { email: string }) {
  return request<{ message: string }>('/auth/resend-verification', {
    method: 'POST',
    body: params,
    auth: false,
  });
}

// §1.7
export function forgotPassword(params: { email: string }) {
  return request<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: params,
    auth: false,
  });
}

// §1.8
export function resetPassword(params: { email: string; code: string; new_password: string }) {
  return request<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: params,
    auth: false,
  });
}

// §1.9 — full-page redirect to the backend OAuth entrypoint. The caller
// generates a random `state`, stores it (sessionStorage) and verifies it on
// the /oauth/callback page.
export function oauthStartUrl(provider: OAuthProvider, state: string): string {
  return buildUrl(`/auth/oauth/${provider}/start`, { state });
}

// ─── Authenticated endpoints (doc §2) ───────────────────────────────────────

// §2.1 — { user } envelope.
export async function me(): Promise<ApiUser> {
  const data = await request<{ user: ApiUser }>('/auth/me');
  return data.user;
}

// §2.2 — { user } envelope.
export async function patchMe(patch: {
  name?: string;
  email?: string;
  avatar_url?: string;
}): Promise<ApiUser> {
  const data = await request<{ user: ApiUser }>('/auth/me', { method: 'PATCH', body: patch });
  return data.user;
}

// §2.3
export function changePassword(params: { current_password: string; new_password: string }) {
  return request<{ message: string }>('/auth/change-password', {
    method: 'POST',
    body: params,
  });
}

// §2.4
export function logout() {
  return request<{ message: string }>('/auth/logout', { method: 'POST' });
}
