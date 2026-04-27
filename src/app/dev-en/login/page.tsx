'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowRight, AudioWaveform, Check, Mail } from 'lucide-react';
import { useMockAuth } from '../_lib/mock-auth';
import { useLang } from '../_lib/use-lang';
import { OAuthButtons } from '../_components/oauth-buttons';
import { AntiBot } from '../_components/anti-bot';

// Phone OTP was intentionally removed: Western developer audiences tend to
// consider sharing a mobile number a privacy red flag, and GitHub / Google /
// Microsoft OAuth plus email OTP cover effectively every real-world sign-in
// need for this console. If we ever re-introduce phone it should live behind
// an enterprise / locale flag rather than the default B2C flow.
export default function DevEnLoginPage() {
  const router = useRouter();
  const { login, user } = useMockAuth();
  const { t, tx } = useLang();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [antiBotOk, setAntiBotOk] = useState(false);
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const canSubmit = codeSent && identifierValid && codeValid && antiBotOk && terms && !submitting;

  const handleSendCode = () => {
    setError(null);
    if (!identifierValid) {
      setError(t('Please enter a valid email address.', '请输入有效的邮箱地址。'));
      return;
    }
    setCodeSent(true);
    setCooldown(30);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await login({ method: 'email', identifier });
      router.push('/dashboard/overview');
    } catch {
      setError(t('Sign-in failed. Please try again.', '登录失败，请重试。'));
      setSubmitting(false);
    }
  };

  const codeHint = codeSent
    ? t(
        `Demo tip — any 6-digit code works. Your code was sent to ${identifier}.`,
        `演示提示 — 任意 6 位数字均可通过。验证码已发送至 ${identifier}。`,
      )
    : t(
        'A 6-digit code will be sent to verify this is you.',
        '我们将发送一个 6 位数验证码以验证你的身份。',
      );

  return (
    <main className="min-h-dvh flex bg-background text-foreground">
      {/* Left — Brand Panel */}
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
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />

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
              {tx('Developer Console · Preview')}
            </span>
            <h1 className="text-[30px] xl:text-[34px] font-semibold tracking-[-0.015em] leading-[1.15] mb-4">
              {tx('Build with')}{' '}
              <span className="bg-gradient-to-r from-white via-white/85 to-white/40 bg-clip-text text-transparent">
                {tx('speech-grade MCP')}
              </span>
            </h1>
            <p className="text-[13px] text-white/50 leading-relaxed mb-7">
              {tx(
                'Ship exam-grade speech evaluation to any LLM with a single standard protocol. One config works across Cursor, Claude Desktop, Dify, Coze and custom agents.',
              )}
            </p>

            <ul className="space-y-3 mb-7">
              {[
                {
                  t: '16 evaluation tools auto-registered',
                  d: 'Bilingual core · word / sentence / paragraph / semi-open / dialogue',
                },
                {
                  t: 'Phoneme-level dp_type + multi-dim scores',
                  d: 'Feed mispron / omit / insert straight into the LLM for diagnosis',
                },
                {
                  t: 'Standard MCP, zero integration cost',
                  d: 'stdio + Streamable HTTP, tools auto-discovered by every client',
                },
              ].map((f) => (
                <li key={f.t} className="flex items-start gap-3">
                  <div className="mt-0.5 h-5 w-5 rounded-md border border-white/10 bg-white/[0.04] flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 text-white/70" strokeWidth={2.5} />
                  </div>
                  <div>
                    <div className="text-[13px] font-medium text-white/85 leading-tight">
                      {tx(f.t)}
                    </div>
                    <div className="text-[11px] text-white/40 mt-1 leading-relaxed">
                      {tx(f.d)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] overflow-hidden backdrop-blur-sm">
              <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/[0.06]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
                <span className="text-[10px] text-white/40 font-mono">
                  live · mcp-response.json
                </span>
                <span className="ml-auto text-[9px] text-emerald-400/70 font-mono tracking-wider">
                  200 OK
                </span>
              </div>
              <pre className="text-[10.5px] font-mono p-3 leading-relaxed text-white/80 whitespace-pre">
                <span className="text-white/30">{'{'}</span>
                {'\n  '}
                <span className="text-emerald-300/80">&quot;overall&quot;</span>:{' '}
                <span className="text-amber-300/90">85</span>,{'\n  '}
                <span className="text-emerald-300/80">&quot;pron&quot;</span>:{' '}
                <span className="text-white/30">{'{ accuracy: '}</span>
                <span className="text-amber-300/90">82</span>
                <span className="text-white/30">{', fluency: '}</span>
                <span className="text-amber-300/90">88</span>
                <span className="text-white/30">{' }'}</span>,{'\n'}
                <span className="text-white/30">{'}'}</span>
              </pre>
            </div>
          </div>

          <div className="flex gap-8 pt-6 border-t border-white/[0.06]">
            {[
              { value: '16', label: 'evaluation tools' },
              { value: 'EN/CN', label: 'bilingual core' },
              { value: '99.9%', label: 'service uptime' },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-xl font-bold tabular-nums text-white/90">
                  {s.value}
                </div>
                <div className="text-[11px] text-white/35 mt-0.5">{tx(s.label)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 bg-background relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-muted/50 via-background to-background" />

        <div className="w-full max-w-[380px] relative z-10">
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
              {tx('Welcome, developer. Continue with your provider or use a one-time code.')}
            </p>
          </div>

          <OAuthButtons />

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/60" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-3 text-[11px] text-muted-foreground/60 uppercase tracking-wider">
                {tx('or with a one-time code')}
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
                {tx('Verification code')}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder={tx('6-digit code')}
                  className="flex-1 h-10 px-3 text-sm tracking-[0.3em] rounded-lg border border-border bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-foreground/30 transition-all placeholder:text-muted-foreground/40 placeholder:tracking-normal"
                />
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={cooldown > 0 || !identifierValid}
                  className="h-10 px-3.5 min-w-[110px] text-xs font-medium rounded-lg border border-border bg-background hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {cooldown > 0
                    ? t(`Resend in ${cooldown}s`, `${cooldown} 秒后重发`)
                    : codeSent
                      ? tx('Resend code')
                      : tx('Send code')}
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground/70 mt-1.5 leading-relaxed">
                {codeHint}
              </p>
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
              className="group w-full h-10 text-sm font-semibold rounded-lg bg-foreground text-background shadow-[0_1px_2px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.1)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.1)] hover:brightness-110 active:brightness-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="h-3.5 w-3.5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                  {tx('Signing in')}
                </>
              ) : (
                <>
                  {tx('Continue')}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          <p className="text-xs text-center text-muted-foreground mt-6">
            {t('New to Chivox MCP?', '初次使用 Chivox MCP？')}{' '}
            <button
              type="button"
              onClick={() => {
                setEmail('dev@example.com');
                setCodeSent(true);
                setCode('000000');
                setAntiBotOk(true);
                setTerms(true);
              }}
              className="text-foreground font-medium hover:underline underline-offset-4"
            >
              {tx('Fill demo credentials')}
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}
