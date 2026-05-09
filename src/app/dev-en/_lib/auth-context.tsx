'use client';

import { useRouter } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import {
  ApiError,
  auth as authApi,
  describeError,
  getToken,
  invalidate,
  registerUnauthenticatedHandler,
  setToken,
} from './api';
import type { ApiUser, OAuthProvider } from './api';

export type { ApiUser } from './api';

interface AuthContextValue {
  user: ApiUser | null;
  loading: boolean;
  isNewUser: boolean;
  isDemo: boolean;
  clearIsNewUser: () => void;
  loginWithPassword: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  registerWithPassword: (
    name: string,
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  sendOtp: (email: string) => Promise<{ ok: boolean; error?: string; retryAfterSec?: number }>;
  verifyOtp: (
    email: string,
    code: string,
    termsAccepted?: boolean,
  ) => Promise<{ ok: boolean; error?: string; isNewUser?: boolean }>;
  startOAuth: (provider: OAuthProvider, redirect?: string) => string;
  patchProfile: (
    patch: { name?: string; email?: string; avatar_url?: string },
  ) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  refresh: () => Promise<void>;
  loginAsDemo: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const DEMO_TOKEN = 'demo_token_for_preview';
const DEMO_USER: ApiUser = {
  id: 9999,
  email: 'demo@chivox.com',
  name: 'Demo User',
  role: 'user',
  avatar_url: undefined,
  created_at: new Date().toISOString(),
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const cancelledRef = useRef(false);

  const clearIsNewUser = useCallback(() => setIsNewUser(false), []);

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setIsDemo(false);
      setLoading(false);
      return;
    }
    // Demo mode: skip API call, restore demo user from token
    if (token === DEMO_TOKEN) {
      if (!cancelledRef.current) {
        setUser(DEMO_USER);
        setIsDemo(true);
      }
      setLoading(false);
      return;
    }
    try {
      const u = await authApi.me();
      // backend may wrap as {user: ...} for some envs; normalize
      const normalized = (u as unknown as { user?: ApiUser }).user ?? (u as ApiUser);
      if (!cancelledRef.current) {
        setUser(normalized);
        setIsDemo(false);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) setToken(null);
      if (!cancelledRef.current) {
        setUser(null);
        setIsDemo(false);
      }
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    cancelledRef.current = false;
    refresh();
    return () => {
      cancelledRef.current = true;
    };
  }, [refresh]);

  // Global 401 handler: clear session and bounce to /dev-en/login.
  // Skip for demo mode (identified by DEMO_TOKEN).
  useEffect(() => {
    registerUnauthenticatedHandler(() => {
      // Demo mode should not trigger logout on 401
      if (getToken() === DEMO_TOKEN) return;
      setToken(null);
      setUser(null);
      setIsDemo(false);
      try {
        const path = window.location.pathname;
        const onLogin = path === '/login' || path.startsWith('/login/');
        if (!onLogin) router.push('/login');
      } catch {
        /* ignore */
      }
    });
  }, [router]);

  const applyLogin = useCallback((token: string, u: ApiUser) => {
    setToken(token);
    setUser(u);
    invalidate('auth');
  }, []);

  const loginWithPassword = useCallback(
    async (email: string, password: string) => {
      try {
        const res = await authApi.login({ email, password });
        applyLogin(res.token, res.user);
        return { ok: true };
      } catch (err) {
        return { ok: false, error: describeError(err, 'login') };
      }
    },
    [applyLogin],
  );

  const registerWithPassword = useCallback(
    async (name: string, email: string, password: string) => {
      try {
        await authApi.register({ name, email, password });
        const res = await authApi.login({ email, password });
        applyLogin(res.token, res.user);
        setIsNewUser(true);
        return { ok: true };
      } catch (err) {
        return { ok: false, error: describeError(err, 'login') };
      }
    },
    [applyLogin],
  );

  const sendOtp = useCallback(async (email: string) => {
    try {
      await authApi.otpSend({ channel: 'email', identifier: email });
      return { ok: true };
    } catch (err) {
      if (err instanceof ApiError) {
        return { ok: false, error: describeError(err, 'login'), retryAfterSec: err.retryAfterSec };
      }
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }, []);

  const verifyOtp = useCallback(
    async (email: string, code: string, termsAccepted?: boolean) => {
      try {
        const res = await authApi.otpVerify({
          channel: 'email',
          identifier: email,
          code,
          terms_accepted: termsAccepted,
        });
        applyLogin(res.token, res.user);
        if (res.is_new_user) setIsNewUser(true);
        return { ok: true, isNewUser: res.is_new_user };
      } catch (err) {
        return { ok: false, error: describeError(err, 'login') };
      }
    },
    [applyLogin],
  );

  const startOAuth = useCallback((provider: OAuthProvider, redirect?: string) => {
    return authApi.oauthStartUrl(provider, redirect);
  }, []);

  const patchProfile = useCallback(
    async (patch: { name?: string; email?: string; avatar_url?: string }) => {
      try {
        const u = await authApi.patchMe(patch);
        const normalized = (u as unknown as { user?: ApiUser }).user ?? (u as ApiUser);
        setUser(normalized);
        return { ok: true };
      } catch (err) {
        return { ok: false, error: describeError(err) };
      }
    },
    [],
  );

  const logout = useCallback(() => {
    // best-effort server-side ack; ignore failures (stateless JWT)
    if (!isDemo) {
      authApi.logout().catch(() => {});
    }
    setToken(null);
    setUser(null);
    setIsDemo(false);
    router.push('/login');
  }, [router, isDemo]);

  const loginAsDemo = useCallback(() => {
    setToken(DEMO_TOKEN);
    setUser(DEMO_USER);
    setIsDemo(true);
    setIsNewUser(true);
    invalidate('auth');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isNewUser,
      isDemo,
      clearIsNewUser,
      loginWithPassword,
      registerWithPassword,
      sendOtp,
      verifyOtp,
      startOAuth,
      patchProfile,
      logout,
      refresh,
      loginAsDemo,
    }),
    [
      user,
      loading,
      isNewUser,
      isDemo,
      clearIsNewUser,
      loginWithPassword,
      registerWithPassword,
      sendOtp,
      verifyOtp,
      startOAuth,
      patchProfile,
      logout,
      refresh,
      loginAsDemo,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
