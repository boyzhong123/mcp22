'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Check,
  Copy,
  CreditCard,
  DollarSign,
  Eye,
  EyeOff,
  Info,
  Key,
  MoreHorizontal,
  Pause,
  Pencil,
  Pin,
  PinOff,
  Play,
  Plus,
  Settings,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  createKey,
  formatCalls,
  formatDateShort,
  getAccountCallsRemaining,
  getAccountTrialRemaining,
  getBillingTier,
  getKeyMonthlyCalls,
  getKeyMonthlyEvaluationPoints,
  getKeyTodayCalls,
  getKeyTodayEvaluationPoints,
  listKeys,
  renameKey,
  setKeyPaused,
  setKeyPinned,
  type AccountTrialRemaining,
  type ApiKey,
} from '../../_lib/mock-store';
import { useMockStore } from '../../_lib/use-mock-store';
import { StripeCheckoutModal } from '../../_components/stripe-checkout-modal';
import { showActionToast } from '../../_components/action-toast';
import { KeySettingsModal } from '../../_components/key-settings-modal';
import { ModalPortal } from '../../_components/modal-portal';
import { AccountWalletStrip } from '../../_components/account-wallet-strip';
import { AccountLimitsSummary } from '../../_components/account-limits-summary';
import { useLang } from '../../_lib/use-lang';
import { describeError, keys as keysApi } from '../../_lib/api';
import { useAuth } from '../../_lib/auth-context';
import { hydrateFromApi, mapApiKeyToMock, realKeyId } from '../../_lib/mock-store-bridge';

const DEFAULT_TRIAL: AccountTrialRemaining = {
  totalLeft: 0,
  totalExhausted: true,
  expired: false,
  expiresAt: new Date().toISOString(),
  daysLeft: 0,
};

export default function KeysPage() {
  // Wallet model: every key is equal — no Starter/Paid split — so we
  // subscribe once to the full key list and render it flat.
  const allKeys = useMockStore(listKeys, [] as ApiKey[]);
  const { tx, t } = useLang();
  const { isDemo } = useAuth();

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, string>>({});
  const [visibleKeyIds, setVisibleKeyIds] = useState<Set<string>>(() => new Set());

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [justCreated, setJustCreated] = useState<ApiKey | null>(null);
  const [confirmPause, setConfirmPause] = useState<ApiKey | null>(null);
  const [rename, setRename] = useState<{ key: ApiKey; value: string } | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [addCreditsFor, setAddCreditsFor] = useState<ApiKey | null>(null);
  // Account-level top-ups (wallet strip, empty state, trial banner) don't
  // need a key context. We track them with a separate boolean so toggling
  // either path doesn't fight the key-scoped flow above.
  const [addCreditsOpen, setAddCreditsOpen] = useState(false);
  const [settingsFor, setSettingsFor] = useState<ApiKey | null>(null);

  const sortedKeys = useMemo(() => {
    // Pinned keys always float to the top, then revoked sinks to the
    // bottom; within each band we keep insertion order (which approximates
    // "most recently created first" because `createKey` prepends).
    return allKeys.slice().sort((a, b) => {
      const aPin = a.pinned ? 1 : 0;
      const bPin = b.pinned ? 1 : 0;
      if (aPin !== bPin) return bPin - aPin;
      const aRev = a.status === 'revoked' ? 1 : 0;
      const bRev = b.status === 'revoked' ? 1 : 0;
      if (aRev !== bRev) return aRev - bRev;
      return 0;
    });
  }, [allKeys]);

  const reveal = async (id: string) => {
    const cached = revealedSecrets[id];
    if (cached) return cached;
    if (isDemo) {
      const secret = allKeys.find((key) => key.id === id)?.secret;
      if (!secret) return null;
      setRevealedSecrets((current) => ({ ...current, [id]: secret }));
      return secret;
    }
    try {
      const full = await keysApi.reveal(realKeyId(id));
      if (!full) return null;
      setRevealedSecrets((current) => ({ ...current, [id]: full }));
      return full;
    } catch (err) {
      console.error('[keys] reveal failed for', id, err);
      showActionToast({
        title: t('Unable to reveal key', '无法显示完整 Key'),
        description: describeError(err),
      });
      return null;
    }
  };

  const toggleVisibility = async (id: string) => {
    if (visibleKeyIds.has(id)) {
      setVisibleKeyIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
      return;
    }
    const full = await reveal(id);
    if (!full) return;
    setVisibleKeyIds((current) => new Set(current).add(id));
  };

  // Copy the full plaintext key via the reveal endpoint. A freshly created
  // key is already available in memory, so that one does not need a second
  // reveal request.
  const copy = async (freshSecret: string | undefined, id: string) => {
    const isFresh = id.endsWith(':fresh');
    const baseId = isFresh ? id.slice(0, -':fresh'.length) : id;
    const full = isFresh ? freshSecret : await reveal(baseId);
    if (!full) return;
    let ok = false;
    if (navigator.clipboard?.writeText) {
      try { await navigator.clipboard.writeText(full); ok = true; } catch { /* secure-context only */ }
    }
    if (!ok) {
      const ta = document.createElement('textarea');
      ta.value = full;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { ok = document.execCommand('copy'); } catch { /* noop */ }
      document.body.removeChild(ta);
    }
    if (ok) {
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1500);
    }
  };

  const trial = useMockStore(getAccountTrialRemaining, DEFAULT_TRIAL);

  const openCreate = () => {
    setNewName('');
    setCreateError(null);
    setCreateOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      const created = isDemo
        ? createKey(newName)
        : mapApiKeyToMock(await keysApi.create({ name: newName.trim() || 'Untitled key' }));
      if (!isDemo) await hydrateFromApi({ force: true });
      setJustCreated(created);
      setCreateOpen(false);
      showActionToast({
        title: t('Key created', 'Key 创建成功'),
        description: t('Copy and store the secret securely.', '请及时复制并妥善保存完整 Key。'),
      });
    } catch (err) {
      setCreateError(describeError(err));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8" translate="no" lang="en">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-[-0.02em]">{t('API Keys', 'API 密钥')}</h1>
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
            {t(
              'Create as many keys as you need — every key on the account shares the same signup bonus and evaluation-point pool. Bonus points expire when their validity window ends or when they are used up.',
              '按需创建任意数量的 Key — 账户内所有 Key 共享同一份注册赠送积分和评测积分池；赠送积分到期或用完即失效。',
            )}
          </p>
        </div>
        <button
          id="create-key"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-foreground text-background text-sm font-medium hover:brightness-110 transition-all shrink-0"
        >
          <Plus className="h-4 w-4" />
          {t('Create key', '创建 Key')}
        </button>
      </div>

      {/* Account wallet + trial summary. Replaces the old per-key
           exhausted banner — under the wallet model the same balance
           drives every key, so a single strip is the right surface. */}
      <AccountWalletStrip onAddCredits={() => setAddCreditsOpen(true)} />

      {/* Read-only summary of the four account-level caps. The Keys page
           is the chosen "display home" for limits — the editor lives at
           /dashboard/limits, but every Key lives under these caps so it
           makes sense to surface them right here. */}
      <AccountLimitsSummary />

      {/* Trial-exhausted banner — surfaces only when the trial package
           is spent/expired AND the wallet is empty. */}
      {trial.totalExhausted && getAccountCallsRemaining() === 0 && (
        <TrialExhaustedBanner onAddCredits={() => setAddCreditsOpen(true)} />
      )}

      {/* ─── "Your new key" toast ───────────────────────────────── */}
      {justCreated && (
        <NewKeyToast
          apiKey={justCreated}
          copiedId={copiedId}
          onCopy={copy}
          onAddCredits={() => {
            setAddCreditsFor(justCreated);
            setJustCreated(null);
          }}
          onDismiss={() => setJustCreated(null)}
        />
      )}

      {/* ─── Unified key list ───────────────────────────────────────
           Wallet model: there is no Starter / Paid split anymore. Every
           key shares the same trial allowance + wallet, so we render one
           flat list and let the user create as many as they want. The
           starter (default first key) appears alongside the rest with no
           special chrome — only its `cannot-delete` constraint differs. */}
      <section>
        <SectionHeader
          icon={Key}
          title={t('Your keys', '你的 Key')}
          subtitle={t(
            'All keys consume the same trial points and evaluation-point pool. Set per-key point / call caps in Settings if you want to throttle a specific key.',
            '所有 Key 共享同一份试用评测积分与评测积分池。如需限流可在「设置」中为单个 Key 配置积分 / 调用上限。',
          )}
          toneClass="text-foreground"
        />

        {allKeys.length === 0 ? (
          <EmptyPaidKeysState onCreate={openCreate} />
        ) : (
          <div className="rounded-xl border border-border bg-background">
            {/* The wrapper deliberately omits `overflow-hidden`: the per-row
                "more" menu pops below its trigger and was getting clipped by
                the rounded container. We isolate header rounding via
                `rounded-t-xl` on the header row instead so visual chrome
                stays intact. */}
            <PaidTableHeader />
            <ul className="divide-y divide-border">
              {sortedKeys.map((k) => (
                <PaidKeyRow
                  key={k.id}
                  apiKey={k}
                  copy={copy}
                  copiedId={copiedId}
                  revealedSecret={revealedSecrets[k.id]}
                  visible={visibleKeyIds.has(k.id)}
                  onToggleVisibility={() => void toggleVisibility(k.id)}
                  onSettings={() => setSettingsFor(k)}
                  onPause={() => setConfirmPause(k)}
                  onResume={() => setKeyPaused(k.id, false)}
                  onRename={() => setRename({ key: k, value: k.name })}
                  onTogglePin={() => setKeyPinned(k.id, !k.pinned)}
                  menuOpen={menuFor === k.id}
                  setMenu={(open) => setMenuFor(open ? k.id : null)}
                />
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* ─── Modals ─────────────────────────────────────────────── */}
      {createOpen && (
        <Modal onClose={() => setCreateOpen(false)} title={t('Create API key', '创建 API Key')}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                {tx('Name')}
              </label>
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={tx('e.g. Mobile app, Staging, CI')}
                className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-foreground/30"
              />
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2.5 text-[11px] text-muted-foreground leading-relaxed">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>
                {t(
                  'Every key on this account shares the same signup trial package and evaluation-point pool. You can create as many as you need — no environment or per-key billing setup required.',
                  '账户内所有 Key 共享同一份注册试用包和评测积分池。可按需创建任意数量，无需选择环境或单独设置计费。',
                )}
              </span>
            </div>
            {createError ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">{createError}</div>
            ) : null}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="h-9 px-4 rounded-lg border border-border bg-background hover:bg-muted/50 text-sm font-medium"
              >
                {tx('Cancel')}
              </button>
              <button
                type="submit"
                disabled={creating}
                className="h-9 px-4 rounded-lg bg-foreground text-background text-sm font-medium hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creating ? t('Creating…', '正在创建…') : t('Create key', '创建 Key')}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {rename && (
        <Modal onClose={() => setRename(null)} title={tx('Rename key')}>
          <input
            autoFocus
            value={rename.value}
            onChange={(e) => setRename({ key: rename.key, value: e.target.value })}
            className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-foreground/30"
          />
          <div className="flex items-center justify-end gap-2 mt-5">
            <button
              onClick={() => setRename(null)}
              className="h-9 px-4 rounded-lg border border-border bg-background hover:bg-muted/50 text-sm font-medium"
            >
              {tx('Cancel')}
            </button>
            <button
              onClick={() => {
                renameKey(rename.key.id, rename.value);
                setRename(null);
              }}
              className="h-9 px-4 rounded-lg bg-foreground text-background text-sm font-medium hover:brightness-110"
            >
              {tx('Save')}
            </button>
          </div>
        </Modal>
      )}

      {confirmPause && (
        <Modal onClose={() => setConfirmPause(null)} title={t('Disable key', '停用 Key')}>
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Pause className="h-4 w-4 text-amber-600 dark:text-amber-500" />
            </div>
            <p className="text-sm text-muted-foreground">
              {t('Disabling ', '停用 ')}
              <strong className="text-foreground">{confirmPause.name}</strong>
              {t(
                ' will immediately reject every request that uses it (HTTP 401). You can re-enable it any time.',
                ' 将立即拒绝所有使用该 Key 的请求（HTTP 401）。你可以随时重新启用。',
              )}
            </p>
          </div>
          <div className="flex items-center justify-end gap-2 mt-5">
            <button
              onClick={() => setConfirmPause(null)}
              className="h-9 px-4 rounded-lg border border-border bg-background hover:bg-muted/50 text-sm font-medium"
            >
              {tx('Cancel')}
            </button>
            <button
              onClick={() => {
                setKeyPaused(confirmPause.id, true);
                setConfirmPause(null);
              }}
              className="h-9 px-4 rounded-lg bg-amber-500 text-white text-sm font-medium hover:brightness-110"
            >
              {t('Disable key', '停用 Key')}
            </button>
          </div>
        </Modal>
      )}

      <StripeCheckoutModal
        open={!!addCreditsFor || addCreditsOpen}
        onClose={() => {
          setAddCreditsFor(null);
          setAddCreditsOpen(false);
        }}
        keyId={addCreditsFor?.id}
      />

      <KeySettingsModal
        open={!!settingsFor}
        apiKey={settingsFor}
        onClose={() => setSettingsFor(null)}
      />
    </div>
  );
}

// ─── Presentational bits ──────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  toneClass,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  toneClass: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
      <div className="min-h-12 min-w-0">
        <div className="flex items-center gap-2">
          <Icon className={cn('h-4 w-4', toneClass)} />
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-foreground">
            {title}
          </h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground max-w-xl leading-relaxed">
          {subtitle}
        </p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

function NewKeyToast({
  apiKey,
  copiedId,
  onCopy,
  onAddCredits,
  onDismiss,
}: {
  apiKey: ApiKey;
  copiedId: string | null;
  onCopy: (text: string, id: string) => Promise<void>;
  onAddCredits: () => void;
  onDismiss: () => void;
}) {
  const { tx, t } = useLang();
  return (
    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.04] p-4">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
          <Check className="h-4 w-4 text-emerald-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">
            {apiKey.name} {t('— secret ready', '— 密钥已生成')}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {tx("Copy it now — for security, we won't show it in full again.")}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <code className="flex-1 font-mono text-[12px] px-3 py-2 rounded-md bg-background border border-border overflow-x-auto whitespace-nowrap">
              {apiKey.secret}
            </code>
            <button
              onClick={() => onCopy(apiKey.secret, apiKey.id + ':fresh')}
              className="h-9 px-3 rounded-md border border-border bg-background hover:bg-muted/50 text-xs font-medium inline-flex items-center gap-1.5"
            >
              {copiedId === apiKey.id + ':fresh' ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" /> {tx('Copied')}
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> {tx('Copy')}
                </>
              )}
            </button>
            <button
              onClick={onDismiss}
              className="h-9 w-9 rounded-md hover:bg-muted/50 flex items-center justify-center text-muted-foreground"
              aria-label={tx('Dismiss')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {!apiKey.isStarter && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <div className="text-[11px] text-muted-foreground">
                {t('This key needs purchased calls before it can serve traffic.', '此 Key 需要先购买调用次数才能开始服务请求。')}
              </div>
              <button
                onClick={onAddCredits}
                className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md bg-foreground text-background text-[11px] font-medium hover:brightness-110"
              >
                <DollarSign className="h-3 w-3" /> {t('Top up', '充值')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



function PaidTableHeader() {
  const { t, tx } = useLang();
  return (
    <div className="hidden lg:grid grid-cols-[minmax(150px,1.1fr)_minmax(140px,.9fr)_minmax(150px,.95fr)_minmax(95px,.65fr)_minmax(95px,.65fr)_minmax(85px,.55fr)_112px] gap-3 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-foreground/70 bg-gradient-to-b from-muted/60 to-muted/30 border-b border-border rounded-t-xl">
      <div>{tx('Key')}</div>
      <div>{t('Usage today', '今日用量')}</div>
      <div>{t('Usage this month', '本月用量')}</div>
      <div>{t('Daily limits', '每日上限')}</div>
      <div>{t('Monthly limits', '月度上限')}</div>
      <div>{t('Last used', '最近使用')}</div>
      <div className="text-right pr-1">{tx('Actions')}</div>
    </div>
  );
}

function EmptyPaidKeysState({ onCreate }: { onCreate: () => void }) {
  const { t } = useLang();
  return (
    <div className="rounded-xl border border-dashed border-border bg-background px-6 py-12 text-center">
      <div className="mx-auto h-10 w-10 rounded-lg bg-muted flex items-center justify-center mb-3">
        <Key className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">{t('No keys yet', '暂无 API Key')}</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
        {t(
          'Create your first key to start integrating. The free trial unlocks automatically — add evaluation points whenever you need more.',
          '创建第一把 Key 即可开始接入。注册赠送积分会自动生效；用完后随时充值评测积分即可继续。',
        )}
      </p>
      <button
        onClick={onCreate}
        className="mt-4 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-foreground text-background text-sm font-medium hover:brightness-110"
      >
        <Plus className="h-4 w-4" />
        {t('Create key', '创建 Key')}
      </button>
    </div>
  );
}

function PaidKeyRow({
  apiKey: k,
  copy,
  copiedId,
  revealedSecret,
  visible,
  onToggleVisibility,
  onSettings,
  onPause,
  onResume,
  onRename,
  onTogglePin,
  menuOpen,
  setMenu,
}: {
  apiKey: ApiKey;
  copy: (secret: string, id: string) => Promise<void>;
  copiedId: string | null;
  revealedSecret?: string;
  visible: boolean;
  onToggleVisibility: () => void;
  onSettings: () => void;
  /** Open the confirm-disable modal. */
  onPause: () => void;
  /** Re-enable a paused key (no confirm needed — symmetric with the toggle). */
  onResume: () => void;
  onRename: () => void;
  /** Toggle the user-pinned flag (floats this row to the top). */
  onTogglePin: () => void;
  menuOpen: boolean;
  setMenu: (open: boolean) => void;
}) {
  const { lang, tx, t } = useLang();
  const isRevoked = k.status === 'revoked';
  const isPaused = k.status === 'paused';
  const isEnabled = !isRevoked && !isPaused;
  const isPinned = !!k.pinned;
  const tier = getBillingTier(k);
  const todayCalls = getKeyTodayCalls(k.id);
  const todayPoints = getKeyTodayEvaluationPoints(k.id);
  const monthCalls = getKeyMonthlyCalls(k.id);
  const monthPoints = getKeyMonthlyEvaluationPoints(k.id);
  const callCap = k.monthlyCallCap;

  const hasPointCap = k.monthlyPointCap !== null && k.monthlyPointCap > 0;
  const hasCallCap = callCap != null && callCap > 0;
  const dailyPointCap = k.dailyPointCap ?? null;
  const dailyCallCap = k.dailyCallCap ?? null;

  return (
    <li
      className={cn(
        'group relative px-5 py-3.5 lg:grid lg:grid-cols-[minmax(150px,1.1fr)_minmax(140px,.9fr)_minmax(150px,.95fr)_minmax(95px,.65fr)_minmax(95px,.65fr)_minmax(85px,.55fr)_112px] lg:gap-3 lg:items-start flex flex-col gap-3 transition-colors hover:bg-muted/20',
        // Pinned rows get a faint amber wash and a left accent — visible
        // but never noisy enough to fight the row's own status colour.
        isPinned && !isRevoked && 'bg-amber-50/40 dark:bg-amber-500/[0.04] hover:bg-amber-50/60',
        isRevoked && 'opacity-60',
        isPaused && 'bg-muted/30',
      )}
    >
      {/* Vertical accent bar communicates pin status without taking up
          horizontal space. Hidden when the key is also revoked so we
          don't double up status hints. */}
      {isPinned && !isRevoked && (
        <span
          aria-hidden
          className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r bg-amber-400/80"
        />
      )}

      {/* ─── Identity column: toggle · name · status pills · last4 ─── */}
      <div className="min-h-12 min-w-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <EnableToggle
            enabled={isEnabled}
            disabled={isRevoked}
            onChange={(next) => {
              if (next) onResume();
              else onPause();
            }}
            labelOn={tx('Enabled')}
            labelOff={isRevoked ? tx('Revoked') : tx('Disabled')}
          />
          <span
            className={cn(
              'text-[13px] font-semibold truncate tracking-tight',
              isPaused && 'text-muted-foreground',
            )}
            title={k.name}
          >
            {k.name}
          </span>
          {isPinned && !isRevoked && (
            <Pin className="h-3 w-3 text-amber-500 shrink-0" />
          )}
          {tier === 'needs-credits' && isEnabled && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400">
              {tx('Needs points')}
            </span>
          )}
          {isPaused && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wider bg-muted text-muted-foreground border border-border">
              {tx('Disabled')}
            </span>
          )}
          {isRevoked && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wider bg-destructive/15 text-destructive">
              {tx('Revoked')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 mt-1 pl-[40px]">
          <code
            className={cn(
              'font-mono text-[11px] tracking-tight',
              visible ? 'break-all text-foreground' : 'text-muted-foreground/90',
            )}
          >
            {visible ? revealedSecret : `sk_…${k.secret.slice(-4)}`}
          </code>
          <button
            type="button"
            onClick={onToggleVisibility}
            disabled={isRevoked}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground/80 hover:bg-muted/60 hover:text-foreground disabled:opacity-40"
            aria-label={visible ? t('Hide full key', '隐藏完整 Key') : t('Show full key', '显示完整 Key')}
            title={visible ? t('Hide full key', '隐藏完整 Key') : t('Show full key', '显示完整 Key')}
          >
            {visible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </button>
          <button
            type="button"
            onClick={() => copy(k.secret, k.id)}
            disabled={isRevoked}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground/80 hover:bg-muted/60 hover:text-foreground disabled:opacity-40"
            aria-label={copiedId === k.id ? t('Copied', '已复制') : t('Copy full key', '复制完整 Key')}
            title={tx('Copy full secret')}
          >
            {copiedId === k.id ? (
              <Check className="h-3 w-3 text-emerald-500" />
            ) : (
              <Copy className="h-2.5 w-2.5" />
            )}
          </button>
          <span className="text-[10.5px] text-muted-foreground/70 tabular-nums ml-1.5">
            · {formatDateShort(k.createdAt)}
          </span>
        </div>
      </div>

      <KeyUsageCell
        label={t('Usage today', '今日用量')}
        calls={todayCalls}
        points={todayPoints}
        callCap={dailyCallCap}
        pointCap={dailyPointCap}
      />

      <KeyUsageCell
        label={t('Usage this month', '本月用量')}
        calls={monthCalls}
        points={monthPoints}
        callCap={callCap}
        pointCap={k.monthlyPointCap}
      />

      {/* ─── Limits column ───────────────────────────────────────
           Daily and monthly caps are separate columns so every value saved
           in the settings dialog remains visible from the list. Their order
           mirrors the usage columns to the left (today, then this month). */}
      <KeyLimitCell
        label={t('Daily limits', '每日上限')}
        pointCap={dailyPointCap != null && dailyPointCap > 0 ? dailyPointCap : null}
        callCap={dailyCallCap != null && dailyCallCap > 0 ? dailyCallCap : null}
        onSettings={onSettings}
        disabled={isRevoked}
      />

      <KeyLimitCell
        label={t('Monthly limits', '月度上限')}
        pointCap={hasPointCap ? k.monthlyPointCap : null}
        callCap={hasCallCap ? callCap : null}
        onSettings={onSettings}
        disabled={isRevoked}
      />

      <div className="min-h-12 min-w-0 text-xs tabular-nums">
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground lg:hidden">
          {t('Last used', '最近使用')}
        </div>
        {k.lastUsedAt ? (
          <span className="text-foreground/80">
            {new Date(k.lastUsedAt).toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        ) : (
          <span className="text-muted-foreground">{t('Never used', '尚未使用')}</span>
        )}
      </div>

      {/* ─── Actions ────────────────────────────────────────────────
           Grouped into a single subtle pill-shaped container so the row
           ends in one cohesive control unit instead of four floating
           icons. Removed the per-key "$" button — top-up is account-level
           now (driven by the wallet strip CTA), so a per-row dollar icon
           was misleading. The "more" trigger sits past a hairline divider
           to mark it as the menu launcher. */}
      <div className="flex lg:justify-end items-center relative">
        <div className="inline-flex items-center rounded-lg border border-border bg-background shadow-sm p-0.5 gap-0.5">
          <IconButton
            icon={isPinned ? PinOff : Pin}
            title={isPinned ? t('Unpin', '取消置顶') : t('Pin to top', '置顶')}
            onClick={onTogglePin}
            active={isPinned}
          />
          <IconButton
            as="link"
            icon={BarChart3}
            title={tx('View usage for this key')}
            href={`/dashboard/usage?key=${k.id}`}
          />
          <span aria-hidden className="h-4 w-px bg-border mx-0.5" />
          <IconButton
            icon={MoreHorizontal}
            title={tx('More')}
            onClick={() => setMenu(!menuOpen)}
          />
        </div>
        {menuOpen && (
          <>
            {/* Backdrop sits at z-40 so clicking anywhere else dismisses the
                menu without obscuring its own dropdown. */}
            <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} />
            <div className="absolute right-0 top-9 z-50 w-44 rounded-lg border border-border bg-popover shadow-xl py-1 text-sm">
              <MenuItem
                icon={isPinned ? PinOff : Pin}
                label={isPinned ? t('Unpin', '取消置顶') : t('Pin to top', '置顶')}
                onClick={() => {
                  setMenu(false);
                  onTogglePin();
                }}
              />
              <MenuItem
                icon={Pencil}
                label={tx('Rename')}
                onClick={() => {
                  setMenu(false);
                  onRename();
                }}
                disabled={isRevoked}
              />
              <MenuItem
                icon={Settings}
                label={t('Limits & alerts', '上限与提醒')}
                onClick={() => {
                  setMenu(false);
                  onSettings();
                }}
                disabled={isRevoked}
              />
              {!isRevoked && (
                <MenuItem
                  icon={isPaused ? Play : Pause}
                  label={isPaused ? t('Enable key', '启用 Key') : t('Disable key', '停用 Key')}
                  onClick={() => {
                    setMenu(false);
                    if (isPaused) onResume();
                    else onPause();
                  }}
                />
              )}
            </div>
          </>
        )}
      </div>
    </li>
  );
}

function KeyUsageCell({
  label,
  calls,
  points,
  callCap,
  pointCap,
}: {
  label: string;
  calls: number;
  points: number;
  callCap: number | null;
  pointCap: number | null;
}) {
  const { t } = useLang();

  return (
    <div className="min-h-14 min-w-0 space-y-2">
      <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground lg:hidden">
        {label}
      </div>
      <UsageMetric
        icon={Zap}
        label={t('Calls', '次数')}
        used={calls}
        cap={callCap}
      />
      <UsageMetric
        icon={Sparkles}
        label={t('Points', '积分')}
        used={points}
        cap={pointCap}
      />
    </div>
  );
}

function UsageMetric({
  icon: Icon,
  label,
  used,
  cap,
}: {
  icon: LucideIcon;
  label: string;
  used: number;
  cap: number | null;
}) {
  const { t } = useLang();
  const normalizedCap = cap != null && cap > 0 ? cap : null;
  const percent = normalizedCap == null ? null : Math.min(100, (used / normalizedCap) * 100);
  const progressTone = percent == null
    ? null
    : percent >= 100
      ? { bar: 'bg-red-500', text: 'text-red-600 dark:text-red-400' }
      : percent >= 90
        ? { bar: 'bg-orange-500', text: 'text-orange-600 dark:text-orange-400' }
        : percent >= 70
          ? { bar: 'bg-amber-400', text: 'text-amber-700 dark:text-amber-300' }
          : { bar: 'bg-emerald-500/70', text: 'text-emerald-700 dark:text-emerald-300' };

  return (
    <div>
      <div className="flex min-w-0 items-center gap-1 text-[10.5px] leading-none tabular-nums">
        <Icon className="size-3 shrink-0 text-muted-foreground" />
        <span className="shrink-0 text-muted-foreground">{label}</span>
        <span className="truncate font-semibold text-foreground">
          {formatCalls(used)} / {normalizedCap == null ? t('Unlimited', '不限') : formatCalls(normalizedCap)}
        </span>
        {percent != null ? (
          <span className={cn('ml-auto shrink-0 text-[9.5px] font-medium', progressTone?.text)}>
            {percent.toFixed(0)}%
          </span>
        ) : null}
      </div>
      {percent != null ? (
        <div
          className="mt-1 h-1 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-label={`${label} ${percent.toFixed(0)}%`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(percent)}
        >
          <div
            className={cn('h-full rounded-full transition-colors', progressTone?.bar)}
            style={{ width: `${percent}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}

/**
 * Compact pill showing a single per-key cap (spend $/mo or calls/mo).
 * Active = a cap is configured; muted = "no cap". Clicking the parent
 * row's button takes the user into the settings modal — the chip
 * itself is presentational.
 */
function KeyLimitCell({
  label,
  pointCap,
  callCap,
  onSettings,
  disabled,
}: {
  label: string;
  pointCap: number | null;
  callCap: number | null;
  onSettings: () => void;
  disabled: boolean;
}) {
  const { t } = useLang();
  const hasLimit = pointCap != null || callCap != null;

  return (
    <div className="min-h-12 min-w-0">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground lg:hidden">
        {label}
      </div>
      <button
        type="button"
        onClick={onSettings}
        disabled={disabled}
        className={cn(
          '-mx-1 rounded-md px-1 py-0 text-left transition-colors hover:bg-muted/50 disabled:pointer-events-none disabled:opacity-40',
          !hasLimit &&
            'inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300',
        )}
        title={t('Configure key limits', '配置 Key 上限')}
      >
        {hasLimit ? (
          <span className="grid gap-1 text-[11px] tabular-nums">
            <span className={cn('inline-flex items-center gap-1.5', pointCap == null && 'text-muted-foreground')}>
              <Sparkles className="size-3 shrink-0" />
              {pointCap == null
                ? t('Points: unlimited', '积分：不限')
                : t(`${formatCalls(pointCap)} points`, `${formatCalls(pointCap)} 积分`)}
            </span>
            <span className={cn('inline-flex items-center gap-1.5', callCap == null && 'text-muted-foreground')}>
              <Zap className="size-3 shrink-0" />
              {callCap == null
                ? t('Calls: unlimited', '次数：不限')
                : t(`${formatCalls(callCap)} calls`, `${formatCalls(callCap)} 次`)}
            </span>
          </span>
        ) : (
          <>
            <Plus className="size-3" />
            <span className="text-[11px]">{t('Set limits', '设置上限')}</span>
          </>
        )}
      </button>
    </div>
  );
}

/**
 * Square icon button used in the row's action cluster. Renders either a
 * <button> or a <Link> based on the `as` prop. Centralised so every
 * action has identical 32x32 sizing, hover treatment, and active state
 * (used for the pin toggle).
 */
function IconButton({
  icon: Icon,
  title,
  onClick,
  href,
  disabled,
  active,
  as = 'button',
}: {
  icon: LucideIcon;
  title: string;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  active?: boolean;
  as?: 'button' | 'link';
}) {
  const cls = cn(
    'h-8 w-8 rounded-md inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors disabled:opacity-40 disabled:pointer-events-none',
    active && 'bg-amber-500/10 text-amber-600 hover:text-amber-700 hover:bg-amber-500/15',
  );
  if (as === 'link' && href) {
    return (
      <Link href={href} title={title} aria-label={title} className={cls}>
        <Icon className="h-3.5 w-3.5" />
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={cls}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

/**
 * Single dropdown menu item with a leading icon.
 *
 * Centralised so every action in the row's "more" menu shares the same
 * height, padding, and hover treatment — and so it's a one-liner to add
 * an icon for "Rename" etc. without duplicating Tailwind soup at every
 * call site.
 */
function MenuItem({
  icon: Icon,
  label,
  onClick,
  disabled,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: 'default' | 'destructive';
}) {
  const isDestructive = tone === 'destructive';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full px-3 py-1.5 text-left inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent',
        isDestructive
          ? 'text-destructive hover:bg-destructive/10'
          : 'hover:bg-muted/50',
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span>{label}</span>
    </button>
  );
}

/**
 * Compact on/off switch used on each key row. Refined to match the
 * Linear / Vercel aesthetic — neutral foreground colour when on (no
 * loud emerald), smaller knob with a subtle shadow, and a focus ring
 * for keyboard users. Hit area stays generous (28×16) so it's still
 * comfortable on touch.
 */
function EnableToggle({
  enabled,
  disabled,
  onChange,
  labelOn,
  labelOff,
}: {
  enabled: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
  labelOn: string;
  labelOff: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={enabled ? labelOn : labelOff}
      title={enabled ? labelOn : labelOff}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!enabled);
      }}
      className={cn(
        'relative h-4 w-7 shrink-0 rounded-full transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-1',
        'disabled:cursor-not-allowed disabled:opacity-40',
        enabled
          ? 'bg-foreground'
          : 'bg-zinc-200 dark:bg-zinc-700',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-3 w-3 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.18)] transition-all',
          enabled ? 'left-[14px]' : 'left-0.5',
        )}
      />
    </button>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const { tx } = useLang();
  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        translate="no"
        lang="en"
      >
        <div className="absolute inset-0 bg-black/40 dark:bg-black/70" onClick={onClose} />
        <div className="relative w-full max-w-[440px] rounded-xl bg-background border border-border shadow-2xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="text-sm font-semibold">{title}</h3>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-md hover:bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground"
              aria-label={tx('Close')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="px-5 py-5">{children}</div>
        </div>
      </div>
    </ModalPortal>
  );
}

/**
 * Guide modal shown when user tries to copy the Starter key. Nudges them
 * toward creating a paid key for production use while still allowing the
 * copy to proceed for development purposes.
 */

/**
 * Account-wide exhaustion banner — shows when both the free trial AND
 * the wallet are spent. Single CTA: top up the account wallet (every key
 * gets unblocked at once).
 */
function TrialExhaustedBanner({ onAddCredits }: { onAddCredits: () => void }) {
  const { tx, t } = useLang();
  return (
    <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/[0.07] via-amber-500/[0.04] to-background p-5">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="h-10 w-10 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Zap className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-sm font-semibold">
                {t('Account out of points', '账户评测积分已耗尽')}
              </h3>
              <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400">
                {t('Points & trial empty', '积分与试用均已用完')}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
                {t(
                'The signup trial package is no longer available and the evaluation-point pool is empty. Top up to unblock every key on your account.',
                '注册试用包已不可用，评测积分也已用完。充值后账户内所有 Key 立即恢复服务。',
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onAddCredits}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-foreground text-background text-sm font-semibold hover:brightness-110"
          >
            <CreditCard className="h-4 w-4" />
            {tx('Add points')}
          </button>
          <Link
            href="/dashboard/billing/rates"
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border bg-background hover:bg-muted/50 text-sm font-medium"
          >
            {tx('View pricing')}
          </Link>
        </div>
      </div>
    </div>
  );
}
