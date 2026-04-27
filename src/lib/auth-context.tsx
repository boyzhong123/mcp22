'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { authLogin, authMe, authRegister, setToken, getToken, ApiError, type ApiUser, type UserRole } from './api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string; isAdmin?: boolean }>;
  register: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: string; isAdmin?: boolean }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function toUser(u: ApiUser): User {
  return {
    id: String(u.id),
    name: u.name,
    email: u.email,
    role: u.role,
    plan: 'free',
    createdAt: u.created_at,
    isAdmin: u.role === 'admin',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { user: u } = await authMe();
        if (!cancelled) setUser(toUser(u));
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          setToken(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { token, user: u } = await authLogin({ email, password });
      const nextUser = toUser(u);
      setToken(token);
      setUser(nextUser);
      return { ok: true, isAdmin: nextUser.isAdmin };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    try {
      await authRegister({ name, email, password });
      const { token, user: u } = await authLogin({ email, password });
      const nextUser = toUser(u);
      setToken(token);
      setUser(nextUser);
      return { ok: true, isAdmin: nextUser.isAdmin };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
