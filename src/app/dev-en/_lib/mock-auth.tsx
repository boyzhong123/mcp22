'use client';

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from 'react';

// Supported sign-in methods for the static dev-en console.
// Phone OTP was dropped: Western B2C developers tend to treat giving out a
// mobile number as a privacy red flag, and email + major OAuth providers
// cover virtually all real-world sign-in scenarios for this audience.
// Microsoft is included so Entra ID / Office 365 developer tenants can sign
// in with their work account without a separate email flow.
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
  updateProfile: (patch: Partial<Pick<MockUser, 'name' | 'avatarUrl' | 'email'>>) => void;
}

const STORAGE_KEY = 'dev-en:auth-user';

// ─── External store ─────────────────────────────────────────────────────────
interface AuthState {
  user: MockUser | null;
  hydrated: boolean;
}
let state: AuthState = { user: null, hydrated: false };
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((cb) => cb());
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot(): AuthState {
  if (!state.hydrated && typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      state = {
        user: raw ? (JSON.parse(raw) as MockUser) : null,
        hydrated: true,
      };
    } catch {
      state = { user: null, hydrated: true };
    }
  }
  return state;
}

const SERVER_STATE: AuthState = { user: null, hydrated: false };
function getServerSnapshot(): AuthState {
  return SERVER_STATE;
}

function deriveName(method: AuthMethod, identifier?: string): string {
  if (method === 'google') return 'Alex Rivera';
  if (method === 'github') return 'Jordan Lee';
  if (method === 'microsoft') return 'Sam Chen';
  if (identifier && identifier.includes('@')) {
    const local = identifier.split('@')[0];
    return (
      local
        .split(/[._-]/)
        .filter(Boolean)
        .map((p) => p[0].toUpperCase() + p.slice(1))
        .join(' ') || 'Developer'
    );
  }
  return 'Developer';
}

function deriveEmail(method: AuthMethod, identifier?: string): string {
  if (method === 'google') return 'alex.rivera@gmail.com';
  if (method === 'github') return 'jordan.lee@users.noreply.github.com';
  if (method === 'microsoft') return 'sam.chen@outlook.com';
  if (method === 'email' && identifier) return identifier;
  return 'you@example.dev';
}

async function loginImpl({ method, identifier }: LoginArgs): Promise<MockUser> {
  await new Promise((r) => setTimeout(r, 350));
  const newUser: MockUser = {
    id: 'u_' + Math.random().toString(36).slice(2, 10),
    name: deriveName(method, identifier),
    email: deriveEmail(method, identifier),
    method,
    createdAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
  } catch {
    /* ignore */
  }
  state = { user: newUser, hydrated: true };
  notify();
  return newUser;
}

function logoutImpl() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  state = { user: null, hydrated: true };
  notify();
}

function updateProfileImpl(
  patch: Partial<Pick<MockUser, 'name' | 'avatarUrl' | 'email'>>,
) {
  if (!state.user) return;
  const next: MockUser = {
    ...state.user,
    ...(patch.name !== undefined ? { name: patch.name.trim() || state.user.name } : {}),
    ...(patch.avatarUrl !== undefined ? { avatarUrl: patch.avatarUrl.trim() || undefined } : {}),
    ...(patch.email !== undefined ? { email: patch.email.trim() || state.user.email } : {}),
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  state = { user: next, hydrated: true };
  notify();
}

// ─── React bindings ─────────────────────────────────────────────────────────
const MockAuthContext = createContext<MockAuthContextType | null>(null);

export function MockAuthProvider({ children }: { children: ReactNode }) {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const value = useMemo<MockAuthContextType>(
    () => ({
      user: snap.user,
      loading: !snap.hydrated,
      login: loginImpl,
      logout: logoutImpl,
      updateProfile: updateProfileImpl,
    }),
    [snap],
  );

  return <MockAuthContext.Provider value={value}>{children}</MockAuthContext.Provider>;
}

export function useMockAuth() {
  const ctx = useContext(MockAuthContext);
  if (!ctx) throw new Error('useMockAuth must be used within MockAuthProvider');
  return ctx;
}
