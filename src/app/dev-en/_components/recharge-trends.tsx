'use client';

import { useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, BarChart3, Minus, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  formatCents,
  getTransactions,
  type Transaction,
} from '../_lib/mock-store';
import { useMockStore } from '../_lib/use-mock-store';
import { useLang } from '../_lib/use-lang';

type Granularity = 'day' | 'month' | 'year' | 'custom';

interface Bucket {
  /** Stable key, e.g. "2026-06-01" / "2026-06" / "2026". */
  key: string;
  /** Short axis/tooltip label. */
  label: string;
  amountCents: number;
  count: number;
}

const DAY_MS = 86400000;

/** "YYYY-MM-DD" in local time (matches how the date <input> reports values). */
function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Evaluation-point top-up trends. Buckets succeeded top-ups by day / month /
 * year — or by a user-picked custom date range (auto day/month/year depending
 * on span) — and renders a single-series bar chart plus period KPIs.
 *
 * Self-contained: reads transactions from the mock store, so it can be dropped
 * onto any billing surface without prop wiring.
 */
export function RechargeTrends() {
  const { t, tx } = useLang();
  const transactions = useMockStore(getTransactions, [] as Transaction[]);

  const [granularity, setGranularity] = useState<Granularity>('month');
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  // Only succeeded point top-ups count as "recharge". Card-added events and
  // failed/pending charges never credited evaluation points.
  const topUps = useMemo(
    () =>
      transactions
        .filter((t) => t.kind === 'credit-topup' && t.status === 'succeeded')
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [transactions],
  );

  // Default custom range = earliest top-up → today. Recomputed lazily so the
  // inputs land on a sensible window the moment "Custom" is first opened.
  const dataStart = topUps[0] ? ymd(new Date(topUps[0].createdAt)) : ymd(new Date());
  const today = ymd(new Date());
  const [customFrom, setCustomFrom] = useState(dataStart);
  const [customTo, setCustomTo] = useState(today);

  const { buckets, effectiveGranularity } = useMemo(
    () => buildBuckets(topUps, granularity, customFrom, customTo),
    [topUps, granularity, customFrom, customTo],
  );

  const totalCents = buckets.reduce((a, b) => a + b.amountCents, 0);
  const totalCount = buckets.reduce((a, b) => a + b.count, 0);
  const avgCents = totalCount > 0 ? Math.round(totalCents / totalCount) : 0;
  const peak = buckets.reduce<Bucket | null>(
    (acc, b) => (acc && acc.amountCents >= b.amountCents ? acc : b),
    null,
  );

  // Momentum: compare the latest non-empty bucket to the one before it. Gives
  // the "is recharging trending up?" read without a second chart.
  const filled = buckets.filter((b) => b.amountCents > 0);
  const last = filled[filled.length - 1];
  const prev = filled[filled.length - 2];
  const deltaPct =
    last && prev && prev.amountCents > 0
      ? Math.round(((last.amountCents - prev.amountCents) / prev.amountCents) * 100)
      : null;

  const granLabel = (g: Granularity) =>
    g === 'day'
      ? t('Day', '日')
      : g === 'month'
        ? t('Month', '月')
        : g === 'year'
          ? t('Year', '年')
          : t('Custom', '自定义');

  return (
    <div className="rounded-2xl border border-border bg-background overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            {t('Recharge trend', '充值趋势')}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t(
              'Succeeded evaluation-point top-ups grouped by period.',
              '按周期统计已成功的评测积分充值。',
            )}
          </p>
        </div>
        {/* Granularity switch */}
        <div className="inline-flex items-center rounded-lg border border-border bg-muted/30 p-0.5 text-[11px] font-medium">
          {(['day', 'month', 'year', 'custom'] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGranularity(g)}
              className={cn(
                'h-7 px-2.5 rounded-md transition-colors',
                granularity === g
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {granLabel(g)}
            </button>
          ))}
        </div>
      </div>

      {/* Custom range pickers */}
      {granularity === 'custom' && (
        <div className="px-5 py-3 border-b border-border/60 flex flex-wrap items-center gap-3 bg-muted/10">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            {t('From', '起')}
            <input
              type="date"
              value={customFrom}
              max={customTo}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="h-8 px-2 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring/20"
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            {t('To', '止')}
            <input
              type="date"
              value={customTo}
              min={customFrom}
              max={today}
              onChange={(e) => setCustomTo(e.target.value)}
              className="h-8 px-2 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring/20"
            />
          </label>
          <span className="text-[11px] text-muted-foreground">
            {t(
              `Bucketed by ${granLabel(effectiveGranularity).toLowerCase()}`,
              `按${granLabel(effectiveGranularity)}聚合`,
            )}
          </span>
        </div>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-border border-b border-border">
        <Kpi label={t('Total recharged', '充值总额')} value={formatCents(totalCents)} />
        <Kpi
          label={t('Top-ups', '充值笔数')}
          value={totalCount.toLocaleString('en-US')}
        />
        <Kpi label={t('Avg / top-up', '笔均')} value={formatCents(avgCents)} />
        <Kpi
          label={t('Latest vs prior', '环比')}
          value={
            deltaPct === null ? '—' : `${deltaPct >= 0 ? '+' : ''}${deltaPct}%`
          }
          delta={deltaPct}
        />
      </div>

      {/* Chart */}
      <div className="p-5">
        {totalCount === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
            <BarChart3 className="h-6 w-6 opacity-40" />
            {t(
              'No recharges in this period.',
              '该周期内暂无充值记录。',
            )}
          </div>
        ) : (
          <RechargeBars
            buckets={buckets}
            hoverIdx={hoverIdx}
            setHoverIdx={setHoverIdx}
            peakKey={peak?.key}
            countLabel={t('top-ups', '笔')}
          />
        )}
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta?: number | null;
}) {
  const DeltaIcon =
    delta == null ? null : delta > 0 ? ArrowUpRight : delta < 0 ? ArrowDownRight : Minus;
  return (
    <div className="px-5 py-3.5">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          'mt-1 text-lg font-semibold tabular-nums flex items-center gap-1',
          delta != null && delta > 0 && 'text-emerald-600 dark:text-emerald-400',
          delta != null && delta < 0 && 'text-destructive',
        )}
      >
        {DeltaIcon && <DeltaIcon className="h-4 w-4" />}
        {value}
      </div>
    </div>
  );
}

function RechargeBars({
  buckets,
  hoverIdx,
  setHoverIdx,
  peakKey,
  countLabel,
}: {
  buckets: Bucket[];
  hoverIdx: number | null;
  setHoverIdx: (i: number | null) => void;
  peakKey?: string;
  countLabel: string;
}) {
  const chartWidth = 720;
  const chartHeight = 220;
  const pad = { top: 10, right: 20, bottom: 24, left: 50 };
  const innerW = chartWidth - pad.left - pad.right;
  const innerH = chartHeight - pad.top - pad.bottom;
  const slot = innerW / Math.max(1, buckets.length);
  const barW = Math.max(3, Math.min(48, slot * 0.62));
  const yMax = Math.max(1, ...buckets.map((b) => b.amountCents));

  // Show at most ~7 axis ticks so dense day views stay legible.
  const labelStep = Math.max(1, Math.ceil(buckets.length / 7));

  return (
    <div className="relative">
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full min-w-[600px]"
          onMouseLeave={() => setHoverIdx(null)}
        >
          {[0, 0.25, 0.5, 0.75, 1].map((tk) => (
            <g key={tk}>
              <line
                x1={pad.left}
                x2={chartWidth - pad.right}
                y1={pad.top + innerH - innerH * tk}
                y2={pad.top + innerH - innerH * tk}
                stroke="currentColor"
                strokeOpacity={0.08}
              />
              <text
                x={pad.left - 6}
                y={pad.top + innerH - innerH * tk}
                fontSize={9}
                textAnchor="end"
                dominantBaseline="middle"
                fill="currentColor"
                fillOpacity={0.5}
              >
                {formatCents(Math.round(yMax * tk))}
              </text>
            </g>
          ))}

          {buckets.map((b, i) => {
            const h = (b.amountCents / yMax) * innerH;
            const x = pad.left + i * slot + (slot - barW) / 2;
            const y = pad.top + innerH - h;
            const isPeak = b.key === peakKey && b.amountCents > 0;
            return (
              <g key={b.key} onMouseEnter={() => setHoverIdx(i)}>
                {b.amountCents > 0 && (
                  <rect
                    x={x}
                    y={y}
                    width={barW}
                    height={Math.max(h, 0.5)}
                    rx={2}
                    fill={isPeak ? '#059669' : '#10b981'}
                    opacity={hoverIdx === null || hoverIdx === i ? 0.95 : 0.5}
                  />
                )}
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

          {buckets.map((b, i) =>
            i % labelStep === 0 ? (
              <text
                key={b.key}
                x={pad.left + i * slot + slot / 2}
                y={chartHeight - 6}
                fontSize={9}
                textAnchor="middle"
                fill="currentColor"
                fillOpacity={0.5}
              >
                {b.label}
              </text>
            ) : null,
          )}
        </svg>
      </div>

      {hoverIdx !== null && buckets[hoverIdx] && (
        (() => {
          const b = buckets[hoverIdx];
          const centerPctX = ((pad.left + hoverIdx * slot + slot / 2) / chartWidth) * 100;
          const barTopPctY =
            ((pad.top + innerH - (b.amountCents / yMax) * innerH) / chartHeight) * 100;
          const flipBelow = barTopPctY < 35;
          return (
            <div
              className="pointer-events-none absolute bg-popover text-popover-foreground border border-border shadow-lg rounded-lg px-3 py-2 text-[11px] min-w-[140px] z-10"
              style={{
                left: `${centerPctX}%`,
                top: flipBelow ? `calc(${barTopPctY}% + 12px)` : `${barTopPctY}%`,
                transform: flipBelow
                  ? 'translate(-50%, 0)'
                  : 'translate(-50%, calc(-100% - 8px))',
              }}
            >
              <div className="font-semibold mb-1">{b.label}</div>
              <div className="flex items-center justify-between gap-3 py-0.5">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">
                  +{formatCents(b.amountCents)}
                </span>
                <span className="text-muted-foreground tabular-nums">
                  {b.count} {countLabel}
                </span>
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
}

/**
 * Bucket succeeded top-ups for the chosen granularity. For "custom" we clamp
 * to [from, to] and auto-pick day/month/year so the bar count stays readable.
 * Buckets are contiguous (zero-filled) so gaps in recharge activity are
 * visible rather than collapsed away.
 */
function buildBuckets(
  topUps: Transaction[],
  granularity: Granularity,
  customFrom: string,
  customTo: string,
): { buckets: Bucket[]; effectiveGranularity: Exclude<Granularity, 'custom'> } {
  let unit: Exclude<Granularity, 'custom'>;
  let rangeStart: Date;
  let rangeEnd: Date;

  if (granularity === 'custom') {
    rangeStart = new Date(`${customFrom}T00:00:00`);
    rangeEnd = new Date(`${customTo}T23:59:59`);
    const spanDays = (rangeEnd.getTime() - rangeStart.getTime()) / DAY_MS;
    unit = spanDays <= 62 ? 'day' : spanDays <= 731 ? 'month' : 'year';
  } else {
    unit = granularity;
    // Span the whole dataset for day/month/year views.
    rangeStart = topUps[0] ? new Date(topUps[0].createdAt) : new Date();
    rangeEnd = new Date();
  }

  const inRange = topUps.filter((t) => {
    const ts = new Date(t.createdAt).getTime();
    return ts >= rangeStart.getTime() && ts <= rangeEnd.getTime();
  });

  // Aggregate into a key→bucket map first.
  const map = new Map<string, Bucket>();
  const keyOf = (d: Date) =>
    unit === 'day' ? ymd(d) : unit === 'month' ? ymd(d).slice(0, 7) : String(d.getFullYear());
  const labelOf = (key: string) =>
    unit === 'day' ? key.slice(5) : unit === 'month' ? key : key;

  for (const t of inRange) {
    const d = new Date(t.createdAt);
    const key = keyOf(d);
    const b = map.get(key) ?? { key, label: labelOf(key), amountCents: 0, count: 0 };
    b.amountCents += t.amountCents;
    b.count += 1;
    map.set(key, b);
  }

  // Build a contiguous, zero-filled axis from rangeStart → rangeEnd.
  const buckets: Bucket[] = [];
  const cursor = new Date(rangeStart);
  cursor.setHours(0, 0, 0, 0);
  // Guard against runaway loops on absurd ranges.
  let guard = 0;
  while (cursor.getTime() <= rangeEnd.getTime() && guard < 4000) {
    guard += 1;
    const key = keyOf(cursor);
    if (!buckets.some((b) => b.key === key)) {
      buckets.push(map.get(key) ?? { key, label: labelOf(key), amountCents: 0, count: 0 });
    }
    if (unit === 'day') cursor.setDate(cursor.getDate() + 1);
    else if (unit === 'month') cursor.setMonth(cursor.getMonth() + 1);
    else cursor.setFullYear(cursor.getFullYear() + 1);
  }

  return { buckets, effectiveGranularity: unit };
}
