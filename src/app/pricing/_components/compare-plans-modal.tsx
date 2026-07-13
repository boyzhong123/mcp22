'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Minus, Table2, X } from 'lucide-react';

export interface CompareColumn {
  id: string;
  label: string;
  price: string;
  accent: boolean;
}

export interface CompareRow {
  label: string;
  /** Aligned to the columns array; `true` renders a check, `'—'` a dash. */
  values: (string | boolean)[];
}

interface ComparePlansModalProps {
  columns: CompareColumn[];
  rows: CompareRow[];
}

export function ComparePlansModal({ columns, rows }: ComparePlansModalProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Lock page scroll and wire Escape-to-close while the modal is open. The
  // document scroller here is <html>, so lock both it and <body>.
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    html.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      html.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-8 inline-flex items-center gap-2 rounded-full border border-zinc-900/[0.12] bg-white/70 px-5 py-2.5 text-[13.5px] font-semibold text-zinc-900 transition-colors hover:bg-white"
      >
        <Table2 className="h-4 w-4 text-emerald-700" aria-hidden />
        Compare all plans side by side
      </button>

      {mounted && open
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
              role="dialog"
              aria-modal="true"
              aria-label="Compare all plans"
            >
              <div
                className="absolute inset-0 bg-zinc-950/45 backdrop-blur-[2px]"
                onClick={() => setOpen(false)}
                aria-hidden
              />
              <div className="relative flex max-h-full w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[#e9e2d2] bg-[#fbf8f1] shadow-[0_40px_120px_-40px_rgba(16,52,33,0.55)]">
                <div className="flex items-center justify-between gap-4 border-b border-[#e9e2d2] px-6 py-4">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-emerald-700">/compare</div>
                    <h3 className="mt-1 text-[16px] font-semibold text-zinc-900">All plans side by side</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Close comparison"
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-900/[0.06] hover:text-zinc-900"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>

                <div className="overflow-auto overscroll-contain px-6 pb-6 pt-2">
                  <table className="w-full min-w-[560px] border-collapse text-left">
                    <thead>
                      <tr>
                        <th className="w-1/4 py-3 pr-4 align-bottom text-[11px] font-mono uppercase tracking-[0.14em] text-zinc-500">
                          Plan
                        </th>
                        {columns.map((col) => (
                          <th key={col.id} className="py-3 pl-4 align-bottom">
                            <span className={`block text-[14px] font-semibold ${col.accent ? 'text-emerald-700' : 'text-zinc-900'}`}>
                              {col.label}
                            </span>
                            <span className="mt-0.5 block text-[12px] font-normal text-muted-foreground">{col.price}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.label} className="border-t border-[#e9e2d2]/70">
                          <th scope="row" className="py-3 pr-4 text-[13px] font-medium text-foreground/80">
                            {row.label}
                          </th>
                          {row.values.map((value, i) => (
                            <td key={columns[i].id} className="py-3 pl-4 text-[13px] text-foreground/85">
                              {value === true ? (
                                <Check className="h-4 w-4 text-emerald-600" strokeWidth={3} aria-label="Included" />
                              ) : value === '—' ? (
                                <Minus className="h-3.5 w-3.5 text-zinc-300" aria-label="Not applicable" />
                              ) : (
                                value
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
