'use client';

import { useMemo, useState } from 'react';
import { Download, Filter, Receipt, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  formatCents,
  formatDate,
  getKey,
  getTransactions,
  listProjects,
  type Transaction,
} from '../../../_lib/mock-store';
import { useMockStore } from '../../../_lib/use-mock-store';
import { useLang } from '../../../_lib/use-lang';
import { useMockAuth } from '../../../_lib/mock-auth';

type StatusFilter = 'all' | Transaction['status'];

export default function RechargeHistoryPage() {
  const { t, tx } = useLang();
  const { user } = useMockAuth();
  const all = useMockStore(getTransactions, [] as Transaction[]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [downloading, setDownloading] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return all
      .filter((t) => (status === 'all' ? true : t.status === status))
      .filter((t) => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return (
          t.invoiceNumber.toLowerCase().includes(q) ||
          t.last4.includes(q) ||
          t.description.toLowerCase().includes(q)
        );
      });
  }, [all, query, status]);

  const totalSucceeded = useMemo(
    () =>
      all
        .filter((t) => t.status === 'succeeded')
        .reduce((acc, t) => acc + t.amountCents, 0),
    [all],
  );

  const handleDownload = (txn: Transaction) => {
    setDownloading(txn.id);
    // Short artificial delay so the spinner is visible — matches how a real
    // invoice would be generated server-side and streamed.
    window.setTimeout(() => {
      try {
        const html = buildInvoiceHtml(txn, {
          customerName: user?.name ?? 'Customer',
          customerEmail: user?.email ?? '',
        });
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${txn.invoiceNumber}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } finally {
        setDownloading(null);
      }
    }, 600);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label={tx('Total transactions')} value={all.length.toString()} />
        <SummaryCard
          label={tx('Total paid')}
          value={formatCents(totalSucceeded)}
          hint={tx('Succeeded only')}
        />
        <SummaryCard
          label={tx('Latest top-up')}
          value={all[0] ? formatCents(all[0].amountCents) : '—'}
          hint={all[0] ? formatDate(all[0].createdAt) : tx('No payments yet')}
        />
      </div>

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tx('Search invoice #, last 4, description…')}
              className="w-full h-9 pl-9 pr-3 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-foreground/30"
            />
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-1 text-xs">
            <Filter className="h-3 w-3 text-muted-foreground ml-1" />
            {(['all', 'succeeded', 'pending', 'failed'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={cn(
                  'px-2.5 h-7 rounded-md capitalize font-medium transition-colors',
                  status === s
                    ? 'bg-background text-foreground shadow-sm border border-border'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {tx(s.charAt(0).toUpperCase() + s.slice(1))}
              </button>
            ))}
          </div>
        </div>

        <div className="hidden md:grid grid-cols-[1.2fr_1fr_0.8fr_0.8fr_0.8fr_auto] gap-4 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/20 border-b border-border">
          <div>{tx('Invoice')}</div>
          <div>{tx('Date')}</div>
          <div>{tx('Amount')}</div>
          <div>{tx('Method')}</div>
          <div>{tx('Status')}</div>
          <div className="text-right">{tx('Action')}</div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto h-10 w-10 rounded-lg bg-muted flex items-center justify-center mb-3">
              <Receipt className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">{tx('No matching transactions')}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {tx('Adjust your filters or add funds from the billing page.')}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((t) => (
              <li
                key={t.id}
                className="px-5 py-3.5 md:grid md:grid-cols-[1.2fr_1fr_0.8fr_0.8fr_0.8fr_auto] md:gap-4 md:items-center flex flex-col gap-1.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{t.invoiceNumber}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {t.description}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground">{formatDate(t.createdAt)}</div>
                <div className="text-sm font-semibold tabular-nums">
                  {formatCents(t.amountCents)}
                </div>
                <div className="text-xs text-muted-foreground capitalize">
                  {(() => {
                    const m = methodLabel(t.method, t.last4);
                    if (m === 'Wire transfer') return tx('Wire transfer');
                    if (m.startsWith('Card ')) return `${tx('Card')} •••• ${t.last4}`;
                    return m;
                  })()}
                </div>
                <div>
                  <StatusPill status={t.status} />
                </div>
                <div className="md:text-right">
                  <button
                    onClick={() => handleDownload(t)}
                    disabled={t.status !== 'succeeded' || downloading === t.id}
                    className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-border bg-background hover:bg-muted/50 text-xs font-medium disabled:opacity-50"
                  >
                    {downloading === t.id ? (
                      <span className="h-3 w-3 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    {tx('Invoice')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="text-2xl font-semibold tracking-[-0.02em] mt-2">{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

function methodLabel(method: Transaction['method'], last4: string) {
  switch (method) {
    case 'apple-pay':
      return 'Apple Pay';
    case 'google-pay':
      return 'Google Pay';
    case 'link':
      return 'Stripe Link';
    case 'cashapp':
      return 'Cash App Pay';
    case 'paypal':
      return 'PayPal';
    case 'amazon-pay':
      return 'Amazon Pay';
    case 'ach':
      return `ACH •••• ${last4}`;
    case 'wire':
      return 'Wire transfer';
    default:
      return `Card •••• ${last4}`;
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Build a self-contained HTML invoice. We ship HTML (not PDF) so the demo has
 * zero JS dependencies — the user can print-to-PDF from the browser for a
 * pixel-perfect copy, and it also previews cleanly when opened from downloads.
 */
function buildInvoiceHtml(
  txn: Transaction,
  meta: { customerName: string; customerEmail: string },
): string {
  const projects = listProjects();
  const project = txn.projectId ? projects.find((p) => p.id === txn.projectId) : undefined;
  const key = txn.keyId ? getKey(txn.keyId) : undefined;
  const issuedAt = new Date(txn.createdAt);
  const subtotal = txn.amountCents;
  const tax = 0;
  const total = subtotal + tax;

  const rows: Array<[string, string]> = [
    ['Description', txn.description],
    ['Method', methodLabel(txn.method, txn.last4)],
    ...(project ? ([['Project', project.name]] as Array<[string, string]>) : []),
    ...(key ? ([['API key', `${key.name} (${key.maskedSecret})`]] as Array<[string, string]>) : []),
    ['Status', txn.status.toUpperCase()],
  ];

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Invoice ${escapeHtml(txn.invoiceNumber)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif; color: #111; margin: 0; padding: 48px; max-width: 780px; background: #fff; }
  header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 24px; border-bottom: 2px solid #111; margin-bottom: 32px; }
  .brand { font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
  .brand small { display: block; font-size: 11px; font-weight: 400; color: #666; margin-top: 2px; letter-spacing: 0; }
  .title { text-align: right; }
  .title h1 { margin: 0; font-size: 24px; letter-spacing: -0.02em; }
  .title p { margin: 4px 0 0 0; font-size: 12px; color: #666; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px; }
  h2 { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #666; margin: 0 0 8px; }
  .block { font-size: 13px; line-height: 1.55; }
  .block strong { display: block; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
  table th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #666; border-bottom: 1px solid #e5e5e5; padding: 8px 4px; font-weight: 600; }
  table td { padding: 10px 4px; border-bottom: 1px solid #f2f2f2; vertical-align: top; }
  table td.amount { text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; }
  .totals { margin-left: auto; width: 280px; font-size: 13px; }
  .totals div { display: flex; justify-content: space-between; padding: 6px 0; }
  .totals .total { border-top: 2px solid #111; margin-top: 4px; padding-top: 10px; font-size: 15px; font-weight: 700; }
  footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e5e5e5; font-size: 11px; color: #666; line-height: 1.55; }
  .pill { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 700; letter-spacing: 0.04em; }
  .pill.succeeded { background: #e6f9ef; color: #047857; }
  .pill.pending { background: #fef3c7; color: #92400e; }
  .pill.failed { background: #fee2e2; color: #991b1b; }
  @media print { body { padding: 24px; } }
</style>
</head>
<body>
  <header>
    <div class="brand">
      Chivox, Inc.
      <small>383 Madison Avenue · New York, NY 10017 · United States</small>
      <small>EIN 88-0000000 · support@chivox.com</small>
    </div>
    <div class="title">
      <h1>Invoice</h1>
      <p>${escapeHtml(txn.invoiceNumber)}</p>
      <p>Issued ${escapeHtml(issuedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }))}</p>
      <p><span class="pill ${txn.status}">${escapeHtml(txn.status.toUpperCase())}</span></p>
    </div>
  </header>

  <div class="grid">
    <div>
      <h2>Bill to</h2>
      <div class="block">
        <strong>${escapeHtml(meta.customerName)}</strong>
        ${meta.customerEmail ? escapeHtml(meta.customerEmail) : ''}
      </div>
    </div>
    <div>
      <h2>Payment details</h2>
      <div class="block">
        ${rows.map(([k, v]) => `<div><strong>${escapeHtml(k)}</strong>${escapeHtml(v)}</div>`).join('')}
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 60%">Line item</th>
        <th style="width: 15%">Qty</th>
        <th style="width: 25%; text-align: right">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <strong>${escapeHtml(txn.description)}</strong><br/>
          <span style="color:#666;font-size:12px">Prepaid credits applied to ${escapeHtml(key?.name ?? 'your account')}. Unused credits carry forward.</span>
        </td>
        <td>1</td>
        <td class="amount">${escapeHtml(formatCents(subtotal))}</td>
      </tr>
    </tbody>
  </table>

  <div class="totals">
    <div><span>Subtotal</span><span>${escapeHtml(formatCents(subtotal))}</span></div>
    <div><span>Tax</span><span>${escapeHtml(formatCents(tax))}</span></div>
    <div class="total"><span>Total paid</span><span>${escapeHtml(formatCents(total))}</span></div>
  </div>

  <footer>
    Thank you for your business. Payment has been received in full.<br/>
    Questions? Email <a href="mailto:billing@chivox.com">billing@chivox.com</a> and reference invoice ${escapeHtml(txn.invoiceNumber)}.
  </footer>
</body>
</html>`;
}

function StatusPill({ status }: { status: Transaction['status'] }) {
  const { tx } = useLang();
  const cls =
    status === 'succeeded'
      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
      : status === 'pending'
        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
        : 'bg-destructive/15 text-destructive border-destructive/30';
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border',
        cls,
      )}
    >
      {tx(status.charAt(0).toUpperCase() + status.slice(1))}
    </span>
  );
}
