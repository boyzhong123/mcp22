'use client';

/**
 * Dev-time language toggle. The shipping dev console will be English-only,
 * but during development the user wants a Chinese preview to sanity-check
 * content quickly. Lives outside React so the SSR snapshot is always 'en'
 * (no hydration mismatch), and is swapped to the localStorage-stored value
 * post-mount via `useSyncExternalStore`.
 */

export type DevEnLang = 'en' | 'zh';

const STORAGE_KEY = 'dev-en:lang';

let state: DevEnLang = 'en';
let initialized = false;
const listeners = new Set<() => void>();

function ensureInitialized() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'zh' || stored === 'en') state = stored;
  } catch {
    /* ignore */
  }
}

export function getLang(): DevEnLang {
  ensureInitialized();
  return state;
}

// SSR snapshot — always 'en' so the server-rendered HTML is deterministic
// and never diverges from initial client hydration.
export function getLangServer(): DevEnLang {
  return 'en';
}

export function setLang(next: DevEnLang) {
  ensureInitialized();
  if (state === next) return;
  state = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* ignore */
  }
  listeners.forEach((cb) => cb());
}

export function subscribeLang(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
