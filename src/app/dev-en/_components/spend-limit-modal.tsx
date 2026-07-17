'use client';

import { Info, Sparkles, X, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  getSpendLimit,
  updateSpendLimit,
  type SpendLimit,
} from '../_lib/mock-store';
import { useMockStore } from '../_lib/use-mock-store';
import { useLang } from '../_lib/use-lang';
import { billing, describeError } from '../_lib/api';
import { useAuth } from '../_lib/auth-context';
import { hydrateFromApi } from '../_lib/mock-store-bridge';
import { ModalPortal } from './modal-portal';

interface SpendLimitModalProps {
  open: boolean;
  onClose: () => void;
  onSaved?: (limit: SpendLimit) => void;
}

const WARN_PRESETS = [50, 75, 90];

const DEFAULT_LIMIT: SpendLimit = {
  monthlyPointCap: null,
  monthlyCallCap: null,
  dailyPointCap: null,
  dailyCallCap: null,
  resetDay: 1,
  warnAtPercents: WARN_PRESETS,
};

/**
 * Stand-alone form body — used both by the legacy modal and by the
 * dedicated `/dashboard/limits` page.
 *
 * The form owns no chrome (no header, no fixed footer); callers wrap
 * it as appropriate. Saving applies via `updateSpendLimit` and shows
 * an inline "Saved" pulse on the page version, while the modal closes
 * itself via `onSaved`.
 */
export function SpendLimitForm({
  onCancel,
  onSaved,
  cancelLabel,
  saveLabel,
}: {
  onCancel?: () => void;
  onSaved?: (limit: SpendLimit) => void;
  cancelLabel?: string;
  saveLabel?: string;
}) {
  const { tx, t } = useLang();
  const { isDemo } = useAuth();
  const limit = useMockStore<SpendLimit>(getSpendLimit, DEFAULT_LIMIT);

  const [monthlyPointsOn, setMonthlyPointsOn] = useState(
    limit.monthlyPointCap != null,
  );
  const [monthlyPoints, setMonthlyPoints] = useState(
    limit.monthlyPointCap != null ? String(limit.monthlyPointCap) : '50000',
  );
  const [monthlyCallsOn, setMonthlyCallsOn] = useState(limit.monthlyCallCap != null);
  const [monthlyCalls, setMonthlyCalls] = useState(
    limit.monthlyCallCap != null ? String(limit.monthlyCallCap) : '100000',
  );
  const [dailyPointsOn, setDailyPointsOn] = useState(limit.dailyPointCap != null);
  const [dailyPoints, setDailyPoints] = useState(
    limit.dailyPointCap != null ? String(limit.dailyPointCap) : '5000',
  );
  const [dailyCallsOn, setDailyCallsOn] = useState(limit.dailyCallCap != null);
  const [dailyCalls, setDailyCalls] = useState(
    limit.dailyCallCap != null ? String(limit.dailyCallCap) : '5000',
  );
  const [warn, setWarn] = useState<number[]>(() => limit.warnAtPercents);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The first render may use the local fallback while DataHydrator is still
  // loading. Keep the draft synchronized when the authoritative limits arrive.
  useEffect(() => {
    // This is an intentional external-store hydration boundary: the form may
    // mount before the authenticated limits request completes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMonthlyPointsOn(limit.monthlyPointCap != null);
    setMonthlyPoints(limit.monthlyPointCap != null ? String(limit.monthlyPointCap) : '50000');
    setMonthlyCallsOn(limit.monthlyCallCap != null);
    setMonthlyCalls(limit.monthlyCallCap != null ? String(limit.monthlyCallCap) : '100000');
    setDailyPointsOn(limit.dailyPointCap != null);
    setDailyPoints(limit.dailyPointCap != null ? String(limit.dailyPointCap) : '5000');
    setDailyCallsOn(limit.dailyCallCap != null);
    setDailyCalls(limit.dailyCallCap != null ? String(limit.dailyCallCap) : '5000');
    setWarn(limit.warnAtPercents);
  }, [limit]);

  const toggleWarn = (p: number) => {
    setWarn((w) =>
      w.includes(p) ? w.filter((x) => x !== p) : [...w, p].sort((a, b) => a - b),
    );
  };

  const parseCalls = (raw: string): number | null => {
    const n = parseInt(raw.replace(/[^0-9]/g, ''), 10);
    if (!Number.isFinite(n) || n <= 0) return null;
    return n;
  };

  const handleSave = async () => {
    const next: SpendLimit = {
      monthlyPointCap: monthlyPointsOn ? parseCalls(monthlyPoints) : null,
      monthlyCallCap: monthlyCallsOn ? parseCalls(monthlyCalls) : null,
      dailyPointCap: dailyPointsOn ? parseCalls(dailyPoints) : null,
      dailyCallCap: dailyCallsOn ? parseCalls(dailyCalls) : null,
      warnAtPercents: warn,
      resetDay: 1,
    };
    setSaving(true);
    setError(null);
    try {
      if (isDemo) {
        updateSpendLimit(next);
      } else {
        await billing.setLimits({
          monthly_evaluation_point_cap: next.monthlyPointCap ?? 0,
          monthly_call_cap: next.monthlyCallCap ?? 0,
          daily_evaluation_point_cap: next.dailyPointCap ?? 0,
          daily_call_cap: next.dailyCallCap ?? 0,
          warn_at_percents: next.warnAtPercents,
        });
        await hydrateFromApi({ force: true });
      }
      onSaved?.(isDemo ? getSpendLimit() : next);
      setSavedAt(Date.now());
    } catch (err) {
      setError(describeError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <CapSection
          icon={Sparkles}
          title={t('Monthly evaluation-point cap', '月度评测积分上限')}
          description={t(
            'Hard stop once evaluation points used across all keys hit this cap in a calendar month.',
            '当月所有 Key 累计消耗的评测积分达到此上限后立即停止服务。',
          )}
          enabled={monthlyPointsOn}
          setEnabled={setMonthlyPointsOn}
          value={monthlyPoints}
          setValue={setMonthlyPoints}
          currentLabel={
            limit.monthlyPointCap != null
              ? `${tx('Currently')} ${limit.monthlyPointCap.toLocaleString()} ${t('points', '积分')} / ${tx('month')}`
              : null
          }
          unit="points"
          unitSuffix={tx('per month')}
        />

        <CapSection
          icon={Zap}
          title={t('Monthly call cap', '月度调用次数上限')}
          description={t(
            'Hard stop once call count across all keys hits this number in a calendar month.',
            '当月所有 Key 累计调用次数达到该值后立即停止服务。',
          )}
          enabled={monthlyCallsOn}
          setEnabled={setMonthlyCallsOn}
          value={monthlyCalls}
          setValue={setMonthlyCalls}
          currentLabel={
            limit.monthlyCallCap != null
              ? `${tx('Currently')} ${limit.monthlyCallCap.toLocaleString()} ${t('calls', '次')}`
              : null
          }
          unit="calls"
          unitSuffix={tx('per month')}
        />

        <div className="h-px bg-border" />

        <CapSection
          icon={Sparkles}
          title={t('Daily evaluation-point cap', '每日评测积分上限')}
          description={t(
            'Resets at midnight (UTC). Useful to bound a runaway day without changing the monthly point cap.',
            '每天 UTC 0 点重置。可在不调整月度积分上限的前提下限制单日消耗。',
          )}
          enabled={dailyPointsOn}
          setEnabled={setDailyPointsOn}
          value={dailyPoints}
          setValue={setDailyPoints}
          currentLabel={
            limit.dailyPointCap != null
              ? `${tx('Currently')} ${limit.dailyPointCap.toLocaleString()} ${t('points', '积分')} / ${tx('day')}`
              : null
          }
          unit="points"
          unitSuffix={tx('per day')}
        />

        <CapSection
          icon={Zap}
          title={t('Daily call cap', '每日调用次数上限')}
          description={t(
            'Resets at midnight (UTC). Helpful to throttle bursty integrations.',
            '每天 UTC 0 点重置。可用于限制突发性集成。',
          )}
          enabled={dailyCallsOn}
          setEnabled={setDailyCallsOn}
          value={dailyCalls}
          setValue={setDailyCalls}
          currentLabel={
            limit.dailyCallCap != null
              ? `${tx('Currently')} ${limit.dailyCallCap.toLocaleString()} ${t('calls', '次')}`
              : null
          }
          unit="calls"
          unitSuffix={tx('per day')}
        />

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
              'Checks do not reserve calls or points, so brief overages are possible under concurrency. Each axis evaluates independently — whichever cap is hit first stops later traffic.',
              '检查不会预占调用量或积分，因此并发时可能短暂超额。各维度独立判定，先达到的维度会阻断后续流量。',
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-border/60 flex items-center justify-end gap-2">
        {error && (
          <span className="mr-auto max-w-[65%] text-[11px] text-destructive">{error}</span>
        )}
        {savedAt && (
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mr-auto">
            {t('Saved', '已保存')}
          </span>
        )}
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="h-9 px-4 text-xs font-medium rounded-md border border-border bg-background hover:bg-muted/50 transition-colors"
          >
            {cancelLabel ?? tx('Cancel')}
          </button>
        )}
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="h-9 px-4 text-xs font-semibold rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? t('Saving…', '正在保存…') : saveLabel ?? t('Save limits', '保存上限')}
        </button>
      </div>
    </>
  );
}

/**
 * Account-wide guardrails modal — kept for any callers that still
 * trigger inline editing (e.g. legacy command-palette deep-link). New
 * code should navigate to `/dashboard/limits` instead.
 */
export function SpendLimitModal({ open, onClose, onSaved }: SpendLimitModalProps) {
  const { tx, t } = useLang();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/40 dark:bg-black/70"
          onClick={onClose}
        />
        <div className="relative w-full max-w-[520px] max-h-[90vh] overflow-y-auto rounded-2xl bg-background border border-border shadow-2xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
            <div>
              <div className="text-sm font-semibold flex items-center gap-2">
                {t('Account point & call limits', '账户积分与调用上限')}
                <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 border border-amber-500/30">
                  {tx('Experimental')}
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {t(
                  'Hard guardrails that apply to every API key on the account. Leave any axis Unlimited to opt out.',
                  '账户级硬性限制，对所有 API Key 同时生效。任意维度可保持「不限制」以放开。',
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

          <div className="px-5 py-5">
            <SpendLimitForm
              onCancel={onClose}
              onSaved={(l) => {
                onSaved?.(l);
                onClose();
              }}
            />
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

/**
 * Single configurable cap row. Two radio options ("Unlimited" / "Cap at
 * X"); focusing the input auto-selects the second radio so users don't
 * fight the form. Everything below is layout — the parent owns the
 * state and validation rules.
 */
function CapSection({
  icon: Icon,
  title,
  description,
  enabled,
  setEnabled,
  value,
  setValue,
  unit,
  unitSuffix,
  currentLabel,
}: {
  icon: typeof Sparkles;
  title: string;
  description: string;
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  value: string;
  setValue: (v: string) => void;
  unit: 'points' | 'calls';
  unitSuffix: string;
  currentLabel: string | null;
}) {
  const { tx, t } = useLang();
  const radioName = `cap-${title}`;

  return (
    <section>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h4 className="text-sm font-semibold">{title}</h4>
      </div>
      <p className="mt-1 text-[12px] text-muted-foreground leading-snug">
        {description}
      </p>

      <div className="mt-3 space-y-2">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="radio"
            name={radioName}
            checked={!enabled}
            onChange={() => setEnabled(false)}
            className="h-3.5 w-3.5 accent-foreground"
          />
          <span className="text-sm">
            {t('Unlimited', '不限制')}
            <span className="ml-1.5 text-[11px] text-muted-foreground">
              {t('(default)', '（默认）')}
            </span>
          </span>
        </label>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="radio"
            name={radioName}
            checked={enabled}
            onChange={() => setEnabled(true)}
            className="h-3.5 w-3.5 accent-foreground"
          />
          <span className="text-sm flex items-center gap-2">
            {tx('Cap at')}
            <span className="inline-flex items-center h-8 rounded-md border border-border bg-background focus-within:border-foreground/30 focus-within:ring-2 focus-within:ring-ring/20 transition-colors">
              <input
                type="text"
                inputMode="numeric"
                value={value}
                onChange={(e) =>
                  setValue(
                    e.target.value.replace(/[^0-9]/g, ''),
                  )
                }
                onFocus={() => setEnabled(true)}
                className={cn(
                  'h-full text-sm bg-transparent tabular-nums outline-none',
                  'w-24 px-2.5',
                )}
              />
              {unit === 'calls' && (
                <span className="pr-2.5 text-[11px] text-muted-foreground">
                  {t('calls', '次')}
                </span>
              )}
              {unit === 'points' && (
                <span className="pr-2.5 text-[11px] text-muted-foreground">
                  {t('points', '积分')}
                </span>
              )}
            </span>
            <span className="text-[11px] text-muted-foreground">{unitSuffix}</span>
          </span>
        </label>
        {currentLabel && (
          <div className="text-[11px] text-muted-foreground/80 pl-6">
            {currentLabel}
          </div>
        )}
      </div>
    </section>
  );
}
