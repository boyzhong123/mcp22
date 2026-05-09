'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setToken } from '../../dev-en/_lib/api';

// OAuth callback handler.
//
// The backend `GET /api/auth/oauth/:provider/callback` returns 200 JSON
// {token, user, is_new_user}. To avoid the user landing on a raw JSON page
// after the OAuth dance, the backend should 302 the browser to:
//
//   <frontend-origin>/auth/callback?token=<jwt>&is_new_user=<bool>&redirect=<path>
//
// This page picks up the token, persists it via the same localStorage key
// the rest of the app uses (`chivox_token`), and forwards the user on.
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
    const token = params.get('token');
    const oauthError = params.get('error');
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

    setToken(token);

    // If backend signals this is a brand-new account, flag it so DataHydrator
    // can create a Starter key on first load (OAuth flow does a hard reload so
    // React state doesn't survive; localStorage is the cross-reload channel).
    if (params.get('is_new_user') === 'true') {
      try { localStorage.setItem('dev-en:oauth-new-user', '1'); } catch { /* ignore */ }
    }

    // Hard navigation so AuthProvider re-bootstraps with /auth/me.
    window.location.replace(redirect);
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
