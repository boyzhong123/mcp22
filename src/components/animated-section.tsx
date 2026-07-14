import type { ReactNode } from 'react';

/* ── Fade + slide up ─────────────────────────────────────────
 * CSS-only reveal. Framer Motion's animate/whileInView was leaving
 * the homepage stuck at opacity:0 in this Next/React setup. */
export function FadeUp({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div
      className={['fade-up-in', className].filter(Boolean).join(' ')}
      style={{ animationDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
}

/* ── Staggered children ─────────────────────────────────────── */
export function StaggerContainer({
  children,
  className = '',
  staggerDelay = 0.1,
}: {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}) {
  return (
    <div
      className={['stagger-in', className].filter(Boolean).join(' ')}
      style={{ ['--stagger' as string]: `${staggerDelay}s` }}
    >
      {children}
    </div>
  );
}

export function StaggerItem({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={['stagger-in-item', className].filter(Boolean).join(' ')}>{children}</div>;
}
