import { buildUrl, request } from './client';
import type { AccountSummary, UsagePoint } from './types';

export interface PointsQuery {
  from?: string;
  to?: string;
  granularity?: 'hour' | 'day' | 'month';
  projectId?: number;
  keyId?: number;
}

export async function points(q: PointsQuery = {}): Promise<UsagePoint[]> {
  const data = await request<{ points: UsagePoint[] }>('/usage/points', { query: q });
  return data.points || [];
}

export function accountSummary(month?: string): Promise<AccountSummary> {
  return request<AccountSummary>('/usage/account-summary', { query: month ? { month } : undefined });
}

// CSV export — needs Authorization header, so we fetch as Blob and trigger
// a local download instead of opening the URL directly.
export interface ExportQuery {
  from?: string;
  to?: string;
  keyId?: number;
  projectId?: number;
}

export async function exportCsv(q: ExportQuery = {}): Promise<{ blob: Blob; filename: string }> {
  const blob = await request<Blob>('/usage/export.csv', { query: q, asBlob: true });
  return { blob, filename: 'usage-export.csv' };
}

export function exportCsvUrl(q: ExportQuery = {}): string {
  return buildUrl('/usage/export.csv', q);
}
