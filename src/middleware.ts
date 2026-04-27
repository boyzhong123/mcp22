import { NextResponse, type NextRequest } from 'next/server';

/**
 * Public URL cleanup:
 * - Serve the English dev console at `/dashboard/*` (canonical)
 * - Keep the legacy filesystem route under `src/app/dev-en/*`, but hide it from the address bar
 *   via rewrite + redirect.
 */
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Legacy → canonical (permanent redirect so bookmarks/search indexes converge)
  if (pathname === '/dev-en' || pathname.startsWith('/dev-en/')) {
    const url = req.nextUrl.clone();
    url.search = search;

    if (pathname === '/dev-en/login' || pathname.startsWith('/dev-en/login/')) {
      url.pathname = pathname.replace(/^\/dev-en\/login/, '/login');
      return NextResponse.redirect(url, 308);
    }

    if (pathname === '/dev-en/dashboard' || pathname.startsWith('/dev-en/dashboard/')) {
      url.pathname = pathname.replace(/^\/dev-en\/dashboard/, '/dashboard');
      return NextResponse.redirect(url, 308);
    }

    // Anything else under the legacy prefix routes to the public login entry.
    url.pathname = '/login';
    return NextResponse.redirect(url, 308);
  }

  // Canonical → internal route segment
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    const internalPath = pathname.replace(/^\/dashboard(?=\/|$)/, '/dev-en/dashboard');
    const url = req.nextUrl.clone();
    url.pathname = internalPath;
    url.search = search;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dev-en/:path*', '/dashboard/:path*'],
};
