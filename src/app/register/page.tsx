'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowRight, Check, Eye, EyeOff, KeyRound, Mail, User } from 'lucide-react';
import { useAuth } from '../dev-en/_lib/auth-context';
import { useLang } from '../dev-en/_lib/use-lang';
import { OAuthButtons } from '../dev-en/_components/oauth-buttons';
import { AntiBot } from '../dev-en/_components/anti-bot';

export default function RegisterPage() {
  const router = useRouter();
  const { user, registerWithPassword } = useAuth();
  const { t, tx } = useLang();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [antiBotOk, setAntiBotOk] = useState(false);
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) router.replace('/dashboard/overview');
  }, [user, router]);

  const identifier = email.trim();
  const trimmedName = name.trim();
  const identifierValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
  const passwordValid = password.length >= 6;
  const passwordsMatch = password === confirmPassword;
  const confirmTouched = confirmPassword.length > 0;
  const canSubmit =
    trimmedName.length > 0 &&
    identifierValid &&
    passwordValid &&
    passwordsMatch &&
    confirmTouched &&
    antiBotOk &&
    terms &&
    !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!passwordsMatch) {
      setError(t('Passwords do not match.', '两次输入的密码不一致。'));
      return;
    }
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const res = await registerWithPassword(trimmedName, identifier, password);
      if (!res.ok) {
        setError(res.error ?? t('Registration failed. Please try again.', '注册失败，请重试。'));
        return;
      }
      router.push('/dashboard/overview');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-dvh flex bg-background text-foreground">
      <div className="hidden lg:flex lg:w-[46%] relative bg-zinc-950 text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.04\'/%3E%3C/svg%3E")',
          }}
        />
        <div className="absolute -top-1/4 -left-1/4 w-[70%] h-[70%] bg-gradient-to-br from-white/[0.07] via-transparent to-transparent rounded-full blur-[100px]" />
        <div className="absolute -bottom-1/4 -right-1/4 w-[60%] h-[60%] bg-gradient-to-tl from-white/[0.05] via-transparent to-transparent rounded-full blur-[80px]" />

        <div className="relative z-10 flex flex-col p-10 xl:p-12 w-full">
          <Link href="/global" className="flex items-center gap-[5px] group whitespace-nowrap" aria-label="Back to Chivox MCP home">
            <div className="relative h-[3.6rem] w-[3.6rem]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand-mark-transparent.png" alt="" className="h-full w-full object-contain" />
            </div>
            <span className="font-bold text-[22px] tracking-[-0.02em] text-white/90 group-hover:text-white transition-colors flex items-center gap-0.5 whitespace-nowrap">
              <span>Chivox</span>
              <span className="bg-gradient-to-r from-[#1D72E8] to-[#F01681] bg-clip-text text-transparent">MCP</span>
            </span>
          </Link>

          <div className="flex-1 flex flex-col justify-center py-10 max-w-sm">
            <span className="inline-flex items-center gap-2 text-[10px] tracking-[0.25em] uppercase text-white/40 mb-5">
              <span className="w-3 h-px bg-white/30" />
              {tx('Create your account')}
            </span>
            <h1 className="text-[30px] xl:text-[34px] font-semibold tracking-[-0.015em] leading-[1.15] mb-4">
              {tx('Start shipping')}{' '}
              <span className="bg-gradient-to-r from-white via-white/85 to-white/40 bg-clip-text text-transparent">
                {tx('speech-grade MCP')}
              </span>
            </h1>
            <p className="text-[13px] text-white/50 leading-relaxed mb-7">
              {tx(
                'Free to start. One Starter API key is included so you can wire up your first MCP client today.',
              )}
            </p>
            <ul className="space-y-3">
              {[
                { t: 'Starter key with free monthly quota', d: 'Try every tool with no credit card up front' },
                { t: 'Pay-as-you-go after that', d: 'Per-1K-call pricing with automatic volume discounts' },
                { t: 'Bring your team', d: 'Invite teammates with role-based access' },
              ].map((f) => (
                <li key={f.t} className="flex items-start gap-3">
                  <div className="mt-0.5 h-5 w-5 rounded-md border border-white/10 bg-white/[0.04] flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 text-white/70" strokeWidth={2.5} />
                  </div>
                  <div>
                    <div className="text-[13px] font-medium text-white/85 leading-tight">{tx(f.t)}</div>
                    <div className="text-[11px] text-white/40 mt-1 leading-relaxed">{tx(f.d)}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-10 bg-background relative">
        <div className="w-full max-w-[400px] relative z-10">
          <Link href="/global" className="lg:hidden flex items-center gap-[5px] mb-8 whitespace-nowrap" aria-label="Back to Chivox MCP home">
            <div className="relative h-[3.6rem] w-[3.6rem]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand-mark-transparent.png" alt="" className="h-full w-full object-contain" />
            </div>
            <span className="font-bold text-[22px] tracking-[-0.02em] leading-none flex items-center gap-0.5 whitespace-nowrap">
              <span>Chivox</span>
              <span className="bg-gradient-to-r from-[#1D72E8] to-[#F01681] bg-clip-text text-transparent">MCP</span>
            </span>
          </Link>

          <div className="mb-6">
            <h2 className="text-[22px] font-semibold tracking-[-0.015em]">
              {tx('Create your account')}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {tx('Get a Starter API key in under a minute.')}
            </p>
          </div>

          <OAuthButtons />

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/60" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-3 text-[11px] text-muted-foreground/60 uppercase tracking-wider">
                {tx('or with email')}
              </span>
            </div>
          </div>

          {error && (
            <div className="mb-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs px-3 py-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                {tx('Your name')}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <input
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full h-10 pl-9 pr-3 text-sm rounded-lg border border-border bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-foreground/30 transition-all placeholder:text-muted-foreground/40"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                {tx('Email address')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  placeholder="you@example.com"
                  className="w-full h-10 pl-9 pr-3 text-sm rounded-lg border border-border bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-foreground/30 transition-all placeholder:text-muted-foreground/40"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                {tx('Password')}
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={tx('At least 6 characters')}
                  className="w-full h-10 pl-9 pr-10 text-sm rounded-lg border border-border bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-foreground/30 transition-all placeholder:text-muted-foreground/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? tx('Hide password') : tx('Show password')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 inline-flex items-center justify-center rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                {tx('Confirm password')}
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={tx('Re-enter your password')}
                  className={`w-full h-10 pl-9 pr-10 text-sm rounded-lg border bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all placeholder:text-muted-foreground/40 ${
                    confirmTouched && !passwordsMatch
                      ? 'border-destructive/60 focus:border-destructive'
                      : 'border-border focus:border-foreground/30'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={showConfirmPassword ? tx('Hide password') : tx('Show password')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 inline-flex items-center justify-center rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted/60 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmTouched && !passwordsMatch && (
                <p className="mt-1.5 text-[11px] text-destructive">
                  {t('Passwords do not match.', '两次输入的密码不一致。')}
                </p>
              )}
            </div>

            <AntiBot verified={antiBotOk} onVerifiedChange={setAntiBotOk} />

            <label className="flex items-start gap-2 text-[11px] text-muted-foreground leading-relaxed">
              <input
                type="checkbox"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
                className="mt-0.5 h-3.5 w-3.5 rounded border-border"
              />
              <span>
                {t('I agree to the ', '我同意')}
                <a className="underline underline-offset-2 hover:text-foreground" href="#">
                  {tx('Terms of Service')}
                </a>
                {t(' and ', ' 和 ')}
                <a className="underline underline-offset-2 hover:text-foreground" href="#">
                  {tx('Privacy Policy')}
                </a>
                {t('.', '。')}
              </span>
            </label>

            <button
              type="submit"
              disabled={!canSubmit}
              className="group w-full h-10 text-sm font-semibold rounded-lg bg-foreground text-background hover:brightness-110 active:brightness-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="h-3.5 w-3.5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                  {tx('Creating account')}
                </>
              ) : (
                <>
                  {tx('Create account')}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          <p className="text-xs text-center text-muted-foreground mt-6">
            {t('Already have an account?', '已有账号？')}{' '}
            <Link
              href="/login"
              className="text-foreground font-medium hover:underline underline-offset-4"
            >
              {t('Sign in', '登录')}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
