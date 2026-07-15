import { request } from './client';
import type { UsagePoint } from './types';

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
