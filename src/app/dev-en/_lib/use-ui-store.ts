'use client';

import { useSyncExternalStore } from 'react';
import {
  getUiServerState,
  getUiState,
  subscribeUi,
} from './ui-store';

/**
 * React binding for the dashboard UI store. Pulls either a field selector
 * via `useUi((s) => s.sidebarCollapsed)` or the whole state with
 * `useUi()`.
 */
export function useUi<T>(selector?: (s: ReturnType<typeof getUiState>) => T): T {
  return useSyncExternalStore(
    subscribeUi,
    () => (selector ? selector(getUiState()) : (getUiState() as unknown as T)),
    () => (selector ? selector(getUiServerState()) : (getUiServerState() as unknown as T)),
  );
}
