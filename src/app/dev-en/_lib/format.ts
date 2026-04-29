// Tiny formatters shared across the dashboard pages.

export function formatCents(cents: number | null | undefined, locale = 'en-US'): string {
  if (cents == null) return '—';
  const v = cents / 100;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);
}

export function formatNumber(n: number | null | undefined, locale = 'en-US'): string {
  if (n == null) return '—';
  return new Intl.NumberFormat(locale).format(n);
}

export function formatDate(input: string | Date | null | undefined): string {
  if (!input) return '—';
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateShort(input: string | Date | null | undefined): string {
  if (!input) return '—';
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
}

export function maskKey(key: string | null | undefined): string {
  if (!key) return '—';
  if (key.length <= 12) return key;
  return `${key.slice(0, 7)}…${key.slice(-4)}`;
}

export function keyLast4(key: string | null | undefined): string {
  if (!key) return '????';
  return key.slice(-4);
}
