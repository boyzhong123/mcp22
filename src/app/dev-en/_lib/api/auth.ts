import { request, buildUrl } from './client';
import type { ApiUser, LoginResult, OAuthProvider } from './types';

export function register(params: { email: string; password: string; name: string }) {
  return request<{ user: ApiUser }>('/auth/register', { method: 'POST', body: params, auth: false });
}

export function login(params: { email: string; password: string }) {
  return request<LoginResult>('/auth/login', { method: 'POST', body: params, auth: false });
}

export function otpSend(params: { channel: 'email'; identifier: string }) {
  return request<{ expires_in: number }>('/auth/otp/send', { method: 'POST', body: params, auth: false });
}

export function otpVerify(params: {
  channel: 'email';
  identifier: string;
  code: string;
  terms_accepted?: boolean;
}) {
  return request<LoginResult>('/auth/otp/verify', { method: 'POST', body: params, auth: false });
}

export function oauthStartUrl(provider: OAuthProvider, redirect?: string): string {
  return buildUrl(`/auth/oauth/${provider}/start`, redirect ? { redirect } : undefined);
}

export function me() {
  return request<ApiUser>('/auth/me');
}

export function patchMe(patch: { name?: string; email?: string; avatar_url?: string }) {
  return request<ApiUser>('/auth/me', { method: 'PATCH', body: patch });
}

export function logout() {
  return request<{ message: string }>('/auth/logout', { method: 'POST' });
}
