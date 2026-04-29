import { invalidate, request } from './client';
import type { TeamMember, TeamRole } from './types';

export function list(): Promise<TeamMember[]> {
  return request<TeamMember[]>('/team/members');
}

export async function invite(params: {
  email: string;
  role: TeamRole;
  name?: string;
}): Promise<TeamMember> {
  const data = await request<TeamMember>('/team/members/invite', {
    method: 'POST',
    body: params,
  });
  invalidate('team');
  return data;
}

export async function resend(id: number): Promise<void> {
  await request<{ message: string }>(`/team/members/${id}/resend`, { method: 'POST' });
}

export async function patchRole(id: number, role: TeamRole): Promise<TeamMember> {
  const data = await request<TeamMember>(`/team/members/${id}`, {
    method: 'PATCH',
    body: { role },
  });
  invalidate('team');
  return data;
}

export async function remove(id: number): Promise<void> {
  await request<unknown>(`/team/members/${id}`, { method: 'DELETE' });
  invalidate('team');
}
