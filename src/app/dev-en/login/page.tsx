'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowRight, AudioWaveform, Check, Eye, EyeOff, KeyRound, Mail, Play } from 'lucide-react';
import { useAuth } from '../_lib/auth-context';
import { useLang } from '../_lib/use-lang';
import { OAuthButtons } from '../_components/oauth-buttons';
import { AntiBot } from '../_components/anti-bot';
import { OtpInput } from '../_components/otp-input';

type Mode = 'password' | 'otp';

export default function DevEnLoginPage() {
  const router = useRouter();
  const { user, loginWithPassword, sendOtp, verifyOtp, loginAsDemo } = useAuth();
  const { t, tx } = useLang();

  const [mode, setMode] = useState<Mode>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [antiBotOk, setAntiBotOk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) router.replace('/dashboard/overview');
  }, [user, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => window.clearInterval(t);
  }, [cooldown]);

  const identifier = email.trim();
  const identifierValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
  const codeValid = /^\d{6}$/.test(code);
  const passwordValid = password.length >= 6;

  const canSubmitOtp = codeSent && identifierValid && codeValid && antiBotOk && !submitting;
  const canSubmitPassword = identifierValid && passwordValid && antiBotOk && !submitting;

  const handleSendCode = async () => {
    setError(null);
    setInfo(null);
    if (!identifierValid) {
      setError(t('Please enter a valid email address.', '请输入有效的邮箱地址。'));
      return;
    }
    setSubmitting(true);
    const res = await sendOtp(identifier);
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error ?? t('Failed to send code.', '发送验证码失败。'));
      if (res.retryAfterSec) setCooldown(res.retryAfterSec);
      return;
    }
    setCodeSent(true);
    setCooldown(60);
    setInfo(t(`A verification code was sent to ${identifier}.`, `验证码已发送至 ${identifier}。`));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);
    try {
      let res: { ok: boolean; error?: string };
      if (mode === 'otp') {
        if (!canSubmitOtp) return;
        res = await verifyOtp(identifier, code);
      } else {
        if (!canSubmitPassword) return;
        res = await loginWithPassword(identifier, password);
      }
      if (!res.ok) {
        setError(res.error ?? t('Sign-in failed. Please try again.', '登录失败，请重试。'));
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
          <Link href="/global" className="flex items-center gap-2.5 group" aria-label="Back to Chivox MCP home">
            <div className="relative h-8 w-8 rounded-lg bg-white flex items-center justify-center shadow-lg shadow-white/10">
              <AudioWaveform className="h-4 w-4 text-zinc-950" />
              <span className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400 ring-2 ring-zinc-900" />
            </div>
            <span className="font-bold text-lg tracking-[-0.02em] text-white/90 group-hover:text-white transition-colors flex items-baseline gap-1">
              <span>Chivox</span>
              <span className="bg-gradient-to-r from-indigo-300 via-sky-300 to-emerald-300 bg-clip-text text-transparent">
                MCP
              </span>
            </span>
          </Link>

          <div className="flex-1 flex flex-col justify-center py-10 max-w-sm">
            <span className="inline-flex items-center gap-2 text-[10px] tracking-[0.25em] uppercase text-white/40 mb-5">
              <span className="w-3 h-px bg-white/30" />
              {tx('Developer Console')}
            </span>
            <h1 className="text-[30px] xl:text-[34px] font-semibold tracking-[-0.015em] leading-[1.15] mb-4">
              {tx('Build with')}{' '}
              <span className="bg-gradient-to-r from-white via-white/85 to-white/40 bg-clip-text text-transparent">
                {tx('speech-grade MCP')}
              </span>
            </h1>
            <p className="text-[13px] text-white/50 leading-relaxed mb-7">
              {tx(
                'Ship exam-grade speech evaluation to any LLM with a single standard protocol.',
              )}
            </p>
            <ul className="space-y-3">
              {[
                { t: '16 evaluation tools auto-registered', d: 'Bilingual core · word / sentence / paragraph' },
                { t: 'Phoneme-level scoring', d: 'mispron / omit / insert diagnostics' },
                { t: 'Standard MCP, zero integration cost', d: 'stdio + Streamable HTTP' },
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
          <Link href="/global" className="lg:hidden flex items-center gap-2.5 mb-8" aria-label="Back to Chivox MCP home">
            <div className="relative h-8 w-8 rounded-lg bg-gradient-to-br from-foreground to-foreground/80 flex items-center justify-center shadow-sm ring-1 ring-foreground/10">
              <AudioWaveform className="h-4 w-4 text-background" strokeWidth={2.3} />
              <span className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-background" />
            </div>
            <span className="font-bold tracking-[-0.02em] text-lg leading-none flex items-baseline gap-1">
              <span>Chivox</span>
              <span className="bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500 bg-clip-text text-transparent">
                MCP
              </span>
            </span>
          </Link>

          <div className="mb-6">
            <h2 className="text-[22px] font-semibold tracking-[-0.015em]">
              {tx('Sign in to Chivox MCP')}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {tx('Welcome back, developer.')}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              loginAsDemo();
              router.push('/dashboard/overview');
            }}
            className="group w-full h-11 text-sm font-semibold rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 active:brightness-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 mb-4"
          >
            <Play className="h-4 w-4" />
            {t('Try Demo Account', '体验账号登录')}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
          <p className="text-[11px] text-center text-muted-foreground mb-4">
            {t('No registration required. Explore with sample data.', '无需注册，使用样例数据探索功能。')}
          </p>

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
          {info && (
            <div className="mb-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300/40 text-emerald-700 dark:text-emerald-300 text-xs px-3 py-2">
              {info}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
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

            {mode === 'password' ? (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  {tx('Password')}
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={tx('Your password')}
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
            ) : (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  {tx('Verification code')}
                </label>
                <OtpInput
                  value={code}
                  onChange={setCode}
                  disabled={submitting}
                  ariaLabel={tx('Verification code')}
                />
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">
                    {codeSent
                      ? t(`Sent to ${identifier}`, `已发送至 ${identifier}`)
                      : t(
                          'Enter the email above and request a code.',
                          '输入上方邮箱后获取验证码。',
                        )}
                  </span>
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={cooldown > 0 || !identifierValid || submitting}
                    className="font-medium text-foreground hover:underline disabled:text-muted-foreground/60 disabled:no-underline disabled:cursor-not-allowed"
                  >
                    {cooldown > 0
                      ? t(`Resend in ${cooldown}s`, `${cooldown} 秒后重发`)
                      : codeSent
                        ? tx('Resend code')
                        : tx('Send code')}
                  </button>
                </div>
              </div>
            )}

            <AntiBot verified={antiBotOk} onVerifiedChange={setAntiBotOk} />

            <button
              type="submit"
              disabled={mode === 'otp' ? !canSubmitOtp : !canSubmitPassword}
              className="group w-full h-10 text-sm font-semibold rounded-lg bg-foreground text-background hover:brightness-110 active:brightness-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="h-3.5 w-3.5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                  {tx('Signing in')}
                </>
              ) : (
                <>
                  {tx('Sign in')}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'password' ? 'otp' : 'password');
                  setError(null);
                  setInfo(null);
                  setCode('');
                  setPassword('');
                }}
                className="text-[12px] font-medium text-foreground underline underline-offset-4 decoration-border hover:decoration-foreground transition-colors"
              >
                {mode === 'password'
                  ? t('Sign in with a one-time code instead', '改用邮箱验证码登录')
                  : t('Sign in with a password instead', '改用密码登录')}
              </button>
            </div>
          </form>

          <p className="text-xs text-center text-muted-foreground mt-6">
            {t('New to Chivox MCP?', '初次使用 Chivox MCP？')}{' '}
            <Link
              href="/register"
              className="text-foreground font-medium hover:underline underline-offset-4"
            >
              {t('Create an account', '注册账号')}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
