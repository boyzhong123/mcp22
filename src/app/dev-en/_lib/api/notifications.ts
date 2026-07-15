import { invalidate, request } from './client';
import type { NotificationSettings } from './types';

// doc §13.1
export function get(): Promise<NotificationSettings> {
  return request<NotificationSettings>('/notifications/settings');
}

// doc §13.2 — strict partial update: only these fields are accepted (unknown
// keys → 400 INVALID_REQUEST), so read-only id/account_id are excluded.
export type NotificationSettingsPatch = Partial<
  Pick<
    NotificationSettings,
    | 'weekly_usage_report'
    | 'payment_receipts'
    | 'low_balance_alerts_master'
    | 'low_evaluation_points_threshold'
    | 'product_updates'
    | 'security_alerts'
  >
>;

export async function patch(body: NotificationSettingsPatch): Promise<NotificationSettings> {
  const data = await request<NotificationSettings>('/notifications/settings', {
    method: 'PATCH',
    body,
  });
  invalidate('notifications');
  return data;
}
