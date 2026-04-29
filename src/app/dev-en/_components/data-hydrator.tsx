'use client';

import { useEffect } from 'react';
import { useAuth } from '../_lib/auth-context';
import { onInvalidate } from '../_lib/api';
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
    void hydrateFromApi({ force: true });
  }, [user, loading]);

  useEffect(() => {
    if (!user) return;
    const keys = (
      [
        'keys',
        'transactions',
        'spend-limit',
        'payment-methods',
        'team',
        'notifications',
      ] as const
    ).map((k) => onInvalidate(k, () => void hydrateFromApi()));
    return () => keys.forEach((off) => off());
  }, [user]);

  return null;
}
