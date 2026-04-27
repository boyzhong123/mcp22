import type { NextRequest } from 'next/server';

function getBackendBase(): string {
  // Runtime-configurable backend base URL (server-side only).
  // Example: API_BASE_URL=https://fc.cloud.chivox.com/api
  const base =
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL || // fallback for existing environments
    'http://localhost:8081/api';

  return base.replace(/\/+$/, '');
}

async function proxy(req: NextRequest, pathParts: string[]) {
  const backendBase = getBackendBase();
  const url = new URL(`${backendBase}/${pathParts.join('/')}`);

  // Preserve query string
  const incoming = new URL(req.url);
  incoming.searchParams.forEach((v, k) => url.searchParams.append(k, v));

  const headers = new Headers(req.headers);
  headers.delete('host');

  let res: Response;
  try {
    // Let fetch handle encoding; pass-through body when present.
    res = await fetch(url, {
      method: req.method,
      headers,
      body: req.method === 'GET' || req.method === 'HEAD' ? undefined : req.body,
      redirect: 'manual',
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'proxy fetch failed';
    return Response.json(
      { error: 'Upstream API unreachable', target: url.toString(), detail: msg },
      { status: 502 },
    );
  }

  // Pass through status + headers; avoid leaking hop-by-hop headers.
  const outHeaders = new Headers(res.headers);
  outHeaders.delete('connection');
  outHeaders.delete('transfer-encoding');
  outHeaders.delete('content-encoding');
  outHeaders.set('x-chivox-proxy-target', url.toString());

  return new Response(res.body, {
    status: res.status,
    headers: outHeaders,
  });
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path);
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path);
}
export async function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path);
}
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path);
}
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path);
}
export async function OPTIONS(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path);
}

