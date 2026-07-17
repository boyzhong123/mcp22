'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { EvaluationUsageBreakdown } from '../_lib/evaluation-usage';
import { kernelCategoryLabel } from '../_lib/kernel-category';
import { kernelLanguage } from '../_lib/kernel-language';
import { useEvaluationKernelDetails } from '../_lib/use-evaluation-kernel-details';
import { useLang } from '../_lib/use-lang';
import { ModalPortal } from './modal-portal';

interface KernelUsageDetailsModalProps {
  keyName: string;
  open: boolean;
  usage: EvaluationUsageBreakdown | null;
  onClose: () => void;
}

type SortColumn = 'category' | 'coreType' | 'language' | 'calls' | 'points';
type SortDirection = 'asc' | 'desc';

type KernelPresentation = {
  categoryEn: string;
  categoryZh: string;
  language: 'zh' | 'en' | '—';
};

function getKernelPresentation(
  categoryCode: string | null | undefined,
  categoryName: string | null | undefined,
  language: string | null | undefined,
): KernelPresentation {
  const categoryLabel = kernelCategoryLabel(categoryCode, categoryName);
  return {
    categoryEn: categoryLabel.en,
    categoryZh: categoryLabel.zh,
    language: kernelLanguage(language),
  };
}

export function KernelUsageDetailsModal({
  keyName,
  open,
  usage,
  onClose,
}: KernelUsageDetailsModalProps) {
  const { t } = useLang();
  const { catalog, load: loadKernelDetails } = useEvaluationKernelDetails();
  const titleId = useId();
  const descriptionId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn>('category');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const ratesByCoreType = new Map(catalog.coreTypeRates.map((rate) => [rate.coreType, rate]));
  const rows = (usage?.coreTypes ?? []).map((kernel) => {
    const rate = ratesByCoreType.get(kernel.coreType);
    return {
      ...kernel,
      presentation: getKernelPresentation(
        kernel.categoryCode?.trim() || rate?.categoryCode,
        kernel.categoryName?.trim() || kernel.category?.trim() || rate?.categoryName,
        kernel.language?.trim() || rate?.language,
      ),
    };
  });
  rows.sort((a, b) => {
    let comparison = 0;
    if (sortColumn === 'category') {
      comparison = a.presentation.categoryZh.localeCompare(b.presentation.categoryZh, 'zh-CN');
    } else if (sortColumn === 'coreType') {
      comparison = a.coreType.localeCompare(b.coreType, 'en');
    } else if (sortColumn === 'language') {
      comparison = a.presentation.language.localeCompare(b.presentation.language, 'en');
    } else if (sortColumn === 'calls') {
      comparison = a.calls - b.calls;
    } else {
      comparison = a.evaluationPoints - b.evaluationPoints;
    }
    if (comparison === 0) comparison = a.coreType.localeCompare(b.coreType, 'en');
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const toggleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection((current) => current === 'asc' ? 'desc' : 'asc');
      return;
    }
    setSortColumn(column);
    setSortDirection(column === 'calls' || column === 'points' ? 'desc' : 'asc');
  };

  const sortIcon = (column: SortColumn) => {
    if (sortColumn !== column) return <ArrowUpDown className="size-3 opacity-45" />;
    return sortDirection === 'asc'
      ? <ArrowUp className="size-3" />
      : <ArrowDown className="size-3" />;
  };

  useEffect(() => {
    if (!open) return;
    void loadKernelDetails();
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
      previousFocus?.focus();
    };
  }, [loadKernelDetails, onClose, open]);

  if (!open) return null;

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[120] grid place-items-center bg-zinc-950/50 p-3 backdrop-blur-[2px] sm:p-6"
        onMouseDown={(event) => {
          if (event.currentTarget === event.target) onClose();
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          className="flex max-h-[min(82vh,680px)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border/80 bg-background shadow-2xl"
        >
          <div className="flex items-start justify-between gap-4 border-b border-border/70 px-5 py-4">
            <div className="min-w-0">
              <h2 id={titleId} className="text-base font-semibold tracking-tight">
                {t('Kernel usage details', '内核用量明细')}
              </h2>
              <p id={descriptionId} className="mt-1 truncate text-xs text-muted-foreground">
                {keyName} · {t(
                  `${(usage?.calls ?? 0).toLocaleString('en-US')} calls · ${(usage?.totalPoints ?? 0).toLocaleString('en-US')} points consumed`,
                  `${(usage?.calls ?? 0).toLocaleString('en-US')} 次调用 · 消耗 ${(usage?.totalPoints ?? 0).toLocaleString('en-US')} 积分`,
                )}
              </p>
            </div>
            <Button
              ref={closeRef}
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0 rounded-full"
              aria-label={t('Close', '关闭')}
              onClick={onClose}
            >
              <X />
            </Button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
            {usage?.coreTypes.length ? (
              <div className="overflow-x-auto rounded-xl border border-border/80">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="sticky top-0 bg-muted/95 text-[11px] font-semibold text-muted-foreground backdrop-blur">
                    <tr className="border-b border-border">
                      {([
                        ['category', t('Category', '类别'), 'text-left'],
                        ['coreType', t('Kernel', '内核名'), 'text-left'],
                        ['language', t('Language', '语言'), 'text-left'],
                        ['calls', t('Calls', '调用次数'), 'text-right'],
                        ['points', t('Points consumed', '消耗积分'), 'text-right'],
                      ] as const).map(([column, label, align]) => (
                        <th
                          key={column}
                          className={`px-4 py-2.5 ${align}`}
                          aria-sort={sortColumn === column
                            ? sortDirection === 'asc' ? 'ascending' : 'descending'
                            : 'none'}
                        >
                          <button
                            type="button"
                            className={`inline-flex items-center gap-1.5 rounded-sm font-semibold hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${align === 'text-right' ? 'justify-end' : ''}`}
                            onClick={() => toggleSort(column)}
                          >
                            {label}
                            {sortIcon(column)}
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/70">
                    {rows.map((kernel) => (
                      <tr key={kernel.coreType}>
                        <td className="whitespace-nowrap px-4 py-3 font-medium">
                          {t(kernel.presentation.categoryEn, kernel.presentation.categoryZh)}
                        </td>
                        <td className="px-4 py-3">
                          <code className="break-all font-mono text-[12px] font-medium">
                            {kernel.coreType}
                          </code>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex min-w-8 justify-center rounded-md border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                            {kernel.presentation.language}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {kernel.calls.toLocaleString('en-US')}
                        </td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums">
                          {kernel.evaluationPoints.toLocaleString('en-US')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border px-5 py-10 text-center">
                <div className="text-sm font-medium">{t('No kernel details yet', '暂无内核明细')}</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t(
                    'Calls and consumed points will appear here after the backend returns kernel-level usage.',
                    '后端返回内核级用量后，这里会显示调用次数与消耗积分。',
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
