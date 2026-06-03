'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, KeyRound, Mail, ShieldCheck } from 'lucide-react';
import { useLang } from '../_lib/use-lang';
import { AntiBot } from '../_components/anti-bot';
import { OtpInput } from '../_components/otp-input';
import { auth, describeError } from '../_lib/api';

// Three-step recovery flow (wired to the real backend):
//   request → enter email, receive a reset code  (POST /api/auth/forgot-password)
//   reset   → enter code + new password          (POST /api/auth/reset-password)
//   done    → confirmation, back to sign in
type Step = 'request' | 'reset' | 'done';

export default function DevEnForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordContent />
    </Suspense>
  );
}

function ForgotPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, tx } = useLang();

  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState(() => searchParams.get('email')?.trim() ?? '');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [antiBotOk, setAntiBotOk] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => window.clearInterval(id);
  }, [cooldown]);

  const identifier = email.trim();
  const identifierValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
  const codeValid = /^\d{6}$/.test(code);
  const passwordValid = newPassword.length >= 6;
  const passwordsMatch = newPassword === confirmPassword;

  const canRequest = identifierValid && antiBotOk && !submitting;
  const canReset = codeValid && passwordValid && passwordsMatch && !submitting;

  // ── Step 1: request a reset code ──────────────────────────────────────
  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!identifierValid) {
      setError(t('Please enter a valid email address.', '请输入有效的邮箱地址。'));
      return;
    }
    setSubmitting(true);
    try {
      await auth.forgotPassword({ email: identifier });
    } catch (err) {
      setSubmitting(false);
      setError(describeError(err));
      return;
    }
    setSubmitting(false);
    setStep('reset');
    setCooldown(60);
    setInfo(
      t(
        `If an account exists for ${identifier}, a 6-digit reset code is on its way.`,
        `如果 ${identifier} 已注册，6 位重置验证码即将送达。`,
      ),
    );
  };

  // Resend the code without leaving step 2.
  const handleResend = async () => {
    if (cooldown > 0 || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await auth.forgotPassword({ email: identifier });
    } catch (err) {
      setSubmitting(false);
      setError(describeError(err));
      return;
    }
    setSubmitting(false);
    setCooldown(60);
    setInfo(t(`A new code was sent to ${identifier}.`, `新的验证码已发送至 ${identifier}。`));
  };

  // ── Step 2: submit the new password ───────────────────────────────────
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!codeValid) {
      setError(t('Enter the 6-digit code from your email.', '请输入邮箱里的 6 位验证码。'));
      return;
    }
    if (!passwordValid) {
      setError(t('Password must be at least 6 characters.', '密码至少 6 位。'));
      return;
    }
    if (!passwordsMatch) {
      setError(t('The two passwords do not match.', '两次输入的密码不一致。'));
      return;
    }
    setSubmitting(true);
    try {
      await auth.resetPassword({ email: identifier, code, new_password: newPassword });
    } catch (err) {
      setSubmitting(false);
      setError(describeError(err));
      return;
    }
    setSubmitting(false);
    setStep('done');
  };

  return (
    <main className="min-h-dvh flex bg-background text-foreground">
      {/* Left marketing panel — mirrors the sign-in page so the recovery
          flow doesn't feel like a different product. */}
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
              {t('Account recovery', '账号恢复')}
            </span>
            <h1 className="text-[30px] xl:text-[34px] font-semibold tracking-[-0.015em] leading-[1.15] mb-4">
              {t('Reset your', '重新设置你的')}{' '}
              <span className="bg-gradient-to-r from-white via-white/85 to-white/40 bg-clip-text text-transparent">
                {t('password', '密码')}
              </span>
            </h1>
            <p className="text-[13px] text-white/50 leading-relaxed mb-7">
              {t(
                'We email a one-time code to verify it is really you, then you choose a new password. The code expires shortly for your security.',
                '我们会向你的邮箱发送一次性验证码以确认是本人操作，随后你即可设置新密码。出于安全考虑，验证码会很快过期。',
              )}
            </p>
            <ul className="space-y-3">
              {[
                { t: t('Email-verified reset', '邮箱验证重置'), d: t('Codes are single-use and time-limited.', '验证码一次性使用、限时有效。') },
                { t: t('Your keys stay safe', 'API 密钥不受影响'), d: t('API keys are unaffected by a password change.', '修改密码不会影响已有的 API 密钥。') },
                { t: t('Signed in everywhere?', '多端登录？'), d: t('Resetting does not sign other sessions out.', '重置密码不会强制退出其他会话。') },
              ].map((f) => (
                <li key={f.t} className="flex items-start gap-3">
                  <div className="mt-0.5 h-5 w-5 rounded-md border border-white/10 bg-white/[0.04] flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 text-white/70" strokeWidth={2.5} />
                  </div>
                  <div>
                    <div className="text-[13px] font-medium text-white/85 leading-tight">{f.t}</div>
                    <div className="text-[11px] text-white/40 mt-1 leading-relaxed">{f.d}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Right form column */}
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

          {step !== 'done' && (
            <Link
              href="/login"
              className="inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground mb-5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t('Back to sign in', '返回登录')}
            </Link>
          )}

          {error && (
            <div className="mb-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs px-3 py-2">
              {error}
            </div>
          )}
          {info && step !== 'done' && (
            <div className="mb-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300/40 text-emerald-700 dark:text-emerald-300 text-xs px-3 py-2">
              {info}
            </div>
          )}

          {step === 'request' && (
            <>
              <div className="mb-6">
                <h2 className="text-[22px] font-semibold tracking-[-0.015em]">
                  {t('Forgot your password?', '忘记密码了？')}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {t(
                    'Enter your account email and we will send a reset code.',
                    '输入账号邮箱，我们会发送重置验证码。',
                  )}
                </p>
              </div>

              <form onSubmit={handleRequest} className="space-y-3.5">
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

                <AntiBot verified={antiBotOk} onVerifiedChange={setAntiBotOk} />

                <button
                  type="submit"
                  disabled={!canRequest}
                  className="group w-full h-10 text-sm font-semibold rounded-lg bg-foreground text-background hover:brightness-110 active:brightness-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <span className="h-3.5 w-3.5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                      {t('Sending…', '发送中…')}
                    </>
                  ) : (
                    <>
                      {t('Send reset code', '发送重置验证码')}
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </form>

              <p className="text-xs text-center text-muted-foreground mt-6">
                {t('Remembered it?', '想起来了？')}{' '}
                <Link href="/login" className="text-foreground font-medium hover:underline underline-offset-4">
                  {t('Sign in', '去登录')}
                </Link>
              </p>
            </>
          )}

          {step === 'reset' && (
            <>
              <div className="mb-6">
                <h2 className="text-[22px] font-semibold tracking-[-0.015em]">
                  {t('Set a new password', '设置新密码')}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {t(
                    `Enter the 6-digit code sent to ${identifier} and choose a new password.`,
                    `输入发送至 ${identifier} 的 6 位验证码，并设置新密码。`,
                  )}
                </p>
              </div>

              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    {tx('Verification code')}
                  </label>
                  <OtpInput value={code} onChange={setCode} disabled={submitting} ariaLabel={tx('Verification code')} />
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">
                      {t(`Sent to ${identifier}`, `已发送至 ${identifier}`)}
                    </span>
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={cooldown > 0 || submitting}
                      className="font-medium text-foreground hover:underline disabled:text-muted-foreground/60 disabled:no-underline disabled:cursor-not-allowed"
                    >
                      {cooldown > 0
                        ? t(`Resend in ${cooldown}s`, `${cooldown} 秒后重发`)
                        : t('Resend code', '重新发送')}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    {t('New password', '新密码')}
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setError(null);
                      }}
                      placeholder={t('At least 6 characters', '至少 6 位')}
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
                    {t('Confirm new password', '确认新密码')}
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError(null);
                      }}
                      placeholder={t('Re-enter the new password', '再次输入新密码')}
                      className="w-full h-10 pl-9 pr-3 text-sm rounded-lg border border-border bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-foreground/30 transition-all placeholder:text-muted-foreground/40"
                    />
                  </div>
                  {confirmPassword.length > 0 && !passwordsMatch && (
                    <p className="mt-1 text-[11px] text-red-500">
                      {t('Passwords do not match.', '两次密码不一致。')}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!canReset}
                  className="group w-full h-10 text-sm font-semibold rounded-lg bg-foreground text-background hover:brightness-110 active:brightness-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <span className="h-3.5 w-3.5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                      {t('Resetting…', '重置中…')}
                    </>
                  ) : (
                    <>
                      {t('Reset password', '重置密码')}
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('request');
                      setCode('');
                      setError(null);
                      setInfo(null);
                    }}
                    className="text-[12px] font-medium text-foreground underline underline-offset-4 decoration-border hover:decoration-foreground transition-colors"
                  >
                    {t('Use a different email', '换一个邮箱')}
                  </button>
                </div>
              </form>
            </>
          )}

          {step === 'done' && (
            <div className="text-center">
              <div className="mx-auto mb-5 h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <ShieldCheck className="h-7 w-7 text-emerald-500" />
              </div>
              <h2 className="text-[22px] font-semibold tracking-[-0.015em]">
                {t('Password reset', '密码已重置')}
              </h2>
              <p className="text-sm text-muted-foreground mt-2 mb-6">
                {t(
                  'Your password has been updated. You can now sign in with your new password.',
                  '密码已更新，现在可以使用新密码登录了。',
                )}
              </p>
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="group w-full h-10 text-sm font-semibold rounded-lg bg-foreground text-background hover:brightness-110 active:brightness-95 transition-all flex items-center justify-center gap-2"
              >
                {t('Back to sign in', '返回登录')}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
