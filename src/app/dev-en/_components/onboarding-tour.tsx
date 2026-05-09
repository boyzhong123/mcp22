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

  const [active, setActive] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [cardStyle, setCardStyle] = useState<React.CSSProperties>({});
  const rafRef = useRef<number | null>(null);

  // Decide whether to show the tour. Runs once per mount + whenever user changes.
  useEffect(() => {
    if (!user) return;
    if (!pathname.includes('/dashboard')) return;
    const done = localStorage.getItem(TOUR_DONE_KEY);
    if (!done) {
      setActive(true);
      setStepIdx(0);
    }
  }, [user, pathname]);

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
          className="fixed inset-0 z-[9998] bg-black/65"
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
            fill="rgba(0,0,0,0.65)"
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
        className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#111] to-[#0b0b0b] shadow-2xl shadow-black/60 p-4 space-y-3 overflow-hidden"
      >
        {/* Subtle decorative glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-emerald-500/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl"
        />

        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 mb-0.5">
              {t('Step', '步骤')} {stepIdx + 1} / {TOUR_STEPS.length}
            </p>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.06] ring-1 ring-white/10">
                <StepIcon className="h-4 w-4 text-white/90" />
              </span>
              <h3 className="text-[14px] font-semibold text-white leading-snug">
                {t(step.title, step.zhTitle ?? step.title)}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={finish}
            className="mt-0.5 shrink-0 text-zinc-500 hover:text-zinc-200 transition-colors"
            aria-label={t('Close tour', '关闭引导')}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-1" aria-hidden="true">
          {TOUR_STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1 rounded-full transition-all duration-200 ${
                i === stepIdx ? 'w-4 bg-white' : i < stepIdx ? 'w-1 bg-white/40' : 'w-1 bg-white/15'
              }`}
            />
          ))}
        </div>

        {/* Body text */}
        <p className="text-[13px] leading-relaxed text-zinc-400">
          {t(step.body, step.zhBody ?? step.body)}
        </p>

        {/* Action row */}
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={finish}
            className="text-[12px] text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            {t('Skip tour', '跳过引导')}
          </button>
          <div className="flex items-center gap-2">
            {stepIdx > 0 && (
              <button
                type="button"
                onClick={prev}
                className="flex items-center gap-0.5 rounded-lg px-2.5 py-1.5 text-[12px] text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <ChevronLeft className="h-3 w-3" />
                {t('Back', '上一步')}
              </button>
            )}
            <button
              type="button"
              onClick={next}
              className="flex items-center gap-0.5 rounded-lg bg-white px-3 py-1.5 text-[12px] font-semibold text-black hover:bg-zinc-200 transition-colors"
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
    </>
  );
}
