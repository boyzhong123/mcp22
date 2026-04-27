'use client';

import { Link } from '@/i18n/routing';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from '@/i18n/routing';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, Check, AudioWaveform } from 'lucide-react';
import { useState } from 'react';
import { useLocale } from 'next-intl';

export default function RegisterPage() {
  const locale = useLocale();
  const isZh = locale.startsWith('zh');
  const t = {
    errName: isZh ? '请输入名称' : 'Please enter name',
    errEmail: isZh ? '请输入邮箱' : 'Please enter email',
    errEmailValid: isZh ? '请输入有效的邮箱地址' : 'Please enter a valid email address',
    errPassLen: isZh ? '密码至少 6 位' : 'Password must be at least 6 characters',
    errPassMatch: isZh ? '两次输入的密码不一致' : 'Passwords do not match',
    errRegister: isZh ? '注册失败，请重试' : 'Sign up failed, please try again',
    title: isZh ? '创建账号' : 'Create account',
    subtitle: isZh ? '免费注册，立即开始' : 'Sign up free and get started',
    name: isZh ? '名称' : 'Name',
    namePlaceholder: isZh ? '您的名称' : 'Your name',
    email: isZh ? '邮箱' : 'Email',
    password: isZh ? '密码' : 'Password',
    confirmPassword: isZh ? '确认密码' : 'Confirm Password',
    passHint: isZh ? '至少 6 位' : 'At least 6 characters',
    confirmPlaceholder: isZh ? '再次输入' : 'Type again',
    signing: isZh ? '注册中' : 'Signing up',
    create: isZh ? '创建账号' : 'Create Account',
    termsPrefix: isZh ? '注册即表示您同意' : 'By signing up, you agree to',
    terms: isZh ? '服务条款' : 'Terms',
    privacy: isZh ? '隐私政策' : 'Privacy Policy',
    or: isZh ? '或' : 'or',
    hasAccount: isZh ? '已有账号？' : 'Already have an account?',
    goLogin: isZh ? '去登录' : 'Log in',
    heroTitle: isZh ? '开始构建\nAI 口语教学应用' : 'Start building\nAI speaking products',
    heroDesc: isZh ? '注册后即可获取 API Key，接入语音评测能力，只需几分钟即可上手。' : 'Get API keys after sign-up and integrate speech evaluation in minutes.',
    b1: isZh ? '每月 1,000 次免费 API 调用' : '1,000 free API calls per month',
    b2: isZh ? '支持 16 种评测工具' : '16 evaluation tools supported',
    b3: isZh ? '完整的开发者文档' : 'Complete developer docs',
    b4: isZh ? '即时获取 API Key' : 'Instant API key access',
    users: isZh ? '已有 200+ 开发者注册使用' : '200+ developers already registered',
  };
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError(t.errName); return; }
    if (!email.trim()) { setError(t.errEmail); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError(t.errEmailValid); return; }
    if (password.length < 6) { setError(t.errPassLen); return; }
    if (password !== confirmPassword) { setError(t.errPassMatch); return; }

    setLoading(true);
    try {
      const ok = await register(name, email, password);
      if (ok) router.push('/dashboard/keys');
    } catch {
      setError(t.errRegister);
    } finally {
      setLoading(false);
    }
  }

  const benefits = [t.b1, t.b2, t.b3, t.b4];

  const inputCls = "w-full h-10 pl-9 pr-3 text-sm rounded-lg border border-border/80 bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-foreground/30 transition-all placeholder:text-muted-foreground/40";
  const inputWithBtnCls = "w-full h-10 pl-9 pr-10 text-sm rounded-lg border border-border/80 bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-foreground/30 transition-all placeholder:text-muted-foreground/40";

  return (
    <main className="h-dvh flex overflow-hidden">
      {/* Left — Brand Panel */}
      <div className="hidden lg:flex lg:w-[46%] relative bg-zinc-950 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-[0.35]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.04\'/%3E%3C/svg%3E")' }} />
        <div className="absolute -top-1/4 -right-1/4 w-[60%] h-[60%] bg-gradient-to-bl from-white/[0.06] via-transparent to-transparent rounded-full blur-[100px]" />
        <div className="absolute -bottom-1/4 -left-1/4 w-[50%] h-[50%] bg-gradient-to-tr from-white/[0.04] via-transparent to-transparent rounded-full blur-[80px]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />

        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-12 w-full">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative h-8 w-8 rounded-lg bg-white flex items-center justify-center shadow-lg shadow-white/10">
              <AudioWaveform className="h-4 w-4 text-zinc-950" />
              <span className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400 ring-2 ring-zinc-900" />
            </div>
            <span className="font-semibold tracking-[-0.02em] text-white/90 group-hover:text-white transition-colors flex items-baseline gap-1">
              <span>Chivox</span>
              <span className="bg-gradient-to-r from-indigo-300 via-sky-300 to-emerald-300 bg-clip-text text-transparent">MCP</span>
            </span>
          </Link>

          <div className="max-w-xs">
            <h1 className="text-[28px] font-bold tracking-tight leading-[1.2] mb-3">
              {t.heroTitle.split('\n')[0]}<br />{t.heroTitle.split('\n')[1]}
            </h1>
            <p className="text-[13px] text-white/50 leading-relaxed mb-6">
              {t.heroDesc}
            </p>
            <ul className="space-y-2.5">
              {benefits.map(b => (
                <li key={b} className="flex items-center gap-2.5 text-[13px] text-white/70">
                  <span className="h-4.5 w-4.5 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5" />
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          </div>

          <div className="text-[11px] text-white/30">
            {t.users}
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center px-6 bg-background relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-muted/50 via-background to-background" />

        <div className="w-full max-w-[340px] relative z-10">
          <Link href="/" className="lg:hidden flex items-center gap-2 mb-8">
            <div className="relative h-7 w-7 rounded-md bg-foreground flex items-center justify-center">
              <AudioWaveform className="h-3.5 w-3.5 text-background" />
              <span className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-background" />
            </div>
            <span className="font-semibold tracking-[-0.02em] flex items-baseline gap-1">
              <span>Chivox</span>
              <span className="bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500 bg-clip-text text-transparent">MCP</span>
            </span>
          </Link>

          <h2 className="text-[22px] font-bold tracking-tight mb-1">{t.title}</h2>
          <p className="text-sm text-muted-foreground mb-5">{t.subtitle}</p>

          {error && (
            <div className="mb-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm px-3 py-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">{t.name}</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <input type="text" value={name} onChange={e => { setName(e.target.value); setError(''); }} placeholder={t.namePlaceholder} className={inputCls} />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">{t.email}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} placeholder="you@example.com" className={inputCls} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{t.password}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    placeholder={t.passHint}
                    className={inputWithBtnCls}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{t.confirmPassword}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                    placeholder={t.confirmPlaceholder}
                    className={inputWithBtnCls}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground transition-colors">
                    {showConfirm ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group w-full h-10 text-sm font-semibold rounded-lg bg-foreground text-background shadow-[0_1px_2px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.1)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.1)] hover:brightness-110 active:brightness-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 !mt-4"
            >
              {loading ? (
                <>
                  <span className="h-3.5 w-3.5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                  {t.signing}
                </>
              ) : (
                <>
                  {t.create}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          <p className="text-[11px] text-muted-foreground/50 text-center mt-3 leading-relaxed">
            {t.termsPrefix}<Link href="/" className="text-muted-foreground/70 hover:text-foreground underline underline-offset-2">{t.terms}</Link>{isZh ? '和' : ' and '}<Link href="/" className="text-muted-foreground/70 hover:text-foreground underline underline-offset-2">{t.privacy}</Link>
          </p>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/60" /></div>
            <div className="relative flex justify-center"><span className="bg-background px-3 text-[11px] text-muted-foreground/60">{t.or}</span></div>
          </div>

          <p className="text-sm text-center text-muted-foreground">
            {t.hasAccount}{' '}
            <Link href="/login" className="text-foreground font-medium hover:underline underline-offset-4">
              {t.goLogin}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
