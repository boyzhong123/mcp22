'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { ComponentType, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'default' | 'brand' | 'emerald' | 'amber';

interface StatCardProps {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  href?: string;
  cta?: string;
  onClick?: () => void;
  tone?: Tone;
  progressPct?: number;
  progressColor?: string;
  trend?: {
    direction: 'up' | 'down' | 'flat';
    label: string; // e.g. "+12.4%"
    tone?: 'positive' | 'negative' | 'neutral';
  };
  className?: string;
}

const TONE_ACCENT: Record<Tone, string> = {
  default: 'text-foreground',
  brand: 'text-brand',
  emerald: 'text-emerald-600 dark:text-emerald-400',
  amber: 'text-amber-600 dark:text-amber-400',
};

const TRENDS: Record<'positive' | 'negative' | 'neutral', string> = {
  positive: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
  negative: 'text-red-600 dark:text-red-400 bg-red-500/10',
  neutral: 'text-muted-foreground bg-muted/50',
};

/**
 * Canonical stat / KPI card used across the dashboard.
 *
 * Design rationale (vs. the inline cards we had before):
 *   - Label sits on top, icon on the right (cleaner 2-column rhythm).
 *   - Primary number uses a wider display-scale (28px) with a very tight
 *     letter-spacing and tabular numerals — this is what makes dashboards
 *     feel "Linear/Stripe crisp" instead of "bootstrap-y".
 *   - Border-only surface (`border-border/80`). No tinted background. Hover
 *     subtly raises via border colour, not shadow — cheaper to render and
 *     more composable in grids.
 *   - Optional trend chip and optional progress bar in the same slot,
 *     mutually exclusive in practice.
 */
export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  href,
  cta,
  onClick,
  tone = 'default',
  progressPct,
  progressColor,
  trend,
  className,
}: StatCardProps) {
  const interactive = !!href || !!onClick;
  const inner = (
    <div
      className={cn(
        'group relative rounded-xl border border-border/80 bg-background p-4 transition-colors',
        interactive && 'hover:border-foreground/30 hover:bg-muted/30',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </span>
        {Icon && (
          <Icon className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
        )}
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span
          className={cn(
            'text-[26px] leading-none font-semibold tracking-[-0.02em] tabular-nums',
            TONE_ACCENT[tone],
          )}
        >
          {value}
        </span>
        {trend && (
          <span
            className={cn(
              'text-[10px] font-medium px-1.5 py-0.5 rounded-full leading-none',
              TRENDS[trend.tone ?? 'neutral'],
            )}
          >
            {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'}{' '}
            {trend.label}
          </span>
        )}
      </div>

      {sub && (
        <div className="mt-1.5 text-[11px] text-muted-foreground leading-tight">
          {sub}
        </div>
      )}

      {typeof progressPct === 'number' && (
        <div className="mt-3 h-1 rounded-full bg-muted overflow-hidden">
          <div
            className={cn('h-full transition-all', progressColor ?? 'bg-foreground')}
            style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
          />
        </div>
      )}

      {cta && interactive && (
        <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">
          {cta}
          <ArrowUpRight className="h-3 w-3" />
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="block w-full text-left">
        {inner}
      </button>
    );
  }
  return inner;
}
