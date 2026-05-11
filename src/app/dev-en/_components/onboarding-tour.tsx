'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  LayoutDashboard,
  Settings,
  Sparkles,
  Wallet,
  X,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useAuth } from '../_lib/auth-context';
import { useLang } from '../_lib/use-lang';
import { TOUR_STEPS, type TourStep } from '../_lib/onboarding-steps';
import { closeTour } from '../_lib/ui-store';
import { useUi } from '../_lib/use-ui-store';

const TOUR_DONE_KEY = 'dev-en:tour-done:v1';
const CARD_WIDTH = 320;
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
  const cardH = 240; // rough estimate

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
      case 'settings':
        return Settings;
      case 'book':
        return BookOpen;
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
          {/* Highlight ring around the target */}
          {svgRect && (
            <rect
              x={svgRect.x}
              y={svgRect.y}
              width={svgRect.w}
              height={svgRect.h}
              rx={8}
              fill="transparent"
              stroke="rgba(255,255,255,0.25)"
              strokeWidth="1.5"
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
        className="rounded-xl bg-white overflow-hidden shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_12px_32px_-4px_rgba(0,0,0,0.14),0_0_0_1px_rgba(0,0,0,0.06)]"
      >
        {/* Emerald progress bar */}
        <div className="h-[3px] bg-zinc-100">
          <div
            className="h-full bg-emerald-500 transition-all duration-300 ease-out"
            style={{ width: `${((stepIdx + 1) / TOUR_STEPS.length) * 100}%` }}
          />
        </div>

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                <StepIcon className="h-3.5 w-3.5" />
              </span>
              <h3 className="text-[13.5px] font-semibold text-zinc-900 leading-snug">
                {t(step.title, step.zhTitle ?? step.title)}
              </h3>
            </div>
            <button
              type="button"
              onClick={finish}
              className="shrink-0 h-6 w-6 -mt-0.5 -mr-1 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
              aria-label={t('Close tour', '关闭引导')}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Body */}
          <p className="text-[13px] leading-[1.65] text-zinc-500 mb-4">
            {t(step.body, step.zhBody ?? step.body)}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] tabular-nums text-zinc-400">
              {stepIdx + 1} / {TOUR_STEPS.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={finish}
                className="h-7 px-2.5 rounded-md text-[12px] text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
              >
                {t('Skip', '跳过')}
              </button>
              {stepIdx > 0 && (
                <button
                  type="button"
                  onClick={prev}
                  className="h-7 w-7 rounded-md flex items-center justify-center text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 transition-colors"
                  aria-label={t('Back', '上一步')}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={next}
                className="h-7 px-3 rounded-md bg-zinc-900 text-[12px] font-medium text-white hover:bg-zinc-700 transition-colors flex items-center gap-1"
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
    </>
  );
}
