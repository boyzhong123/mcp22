'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BarChart3,
  Check,
  ChevronDown,
  Copy,
  Download,
  Eye,
  EyeOff,
  LayoutGrid,
} from 'lucide-react';
import { UsageActivityHeatmap } from '../../_components/usage-activity-heatmap';
import { KernelUsageDetailsModal } from '../../_components/kernel-usage-details-modal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  getUsage,
  keyLast4,
  listKeys,
  type ApiKey,
  type UsagePoint,
} from '../../_lib/mock-store';
import { useMockStore } from '../../_lib/use-mock-store';
import { useLang, type DevEnLang } from '../../_lib/use-lang';
import {
  aggregateEvaluationUsage,
  toEvaluationUsage,
  type EvaluationUsageBreakdown,
} from '../../_lib/evaluation-usage';
import { keys as keysApi } from '../../_lib/api';
import { realKeyId } from '../../_lib/mock-store-bridge';

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
  const { lang, t, tx } = useLang();
  const usage = useMockStore(getUsage, [] as UsagePoint[]);
  const keys = useMockStore(listKeys, [] as ApiKey[]);
  const searchParams = useSearchParams();

  const [period, setPeriod] = useState<Period>(28);
  const [keyFilter, setKeyFilter] = useState<string>('all');
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  // Chart Y-axis dimension toggle: stack daily *calls* (count) or consumed
  // *evaluation points*. Both share the same X-axis and per-key colour
  // mapping so users can flip between them mid-investigation without
  // losing context.
  const [chartMetric, setChartMetric] = useState<'calls' | 'points'>('calls');
  const [chartView, setChartView] = useState<'bars' | 'heatmap'>('bars');
  // Per-key breakdown table sort. `column` selects which numeric column
  // drives the order; `dir` toggles ascending/descending. Default is
  // calls-desc, matching the natural "biggest spender first" expectation.
  const [breakdownSort, setBreakdownSort] = useState<{
    column: 'calls' | 'points';
    dir: 'asc' | 'desc';
  }>({ column: 'calls', dir: 'desc' });
  const [detailsKeyId, setDetailsKeyId] = useState<string | null>(null);
  const [revealedKeySecrets, setRevealedKeySecrets] = useState<Record<string, string>>({});
  const [visibleKeyIds, setVisibleKeyIds] = useState<Set<string>>(() => new Set());
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  useEffect(() => {
    if (!copiedKeyId) return;
    const timer = window.setTimeout(() => setCopiedKeyId(null), 1500);
    return () => window.clearTimeout(timer);
  }, [copiedKeyId]);

  const revealKeySecret = async (keyId: string) => {
    const cached = revealedKeySecrets[keyId];
    if (cached) return cached;
    try {
      const secret = await keysApi.reveal(realKeyId(keyId));
      if (!secret) return null;
      setRevealedKeySecrets((current) => ({ ...current, [keyId]: secret }));
      return secret;
    } catch (error) {
      console.error('[usage] unable to reveal key', keyId, error);
      return null;
    }
  };

  const toggleKeyVisibility = async (keyId: string) => {
    if (visibleKeyIds.has(keyId)) {
      setVisibleKeyIds((current) => {
        const next = new Set(current);
        next.delete(keyId);
        return next;
      });
      return;
    }
    const secret = await revealKeySecret(keyId);
    if (!secret) return;
    setVisibleKeyIds((current) => new Set(current).add(keyId));
  };

  const copyKeySecret = async (keyId: string) => {
    const secret = await revealKeySecret(keyId);
    if (!secret) return;
    let copied = false;
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(secret);
        copied = true;
      } catch {
        // Fall through for non-secure contexts and restricted browsers.
      }
    }
    if (!copied) {
      const textarea = document.createElement('textarea');
      textarea.value = secret;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        copied = document.execCommand('copy');
      } catch {
        copied = false;
      }
      document.body.removeChild(textarea);
    }
    if (copied) setCopiedKeyId(keyId);
  };

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
    }
  }, [searchParams, keys]);

  const filteredUsage = useMemo(() => {
    return usage.filter((p) => {
      const key = keys.find((k) => k.id === p.keyId);
      if (!key) return false;
      if (keyFilter !== 'all' && p.keyId !== keyFilter) return false;
      return true;
    });
  }, [usage, keys, keyFilter]);

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
      perKeyCost: Record<string, number>;
      totalCalls: number;
      totalCostMills: number;
      totalUncovered: number;
    }[] = [];
    for (let i = period - 1; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86400000);
      const date = d.toISOString().slice(0, 10);
      const perKey: Record<string, number> = {};
      const perKeyCost: Record<string, number> = {};
      let totalCalls = 0;
      let totalCostMills = 0;
      let totalUncovered = 0;
      for (const p of filteredUsage.filter((x) => x.date === date)) {
        const evaluationUsage = toEvaluationUsage(p);
        perKey[p.keyId] = (perKey[p.keyId] ?? 0) + evaluationUsage.calls;
        perKeyCost[p.keyId] = (perKeyCost[p.keyId] ?? 0) + evaluationUsage.totalPoints;
        totalCalls += evaluationUsage.calls;
        totalCostMills += evaluationUsage.totalPoints;
        totalUncovered += evaluationUsage.uncoveredPoints;
      }
      days.push({ date, perKey, perKeyCost, totalCalls, totalCostMills, totalUncovered });
    }
    return days;
  }, [filteredUsage, period]);

  const kpiTotalCalls = stackedData.reduce((a, d) => a + d.totalCalls, 0);
  const kpiTotalCost = stackedData.reduce((a, d) => a + d.totalCostMills, 0);
  const kpiTotalUncovered = stackedData.reduce((a, d) => a + d.totalUncovered, 0);
  const kpiAvgPerDay = Math.round(kpiTotalCalls / Math.max(1, stackedData.length));
  const peakDay = stackedData.reduce(
    (acc, d) => (d.totalCalls > acc.totalCalls ? d : acc),
    stackedData[0] ?? { date: '—', totalCalls: 0 },
  );
  const maxDay = Math.max(1, ...stackedData.map((d) => d.totalCalls));
  const maxDayCost = Math.max(1, ...stackedData.map((d) => d.totalCostMills));

  // Helpers: pick the right per-key value getter and the right axis
  // formatter based on the active metric. Centralised so the rendering
  // code below stays metric-agnostic.
  const isCostMetric = chartMetric === 'points';
  const yMax = isCostMetric ? maxDayCost : maxDay;
  const dayTotal = (d: (typeof stackedData)[number]) =>
    isCostMetric ? d.totalCostMills : d.totalCalls;
  const dayPerKey = (d: (typeof stackedData)[number], keyId: string) =>
    isCostMetric ? (d.perKeyCost[keyId] ?? 0) : (d.perKey[keyId] ?? 0);
  const formatAxis = (v: number) =>
    isCostMetric
      ? `${Math.round(v).toLocaleString('en-US')} ${tx('pts')}`
      : `${Math.round(v).toLocaleString('en-US')} ${tx('calls')}`;
  const formatTooltipValue = (v: number) =>
    isCostMetric
      ? `${Math.round(v).toLocaleString('en-US')} ${tx('pts')}`
      : `${v.toLocaleString('en-US')} ${tx('calls')}`;

  // Per-key rollup with the dynamic CoreType split. Column set = union of
  // CoreTypes seen in the filtered window (case-sensitive keys, largest
  // deduction first) — never a hardcoded business taxonomy.
  const perKeyBreakdown = useMemo(() => {
    const byKey = new Map<string, UsagePoint[]>();
    for (const p of filteredUsage) {
      const list = byKey.get(p.keyId) ?? [];
      list.push(p);
      byKey.set(p.keyId, list);
    }
    return Array.from(byKey.entries())
      .map(([keyId, list]) => ({
        key: keys.find((kk) => kk.id === keyId),
        usage: aggregateEvaluationUsage(list),
      }))
      .filter((row): row is { key: ApiKey; usage: EvaluationUsageBreakdown } => !!row.key)
      .sort((a, b) => {
        const av = breakdownSort.column === 'calls' ? a.usage.calls : a.usage.totalPoints;
        const bv = breakdownSort.column === 'calls' ? b.usage.calls : b.usage.totalPoints;
        return breakdownSort.dir === 'desc' ? bv - av : av - bv;
      });
  }, [filteredUsage, keys, breakdownSort]);

  const detailsRow = detailsKeyId
    ? perKeyBreakdown.find((row) => row.key.id === detailsKeyId) ?? null
    : null;

  const toggleBreakdownSort = (column: 'calls' | 'points') => {
    setBreakdownSort((prev) =>
      prev.column === column
        ? { column, dir: prev.dir === 'desc' ? 'asc' : 'desc' }
        : { column, dir: 'desc' },
    );
  };

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
            'Operational view — calls and evaluation-point consumption sliced by key. For top-ups and expiry details, head to ',
            '运营视角 — 按 Key 切分调用量与评测积分消耗。充值和有效期明细请前往 ',
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
          label={tx('Key')}
          value={keyFilter}
          onChange={setKeyFilter}
          options={[
            { value: 'all', label: tx('All keys') },
            ...keys.map((k) => ({
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
                period,
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

      {/* KPI strip — units made explicit: calls (次) vs points (积分) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi
          label={tx('Total calls')}
          value={kpiTotalCalls.toLocaleString('en-US')}
          unit={tx('calls')}
        />
        <Kpi
          label={t('Points consumed', '消耗积分')}
          value={kpiTotalCost.toLocaleString('en-US')}
          unit={t('pts', '积分')}
          sub={
            kpiTotalUncovered > 0
              ? t(
                  `+ ${kpiTotalUncovered.toLocaleString('en-US')} pts uncovered`,
                  `另有 ${kpiTotalUncovered.toLocaleString('en-US')} 积分未覆盖`,
                )
              : undefined
          }
        />
        <Kpi
          label={t('Avg calls / day', '日均调用')}
          value={kpiAvgPerDay.toLocaleString('en-US')}
          unit={tx('calls')}
        />
        <Kpi
          label={t('Peak calls', '峰值调用')}
          value={peakDay?.totalCalls.toLocaleString('en-US') ?? '0'}
          unit={tx('calls')}
          sub={peakDay?.date}
        />
      </div>

      {/* Stacked chart */}
      <div className="rounded-2xl border border-border bg-background p-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {chartView === 'heatmap'
                ? isCostMetric
                  ? t('Daily points', '每日消耗积分')
                  : t('Daily calls', '每日调用')
                : isCostMetric
                  ? t('Daily points by key', '按 KEY 查看每日积分消耗')
                  : t('Daily calls by key', '按 KEY 查看每日调用')}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {chartView === 'heatmap'
                ? isCostMetric
                  ? t(
                      `${kpiTotalCost.toLocaleString('en-US')} points · ${period} days · one square per day`,
                      `过去 ${period} 天 · 共消耗 ${kpiTotalCost.toLocaleString('en-US')} 积分 · 每格一天`,
                    )
                  : t(
                      `${kpiTotalCalls.toLocaleString('en-US')} calls · ${period} days · one square per day`,
                      `过去 ${period} 天 · ${kpiTotalCalls.toLocaleString('en-US')} 次调用 · 每格一天`,
                    )
                : isCostMetric
                  ? t(
                      `${kpiTotalCost.toLocaleString('en-US')} points · last ${period} days`,
                      `过去 ${period} 天 · 共消耗 ${kpiTotalCost.toLocaleString('en-US')} 积分`,
                    )
                  : t(
                      `${kpiTotalCalls.toLocaleString('en-US')} calls · last ${period} days`,
                      `过去 ${period} 天 · ${kpiTotalCalls.toLocaleString('en-US')} 次调用`,
                    )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Chart type: stacked bars vs GitHub-style activity heatmap */}
            <div className="inline-flex items-center rounded-lg border border-border bg-muted/30 p-0.5 text-[11px] font-medium">
              <button
                type="button"
                onClick={() => setChartView('bars')}
                className={cn(
                  'inline-flex items-center gap-1 h-6 px-2 rounded-md transition-colors',
                  chartView === 'bars'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
                title={t('Bar chart', '柱状图')}
              >
                <BarChart3 className="h-3 w-3" />
                {t('Bars', '柱状')}
              </button>
              <button
                type="button"
                onClick={() => setChartView('heatmap')}
                className={cn(
                  'inline-flex items-center gap-1 h-6 px-2 rounded-md transition-colors',
                  chartView === 'heatmap'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
                title={t('Activity heatmap', '活动热图')}
              >
                <LayoutGrid className="h-3 w-3" />
                {t('Heatmap', '热图')}
              </button>
            </div>
            {/* Metric toggle — calls vs evaluation points; shared by both chart types */}
            <div className="inline-flex items-center rounded-lg border border-border bg-muted/30 p-0.5 text-[11px] font-medium">
              <button
                type="button"
                onClick={() => setChartMetric('calls')}
                className={cn(
                  'h-6 px-2.5 rounded-md transition-colors',
                  !isCostMetric
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t('Calls', '次数')}
              </button>
              <button
                type="button"
                onClick={() => setChartMetric('points')}
                className={cn(
                  'h-6 px-2.5 rounded-md transition-colors',
                  isCostMetric
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t('Points', '积分')}
              </button>
            </div>
          </div>
        </div>
        {chartView === 'bars' && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
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
        )}

        {chartView === 'heatmap' ? (
          <div className="mt-4">
            <UsageActivityHeatmap
              days={stackedData.map((d) => ({
                date: d.date,
                value: dayTotal(d),
              }))}
              formatValue={formatTooltipValue}
              metricLabel={
                isCostMetric ? t('points consumed', '消耗积分') : t('calls', '次调用')
              }
            />
          </div>
        ) : (
        /* See billing/page.tsx for the rationale: outer wrapper owns the
            tooltip (overflow: visible), inner wrapper owns horizontal scroll. */
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
                  {formatAxis(yMax * t)}
                </text>
              </g>
            ))}

            {stackedData.map((d, i) => {
              const x = pad.left + i * slot + (slot - barW) / 2;
              let yCursor = pad.top + innerH;
              const segments: { keyId: string; y: number; h: number; color: string }[] = [];
              activeKeys.forEach((k) => {
                const v = dayPerKey(d, k.id);
                if (v <= 0) return;
                const h = (v / yMax) * innerH;
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
                ((pad.top + innerH - (dayTotal(d) / yMax) * innerH) / chartHeight) * 100;
              const flipBelow = barTopPctY < 35;
              const rows = activeKeys
                .filter((k) => dayPerKey(d, k.id) > 0)
                .map((k) => ({
                  label: k.name,
                  value: dayPerKey(d, k.id),
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
                            {formatTooltipValue(r.value)}
                          </span>
                        </div>
                      ))}
                      <div className="h-px bg-border my-1.5" />
                      {/* Footer always shows the *other* dimension so a calls
                          tooltip still surfaces total spend, and a spend
                          tooltip surfaces total calls. */}
                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-muted-foreground">
                          {isCostMetric ? tx('Calls') : t('Points', '积分')}
                        </span>
                        <span className="tabular-nums">
                          {isCostMetric
                            ? `${d.totalCalls.toLocaleString('en-US')} ${tx('calls')}`
                            : `${d.totalCostMills.toLocaleString('en-US')} ${tx('pts')}`}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              );
            })()
          )}
        </div>
        )}
      </div>

      {/* Per-key breakdown */}
      <div className="rounded-2xl border border-border bg-background overflow-hidden">
        <div className="px-5 py-4 border-b border-border/60">
          <div className="text-sm font-semibold">{tx('Per-key breakdown')}</div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t(
              'Calls and consumed points per key. Open details to see the per-kernel breakdown.',
              '按 Key 展示调用次数与消耗积分；点击查看明细可查看各内核用量。',
            )}
          </p>
        </div>
        <div className="overflow-hidden">
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col className="w-[18%]" />
              <col className="w-[20%]" />
              <col className="w-[9%]" />
              <col className="w-[15%]" />
              <col className="w-[12%]" />
              <col className="w-[13%]" />
              <col className="w-[13%]" />
            </colgroup>
            <thead className="bg-muted/30">
              <tr className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2.5 text-left font-semibold">{tx('Name')}</th>
                <th className="px-3 py-2.5 text-left font-semibold">{tx('Key')}</th>
                <th className="px-3 py-2.5 text-left font-semibold">{t('Status', '状态')}</th>
                <th className="px-3 py-2.5 text-left font-semibold">{t('Last used', '最近调用')}</th>
                <th className="px-3 py-2.5 text-right font-semibold">
                  <SortHeader
                    label={t('Call count', '调用次数')}
                    active={breakdownSort.column === 'calls'}
                    dir={breakdownSort.dir}
                    onClick={() => toggleBreakdownSort('calls')}
                  />
                </th>
                <th className="px-3 py-2.5 text-right font-semibold">
                  <SortHeader
                    label={t('Points consumed', '消耗积分')}
                    active={breakdownSort.column === 'points'}
                    dir={breakdownSort.dir}
                    onClick={() => toggleBreakdownSort('points')}
                  />
                </th>
                <th className="px-3 py-2.5 text-right font-semibold">
                  {t('Kernel details', '内核明细')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {perKeyBreakdown.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-8 text-center text-sm text-muted-foreground"
                  >
                    {tx('No usage in this window.')}
                  </td>
                </tr>
              ) : (
                perKeyBreakdown.map((row) => (
                  <tr key={row.key.id}>
                    <td className="px-3 py-3">
                      <div className="truncate text-sm font-medium" title={row.key.name}>{row.key.name}</div>
                      <div className="mt-1 truncate text-[10px] text-muted-foreground">
                        {t('Created', '创建于')} {formatKeyDate(row.key.createdAt, lang, false)}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex min-w-0 items-center gap-0.5">
                        <code
                          className={cn(
                            'mr-1 min-w-0 shrink truncate font-mono text-[11px]',
                            visibleKeyIds.has(row.key.id)
                              ? 'break-all text-foreground'
                              : 'truncate text-muted-foreground',
                          )}
                        >
                          {visibleKeyIds.has(row.key.id)
                            ? revealedKeySecrets[row.key.id]
                            : keyLast4(row.key.secret)}
                        </code>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
                          aria-label={visibleKeyIds.has(row.key.id)
                            ? t('Hide full key', '隐藏完整 Key')
                            : t('Show full key', '显示完整 Key')}
                          title={visibleKeyIds.has(row.key.id)
                            ? t('Hide full key', '隐藏完整 Key')
                            : t('Show full key', '显示完整 Key')}
                          onClick={() => void toggleKeyVisibility(row.key.id)}
                        >
                          {visibleKeyIds.has(row.key.id) ? <EyeOff /> : <Eye />}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
                          aria-label={copiedKeyId === row.key.id
                            ? t('Copied', '已复制')
                            : t('Copy full key', '复制完整 Key')}
                          title={copiedKeyId === row.key.id
                            ? t('Copied', '已复制')
                            : t('Copy full key', '复制完整 Key')}
                          onClick={() => void copyKeySecret(row.key.id)}
                        >
                          {copiedKeyId === row.key.id
                            ? <Check className="text-emerald-600" />
                            : <Copy />}
                        </Button>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={cn(
                          'inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                          row.key.status === 'active' && 'border-emerald-300/70 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300',
                          row.key.status === 'paused' && 'border-amber-300/70 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300',
                          row.key.status === 'revoked' && 'border-border bg-muted/50 text-muted-foreground',
                        )}
                      >
                        {row.key.status === 'active'
                          ? t('Active', '已启用')
                          : row.key.status === 'paused'
                            ? t('Paused', '已停用')
                            : t('Revoked', '已撤销')}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs leading-tight text-muted-foreground">
                      {row.key.lastUsedAt
                        ? formatKeyDate(row.key.lastUsedAt, lang, true)
                        : t('Never used', '尚未调用')}
                    </td>
                    <td className="px-3 py-3 text-right text-xs tabular-nums">
                      {row.usage.calls.toLocaleString('en-US')} {tx('calls')}
                    </td>
                    <td className="px-3 py-3 text-right text-xs font-medium tabular-nums">
                      {row.usage.totalPoints.toLocaleString('en-US')} {tx('pts')}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="whitespace-nowrap px-2.5"
                        onClick={() => setDetailsKeyId(row.key.id)}
                      >
                        <Eye />
                        {t('View details', '查看明细')}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <KernelUsageDetailsModal
        open={detailsRow !== null}
        keyName={detailsRow?.key.name ?? ''}
        usage={detailsRow?.usage ?? null}
        onClose={() => setDetailsKeyId(null)}
      />
    </div>
  );
}

/**
 * Right-aligned sortable column header. Renders as a tiny inline button
 * so users can tell at-a-glance which column drives the sort and in
 * which direction. Inactive columns show the neutral up-down glyph;
 * the active column shows a single arrow matching the current dir.
 */
function SortHeader({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: 'asc' | 'desc';
  onClick: () => void;
}) {
  const Icon = !active ? ArrowUpDown : dir === 'desc' ? ArrowDown : ArrowUp;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-end gap-1 ml-auto -mr-1 px-1 h-5 rounded transition-colors',
        active
          ? 'text-foreground hover:bg-muted/50'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/40',
      )}
    >
      <span>{label}</span>
      <Icon
        className={cn(
          'h-3 w-3 transition-opacity',
          active ? 'opacity-100' : 'opacity-50',
        )}
      />
    </button>
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
  unit,
  sub,
  tone,
}: {
  label: string;
  value: string;
  unit?: string;
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
          'mt-1 flex items-baseline gap-1 text-lg font-semibold tabular-nums',
          tone === 'emerald' && 'text-emerald-600 dark:text-emerald-400',
        )}
      >
        <span>{value}</span>
        {unit ? (
          <span className="text-xs font-medium text-muted-foreground">{unit}</span>
        ) : null}
      </div>
      {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

function formatKeyDate(value: string, lang: DevEnLang, includeTime: boolean): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date);
}

/**
 * CSV export — reflects current filter state. Emits a header row + one row
 * per usage point, with key metadata joined in for readability. We
 * RFC 4180-escape every cell (double any quotes, wrap anything with comma /
 * newline / quote in quotes) to avoid Excel corruption.
 */
function exportUsageCsv(input: {
  rows: UsagePoint[];
  keys: ApiKey[];
  period: Period;
  keyFilter: string;
}) {
  const { rows, keys, period, keyFilter } = input;
  const keyById = new Map(keys.map((k) => [k.id, k]));

  // Long format: one row per day × key × CoreType (dynamic taxonomy), plus a
  // "(total)" row per day × key carrying the aggregate triple.
  const header = [
    'date',
    'key_id',
    'key_name',
    'key_masked',
    'core_type',
    'display_name',
    'calls',
    'events',
    'evaluation_points',
    'required_points',
    'uncovered_points',
  ];

  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  const lines: string[] = [header.join(',')];
  for (const r of sorted) {
    const key = keyById.get(r.keyId);
    const evaluationUsage = toEvaluationUsage(r);
    const keyCells = [r.date, r.keyId, key?.name ?? '', key?.maskedSecret ?? ''];
    lines.push(
      [
        ...keyCells,
        '(total)',
        '(total)',
        String(evaluationUsage.calls),
        String(evaluationUsage.events),
        String(evaluationUsage.totalPoints),
        String(evaluationUsage.requiredPoints),
        String(evaluationUsage.uncoveredPoints),
      ]
        .map(csvEscape)
        .join(','),
    );
    for (const ct of evaluationUsage.coreTypes) {
      lines.push(
        [
          ...keyCells,
          ct.coreType,
          ct.displayName,
          String(ct.calls),
          String(ct.events),
          String(ct.evaluationPoints),
          String(ct.requiredPoints),
          String(ct.uncoveredPoints),
        ]
          .map(csvEscape)
          .join(','),
      );
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const scope = [
    `period-${period}d`,
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
