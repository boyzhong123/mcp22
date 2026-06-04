'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Gauge,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  Settings,
  Sparkles,
  Wallet,
  X,
} from 'lucide-react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '../_lib/auth-context';
import { useLang } from '../_lib/use-lang';
import { TOUR_STEPS, type TourStep } from '../_lib/onboarding-steps';
import { closeTour } from '../_lib/ui-store';
import { useUi } from '../_lib/use-ui-store';

const TOUR_DONE_KEY = 'dev-en:tour-done:v1';
const CARD_WIDTH = 336;
const CARD_HEIGHT_ESTIMATE = 360;
const PAD = 10; // padding around highlighted element

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function getTargetRect(selector: string): TargetRect | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

function computeCardPosition(
  rect: TargetRect | null,
  step: TourStep,
): React.CSSProperties {
  if (!rect || step.placement === 'center') {
    return {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    };
  }

  const { top, left, width, height } = rect;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cardH = CARD_HEIGHT_ESTIMATE;

  // Space available on each side
  const spaceRight = vw - (left + width + PAD);
  const spaceBottom = vh - (top + height + PAD);
  const spaceLeft = left - PAD;

  if (spaceRight >= CARD_WIDTH + 12) {
    // Place to the right
    return {
      position: 'fixed',
      left: left + width + PAD + 4,
      top: Math.max(PAD, Math.min(top - 8, vh - cardH - PAD)),
    };
  }
  if (spaceLeft >= CARD_WIDTH + 12) {
    // Place to the left
    return {
      position: 'fixed',
      left: left - CARD_WIDTH - PAD - 4,
      top: Math.max(PAD, Math.min(top - 8, vh - cardH - PAD)),
    };
  }
  if (spaceBottom >= cardH + 12) {
    // Place below
    return {
      position: 'fixed',
      top: top + height + PAD + 4,
      left: Math.max(PAD, Math.min(left, vw - CARD_WIDTH - PAD)),
    };
  }
  // Fall back to above
  return {
    position: 'fixed',
    bottom: vh - top + PAD + 4,
    left: Math.max(PAD, Math.min(left, vw - CARD_WIDTH - PAD)),
  };
}

export function OnboardingTour() {
  const { user, clearIsNewUser } = useAuth();
  const pathname = usePathname();
  const { t } = useLang();
  const tourOpenSignal = useUi((s) => s.tourOpen);

  const [active, setActive] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [cardStyle, setCardStyle] = useState<React.CSSProperties>({});
  const rafRef = useRef<number | null>(null);

  // Auto-show on first visit (no localStorage key yet).
  useEffect(() => {
    if (!user) return;
    if (!pathname.includes('/dashboard')) return;
    const done = localStorage.getItem(TOUR_DONE_KEY);
    if (!done) {
      setActive(true);
      setStepIdx(0);
    }
  }, [user, pathname]);

  // Re-open when triggered from the topbar "?" button via ui-store.
  useEffect(() => {
    if (!tourOpenSignal) return;
    setStepIdx(0);
    setActive(true);
  }, [tourOpenSignal]);

  const step = TOUR_STEPS[stepIdx] as TourStep | undefined;
  const StepIcon = useMemo(() => {
    switch (step?.icon) {
      case 'layout':
        return LayoutDashboard;
      case 'key':
        return KeyRound;
      case 'usage':
        return BarChart3;
      case 'wallet':
        return Wallet;
      case 'gauge':
        return Gauge;
      case 'settings':
        return Settings;
      case 'book':
        return BookOpen;
      case 'lifebuoy':
        return LifeBuoy;
      case 'sparkles':
      default:
        return Sparkles;
    }
  }, [step?.icon]);

  // Keep target rect in sync with layout (runs after paint so the DOM is settled).
  const refreshLayout = useCallback(() => {
    if (!step?.selector) {
      setTargetRect(null);
      return;
    }
    const rect = getTargetRect(step.selector);
    setTargetRect(rect);
    setCardStyle(computeCardPosition(rect, step));
  }, [step]);

  // Recalculate on step change or window resize/scroll
  useLayoutEffect(() => {
    if (!active) return;
    refreshLayout();
  }, [active, refreshLayout]);

  useEffect(() => {
    if (!active) return;
    const onResize = () => refreshLayout();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [active, refreshLayout]);

  // Also update card style when targetRect changes (not inside useLayoutEffect
  // because computeCardPosition reads window dimensions).
  useEffect(() => {
    if (!step || !active) return;
    setCardStyle(computeCardPosition(targetRect, step));
  }, [targetRect, step, active]);

  const finish = useCallback(() => {
    setActive(false);
    clearIsNewUser();
    closeTour();
    if (user) {
      try {
        localStorage.setItem(TOUR_DONE_KEY, `${user.id}:${Date.now()}`);
      } catch { /* ignore */ }
    }
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }
  }, [user, clearIsNewUser]);

  const next = useCallback(() => {
    if (stepIdx < TOUR_STEPS.length - 1) {
      setStepIdx((i) => i + 1);
    } else {
      finish();
    }
  }, [stepIdx, finish]);

  const prev = useCallback(() => {
    if (stepIdx > 0) setStepIdx((i) => i - 1);
  }, [stepIdx]);

  // Keyboard navigation
  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish();
      if (e.key === 'ArrowRight' || e.key === 'Enter') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [active, finish, next, prev]);

  if (!active || !step) return null;

  const isCenter = !step.selector || step.placement === 'center';
  const svgRect = targetRect
    ? {
        x: targetRect.left - PAD,
        y: targetRect.top - PAD,
        w: targetRect.width + PAD * 2,
        h: targetRect.height + PAD * 2,
      }
    : null;

  return (
    <>
      {/* ── Spotlight overlay ─────────────────────────────────────────── */}
      {isCenter ? (
        // No spotlight — plain backdrop that closes tour on click
        <div
          className="fixed inset-0 z-[9998] bg-black/50"
          onClick={finish}
          aria-hidden="true"
        />
      ) : (
        // SVG-based cut-out spotlight
        <svg
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 9998,
            pointerEvents: 'none',
          }}
        >
          {svgRect && (
            <defs>
              <mask id="tour-spotlight-mask">
                <rect width="100%" height="100%" fill="white" />
                <rect
                  x={svgRect.x}
                  y={svgRect.y}
                  width={svgRect.w}
                  height={svgRect.h}
                  rx={8}
                  fill="black"
                />
              </mask>
            </defs>
          )}
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.50)"
            mask={svgRect ? 'url(#tour-spotlight-mask)' : undefined}
          />
          {/* Highlight ring around the target — emerald to match the
              console's accent and the Contact launcher. */}
          {svgRect && (
            <rect
              x={svgRect.x}
              y={svgRect.y}
              width={svgRect.w}
              height={svgRect.h}
              rx={8}
              fill="transparent"
              stroke="rgba(16,185,129,0.65)"
              strokeWidth="2"
            />
          )}
        </svg>
      )}

      {/* ── Floating tour card ────────────────────────────────────────── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('Product tour', '产品引导')}
        style={{ ...cardStyle, zIndex: 9999, width: CARD_WIDTH }}
        className="overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl shadow-black/[0.18] dark:shadow-black/60 ring-1 ring-black/[0.02] animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Progress bar — emerald→teal gradient, matching the console accent */}
        <div className="h-[3px] bg-muted">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300 ease-out"
            style={{ width: `${((stepIdx + 1) / TOUR_STEPS.length) * 100}%` }}
          />
        </div>

        {/* Themed illustration strip. All nine small assets stay mounted so
            step changes are instant and fade cleanly without a loading flash. */}
        <div className="relative h-24 overflow-hidden border-b border-emerald-950/[0.06] bg-[#f0f8f4] dark:border-white/[0.06] dark:bg-emerald-950/35">
          {TOUR_STEPS.map((tourStep, i) => (
            <Image
              key={tourStep.id}
              src={`/onboarding-tour/${tourStep.id}.webp`}
              alt=""
              fill
              sizes={`${CARD_WIDTH}px`}
              unoptimized
              className={cn(
                'object-cover transition-opacity duration-300 ease-out dark:brightness-[0.72] dark:saturate-[0.85]',
                i === stepIdx ? 'opacity-100' : 'opacity-0',
              )}
            />
          ))}
          <button
            type="button"
            onClick={finish}
            className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-lg border border-black/[0.06] bg-white/85 text-zinc-500 shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-zinc-900 dark:border-white/10 dark:bg-black/45 dark:text-zinc-300 dark:hover:bg-black/60 dark:hover:text-white"
            aria-label={t('Close tour', '关闭引导')}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="p-5 pt-4">
          {/* Header */}
          <div className="mb-2.5 flex min-w-0 items-center gap-2.5">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/12 text-emerald-600 ring-1 ring-emerald-500/10 dark:text-emerald-400">
              <StepIcon className="h-[18px] w-[18px]" />
            </span>
            <h3 className="text-[14px] font-semibold leading-snug tracking-[-0.01em] text-foreground">
              {t(step.title, step.zhTitle ?? step.title)}
            </h3>
          </div>

          {/* Body */}
          <p className="mb-4 text-[13px] leading-[1.65] text-muted-foreground">
            {t(step.body, step.zhBody ?? step.body)}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5" aria-hidden>
              {TOUR_STEPS.map((s, i) => (
                <span
                  key={s.id}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-300',
                    i === stepIdx
                      ? 'w-4 bg-emerald-500'
                      : i < stepIdx
                        ? 'w-1.5 bg-emerald-500/40'
                        : 'w-1.5 bg-muted-foreground/25',
                  )}
                />
              ))}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={finish}
                className="h-7 rounded-md px-2.5 text-[12px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {t('Skip', '跳过')}
              </button>
              {stepIdx > 0 && (
                <button
                  type="button"
                  onClick={prev}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label={t('Back', '上一步')}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={next}
                className="flex h-7 items-center gap-1 rounded-md bg-foreground px-3 text-[12px] font-medium text-background transition-opacity hover:opacity-90"
              >
                {stepIdx < TOUR_STEPS.length - 1 ? (
                  <>
                    {t('Next', '下一步')}
                    <ChevronRight className="h-3 w-3" />
                  </>
                ) : (
                  t('Done', '完成')
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Persistent controls stay in one place while the tour card moves
          between highlighted targets. */}
      <div
        role="navigation"
        aria-label={t('Persistent tour controls', '固定引导导航')}
        className="fixed bottom-4 left-1/2 z-[10000] flex w-[min(calc(100vw-24px),440px)] -translate-x-1/2 items-center gap-2 rounded-2xl border border-border bg-card/95 p-2 text-card-foreground shadow-2xl shadow-black/20 ring-1 ring-black/[0.03] backdrop-blur-xl dark:shadow-black/60"
      >
        <button
          type="button"
          onClick={prev}
          disabled={stepIdx === 0}
          className="flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3 text-[13px] font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-background"
        >
          <ChevronLeft className="h-4 w-4 shrink-0" />
          {t('Back', '上一步')}
        </button>

        <div
          className="min-w-[52px] text-center text-[11px] font-medium tabular-nums text-muted-foreground"
          aria-live="polite"
        >
          {stepIdx + 1} / {TOUR_STEPS.length}
        </div>

        <button
          type="button"
          onClick={next}
          className="flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl bg-foreground px-3 text-[13px] font-medium text-background shadow-sm transition-opacity hover:opacity-90"
        >
          {stepIdx < TOUR_STEPS.length - 1 ? t('Next', '下一步') : t('Done', '完成')}
          {stepIdx < TOUR_STEPS.length - 1 && <ChevronRight className="h-4 w-4 shrink-0" />}
        </button>
      </div>
    </>
  );
}
