'use client';

import { Link } from '@/i18n/routing';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from '@/i18n/routing';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AudioWaveform, Check } from 'lucide-react';
import { useState } from 'react';
import { useLocale } from 'next-intl';

export default function LoginPage() {
  const locale = useLocale();
  const isZh = locale.startsWith('zh');
  const t = {
    errEmail: isZh ? '请输入邮箱' : 'Please enter email',
    errPassword: isZh ? '请输入密码' : 'Please enter password',
    errLogin: isZh ? '登录失败，请重试' : 'Login failed, please try again',
    title: isZh ? '欢迎回来' : 'Welcome back',
    subtitle: isZh ? '登录您的开发者账号' : 'Sign in to your developer account',
    email: isZh ? '邮箱' : 'Email',
    password: isZh ? '密码' : 'Password',
    forgot: isZh ? '忘记密码？' : 'Forgot password?',
    loggingIn: isZh ? '登录中' : 'Signing in',
    login: isZh ? '登 录' : 'Sign In',
    or: isZh ? '或' : 'or',
    noAccount: isZh ? '还没有账号？' : "Don't have an account?",
    createFree: isZh ? '创建免费账号' : 'Create free account',
    heroTitlePrefix: isZh ? '让语音评测' : 'Bring Speech Assessment',
    heroTitleHighlight: isZh ? '接入大模型' : 'to LLMs',
    heroDesc: isZh
      ? '驰声 MCP 把考试级评测引擎以标准协议直接交给 LLM —— 一份配置，在 Cursor / Claude Desktop / Dify / Coze / 自研 Agent 里通用，不再为接入口语评测写一行 SDK。'
      : 'Chivox MCP delivers exam-grade speech evaluation to LLMs via a standard protocol. One config works across Cursor, Claude Desktop, Dify, Coze and custom agents.',
    feature1t: isZh ? '16 个评测工具自动注册' : '16 tools auto-registered',
    feature1d: isZh ? '中英双语 · 单词 / 句子 / 段落 / 半开放 / 情景对话' : 'Bilingual: word / sentence / paragraph / semi-open / dialogue',
    feature2t: isZh ? '音素级 dp_type + 多维评分' : 'Phoneme-level dp_type + multi-dim scores',
    feature2d: isZh ? 'mispron / omit / insert 直接喂给 LLM 做诊断' : 'Use mispron / omit / insert directly for LLM diagnosis',
    feature3t: isZh ? '标准 MCP 协议，零接入成本' : 'Standard MCP protocol, zero integration cost',
    feature3d: isZh ? 'stdio / Streamable HTTP 双通道，LLM 自动发现工具' : 'stdio / Streamable HTTP, tools auto-discovered by LLMs',
    statTools: isZh ? '种评测工具' : 'evaluation tools',
    statLang: isZh ? '双语内核' : 'bilingual core',
    statSla: isZh ? '服务可用率' : 'service uptime',
  };
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError(t.errEmail); return; }
    if (!password.trim()) { setError(t.errPassword); return; }

    setLoading(true);
    try {
      const ok = await login(email, password);
      if (ok) router.push('/dashboard/keys');
    } catch {
      setError(t.errLogin);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="h-dvh flex overflow-hidden">
      {/* Left — Brand Panel */}
      <div className="hidden lg:flex lg:w-[46%] relative bg-zinc-950 text-white overflow-hidden">
        {/* Noise texture */}
        <div className="absolute inset-0 opacity-[0.35]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.04\'/%3E%3C/svg%3E")' }} />
        {/* Gradient mesh */}
        <div className="absolute -top-1/4 -left-1/4 w-[70%] h-[70%] bg-gradient-to-br from-white/[0.07] via-transparent to-transparent rounded-full blur-[100px]" />
        <div className="absolute -bottom-1/4 -right-1/4 w-[60%] h-[60%] bg-gradient-to-tl from-white/[0.05] via-transparent to-transparent rounded-full blur-[80px]" />
        {/* Grid lines */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />

        <div className="relative z-10 flex flex-col p-10 xl:p-12 w-full">
          {/* Top · logo */}
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

          {/* Main · 主内容块，纵向居中，信息密度饱满 */}
          <div className="flex-1 flex flex-col justify-center py-10 max-w-sm">
            <span className="inline-flex items-center gap-2 text-[10px] tracking-[0.25em] uppercase text-white/40 mb-5">
              <span className="w-3 h-px bg-white/30" />
              Developer Console
            </span>
            <h1 className="text-[30px] xl:text-[34px] font-bold tracking-tight leading-[1.15] mb-4">
              {t.heroTitlePrefix}{' '}
              <span className="bg-gradient-to-r from-white via-white/85 to-white/40 bg-clip-text text-transparent">
                {t.heroTitleHighlight}
              </span>
            </h1>
            <p className="text-[13px] text-white/50 leading-relaxed mb-7">
              {t.heroDesc}
            </p>

            {/* 价值清单 · 4 条 */}
            <ul className="space-y-3 mb-7">
              {[
                { t: t.feature1t, d: t.feature1d },
                { t: t.feature2t, d: t.feature2d },
                { t: t.feature3t, d: t.feature3d },
              ].map(f => (
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

            {/* 迷你 · MCP 响应预览卡，让视觉更有呼吸感 */}
            <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] overflow-hidden backdrop-blur-sm">
              <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/[0.06]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
                <span className="text-[10px] text-white/40 font-mono">live · mcp-response.json</span>
                <span className="ml-auto text-[9px] text-emerald-400/70 font-mono tracking-wider">200 OK</span>
              </div>
              <pre className="text-[10.5px] font-mono p-3 leading-relaxed text-white/80 whitespace-pre">
<span className="text-white/30">{'{'}</span>{'\n'}
{'  '}<span className="text-emerald-300/80">&quot;overall&quot;</span>: <span className="text-amber-300/90">85</span>,{'\n'}
{'  '}<span className="text-emerald-300/80">&quot;pron&quot;</span>: <span className="text-white/30">{'{ accuracy: '}</span><span className="text-amber-300/90">82</span><span className="text-white/30">{', fluency: '}</span><span className="text-amber-300/90">88</span><span className="text-white/30">{' }'}</span>,{'\n'}
{'  '}<span className="text-emerald-300/80">&quot;details&quot;</span>: <span className="text-white/30">[{'{ '}</span><span className="text-emerald-300/80">&quot;char&quot;</span>:<span className="text-amber-300/90">&nbsp;&quot;think&quot;</span>, <span className="text-emerald-300/80">&quot;dp_type&quot;</span>:<span className="text-rose-300/90">&nbsp;&quot;mispron&quot;</span> <span className="text-white/30">{'}]'}</span>{'\n'}
<span className="text-white/30">{'}'}</span>
              </pre>
            </div>
          </div>

          {/* Bottom · stats */}
          <div className="flex gap-8 pt-6 border-t border-white/[0.06]">
            {[
              { value: '16', label: t.statTools },
              { value: isZh ? '中英' : 'EN/CN', label: t.statLang },
              { value: '99.9%', label: t.statSla },
            ].map(s => (
              <div key={s.label}>
                <div className="text-xl font-bold tabular-nums text-white/90">{s.value}</div>
                <div className="text-[11px] text-white/35 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center px-6 bg-background relative">
        {/* Subtle background texture */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-muted/50 via-background to-background" />

        <div className="w-full max-w-[340px] relative z-10">
          {/* Mobile logo */}
          <Link href="/" className="lg:hidden flex items-center gap-2 mb-8">
            <div className="h-7 w-7 rounded-md bg-foreground flex items-center justify-center">
              <AudioWaveform className="h-3.5 w-3.5 text-background" />
            </div>
            <span className="font-semibold tracking-tight">Chivox MCP</span>
          </Link>

          <h2 className="text-[22px] font-bold tracking-tight mb-1">{t.title}</h2>
          <p className="text-sm text-muted-foreground mb-6">{t.subtitle}</p>

          {error && (
            <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm px-3 py-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t.email}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  placeholder="you@example.com"
                  className="w-full h-10 pl-9 pr-3 text-sm rounded-lg border border-border/80 bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-foreground/30 transition-all placeholder:text-muted-foreground/40"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-muted-foreground">{t.password}</label>
                <button type="button" className="text-[11px] text-muted-foreground/60 hover:text-foreground transition-colors">
                  {t.forgot}
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  className="w-full h-10 pl-9 pr-10 text-sm rounded-lg border border-border/80 bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-foreground/30 transition-all placeholder:text-muted-foreground/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group w-full h-10 text-sm font-semibold rounded-lg bg-foreground text-background shadow-[0_1px_2px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.1)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.1)] hover:brightness-110 active:brightness-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 !mt-5"
            >
              {loading ? (
                <>
                  <span className="h-3.5 w-3.5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                  {t.loggingIn}
                </>
              ) : (
                <>
                  {t.login}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/60" /></div>
            <div className="relative flex justify-center"><span className="bg-background px-3 text-[11px] text-muted-foreground/60">{t.or}</span></div>
          </div>

          <p className="text-sm text-center text-muted-foreground">
            {t.noAccount}{' '}
            <Link href="/register" className="text-foreground font-medium hover:underline underline-offset-4">
              {t.createFree}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
