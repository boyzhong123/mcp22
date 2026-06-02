import { buildUrl, request } from './client';
import type { AccountSummary, UsagePoint } from './types';

// doc §4.1
export interface PointsQuery {
  from?: string;
  to?: string;
  granularity?: 'day'; // backend currently only supports day
  keyId?: number;
}

// Returns a bare []UsagePoint (no envelope) per the doc.
export async function points(q: PointsQuery = {}): Promise<UsagePoint[]> {
  const data = await request<UsagePoint[]>('/usage/points', { query: q });
  return Array.isArray(data) ? data : [];
}

// doc §4.2
export function accountSummary(month?: string): Promise<AccountSummary> {
  return request<AccountSummary>('/usage/account-summary', { query: month ? { month } : undefined });
}

// doc §4.3 — CSV export needs the Authorization header, so we fetch as a Blob
// and trigger a local download rather than opening the URL directly.
export interface ExportQuery {
  from?: string;
  to?: string;
  keyId?: number;
}

export async function exportCsv(q: ExportQuery = {}): Promise<{ blob: Blob; filename: string }> {
  const blob = await request<Blob>('/usage/export.csv', { query: q, asBlob: true });
  return { blob, filename: 'usage-export.csv' };
}

export function exportCsvUrl(q: ExportQuery = {}): string {
  return buildUrl('/usage/export.csv', q);
}
