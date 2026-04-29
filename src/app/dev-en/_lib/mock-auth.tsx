'use client';

// 兼容层：原页面使用 useMockAuth/MockAuthProvider，本文件把它们桥接到
// 真实的 AuthProvider/useAuth（位于 ./auth-context）。这样原 UI 一行不改
// 就能显示真实用户数据。
//
// MockAuthProvider 现在是 no-op 包装（真实 AuthProvider 已在 layout.tsx 里），
// useMockAuth 把 ApiUser 适配成原 MockUser 形状返回。

import { type ReactNode } from 'react';
import { useAuth } from './auth-context';

export type AuthMethod = 'email' | 'google' | 'github' | 'microsoft';

export interface MockUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  method: AuthMethod;
  createdAt: string;
}

interface LoginArgs {
  method: AuthMethod;
  identifier?: string;
}

interface MockAuthContextType {
  user: MockUser | null;
  loading: boolean;
  login: (args: LoginArgs) => Promise<MockUser>;
  logout: () => void;
  updateProfile: (
    patch: Partial<Pick<MockUser, 'name' | 'avatarUrl' | 'email'>>,
  ) => Promise<{ ok: boolean; error?: string }>;
}

export function MockAuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useMockAuth(): MockAuthContextType {
  const real = useAuth();
  const mockUser: MockUser | null = real.user
    ? {
        id: String(real.user.id),
        name: real.user.name || real.user.email || 'Developer',
        email: real.user.email ?? '',
        avatarUrl: real.user.avatar_url ?? undefined,
        method: 'email',
        createdAt: real.user.created_at ?? new Date().toISOString(),
      }
    : null;

  return {
    user: mockUser,
    loading: real.loading,
    login: async () => {
      throw new Error('use real auth login flow at /login');
    },
    logout: () => real.logout(),
    updateProfile: async (patch) => {
      return real.patchProfile({
        name: patch.name,
        email: patch.email,
        avatar_url: patch.avatarUrl,
      });
    },
  };
}
