'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface OtpInputProps {
  // External value: a string of digits, length 0..`length`. The component
  // owns the per-slot layout internally; deleting a middle digit leaves
  // an empty slot rather than shifting trailing digits left.
  value: string;
  onChange: (next: string) => void;
  length?: number;
  autoFocus?: boolean;
  disabled?: boolean;
  // Fired when all slots are filled with digits — convenient for auto-submit.
  onComplete?: (value: string) => void;
  ariaLabel?: string;
}

const EMPTY = '';

// 6-box OTP input. Mirrors the patterns in Stripe / Linear / Vercel / Slack:
// one digit per box, focus auto-advances, backspace on an empty box jumps
// back, pasting a 6-digit code fans across boxes, browser autofill
// (`one-time-code`) populates the row at once.
//
// Internal state is a fixed-length string[] of slots, so a middle delete
// leaves the slot empty in place. Externally we expose either the empty
// string (no input yet) or the full digit-only string when every slot is
// populated; partial states emit a string with positional spaces, which
// the parent's standard /^\d{length}$/ check naturally rejects.
export function OtpInput({
  value,
  onChange,
  length = 6,
  autoFocus = false,
  disabled = false,
  onComplete,
  ariaLabel = 'One-time verification code',
}: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  refs.current = refs.current.slice(0, length);

  const [slots, setSlots] = useState<string[]>(() =>
    Array.from({ length }, (_, i) => (value ?? '')[i] ?? EMPTY),
  );

  // Hard-reset slots when the parent clears the value. We avoid resyncing on
  // every keystroke (the parent value reflects what we just emitted), but a
  // shrink-to-empty signals an intentional outside reset.
  useEffect(() => {
    if (!value) {
      setSlots(Array.from({ length }, () => EMPTY));
    }
  }, [value, length]);

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  const commit = (next: string[]) => {
    setSlots(next);
    const allFilled = next.every((s) => /^\d$/.test(s));
    if (allFilled) {
      const joined = next.join('');
      onChange(joined);
      onComplete?.(joined);
    } else {
      // Emit a positional string with spaces in empty slots. Parent's
      // /^\d{length}$/ check naturally rejects this so the submit button
      // stays disabled until the row is complete.
      onChange(next.map((s) => s || ' ').join(''));
    }
  };

  const handleChange = (idx: number, raw: string) => {
    const digits = raw.replace(/\D/g, '');
    const next = [...slots];
    if (!digits) {
      next[idx] = EMPTY;
      commit(next);
      return;
    }
    if (digits.length === 1) {
      next[idx] = digits;
      commit(next);
      const nextEl = refs.current[idx + 1];
      if (nextEl) nextEl.focus();
      return;
    }
    distributeFrom(idx, digits, next);
  };

  const distributeFrom = (startIdx: number, digits: string, base?: string[]) => {
    const next = base ?? [...slots];
    let i = startIdx;
    for (const d of digits) {
      if (i >= length) break;
      next[i++] = d;
    }
    commit(next);
    const focusIdx = Math.min(length - 1, startIdx + digits.length);
    const focusEl = refs.current[focusIdx];
    if (focusEl) {
      focusEl.focus();
      focusEl.select();
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      const next = [...slots];
      if (next[idx]) {
        next[idx] = EMPTY;
        commit(next);
        return;
      }
      const prev = refs.current[idx - 1];
      if (prev) {
        prev.focus();
        next[idx - 1] = EMPTY;
        commit(next);
      }
      e.preventDefault();
      return;
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      refs.current[idx - 1]?.focus();
      return;
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      refs.current[idx + 1]?.focus();
      return;
    }
  };

  const handlePaste = (idx: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!text) return;
    e.preventDefault();
    distributeFrom(idx, text);
  };

  const ids = useMemo(() => Array.from({ length }, (_, i) => i), [length]);

  return (
    <div className="flex items-center gap-2" role="group" aria-label={ariaLabel}>
      {ids.map((i) => {
        const ch = slots[i] ?? '';
        return (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            maxLength={1}
            disabled={disabled}
            value={ch}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={(e) => handlePaste(i, e)}
            onFocus={(e) => e.target.select()}
            aria-label={`Digit ${i + 1} of ${length}`}
            className={cn(
              'h-12 w-11 sm:w-12 text-center font-mono text-lg tabular-nums',
              'rounded-lg border bg-background shadow-sm',
              'focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-foreground/40',
              'transition-colors',
              ch ? 'border-foreground/30' : 'border-border',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            )}
          />
        );
      })}
    </div>
  );
}
