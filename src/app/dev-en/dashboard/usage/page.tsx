'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BarChart3,
  ChevronDown,
  Download,
  LayoutGrid,
} from 'lucide-react';
import { UsageActivityHeatmap } from '../../_components/usage-activity-heatmap';
import { cn } from '@/lib/utils';
import {
  getUsage,
  keyLast4,
  listKeys,
  type ApiKey,
  type UsagePoint,
} from '../../_lib/mock-store';
import { useMockStore } from '../../_lib/use-mock-store';
import { useLang } from '../../_lib/use-lang';
import { toEvaluationUsage } from '../../_lib/evaluation-usage';

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
      totalSavingsMills: number;
    }[] = [];
    for (let i = period - 1; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86400000);
      const date = d.toISOString().slice(0, 10);
      const perKey: Record<string, number> = {};
      const perKeyCost: Record<string, number> = {};
      let totalCalls = 0;
      let totalCostMills = 0;
      let totalSavingsMills = 0;
      for (const p of filteredUsage.filter((x) => x.date === date)) {
        const evaluationUsage = toEvaluationUsage(p);
        perKey[p.keyId] = (perKey[p.keyId] ?? 0) + evaluationUsage.calls;
        perKeyCost[p.keyId] = (perKeyCost[p.keyId] ?? 0) + evaluationUsage.totalPoints;
        totalCalls += evaluationUsage.calls;
        totalCostMills += evaluationUsage.totalPoints;
        totalSavingsMills += p.savingsMills;
      }
      days.push({ date, perKey, perKeyCost, totalCalls, totalCostMills, totalSavingsMills });
    }
    return days;
  }, [filteredUsage, period]);

  const kpiTotalCalls = stackedData.reduce((a, d) => a + d.totalCalls, 0);
  const kpiTotalCost = stackedData.reduce((a, d) => a + d.totalCostMills, 0);
  const kpiTotalSavings = stackedData.reduce((a, d) => a + d.totalSavingsMills, 0);
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
    isCostMetric ? `${Math.round(v).toLocaleString('en-US')} pts` : Math.round(v).toLocaleString('en-US');
  const formatTooltipValue = (v: number) =>
    isCostMetric ? `${Math.round(v).toLocaleString('en-US')} pts` : v.toLocaleString('en-US');

  const perKeyBreakdown = useMemo(() => {
    const map = new Map<string, { calls: number; points: number; wordCalls: number; paragraphCalls: number; wordPoints: number; paragraphPoints: number }>();
    for (const p of filteredUsage) {
      const evaluationUsage = toEvaluationUsage(p);
      const d = map.get(p.keyId) ?? { calls: 0, points: 0, wordCalls: 0, paragraphCalls: 0, wordPoints: 0, paragraphPoints: 0 };
      d.calls += evaluationUsage.calls;
      d.points += evaluationUsage.totalPoints;
      d.wordCalls += evaluationUsage.wordSentenceCalls;
      d.paragraphCalls += evaluationUsage.paragraphCalls;
      d.wordPoints += evaluationUsage.wordSentencePoints;
      d.paragraphPoints += evaluationUsage.paragraphPoints;
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
      .sort((a, b) => {
        const av = breakdownSort.column === 'calls' ? a.calls : a.points;
        const bv = breakdownSort.column === 'calls' ? b.calls : b.points;
        return breakdownSort.dir === 'desc' ? bv - av : av - bv;
      });
  }, [filteredUsage, keys, breakdownSort]);

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

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label={tx('Total calls')} value={kpiTotalCalls.toLocaleString('en-US')} />
        <Kpi label={t('Points consumed', '消耗积分')} value={kpiTotalCost.toLocaleString('en-US')} />
        <Kpi label={tx('Avg / day')} value={kpiAvgPerDay.toLocaleString('en-US')} />
        <Kpi
          label={tx('Peak day')}
          value={peakDay?.totalCalls.toLocaleString('en-US') ?? '0'}
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
                            ? d.totalCalls.toLocaleString('en-US')
                            : `${d.totalCostMills.toLocaleString('en-US')} pts`}
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
            {t('Calls and evaluation points per key within the current filter.', '当前筛选范围内，按 Key 展示调用次数与评测积分拆分。')}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="text-left px-5 py-2.5 font-semibold">{tx('Name')}</th>
                <th className="text-left px-5 py-2.5 font-semibold">{tx('Key')}</th>
                <th className="text-right px-5 py-2.5 font-semibold">
                  <SortHeader
                    label={tx('Calls')}
                    active={breakdownSort.column === 'calls'}
                    dir={breakdownSort.dir}
                    onClick={() => toggleBreakdownSort('calls')}
                  />
                </th>
                <th className="text-right px-5 py-2.5 font-semibold">
                  <SortHeader
                    label={t('Points', '积分')}
                    active={breakdownSort.column === 'points'}
                    dir={breakdownSort.dir}
                    onClick={() => toggleBreakdownSort('points')}
                  />
                </th>
                <th className="text-right px-5 py-2.5 font-semibold">{t('Word / sentence', '字词句')}</th>
                <th className="text-right px-5 py-2.5 font-semibold">{t('Paragraph', '段落')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {perKeyBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-muted-foreground">
                    {tx('No usage in this window.')}
                  </td>
                </tr>
              ) : (
                perKeyBreakdown.map((row) => (
                  <tr key={row.key!.id}>
                    <td className="px-5 py-3 text-sm font-medium">{row.key!.name}</td>
                    <td className="px-5 py-3 font-mono text-[11px] text-muted-foreground">
                      {keyLast4(row.key!.secret)}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      {row.calls.toLocaleString('en-US')}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums font-medium">{row.points.toLocaleString('en-US')} pts</td>
                    <td className="px-5 py-3 text-right tabular-nums text-xs">
                      {row.wordCalls.toLocaleString('en-US')} / {row.wordPoints.toLocaleString('en-US')} pts
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-xs">
                      {row.paragraphCalls.toLocaleString('en-US')} / {row.paragraphPoints.toLocaleString('en-US')} pts
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
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

  const header = [
    'date',
    'key_id',
    'key_name',
    'key_masked',
    'calls',
    'word_sentence_calls',
    'paragraph_calls',
    'word_sentence_points',
    'paragraph_points',
    'evaluation_points',
  ];

  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  const lines: string[] = [header.join(',')];
  for (const r of sorted) {
    const key = keyById.get(r.keyId);
    const evaluationUsage = toEvaluationUsage(r);
    lines.push(
      [
        r.date,
        r.keyId,
        key?.name ?? '',
        key?.maskedSecret ?? '',
        String(evaluationUsage.calls),
        String(evaluationUsage.wordSentenceCalls),
        String(evaluationUsage.paragraphCalls),
        String(evaluationUsage.wordSentencePoints),
        String(evaluationUsage.paragraphPoints),
        String(evaluationUsage.totalPoints),
      ]
        .map(csvEscape)
        .join(','),
    );
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
