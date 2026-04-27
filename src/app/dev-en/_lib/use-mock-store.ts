'use client';

import { useSyncExternalStore } from 'react';
import { subscribe } from './mock-store';

/**
 * Subscribe to the mock-store observable, re-computing `selector` whenever a
 * mutation happens. `fallback` is used for the SSR snapshot so no hydration
 * mismatch occurs when values come from `localStorage`.
 *
 * NOTE: `selector` should return a stable identity when data hasn't changed;
 * for primitives this is automatic. For arrays/objects the store always
 * returns a fresh read, which is fine because `useSyncExternalStore` compares
 * by `Object.is` on each notified read cycle and components that pass a
 * scalar projection (e.g. `length`) avoid the re-render churn.
 */
export function useMockStore<T>(selector: () => T, fallback: T): T {
  return useSyncExternalStore(subscribe, selector, () => fallback);
}
