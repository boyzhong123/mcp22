'use client';

/**
 * Tiny observable store for cross-cutting dashboard UI state:
 *   - sidebar collapsed / expanded
 *   - command palette open / closed
 *   - in-flight client navigation (progress bar + loader)
 *
 * Deliberately framework-free (no Context, no zustand) — sidebar, topbar
 * and the palette itself all subscribe via `useSyncExternalStore`, which
 * plays nicely with React 19 and avoids prop-drilling a provider tree.
 */

const SIDEBAR_KEY = 'dev-en:sidebar-collapsed';

type State = {
  sidebarCollapsed: boolean;
  paletteOpen: boolean;
  tourOpen: boolean;
  /** Non-null while a client-side route change is in flight. */
  navigationPending: string | null;
};

function readInitial(): State {
  if (typeof window === 'undefined') {
    return {
      sidebarCollapsed: false,
      paletteOpen: false,
      tourOpen: false,
      navigationPending: null,
    };
  }
  return {
    sidebarCollapsed: window.localStorage.getItem(SIDEBAR_KEY) === '1',
    paletteOpen: false,
    tourOpen: false,
    navigationPending: null,
  };
}

let state: State = readInitial();
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function subscribeUi(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getUiState(): State {
  return state;
}

export function getUiServerState(): State {
  return {
    sidebarCollapsed: false,
    paletteOpen: false,
    tourOpen: false,
    navigationPending: null,
  };
}

export function setSidebarCollapsed(next: boolean): void {
  if (state.sidebarCollapsed === next) return;
  state = { ...state, sidebarCollapsed: next };
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(SIDEBAR_KEY, next ? '1' : '0');
  }
  emit();
}

export function toggleSidebar(): void {
  setSidebarCollapsed(!state.sidebarCollapsed);
}

export function openPalette(): void {
  if (state.paletteOpen) return;
  state = { ...state, paletteOpen: true };
  emit();
}

export function closePalette(): void {
  if (!state.paletteOpen) return;
  state = { ...state, paletteOpen: false };
  emit();
}

export function togglePalette(): void {
  state = { ...state, paletteOpen: !state.paletteOpen };
  emit();
}

export function openTour(): void {
  if (state.tourOpen) return;
  state = { ...state, tourOpen: true };
  emit();
}

export function closeTour(): void {
  if (!state.tourOpen) return;
  state = { ...state, tourOpen: false };
  emit();
}

/** Mark a client navigation as in-flight so the progress UI can react immediately. */
export function startNavigation(href: string): void {
  if (state.navigationPending === href) return;
  state = { ...state, navigationPending: href };
  emit();
}

export function clearNavigation(): void {
  if (state.navigationPending === null) return;
  state = { ...state, navigationPending: null };
  emit();
}
