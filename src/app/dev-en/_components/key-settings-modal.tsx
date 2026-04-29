'use client';

import { Bell, Info, X, Zap } from 'lucide-react';
import { useState } from 'react';
import { updateKeySettings, type ApiKey } from '../_lib/mock-store';
import { useLang } from '../_lib/use-lang';

interface KeySettingsModalProps {
  open: boolean;
  apiKey: ApiKey | null;
  onClose: () => void;
}

/**
 * Per-key settings modal. Currently covers two opt-in controls:
 *
 *   1. Monthly spend cap — hard cap; once reached the key stops serving
 *      until either the next billing cycle or the cap is raised. "No cap"
 *      is the sane default for most developers.
 *
 *   2. Low-balance email alert — fires once when the key's remaining
 *      balance crosses the configured threshold downward. Useful for
 *      teams who want a heads-up before a key goes dark.
 *
 * Gate + lazy-init pattern: we mount `OpenedKeySettingsModal` only while
 * open=true, so every open starts with state initialised from the
 * current key snapshot without violating set-state-in-effect rules.
 */
export function KeySettingsModal({ open, apiKey, onClose }: KeySettingsModalProps) {
  if (!open || !apiKey) return null;
  return <OpenedKeySettingsModal apiKey={apiKey} onClose={onClose} />;
}

// Calls billing model: spend cap & low-balance threshold are now expressed
// as call counts. We keep the legacy `*_cents` field name (1:1 mapping) so
// the API surface keeps working without renames.
// TODO: rename `spend_cap_cents` / `threshold_cents` → `*_calls` in backend.
function intToInput(n: number): string {
  return String(Math.max(0, Math.round(n)));
}

function parseInputToInt(raw: string): number {
  const n = parseInt(raw.replace(/[^0-9]/g, ''), 10);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

function OpenedKeySettingsModal({
  apiKey,
  onClose,
}: {
  apiKey: ApiKey;
  onClose: () => void;
}) {
  const { tx, t } = useLang();
  // Spend cap
  const [capEnabled, setCapEnabled] = useState(apiKey.spendCapCents !== null);
  const [capCalls, setCapCalls] = useState(
    apiKey.spendCapCents !== null ? intToInput(apiKey.spendCapCents) : '5000',
  );

  // Low-balance alert
  const [alertEnabled, setAlertEnabled] = useState(
    apiKey.lowBalanceAlert?.enabled ?? false,
  );
  const [alertCalls, setAlertCalls] = useState(
    apiKey.lowBalanceAlert?.thresholdCents !== undefined
      ? intToInput(apiKey.lowBalanceAlert.thresholdCents)
      : '500',
  );

  const save = () => {
    const capCents = capEnabled ? parseInputToInt(capCalls) : null;
    const alertThreshold = alertEnabled ? parseInputToInt(alertCalls) : 0;
    updateKeySettings(apiKey.id, {
      spendCapCents: capCents,
      lowBalanceAlert: alertEnabled
        ? { enabled: true, thresholdCents: alertThreshold }
        : null,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      translate="no"
      lang="en"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-[480px] max-h-[90vh] overflow-y-auto rounded-2xl bg-background border border-border shadow-2xl">
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

        <div className="px-5 py-5 space-y-6">
          {/* ─── Spend cap ────────────────────────────────────────── */}
          <section>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-semibold">{t('Monthly call cap', '月度调用上限')}</h4>
            </div>
            <p className="mt-1 text-[12px] text-muted-foreground leading-snug">
              {t(
                "Hard stop once this key's call count in a month hits the cap. The cap resets on your billing cycle day.",
                '此 Key 当月调用次数到达上限后立刻停止服务，下个计费日重置。',
              )}
            </p>

            <div className="mt-3 space-y-2">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="radio"
                  name="cap"
                  checked={!capEnabled}
                  onChange={() => setCapEnabled(false)}
                  className="h-3.5 w-3.5 accent-foreground"
                />
                <span className="text-sm">
                  {tx('No cap')}
                  <span className="ml-1.5 text-[11px] text-muted-foreground">
                    {t(
                      '(default · runs until balance is depleted)',
                      '（默认 · 运行至余额耗尽）',
                    )}
                  </span>
                </span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="cap"
                  checked={capEnabled}
                  onChange={() => setCapEnabled(true)}
                  className="h-3.5 w-3.5 accent-foreground"
                />
                <span className="text-sm flex items-center gap-2">
                  {tx('Cap at')}
                  <span className="inline-flex items-center h-8 rounded-md border border-border bg-background focus-within:border-foreground/30 focus-within:ring-2 focus-within:ring-ring/20 transition-colors">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={capCalls}
                      onChange={(e) => setCapCalls(e.target.value.replace(/[^0-9]/g, ''))}
                      onFocus={() => setCapEnabled(true)}
                      className="w-24 h-full px-2.5 text-sm bg-transparent tabular-nums outline-none"
                    />
                    <span className="pr-2.5 text-[11px] text-muted-foreground">
                      {t('calls', '次')}
                    </span>
                  </span>
                  <span className="text-[11px] text-muted-foreground">{tx('per month')}</span>
                </span>
              </label>
            </div>
          </section>

          {/* ─── Low-balance alert ─────────────────────────────────── */}
          <section>
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-semibold">{t('Low-calls email alert', '剩余次数告警')}</h4>
            </div>
            <p className="mt-1 text-[12px] text-muted-foreground leading-snug">
              {t(
                "Send a one-time email when this key's remaining calls drop to (or below) the threshold. Resets once you top up above it.",
                '当此 Key 剩余次数低于阈值时，发送一封提醒邮件；充值至阈值之上后自动重置。',
              )}
            </p>

            <label className="mt-3 flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={alertEnabled}
                onChange={(e) => setAlertEnabled(e.target.checked)}
                className="h-3.5 w-3.5 accent-foreground"
              />
              <span className="text-sm flex items-center gap-2">
                {t('Email me when calls left drop below', '剩余次数低于以下值时发送邮件')}
                <span className="inline-flex items-center h-8 rounded-md border border-border bg-background focus-within:border-foreground/30 focus-within:ring-2 focus-within:ring-ring/20 transition-colors">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={alertCalls}
                    onChange={(e) => setAlertCalls(e.target.value.replace(/[^0-9]/g, ''))}
                    onFocus={() => setAlertEnabled(true)}
                    disabled={!alertEnabled}
                    className="w-24 h-full px-2.5 text-sm bg-transparent tabular-nums outline-none disabled:text-muted-foreground"
                  />
                  <span className="pr-2.5 text-[11px] text-muted-foreground">
                    {t('calls', '次')}
                  </span>
                </span>
              </span>
            </label>
          </section>

          {/* Info footer */}
          <div className="flex items-start gap-2 rounded-md bg-muted/30 border border-border/60 px-3 py-2.5 text-[11px] text-muted-foreground leading-relaxed">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>
              {t(
                'These settings apply only to this key. Your account also has a global monthly cap on the ',
                '这些设置仅适用于此 Key。你的账号在 ',
              )}
              <span className="font-medium text-foreground">{tx('Billing')}</span>
              {t(
                ' page as a safety net across every key.',
                ' 页面还设置了全局月度上限，作为所有 Key 的安全网。',
              )}
            </span>
          </div>
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
            onClick={save}
            className="h-9 px-4 rounded-lg bg-foreground text-background text-sm font-medium hover:brightness-110"
          >
            {tx('Save settings')}
          </button>
        </div>
      </div>
    </div>
  );
}
