import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

type JsonRecord = Record<string, unknown>;

function getBackendBase(): string {
  // Runtime-configurable backend base URL (server-side only).
  // Example: API_BASE_URL=https://fc.cloud.chivox.com/api
  const base =
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL || // fallback for existing environments
    'http://10.0.10.3:8081/api';

  return base.replace(/\/+$/, '');
}

function asRecord(value: unknown): JsonRecord | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonRecord
    : null;
}

function numericId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isSafeInteger(value)) return value;
  if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value);
  return null;
}

function extractKeys(payload: unknown): JsonRecord[] | null {
  const envelope = asRecord(payload);
  if (!envelope || !Array.isArray(envelope.keys)) return null;
  return envelope.keys.map(asRecord).filter((key): key is JsonRecord => key !== null);
}

interface Principal {
  userId: number;
  accountId: number | null;
}

function extractPrincipal(payload: unknown): Principal | null {
  const envelope = asRecord(payload);
  const user = asRecord(envelope?.user) ?? envelope;
  const userId = numericId(user?.id);
  if (userId === null) return null;
  return {
    userId,
    accountId: numericId(user?.account_id),
  };
}

function hasOwnerMetadata(key: JsonRecord): boolean {
  return numericId(key.account_id) !== null || numericId(key.user_id) !== null;
}

function belongsToPrincipal(key: JsonRecord, principal: Principal): boolean {
  const keyAccountId = numericId(key.account_id);
  const keyUserId = numericId(key.user_id);

  if (keyAccountId !== null) {
    return keyAccountId === (principal.accountId ?? principal.userId);
  }
  if (keyUserId !== null) {
    return keyUserId === principal.userId;
  }
  return false;
}

function ownedKeys(keys: JsonRecord[], principal: Principal): JsonRecord[] {
  // Older upstream versions omitted ownership fields because GET /keys was
  // already tenant-scoped. Preserve compatibility in that case. If even one
  // row carries ownership metadata, however, fail closed for every untagged
  // row and keep only explicit matches.
  if (!keys.some(hasOwnerMetadata)) return keys;
  return keys.filter((key) => belongsToPrincipal(key, principal));
}

function maskListedSecret(value: unknown): unknown {
  if (typeof value !== 'string' || value.length === 0) return value;
  if (value.includes('...') || /[•*]/.test(value)) return value;
  if (value.length <= 4) return '••••';
  return `${value.slice(0, Math.min(7, value.length - 4))}...${value.slice(-4)}`;
}

function sanitizeListedKey(key: JsonRecord): JsonRecord {
  const safe = { ...key };
  delete safe.account_id;
  delete safe.user_id;
  delete safe.user_email;

  if ('api_key' in safe) safe.api_key = maskListedSecret(safe.api_key);
  if ('secret' in safe) safe.secret = maskListedSecret(safe.secret);
  return safe;
}

function upstreamHeaders(req: NextRequest): Headers {
  const headers = new Headers(req.headers);
  headers.delete('host');
  headers.delete('content-length');
  headers.delete('transfer-encoding');
  return headers;
}

async function fetchJson(url: string, headers: Headers): Promise<{
  ok: boolean;
  status: number;
  payload: unknown;
}> {
  try {
    const response = await fetch(url, {
      headers,
      cache: 'no-store',
      redirect: 'manual',
    });
    const text = await response.text();
    let payload: unknown = null;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = null;
      }
    }
    return { ok: response.ok, status: response.status, payload };
  } catch {
    return { ok: false, status: 502, payload: null };
  }
}

async function verifyKeyOwnership(
  backendBase: string,
  headers: Headers,
  keyId: number,
): Promise<'allowed' | 'unauthenticated' | 'unavailable' | 'not-owned'> {
  const [meResult, keysResult] = await Promise.all([
    fetchJson(`${backendBase}/auth/me`, headers),
    fetchJson(`${backendBase}/keys`, headers),
  ]);

  if (meResult.status === 401 || keysResult.status === 401) return 'unauthenticated';
  if (!meResult.ok || !keysResult.ok) return 'unavailable';

  const principal = extractPrincipal(meResult.payload);
  const keys = extractKeys(keysResult.payload);
  if (!principal || !keys) return 'unavailable';

  return ownedKeys(keys, principal).some((key) => numericId(key.id) === keyId)
    ? 'allowed'
    : 'not-owned';
}

function responseHeaders(res: Response): Headers {
  const headers = new Headers(res.headers);
  headers.delete('connection');
  headers.delete('content-length');
  headers.delete('transfer-encoding');
  headers.delete('content-encoding');
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private, max-age=0');
  headers.set('Pragma', 'no-cache');
  headers.set('Expires', '0');
  headers.set('Vary', 'Authorization, Cookie');
  return headers;
}

async function secureKeyListResponse(
  res: Response,
  backendBase: string,
  headers: Headers,
  target: string,
): Promise<Response> {
  const text = await res.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      // Preserve an unexpected non-JSON upstream response unchanged.
      const outHeaders = responseHeaders(res);
      outHeaders.set('x-chivox-proxy-target', target);
      return new Response(text, { status: res.status, headers: outHeaders });
    }
  }

  const envelope = asRecord(payload);
  const keys = extractKeys(payload);
  if (!res.ok || !envelope || !keys) {
    const outHeaders = responseHeaders(res);
    outHeaders.set('x-chivox-proxy-target', target);
    return new Response(text, { status: res.status, headers: outHeaders });
  }

  let scopedKeys = keys;
  if (keys.some(hasOwnerMetadata)) {
    const meResult = await fetchJson(`${backendBase}/auth/me`, headers);
    const principal = meResult.ok ? extractPrincipal(meResult.payload) : null;
    // Ownership-tagged data must never fall back to an unfiltered response.
    scopedKeys = principal ? ownedKeys(keys, principal) : [];
  }

  const outHeaders = responseHeaders(res);
  outHeaders.set('Content-Type', 'application/json; charset=utf-8');
  outHeaders.set('x-chivox-proxy-target', target);
  return new Response(
    JSON.stringify({
      ...envelope,
      keys: scopedKeys.map(sanitizeListedKey),
    }),
    { status: res.status, headers: outHeaders },
  );
}

async function proxy(req: NextRequest, pathParts: string[]) {
  const backendBase = getBackendBase();
  const url = new URL(`${backendBase}/${pathParts.join('/')}`);

  // Preserve query string
  const incoming = new URL(req.url);
  incoming.searchParams.forEach((v, k) => url.searchParams.append(k, v));

  const headers = upstreamHeaders(req);

  // Sensitive key reads and mutations get a BFF-level ownership check in
  // addition to the upstream authorization. This prevents a stale/foreign ID
  // from being revealed, rotated, renamed, paused, or otherwise operated on
  // even if an upstream handler accidentally omits its tenant predicate.
  const keyId =
    pathParts[0] === 'keys' && pathParts[1] && /^\d+$/.test(pathParts[1])
      ? Number(pathParts[1])
      : null;
  if (keyId !== null) {
    const ownership = await verifyKeyOwnership(backendBase, headers, keyId);
    if (ownership === 'unauthenticated') {
      return Response.json(
        { error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' } },
        { status: 401, headers: { 'Cache-Control': 'no-store' } },
      );
    }
    if (ownership === 'unavailable') {
      return Response.json(
        { error: { code: 'KEY_OWNERSHIP_UNAVAILABLE', message: 'Unable to verify key ownership.' } },
        { status: 503, headers: { 'Cache-Control': 'no-store' } },
      );
    }
    if (ownership === 'not-owned') {
      // Deliberately use 404 so callers cannot enumerate another account's IDs.
      return Response.json(
        { error: { code: 'NOT_FOUND', message: 'Key not found.' } },
        { status: 404, headers: { 'Cache-Control': 'no-store' } },
      );
    }
  }

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
      cache: 'no-store',
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'proxy fetch failed';
    return Response.json(
      { error: 'Upstream API unreachable', target: url.toString(), detail: msg },
      { status: 502 },
    );
  }

  if (req.method === 'GET' && pathParts.length === 1 && pathParts[0] === 'keys') {
    return secureKeyListResponse(res, backendBase, headers, url.toString());
  }

  // Pass through status + headers; avoid leaking hop-by-hop headers.
  const outHeaders = responseHeaders(res);
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
