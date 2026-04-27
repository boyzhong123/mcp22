'use client';

import { AlertTriangle, Info, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { formatCents, getSpendLimit, setSpendLimitCents } from '../_lib/mock-store';
import { useMockStore } from '../_lib/use-mock-store';
import { useLang } from '../_lib/use-lang';

interface SpendLimitModalProps {
  open: boolean;
  onClose: () => void;
  onSaved?: (monthlyCapCents: number) => void;
}

const WARN_PRESETS = [50, 75, 90];

export function SpendLimitModal({ open, onClose, onSaved }: SpendLimitModalProps) {
  if (!open) return null;
  return <OpenedSpendLimitModal onClose={onClose} onSaved={onSaved} />;
}

function OpenedSpendLimitModal({
  onClose,
  onSaved,
}: Omit<SpendLimitModalProps, 'open'>) {
  const { tx, t } = useLang();
  const limit = useMockStore(getSpendLimit, {
    monthlyCapCents: 5000_00,
    resetDay: 1,
    warnAtPercents: [50, 75, 90],
  });
  const [value, setValue] = useState<string>(() =>
    (limit.monthlyCapCents / 100).toFixed(2),
  );
  const [warn, setWarn] = useState<number[]>(() =>
    limit.warnAtPercents.length ? limit.warnAtPercents : WARN_PRESETS,
  );
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const parsedCents = useMemo(() => {
    const n = parseFloat(value);
    if (!Number.isFinite(n) || n < 0) return null;
    return Math.round(n * 100);
  }, [value]);

  const invalid = touched && (parsedCents === null || parsedCents < 100);
  const canSave = parsedCents !== null && parsedCents >= 100;

  const toggleWarn = (p: number) => {
    setWarn((w) => (w.includes(p) ? w.filter((x) => x !== p) : [...w, p].sort((a, b) => a - b)));
  };

  const handleSave = () => {
    setTouched(true);
    if (!canSave) return;
    setSpendLimitCents(parsedCents!, warn);
    onSaved?.(parsedCents!);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-[440px] rounded-2xl bg-background border border-border shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
          <div>
            <div className="text-sm font-semibold flex items-center gap-2">
              {tx('Modify spend limit')}
              <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 border border-amber-500/30">
                {tx('Experimental')}
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {tx('Monthly cap enforced across all your API keys')}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            aria-label={tx('Close')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              {tx('Monthly spend limit (USD)')}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value.replace(/[^0-9.]/g, '').slice(0, 10));
                  setTouched(true);
                }}
                placeholder="0.00"
                className={cn(
                  'w-full h-10 pl-7 pr-3 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring/20',
                  invalid
                    ? 'border-destructive/60 focus:border-destructive/60'
                    : 'border-border focus:border-foreground/30',
                )}
              />
            </div>
            {invalid ? (
              <div className="mt-1.5 text-[11px] text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {t(
                  'Set a spend limit of at least $1.00.',
                  '请至少设置 $1.00 的消费上限。',
                )}
              </div>
            ) : (
              <div className="mt-1.5 text-[11px] text-muted-foreground">
                {t('Currently set to', '当前设置为')} {formatCents(limit.monthlyCapCents)}.
              </div>
            )}
          </div>

          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">
              {tx('Email warnings at')}
            </div>
            <div className="flex items-center gap-2">
              {WARN_PRESETS.map((p) => {
                const active = warn.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => toggleWarn(p)}
                    className={cn(
                      'h-8 px-3 rounded-full text-xs font-medium border transition-colors',
                      active
                        ? 'bg-foreground text-background border-foreground'
                        : 'border-border bg-background hover:border-foreground/40 text-muted-foreground',
                    )}
                  >
                    {p}%
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 flex gap-2 text-[11px] text-muted-foreground">
            <Info className="h-3.5 w-3.5 shrink-0 mt-[1px]" />
            <div className="leading-relaxed">
              {tx(
                'Spend limits are enforced with up to 10 minutes of latency; small overages may occur. Counters reset at 12:00 AM on the 1st of each month (Pacific time).',
              )}
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-border/60 flex items-center justify-end gap-2 bg-muted/20">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 text-xs font-medium rounded-md border border-border bg-background hover:bg-muted/50 transition-colors"
          >
            {tx('Cancel')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="h-9 px-4 text-xs font-semibold rounded-md bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {tx('Save limit')}
          </button>
        </div>
      </div>
    </div>
  );
}
