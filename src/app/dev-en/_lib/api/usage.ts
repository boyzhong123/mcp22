import { request } from './client';
import type {
  UsageChargeStatus,
  UsageEventListResponse,
  UsagePoint,
  UsageRateSource,
} from './types';

// doc §11.1 — aggregated by UTC day × key × CoreType. Max window 366 days.
export interface PointsQuery {
  from?: string; // YYYY-MM-DD or RFC3339
  to?: string; // YYYY-MM-DD includes the whole day
  granularity?: 'day'; // only 'day' is supported
  keyId?: number;
}

// Returns a bare []UsagePoint (no envelope); [] when there is no data.
export async function points(q: PointsQuery = {}): Promise<UsagePoint[]> {
  const data = await request<UsagePoint[]>('/usage/points', { query: q });
  return Array.isArray(data) ? data : [];
}

export interface UsageEventsQuery {
  page?: number;
  page_size?: number;
  from?: string;
  to?: string;
  api_key_id?: number;
  key_id?: number;
  core_type?: string;
  pricing_version_id?: number;
  rate_source?: UsageRateSource;
  charge_status?: UsageChargeStatus;
}

export function events(query: UsageEventsQuery = {}): Promise<UsageEventListResponse> {
  return request<UsageEventListResponse>('/usage/events', { query });
}

export interface UsageExportQuery extends Omit<UsageEventsQuery, 'page' | 'page_size'> {
  keyId?: number;
}

/** Complete server-side event export (max 366 days / 100,000 rows). */
export function exportCsv(query: UsageExportQuery = {}): Promise<Blob> {
  return request<Blob>('/usage/export.csv', { query, asBlob: true });
}
