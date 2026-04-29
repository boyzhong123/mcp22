import { request, invalidate } from './client';
import type { Project } from './types';

export function list() {
  return request<Project[]>('/projects');
}

export async function create(params: { name: string }): Promise<Project> {
  const data = await request<Project>('/projects', { method: 'POST', body: params });
  invalidate('projects');
  return data;
}
