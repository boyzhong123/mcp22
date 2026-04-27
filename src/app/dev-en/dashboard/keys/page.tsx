'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  BarChart3,
  Check,
  ChevronDown,
  Copy,
  DollarSign,
  FlaskConical,
  Gift,
  Info,
  Key,
  MoreHorizontal,
  Plus,
  Rocket,
  RotateCcw,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
  Zap,
  CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  addProject,
  createKey,
  deleteKey,
  formatCents,
  formatDateShort,
  getBillingTier,
  getKeyBalanceCents,
  getStarterKey,
  isStarterUpgraded,
  keyLast4,
  listKeys,
  listPaidKeys,
  listProjects,
  renameKey,
  revokeKey,
  rotateKeySecret,
  setKeyPaused,
  type ApiKey,
  type Project,
} from '../../_lib/mock-store';
import { useMockStore } from '../../_lib/use-mock-store';
import { StripeCheckoutModal } from '../../_components/stripe-checkout-modal';
import { KeySettingsModal } from '../../_components/key-settings-modal';
import { useLang } from '../../_lib/use-lang';

export default function KeysPage() {
  useMockStore(listKeys, [] as ApiKey[]); // subscribe — list below uses helpers
  const projects = useMockStore(listProjects, [] as Project[]);
  const starter = useMockStore(() => getStarterKey() ?? null, null);
  const paidKeys = useMockStore(listPaidKeys, [] as ApiKey[]);
  const { tx, t } = useLang();

  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEnv, setNewEnv] = useState<'development' | 'production'>('development');
  const [newProjectId, setNewProjectId] = useState<string>('');
  const [inlineNewProject, setInlineNewProject] = useState(false);
  const [inlineProjectName, setInlineProjectName] = useState('');
  const [justCreated, setJustCreated] = useState<ApiKey | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState<ApiKey | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ApiKey | null>(null);
  const [confirmRotate, setConfirmRotate] = useState<ApiKey | null>(null);
  const [rename, setRename] = useState<{ key: ApiKey; value: string } | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [addCreditsFor, setAddCreditsFor] = useState<ApiKey | null>(null);
  const [settingsFor, setSettingsFor] = useState<ApiKey | null>(null);
  const [starterCopyGuide, setStarterCopyGuide] = useState(false);

  const filteredPaid = useMemo(() => {
    return paidKeys.filter((k) => {
      if (projectFilter !== 'all' && k.projectId !== projectFilter) return false;
      return true;
    });
  }, [paidKeys, projectFilter]);

  // Split paid keys into Development / Production so the user sees two
  // clearly separate buckets instead of one long mixed list — matches how
  // most teams actually reason about keys (test vs. live credentials).
  const devPaid = useMemo(
    () => filteredPaid.filter((k) => k.env === 'development'),
    [filteredPaid],
  );
  const prodPaid = useMemo(
    () => filteredPaid.filter((k) => k.env === 'production'),
    [filteredPaid],
  );

  const copy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1500);
    } catch {
      /* ignore */
    }
  };

  // For starter key: show guide modal first (unless user skipped or the key
  // has already been topped up — once upgraded, the daily cap is lifted so
  // the warning is no longer relevant).
  const STARTER_COPY_SKIP_KEY = 'chivox:starter-copy-skip';
  const copyStarter = async (text: string, id: string) => {
    const skip =
      typeof window !== 'undefined' && sessionStorage.getItem(STARTER_COPY_SKIP_KEY) === '1';
    const alreadyUpgraded = starter ? isStarterUpgraded(starter) : false;
    if (!skip && !alreadyUpgraded) {
      setStarterCopyGuide(true);
      return;
    }
    await copy(text, id);
  };

  const confirmStarterCopy = async (dontAskAgain: boolean) => {
    if (dontAskAgain && typeof window !== 'undefined') {
      sessionStorage.setItem(STARTER_COPY_SKIP_KEY, '1');
    }
    setStarterCopyGuide(false);
    if (starter) {
      await copy(starter.secret, starter.id);
    }
  };

  const openCreate = () => {
    setNewName('');
    setNewEnv('development');
    setNewProjectId(projects[0]?.id ?? '');
    setInlineNewProject(false);
    setInlineProjectName('');
    setCreateOpen(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    let projectId = newProjectId;
    if (inlineNewProject) {
      const p = addProject(inlineProjectName || 'New project');
      projectId = p.id;
    }
    if (!projectId) return;
    const created = createKey(newName, newEnv, projectId);
    setJustCreated(created);
    setCreateOpen(false);
  };

  return (
    <div className="space-y-8" translate="no" lang="en">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-[-0.02em]">{t('API Keys', 'API 密钥')}</h1>
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
            {t(
              'Every account gets one free Starter key (30 calls/day · 900 lifetime) for learning and sandboxing. Top up the Starter key to lift its daily cap, or create a dedicated paid key for production traffic — no daily caps, pay only for what you use.',
              '每个账号均自带一把免费 Starter Key（每日 30 次 · 总量 900 次），用于学习和沙箱测试。充值即可解除 Starter 的每日限制；或为生产环境创建独立的付费 Key — 无每日上限，按实际用量计费。',
            )}
          </p>
        </div>
        <button
          id="create-paid-key"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-foreground text-background text-sm font-medium hover:brightness-110 transition-all shrink-0"
        >
          <Plus className="h-4 w-4" />
          {t('Create paid key', '创建付费 Key')}
        </button>
      </div>

      {/* Starter exhausted upgrade banner — only surfaces when 900 lifetime
           calls are spent AND no paid key is funded. Wired identically to
           the Overview banner for consistency. */}
      {starter && starter.freeTotalUsed >= starter.freeTotalLimit &&
        !paidKeys.some((k) => getKeyBalanceCents(k) > 0) && (
          <StarterExhaustedBanner
            onCreate={openCreate}
            onAddCredits={(kid) => {
              const target = paidKeys.find((k) => k.id === kid);
              if (target) setAddCreditsFor(target);
            }}
            firstPaidKey={paidKeys.find((k) => k.status === 'active')}
          />
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

      {/* ─── Zone 1: Starter key ────────────────────────────────── */}
      {starter && (
        <section>
          <SectionHeader
            icon={Gift}
            title={tx('Starter key')}
            subtitle={tx(
              'Included with your account — no setup required. Rate-limited for learning and sandboxing; top up any time to lift the daily cap. Cannot be deleted.',
            )}
            toneClass="text-emerald-600 dark:text-emerald-400"
          />
          <StarterKeyCard
            apiKey={starter}
            project={projects.find((p) => p.id === starter.projectId)}
            copiedId={copiedId}
            onCopy={copyStarter}
            onAddCredits={() => setAddCreditsFor(starter)}
          />
        </section>
      )}

      {/* ─── Zone 2: Paid keys ──────────────────────────────────── */}
      <section>
        <SectionHeader
          icon={Sparkles}
          title={tx('Paid keys')}
          subtitle={tx(
            'No daily caps. Runs on credits. Set per-key spend caps and low-balance alerts as needed.',
          )}
          toneClass="text-violet-600 dark:text-violet-400"
          action={
            paidKeys.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                <FilterSelect
                  label={tx('Project')}
                  value={projectFilter}
                  onChange={setProjectFilter}
                  options={[
                    { value: 'all', label: tx('All projects') },
                    ...projects.map((p) => ({ value: p.id, label: p.name })),
                  ]}
                />
              </div>
            ) : undefined
          }
        />

        {paidKeys.length === 0 ? (
          <EmptyPaidKeysState onCreate={openCreate} />
        ) : (
          <div className="space-y-5">
            <EnvZone
              icon={Rocket}
              title={tx('Production')}
              subtitle={tx('Live credentials serving real traffic — guard these and keep them topped up.')}
              toneClass="text-foreground"
              accentClass="border-foreground/20 bg-foreground/[0.02]"
              count={prodPaid.length}
            >
              {prodPaid.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                  {tx('No production keys yet. Create one when you are ready to ship.')}
                </div>
              ) : (
                <>
                  <PaidTableHeader />
                  <ul className="divide-y divide-border">
                    {prodPaid.map((k) => (
                      <PaidKeyRow
                        key={k.id}
                        apiKey={k}
                        project={projects.find((p) => p.id === k.projectId)}
                        copy={copy}
                        copiedId={copiedId}
                        onAddCredits={() => setAddCreditsFor(k)}
                        onSettings={() => setSettingsFor(k)}
                        onRotate={() => setConfirmRotate(k)}
                        onRevoke={() => setConfirmRevoke(k)}
                        onDelete={() => setConfirmDelete(k)}
                        onRename={() => setRename({ key: k, value: k.name })}
                        menuOpen={menuFor === k.id}
                        setMenu={(open) => setMenuFor(open ? k.id : null)}
                      />
                    ))}
                  </ul>
                </>
              )}
            </EnvZone>

            <EnvZone
              icon={FlaskConical}
              title={tx('Development')}
              subtitle={tx('Use for testing, staging, and local work. Separate balance keeps experiments from draining prod.')}
              toneClass="text-sky-600 dark:text-sky-400"
              accentClass="border-sky-500/20 bg-sky-500/[0.03]"
              count={devPaid.length}
            >
              {devPaid.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                  {tx('No development keys yet.')}
                </div>
              ) : (
                <>
                  <PaidTableHeader />
                  <ul className="divide-y divide-border">
                    {devPaid.map((k) => (
                      <PaidKeyRow
                        key={k.id}
                        apiKey={k}
                        project={projects.find((p) => p.id === k.projectId)}
                        copy={copy}
                        copiedId={copiedId}
                        onAddCredits={() => setAddCreditsFor(k)}
                        onSettings={() => setSettingsFor(k)}
                        onRotate={() => setConfirmRotate(k)}
                        onRevoke={() => setConfirmRevoke(k)}
                        onDelete={() => setConfirmDelete(k)}
                        onRename={() => setRename({ key: k, value: k.name })}
                        menuOpen={menuFor === k.id}
                        setMenu={(open) => setMenuFor(open ? k.id : null)}
                      />
                    ))}
                  </ul>
                </>
              )}
            </EnvZone>

            {filteredPaid.length === 0 && (
              <div className="rounded-xl border border-dashed border-border px-5 py-8 text-center text-sm text-muted-foreground">
                {tx('No paid keys match that project filter.')}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ─── Modals ─────────────────────────────────────────────── */}
      {createOpen && (
        <Modal onClose={() => setCreateOpen(false)} title={tx('Create paid key')}>
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

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                {tx('Environment')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['development', 'production'] as const).map((env) => (
                  <button
                    key={env}
                    type="button"
                    onClick={() => setNewEnv(env)}
                    className={cn(
                      'h-10 rounded-lg border text-sm font-medium capitalize transition-colors',
                      newEnv === env
                        ? 'border-foreground bg-foreground/5 text-foreground'
                        : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted/50',
                    )}
                  >
                    {env === 'development' ? tx('Development') : tx('Production')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                {tx('Project')}
              </label>
              {inlineNewProject ? (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    value={inlineProjectName}
                    onChange={(e) => setInlineProjectName(e.target.value)}
                    placeholder={tx('New project name')}
                    className="flex-1 h-10 px-3 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-foreground/30"
                  />
                  <button
                    type="button"
                    onClick={() => setInlineNewProject(false)}
                    className="h-10 px-3 rounded-lg border border-border bg-background hover:bg-muted/50 text-xs font-medium"
                  >
                    {tx('Cancel')}
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <select
                    value={newProjectId}
                    onChange={(e) => setNewProjectId(e.target.value)}
                    className="flex-1 h-10 px-3 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-foreground/30"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setInlineNewProject(true)}
                    className="h-10 px-3 rounded-lg border border-border bg-background hover:bg-muted/50 text-xs font-medium inline-flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> {tx('New project')}
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2.5 text-[11px] text-muted-foreground leading-relaxed">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>
                {t('Paid keys start with ', '付费 Key 创建时余额为 ')}
                <span className="font-semibold text-foreground">{t('$0 balance', '$0')}</span>
                {t(
                  " and cannot serve traffic until you add credits. You'll be offered a top-up right after creation.",
                  '，充值前无法处理请求。创建完成后会立即引导你充值。',
                )}
              </span>
            </div>

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
                className="h-9 px-4 rounded-lg bg-foreground text-background text-sm font-medium hover:brightness-110"
              >
                {tx('Create key')}
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

      {confirmRotate && (
        <Modal onClose={() => setConfirmRotate(null)} title={tx('Rotate secret')}>
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
              <RotateCcw className="h-4 w-4 text-amber-600 dark:text-amber-500" />
            </div>
            <p className="text-sm text-muted-foreground">
              {t('A fresh secret will be issued for ', '即将为 ')}
              <strong className="text-foreground">{confirmRotate.name}</strong>
              {t(
                '. The current secret stops working the moment you rotate — update all deployments first.',
                ' 签发新的密钥。旋转后当前密钥立即失效 — 请先更新所有部署。',
              )}
            </p>
          </div>
          <div className="flex items-center justify-end gap-2 mt-5">
            <button
              onClick={() => setConfirmRotate(null)}
              className="h-9 px-4 rounded-lg border border-border bg-background hover:bg-muted/50 text-sm font-medium"
            >
              {tx('Cancel')}
            </button>
            <button
              onClick={() => {
                const rotated = rotateKeySecret(confirmRotate.id);
                setConfirmRotate(null);
                if (rotated) setJustCreated(rotated);
              }}
              className="h-9 px-4 rounded-lg bg-foreground text-background text-sm font-medium hover:brightness-110"
            >
              {tx('Rotate secret')}
            </button>
          </div>
        </Modal>
      )}

      {confirmRevoke && (
        <Modal onClose={() => setConfirmRevoke(null)} title={tx('Revoke key')}>
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-md bg-destructive/10 border border-destructive/30 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
            <p className="text-sm text-muted-foreground">
              {t('Revoking ', '吊销 ')}
              <strong className="text-foreground">{confirmRevoke.name}</strong>
              {t(
                ' immediately invalidates it. Requests with this key start failing with 401.',
                ' 将立即使其失效。使用此 Key 的请求将开始返回 401 错误。',
              )}
            </p>
          </div>
          <div className="flex items-center justify-end gap-2 mt-5">
            <button
              onClick={() => setConfirmRevoke(null)}
              className="h-9 px-4 rounded-lg border border-border bg-background hover:bg-muted/50 text-sm font-medium"
            >
              {tx('Cancel')}
            </button>
            <button
              onClick={() => {
                revokeKey(confirmRevoke.id);
                setConfirmRevoke(null);
              }}
              className="h-9 px-4 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:brightness-110"
            >
              {tx('Revoke')}
            </button>
          </div>
        </Modal>
      )}

      {confirmDelete && (
        <Modal onClose={() => setConfirmDelete(null)} title={tx('Delete key')}>
          <p className="text-sm text-muted-foreground">
            {t('This permanently removes ', '这将永久删除 ')}
            <strong className="text-foreground">{confirmDelete.name}</strong>
            {t('. This cannot be undone.', '。此操作无法撤销。')}
          </p>
          <div className="flex items-center justify-end gap-2 mt-5">
            <button
              onClick={() => setConfirmDelete(null)}
              className="h-9 px-4 rounded-lg border border-border bg-background hover:bg-muted/50 text-sm font-medium"
            >
              {tx('Cancel')}
            </button>
            <button
              onClick={() => {
                deleteKey(confirmDelete.id);
                setConfirmDelete(null);
              }}
              className="h-9 px-4 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:brightness-110"
            >
              {tx('Delete permanently')}
            </button>
          </div>
        </Modal>
      )}

      {starterCopyGuide && starter && (
        <StarterCopyGuideModal
          apiKey={starter}
          onCancel={() => setStarterCopyGuide(false)}
          onTopUp={() => {
            setStarterCopyGuide(false);
            setAddCreditsFor(starter);
          }}
          onCreatePaid={() => {
            setStarterCopyGuide(false);
            openCreate();
          }}
          onContinue={confirmStarterCopy}
        />
      )}

      <StripeCheckoutModal
        open={!!addCreditsFor}
        onClose={() => setAddCreditsFor(null)}
        mode="add-credits"
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
      <div className="min-w-0">
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

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <div className="flex items-center h-9 pl-3 pr-8 rounded-lg border border-border bg-background text-xs font-medium focus-within:border-foreground/30 focus-within:ring-2 focus-within:ring-ring/20 transition-colors">
        <span className="text-muted-foreground mr-1.5">{label}:</span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none bg-transparent pr-1 outline-none"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
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
                {tx('This key needs credits before it can serve traffic.')}
              </div>
              <button
                onClick={onAddCredits}
                className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md bg-foreground text-background text-[11px] font-medium hover:brightness-110"
              >
                <DollarSign className="h-3 w-3" /> {tx('Add credits')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StarterKeyCard({
  apiKey: k,
  project,
  copiedId,
  onCopy,
  onAddCredits,
}: {
  apiKey: ApiKey;
  project: Project | undefined;
  copiedId: string | null;
  onCopy: (text: string, id: string) => Promise<void>;
  onAddCredits: () => void;
}) {
  const { tx, t } = useLang();
  const dailyLimit = k.freeDailyLimit || 1;
  const totalLimit = k.freeTotalLimit || 1;
  const dailyPct = Math.min(100, (k.freeDailyUsed / dailyLimit) * 100);
  const totalPct = Math.min(100, (k.freeTotalUsed / totalLimit) * 100);
  const exhausted = k.freeTotalUsed >= k.freeTotalLimit;
  const upgraded = isStarterUpgraded(k);
  const balanceCents = getKeyBalanceCents(k);
  const loadedCents = k.paidCreditsCents;
  const usedCents = k.paidCreditsUsedCents;
  const usedPct = loadedCents > 0 ? Math.min(100, (usedCents / loadedCents) * 100) : 0;

  return (
    <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.03] to-background">
      <div className="p-5">
        {/* Header row: identity + badges on the left, "View usage" shortcut
            on the right. Keeping only the header in this flex row so the
            credential block below can take the full card width. */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span className="text-sm font-semibold">{k.name}</span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              {t('Free · complimentary', '免费 · 赠送')}
            </span>
            {upgraded && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/20">
                <Sparkles className="h-3 w-3" />
                {t('Upgraded · daily cap lifted', '已升级 · 解除日限')}
              </span>
            )}
            {exhausted && !upgraded && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {tx('Exhausted')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Link
              href={`/dashboard/usage?key=${k.id}`}
              className="inline-flex items-center gap-1 h-8 px-2.5 rounded-md border border-border bg-background hover:bg-muted/50 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              {tx('Usage')}
            </Link>
            <button
              type="button"
              onClick={onAddCredits}
              className={cn(
                'inline-flex items-center gap-1 h-8 px-2.5 rounded-md text-xs font-semibold transition-colors',
                upgraded
                  ? 'border border-border bg-background hover:bg-muted/50 text-foreground'
                  : 'bg-foreground text-background hover:brightness-110',
              )}
              title={tx('Top up to lift the daily cap and keep using this key in production')}
            >
              <DollarSign className="h-3.5 w-3.5" />
              {upgraded ? tx('Add credits') : tx('Top up')}
            </button>
          </div>
        </div>

        {/* Credential block — full width of the card so the secret has room
            to breathe instead of leaving dead space on the right. */}
        <div className="mt-3 rounded-lg border border-emerald-500/25 bg-emerald-500/[0.04] dark:bg-emerald-950/20 px-3 py-2.5">
          <div className="flex items-baseline justify-between gap-2 mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-800 dark:text-emerald-300">
              {tx('API key')}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {project?.name ?? '—'} {t('· provisioned with your account', '· 随账号自动开通')}
            </span>
          </div>
          <div className="flex items-stretch gap-2 min-w-0">
            <code
              className="flex-1 min-w-0 font-mono text-[13px] sm:text-sm font-medium leading-relaxed text-foreground break-all select-all bg-background/80 dark:bg-background/40 rounded-md border border-border/80 px-2.5 py-2"
              title={tx('Masked preview — copy for the full secret')}
            >
              {k.maskedSecret}
            </code>
            <button
              type="button"
              onClick={() => onCopy(k.secret, k.id)}
              className="shrink-0 inline-flex flex-col items-center justify-center gap-0.5 h-auto min-w-[4.5rem] px-2 rounded-md border border-emerald-500/30 bg-background hover:bg-emerald-500/10 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300"
              title={tx('Copy full API key to clipboard')}
            >
              {copiedId === k.id ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" />
                  {tx('Copied')}
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  {tx('Copy')}
                </>
              )}
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-muted-foreground leading-snug">
            {tx(
              'Use this key in your SDK or HTTP header. Only the last digits are shown here; Copy pastes the complete secret.',
            )}
          </p>
        </div>

        {/* Quota row */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <QuotaBar
            label={tx('Today')}
            used={k.freeDailyUsed}
            limit={k.freeDailyLimit}
            pct={dailyPct}
            suffix={
              upgraded
                ? t('cap lifted — credits apply', '日限已解除 — 使用余额计费')
                : t('calls · resets 00:00 UTC', '次 · 每日 00:00 UTC 重置')
            }
            struck={upgraded}
          />
          <QuotaBar
            label={tx('Lifetime')}
            used={k.freeTotalUsed}
            limit={k.freeTotalLimit}
            pct={totalPct}
            suffix={
              upgraded
                ? t(
                    'free calls remaining — credits pick up after',
                    '剩余免费调用 — 用完后按余额计费',
                  )
                : t(
                    'calls total — once exhausted, top up to keep going',
                    '次总计 — 用完后充值即可继续',
                  )
            }
          />
        </div>

        {/* Balance row — only visible once the Starter has been topped up. */}
        {upgraded && (
          <div className="mt-4 rounded-lg border border-violet-500/25 bg-violet-500/[0.04] dark:bg-violet-950/20 px-3 py-2.5">
            <div className="flex items-baseline justify-between gap-2 mb-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-violet-800 dark:text-violet-300">
                {t('Credit balance', '余额')}
              </span>
              <span className="text-sm tabular-nums">
                <span className="font-semibold">{formatCents(balanceCents)}</span>
                <span className="text-muted-foreground">
                  {' '}
                  · {formatCents(usedCents)}
                  {t(' used of ', ' 已用 / ')}
                  {formatCents(loadedCents)}
                </span>
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all',
                  usedPct >= 90
                    ? 'bg-amber-500'
                    : usedPct >= 70
                      ? 'bg-foreground/60'
                      : 'bg-violet-500/80',
                )}
                style={{ width: `${usedPct}%` }}
              />
            </div>
            <p className="mt-1.5 text-[10px] text-muted-foreground leading-snug">
              {tx(
                'Daily cap is lifted while this key has credits. Usage draws from the free lifetime allowance first, then from your balance.',
              )}
            </p>
          </div>
        )}

        {/* Top-up nudge — only when the Starter has never been topped up. */}
        {!upgraded && (
          <button
            type="button"
            onClick={onAddCredits}
            className="mt-4 w-full group flex items-center justify-between gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/[0.05] hover:bg-emerald-500/[0.09] px-3.5 py-2.5 text-left transition-colors"
          >
            <div className="flex items-start gap-2.5 min-w-0">
              <span className="inline-flex items-center justify-center h-7 w-7 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/25 shrink-0">
                <Zap className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-100">
                  {exhausted
                    ? t('Starter exhausted — top up to resume', 'Starter 已用完 — 充值即可恢复')
                    : t('Top up to lift the daily cap', '充值即可解除每日限制')}
                </p>
                <p className="mt-0.5 text-[11px] text-emerald-900/75 dark:text-emerald-200/80 leading-snug">
                  {tx(
                    'Once topped up, this key runs on credits with no daily limit. Pay only for what you use.',
                  )}
                </p>
              </div>
            </div>
            <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 group-hover:translate-x-0.5 transition-transform">
              {tx('Add credits')} →
            </span>
          </button>
        )}

        {/* Footer explainer */}
        <div className="mt-3 flex items-start gap-2 rounded-md bg-muted/30 border border-border/60 px-3 py-2 text-[11px] text-muted-foreground leading-relaxed">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>
            {upgraded
              ? tx(
                  'This Starter key is production-ready while credits last. Cannot be deleted — your account will always keep one Starter key.',
                )
              : tx(
                  'Rate-limited to protect the shared free pool. Cannot be deleted. Top up this key or create a dedicated paid key below for production traffic.',
                )}
          </span>
        </div>
      </div>
    </div>
  );
}

function QuotaBar({
  label,
  used,
  limit,
  pct,
  suffix,
  struck = false,
}: {
  label: string;
  used: number;
  limit: number;
  pct: number;
  suffix: string;
  /** When true, renders the numbers and bar in a muted, de-emphasised style
   *  to communicate that the cap has been lifted (e.g. Starter upgraded). */
  struck?: boolean;
}) {
  const warn = !struck && pct >= 90;
  return (
    <div className={cn(struck && 'opacity-60')}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </span>
        <span className={cn('text-sm tabular-nums', struck && 'line-through')}>
          <span className={cn('font-semibold', struck && 'font-normal')}>
            {used.toLocaleString()}
          </span>
          <span className="text-muted-foreground"> / {limit.toLocaleString()}</span>
        </span>
      </div>
      <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            'h-full transition-all',
            struck
              ? 'bg-muted-foreground/30'
              : warn
                ? 'bg-amber-500'
                : 'bg-emerald-500/80',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1 text-[11px] text-muted-foreground leading-tight">
        {suffix}
      </div>
    </div>
  );
}

function PaidTableHeader() {
  const { tx } = useLang();
  return (
    <div className="hidden md:grid grid-cols-[1.4fr_1fr_1.1fr_1.1fr_auto] gap-4 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30 border-b border-border">
      <div>{tx('Key')}</div>
      <div>{tx('Project')}</div>
      <div>{tx('Balance')}</div>
      <div>{tx('Limits')}</div>
      <div className="text-right">{tx('Actions')}</div>
    </div>
  );
}

/**
 * Grouping wrapper for the Development / Production zones on the paid-keys
 * list. The inner `<div>` that hosts the header + rows intentionally
 * mirrors the look of the previous single table so per-row layout stays
 * consistent across zones.
 */
function EnvZone({
  icon: Icon,
  title,
  subtitle,
  toneClass,
  accentClass,
  count,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  toneClass: string;
  accentClass: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('rounded-xl border bg-background overflow-hidden', accentClass)}>
      <div className="px-5 py-3 flex items-center gap-2 border-b border-border/60">
        <Icon className={cn('h-4 w-4', toneClass)} />
        <div className="min-w-0 flex-1">
          <div className={cn('text-[12px] font-semibold uppercase tracking-[0.08em]', toneClass)}>
            {title}
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{subtitle}</p>
        </div>
        <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
          {count}
        </span>
      </div>
      {children}
    </div>
  );
}

function EmptyPaidKeysState({ onCreate }: { onCreate: () => void }) {
  const { tx } = useLang();
  return (
    <div className="rounded-xl border border-dashed border-border bg-background px-6 py-12 text-center">
      <div className="mx-auto h-10 w-10 rounded-lg bg-muted flex items-center justify-center mb-3">
        <Key className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">{tx('No paid keys yet')}</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
        {tx(
          "When you're ready for production, create a paid key and top it up with credits. No daily caps.",
        )}
      </p>
      <button
        onClick={onCreate}
        className="mt-4 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-foreground text-background text-sm font-medium hover:brightness-110"
      >
        <Plus className="h-4 w-4" />
        {tx('Create paid key')}
      </button>
    </div>
  );
}

function PaidKeyRow({
  apiKey: k,
  project,
  copy,
  copiedId,
  onAddCredits,
  onSettings,
  onRotate,
  onRevoke,
  onDelete,
  onRename,
  menuOpen,
  setMenu,
}: {
  apiKey: ApiKey;
  project: Project | undefined;
  copy: (text: string, id: string) => Promise<void>;
  copiedId: string | null;
  onAddCredits: () => void;
  onSettings: () => void;
  onRotate: () => void;
  onRevoke: () => void;
  onDelete: () => void;
  onRename: () => void;
  menuOpen: boolean;
  setMenu: (open: boolean) => void;
}) {
  const { tx, t } = useLang();
  const isRevoked = k.status === 'revoked';
  const isPaused = k.status === 'paused';
  const isEnabled = !isRevoked && !isPaused;
  const tier = getBillingTier(k);
  const balanceCents = getKeyBalanceCents(k);
  const totalLoaded = k.paidCreditsCents;
  const usedPct =
    totalLoaded > 0 ? Math.min(100, (k.paidCreditsUsedCents / totalLoaded) * 100) : 0;

  const hasCap = k.spendCapCents !== null && k.spendCapCents > 0;
  const hasAlert = !!k.lowBalanceAlert?.enabled;
  const capSummary = hasCap
    ? `${t('Cap', '上限')} ${formatCents(k.spendCapCents ?? 0)}${t('/mo', '/月')}`
    : tx('No cap');
  const alertSummary = hasAlert
    ? `${t('Alert ≤', '提醒阈值 ≤')} ${formatCents(k.lowBalanceAlert?.thresholdCents ?? 0)}`
    : tx('No alert');

  return (
    <li
      className={cn(
        'px-5 py-3.5 md:grid md:grid-cols-[1.4fr_1fr_1.1fr_1.1fr_auto] md:gap-4 md:items-center flex flex-col gap-3',
        isRevoked && 'opacity-60',
        isPaused && 'bg-muted/30',
      )}
    >
      {/* Name / secret + enable toggle */}
      <div className="min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <EnableToggle
            enabled={isEnabled}
            disabled={isRevoked}
            onChange={(next) => setKeyPaused(k.id, !next)}
            labelOn={tx('Enabled')}
            labelOff={isRevoked ? tx('Revoked') : tx('Disabled')}
          />
          <span
            className={cn(
              'text-sm font-medium truncate',
              isPaused && 'text-muted-foreground',
            )}
          >
            {k.name}
          </span>
          {tier === 'needs-credits' && isEnabled && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400">
              {tx('Needs credits')}
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
        <div className="flex items-center gap-1.5 mt-0.5 pl-[36px]">
          <code className="font-mono text-[11px] text-muted-foreground">
            {keyLast4(k.secret)}
          </code>
          <button
            onClick={() => copy(k.secret, k.id)}
            disabled={isRevoked}
            className="h-6 w-6 rounded-md hover:bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40"
            title={tx('Copy')}
          >
            {copiedId === k.id ? (
              <Check className="h-3 w-3 text-emerald-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        </div>
      </div>

      {/* Project */}
      <div className="min-w-0">
        <div className="text-xs font-medium truncate">{project?.name ?? '—'}</div>
        <div className="text-[11px] text-muted-foreground font-mono truncate">
          {project?.slug}
        </div>
        <div className="text-[11px] text-muted-foreground mt-1">
          {formatDateShort(k.createdAt)}
        </div>
      </div>

      {/* Balance */}
      <div className="min-w-0">
        {totalLoaded === 0 ? (
          <div className="text-xs">
            <div className="font-semibold tabular-nums">$0.00</div>
            <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
              {tx('Top up to activate')}
            </div>
          </div>
        ) : (
          <>
            <div className="text-sm font-semibold tabular-nums">
              {formatCents(balanceCents)}
            </div>
            <div className="mt-1 h-1 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all',
                  usedPct >= 90
                    ? 'bg-amber-500'
                    : usedPct >= 70
                      ? 'bg-foreground/60'
                      : 'bg-emerald-500/70',
                )}
                style={{ width: `${usedPct}%` }}
              />
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
              {formatCents(k.paidCreditsUsedCents)} {t('used of', '已用 /')}{' '}
              {formatCents(totalLoaded)}
            </div>
          </>
        )}
      </div>

      {/* Limits — one-line summary. Gear moved into the overflow menu so the
          row doesn't duplicate a primary action. Click the summary itself to
          open the settings modal (also keyboard-accessible). */}
      <div className="min-w-0">
        <button
          type="button"
          onClick={onSettings}
          disabled={isRevoked}
          className={cn(
            'w-full text-left text-[11px] leading-snug rounded-md px-1.5 py-1 -mx-1.5 transition-colors hover:bg-muted/50 disabled:opacity-40 disabled:pointer-events-none',
            hasCap || hasAlert ? 'text-foreground' : 'text-muted-foreground',
          )}
          title={tx('Configure spend cap & low-balance alert')}
        >
          <span className="tabular-nums">{capSummary}</span>
          <span className="text-muted-foreground/70"> · </span>
          <span className="tabular-nums">{alertSummary}</span>
        </button>
      </div>

      {/* Actions */}
      <div className="flex md:justify-end gap-1 relative">
        <Link
          href={`/dashboard/usage?key=${k.id}`}
          title={tx('View usage for this key')}
          aria-label={tx('View usage for this key')}
          className="h-8 px-2.5 rounded-md border border-border hover:bg-muted/50 inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
        >
          <BarChart3 className="h-3.5 w-3.5" />
          {tx('Usage')}
        </Link>
        <button
          onClick={onAddCredits}
          disabled={isRevoked}
          title={tx('Add credits')}
          className="h-8 px-2.5 rounded-md border border-border hover:bg-muted/50 inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground disabled:opacity-40"
        >
          <DollarSign className="h-3.5 w-3.5" />
          {tx('Add credits')}
        </button>
        <button
          onClick={() => setMenu(!menuOpen)}
          title={tx('More')}
          className="h-8 w-8 rounded-md border border-border hover:bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground"
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
            <div className="absolute right-0 top-9 z-20 w-44 rounded-lg border border-border bg-popover shadow-xl py-1 text-sm">
              <button
                onClick={() => {
                  setMenu(false);
                  onRename();
                }}
                disabled={isRevoked}
                className="w-full px-3 py-1.5 text-left hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              >
                {tx('Rename')}
              </button>
              <button
                onClick={() => {
                  setMenu(false);
                  onSettings();
                }}
                disabled={isRevoked}
                className="w-full px-3 py-1.5 text-left hover:bg-muted/50 inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              >
                <Settings className="h-3 w-3" /> {tx('Limits & alerts')}
              </button>
              {!isRevoked && (
                <button
                  onClick={() => {
                    setMenu(false);
                    setKeyPaused(k.id, !isPaused);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-muted/50 inline-flex items-center gap-2"
                >
                  {isPaused ? tx('Enable key') : tx('Disable key')}
                </button>
              )}
              {!isRevoked && (
                <button
                  onClick={() => {
                    setMenu(false);
                    onRotate();
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-muted/50 inline-flex items-center gap-2"
                >
                  <RotateCcw className="h-3 w-3" /> {tx('Rotate secret')}
                </button>
              )}
              <div className="my-1 h-px bg-border" />
              {!isRevoked && (
                <button
                  onClick={() => {
                    setMenu(false);
                    onRevoke();
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-muted/50 text-muted-foreground"
                >
                  {tx('Revoke')}
                </button>
              )}
              <button
                onClick={() => {
                  setMenu(false);
                  onDelete();
                }}
                className="w-full px-3 py-1.5 text-left text-destructive hover:bg-destructive/10 inline-flex items-center gap-2"
              >
                <Trash2 className="h-3 w-3" /> {tx('Delete')}
              </button>
            </div>
          </>
        )}
      </div>
    </li>
  );
}

/**
 * Compact on/off switch used on each paid key row. Larger-than-usual hit
 * area (28x16) with an inline label on hover via `title` — keeps the row
 * dense but discoverable.
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
        'relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40',
        enabled ? 'bg-emerald-500' : 'bg-muted-foreground/30',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-4 w-4 rounded-full bg-background shadow-sm transition-all',
          enabled ? 'left-[18px]' : 'left-0.5',
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      translate="no"
      lang="en"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
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
  );
}

/**
 * Guide modal shown when user tries to copy the Starter key. Nudges them
 * toward creating a paid key for production use while still allowing the
 * copy to proceed for development purposes.
 */
function StarterCopyGuideModal({
  apiKey,
  onCancel,
  onTopUp,
  onCreatePaid,
  onContinue,
}: {
  apiKey: ApiKey;
  onCancel: () => void;
  onTopUp: () => void;
  onCreatePaid: () => void;
  onContinue: (dontAskAgain: boolean) => void;
}) {
  const { tx, t } = useLang();
  const [dontAsk, setDontAsk] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      translate="no"
      lang="en"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-lg rounded-xl bg-background border border-border shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-border/60">
          <div className="flex items-start gap-3">
            <span className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20 shrink-0">
              <FlaskConical className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold tracking-tight">
                {t('You are copying a Starter key', '你正在复制 Starter Key')}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                <code className="font-mono text-foreground/80">{apiKey.name}</code>
                <span className="mx-1.5 text-muted-foreground/40">·</span>
                <span>{apiKey.freeDailyLimit}/{t('day', '日')} · {apiKey.freeTotalLimit} {t('total', '总量')}</span>
              </p>
            </div>
            <button
              onClick={onCancel}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
            {t(
              'Starter keys have a daily call limit (30/day) and lifetime cap (900 total). They are intended for development and sandboxing only.',
              'Starter Key 有每日调用限制（30 次/天）和总量上限（900 次）。仅建议用于开发和沙箱测试。',
            )}
          </p>
        </div>

        {/* Options */}
        <div className="px-6 py-5 space-y-3">
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.04] p-4">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                  {t('Not recommended for production', '不建议用于生产环境')}
                </p>
                <p className="mt-1 text-xs text-amber-900/80 dark:text-amber-200/80 leading-relaxed">
                  {t(
                    'Starter keys may hit rate limits under real traffic. For production workloads, create a paid key with no daily caps.',
                    'Starter Key 在实际流量下可能触达限额。生产环境请创建付费 Key，无每日上限。',
                  )}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onTopUp}
            className="group flex w-full items-start gap-3 text-left rounded-xl border border-border hover:border-violet-500/50 hover:bg-violet-500/5 transition-colors p-4"
          >
            <span className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 ring-1 ring-violet-500/20 shrink-0">
              <DollarSign className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">
                  {t('Top up this Starter key', '为当前 Starter 充值')}
                </p>
                <span className="text-muted-foreground group-hover:text-violet-600 group-hover:translate-x-0.5 transition-all">
                  →
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                {t(
                  'Lift the daily cap while keeping the same key — no code changes, just add credits.',
                  '保留当前 Key 不变，充值即可解除每日限制 — 无需改动代码。',
                )}
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={onCreatePaid}
            className="group flex w-full items-start gap-3 text-left rounded-xl border border-border hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-colors p-4"
          >
            <span className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20 shrink-0">
              <Plus className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">
                  {t('Create a dedicated paid key', '新建一个独立付费 Key')}
                </p>
                <span className="text-muted-foreground group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all">
                  →
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                {t(
                  'Keep the Starter for sandboxing and route production traffic through a separate key — with its own balance, caps, and alerts.',
                  '保留 Starter 用于沙箱，把生产流量打到独立的 Key 上 — 独立余额 / 上限 / 告警。',
                )}
              </p>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 pt-2 pb-5 border-t border-border/60 bg-muted/20">
          <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
            {t(
              'If you only need this key for development or testing, you can continue copying it below.',
              '如果你仅需用于开发或测试，可继续复制。',
            )}
          </p>
          <label className="mt-3 flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontAsk}
              onChange={(e) => setDontAsk(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-border text-foreground focus:ring-0 focus:ring-offset-0"
            />
            {t("Don't show this again (this session)", '本次会话不再提示')}
          </label>
          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              onClick={onCancel}
              className="h-9 px-4 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors"
            >
              {tx('Cancel')}
            </button>
            <button
              onClick={() => onContinue(dontAsk)}
              className="h-9 px-4 text-sm font-medium rounded-lg bg-foreground text-background hover:brightness-110 transition-colors inline-flex items-center gap-1.5"
            >
              <Copy className="h-3.5 w-3.5" />
              {t('Copy for development use', '仅用于开发 · 继续复制')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Upgrade nudge shown above the Starter key section once 900 lifetime calls
 * are spent and no paid key is funded. The CTA branches: Add credits to an
 * existing paid key (if one exists) or Create a paid key outright.
 */
function StarterExhaustedBanner({
  onCreate,
  onAddCredits,
  firstPaidKey,
}: {
  onCreate: () => void;
  onAddCredits: (keyId: string) => void;
  firstPaidKey?: ApiKey;
}) {
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
              <h3 className="text-sm font-semibold">{tx('Starter key exhausted')}</h3>
              <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400">
                {t('0 / 900 left', '剩余 0 / 900')}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {tx(
                'The 900 free lifetime calls are spent. Fund a paid key to keep your production workloads running — no subscription, pay-as-you-go with volume discounts that kick in automatically.',
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {firstPaidKey ? (
            <button
              type="button"
              onClick={() => onAddCredits(firstPaidKey.id)}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-foreground text-background text-sm font-semibold hover:brightness-110"
            >
              <CreditCard className="h-4 w-4" />
              {tx('Add credits')}
            </button>
          ) : (
            <button
              type="button"
              onClick={onCreate}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-foreground text-background text-sm font-semibold hover:brightness-110"
            >
              <Plus className="h-4 w-4" />
              {tx('Create paid key')}
            </button>
          )}
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
