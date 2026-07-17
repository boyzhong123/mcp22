'use client';

import { ChevronDown, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  describeError,
  usage as usageApi,
  type UsageEvent,
} from '../_lib/api';
import { useLang } from '../_lib/use-lang';

const PAGE_SIZE = 20;

/**
 * Date range and key come from the page's filter bar — this table never owns
 * them, so the events shown always match the chart and the per-key table
 * above. Kernel is filtered here because it's the one axis the rest of the
 * page doesn't slice by. Callers remount on window change (see the `key` prop
 * at the call site), which resets paging.
 *
 * `embedded` drops the card shell and title for use inside a tabbed panel
 * that already supplies both.
 */
export function UsageEventsTable({
  from,
  to,
  keyId,
  coreTypeOptions,
  enabled,
  embedded = false,
}: {
  from: string;
  to: string;
  keyId?: number;
  coreTypeOptions: Array<{ coreType: string; displayName: string }>;
  enabled: boolean;
  embedded?: boolean;
}) {
  const { t, lang } = useLang();
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<UsageEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [filterCoreType, setFilterCoreType] = useState('all');

  const selectableCoreTypes = useMemo(() => {
    const options = new Map(coreTypeOptions.map((option) => [option.coreType, option]));
    for (const item of items) {
      if (!options.has(item.core_type)) {
        options.set(item.core_type, {
          coreType: item.core_type,
          displayName: item.core_type_display_name || item.core_type,
        });
      }
    }
    return [...options.values()].sort((a, b) =>
      a.displayName.localeCompare(b.displayName, lang === 'zh' ? 'zh-CN' : 'en-US'),
    );
  }, [coreTypeOptions, items, lang]);

  const beginFilterChange = () => {
    setPage(1);
    setItems([]);
    setTotal(0);
    setLoading(true);
    setError(null);
  };

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    // Events uses RFC3339 [from, to), while the page picker uses inclusive
    // UTC calendar dates. Convert here so the final selected day is included.
    usageApi.events({
      page,
      page_size: PAGE_SIZE,
      from: `${from}T00:00:00.000Z`,
      to: nextUtcDayStart(to),
      key_id: keyId,
      core_type: filterCoreType === 'all' ? undefined : filterCoreType,
    })
      .then((data) => {
        if (cancelled) return;
        setItems(data.items ?? []);
        setTotal(data.total ?? 0);
      })
      .catch((err) => {
        if (!cancelled) setError(describeError(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [enabled, from, to, keyId, filterCoreType, page, reloadToken]);

  if (!enabled) return null;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const refreshButton = (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={loading}
      onClick={() => {
        setLoading(true);
        setError(null);
        setReloadToken((value) => value + 1);
      }}
    >
      <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
      {t('Refresh', '刷新')}
    </Button>
  );

  const Shell = embedded ? 'div' : 'section';

  return (
    <Shell className={cn(!embedded && 'overflow-hidden rounded-2xl border border-border bg-background')}>
      {embedded ? null : (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 px-5 py-4">
          <div>
            <div className="text-sm font-semibold">{t('Point charge events', '逐请求扣分事件')}</div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t(
                'One row per recorded usage event, following the range and key selected above. Billing status is point coverage, not evaluation success or failure.',
                '每行是一条已记账用量事件，范围与 Key 跟随上方筛选；计费状态表示积分覆盖情况，不代表评测成功或失败。',
              )}
            </p>
          </div>
          {refreshButton}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-2 border-b border-border/60 bg-muted/10 px-5 py-3">
        <FilterField label={t('Kernel name', '内核名')} className="min-w-52 flex-[1.4] sm:max-w-80">
          <FilterSelect
            value={filterCoreType}
            onChange={(value) => {
              beginFilterChange();
              setFilterCoreType(value);
            }}
          >
            <option value="all">{t('All kernels', '全部内核')}</option>
            {selectableCoreTypes.map((option) => (
              <option key={option.coreType} value={option.coreType}>
                {option.displayName === option.coreType
                  ? option.coreType
                  : `${option.displayName} · ${option.coreType}`}
              </option>
            ))}
          </FilterSelect>
        </FilterField>
        {embedded ? <div className="ml-auto">{refreshButton}</div> : null}
      </div>

      {error ? (
        <div className="m-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs text-destructive">
          {error}
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[940px] text-sm">
          <thead className="bg-muted/30 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 text-left">{t('Time (UTC)', '时间（UTC）')}</th>
              <th className="px-4 py-2.5 text-left">{t('Key', 'Key')}</th>
              <th className="px-4 py-2.5 text-left">{t('Kernel name', '内核名')}</th>
              <th className="px-4 py-2.5 text-right">{t('Calls', '调用')}</th>
              <th className="px-4 py-2.5 text-right">{t('Points / request', '积分 / 次')}</th>
              <th className="px-4 py-2.5 text-right">{t('Charged / required', '实扣 / 应扣')}</th>
              <th className="px-4 py-2.5 text-left">{t('Rate', '费率')}</th>
              <th className="px-4 py-2.5 text-left">{t('Billing status', '计费状态')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/70">
            {loading && items.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">{t('Loading events…', '正在加载事件…')}</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">{t('No recorded events in this window.', '当前时间范围内没有记账事件。')}</td></tr>
            ) : items.map((event) => (
              <tr key={event.event_id}>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">{formatEventTime(event.occurred_at, lang)}</td>
                <td className="px-4 py-3"><div className="font-medium">{event.key_name}</div><div className="text-[10px] text-muted-foreground">ID {event.key_id}</div></td>
                <td className="px-4 py-3"><code className="font-mono text-[11px]">{event.core_type}</code><div className="mt-0.5 text-[10px] text-muted-foreground">{event.core_type_display_name}</div></td>
                <td className="px-4 py-3 text-right tabular-nums">{event.count.toLocaleString()}</td>
                <td className="px-4 py-3 text-right tabular-nums">{event.points_per_request.toLocaleString()}</td>
                <td className="px-4 py-3 text-right font-medium tabular-nums">{event.charged_points.toLocaleString()} / {event.required_points.toLocaleString()}</td>
                <td className="px-4 py-3"><span className="rounded-full border border-border bg-muted/30 px-2 py-0.5 text-[10px] font-semibold">{event.rate_source === 'configured' ? t('Configured', '已配置') : t('Default', '默认')}</span></td>
                <td className="px-4 py-3"><BillingStatus status={event.billing_status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-border/60 px-5 py-3 text-xs text-muted-foreground">
        <span>{t(`${total.toLocaleString()} events`, `共 ${total.toLocaleString()} 条事件`)}</span>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="icon-sm" disabled={page <= 1 || loading} onClick={() => { setLoading(true); setError(null); setPage((value) => Math.max(1, value - 1)); }} aria-label={t('Previous page', '上一页')}><ChevronLeft /></Button>
          <span className="min-w-16 text-center tabular-nums">{page} / {pageCount}</span>
          <Button type="button" variant="outline" size="icon-sm" disabled={page >= pageCount || loading} onClick={() => { setLoading(true); setError(null); setPage((value) => Math.min(pageCount, value + 1)); }} aria-label={t('Next page', '下一页')}><ChevronRight /></Button>
        </div>
      </div>
    </Shell>
  );
}

function FilterField({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn('grid gap-1', className)}>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function FilterSelect({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <span className="relative block">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full appearance-none rounded-lg border border-border bg-background pl-3 pr-8 text-xs font-medium focus:border-foreground/30 focus:outline-none focus:ring-2 focus:ring-ring/20"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
    </span>
  );
}

function BillingStatus({ status }: { status: UsageEvent['billing_status'] }) {
  const { t } = useLang();
  const label = status === 'fully_charged'
    ? t('Fully charged', '全额扣除')
    : status === 'partially_charged'
      ? t('Partially charged', '部分扣除')
      : t('Uncovered', '未覆盖');
  return (
    <span className={cn(
      'rounded-full border px-2 py-0.5 text-[10px] font-semibold',
      status === 'fully_charged' && 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300',
      status === 'partially_charged' && 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300',
      status === 'uncovered_after_check' && 'border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300',
    )}>{label}</span>
  );
}

function formatEventTime(value: string, lang: 'en' | 'zh') {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC',
  }).format(date);
}

function nextUtcDayStart(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return value;
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString();
}
