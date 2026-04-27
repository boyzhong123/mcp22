'use client';

import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  Gauge,
  Key,
  Zap,
} from 'lucide-react';
import { FadeUp, StaggerContainer, StaggerItem } from '@/components/animated-section';
import {
  AmbientBackdrop,
  BackToOverview,
  ContactSection,
  SiteFooter,
  TopNav,
} from '../_chrome';

const TILES = [
  {
    icon: Key,
    eyebrow: 'keys',
    title: 'Starter key → paid key',
    body:
      'Free credits on signup. Flip to paid without re-integrating — same endpoint, same JSON. Keys scoped per environment, rotated from the dashboard.',
    chip: 'Free → paid · no migration',
    tone: 'emerald',
  },
  {
    icon: Gauge,
    eyebrow: 'budgets',
    title: 'Spend caps you can trust',
    body:
      'Hard monthly ceilings per key. When the cap is hit, calls return a structured 429 — your agent can surface billing state to users instead of failing opaquely.',
    chip: 'Hard cap · structured 429',
    tone: 'amber',
  },
  {
    icon: Bell,
    eyebrow: 'alerts',
    title: 'Low-balance alerts',
    body:
      'Email notifications at 80% / 90% / 100% of spend or credit balance. Webhook delivery available for Slack, PagerDuty, or internal billing systems.',
    chip: '80 · 90 · 100% thresholds',
    tone: 'rose',
  },
  {
    icon: BarChart3,
    eyebrow: 'observability',
    title: 'Usage visibility',
    body:
      'Per-key usage, latency percentiles, tool breakdown, error reasons — live in dashboard, exportable via API. Debug integrations without opening a ticket.',
    chip: 'Dashboard + export API',
    tone: 'sky',
  },
  {
    icon: Zap,
    eyebrow: 'privacy',
    title: 'Stateless streaming',
    body:
      'Audio scored in-memory, never stockpiled, never used for training. You own the data — JSON out, zero audio copies. GDPR · CCPA · SOC 2 aligned.',
    chip: 'TTL: 0s · GDPR · CCPA · SOC 2',
    tone: 'violet',
  },
  {
    icon: Activity,
    eyebrow: 'scale',
    title: 'Production-ready runtime',
    body:
      '9.2B+ evaluations per year, p50 240 ms, 99.95% uptime SLA on enterprise tier. Same payload whether you wire it into GPT-4o, Claude 3.5 or Gemini 2.0.',
    chip: '9.2B/yr · p50 240 ms · 99.95% SLA',
    tone: 'indigo',
  },
] as const;

const TONE_MAP: Record<
  string,
  { iconBg: string; iconFg: string; eyebrow: string; chipBorder: string }
> = {
  emerald: {
    iconBg: 'bg-emerald-500/10',
    iconFg: 'text-emerald-700',
    eyebrow: 'text-emerald-700',
    chipBorder: 'border-emerald-500/25 bg-emerald-500/[0.05] text-emerald-800',
  },
  amber: {
    iconBg: 'bg-amber-500/10',
    iconFg: 'text-amber-700',
    eyebrow: 'text-amber-700',
    chipBorder: 'border-amber-500/25 bg-amber-500/[0.05] text-amber-800',
  },
  rose: {
    iconBg: 'bg-rose-500/10',
    iconFg: 'text-rose-700',
    eyebrow: 'text-rose-700',
    chipBorder: 'border-rose-500/25 bg-rose-500/[0.05] text-rose-800',
  },
  sky: {
    iconBg: 'bg-sky-500/10',
    iconFg: 'text-sky-700',
    eyebrow: 'text-sky-700',
    chipBorder: 'border-sky-500/25 bg-sky-500/[0.05] text-sky-800',
  },
  violet: {
    iconBg: 'bg-violet-500/10',
    iconFg: 'text-violet-700',
    eyebrow: 'text-violet-700',
    chipBorder: 'border-violet-500/25 bg-violet-500/[0.05] text-violet-800',
  },
  indigo: {
    iconBg: 'bg-indigo-500/10',
    iconFg: 'text-indigo-700',
    eyebrow: 'text-indigo-700',
    chipBorder: 'border-indigo-500/25 bg-indigo-500/[0.05] text-indigo-800',
  },
};

export default function GlobalRuntimePage() {
  return (
    <div className="relative">
      <AmbientBackdrop />
      <TopNav />
      <BackToOverview />

      <section className="relative py-16 md:py-20 border-b border-[#e9e2d2]/70">
        <div className="container mx-auto px-6 max-w-6xl">
          <FadeUp className="mb-10 max-w-2xl">
            <div className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-3">/runtime</div>
            <h1 className="heading-display text-3xl md:text-4xl tracking-[-0.02em] mb-3 leading-[1.1]">
              Built like infrastructure you can bet a launch on.
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              Chivox MCP is not a Saturday demo. Keys, budgets, alerts, uptime &mdash; the day-2 stuff
              your ops team asks about before signing. Everything visible in the dashboard, scriptable
              via API.
            </p>
          </FadeUp>

          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {TILES.map((tile) => {
              const t = TONE_MAP[tile.tone];
              return (
                <StaggerItem key={tile.title}>
                  <div className="group relative h-full rounded-2xl border border-zinc-900/[0.08] bg-white/70 backdrop-blur-md p-5 md:p-6 hover:-translate-y-[2px] hover:border-zinc-900/[0.15] hover:shadow-[0_18px_48px_-24px_rgba(0,0,0,0.18)] transition-all duration-300 flex flex-col">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className={`h-9 w-9 rounded-lg ${t.iconBg} inline-flex items-center justify-center`}>
                        <tile.icon className={`h-4 w-4 ${t.iconFg}`} />
                      </div>
                      <span className={`text-[10.5px] font-mono tracking-wide uppercase ${t.eyebrow}`}>
                        /{tile.eyebrow}
                      </span>
                    </div>
                    <h3 className="text-[16.5px] font-semibold tracking-[-0.01em] mb-2 text-zinc-900">
                      {tile.title}
                    </h3>
                    <p className="text-[13px] text-muted-foreground leading-relaxed mb-4">
                      {tile.body}
                    </p>
                    <span className={`mt-auto self-start inline-flex items-center rounded-md border px-2 py-0.5 text-[10.5px] font-mono ${t.chipBorder}`}>
                      {tile.chip}
                    </span>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>

          <FadeUp delay={0.2}>
            <div className="mt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-[12.5px] text-muted-foreground border-t border-zinc-900/[0.06] pt-5">
              <span className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)] animate-pulse" />
                Production traffic right now &mdash; check the{' '}
                <Link
                  href="/docs#changelog"
                  className="text-emerald-800 hover:text-emerald-900 font-medium inline-flex items-center gap-0.5"
                >
                  status &amp; changelog
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </span>
              <span className="font-mono text-[11.5px]">
                One payload shape · every model · every runtime
              </span>
            </div>
          </FadeUp>
        </div>
      </section>

      <ContactSection />
      <SiteFooter />
    </div>
  );
}
