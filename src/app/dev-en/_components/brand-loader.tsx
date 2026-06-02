'use client';

import { cn } from '@/lib/utils';

/**
 * BrandLoader — the Chivox mark in motion.
 *
 * The static logo is two overlapping circles (blue `#1D72E8` + pink `#F01681`)
 * whose intersection reads as a deep navy. We recreate that intersection live:
 * the two dots blend with `mix-blend-mode: multiply` inside an isolated
 * stacking context, so blue × pink genuinely produces the navy overlap and the
 * result is independent of the page background (works in light and dark). The
 * pair orbits to spin, with a soft breathing pulse so it feels alive.
 */
export function BrandLoader({
  size = 24,
  className,
  label,
}: {
  /** Outer square size in px. The two dots size relative to this. */
  size?: number;
  className?: string;
  /** Optional caption rendered below the mark (for full-page states). */
  label?: string;
}) {
  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={label ?? 'Loading'}
      className={cn('inline-flex flex-col items-center justify-center gap-3', className)}
    >
      <span
        className="brand-loader"
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <span className="brand-loader__pair">
          <span className="brand-loader__dot brand-loader__dot--blue" />
          <span className="brand-loader__dot brand-loader__dot--pink" />
        </span>
      </span>
      {label ? (
        <span className="text-xs font-medium text-muted-foreground tracking-tight">{label}</span>
      ) : null}
    </span>
  );
}
