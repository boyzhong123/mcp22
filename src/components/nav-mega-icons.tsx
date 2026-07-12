import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Shared mega-menu glyphs — one monoline craft for Products / Solutions / Resources.
 * stroke 1.5 · round caps · 24 viewBox · hollow interiors kept open at 20px.
 */
export type NavMegaIconId =
  | 'english'
  | 'mandarin'
  | 'kids'
  | 'mcp'
  | 'function'
  | 'tutor'
  | 'demo'
  | 'reasoning'
  | 'runtime'
  | 'faq'
  | 'docs';

const STROKE = 1.5;

function Glyph({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={cn('h-5 w-5', className)}
      stroke="currentColor"
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

const ICONS: Record<NavMegaIconId, ReactNode> = {
  /** Studio mic + side arcs */
  english: (
    <>
      <rect x="9.25" y="3.75" width="5.5" height="9.5" rx="2.75" />
      <path d="M7.5 11.5a4.5 4.5 0 0 0 9 0" />
      <path d="M12 16v2.75" />
      <path d="M9.25 18.75h5.5" />
      <path d="M5.75 9.25c-.85 1.1-.85 3 0 4.1" />
      <path d="M18.25 9.25c.85 1.1.85 3 0 4.1" />
    </>
  ),
  /** Speech chip + tone contour (same weight as peers) */
  mandarin: (
    <>
      <path d="M4.75 5.5h10.5a2.5 2.5 0 0 1 2.5 2.5v5.25a2.5 2.5 0 0 1-2.5 2.5H11.5L8.25 18.5v-2.75H4.75a2.5 2.5 0 0 1-2.5-2.5V8A2.5 2.5 0 0 1 4.75 5.5Z" />
      <path d="M7 13.25c1.35-2.6 2.7-3.85 4-3.85 1.35 0 2.05 2.35 3.4 2.35 1.2 0 2.15-2.45 3.45-3.9" />
    </>
  ),
  /** Soft star — playful, outline-only */
  kids: (
    <>
      <path d="M12 3.5 13.85 9.1 19.7 9.4 15.15 13.25 16.7 19 12 15.9 7.3 19 8.85 13.25 4.3 9.4 10.15 9.1 12 3.5Z" />
    </>
  ),
  /** Four nodes in a ring */
  mcp: (
    <>
      <rect x="3.75" y="3.75" width="5.75" height="5.75" rx="1.5" />
      <rect x="14.5" y="3.75" width="5.75" height="5.75" rx="1.5" />
      <rect x="3.75" y="14.5" width="5.75" height="5.75" rx="1.5" />
      <rect x="14.5" y="14.5" width="5.75" height="5.75" rx="1.5" />
      <path d="M9.5 6.6h5" />
      <path d="M17.4 9.5v5" />
      <path d="M14.5 17.4h-5" />
      <path d="M6.6 14.5v-5" />
    </>
  ),
  /** { → } */
  function: (
    <>
      <path d="M8.5 5c-1.85 0-2.75 1-2.75 2.6v2c0 1-.55 1.65-1.5 2 1 .35 1.5 1 1.5 2v2c0 1.6.9 2.6 2.75 2.6" />
      <path d="M15.5 5c1.85 0 2.75 1 2.75 2.6v2c0 1 .55 1.65 1.5 2-1 .35-1.5 1-1.5 2v2c0 1.6-.9 2.6-2.75 2.6" />
      <path d="M9.75 12h4.5" />
      <path d="M12.6 10.1 14.5 12l-1.9 1.9" />
    </>
  ),
  /** Open book + speech chip */
  tutor: (
    <>
      <path d="M4.25 8.25c2.35-.85 4.35-.85 7.75.45v8.6c-3.4-1.3-5.4-1.3-7.75-.45V8.25Z" />
      <path d="M19.75 8.25c-2.35-.85-4.35-.85-7.75.45v8.6c3.4-1.3 5.4-1.3 7.75-.45V8.25Z" />
      <path d="M13.85 3.85h5c.85 0 1.55.7 1.55 1.55v2.55c0 .85-.7 1.55-1.55 1.55h-1.35l-1.35 1.05v-1.05h-2.3c-.85 0-1.55-.7-1.55-1.55V5.4c0-.85.7-1.55 1.55-1.55Z" />
      <path d="M15 6.4h.9" />
      <path d="M16.55 6.4h.9" />
      <path d="M18.1 6.4h.9" />
    </>
  ),
  /** Play in circle — live try-it */
  demo: (
    <>
      <circle cx="12" cy="12" r="7.5" />
      <path d="M10.25 8.75v6.5L16.1 12Z" />
    </>
  ),
  /** Spark / reasoning */
  reasoning: (
    <>
      <path d="M12 3.75 13.85 9.35 19.5 11 13.85 12.65 12 18.25 10.15 12.65 4.5 11 10.15 9.35 12 3.75Z" />
      <path d="M17.35 4.85v2.6" />
      <path d="M16.05 6.15h2.6" />
      <circle cx="6.4" cy="16.75" r="1.15" />
    </>
  ),
  /** Gauge / runtime */
  runtime: (
    <>
      <path d="M5.35 16.75a7.6 7.6 0 1 1 13.3 0" />
      <circle cx="12" cy="14.35" r="1.45" />
      <path d="M12 14.35 15.85 8.6" />
      <path d="M7.15 10.85v1.35" />
      <path d="M9.1 8.35v1.35" />
      <path d="M12 7.1v1.35" />
    </>
  ),
  /** Twin speech bubbles */
  faq: (
    <>
      <path d="M4.75 5.75h8.75a2.15 2.15 0 0 1 2.15 2.15v4.35a2.15 2.15 0 0 1-2.15 2.15H9.1L6.35 16.9v-2.5H4.75A2.15 2.15 0 0 1 2.6 12.25V7.9A2.15 2.15 0 0 1 4.75 5.75Z" />
      <path d="M11.15 9.6h7.85c.95 0 1.7.75 1.7 1.7v3.7c0 .95-.75 1.7-1.7 1.7h-1.25v2l-2.35-2h-1.1c-.45 0-.85-.15-1.15-.45" />
    </>
  ),
  /** Open book / guides */
  docs: (
    <>
      <path d="M4.25 6.5c2.5-.95 4.55-.95 7.75.55v10.2c-3.2-1.5-5.25-1.5-7.75-.55V6.5Z" />
      <path d="M19.75 6.5c-2.5-.95-4.55-.95-7.75.55v10.2c3.2-1.5 5.25-1.5 7.75-.55V6.5Z" />
    </>
  ),
};

/** Accent text color paired with each mega-menu tile gradient. */
export const NAV_MEGA_ICON_TONE: Record<NavMegaIconId, string> = {
  english: 'text-sky-600',
  mandarin: 'text-rose-500',
  kids: 'text-amber-600',
  mcp: 'text-emerald-600',
  function: 'text-violet-500',
  tutor: 'text-teal-600',
  demo: 'text-rose-500',
  reasoning: 'text-emerald-700',
  runtime: 'text-amber-600',
  faq: 'text-sky-600',
  docs: 'text-violet-600',
};

export function NavMegaIcon({
  id,
  className,
}: {
  id: NavMegaIconId;
  className?: string;
}) {
  return (
    <Glyph className={cn(NAV_MEGA_ICON_TONE[id], className)}>
      {ICONS[id]}
    </Glyph>
  );
}
