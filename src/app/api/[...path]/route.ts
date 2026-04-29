import type { NextRequest } from 'next/server';

function getBackendBase(): string {
  // Runtime-configurable backend base URL (server-side only).
  // Example: API_BASE_URL=https://fc.cloud.chivox.com/api
  const base =
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL || // fallback for existing environments
    'http://10.0.10.3:8081/api';

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
  // Strip headers that don't survive a body re-encoding so the upstream
  // doesn't get a stale Content-Length / transfer hint.
  headers.delete('content-length');
  headers.delete('transfer-encoding');

  // Buffer the request body. Streaming `req.body` directly into Node's
  // global fetch requires `duplex: 'half'` and trips up some upstreams;
  // auth/billing payloads here are all small JSON, so a buffered copy is
  // both safer and simpler. Empty buffers are passed as `undefined` so
  // GET/HEAD continue to work.
  let body: ArrayBuffer | undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    try {
      const buf = await req.arrayBuffer();
      if (buf.byteLength > 0) body = buf;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'failed to read body';
      return Response.json(
        { error: 'Upstream API unreachable', target: url.toString(), detail: `body read: ${msg}` },
        { status: 502 },
      );
    }
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: req.method,
      headers,
      body,
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

