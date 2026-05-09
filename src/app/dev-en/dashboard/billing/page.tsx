'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  HelpCircle,
  Plus,
  ReceiptText,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  formatCalls,
  formatCents,
  getAccountBalanceCents,
  getAccountCallsThisMonth,
  getAccountSpendThisMonthCents,
  getKeyMonthlyCalls,
  getTransactions,
  getUsage,
  getWallet,
  listPaidKeys,
  listProjects,
  type AccountWallet,
  type ApiKey,
  type Project,
  type Transaction,
  type UsagePoint,
} from '../../_lib/mock-store';
import { useMockStore } from '../../_lib/use-mock-store';
import { AccountWalletStrip } from '../../_components/account-wallet-strip';
import { ManageSavedCardsModal } from '../../_components/manage-saved-cards-modal';
import { StatCard } from '../../_components/stat-card';
import { StripeCheckoutModal } from '../../_components/stripe-checkout-modal';
import { useLang } from '../../_lib/use-lang';

const DEFAULT_WALLET: AccountWallet = {
  paidCreditsCents: 0,
  paidCreditsUsedCents: 0,
  bonusReceivedCents: 0,
};
type Period = 7 | 14 | 28 | 90;
const PERIODS: Period[] = [7, 14, 28, 90];

// Distinct palette for project series. Intentionally different enough from the
// Usage page's model palette so the two pages don't feel like the same chart
// with a different label.
const PROJECT_PALETTE = [
  '#2563eb', // blue-600
  '#db2777', // pink-600
  '#16a34a', // green-600
  '#ea580c', // orange-600
  '#7c3aed', // violet-600
  '#0891b2', // cyan-600
];

export default function BillingPage() {
  const { t, tx } = useLang();
  const usage = useMockStore(getUsage, [] as UsagePoint[]);
  const projects = useMockStore(listProjects, [] as Project[]);
  // Starter keys are excluded from every view on this page — the freebie
  // has no balance and no billable spend, so mixing it in with paid keys
  // only confuses totals and charts. The starter gets its own dedicated
  // card on the API Keys page.
  const keys = useMockStore(listPaidKeys, [] as ApiKey[]);
  const transactions = useMockStore(getTransactions, [] as Transaction[]);
  const spendThisMonth = useMockStore(getAccountSpendThisMonthCents, 0);
  const callsThisMonth = useMockStore(getAccountCallsThisMonth, 0);
  const wallet = useMockStore(getWallet, DEFAULT_WALLET);
  const balanceCents = useMockStore(getAccountBalanceCents, 0);

  const [period, setPeriod] = useState<Period>(28);
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [keyFilter, setKeyFilter] = useState<string>('all');
  const [addCreditsOpen, setAddCreditsOpen] = useState(false);
  const [manageCardsOpen, setManageCardsOpen] = useState(false);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const scopedKeys = useMemo(
    () => (projectFilter === 'all' ? keys : keys.filter((k) => k.projectId === projectFilter)),
    [keys, projectFilter],
  );

  const handleProjectChange = (next: string) => {
    setProjectFilter(next);
    if (next === 'all') return;
    const stillValid = keys.some((k) => k.id === keyFilter && k.projectId === next);
    if (!stillValid) setKeyFilter('all');
  };

  // Legacy deep-link: `/dashboard/billing?edit=spend-limit` used to
  // open the inline cap modal. The cap UI now lives at /dashboard/limits,
  // so we redirect there transparently if the param is present.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('edit') !== 'spend-limit') return;
    window.location.replace('/dashboard/limits');
  }, []);


  // Colour by project (by order in the projects list, stable across renders).
  const projectColorMap = useMemo(() => {
    const m = new Map<string, string>();
    projects.forEach((p, i) => m.set(p.id, PROJECT_PALETTE[i % PROJECT_PALETTE.length]));
    return m;
  }, [projects]);

  // Pre-index: keyId → projectId (used to attribute usage rows to projects).
  const keyProjectIndex = useMemo(() => {
    const m = new Map<string, string>();
    keys.forEach((k) => m.set(k.id, k.projectId));
    return m;
  }, [keys]);

  // Stacked "Spend by project" dataset. Deliberately stacked by project (not
  // model) to visually differentiate this chart from the Usage page's
  // "Calls by model" stack — same shape, completely different slice.
  const stackedData = useMemo(() => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const days: {
      date: string;
      perProject: Record<string, number>;
      total: number;
    }[] = [];
    for (let i = period - 1; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86400000);
      const date = d.toISOString().slice(0, 10);
      const perProject: Record<string, number> = {};
      for (const p of projects) perProject[p.id] = 0;
      const pts = usage.filter((p) => {
        if (p.date !== date) return false;
        if (keyFilter !== 'all' && p.keyId !== keyFilter) return false;
        const pid = keyProjectIndex.get(p.keyId);
        if (!pid) return false;
        if (projectFilter !== 'all' && pid !== projectFilter) return false;
        return true;
      });
      let total = 0;
      for (const p of pts) {
        const pid = keyProjectIndex.get(p.keyId);
        if (!pid) continue;
        perProject[pid] = (perProject[pid] ?? 0) + p.costCents;
        total += p.costCents;
      }
      days.push({ date, perProject, total });
    }
    return days;
  }, [usage, projects, period, keyFilter, projectFilter, keyProjectIndex]);

  const periodTotalCost = stackedData.reduce((acc, d) => acc + d.total, 0);
  const maxDay = Math.max(1, ...stackedData.map((d) => d.total));

  const chartWidth = 720;
  const chartHeight = 220;
  const pad = { top: 10, right: 20, bottom: 24, left: 44 };
  const innerW = chartWidth - pad.left - pad.right;
  const innerH = chartHeight - pad.top - pad.bottom;
  const barW = Math.max(3, (innerW / stackedData.length) * 0.72);
  const slot = innerW / stackedData.length;

  // Per-key spend this month (month-to-date), for the Credit balances table.
  // We slice the usage array down to current-month rows once and tally.
  const spendByKeyThisMonth = useMemo(() => {
    const now = new Date();
    const ym = now.toISOString().slice(0, 7); // "YYYY-MM"
    const m = new Map<string, number>();
    for (const p of usage) {
      if (!p.date.startsWith(ym)) continue;
      m.set(p.keyId, (m.get(p.keyId) ?? 0) + p.costCents);
    }
    return m;
  }, [usage]);

  // Per-key MTD calls — the wallet model removes per-key balances, but
  // "how much is each key consuming?" remains a critical question.
  const callsByKeyThisMonth = useMemo(() => {
    const m = new Map<string, number>();
    for (const k of keys) m.set(k.id, getKeyMonthlyCalls(k.id));
    return m;
  }, [keys]);

  const activeKeyCount = useMemo(
    () => keys.filter((k) => k.status === 'active').length,
    [keys],
  );

  const recentTopUps = useMemo(
    () =>
      transactions
        .filter((t) => t.kind === 'credit-topup' && t.status === 'succeeded')
        .slice(0, 3),
    [transactions],
  );

  // Rank: active keys first, ordered by this month's call volume so the
  // hottest workloads sit on top. Revoked sinks to the bottom.
  const sortedKeys = useMemo(() => {
    return [...keys].sort((a, b) => {
      const aRevoked = a.status === 'revoked' ? 1 : 0;
      const bRevoked = b.status === 'revoked' ? 1 : 0;
      if (aRevoked !== bRevoked) return aRevoked - bRevoked;
      const ac = callsByKeyThisMonth.get(a.id) ?? 0;
      const bc = callsByKeyThisMonth.get(b.id) ?? 0;
      return bc - ac;
    });
  }, [keys, callsByKeyThisMonth]);

  const openAddCredits = () => setAddCreditsOpen(true);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-[-0.01em]">
            {t('Billing', '账单')}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t(
              'One wallet shared across every key. Top-ups unlock every key on the account at once.',
              '所有 Key 共享一个钱包。一次充值即可解锁全部 Key。',
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={openAddCredits}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-foreground text-background text-sm font-semibold hover:brightness-110 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          {t('Add credits', '充值')}
        </button>
      </div>

      {/* Account wallet hero — same component used on Overview/Keys, the
           single canonical "where am I in money + trial?" surface. */}
      <AccountWalletStrip onAddCredits={openAddCredits} />

      {/* KPI strip — money-only. Calls / trial-allowance metrics live on
           Overview & Usage pages; this page is about $$ in / $$ out, so we
           keep the trio focused on spend dynamics and runway. */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard
          icon={Wallet}
          label={t('Account balance', '账户余额')}
          value={formatCents(balanceCents)}
          sub={
            wallet.bonusReceivedCents > 0
              ? t(
                  `Includes +${formatCents(wallet.bonusReceivedCents)} bonus to date`,
                  `含累计赠送 +${formatCents(wallet.bonusReceivedCents)}`,
                )
              : t(
                  'Shared by every key on this account',
                  '所有 Key 共享同一余额',
                )
          }
        />
        <StatCard
          icon={ReceiptText}
          label={t('Spent this month', '本月消费')}
          value={formatCents(spendThisMonth)}
          sub={t(
            `${formatCalls(callsThisMonth)} calls billed`,
            `产生 ${formatCalls(callsThisMonth)} 次调用`,
          )}
        />
        <StatCard
          icon={CreditCard}
          label={t('Lifetime topped up', '累计充值')}
          value={formatCents(wallet.paidCreditsCents)}
          sub={
            wallet.bonusReceivedCents > 0
              ? t(
                  `+${formatCents(wallet.bonusReceivedCents)} bonus credits earned`,
                  `获赠 +${formatCents(wallet.bonusReceivedCents)} 额度`,
                )
              : t('No bonus credits yet', '暂无赠送额度')
          }
        />
      </div>


      {/* Spend-by-project chart */}
      <div className="rounded-2xl border border-border bg-background p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t(
                `Daily spend by project (${period} days)`,
                `按项目的每日消费(${period} 天)`,
              )}
            </div>
            <div className="mt-2 flex items-baseline gap-4 flex-wrap">
              <div className="text-2xl font-semibold tabular-nums">
                {formatCents(periodTotalCost)}
              </div>
              <div className="text-xs text-muted-foreground">
                {t('Net spend in selected period.', '选定时段的实际支出。')}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center rounded-lg border border-border bg-background overflow-hidden">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={cn(
                    'h-8 px-2.5 text-xs font-medium transition-colors',
                    period === p
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {p}{t('d', '天')}
                </button>
              ))}
            </div>

            <FilterSelect
              value={projectFilter}
              onChange={handleProjectChange}
              options={[
                { value: 'all', label: tx('All projects') },
                ...projects.map((p) => ({ value: p.id, label: p.name })),
              ]}
            />

            <FilterSelect
              value={keyFilter}
              onChange={setKeyFilter}
              options={[
                {
                  value: 'all',
                  label:
                    projectFilter === 'all'
                      ? tx('All keys')
                      : t(
                          `All keys in ${projects.find((p) => p.id === projectFilter)?.name ?? 'project'}`,
                          `${projects.find((p) => p.id === projectFilter)?.name ?? '项目'} 的全部 key`,
                        ),
                },
                ...scopedKeys.map((k) => ({
                  value: k.id,
                  label: `${k.name} · ${k.maskedSecret.slice(-8)}`,
                })),
              ]}
            />

          </div>
        </div>

        {/* Chart. Outer wrapper owns the tooltip so it can paint above the
            SVG without being clipped — the inner wrapper's `overflow-x: auto`
            (for horizontal scroll on narrow screens) implicitly clips the
            y-axis too. */}
        <div className="mt-4 relative">
          <div className="overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full min-w-[600px]"
              onMouseLeave={() => setHoverIdx(null)}
            >
              {[0, 0.25, 0.5, 0.75, 1].map((t) => (
                <g key={t}>
                  <line
                    x1={pad.left}
                    x2={chartWidth - pad.right}
                    y1={pad.top + innerH - innerH * t}
                    y2={pad.top + innerH - innerH * t}
                    stroke="currentColor"
                    strokeOpacity={0.08}
                  />
                  <text
                    x={pad.left - 6}
                    y={pad.top + innerH - innerH * t}
                    fontSize={9}
                    textAnchor="end"
                    dominantBaseline="middle"
                    fill="currentColor"
                    fillOpacity={0.5}
                  >
                    {formatCents(maxDay * t)}
                  </text>
                </g>
              ))}

              {stackedData.map((d, i) => {
                const x = pad.left + i * slot + (slot - barW) / 2;
                let yCursor = pad.top + innerH;
                const segments: { projectId: string; y: number; h: number; color: string }[] = [];
                projects.forEach((p) => {
                  const v = d.perProject[p.id] ?? 0;
                  if (v <= 0) return;
                  const h = (v / maxDay) * innerH;
                  yCursor -= h;
                  segments.push({
                    projectId: p.id,
                    y: yCursor,
                    h,
                    color: projectColorMap.get(p.id) ?? '#6366f1',
                  });
                });
                return (
                  <g key={d.date} onMouseEnter={() => setHoverIdx(i)}>
                    {segments.map((s) => (
                      <rect
                        key={s.projectId}
                        x={x}
                        y={s.y}
                        width={barW}
                        height={Math.max(s.h, 0.5)}
                        fill={s.color}
                        opacity={0.95}
                        rx={1}
                      />
                    ))}
                    <rect
                      x={pad.left + i * slot}
                      y={pad.top}
                      width={slot}
                      height={innerH}
                      fill="transparent"
                    />
                  </g>
                );
              })}

              {stackedData.length > 0 && (
                <>
                  {[0, Math.floor(stackedData.length / 2), stackedData.length - 1].map((idx) => {
                    const d = stackedData[idx];
                    const x = pad.left + idx * slot + slot / 2;
                    return (
                      <text
                        key={idx}
                        x={x}
                        y={chartHeight - 6}
                        fontSize={9}
                        textAnchor="middle"
                        fill="currentColor"
                        fillOpacity={0.5}
                      >
                        {d.date.slice(5)}
                      </text>
                    );
                  })}
                </>
              )}
            </svg>
          </div>
          {hoverIdx !== null &&
            stackedData[hoverIdx] &&
            (() => {
              const d = stackedData[hoverIdx];
              const centerPctX = ((pad.left + hoverIdx * slot + slot / 2) / chartWidth) * 100;
              const barTopPctY =
                ((pad.top + innerH - (d.total / maxDay) * innerH) / chartHeight) * 100;
              const flipBelow = barTopPctY < 35;
              const rows = projects
                .filter((p) => (d.perProject[p.id] ?? 0) > 0)
                .map((p) => ({
                  project: p.name,
                  costCents: d.perProject[p.id],
                  color: projectColorMap.get(p.id) ?? '#6366f1',
                }));
              return (
                <div
                  className="pointer-events-none absolute bg-popover text-popover-foreground border border-border shadow-lg rounded-lg px-3 py-2 text-[11px] min-w-[200px] max-w-[260px] z-10"
                  style={{
                    left: `${centerPctX}%`,
                    top: flipBelow ? `calc(${barTopPctY}% + 12px)` : `${barTopPctY}%`,
                    transform: flipBelow
                      ? 'translate(-50%, 0)'
                      : 'translate(-50%, calc(-100% - 8px))',
                  }}
                >
                  <div className="font-semibold mb-1.5">{d.date}</div>
                  {rows.length === 0 ? (
                    <div className="text-muted-foreground">{tx('No spend')}</div>
                  ) : (
                    <>
                      {rows.map((r) => (
                        <div key={r.project} className="flex items-center gap-2 py-0.5">
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: r.color }}
                          />
                          <span className="flex-1 truncate">{r.project}</span>
                          <span className="tabular-nums">{formatCents(r.costCents)}</span>
                        </div>
                      ))}
                      <div className="h-px bg-border my-1.5" />
                      <div className="flex items-center justify-between py-0.5 font-semibold">
                        <span>{tx('Total')}</span>
                        <span className="tabular-nums">{formatCents(d.total)}</span>
                      </div>
                    </>
                  )}
                </div>
              );
            })()}
        </div>

        {/* Project legend */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {projects.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
            >
              <span
                className="h-2 w-2 rounded-sm"
                style={{ backgroundColor: projectColorMap.get(p.id) }}
              />
              {p.name}
            </div>
          ))}
        </div>
      </div>

      {/* Per-key spend breakdown — pure money view. Cap-related chrome
           (progress bars, /limit suffixes, per-key spend caps subtext)
           lives on the API Keys page; here we show only what each key
           cost this month. */}
      <div className="rounded-2xl border border-border bg-background overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold flex items-center gap-2">
              <Wallet className="h-4 w-4" /> {t('Spend by key (this month)', '本月各 Key 消费明细')}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t(
                'Every key drains the same wallet — this list shows MTD calls and dollar spend per key.',
                '所有 Key 共用同一钱包；下方按 Key 展示本月调用次数与消费金额。',
              )}
            </p>
          </div>
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {t(
              `${activeKeyCount} active key${activeKeyCount === 1 ? '' : 's'}`,
              `${activeKeyCount} 把活跃 Key`,
            )}
          </span>
        </div>
        {sortedKeys.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            {t(
              "No keys yet. Create one on the API Keys page — your free trial unlocks automatically.",
              '尚无 Key。前往 API Keys 页面创建即可，免费试用次数自动解锁。',
            )}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {sortedKeys.map((k) => {
              const project = projects.find((p) => p.id === k.projectId);
              const monthCalls = callsByKeyThisMonth.get(k.id) ?? 0;
              const monthSpend = spendByKeyThisMonth.get(k.id) ?? 0;
              const revoked = k.status === 'revoked';

              return (
                <li
                  key={k.id}
                  className="px-5 py-3 flex flex-wrap items-center gap-3"
                >
                  <div className="flex-1 min-w-[180px]">
                    <div className="text-sm font-medium flex items-center gap-2">
                      <span className="truncate">{k.name}</span>
                      {revoked && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase tracking-wider">
                          {tx('Revoked')}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                      {project && (
                        <>
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: projectColorMap.get(project.id) }}
                          />
                          <span>{project.name}</span>
                          <span className="text-border">·</span>
                        </>
                      )}
                      <span className="font-mono">{k.maskedSecret.slice(-12)}</span>
                    </div>
                  </div>

                  <div className="min-w-[120px] text-right">
                    <div className="text-sm font-semibold tabular-nums">
                      {formatCents(monthSpend)}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {tx('Spend MTD')}
                    </div>
                  </div>

                  <div className="min-w-[110px] text-right">
                    <div className="text-sm tabular-nums text-muted-foreground">
                      {formatCalls(monthCalls)}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {t('calls', '次调用')}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Recent top-ups preview */}
      <div className="rounded-2xl border border-border bg-background p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold flex items-center gap-2">
            <ReceiptText className="h-4 w-4" /> {tx('Recent top-ups')}
          </div>
          <Link
            href="/dashboard/billing/history"
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            {tx('View full history')} →
          </Link>
        </div>
        {recentTopUps.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground">
            {tx('No successful top-ups yet. Your first credit purchase will appear here.')}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {recentTopUps.map((t) => {
              const k = t.keyId ? keys.find((kk) => kk.id === t.keyId) : undefined;
              return (
                <li key={t.id} className="py-2.5 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {t.description}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {new Date(t.createdAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                      {k && ` · ${k.name}`}
                      {t.last4 && ` · •••• ${t.last4}`}
                    </div>
                  </div>
                  <div className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                    +{formatCents(t.amountCents)}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Account-level management: deliberately slim. Saved cards live behind
          a modal, not a big card, because net-new cards are added inside the
          top-up flow and this module is only for cleanup. */}
      <div className="rounded-xl border border-border bg-muted/20 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CreditCard className="h-3.5 w-3.5" />
          <span>
            {tx('Saved cards auto-fill at checkout. New cards are added during a top-up.')}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setManageCardsOpen(true)}
          className="text-xs font-medium text-foreground hover:underline underline-offset-2"
        >
          {tx('Manage saved cards')} →
        </button>
      </div>

      <p className="text-[11px] text-muted-foreground leading-relaxed flex items-start gap-1.5">
        <HelpCircle className="h-3 w-3 mt-0.5 shrink-0" />
        {tx('Invoices are emailed to the receipt email on your account. Billing currency is USD. Taxes collected via Stripe Tax where applicable.')}
      </p>

      {/* Modals */}
      <StripeCheckoutModal
        open={addCreditsOpen}
        onClose={() => setAddCreditsOpen(false)}
        mode="add-credits"
      />

      <ManageSavedCardsModal
        open={manageCardsOpen}
        onClose={() => setManageCardsOpen(false)}
      />
    </div>
  );
}

/**
 * Compact dropdown used in the cost chart's filter bar (project / key / model).
 * Styled as a chip with truncation so several filters can fit in one row.
 */
function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 pl-3 pr-8 text-xs font-medium rounded-lg border border-border bg-background appearance-none focus:outline-none focus:ring-2 focus:ring-ring/20 max-w-[180px] truncate"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg
        className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}
