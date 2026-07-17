'use client';

import { Info, Sparkles, X, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { updateKeySettings, type ApiKey } from '../_lib/mock-store';
import { useLang } from '../_lib/use-lang';
import { ModalPortal } from './modal-portal';
import { describeError, keys as keysApi } from '../_lib/api';
import { useAuth } from '../_lib/auth-context';
import { hydrateFromApi, realKeyId } from '../_lib/mock-store-bridge';

interface KeySettingsModalProps {
  open: boolean;
  apiKey: ApiKey | null;
  onClose: () => void;
}

/**
 * Per-key settings modal.
 *
 * Mirrors the account-wide `SpendLimitModal` shape: four independent
 * caps (daily / monthly × evaluation points / calls). Each axis can be opted out with
 * the "Unlimited" radio. Account-level low-balance alerts live in
 * `dashboard/settings`; this modal is purely about per-key
 * guardrails.
 */
export function KeySettingsModal({ open, apiKey, onClose }: KeySettingsModalProps) {
  if (!open || !apiKey) return null;
  return (
    <ModalPortal>
      <OpenedKeySettingsModal apiKey={apiKey} onClose={onClose} />
    </ModalPortal>
  );
}

function OpenedKeySettingsModal({
  apiKey,
  onClose,
}: {
  apiKey: ApiKey;
  onClose: () => void;
}) {
  const { tx, t } = useLang();
  const { isDemo } = useAuth();

  const [monthlyPointsOn, setMonthlyPointsOn] = useState(apiKey.monthlyPointCap != null);
  const [monthlyPoints, setMonthlyPoints] = useState(
    apiKey.monthlyPointCap != null ? String(apiKey.monthlyPointCap) : '50000',
  );

  const [monthlyCallsOn, setMonthlyCallsOn] = useState(apiKey.monthlyCallCap != null);
  const [monthlyCalls, setMonthlyCalls] = useState(
    apiKey.monthlyCallCap != null ? String(apiKey.monthlyCallCap) : '50000',
  );

  const [dailyPointsOn, setDailyPointsOn] = useState(
    apiKey.dailyPointCap != null,
  );
  const [dailyPoints, setDailyPoints] = useState(
    apiKey.dailyPointCap != null ? String(apiKey.dailyPointCap) : '5000',
  );

  const [dailyCallsOn, setDailyCallsOn] = useState(apiKey.dailyCallCap != null);
  const [dailyCalls, setDailyCalls] = useState(
    apiKey.dailyCallCap != null ? String(apiKey.dailyCallCap) : '5000',
  );
  const [loading, setLoading] = useState(!isDemo);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isDemo) return;
    let cancelled = false;
    keysApi.getLimits(realKeyId(apiKey.id))
      .then((limits) => {
        if (cancelled) return;
        setMonthlyPointsOn(limits.monthly_evaluation_point_cap > 0);
        setMonthlyPoints(String(limits.monthly_evaluation_point_cap || 50000));
        setMonthlyCallsOn(limits.monthly_call_cap > 0);
        setMonthlyCalls(String(limits.monthly_call_cap || 50000));
        setDailyPointsOn(limits.daily_evaluation_point_cap > 0);
        setDailyPoints(String(limits.daily_evaluation_point_cap || 5000));
        setDailyCallsOn(limits.daily_call_cap > 0);
        setDailyCalls(String(limits.daily_call_cap || 5000));
      })
      .catch((err) => {
        if (!cancelled) setError(describeError(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [apiKey.id, isDemo]);

  const parseCalls = (raw: string): number | null => {
    const n = parseInt(raw.replace(/[^0-9]/g, ''), 10);
    if (!Number.isFinite(n) || n <= 0) return null;
    return n;
  };

  const save = async () => {
    const patch = {
      monthlyPointCap: monthlyPointsOn ? parseCalls(monthlyPoints) : null,
      monthlyCallCap: monthlyCallsOn ? parseCalls(monthlyCalls) : null,
      dailyPointCap: dailyPointsOn ? parseCalls(dailyPoints) : null,
      dailyCallCap: dailyCallsOn ? parseCalls(dailyCalls) : null,
    };
    setSaving(true);
    setError(null);
    try {
      if (isDemo) {
        updateKeySettings(apiKey.id, patch);
      } else {
        await keysApi.patchSettings(realKeyId(apiKey.id), {
          monthly_evaluation_point_cap: patch.monthlyPointCap ?? 0,
          monthly_call_cap: patch.monthlyCallCap ?? 0,
          daily_evaluation_point_cap: patch.dailyPointCap ?? 0,
          daily_call_cap: patch.dailyCallCap ?? 0,
        });
        await hydrateFromApi({ force: true });
      }
      onClose();
    } catch (err) {
      setError(describeError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      translate="no"
      lang="en"
    >
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/70"
        onClick={onClose}
      />

      <div className="relative w-full max-w-[520px] max-h-[90vh] overflow-y-auto rounded-2xl bg-background border border-border shadow-2xl">
        <div className="flex items-start justify-between px-5 py-4 border-b border-border/60">
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{tx('Key settings')}</div>
            <div className="text-[11px] text-muted-foreground truncate mt-0.5">
              {apiKey.name}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 shrink-0 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            aria-label={tx('Close')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className={cn('px-5 py-5 space-y-6', loading && 'pointer-events-none opacity-60')}>
          <CapSection
            icon={Sparkles}
            title={t('Monthly evaluation-point cap', '月度评测积分上限')}
            description={t(
              "Hard stop once this key's evaluation-point usage in a month hits the cap. Resets on your billing cycle.",
              '此 Key 当月消耗的评测积分达到上限后立即停止服务，下个计费周期重置。',
            )}
            enabled={monthlyPointsOn}
            setEnabled={setMonthlyPointsOn}
            value={monthlyPoints}
            setValue={setMonthlyPoints}
            unit="points"
            unitSuffix={tx('per month')}
          />

          <CapSection
            icon={Zap}
            title={t('Monthly call cap', '月度调用次数上限')}
            description={t(
              "Hard stop once this key's call count in a month hits the cap.",
              '此 Key 当月调用次数达到上限后立即停止服务。',
            )}
            enabled={monthlyCallsOn}
            setEnabled={setMonthlyCallsOn}
            value={monthlyCalls}
            setValue={setMonthlyCalls}
            unit="calls"
            unitSuffix={tx('per month')}
          />

          <div className="h-px bg-border" />

          <CapSection
            icon={Sparkles}
            title={t('Daily evaluation-point cap', '每日评测积分上限')}
            description={t(
              'Resets at midnight (UTC). Useful for keys exposed to spiky user traffic.',
              '每天 UTC 0 点重置。适合面向波动较大的终端用户流量的 Key。',
            )}
            enabled={dailyPointsOn}
            setEnabled={setDailyPointsOn}
            value={dailyPoints}
            setValue={setDailyPoints}
            unit="points"
            unitSuffix={tx('per day')}
          />

          <CapSection
            icon={Zap}
            title={t('Daily call cap', '每日调用次数上限')}
            description={t(
              'Resets at midnight (UTC). Helpful to bound flaky integrations.',
              '每天 UTC 0 点重置。可用于约束不稳定的集成调用。',
            )}
            enabled={dailyCallsOn}
            setEnabled={setDailyCallsOn}
            value={dailyCalls}
            setValue={setDailyCalls}
            unit="calls"
            unitSuffix={tx('per day')}
          />

          <div className="flex items-start gap-2 rounded-md bg-muted/30 border border-border/60 px-3 py-2.5 text-[11px] text-muted-foreground leading-relaxed">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>
              {t(
                'These caps apply only to this key. Account-wide guardrails are configured on the ',
                '这些上限仅作用于此 Key。账户级护栏在 ',
              )}
              <span className="font-medium text-foreground">{tx('Settings')}</span>
              {t(' page.', ' 页面配置。')}
            </span>
          </div>
          {error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-[11px] text-destructive">{error}</div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border/60 bg-muted/20">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-lg border border-border bg-background hover:bg-muted/50 text-sm font-medium"
          >
            {tx('Cancel')}
          </button>
          <button
            type="button"
            onClick={() => void save()}
            disabled={loading || saving}
            className="h-9 px-4 rounded-lg bg-foreground text-background text-sm font-medium hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? t('Saving…', '正在保存…') : tx('Save settings')}
          </button>
        </div>
      </div>
    </div>
  );
}

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
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  value: string;
  setValue: (v: string) => void;
  unit: 'points' | 'calls';
  unitSuffix: string;
}) {
  const { tx, t } = useLang();
  const radioName = `keycap-${title}`;
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
      </div>
    </section>
  );
}
