'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setToken } from '../../dev-en/_lib/api';

// OAuth callback handler.
//
// Per the backend doc, after the OAuth dance the backend 302s the browser to:
//
//   <frontend-origin>/oauth/callback#token=<jwt>&role=<user|admin>&state=<state>
//
// The token rides in the URL *fragment* (after `#`), which never reaches the
// server. We verify `state` against the value we stashed in sessionStorage
// before starting (CSRF protection), persist the token via the same
// localStorage key the rest of the app uses (`chivox_token`), and forward on.
//
// For backward compatibility we also accept the legacy query-string form
// (`?token=...&redirect=...`).
export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<Pending />}>
      <CallbackInner />
    </Suspense>
  );
}

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Run the token handling off the synchronous effect body (a true mount-time
    // side effect that reads window + storage and then redirects).
    const run = () => {
      // Prefer the URL fragment (doc-compliant), fall back to query params.
      const hash = typeof window !== 'undefined' ? window.location.hash.replace(/^#/, '') : '';
      const frag = new URLSearchParams(hash);

      const token = frag.get('token') ?? params.get('token');
      const state = frag.get('state') ?? params.get('state');
      const oauthError = frag.get('error') ?? params.get('error');
      const errorDescription = params.get('error_description');
      const redirect = params.get('redirect') || '/dashboard/overview';

      if (oauthError) {
        setError(errorDescription || oauthError);
        return;
      }

      if (!token) {
        setError('Missing token in OAuth callback. Please try signing in again.');
        return;
      }

      // CSRF check: only enforce when we actually have a stored state to compare
      // against (a state is always sent on the fragment path).
      let savedState: string | null = null;
      try {
        savedState = sessionStorage.getItem('oauth_state');
        sessionStorage.removeItem('oauth_state');
      } catch {
        /* ignore */
      }
      if (savedState && state && state !== savedState) {
        setError('Sign-in could not be verified (state mismatch). Please try again.');
        return;
      }

      setToken(token);

      // If backend signals this is a brand-new account, flag it so DataHydrator
      // can create a Starter key on first load (OAuth flow does a hard reload so
      // React state doesn't survive; localStorage is the cross-reload channel).
      if (frag.get('is_new_user') === 'true' || params.get('is_new_user') === 'true') {
        try { localStorage.setItem('dev-en:oauth-new-user', '1'); } catch { /* ignore */ }
      }

      // Hard navigation so AuthProvider re-bootstraps with /auth/me.
      window.location.replace(redirect);
    };
    const id = window.setTimeout(run, 0);
    return () => window.clearTimeout(id);
  }, [params, router]);

  return (
    <main className="min-h-dvh flex items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-3 max-w-sm text-center px-6">
        {error ? (
          <>
            <h1 className="text-base font-semibold">Sign-in failed</h1>
            <p className="text-sm text-muted-foreground">{error}</p>
            <a
              href="/login"
              className="mt-2 text-sm font-medium underline underline-offset-4"
            >
              Back to sign in
            </a>
          </>
        ) : (
          <>
            <span className="h-6 w-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Completing sign-in…</p>
          </>
        )}
      </div>
    </main>
  );
}

function Pending() {
  return (
    <main className="min-h-dvh flex items-center justify-center bg-background text-foreground">
      <span className="h-6 w-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
    </main>
  );
}
