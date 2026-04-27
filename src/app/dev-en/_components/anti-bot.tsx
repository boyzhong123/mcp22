'use client';

import { Check, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface AntiBotProps {
  verified: boolean;
  onVerifiedChange: (v: boolean) => void;
}

/**
 * Cloudflare-Turnstile / reCAPTCHA-lookalike anti-bot widget.
 * Purely cosmetic — tries to *feel* like the real thing by showing a short
 * spinner before flipping to a verified state.
 */
export function AntiBot({ verified, onVerifiedChange }: AntiBotProps) {
  const [checking, setChecking] = useState(false);

  const handleClick = () => {
    if (verified || checking) return;
    setChecking(true);
    window.setTimeout(() => {
      setChecking(false);
      onVerifiedChange(true);
    }, 900);
  };

  return (
    <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 flex items-center gap-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={verified || checking}
        className={cn(
          'h-6 w-6 rounded border-2 flex items-center justify-center transition-colors shrink-0',
          verified
            ? 'border-emerald-500 bg-emerald-500'
            : 'border-border bg-background hover:border-foreground/40',
          checking && 'border-foreground/40',
        )}
        aria-label="Verify you are human"
      >
        {verified && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
        {checking && !verified && (
          <span className="h-3 w-3 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-foreground">
          {verified ? 'You are verified' : checking ? 'Verifying…' : "I'm not a robot"}
        </div>
        <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
          Protected against automated sign-ups.
        </div>
      </div>

      <div className="flex items-center gap-1 text-muted-foreground/60">
        <ShieldCheck className="h-3.5 w-3.5" />
        <span className="text-[9px] font-semibold tracking-wide uppercase">Secure</span>
      </div>
    </div>
  );
}
