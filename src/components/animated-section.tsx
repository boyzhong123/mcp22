'use client';

import { useInView, useMotionValue, useSpring, animate } from 'framer-motion';
import { useRef, useEffect, type ReactNode } from 'react';

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

/* ── Animated number counter ────────────────────────────────── */
export function CountUp({
  value,
  suffix = '',
  className = '',
}: {
  value: number;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const motionVal = useMotionValue(0);
  const springVal = useSpring(motionVal, { stiffness: 60, damping: 18 });

  useEffect(() => {
    if (inView) {
      const controls = animate(motionVal, value, { duration: 1.8, ease: 'easeOut' });
      return controls.stop;
    }
  }, [inView, motionVal, value]);

  useEffect(() => {
    return springVal.on('change', (v) => {
      if (ref.current) ref.current.textContent = Math.round(v) + suffix;
    });
  }, [springVal, suffix]);

  return (
    <span ref={ref} className={className}>
      0{suffix}
    </span>
  );
}

/* ── Hover lift card ────────────────────────────────────────── */
export function HoverCard({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={['hover-lift', className].filter(Boolean).join(' ')}>{children}</div>;
}

/* ── Icon pulse on hover ────────────────────────────────────── */
export function IconWrap({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={['icon-lift', className].filter(Boolean).join(' ')}>{children}</div>;
}
