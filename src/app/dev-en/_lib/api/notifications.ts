import { invalidate, request } from './client';
import type { NotificationSettings } from './types';

export function get(): Promise<NotificationSettings> {
  return request<NotificationSettings>('/notifications/settings');
}

export async function patch(patch: Partial<NotificationSettings>): Promise<NotificationSettings> {
  const data = await request<NotificationSettings>('/notifications/settings', {
    method: 'PATCH',
    body: patch,
  });
  invalidate('notifications');
  return data;
}
