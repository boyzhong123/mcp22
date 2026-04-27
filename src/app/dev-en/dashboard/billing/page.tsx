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
  formatCents,
  getAccountSavingsThisMonthCents,
  getAccountSpendThisMonthCents,
  getBillingTier,
  getKeyBalanceCents,
  getSpendLimit,
  getTransactions,
  getUsage,
  listPaidKeys,
  listProjects,
  type ApiKey,
  type Project,
  type Transaction,
  type UsagePoint,
} from '../../_lib/mock-store';
import { useMockStore } from '../../_lib/use-mock-store';
import { ManageSavedCardsModal } from '../../_components/manage-saved-cards-modal';
import { SpendLimitModal } from '../../_components/spend-limit-modal';
import { StatCard } from '../../_components/stat-card';
import { StripeCheckoutModal } from '../../_components/stripe-checkout-modal';
import { useLang } from '../../_lib/use-lang';

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
  const spendLimit = useMockStore(getSpendLimit, {
    monthlyCapCents: 5000_00,
    resetDay: 1,
    warnAtPercents: [50, 75, 90],
  });
  const spendThisMonth = useMockStore(getAccountSpendThisMonthCents, 0);
  const savingsThisMonth = useMockStore(getAccountSavingsThisMonthCents, 0);

  const [period, setPeriod] = useState<Period>(28);
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [keyFilter, setKeyFilter] = useState<string>('all');
  const [modifyLimitOpen, setModifyLimitOpen] = useState(false);
  const [addCreditsKeyId, setAddCreditsKeyId] = useState<string | null>(null);
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

  // Deep-link: `/dashboard/billing?edit=spend-limit` auto-opens the
  // modify modal (from Overview KPI card, Pricing CTA, and Overview quick
  // actions). We strip the query param so re-renders don't reopen, and defer
  // the open via queueMicrotask so we don't call setState synchronously inside
  // the effect body (React 19's set-state-in-effect rule).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('edit') !== 'spend-limit') return;
    params.delete('edit');
    const qs = params.toString();
    const next = `/dashboard/billing${qs ? `?${qs}` : ''}#spend-limit`;
    window.history.replaceState(null, '', next);
    const el = document.getElementById('spend-limit');
    if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' });
    queueMicrotask(() => setModifyLimitOpen(true));
  }, []);

  const limitPct = Math.min(
    100,
    (spendThisMonth / Math.max(1, spendLimit.monthlyCapCents)) * 100,
  );
  const limitColor =
    limitPct < 50 ? 'bg-emerald-500' : limitPct < 85 ? 'bg-amber-500' : 'bg-red-500';

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
      totalSavings: number;
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
      let totalSavings = 0;
      for (const p of pts) {
        const pid = keyProjectIndex.get(p.keyId);
        if (!pid) continue;
        perProject[pid] = (perProject[pid] ?? 0) + p.costCents;
        total += p.costCents;
        totalSavings += p.savingsCents;
      }
      days.push({ date, perProject, total, totalSavings });
    }
    return days;
  }, [usage, projects, period, keyFilter, projectFilter, keyProjectIndex]);

  const periodTotalCost = stackedData.reduce((acc, d) => acc + d.total, 0);
  const periodTotalSavings = stackedData.reduce((acc, d) => acc + d.totalSavings, 0);
  const periodGross = periodTotalCost + periodTotalSavings;
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

  // Sum of **remaining** credits across paid keys — more useful on a
  // balance card than lifetime-loaded credits, which never goes down.
  const totalPaidCreditsCents = useMemo(
    () => keys.reduce((acc, k) => acc + getKeyBalanceCents(k), 0),
    [keys],
  );

  // Count only paid keys that are currently funded. Needs-credits & revoked
  // keys shouldn't contribute to the "n keys" subtitle on the KPI.
  const fundedKeyCount = useMemo(
    () => keys.filter((k) => getKeyBalanceCents(k) > 0).length,
    [keys],
  );

  const recentTopUps = useMemo(
    () =>
      transactions
        .filter((t) => t.kind === 'credit-topup' && t.status === 'succeeded')
        .slice(0, 3),
    [transactions],
  );

  // Rank: funded paid keys first (largest balance first), then
  // needs-credits, then revoked. Starter is already filtered out upstream.
  const sortedKeys = useMemo(() => {
    return [...keys].sort((a, b) => {
      const rank = (k: ApiKey) => {
        const tier = getBillingTier(k);
        if (tier === 'revoked') return 3;
        if (tier === 'needs-credits') return 2;
        return 0;
      };
      const rd = rank(a) - rank(b);
      if (rd !== 0) return rd;
      return getKeyBalanceCents(b) - getKeyBalanceCents(a);
    });
  }, [keys]);

  const openAddCreditsFor = (kid?: string) => {
    setAddCreditsKeyId(kid ?? null);
    setAddCreditsOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => openAddCreditsFor()}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-foreground text-background text-sm font-semibold hover:brightness-110 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          {t('Add credits', '充值')}
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard
          label={tx('Spend this month')}
          value={formatCents(spendThisMonth)}
          sub={
            <>
              <span className="tabular-nums">{limitPct.toFixed(1)}%</span>
              {t(' of ', ' / ')}
              <span className="tabular-nums">{formatCents(spendLimit.monthlyCapCents)}</span>
              {t(' limit', ' 上限')}
            </>
          }
          progressPct={limitPct}
          progressColor={limitColor}
        />
        <StatCard
          label={tx('Credits remaining')}
          value={formatCents(totalPaidCreditsCents)}
          sub={t(
            `Across ${fundedKeyCount} funded paid key${fundedKeyCount === 1 ? '' : 's'}`,
            `跨 ${fundedKeyCount} 个已充值付费 key`,
          )}
        />
        <StatCard
          label={tx('Savings this month')}
          value={formatCents(savingsThisMonth)}
          sub={tx('Volume discounts applied')}
          tone="emerald"
        />
      </div>

      {/* Spend-limit card */}
      <div
        id="spend-limit"
        className="rounded-2xl border border-border bg-background p-5 scroll-mt-16"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              {tx('Monthly spend limit')}
              <span className="text-[10px] font-medium normal-case tracking-normal px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 border border-amber-500/30">
                {tx('Experimental')}
              </span>
            </div>
            <div className="mt-2 text-2xl font-semibold tabular-nums">
              {formatCents(spendThisMonth)}
              <span className="text-muted-foreground font-normal text-base ml-1">
                / {formatCents(spendLimit.monthlyCapCents)}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {t(
                `${limitPct.toFixed(1)}% of this month's cap used. Warnings at ${spendLimit.warnAtPercents.join('%, ')}%.`,
                `本月上限已用 ${limitPct.toFixed(1)}%。警告阈值:${spendLimit.warnAtPercents.join('%, ')}%。`,
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setModifyLimitOpen(true)}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-border bg-background text-sm font-medium hover:bg-muted/50"
          >
            {tx('Modify spend limit')}
          </button>
        </div>
        <div className="mt-4 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={cn('h-full transition-all', limitColor)}
            style={{ width: `${limitPct}%` }}
          />
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground leading-relaxed">
          {tx('Spend limits are enforced with up to 10 minutes of latency; small overages may occur. Counters reset at 12:00 AM on the 1st of each month (Pacific time).')}
        </p>
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
                <span className="font-medium text-foreground">
                  {formatCents(periodGross)}
                </span>{' '}
                {t('gross', '总额')} −{' '}
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  {formatCents(periodTotalSavings)}
                </span>{' '}
                {t('savings', '优惠')} ={' '}
                <span className="font-medium text-foreground">
                  {formatCents(periodTotalCost)}
                </span>
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
                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-muted-foreground">{tx('Savings')}</span>
                        <span className="tabular-nums text-emerald-600 dark:text-emerald-400">
                          −{formatCents(d.totalSavings)}
                        </span>
                      </div>
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

      {/* Credits by key */}
      <div className="rounded-2xl border border-border bg-background overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold flex items-center gap-2">
              <Wallet className="h-4 w-4" /> {tx('Credits by paid key')}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {tx('Each paid key has its own balance — top up the ones running low. Your starter key is listed on the')}{' '}
              <Link
                href="/dashboard/keys"
                className="underline underline-offset-2 hover:text-foreground"
              >
                {tx('API Keys')}
              </Link>{' '}
              {tx('page.')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => openAddCreditsFor()}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-background text-xs font-semibold hover:bg-muted/50"
          >
            <Plus className="h-3.5 w-3.5" />
            {tx('Add credits')}
          </button>
        </div>
        {sortedKeys.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            {tx("No paid keys yet — you're running on the free starter key. Create a paid key on the")}{' '}
            <Link
              href="/dashboard/keys"
              className="underline hover:text-foreground"
            >
              {tx('API Keys page')}
            </Link>{' '}
            {tx('when you need more headroom.')}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {sortedKeys.map((k) => {
              const project = projects.find((p) => p.id === k.projectId);
              const balance = getKeyBalanceCents(k);
              const monthSpend = spendByKeyThisMonth.get(k.id) ?? 0;
              const tier = getBillingTier(k);
              const revoked = tier === 'revoked';
              const needsCredits = tier === 'needs-credits';

              return (
                <li
                  key={k.id}
                  className="px-5 py-3 flex flex-wrap items-center gap-3"
                >
                  <div className="flex-1 min-w-[180px]">
                    <div className="text-sm font-medium flex items-center gap-2">
                      <span className="truncate">{k.name}</span>
                      <span
                        className={cn(
                          'text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded',
                          k.env === 'production'
                            ? 'bg-foreground/[0.04] text-foreground border border-border'
                            : 'bg-muted text-muted-foreground border border-border',
                        )}
                      >
                        {tx(k.env === 'production' ? 'Prod' : 'Dev')}
                      </span>
                      {revoked && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase tracking-wider">
                          {tx('Revoked')}
                        </span>
                      )}
                      {needsCredits && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 uppercase tracking-wider">
                          {tx('Needs credits')}
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
                      {formatCents(balance)}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {tx('Balance')}
                    </div>
                  </div>

                  <div className="min-w-[120px] text-right">
                    <div className="text-sm font-medium tabular-nums">
                      {formatCents(monthSpend)}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {tx('Spend MTD')}
                    </div>
                  </div>

                  {!revoked && (
                    <button
                      type="button"
                      onClick={() => openAddCreditsFor(k.id)}
                      className={cn(
                        'inline-flex items-center gap-1 h-8 px-3 rounded-lg text-xs font-semibold transition-colors',
                        needsCredits
                          ? 'bg-foreground text-background hover:brightness-110'
                          : 'border border-border bg-background hover:bg-muted/50',
                      )}
                    >
                      <Plus className="h-3 w-3" />
                      {tx('Add credits')}
                    </button>
                  )}
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
        keyId={addCreditsKeyId ?? undefined}
      />

      <SpendLimitModal open={modifyLimitOpen} onClose={() => setModifyLimitOpen(false)} />

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
