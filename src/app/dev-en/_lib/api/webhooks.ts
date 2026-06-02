import { invalidate, request } from './client';
import type { WebhookEndpoint } from './types';

// The backend stores enabled_events as a JSON-encoded string. Normalize it
// to a string[] for the UI; tolerate already-parsed arrays too.
function parseEvents(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function normalize(e: WebhookEndpoint): WebhookEndpoint {
  return { ...e, enabled_events: parseEvents((e as { enabled_events: unknown }).enabled_events) };
}

// doc §8.1 — bare array response.
export async function list(): Promise<WebhookEndpoint[]> {
  const data = await request<WebhookEndpoint[]>('/webhooks/endpoints');
  return (Array.isArray(data) ? data : []).map(normalize);
}

// doc §8.2
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
  return normalize(data);
}

// doc §8.3 — 204 No Content.
export async function remove(id: number): Promise<void> {
  await request<unknown>(`/webhooks/endpoints/${id}`, { method: 'DELETE' });
  invalidate('webhooks');
}

// doc §8.4
export async function test(id: number): Promise<void> {
  await request<{ message: string }>(`/webhooks/endpoints/${id}/test`, { method: 'POST' });
}
