'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  AudioWaveform,
  Braces,
  Check,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Languages,
  Mail,
  Play,
  Radio,
} from 'lucide-react';
import { useAuth } from '../_lib/auth-context';
import { useLang } from '../_lib/use-lang';
import { OAuthButtons } from '../_components/oauth-buttons';
import { AntiBot } from '../_components/anti-bot';
import { LegalAgreementCheckbox } from '../_components/legal-agreement-checkbox';
import { PUBLIC_MCP_URL } from '@/config/endpoints';

export default function DevEnLoginPage() {
  const router = useRouter();
  const { user, loginWithPassword, loginAsDemo } = useAuth();
  const { t, tx } = useLang();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [antiBotOk, setAntiBotOk] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [endpointCopied, setEndpointCopied] = useState(false);

  useEffect(() => {
    if (user) router.replace('/dashboard/overview');
  }, [user, router]);

  const identifier = email.trim();
  const identifierValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
  const passwordValid = password.length >= 6;
  const forgotPasswordHref = identifier
    ? `/forgot-password?email=${encodeURIComponent(identifier)}`
    : '/forgot-password';

  // The button stays clickable; on submit we surface the first unmet step in
  // the top error banner so the user knows exactly what's blocking sign-in.
  const disabledReason = (() => {
    if (!identifierValid) return t('Enter a valid email address.', '请输入有效的邮箱地址。');
    if (!passwordValid) return t('Password must be at least 6 characters.', '密码至少需要 6 位。');
    if (!antiBotOk) return t('Complete the human verification above.', '请先完成上方的人机验证。');
    if (!termsAccepted)
      return t(
        'Tick the box to accept the Terms and Privacy Policy.',
        '请勾选同意《服务条款》与《隐私政策》。',
      );
    return null;
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (disabledReason) {
      setError(disabledReason);
      return;
    }
    setSubmitting(true);
    try {
      const res = await loginWithPassword(identifier, password);
      if (!res.ok) {
        setError(res.error ?? t('Sign-in failed. Please try again.', '登录失败，请重试。'));
        return;
      }
      router.push('/dashboard/overview');
    } finally {
      setSubmitting(false);
    }
  };

  const copyEndpoint = async () => {
    try {
      await navigator.clipboard.writeText(PUBLIC_MCP_URL);
      setEndpointCopied(true);
      window.setTimeout(() => setEndpointCopied(false), 1600);
    } catch {
      // Clipboard access is optional; the endpoint remains selectable below.
    }
  };

  return (
    <main className="flex min-h-dvh bg-background text-foreground lg:h-dvh lg:overflow-hidden">
      <div className="relative hidden overflow-hidden border-r border-white/[0.07] bg-[#080b0a] text-white lg:flex lg:h-dvh lg:w-1/2 xl:w-[52%]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(16,185,129,0.16),transparent_31%),radial-gradient(circle_at_90%_84%,rgba(29,114,232,0.10),transparent_34%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-[41%] h-px bg-gradient-to-r from-transparent via-emerald-400/18 to-transparent" />

        <div className="relative z-10 flex w-full flex-col px-10 py-8 xl:px-[clamp(3.5rem,4.5vw,5rem)] xl:py-10">
          <div className="flex items-center justify-between gap-6">
            <Link href="/global" className="group flex items-center gap-1 whitespace-nowrap" aria-label="Back to Chivox MCP home">
              <Image src="/brand-mark-transparent.png" alt="" width={42} height={25} className="h-[25px] w-[42px] object-contain" priority />
              <span className="flex items-center gap-0.5 whitespace-nowrap text-[20px] font-bold tracking-[-0.02em] text-white/90 transition-colors group-hover:text-white">
                <span>Chivox</span>
                <span className="bg-gradient-to-r from-[#3b8cff] to-[#ff348f] bg-clip-text text-transparent">MCP</span>
              </span>
            </Link>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-white/50">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
              {t('Console online', '控制台在线')}
            </span>
          </div>

          <div className="flex flex-1 flex-col justify-center py-8 xl:py-10">
            <div className="w-full max-w-[520px]">
              <span className="mb-4 inline-flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.26em] text-emerald-300/75">
                <span className="h-px w-6 bg-emerald-300/55" />
                {t('Developer Console', '开发者控制台')}
              </span>
              <h1 className="mb-4 text-[38px] font-semibold leading-[1.07] tracking-[-0.038em] xl:text-[46px]">
                {t('Speech assessment,', '把语音评测，')}
                <br />
                <span className="bg-gradient-to-r from-white via-white/95 to-white/62 bg-clip-text text-transparent">
                  {t('ready for every agent.', '接入每一个智能体。')}
                </span>
              </h1>
              <p className="max-w-[490px] text-[14px] leading-6 text-white/62 xl:text-[15px]">
                {t(
                  'Connect exam-grade English and Mandarin evaluation to any LLM through one standard MCP server.',
                  '通过一个标准 MCP Server，把考试级中英语音评测接入任意 LLM。',
                )}
              </p>

              <div className="mt-7 overflow-hidden rounded-[22px] border border-white/[0.13] bg-white/[0.06] shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-sm">
                <div className="flex items-center justify-between gap-4 border-b border-white/[0.09] px-5 py-4 xl:px-6">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-300/25 bg-emerald-300/[0.09] text-emerald-300">
                      <Braces className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/42">Streamable HTTP</p>
                      <button
                        type="button"
                        onClick={copyEndpoint}
                        className="group/copy mt-0.5 flex max-w-full items-center gap-2 text-left font-mono text-[11px] text-white/78 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/40"
                        title={t('Copy MCP endpoint', '复制 MCP 地址')}
                        aria-label={t('Copy MCP endpoint', '复制 MCP 地址')}
                      >
                        <span className="truncate">{PUBLIC_MCP_URL.replace(/^https?:\/\//, '')}</span>
                        {endpointCopied ? (
                          <Check className="h-3 w-3 shrink-0 text-emerald-300" />
                        ) : (
                          <Copy className="h-3 w-3 shrink-0 text-white/35 transition-colors group-hover/copy:text-white/70" />
                        )}
                      </button>
                    </div>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-300/25 bg-emerald-300/[0.09] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-emerald-300">
                    <Radio className="h-3 w-3" />
                    {t('Connected', '已连接')}
                  </span>
                </div>

                <ul className="divide-y divide-white/[0.08] px-5 xl:px-6">
                  {[
                    {
                      icon: AudioWaveform,
                      title: t('16 tools, auto-registered', '16 个工具，自动注册'),
                      detail: t('Word · sentence · paragraph', '字 · 词 · 句'),
                    },
                    {
                      icon: Languages,
                      title: t('English + Mandarin scoring', '中英语音评测'),
                      detail: t('Pronunciation · fluency · phonemes', '发音 · 流利度 · 音素'),
                    },
                    {
                      icon: Check,
                      title: t('Structured evidence, ready to use', '结构化证据，开箱即用'),
                      detail: t('mispron · omit · insert diagnostics', '错读 · 漏读 · 增读诊断'),
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.title} className="flex items-center gap-3.5 py-3.5 xl:py-4">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-white/70">
                          <Icon className="h-4 w-4" strokeWidth={1.8} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-medium leading-5 text-white/88 xl:text-[13px]">{item.title}</p>
                          <p className="truncate text-[10px] leading-4 text-white/45 xl:text-[11px]">{item.detail}</p>
                        </div>
                        <Check className="h-3.5 w-3.5 shrink-0 text-emerald-300/75" strokeWidth={2.2} />
                      </li>
                    );
                  })}
                </ul>

                <div className="flex items-center gap-4 border-t border-white/[0.09] bg-black/10 px-5 py-3 font-mono text-[9px] uppercase tracking-[0.16em] text-white/42 xl:px-6">
                  <span>Remote MCP</span>
                  <span className="h-1 w-1 rounded-full bg-white/20" />
                  <span>Streamable HTTP</span>
                  <span className="ml-auto text-emerald-300/65">EN + ZH</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-5 border-t border-white/[0.08] pt-4 text-[10px] text-white/42">
            <span>{t('Built for production speech products', '为生产级语音产品打造')}</span>
            <span className="inline-flex items-center gap-1.5 font-mono uppercase tracking-[0.14em]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {t('All systems ready', '服务就绪')}
            </span>
          </div>
        </div>
      </div>

      <div className="relative flex min-h-dvh flex-1 items-start justify-center overflow-y-auto bg-background px-5 sm:px-8 lg:h-dvh lg:min-h-0 lg:px-10">
        <div className="relative z-10 my-auto w-full max-w-[410px] py-7 sm:py-9">
          <Link href="/global" className="mb-8 flex items-center gap-1.5 whitespace-nowrap lg:hidden" aria-label="Back to Chivox MCP home">
            <Image src="/brand-mark-transparent.png" alt="" width={42} height={25} className="h-[25px] w-[42px] object-contain" priority />
            <span className="flex items-center gap-0.5 whitespace-nowrap text-[21px] font-bold leading-none tracking-[-0.02em]">
              <span>Chivox</span>
              <span className="bg-gradient-to-r from-[#1D72E8] to-[#F01681] bg-clip-text text-transparent">MCP</span>
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

          <p className="mt-2 text-[10px] text-center text-muted-foreground leading-relaxed">
            {t(
              'By continuing with GitHub or Google, you agree to our ',
              '使用 GitHub 或 Google 继续即表示您同意我们的',
            )}
            <Link href="/legal/terms" target="_blank" className="underline underline-offset-2">
              {t('Terms of Service', '《服务条款》')}
            </Link>
            {t(' and ', ' 与 ')}
            <Link href="/legal/privacy" target="_blank" className="underline underline-offset-2">
              {t('Privacy Policy', '《隐私政策》')}
            </Link>
            {t('.', '。')}
          </p>

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

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">
                  {tx('Password')}
                </label>
                <Link
                  href={forgotPasswordHref}
                  className="text-[11px] font-medium text-muted-foreground hover:text-foreground hover:underline underline-offset-4"
                >
                  {t('Forgot password?', '忘记密码？')}
                </Link>
              </div>
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

            <AntiBot verified={antiBotOk} onVerifiedChange={setAntiBotOk} />

            <LegalAgreementCheckbox
              checked={termsAccepted}
              onChange={setTermsAccepted}
              id="login-legal-agreement"
            />

            <button
              type="submit"
              disabled={submitting}
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
