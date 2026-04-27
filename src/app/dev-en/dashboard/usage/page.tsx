'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronDown, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  formatCents,
  getUsage,
  keyLast4,
  listKeys,
  listProjects,
  type ApiKey,
  type Project,
  type UsagePoint,
} from '../../_lib/mock-store';
import { useMockStore } from '../../_lib/use-mock-store';
import { useLang } from '../../_lib/use-lang';

type Period = 7 | 14 | 28 | 90;
const PERIODS: Period[] = [7, 14, 28, 90];

// Deterministic palette used to colour each API key across the chart.
// Cycled by index — enough distinct hues for a typical account's key count.
const SERIES_COLORS = [
  '#6366f1', // indigo-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#0ea5e9', // sky-500
  '#ec4899', // pink-500
  '#22c55e', // green-500
];

export default function UsagePage() {
  const { t, tx } = useLang();
  const usage = useMockStore(getUsage, [] as UsagePoint[]);
  const keys = useMockStore(listKeys, [] as ApiKey[]);
  const projects = useMockStore(listProjects, [] as Project[]);
  const searchParams = useSearchParams();

  const [period, setPeriod] = useState<Period>(28);
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [keyFilter, setKeyFilter] = useState<string>('all');
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  // Deep-link: `/dashboard/usage?key=<keyId>` pre-selects that key so
  // clicking "View usage" from the API Keys page drops the user into a
  // single-key view without needing to refilter manually.
  useEffect(() => {
    const kid = searchParams.get('key');
    if (!kid) return;
    // Only honour the param if the key actually exists, otherwise leave the
    // filter alone so the page doesn't render an empty state for a stale id.
    if (keys.some((k) => k.id === kid)) {
      setKeyFilter(kid);
      const k = keys.find((kk) => kk.id === kid);
      if (k) setProjectFilter(k.projectId);
    }
  }, [searchParams, keys]);

  const filteredKeys = useMemo(
    () =>
      projectFilter === 'all'
        ? keys
        : keys.filter((k) => k.projectId === projectFilter),
    [keys, projectFilter],
  );

  const filteredUsage = useMemo(() => {
    return usage.filter((p) => {
      const key = keys.find((k) => k.id === p.keyId);
      if (!key) return false;
      if (projectFilter !== 'all' && key.projectId !== projectFilter) return false;
      if (keyFilter !== 'all' && p.keyId !== keyFilter) return false;
      return true;
    });
  }, [usage, keys, projectFilter, keyFilter]);

  // Keys that actually show up in the filtered window, sorted by total
  // calls desc. We use this list both for the stack order (largest on
  // bottom) and for the legend.
  const activeKeys = useMemo(() => {
    const totals = new Map<string, number>();
    for (const p of filteredUsage) {
      totals.set(p.keyId, (totals.get(p.keyId) ?? 0) + p.calls);
    }
    return Array.from(totals.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([kid]) => keys.find((k) => k.id === kid))
      .filter((k): k is ApiKey => !!k);
  }, [filteredUsage, keys]);

  const keyColorMap = useMemo(() => {
    const m = new Map<string, string>();
    activeKeys.forEach((k, i) => m.set(k.id, SERIES_COLORS[i % SERIES_COLORS.length]));
    return m;
  }, [activeKeys]);

  // Build last N days stacked-by-key dataset. "perKey[keyId]" holds that
  // key's daily call count; stacking order follows `activeKeys`.
  const stackedData = useMemo(() => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const days: {
      date: string;
      perKey: Record<string, number>;
      totalCalls: number;
      totalCostCents: number;
      totalSavingsCents: number;
    }[] = [];
    for (let i = period - 1; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86400000);
      const date = d.toISOString().slice(0, 10);
      const perKey: Record<string, number> = {};
      let totalCalls = 0;
      let totalCostCents = 0;
      let totalSavingsCents = 0;
      for (const p of filteredUsage.filter((x) => x.date === date)) {
        perKey[p.keyId] = (perKey[p.keyId] ?? 0) + p.calls;
        totalCalls += p.calls;
        totalCostCents += p.costCents;
        totalSavingsCents += p.savingsCents;
      }
      days.push({ date, perKey, totalCalls, totalCostCents, totalSavingsCents });
    }
    return days;
  }, [filteredUsage, period]);

  const kpiTotalCalls = stackedData.reduce((a, d) => a + d.totalCalls, 0);
  const kpiTotalCost = stackedData.reduce((a, d) => a + d.totalCostCents, 0);
  const kpiTotalSavings = stackedData.reduce((a, d) => a + d.totalSavingsCents, 0);
  const kpiAvgPerDay = Math.round(kpiTotalCalls / Math.max(1, stackedData.length));
  const peakDay = stackedData.reduce(
    (acc, d) => (d.totalCalls > acc.totalCalls ? d : acc),
    stackedData[0] ?? { date: '—', totalCalls: 0 },
  );
  const maxDay = Math.max(1, ...stackedData.map((d) => d.totalCalls));

  const perKeyBreakdown = useMemo(() => {
    const map = new Map<string, { calls: number; cost: number; savings: number }>();
    for (const p of filteredUsage) {
      const d = map.get(p.keyId) ?? { calls: 0, cost: 0, savings: 0 };
      d.calls += p.calls;
      d.cost += p.costCents;
      d.savings += p.savingsCents;
      map.set(p.keyId, d);
    }
    return Array.from(map.entries())
      .map(([keyId, d]) => {
        const k = keys.find((kk) => kk.id === keyId);
        return {
          key: k,
          ...d,
        };
      })
      .filter((row) => row.key)
      .sort((a, b) => b.calls - a.calls);
  }, [filteredUsage, keys]);

  const chartWidth = 720;
  const chartHeight = 220;
  const pad = { top: 10, right: 20, bottom: 24, left: 50 };
  const innerW = chartWidth - pad.left - pad.right;
  const innerH = chartHeight - pad.top - pad.bottom;
  const slot = innerW / Math.max(1, stackedData.length);
  const barW = Math.max(3, slot * 0.72);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.02em]">{t('Usage', '用量')}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t(
            'Operational view — MCP call volume sliced by project and key. For spend, credits, and payment head to ',
            '运营视角 — 按项目、Key 切分的 MCP 调用量。消费、余额、付款请前往 ',
          )}
          <Link
            href="/dashboard/billing"
            className="underline underline-offset-2 hover:text-foreground"
          >
            {t('Billing', '账单')}
          </Link>
          {t('.', '。')}
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect
          label={tx('Project')}
          value={projectFilter}
          onChange={(v) => {
            setProjectFilter(v);
            setKeyFilter('all');
          }}
          options={[
            { value: 'all', label: tx('All projects') },
            ...projects.map((p) => ({ value: p.id, label: p.name })),
          ]}
        />
        <FilterSelect
          label={tx('Key')}
          value={keyFilter}
          onChange={setKeyFilter}
          options={[
            { value: 'all', label: tx('All keys') },
            ...filteredKeys.map((k) => ({
              value: k.id,
              label: `${k.name} · ${keyLast4(k.secret)}`,
            })),
          ]}
        />
        <div className="inline-flex items-center rounded-lg border border-border bg-background overflow-hidden">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'h-9 px-3 text-xs font-medium transition-colors',
                period === p
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {p}{t('d', '天')}
            </button>
          ))}
        </div>

        <div className="ml-auto">
          <button
            type="button"
            onClick={() =>
              exportUsageCsv({
                rows: filteredUsage,
                keys,
                projects,
                period,
                projectFilter,
                keyFilter,
              })
            }
            disabled={filteredUsage.length === 0}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border bg-background hover:bg-muted/50 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            title={t('Export current view to CSV', '将当前视图导出为 CSV')}
          >
            <Download className="h-3.5 w-3.5" />
            {t('Export CSV', '导出 CSV')}
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Kpi label={tx('Total calls')} value={kpiTotalCalls.toLocaleString('en-US')} />
        <Kpi label={tx('Net cost')} value={formatCents(kpiTotalCost)} />
        <Kpi
          label={tx('Savings')}
          value={formatCents(kpiTotalSavings)}
          tone="emerald"
        />
        <Kpi label={tx('Avg / day')} value={kpiAvgPerDay.toLocaleString('en-US')} />
        <Kpi
          label={tx('Peak day')}
          value={peakDay?.totalCalls.toLocaleString('en-US') ?? '0'}
          sub={peakDay?.date}
        />
      </div>

      {/* Stacked chart */}
      <div className="rounded-2xl border border-border bg-background p-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {tx('Daily calls by key')}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {t(
                `${kpiTotalCalls.toLocaleString('en-US')} calls · last ${period} days`,
                `过去 ${period} 天 · ${kpiTotalCalls.toLocaleString('en-US')} 次调用`,
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            {activeKeys.map((k) => (
              <div key={k.id} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span
                  className="h-2 w-2 rounded-sm"
                  style={{ backgroundColor: keyColorMap.get(k.id) }}
                />
                <span className="truncate max-w-[160px]">{k.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* See billing/page.tsx for the rationale: outer wrapper owns the
            tooltip (overflow: visible), inner wrapper owns horizontal scroll. */}
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
                  {Math.round(maxDay * t).toLocaleString('en-US')}
                </text>
              </g>
            ))}

            {stackedData.map((d, i) => {
              const x = pad.left + i * slot + (slot - barW) / 2;
              let yCursor = pad.top + innerH;
              const segments: { keyId: string; y: number; h: number; color: string }[] = [];
              activeKeys.forEach((k) => {
                const v = d.perKey[k.id] ?? 0;
                if (v <= 0) return;
                const h = (v / maxDay) * innerH;
                yCursor -= h;
                segments.push({
                  keyId: k.id,
                  y: yCursor,
                  h,
                  color: keyColorMap.get(k.id) ?? '#6366f1',
                });
              });
              return (
                <g key={d.date} onMouseEnter={() => setHoverIdx(i)}>
                  {segments.map((s) => (
                    <rect
                      key={s.keyId}
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
          {hoverIdx !== null && stackedData[hoverIdx] && (
            (() => {
              const d = stackedData[hoverIdx];
              const centerPctX = ((pad.left + hoverIdx * slot + slot / 2) / chartWidth) * 100;
              const barTopPctY =
                ((pad.top + innerH - (d.totalCalls / maxDay) * innerH) / chartHeight) * 100;
              const flipBelow = barTopPctY < 35;
              const rows = activeKeys
                .filter((k) => (d.perKey[k.id] ?? 0) > 0)
                .map((k) => ({
                  label: k.name,
                  value: d.perKey[k.id],
                  color: keyColorMap.get(k.id) ?? '#6366f1',
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
                    <div className="text-muted-foreground">{tx('No usage')}</div>
                  ) : (
                    <>
                      {rows.map((r) => (
                        <div key={r.label} className="flex items-center gap-2 py-0.5">
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: r.color }}
                          />
                          <span className="flex-1 truncate">{r.label}</span>
                          <span className="tabular-nums">
                            {r.value.toLocaleString('en-US')}
                          </span>
                        </div>
                      ))}
                      <div className="h-px bg-border my-1.5" />
                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-muted-foreground">{tx('Cost')}</span>
                        <span className="tabular-nums">{formatCents(d.totalCostCents)}</span>
                      </div>
                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-muted-foreground">{tx('Savings')}</span>
                        <span className="tabular-nums text-emerald-600 dark:text-emerald-400">
                          −{formatCents(d.totalSavingsCents)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              );
            })()
          )}
        </div>
      </div>

      {/* Per-key breakdown */}
      <div className="rounded-2xl border border-border bg-background overflow-hidden">
        <div className="px-5 py-4 border-b border-border/60">
          <div className="text-sm font-semibold">{tx('Per-key breakdown')}</div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {tx('Lifetime usage per key within the current filter.')}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="text-left px-5 py-2.5 font-semibold">{tx('Key')}</th>
                <th className="text-left px-5 py-2.5 font-semibold">{tx('Project')}</th>
                <th className="text-right px-5 py-2.5 font-semibold">{tx('Calls')}</th>
                <th className="text-right px-5 py-2.5 font-semibold">{tx('Cost')}</th>
                <th className="text-right px-5 py-2.5 font-semibold">{tx('Savings')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {perKeyBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-muted-foreground">
                    {tx('No usage in this window.')}
                  </td>
                </tr>
              ) : (
                perKeyBreakdown.map((row) => {
                  const proj = projects.find((p) => p.id === row.key!.projectId);
                  return (
                    <tr key={row.key!.id}>
                      <td className="px-5 py-3">
                        <div className="text-sm font-medium">{row.key!.name}</div>
                        <div className="font-mono text-[11px] text-muted-foreground">
                          {keyLast4(row.key!.secret)}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="text-xs font-medium truncate">{proj?.name ?? '—'}</div>
                        <div className="font-mono text-[11px] text-muted-foreground">
                          {proj?.slug}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums">
                        {row.calls.toLocaleString('en-US')}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums">{formatCents(row.cost)}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                        {row.savings > 0 ? `−${formatCents(row.savings)}` : formatCents(0)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
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
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 pl-3 pr-8 text-xs font-medium rounded-lg border border-border bg-background appearance-none focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-foreground/30"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {label}: {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: 'default' | 'emerald';
}) {
  return (
    <div className="rounded-xl border border-border bg-background px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          'mt-1 text-lg font-semibold tabular-nums',
          tone === 'emerald' && 'text-emerald-600 dark:text-emerald-400',
        )}
      >
        {value}
      </div>
      {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

/**
 * CSV export — reflects current filter state. Emits a header row + one row
 * per usage point, with project/key metadata joined in for readability. We
 * RFC 4180-escape every cell (double any quotes, wrap anything with comma /
 * newline / quote in quotes) to avoid Excel corruption.
 */
function exportUsageCsv(input: {
  rows: UsagePoint[];
  keys: ApiKey[];
  projects: Project[];
  period: Period;
  projectFilter: string;
  keyFilter: string;
}) {
  const { rows, keys, projects, period, projectFilter, keyFilter } = input;
  const keyById = new Map(keys.map((k) => [k.id, k]));
  const projectById = new Map(projects.map((p) => [p.id, p]));

  const header = [
    'date',
    'project_id',
    'project_name',
    'key_id',
    'key_name',
    'key_masked',
    'calls',
    'cost_cents',
    'savings_cents',
    'net_cost_cents',
  ];

  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  const lines: string[] = [header.join(',')];
  for (const r of sorted) {
    const key = keyById.get(r.keyId);
    const project = key ? projectById.get(key.projectId) : undefined;
    const net = r.costCents - r.savingsCents;
    lines.push(
      [
        r.date,
        key?.projectId ?? '',
        project?.name ?? '',
        r.keyId,
        key?.name ?? '',
        key?.maskedSecret ?? '',
        String(r.calls),
        String(r.costCents),
        String(r.savingsCents),
        String(net),
      ]
        .map(csvEscape)
        .join(','),
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const scope = [
    `period-${period}d`,
    projectFilter === 'all' ? 'all-projects' : projectFilter,
    keyFilter === 'all' ? 'all-keys' : keyFilter,
  ].join('_');
  const filename = `chivox-usage_${today}_${scope}.csv`;

  // Prepend BOM so Excel detects UTF-8 correctly when opening the file.
  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}
