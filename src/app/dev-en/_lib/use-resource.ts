'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { onInvalidate, type InvalidationKey } from './api';

export interface UseResourceOptions {
  // Invalidation keys this resource listens to. When invalidate() is fired
  // with one of these keys, the resource will re-fetch.
  watch?: InvalidationKey[];
  // Skip the initial fetch (useful when arguments aren't ready yet).
  enabled?: boolean;
}

export interface ResourceState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
}

// Generic data hook. Replaces the legacy mock-store / useSyncExternalStore
// pattern with a small fetch+invalidate primitive.
export function useResource<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: ReadonlyArray<unknown>,
  options: UseResourceOptions = {},
): ResourceState<T> {
  const { watch, enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<Error | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const reload = useCallback(async () => {
    if (!enabled) return;
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current(ac.signal);
      if (!ac.signal.aborted) setData(result);
    } catch (err) {
      if ((err as { name?: string })?.name === 'AbortError') return;
      if (!ac.signal.aborted) setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      if (!ac.signal.aborted) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const result = await fetcherRef.current(ac.signal);
        if (!ac.signal.aborted) setData(result);
      } catch (err) {
        if ((err as { name?: string })?.name === 'AbortError') return;
        if (!ac.signal.aborted) setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  useEffect(() => {
    if (!watch || watch.length === 0) return;
    const offs = watch.map((k) => onInvalidate(k, () => void reload()));
    return () => {
      offs.forEach((off) => off());
    };
  }, [watch, reload]);

  return { data, loading, error, reload };
}
