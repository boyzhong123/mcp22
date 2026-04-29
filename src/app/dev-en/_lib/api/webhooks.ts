import { invalidate, request } from './client';
import type { WebhookEndpoint } from './types';

export function list(): Promise<WebhookEndpoint[]> {
  return request<WebhookEndpoint[]>('/webhooks/endpoints');
}

export async function create(params: {
  url: string;
  enabled_events: string[];
  secret?: string;
}): Promise<WebhookEndpoint> {
  const data = await request<WebhookEndpoint>('/webhooks/endpoints', {
    method: 'POST',
    body: params,
  });
  invalidate('webhooks');
  return data;
}

export async function remove(id: number): Promise<void> {
  await request<unknown>(`/webhooks/endpoints/${id}`, { method: 'DELETE' });
  invalidate('webhooks');
}

export async function test(id: number): Promise<void> {
  await request<{ message: string }>(`/webhooks/endpoints/${id}/test`, { method: 'POST' });
}
