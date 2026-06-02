import { request } from './client';

// doc §7.1 — POST /api/upload/avatar (multipart/form-data, field `file`).
// Needs auth; the request() helper attaches the Bearer token and lets the
// browser set the multipart Content-Type boundary (rawBody).
export async function avatar(file: Blob, filename = 'avatar.jpg'): Promise<{ url: string }> {
  const fd = new FormData();
  fd.append('file', file, filename);
  return request<{ url: string }>('/upload/avatar', {
    method: 'POST',
    body: fd,
    rawBody: true,
  });
}
