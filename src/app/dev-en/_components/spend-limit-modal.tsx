'use client';

import { AlertTriangle, Info, X, Zap } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  formatCalls,
  getSpendLimit,
  setSpendLimitCents,
} from '../_lib/mock-store';
import { useMockStore } from '../_lib/use-mock-store';
import { useLang } from '../_lib/use-lang';

interface SpendLimitModalProps {
  open: boolean;
  onClose: () => void;
  onSaved?: (monthlyCapCalls: number) => void;
}

const WARN_PRESETS = [50, 75, 90];

// Calls billing model: spend cap is now expressed as a maximum number of
// calls per month. The legacy backend field is `monthly_limit_cents`; for
// now we treat the stored integer 1:1 as a call count (1 cent ≡ 1 call) so
// the existing API surface keeps working without renames. Future migration:
// rename to `monthly_limit_calls` and drop the conversion.
// TODO: backend rename `monthly_limit_cents` → `monthly_limit_calls`.

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
    monthlyCapCents: 0,
    resetDay: 1,
    warnAtPercents: [50, 75, 90],
  });
  const [value, setValue] = useState<string>(() =>
    String(limit.monthlyCapCents || 0),
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

  const parsedCalls = useMemo(() => {
    const n = parseInt(value.replace(/[^0-9]/g, ''), 10);
    if (!Number.isFinite(n) || n < 0) return null;
    return n;
  }, [value]);

  const invalid = touched && (parsedCalls === null || parsedCalls < 1);
  const canSave = parsedCalls !== null && parsedCalls >= 1;

  const toggleWarn = (p: number) => {
    setWarn((w) => (w.includes(p) ? w.filter((x) => x !== p) : [...w, p].sort((a, b) => a - b)));
  };

  const handleSave = () => {
    setTouched(true);
    if (!canSave) return;
    setSpendLimitCents(parsedCalls!, warn);
    onSaved?.(parsedCalls!);
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
              {t('Modify call limit', '修改调用上限')}
              <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 border border-amber-500/30">
                {tx('Experimental')}
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {t(
                'Monthly call cap enforced across all your API keys',
                '针对你所有 API key 统一执行的月度调用上限',
              )}
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
              {t('Monthly call limit', '月度调用上限')}
            </label>
            <div className="relative">
              <Zap className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                inputMode="numeric"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value.replace(/[^0-9]/g, '').slice(0, 9));
                  setTouched(true);
                }}
                placeholder="0"
                className={cn(
                  'w-full h-10 pl-9 pr-16 text-sm rounded-lg border bg-background tabular-nums focus:outline-none focus:ring-2 focus:ring-ring/20',
                  invalid
                    ? 'border-destructive/60 focus:border-destructive/60'
                    : 'border-border focus:border-foreground/30',
                )}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground pointer-events-none">
                {t('calls', '次')}
              </span>
            </div>
            {invalid ? (
              <div className="mt-1.5 text-[11px] text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {t(
                  'Set a call limit of at least 1.',
                  '请至少设置 1 次。',
                )}
              </div>
            ) : (
              <div className="mt-1.5 text-[11px] text-muted-foreground">
                {t('Currently set to', '当前设置为')}{' '}
                {limit.monthlyCapCents > 0
                  ? `${formatCalls(limit.monthlyCapCents)} ${t('calls', '次')}`
                  : t('Not set', '未设置')}
                .
              </div>
            )}
          </div>

          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">
              {t('Email warnings at', '以下用量时邮件提醒')}
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
              {t(
                'Call limits are enforced with up to 10 minutes of latency; small overages may occur. Counters reset at 12:00 AM on the 1st of each month (Pacific time).',
                '调用上限的生效延迟最多 10 分钟，可能出现少量超额。每月 1 号太平洋时间 0 点重置计数。',
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
            {t('Save limit', '保存上限')}
          </button>
        </div>
      </div>
    </div>
  );
}
