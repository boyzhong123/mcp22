'use client';

import { useEffect } from 'react';
import { useAuth } from '../_lib/auth-context';
import { onInvalidate, keys as keysApi } from '../_lib/api';
import { hydrateFromApi, installMutationProxy } from '../_lib/mock-store-bridge';

// Mounted once inside dashboard layout. After auth is ready, pulls real data
// from backend and pushes it into the legacy mock-store. Re-hydrates whenever
// any domain dispatches an `invalidate(...)` event (e.g. after creating a key
// or topping up). The original UI components don't need to change.
export function DataHydrator() {
  const { user, loading } = useAuth();

  useEffect(() => {
    installMutationProxy();
  }, []);

  useEffect(() => {
    if (loading || !user) return;
    void hydrateFromApi({ force: true }).then(() => {
      void ensureStarterKey(user.id);
    });
  }, [user, loading]);

  useEffect(() => {
    if (!user) return;
    const keys = (
      [
        'keys',
        'transactions',
        'spend-limit',
        'payment-methods',
        'notifications',
      ] as const
    ).map((k) => onInvalidate(k, () => void hydrateFromApi()));
    return () => keys.forEach((off) => off());
  }, [user]);

  return null;
}

// If the user has no keys at all (new account or all deleted), create one
// Starter key automatically. We mark it per-userId to avoid re-running on
// every page load. OAuth new-user signal comes via 'dev-en:oauth-new-user'.
async function ensureStarterKey(userId: number) {
  if (typeof window === 'undefined') return;

  const storageKey = `dev-en:starter-fallback:${userId}`;
  if (localStorage.getItem(storageKey)) return; // already attempted for this user

  // Clear OAuth new-user flag if present (consumed)
  localStorage.removeItem('dev-en:oauth-new-user');

  try {
    const existing = await keysApi.list();
    if (existing.length === 0) {
      await keysApi.create({ name: 'Starter' });
      // Re-hydrate so the new key shows up in the UI
      await hydrateFromApi({ force: true });
    }
    // Mark as attempted regardless of whether we created one or found existing
    localStorage.setItem(storageKey, '1');
  } catch (err) {
    console.warn('[DataHydrator] Starter key fallback failed:', err);
    // Don't mark – allow retry on next load if creation failed
  }
}
