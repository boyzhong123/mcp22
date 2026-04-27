'use client';

/* ═══════════════════════════════════════════════════════════════
 *  Shared chrome for the landing + sub-routes.
 *
 *  TopNav, SiteFooter, ContactSection live here (rather than inside
 *  page.tsx) so /reasoning, /runtime, /faq can
 *  render the exact same header / footer without duplication.
 *
 *  TopNav is pathname-aware: on the main landing, anchor items scroll
 *  in-page; on a sub-route, they resolve to /#section so the
 *  user lands back on the landing at the right spot.
 * ═══════════════════════════════════════════════════════════ */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, useTransition, type FormEvent } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  AudioWaveform,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  GaugeCircle,
  LayoutDashboard,
  Loader2,
  Mail,
  MessagesSquare,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  sendGlobalContactEmail,
  type GlobalContactFormData,
  type GlobalContactUseCase,
} from '@/app/actions/send-global-contact';

/* ══ Representative payload — shared by QuickstartDemo on the main
 *    landing AND the Reasoning section in /global/reasoning. */
export const SAMPLE_MCP_RICH_JSON = `{
  "overall": 84,
  "pron": { "accuracy": 82, "integrity": 95, "fluency": 88, "rhythm": 79 },
  "fluency": { "overall": 85, "pause": 3, "speed": 128 },
  "audio_quality": { "snr": 24.1, "clip": 0, "volume": 2402 },
  "details": [
    {
      "word": "gorgeous",
      "score": 71, "dp_type": "mispron",
      "start": 420, "end": 980,
      "stress": { "ref": 1, "score": 62 },
      "liaison": "none",
      "phonemes": [
        { "ipa": "ɡ", "score": 92, "dp_type": "normal" },
        { "ipa": "ɔː", "score": 64, "dp_type": "mispron" }
      ]
    }
  ]
}`;

/* ══ Nav structure ═══════════════════════════════════════════ */

type NavItem = {
  href: string;
  label: string;
  /** Resolves to another route instead of scrolling to an on-page anchor. */
  external?: boolean;
};

/** Primary nav items (anchors scroll on /, jump to /#… elsewhere). */
const NAV_ITEMS: readonly NavItem[] = [
  { href: '#quickstart', label: 'Quickstart' },
  { href: '#mandarin-moat', label: 'Mandarin' },
  { href: '#use-cases', label: 'Use cases' },
  { href: '#contact', label: 'Contact' },
] as const;

/** Deep-dive sub-pages, surfaced as a "Resources ▾" dropdown. */
export const RESOURCE_ITEMS: readonly {
  href: string;
  label: string;
  summary: string;
  eyebrow: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  accent: string;
}[] = [
  {
    href: '/reasoning',
    label: 'Reasoning engine',
    summary: 'What the JSON payload actually looks like — and how an LLM reasons over it.',
    eyebrow: 'Day-1',
    icon: Sparkles,
    accent: 'from-emerald-500/15 to-emerald-500/0 text-emerald-700',
  },
  {
    href: '/runtime',
    label: 'Runtime',
    summary: 'Keys, budgets, alerts, observability, privacy, scale — the day-2 stuff.',
    eyebrow: 'Day-2',
    icon: GaugeCircle,
    accent: 'from-amber-500/15 to-amber-500/0 text-amber-700',
  },
  {
    href: '/faq',
    label: 'FAQ',
    summary: 'Integration speed, languages, streaming, accuracy, pricing.',
    eyebrow: 'Quick answers',
    icon: MessagesSquare,
    accent: 'from-sky-500/15 to-sky-500/0 text-sky-700',
  },
] as const;

/* ══ Lightweight auth-state hook ═════════════════════════════
 *  Reads the same `dev-en:auth-user` localStorage entry that the
 *  /dev-en mock auth writes, so any /global page can switch its
 *  primary CTA between "Sign in" and "Open dashboard" without
 *  having to be wrapped in MockAuthProvider.
 * ──────────────────────────────────────────────────────────── */

const AUTH_STORAGE_KEY = 'dev-en:auth-user';

interface SignedInUser {
  id?: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
}

function readAuthUser(): SignedInUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SignedInUser;
    return parsed && (parsed.email || parsed.name) ? parsed : null;
  } catch {
    return null;
  }
}

export function useGlobalAuthUser(): SignedInUser | null {
  // Always start as null on the server (and first client paint) to keep
  // SSR + hydration deterministic; we hydrate from localStorage in an
  // effect after mount.
  const [user, setUser] = useState<SignedInUser | null>(null);

  useEffect(() => {
    let lastRaw: string | null = null;

    const sync = () => {
      const raw =
        typeof window !== 'undefined'
          ? window.localStorage.getItem(AUTH_STORAGE_KEY)
          : null;
      if (raw === lastRaw) return; // no change → no setState → no re-render
      lastRaw = raw;
      setUser(readAuthUser());
    };

    sync();

    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key !== AUTH_STORAGE_KEY) return;
      sync();
    };

    window.addEventListener('storage', onStorage);
    // Same-tab writes don't fire `storage`; cheap 1s poll covers that.
    const pollId = window.setInterval(sync, 1000);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.clearInterval(pollId);
    };
  }, []);

  return user;
}

function initialsOf(u: SignedInUser): string {
  const source = (u.name || u.email || '').trim();
  if (!source) return 'U';
  if (source.includes('@')) return source[0]!.toUpperCase();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

/* ══ Shared header CTA — switches Sign in ↔ Dashboard ════════ */

export function HeaderAuthCTA({ scrolled = false }: { scrolled?: boolean }) {
  const user = useGlobalAuthUser();

  if (!user) {
    return (
      <Link
        href="/login"
        className={cn(
          'inline-flex items-center gap-1.5 text-sm font-semibold rounded-full bg-zinc-900 text-zinc-50 hover:-translate-y-px',
          'transition-[height,padding,box-shadow,transform] duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
          scrolled
            ? 'h-[34px] pl-3.5 pr-3 text-[13px] shadow-[0_6px_14px_-8px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.04)_inset]'
            : 'h-10 pl-4 pr-3.5 shadow-[0_8px_20px_-10px_rgba(0,0,0,0.45)]',
        )}
      >
        Sign in
        <ArrowRight className="h-3.5 w-3.5 opacity-90" />
      </Link>
    );
  }

  const initials = initialsOf(user);
  const display = user.name || (user.email ? user.email.split('@')[0] : 'Account');

  return (
    <Link
      href="/dev-en/dashboard"
      aria-label={`Open dashboard — signed in as ${display}`}
      className={cn(
        'group inline-flex items-center text-sm font-medium rounded-full',
        'border border-emerald-500/25 bg-white/70 backdrop-blur-md text-zinc-900',
        'hover:bg-white hover:border-emerald-500/40 hover:-translate-y-px',
        'transition-[height,padding,box-shadow,transform,background-color,border-color] duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_8px_22px_-12px_rgba(16,185,129,0.30)]',
        scrolled ? 'h-[34px] pl-1 pr-3 gap-1.5 text-[13px]' : 'h-10 pl-1.5 pr-3.5 gap-2',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'inline-flex items-center justify-center rounded-full font-semibold tracking-[0.02em]',
          'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white',
          'shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_2px_8px_-2px_rgba(16,185,129,0.55)]',
          scrolled ? 'h-[26px] w-[26px] text-[10.5px]' : 'h-8 w-8 text-[11.5px]',
        )}
      >
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl}
            alt=""
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          initials
        )}
      </span>
      <span className="max-w-[120px] truncate">{display}</span>
      <LayoutDashboard
        className={cn(
          'opacity-60 group-hover:opacity-90 group-hover:text-emerald-700 transition-colors shrink-0',
          scrolled ? 'h-3.5 w-3.5' : 'h-4 w-4',
        )}
      />
    </Link>
  );
}

/* ══ TopNav ══════════════════════════════════════════════════ */

export function TopNav() {
  const pathname = usePathname() || '/';
  const onLanding = pathname === '/' || pathname === '/global' || pathname === '/global/';

  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState<string>('');
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const resourcesRef = useRef<HTMLDivElement | null>(null);
  const scrollRaf = useRef<number | null>(null);

  useEffect(() => {
    const onScroll = () => {
      if (scrollRaf.current != null) return;
      scrollRaf.current = window.requestAnimationFrame(() => {
        scrollRaf.current = null;
        const y = window.scrollY;
        setScrolled(y > 52);
        const doc = document.documentElement;
        const max = doc.scrollHeight - doc.clientHeight;
        setProgress(max > 0 ? Math.min(1, Math.max(0, y / max)) : 0);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (scrollRaf.current != null) cancelAnimationFrame(scrollRaf.current);
    };
  }, []);

  // Track the visible section so the corresponding pill lights up
  // (only meaningful on the /global landing, where the anchor targets exist).
  useEffect(() => {
    if (!onLanding) return;
    const ids = NAV_ITEMS.filter((i) => !i.external && i.href.startsWith('#')).map(
      (i) => i.href.slice(1),
    );
    const targets = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    if (targets.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(`#${visible[0].target.id}`);
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [onLanding]);

  // Close the Resources menu on outside click / escape
  useEffect(() => {
    if (!resourcesOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (!resourcesRef.current) return;
      if (!resourcesRef.current.contains(e.target as Node)) setResourcesOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setResourcesOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [resourcesOpen]);

  const anchorHref = (hash: string) => (onLanding ? hash : `/${hash}`);
  const resourceActive = RESOURCE_ITEMS.some((r) => pathname.startsWith(r.href));

  return (
    <>
      <div aria-hidden className="h-[84px] shrink-0" />
      <header className="fixed inset-x-0 top-0 z-40 w-full pointer-events-none">
        <div className="mx-auto px-3 sm:px-4 pt-3 pointer-events-auto">
          <div
            className={cn(
              'mx-auto flex items-center gap-3 rounded-full border will-change-transform',
              'transition-[max-width,height,padding,background-color,box-shadow,border-color,gap] duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
              scrolled
                ? 'h-[54px] max-w-[min(calc(100%-0.5rem),80rem)] pl-3.5 pr-1.5 gap-1.5 border-emerald-500/[0.14] ring-1 ring-emerald-500/[0.08]'
                : 'h-[68px] max-w-[min(calc(100%-0.5rem),88rem)] pl-5 pr-2 gap-3 border-white/60',
            )}
            style={{
              backgroundColor: scrolled ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.38)',
              backdropFilter: scrolled
                ? 'blur(36px) saturate(220%)'
                : 'blur(20px) saturate(165%)',
              WebkitBackdropFilter: scrolled
                ? 'blur(36px) saturate(220%)'
                : 'blur(20px) saturate(165%)',
              boxShadow: scrolled
                ? 'inset 0 1px 0 rgba(255,255,255,0.98), inset 0 -1px 0 rgba(16,185,129,0.10), inset 0 0 0 1px rgba(255,255,255,0.55), 0 22px 48px -22px rgba(16,52,33,0.26), 0 6px 16px -8px rgba(16,185,129,0.18)'
                : 'inset 0 1px 0 rgba(255,255,255,0.82), inset 0 -1px 0 rgba(24,24,27,0.03), 0 18px 40px -20px rgba(24,24,27,0.16), 0 4px 14px -8px rgba(24,24,27,0.06)',
              transitionProperty:
                'max-width, height, padding, background-color, box-shadow, border-color, gap, backdrop-filter',
            }}
          >
            <Link
              href="/"
              className={cn(
                'shrink-0 rounded-lg outline-offset-2 focus-visible:ring-2 focus-visible:ring-zinc-400/40 origin-left',
                'transition-transform duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
                scrolled ? 'scale-[0.92]' : 'scale-100',
              )}
              aria-label="Chivox MCP home"
            >
              <ChivoxMcpBrand />
            </Link>

            <nav
              className={cn(
                'hidden md:flex items-center justify-end flex-1 min-w-0 font-medium tracking-[-0.01em] text-zinc-800',
                'transition-[font-size,gap] duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
                scrolled ? 'text-[13px] gap-0' : 'text-[14.5px] gap-0.5 lg:gap-1',
              )}
              aria-label="Page sections"
            >
              {NAV_ITEMS.map((item) => {
                const isActive = !item.external && onLanding && active === item.href;
                const commonClass = cn(
                  'relative inline-flex items-center gap-1.5 rounded-full transition-all duration-300',
                  scrolled ? 'px-2.5 py-1' : 'px-3 py-1.5',
                  isActive
                    ? 'text-zinc-900 bg-gradient-to-b from-emerald-50 to-white shadow-[inset_0_0_0_1px_rgba(16,185,129,0.25)]'
                    : 'hover:text-zinc-900 hover:bg-zinc-900/[0.04]',
                );

                if (item.external) {
                  return (
                    <Link key={item.href} href={item.href} className={commonClass}>
                      {item.label}
                    </Link>
                  );
                }

                return (
                  <a
                    key={item.href}
                    href={anchorHref(item.href)}
                    aria-current={isActive ? 'true' : undefined}
                    className={commonClass}
                  >
                    {isActive && (
                      <span
                        aria-hidden
                        className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.18)]"
                      />
                    )}
                    {item.label}
                  </a>
                );
              })}

              {/* Resources ▾ dropdown — collapsed deep-dive pages */}
              <div className="relative" ref={resourcesRef}>
                <button
                  type="button"
                  onClick={() => setResourcesOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={resourcesOpen}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full transition-all duration-300',
                    scrolled ? 'px-2.5 py-1' : 'px-3 py-1.5',
                    resourceActive
                      ? 'text-zinc-900 bg-gradient-to-b from-emerald-50 to-white shadow-[inset_0_0_0_1px_rgba(16,185,129,0.25)]'
                      : 'hover:text-zinc-900 hover:bg-zinc-900/[0.04]',
                  )}
                >
                  Resources
                  <ChevronDown
                    className={cn(
                      'h-3.5 w-3.5 opacity-60 transition-transform duration-200',
                      resourcesOpen && 'rotate-180',
                    )}
                  />
                </button>
                {resourcesOpen && (
                  <div
                    role="menu"
                    className="resources-pop absolute right-0 top-[calc(100%+12px)] w-[360px] origin-top-right overflow-hidden rounded-2xl border border-emerald-500/[0.16]"
                    style={{
                      background:
                        'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(251,246,233,0.92) 100%)',
                      backdropFilter: 'blur(28px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(28px) saturate(180%)',
                      boxShadow:
                        'inset 0 1px 0 rgba(255,255,255,0.95), inset 0 0 0 1px rgba(255,255,255,0.5), 0 28px 60px -22px rgba(16,52,33,0.32), 0 8px 22px -12px rgba(16,185,129,0.22)',
                    }}
                  >
                    {/* notch pointing to the trigger */}
                    <span
                      aria-hidden
                      className="absolute -top-[6px] right-7 h-3 w-3 rotate-45 border-l border-t border-emerald-500/[0.18]"
                      style={{
                        background:
                          'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(251,246,233,0.95))',
                      }}
                    />

                    {/* header eyebrow */}
                    <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
                      <span className="text-[10px] font-mono tracking-[0.22em] uppercase text-emerald-700/85">
                        /resources
                      </span>
                      <span className="text-[10px] font-mono tracking-[0.14em] uppercase text-zinc-400">
                        deep dives
                      </span>
                    </div>

                    <div className="px-2 pb-2">
                      {RESOURCE_ITEMS.map((r, i) => {
                        const isOn = pathname.startsWith(r.href);
                        const Icon = r.icon;
                        return (
                          <Link
                            key={r.href}
                            href={r.href}
                            role="menuitem"
                            onClick={() => setResourcesOpen(false)}
                            style={{ animationDelay: `${60 + i * 55}ms` }}
                            className={cn(
                              'resources-row group relative flex items-start gap-3 rounded-xl px-2.5 py-2.5',
                              'transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                              isOn
                                ? 'bg-emerald-500/[0.09] ring-1 ring-emerald-500/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]'
                                : 'hover:bg-white/70 hover:ring-1 hover:ring-emerald-500/15 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_6px_16px_-10px_rgba(16,185,129,0.30)] hover:-translate-y-[1px]',
                            )}
                          >
                            <span
                              aria-hidden
                              className={cn(
                                'mt-[2px] inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                                'bg-gradient-to-br ring-1 ring-inset ring-zinc-900/[0.06]',
                                'shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]',
                                'transition-transform duration-300 group-hover:scale-[1.04]',
                                r.accent,
                              )}
                            >
                              <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                            </span>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-baseline justify-between gap-2">
                                <span className="text-[14px] font-semibold text-zinc-900 tracking-[-0.005em]">
                                  {r.label}
                                </span>
                                {isOn ? (
                                  <span className="text-[10px] font-mono text-emerald-700">● current</span>
                                ) : (
                                  <span className="text-[9.5px] font-mono uppercase tracking-[0.16em] text-zinc-400 group-hover:text-emerald-700/80 transition-colors">
                                    {r.eyebrow}
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">
                                {r.summary}
                              </p>
                            </div>

                            <ArrowUpRight
                              className={cn(
                                'absolute right-2.5 bottom-2.5 h-3.5 w-3.5 text-zinc-400',
                                'transition-all duration-300',
                                'group-hover:text-emerald-700 group-hover:translate-x-[2px] group-hover:-translate-y-[2px]',
                                isOn && 'opacity-0',
                              )}
                            />
                          </Link>
                        );
                      })}
                    </div>

                    {/* footer */}
                    <Link
                      href="/docs"
                      onClick={() => setResourcesOpen(false)}
                      className="group flex items-center justify-between gap-2 border-t border-emerald-500/[0.12] px-4 py-2.5 text-[12px] font-medium text-zinc-700 hover:text-emerald-800 hover:bg-emerald-500/[0.05] transition-colors"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5 opacity-70 group-hover:opacity-100" />
                        Browse the full developer docs
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 opacity-60 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:opacity-100" />
                    </Link>
                  </div>
                )}
              </div>

              <Link
                href="/docs"
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full hover:text-zinc-900 hover:bg-zinc-900/[0.04] transition-all duration-300',
                  scrolled ? 'px-2.5 py-1' : 'px-3 py-1.5',
                )}
              >
                <BookOpen className="h-3.5 w-3.5 opacity-70" />
                Docs
              </Link>

              <a
                href="https://github.com/"
                target="_blank"
                rel="noreferrer"
                aria-label="Chivox MCP on GitHub"
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full hover:text-zinc-900 hover:bg-zinc-900/[0.04] transition-all duration-300',
                  scrolled ? 'px-2 py-1' : 'px-3 py-1.5',
                )}
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden>
                  <path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.6 1 1.6 1 .9 1.5 2.4 1.1 3 .8.1-.6.3-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.7 1a9.4 9.4 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.8v2.7c0 .3.2.6.7.5A10 10 0 0 0 12 2z" fill="currentColor" />
                </svg>
                <span className={cn(scrolled && 'sr-only lg:not-sr-only')}>GitHub</span>
                <ArrowUpRight className={cn('h-3 w-3 opacity-55', scrolled && 'hidden lg:inline-block')} />
              </a>
            </nav>

            <div className="flex items-center gap-2 shrink-0 ml-auto md:ml-0">
              <HeaderAuthCTA scrolled={scrolled} />
            </div>

            {/* scroll progress — hairline that hugs the rounded edge */}
            <div
              aria-hidden
              className={cn(
                'absolute h-[2px] rounded-full overflow-hidden',
                'transition-[opacity,bottom,left,right] duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
                scrolled
                  ? 'left-5 right-5 bottom-[3px] opacity-100'
                  : 'left-7 right-7 bottom-[6px] opacity-0',
              )}
              style={{ background: 'rgba(16,185,129,0.10)' }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${progress * 100}%`,
                  background:
                    'linear-gradient(90deg, #059669 0%, #10b981 32%, #34d399 64%, #fbbf24 100%)',
                  boxShadow: '0 0 10px rgba(16,185,129,0.45), 0 0 2px rgba(251,191,36,0.4)',
                  transition: 'width 90ms cubic-bezier(0.22, 0.61, 0.36, 1)',
                }}
              />
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

/* ══ Back-to-overview breadcrumb — shown on sub-pages ═══════ */

export function BackToOverview({
  containerClassName = 'container mx-auto px-6 max-w-6xl pt-5',
  label = 'Back to overview',
}: {
  containerClassName?: string;
  label?: string;
} = {}) {
  return (
    <div className={containerClassName}>
      <Link
        href="/"
        className={cn(
          'group inline-flex items-center gap-1.5 rounded-full pl-2.5 pr-3.5 py-1.5',
          'text-[12.5px] font-medium text-zinc-700',
          'border border-zinc-900/[0.08] bg-white/55 backdrop-blur-md',
          'shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_1px_3px_rgba(24,24,27,0.04)]',
          'hover:text-emerald-800 hover:border-emerald-500/30 hover:bg-white/80',
          'hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_4px_14px_-6px_rgba(16,185,129,0.25)]',
          'transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
        )}
      >
        <span
          aria-hidden
          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-900/[0.04] text-zinc-500 group-hover:bg-emerald-500/12 group-hover:text-emerald-700 transition-all duration-300"
        >
          <ArrowLeft className="h-3 w-3 transition-transform duration-300 group-hover:-translate-x-0.5" />
        </span>
        <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500 group-hover:text-emerald-700/85 transition-colors">
          /
        </span>
        <span className="text-zinc-300/80">·</span>
        <span>{label}</span>
      </Link>
    </div>
  );
}

/* ══ Shared ambient backdrop — same warm cream on every page ═ */

export function AmbientBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-20">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(1100px 560px at 10% -10%, #ecfdf5 0%, transparent 55%),' +
            'radial-gradient(900px 520px at 95% 10%, #fef3c7 0%, transparent 55%),' +
            'radial-gradient(800px 520px at 50% 110%, #fde2e4 0%, transparent 60%),' +
            '#fbf6e9',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,0,0,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.5) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage:
            'radial-gradient(ellipse 70% 60% at 50% 25%, black 30%, transparent 80%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 70% 60% at 50% 25%, black 30%, transparent 80%)',
        }}
      />
    </div>
  );
}

/* ══ Brand mark ══════════════════════════════════════════════ */

export function ChivoxMcpBrand({ className, onWarm = false }: { className?: string; onWarm?: boolean }) {
  return (
    <span className={cn('flex items-center gap-2.5 shrink-0', className)}>
      <span className="relative h-8 w-8 rounded-lg bg-gradient-to-br from-zinc-900 to-zinc-800 flex items-center justify-center shadow-sm ring-1 ring-zinc-900/10">
        <AudioWaveform className="h-[18px] w-[18px] text-[#fbf6e9]" strokeWidth={2.3} />
        <span
          className={cn(
            'absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2',
            onWarm ? 'ring-[#fbf6e9]' : 'ring-background',
          )}
        />
      </span>
      <span className="font-bold tracking-[-0.02em] text-lg leading-none flex items-baseline gap-1">
        <span className={onWarm ? 'text-zinc-900' : 'text-foreground'}>Chivox</span>
        <span className="bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500 bg-clip-text text-transparent">
          MCP
        </span>
      </span>
    </span>
  );
}

/* ══ Contact section (form + left-rail pitch) ═══════════════ */

const USE_CASE_OPTIONS: Array<{ value: GlobalContactUseCase; label: string }> = [
  { value: 'language-learning', label: 'Language learning' },
  { value: 'serious-games', label: 'Serious games / consumer' },
  { value: 'accessibility', label: 'Accessibility / speech therapy' },
  { value: 'enterprise-training', label: 'Enterprise training & L&D' },
  { value: 'research', label: 'Research / academic' },
  { value: 'other', label: 'Other' },
];

export function ContactSection() {
  return (
    <section
      id="contact"
      className="relative py-20 md:py-28 border-t border-[#e9e2d2]/70 scroll-mt-28"
      style={{
        background:
          'linear-gradient(to bottom, rgba(251,246,233,0) 0%, rgba(16,185,129,0.05) 40%, rgba(245,158,11,0.04) 100%)',
      }}
    >
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-5">
            <div className="text-[11px] font-mono tracking-[0.22em] uppercase text-emerald-700 mb-3">
              /contact
            </div>
            <h2 className="heading-display text-3xl md:text-[40px] tracking-[-0.025em] leading-[1.08] mb-5">
              Let&rsquo;s build your voice agent together.
            </h2>
            <p className="text-muted-foreground text-[15px] leading-relaxed mb-8 max-w-md">
              Tell us what you&rsquo;re building. We&rsquo;ll reply within one business day with
              pilot credits, pricing, or a deployment plan — whichever you need first.
            </p>

            <ul className="space-y-3.5 mb-8">
              {[
                {
                  title: 'Enterprise pricing & self-hosted deployments',
                  body: 'Volume tiers, VPC install, SLAs, and on-prem engines for regulated buyers.',
                },
                {
                  title: 'Missing a language or dialect?',
                  body: 'We train new acoustic models on request. Send us your target accent.',
                },
                {
                  title: 'Pilot credits for evaluation teams',
                  body: 'Free benchmark run on your own audio, with a side-by-side report.',
                },
              ].map((item) => (
                <li key={item.title} className="flex gap-3">
                  <div
                    className="mt-[6px] h-5 w-5 shrink-0 rounded-full bg-emerald-500/15 text-emerald-700 inline-flex items-center justify-center"
                    aria-hidden
                  >
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </div>
                  <div>
                    <div className="text-[14.5px] font-semibold text-zinc-900 tracking-[-0.005em]">
                      {item.title}
                    </div>
                    <div className="text-[13px] text-muted-foreground leading-relaxed">
                      {item.body}
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="rounded-xl border border-zinc-900/[0.08] bg-white/55 backdrop-blur-sm p-4">
              <div className="text-[11px] font-mono tracking-[0.2em] uppercase text-muted-foreground mb-2">
                Prefer plain email?
              </div>
              <div className="text-[13.5px]">
                <a
                  href="mailto:BD@chivox.com?subject=Chivox%20MCP%20inquiry"
                  className="inline-flex items-center gap-2 text-zinc-900 hover:text-emerald-700 transition-colors"
                >
                  <Mail className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="font-medium">BD@chivox.com</span>
                  <span className="text-muted-foreground">
                    · developer &amp; enterprise inquiries
                  </span>
                </a>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="warm-card p-6 md:p-8">
              <GlobalContactForm />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function GlobalContactForm() {
  const pathname = usePathname() || '/';
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState<GlobalContactFormData>({
    company: '',
    name: '',
    email: '',
    useCase: undefined,
    message: '',
    source: `${pathname}#contact`,
  });

  useEffect(() => {
    setForm((f) => ({ ...f, source: `${pathname}#contact` }));
  }, [pathname]);

  const inputClass =
    'w-full h-11 px-3.5 text-[14px] rounded-lg border border-zinc-900/[0.12] bg-white/70 backdrop-blur-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/15 transition-all disabled:opacity-60';

  const labelClass = 'block text-[12.5px] font-medium text-zinc-800 mb-1.5 tracking-[-0.005em]';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('idle');
    setErrorMsg('');
    startTransition(async () => {
      const result = await sendGlobalContactEmail(form);
      if (result.success) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMsg(result.error || 'Submission failed. Please try again.');
      }
    });
  };

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="h-14 w-14 rounded-full bg-emerald-500/15 text-emerald-700 inline-flex items-center justify-center mb-4">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h3 className="heading-display text-xl md:text-2xl tracking-[-0.015em] text-zinc-900 mb-2">
          Thanks — your note is in.
        </h3>
        <p className="text-[14px] text-muted-foreground leading-relaxed max-w-sm mb-6">
          We&rsquo;ll get back within one business day. For anything urgent, email{' '}
          <a
            href="mailto:BD@chivox.com"
            className="text-emerald-700 underline underline-offset-2 hover:no-underline"
          >
            BD@chivox.com
          </a>{' '}
          directly.
        </p>
        <button
          type="button"
          onClick={() => {
            setStatus('idle');
            setForm({
              company: '',
              name: '',
              email: '',
              useCase: undefined,
              message: '',
              source: `${pathname}#contact`,
            });
          }}
          className="text-[13px] font-medium text-zinc-700 hover:text-zinc-900 underline underline-offset-2 hover:no-underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="mb-1">
        <div className="text-[11px] font-mono tracking-[0.22em] uppercase text-emerald-700 mb-1.5">
          /get-in-touch
        </div>
        <h3 className="heading-display text-xl md:text-[22px] tracking-[-0.01em] text-zinc-900">
          Tell us what you&rsquo;re building.
        </h3>
      </div>

      {status === 'error' && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 text-rose-800 text-[13px] border border-rose-200">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-3.5">
        <div>
          <label className={labelClass} htmlFor="contact-company">
            Company <span className="text-rose-500">*</span>
          </label>
          <input
            id="contact-company"
            type="text"
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
            placeholder="Acme Inc."
            className={inputClass}
            disabled={isPending}
            autoComplete="organization"
            required
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="contact-name">
            Your name <span className="text-rose-500">*</span>
          </label>
          <input
            id="contact-name"
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Jane Doe"
            className={inputClass}
            disabled={isPending}
            autoComplete="name"
            required
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="contact-email">
          Work email <span className="text-rose-500">*</span>
        </label>
        <input
          id="contact-email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="jane@acme.com"
          className={inputClass}
          disabled={isPending}
          autoComplete="email"
          required
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="contact-usecase">
          What are you building?{' '}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <select
          id="contact-usecase"
          value={form.useCase ?? ''}
          onChange={(e) =>
            setForm({
              ...form,
              useCase: (e.target.value || undefined) as GlobalContactUseCase | undefined,
            })
          }
          className={cn(inputClass, 'appearance-none pr-10 cursor-pointer')}
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2352525b' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 14px center',
          }}
          disabled={isPending}
        >
          <option value="">Select a use case…</option>
          {USE_CASE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="contact-message">
          Anything we should know?{' '}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <textarea
          id="contact-message"
          value={form.message ?? ''}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          placeholder="Audio volumes, target languages, deployment region, timelines…"
          rows={4}
          className="w-full px-3.5 py-2.5 text-[14px] rounded-lg border border-zinc-900/[0.12] bg-white/70 backdrop-blur-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/15 transition-all resize-none disabled:opacity-60"
          disabled={isPending}
          maxLength={4000}
        />
      </div>

      <div className="flex flex-col md:flex-row md:items-start gap-3 pt-1">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 h-11 px-6 text-[14px] font-semibold rounded-full bg-zinc-900 text-white shadow-[0_10px_24px_-10px_rgba(0,0,0,0.45)] hover:-translate-y-[1px] disabled:opacity-60 disabled:hover:translate-y-0 transition-all duration-200"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending…
            </>
          ) : (
            <>
              Send message
              <ArrowRight className="h-4 w-4 opacity-90" />
            </>
          )}
        </button>
        <p className="text-[11.5px] text-muted-foreground leading-relaxed md:flex-1 md:min-w-0 md:max-w-[28rem]">
          By submitting this form you agree to receive a reply from the Chivox MCP team. We
          don&rsquo;t share your email with third parties.
        </p>
      </div>
    </form>
  );
}

const SUBSCRIBE_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Footer “product updates” field — opens the visitor’s mail client (no list API yet). */
function FooterSubscribePill() {
  const [email, setEmail] = useState('');
  const [hint, setHint] = useState<'idle' | 'invalid'>('idle');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const v = email.trim();
    if (!SUBSCRIBE_EMAIL_RE.test(v)) {
      setHint('invalid');
      window.setTimeout(() => setHint('idle'), 2200);
      return;
    }
    const subject = encodeURIComponent('Subscribe: Chivox MCP product updates');
    const body = encodeURIComponent(
      `Please add this address to the Chivox MCP product-update mailing list:\n\n${v}\n`,
    );
    window.location.href = `mailto:BD@chivox.com?subject=${subject}&body=${body}`;
  };

  return (
    <form
      onSubmit={submit}
      className="inline-flex flex-col gap-1"
    >
      <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-white/60 backdrop-blur-sm pl-4 pr-1 py-1 hover:border-emerald-500/45 transition-colors">
        <input
          type="email"
          name="footer-subscribe-email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Work email"
          aria-label="Work email for product updates"
          autoComplete="email"
          className="bg-transparent outline-none text-[13px] text-zinc-900 placeholder:text-zinc-500 w-28 sm:w-40"
        />
        <button
          type="submit"
          aria-label="Open email to subscribe to product updates"
          className="h-7 w-7 rounded-full bg-zinc-900 text-white inline-flex items-center justify-center hover:bg-zinc-700 active:scale-95 transition-all"
        >
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
      {hint === 'invalid' && (
        <span className="text-[10.5px] text-red-600/90 pl-1" role="status">
          Enter a valid email first.
        </span>
      )}
    </form>
  );
}

/* ══ Footer ══════════════════════════════════════════════════ */

export function SiteFooter() {
  const year = new Date().getFullYear();
  const pathname = usePathname() || '/';
  const onLanding = pathname === '/' || pathname === '/global' || pathname === '/global/';
  const anchorHref = (hash: string) => (onLanding ? hash : `/${hash}`);

  return (
    <footer
      className="relative"
      style={{
        background:
          'linear-gradient(to bottom right, rgba(16,185,129,0.10) 0%, rgba(245,158,11,0.06) 55%, rgba(255,255,255,0.35) 100%)',
        borderTop: '1px solid rgba(16,185,129,0.22)',
      }}
    >
      <div
        aria-hidden
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.5), transparent)',
        }}
      />

      <div className="container mx-auto px-6 py-14 md:py-16 max-w-6xl">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          <div className="lg:col-span-7">
            <Link
              href="/"
              className="inline-block mb-6 rounded-lg outline-offset-2 focus-visible:ring-2 focus-visible:ring-zinc-400/30"
              aria-label="Chivox MCP"
            >
              <ChivoxMcpBrand onWarm />
            </Link>

            <div className="text-[13.5px] font-medium text-zinc-800 mb-4">Stay connected with us</div>

            <div className="flex flex-wrap items-center gap-2.5 mb-4">
              <SocialIcon label="X / Twitter" href="https://x.com/">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden>
                  <path d="M17.6 3h3.3l-7.2 8.3L22 21h-6.6l-5.2-6.7L4.3 21H1l7.8-8.9L1 3h6.8l4.7 6.2L17.6 3zm-1.1 16h1.8L7.6 5H5.6l10.9 14z" fill="currentColor" />
                </svg>
              </SocialIcon>
              <SocialIcon label="LinkedIn" href="https://linkedin.com/">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden>
                  <path d="M4.98 3.5A2.5 2.5 0 1 1 4.97 8.5a2.5 2.5 0 0 1 .01-5zM3 9.5h4v11H3v-11zm6 0h3.8v1.5h.1c.5-1 1.9-2 3.9-2 4.2 0 5 2.7 5 6.2v5.3h-4v-4.7c0-1.1 0-2.6-1.6-2.6-1.6 0-1.8 1.2-1.8 2.5v4.8H9v-11z" fill="currentColor" />
                </svg>
              </SocialIcon>
              <SocialIcon label="GitHub" href="https://github.com/">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden>
                  <path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.6 1 1.6 1 .9 1.5 2.4 1.1 3 .8.1-.6.3-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.7 1a9.4 9.4 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.8v2.7c0 .3.2.6.7.5A10 10 0 0 0 12 2z" fill="currentColor" />
                </svg>
              </SocialIcon>
              <SocialIcon label="YouTube" href="https://youtube.com/">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden>
                  <path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18 5 12 5 12 5s-6 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C6 19 12 19 12 19s6 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3L10 15z" fill="currentColor" />
                </svg>
              </SocialIcon>
              <SocialIcon label="Discord" href="https://discord.com/">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden>
                  <path d="M19.7 4.9A17 17 0 0 0 15.4 3.5a.1.1 0 0 0-.1 0c-.2.3-.4.7-.6 1.1a16 16 0 0 0-4.6 0c-.2-.4-.4-.8-.6-1.1a.1.1 0 0 0-.1 0A17 17 0 0 0 5 4.9a.1.1 0 0 0 0 0A17 17 0 0 0 2 14.7a.1.1 0 0 0 0 .1 17 17 0 0 0 5 2.6.1.1 0 0 0 .1 0c.4-.5.7-1 1-1.6a.1.1 0 0 0-.1-.2 12 12 0 0 1-1.7-.8.1.1 0 0 1 0-.2l.3-.2a.1.1 0 0 1 .1 0 12 12 0 0 0 10.5 0 .1.1 0 0 1 .1 0l.3.2a.1.1 0 0 1 0 .2 11 11 0 0 1-1.6.8.1.1 0 0 0-.1.2c.3.6.6 1.1 1 1.6a.1.1 0 0 0 .1 0 17 17 0 0 0 5-2.6.1.1 0 0 0 0-.1 17 17 0 0 0-3-9.8.1.1 0 0 0 0 0zM8.7 13.2c-1 0-1.8-1-1.8-2.1s.8-2.1 1.8-2.1 1.8 1 1.8 2.1-.8 2.1-1.8 2.1zm6.6 0c-1 0-1.8-1-1.8-2.1s.8-2.1 1.8-2.1 1.8 1 1.8 2.1-.8 2.1-1.8 2.1z" fill="currentColor" />
                </svg>
              </SocialIcon>

              <FooterSubscribePill />
            </div>

            <p className="text-[11.5px] text-zinc-600 leading-relaxed max-w-md">
              Product-update sign-up: enter your work email and tap the arrow — your mail app opens
              with a short note to <span className="font-medium text-zinc-700">BD@chivox.com</span>{' '}
              so we can add you to the list. No spam. Unsubscribe anytime by replying.
            </p>
          </div>

          <div className="lg:col-span-5 lg:pl-6">
            <div className="text-[13.5px] font-medium text-zinc-800 mb-4">Developers</div>
            <ul className="flex flex-col gap-3 text-[14px] text-zinc-700">
              <li>
                <Link href={anchorHref('#quickstart')} className="hover:text-zinc-900 transition-colors">
                  Quickstart
                </Link>
              </li>
              <li>
                <Link href={anchorHref('#mandarin-moat')} className="hover:text-zinc-900 transition-colors">
                  Mandarin moat
                </Link>
              </li>
              <li>
                <Link href="/reasoning" className="hover:text-zinc-900 transition-colors">
                  Reasoning engine
                </Link>
              </li>
              <li>
                <Link href="/runtime" className="hover:text-zinc-900 transition-colors">
                  Runtime
                </Link>
              </li>
              <li>
                <Link href="/docs" className="hover:text-zinc-900 transition-colors">
                  Docs
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-zinc-900 transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href={anchorHref('#contact')} className="hover:text-zinc-900 transition-colors">
                  Contact sales
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 hover:text-zinc-900 transition-colors"
                >
                  GitHub
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-5 border-t border-zinc-900/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-zinc-600">
          <span>Built by speech scientists. Trusted by 10k+ voice-AI builders.</span>
          <span>©{year} Chivox Inc. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className="h-8 w-8 rounded-full border border-zinc-900/20 text-zinc-700 hover:text-zinc-900 hover:border-zinc-900/50 bg-transparent inline-flex items-center justify-center transition-colors"
    >
      {children}
    </a>
  );
}
