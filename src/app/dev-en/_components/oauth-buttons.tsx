'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMockAuth } from '../_lib/mock-auth';

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.94h5.51a4.72 4.72 0 0 1-2.05 3.1l3.31 2.57c1.93-1.79 3.04-4.41 3.04-7.55 0-.73-.07-1.43-.19-2.06H12Z"
      />
      <path
        fill="#34A853"
        d="M5.5 14.27 4.77 14.83 2.23 16.8A10 10 0 0 0 12 22c2.7 0 4.97-.89 6.63-2.42l-3.31-2.57c-.9.61-2.06.97-3.32.97a5.77 5.77 0 0 1-5.42-3.97l-.08.24Z"
      />
      <path
        fill="#4A90E2"
        d="M2.23 7.2A9.98 9.98 0 0 0 2 12c0 1.74.4 3.38 1.12 4.8l3.37-2.62A5.8 5.8 0 0 1 6.22 12c0-.7.12-1.37.33-1.98L2.23 7.2Z"
      />
      <path
        fill="#FBBC05"
        d="M12 6.22c1.47 0 2.78.51 3.82 1.5l2.86-2.86A9.95 9.95 0 0 0 12 2 10 10 0 0 0 2.23 7.2l4.32 3.36A5.77 5.77 0 0 1 12 6.22Z"
      />
    </svg>
  );
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M12 .5C5.37.5 0 5.87 0 12.5a12 12 0 0 0 8.21 11.4c.6.1.82-.26.82-.58v-2c-3.34.72-4.04-1.6-4.04-1.6-.55-1.39-1.34-1.76-1.34-1.76-1.1-.75.08-.74.08-.74 1.21.09 1.85 1.24 1.85 1.24 1.08 1.85 2.83 1.31 3.52 1 .11-.78.42-1.31.76-1.61-2.66-.3-5.46-1.34-5.46-5.96 0-1.32.47-2.4 1.24-3.24-.12-.3-.54-1.54.12-3.21 0 0 1.01-.32 3.3 1.24a11.38 11.38 0 0 1 6 0c2.29-1.56 3.3-1.24 3.3-1.24.66 1.67.24 2.91.12 3.21.77.84 1.24 1.92 1.24 3.24 0 4.63-2.8 5.65-5.47 5.95.43.37.81 1.1.81 2.22v3.29c0 .32.21.69.83.57A12 12 0 0 0 24 12.5C24 5.87 18.63.5 12 .5Z" />
    </svg>
  );
}

// Microsoft's brand mark — four equal squares (orange/green/blue/yellow).
// Same visual used across the Microsoft identity platform sign-in buttons.
function MicrosoftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path fill="#F25022" d="M2 2h9.5v9.5H2z" />
      <path fill="#7FBA00" d="M12.5 2H22v9.5h-9.5z" />
      <path fill="#00A4EF" d="M2 12.5h9.5V22H2z" />
      <path fill="#FFB900" d="M12.5 12.5H22V22h-9.5z" />
    </svg>
  );
}

type OAuthProvider = 'google' | 'github' | 'microsoft';

export function OAuthButtons() {
  const router = useRouter();
  const { login } = useMockAuth();
  const [pending, setPending] = useState<OAuthProvider | null>(null);

  const handle = async (method: OAuthProvider) => {
    if (pending) return;
    setPending(method);
    try {
      await login({ method });
      router.push('/dashboard/overview');
    } catch {
      setPending(null);
    }
  };

  return (
    <div className="space-y-2.5">
      <button
        type="button"
        disabled={!!pending}
        onClick={() => handle('github')}
        className="w-full h-11 px-4 rounded-lg bg-zinc-900 text-white text-sm font-medium flex items-center justify-center gap-2.5 hover:bg-zinc-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {pending === 'github' ? (
          <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <GithubIcon className="h-4 w-4" />
        )}
        Continue with GitHub
      </button>
      <button
        type="button"
        disabled={!!pending}
        onClick={() => handle('google')}
        className="w-full h-11 px-4 rounded-lg border border-border bg-background text-foreground text-sm font-medium flex items-center justify-center gap-2.5 hover:bg-muted/50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {pending === 'google' ? (
          <span className="h-4 w-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
        ) : (
          <GoogleIcon className="h-4 w-4" />
        )}
        Continue with Google
      </button>
      <button
        type="button"
        disabled={!!pending}
        onClick={() => handle('microsoft')}
        className="w-full h-11 px-4 rounded-lg border border-border bg-background text-foreground text-sm font-medium flex items-center justify-center gap-2.5 hover:bg-muted/50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {pending === 'microsoft' ? (
          <span className="h-4 w-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
        ) : (
          <MicrosoftIcon className="h-4 w-4" />
        )}
        Continue with Microsoft
      </button>
    </div>
  );
}
