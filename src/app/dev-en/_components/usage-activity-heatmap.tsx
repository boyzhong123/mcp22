'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { useLang } from '../_lib/use-lang';

export type UsageHeatmapDay = {
  date: string;
  value: number;
};

type HeatmapCell = {
  date: string;
  value: number;
  /** True when this calendar day falls inside the selected period window. */
  inRange: boolean;
};

const WEEKDAY_LABELS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAY_LABELS_ZH = ['日', '一', '二', '三', '四', '五', '六'];

function formatDateShort(date: string, lang: 'en' | 'zh') {
  const d = new Date(`${date}T00:00:00Z`);
  return new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(d);
}

/**
 * GitHub-style calendar: each cell = one calendar day in the selected window.
 * Rows = Sun–Sat; columns = weeks. Only days inside `days` are rendered — no
 * padded cells before/after the filter range.
 */
function buildHeatmapGrid(days: UsageHeatmapDay[]) {
  if (days.length === 0) {
    return { grid: [] as (HeatmapCell | null)[][], weekCount: 0, startSunday: null as Date | null };
  }

  const parse = (s: string) => new Date(`${s}T00:00:00Z`);
  const first = parse(days[0].date);
  const last = parse(days[days.length - 1].date);

  const startSunday = new Date(first);
  startSunday.setUTCDate(first.getUTCDate() - first.getUTCDay());

  const endSaturday = new Date(last);
  endSaturday.setUTCDate(last.getUTCDate() + (6 - last.getUTCDay()));

  const weekCount =
    Math.floor((endSaturday.getTime() - startSunday.getTime()) / (7 * 86400000)) + 1;

  const grid: (HeatmapCell | null)[][] = Array.from({ length: 7 }, () =>
    Array.from({ length: weekCount }, () => null),
  );

  for (const day of days) {
    const d = parse(day.date);
    const col = Math.floor((d.getTime() - startSunday.getTime()) / (7 * 86400000));
    const row = d.getUTCDay();
    grid[row][col] = {
      date: day.date,
      value: day.value,
      inRange: true,
    };
  }

  return { grid, weekCount, startSunday };
}

function heatLevel(value: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (value <= 0 || max <= 0) return 0;
  const r = value / max;
  if (r <= 0.25) return 1;
  if (r <= 0.5) return 2;
  if (r <= 0.75) return 3;
  return 4;
}

const CELL_LEVEL_CLASS: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: 'bg-muted',
  1: 'bg-blue-200/80 dark:bg-blue-900/35',
  2: 'bg-blue-400/75 dark:bg-blue-700/55',
  3: 'bg-blue-500 dark:bg-blue-600',
  4: 'bg-blue-700 dark:bg-blue-500',
};

/** Linear daily strip for short windows (≤14d) — one row per day, left = oldest. */
function DailyStripHeatmap({
  days,
  formatValue,
  metricLabel,
  maxValue,
}: {
  days: UsageHeatmapDay[];
  formatValue: (v: number) => string;
  metricLabel: string;
  maxValue: number;
}) {
  const { t, lang } = useLang();
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const hoverDay = days.find((d) => d.date === hoverDate);

  const cellSize = 14;
  const cellGap = 4;
  const step = cellSize + cellGap;

  return (
    <div className="relative">
      <p className="text-[11px] text-muted-foreground mb-3">
        {t(
          'Each square is one day in the selected range (left → right, oldest to newest).',
          '每个方块代表所选范围内的一天（从左到右：由早到晚）。',
        )}
      </p>
      <div className="overflow-x-auto pb-1" onMouseLeave={() => setHoverDate(null)}>
        <div
          className="flex items-end"
          style={{ gap: cellGap, minWidth: days.length * step - cellGap }}
        >
          {days.map((day) => {
            const level = heatLevel(day.value, maxValue);
            const isHover = hoverDate === day.date;
            return (
              <div key={day.date} className="flex flex-col items-center" style={{ width: cellSize }}>
                <button
                  type="button"
                  aria-label={`${day.date}: ${formatValue(day.value)}`}
                  className={cn(
                    'rounded-[3px] p-0 border-0 shrink-0 transition-[transform,box-shadow]',
                    CELL_LEVEL_CLASS[level],
                    'cursor-pointer hover:ring-2 hover:ring-ring/40',
                    isHover && 'ring-2 ring-foreground/30 scale-110 z-10',
                  )}
                  style={{ width: cellSize, height: cellSize }}
                  onMouseEnter={() => setHoverDate(day.date)}
                  onFocus={() => setHoverDate(day.date)}
                  onBlur={() => setHoverDate(null)}
                />
                <span className="mt-1.5 text-[9px] text-muted-foreground tabular-nums leading-none">
                  {day.date.slice(8)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      {hoverDay && (
        <div
          className="pointer-events-none absolute left-4 top-8 z-20 bg-popover text-popover-foreground border border-border shadow-lg rounded-lg px-3 py-2 text-[11px] whitespace-nowrap"
          role="tooltip"
        >
          {lang === 'zh' ? (
            <>
              {formatDateShort(hoverDay.date, lang)} {metricLabel}{' '}
              <span className="font-semibold tabular-nums">{formatValue(hoverDay.value)}</span>
            </>
          ) : (
            <>
              <span className="font-semibold tabular-nums">{formatValue(hoverDay.value)}</span>{' '}
              {metricLabel} on {formatDateShort(hoverDay.date, lang)}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function UsageActivityHeatmap({
  days,
  formatValue,
  metricLabel,
  layout = 'auto',
}: {
  days: UsageHeatmapDay[];
  formatValue: (v: number) => string;
  /** e.g. "calls" / "spend" — woven into the tooltip sentence. */
  metricLabel: string;
  /** `strip` = one square per day in a row; `calendar` = weekday grid; `auto` picks by length. */
  layout?: 'auto' | 'strip' | 'calendar';
}) {
  const { t, lang } = useLang();
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  const maxValue = useMemo(() => Math.max(0, ...days.map((d) => d.value)), [days]);

  const useStrip =
    layout === 'strip' || (layout === 'auto' && days.length > 0 && days.length <= 14);

  const { grid, weekCount, startSunday } = useMemo(
    () => (useStrip ? { grid: [], weekCount: 0, startSunday: null } : buildHeatmapGrid(days)),
    [days, useStrip],
  );

  const monthLabels = useMemo(() => {
    if (!startSunday || weekCount === 0) return [];
    const labels: { col: number; label: string }[] = [];
    let lastMonth = -1;
    const fmt = new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en-US', {
      month: 'short',
      timeZone: 'UTC',
    });
    for (let col = 0; col < weekCount; col++) {
      const weekStart = new Date(startSunday.getTime() + col * 7 * 86400000);
      const m = weekStart.getUTCMonth();
      if (m !== lastMonth) {
        labels.push({ col, label: fmt.format(weekStart) });
        lastMonth = m;
      }
    }
    return labels;
  }, [startSunday, weekCount, lang]);

  const weekdayLabels = lang === 'zh' ? WEEKDAY_LABELS_ZH : WEEKDAY_LABELS_EN;
  const hoverCell = hoverDate
    ? grid.flat().find((c) => c?.date === hoverDate && c.inRange)
    : null;

  const cellSize = 11;
  const cellGap = 3;
  const step = cellSize + cellGap;
  const labelW = 28;
  const gridW = weekCount * step - cellGap;
  const gridH = 7 * step - cellGap;

  if (days.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        {t('No usage in this window.', '此时间范围内暂无用量。')}
      </div>
    );
  }

  if (useStrip) {
    return (
      <DailyStripHeatmap
        days={days}
        formatValue={formatValue}
        metricLabel={metricLabel}
        maxValue={maxValue}
      />
    );
  }

  return (
    <div className="relative">
      <p className="text-[11px] text-muted-foreground mb-3">
        {t(
          'Each square is one day. Rows are weekdays (Sun–Sat); columns are weeks.',
          '每个方块代表一天。纵轴为星期（日–六），横轴为周。',
        )}
      </p>
      <div className="overflow-x-auto pb-1">
        <div className="inline-flex min-w-0">
          {/* Weekday labels (Mon / Wed / Fri rows) */}
          <div
            className="shrink-0 flex flex-col text-[10px] text-muted-foreground pr-1.5"
            style={{ width: labelW, height: gridH, paddingTop: step }}
          >
            {[1, 3, 5].map((row) => (
              <div
                key={row}
                className="flex items-center justify-end leading-none"
                style={{ height: step * 2 - cellGap }}
              >
                {weekdayLabels[row]}
              </div>
            ))}
          </div>

          <div>
            <div
              className="grid"
              style={{
                gridTemplateRows: `repeat(7, ${cellSize}px)`,
                gridTemplateColumns: `repeat(${weekCount}, ${cellSize}px)`,
                gap: `${cellGap}px`,
                width: gridW,
                height: gridH,
              }}
              onMouseLeave={() => setHoverDate(null)}
            >
              {grid.map((row, rowIdx) =>
                row.map((cell, colIdx) => {
                  if (!cell) {
                    return (
                      <span
                        key={`empty-${rowIdx}-${colIdx}`}
                        aria-hidden
                        className="rounded-[2px]"
                        style={{ width: cellSize, height: cellSize }}
                      />
                    );
                  }
                  const level = heatLevel(cell.value, maxValue);
                  const isHover = hoverDate === cell.date;
                  return (
                    <button
                      key={cell.date}
                      type="button"
                      aria-label={`${cell.date}: ${formatValue(cell.value)}`}
                      className={cn(
                        'rounded-[2px] p-0 border-0 transition-[transform,box-shadow]',
                        CELL_LEVEL_CLASS[level],
                        'cursor-pointer hover:ring-2 hover:ring-ring/40',
                        isHover && 'ring-2 ring-foreground/30 scale-110 z-10',
                      )}
                      style={{ width: cellSize, height: cellSize }}
                      onMouseEnter={() => setHoverDate(cell.date)}
                      onFocus={() => setHoverDate(cell.date)}
                      onBlur={() => setHoverDate(null)}
                    />
                  );
                }),
              )}
            </div>

            {/* Month axis */}
            <div
              className="relative mt-2 text-[10px] text-muted-foreground"
              style={{ width: gridW, height: 14 }}
            >
              {monthLabels.map(({ col, label }) => (
                <span
                  key={`${col}-${label}`}
                  className="absolute whitespace-nowrap"
                  style={{ left: col * step }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Intensity legend */}
      <div className="mt-4 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
        <span>{t('Less', '少')}</span>
        {([0, 1, 2, 3, 4] as const).map((lvl) => (
          <span
            key={lvl}
            className={cn('rounded-[2px]', CELL_LEVEL_CLASS[lvl])}
            style={{ width: cellSize, height: cellSize }}
          />
        ))}
        <span>{t('More', '多')}</span>
      </div>

      {hoverCell && (
        <div
          className="pointer-events-none absolute left-4 top-2 z-20 bg-popover text-popover-foreground border border-border shadow-lg rounded-lg px-3 py-2 text-[11px] whitespace-nowrap"
          role="tooltip"
        >
          {lang === 'zh' ? (
            <>
              {formatDateShort(hoverCell.date, lang)}{' '}
              {metricLabel}{' '}
              <span className="font-semibold tabular-nums">
                {formatValue(hoverCell.value)}
              </span>
            </>
          ) : (
            <>
              <span className="font-semibold tabular-nums">
                {formatValue(hoverCell.value)}
              </span>{' '}
              {metricLabel} on {formatDateShort(hoverCell.date, lang)}
            </>
          )}
        </div>
      )}
    </div>
  );
}
