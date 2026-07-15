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
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Fragment,
  Suspense,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ButtonHTMLAttributes,
  type FormEvent,
} from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  LayoutDashboard,
  Loader2,
  Mail,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NavMegaIcon, type NavMegaIconId } from '@/components/nav-mega-icons';
import {
  sendGlobalContactEmail,
  type GlobalContactFormData,
  type GlobalContactUseCase,
} from '@/app/actions/send-global-contact';

/** Dispatched from CTAs (e.g. pricing) so TopNav opens the in-page contact modal. */
export const OPEN_CONTACT_EVENT = 'chivox:open-contact';

export function openGlobalContact() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(OPEN_CONTACT_EVENT));
}

/** Opens the shared TopNav contact form (server-sent email, not mailto). */
export function OpenContactButton({
  children,
  className,
  onClick,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={className}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) openGlobalContact();
      }}
      {...props}
    >
      {children}
    </button>
  );
}

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

export const NAV_GROUPS: readonly {
  label: string;
  items: readonly {
    href: string;
    label: string;
    summary: string;
    eyebrow: string;
    icon: NavMegaIconId;
    accent: string;
  }[];
}[] = [
  {
    label: 'Products',
    items: [
      {
        href: '/products/english-speech-assessment',
        label: 'English assessment',
        summary: 'Pronunciation, fluency and phoneme feedback.',
        eyebrow: 'Product',
        icon: 'english',
        accent: 'from-sky-500/15 to-sky-500/0',
      },
      {
        href: '/products/mandarin-chinese-assessment',
        label: 'Mandarin assessment',
        summary: 'Tone, Pinyin and fluency scoring.',
        eyebrow: 'Product',
        icon: 'mandarin',
        accent: 'from-rose-500/15 to-rose-500/0',
      },
      {
        href: '/products/kids-speech-assessment',
        label: 'Kids speech assessment',
        summary: 'Structured feedback for young learners.',
        eyebrow: 'Product',
        icon: 'kids',
        accent: 'from-amber-500/15 to-amber-500/0',
      },
    ],
  },
  {
    label: 'AI Solutions',
    items: [
      {
        href: '/solutions/ai-language-tutor',
        label: 'AI language tutor',
        summary: 'Listen, diagnose, and coach inside one learner conversation.',
        eyebrow: 'Solution',
        icon: 'tutor',
        accent: 'from-teal-500/15 to-teal-500/0',
      },
      {
        href: '/solutions/voice-agent',
        label: 'Voice Agent',
        summary: 'Add real-time pronunciation scoring to voice-native agents.',
        eyebrow: 'Solution',
        icon: 'reasoning',
        accent: 'from-violet-500/15 to-violet-500/0',
      },
    ],
  },
];

/** Shared desktop mega-menu chrome — keep all navigation groups visually consistent. */
const NAV_PANEL_SURFACE = {
  background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(252,248,240,0.98) 100%)',
  backdropFilter: 'blur(28px) saturate(180%)',
  WebkitBackdropFilter: 'blur(28px) saturate(180%)',
  boxShadow:
    'inset 0 1px 0 rgba(255,255,255,0.95), inset 0 0 0 1px rgba(255,255,255,0.55), 0 28px 60px -22px rgba(16,52,33,0.32), 0 8px 22px -12px rgba(16,185,129,0.22)',
} as const;

function navTriggerClass(scrolled: boolean, active: boolean) {
  return cn(
    'inline-flex items-center gap-1 rounded-full transition-all duration-300',
    scrolled ? 'px-2.5 py-1' : 'px-3 py-1.5',
    active
      ? 'text-zinc-900 bg-gradient-to-b from-emerald-50 to-white shadow-[inset_0_0_0_1px_rgba(16,185,129,0.25)]'
      : 'hover:text-zinc-900 hover:bg-zinc-900/[0.04]',
  );
}

function navMenuItemClass(isOn: boolean) {
  return cn(
    'group/item relative flex min-h-[72px] items-start gap-3 rounded-xl px-2.5 py-2.5',
    'transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
    isOn
      ? 'bg-emerald-500/[0.09] ring-1 ring-emerald-500/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] hover:bg-emerald-500/[0.14]'
      : 'hover:bg-emerald-500/[0.06] hover:ring-1 hover:ring-emerald-500/20 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_6px_16px_-10px_rgba(16,185,129,0.30)] hover:-translate-y-[1px]',
  );
}

function navIconTileClass(accent: string) {
  return cn(
    'mt-[2px] inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
    'bg-gradient-to-br ring-1 ring-inset ring-zinc-900/[0.06]',
    'shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]',
    'transition-transform duration-300 group-hover/item:scale-[1.04]',
    accent,
  );
}

/** Primary direct links. Product and solution detail pages live in the
 *  two dropdown groups above, while these high-intent destinations stay
 *  one click away. */
const NAV_ITEMS: readonly NavItem[] = [
  { href: '/demo', label: 'Demo', external: true },
  { href: '/pricing', label: 'Pricing', external: true },
] as const;

/** Developer implementation and production-operation destinations. */
export const DEVELOPER_ITEMS: readonly {
  href: string;
  label: string;
  summary: string;
  eyebrow: string;
  icon: NavMegaIconId;
  accent: string;
}[] = [
  {
    href: '/docs',
    label: 'Documentation',
    summary: 'Quickstarts, API reference, response fields, and integration guides.',
    eyebrow: 'Build',
    icon: 'docs',
    accent: 'from-sky-500/15 to-sky-500/0',
  },
  {
    href: '/products/mcp-server',
    label: 'MCP server',
    summary: 'Connect through a standardized agent-tool protocol.',
    eyebrow: 'Integrate',
    icon: 'mcp',
    accent: 'from-emerald-500/15 to-emerald-500/0',
  },
  {
    href: '/solutions/function-calling',
    label: 'Function calling API',
    summary: 'Call speech assessment from your own agent stack.',
    eyebrow: 'Integrate',
    icon: 'function',
    accent: 'from-violet-500/15 to-violet-500/0',
  },
  {
    href: '/runtime',
    label: 'Runtime & operations',
    summary: 'Plan keys, budgets, alerts, privacy, and production scale.',
    eyebrow: 'Operate',
    icon: 'runtime',
    accent: 'from-amber-500/15 to-amber-500/0',
  },
] as const;

/** Company and editorial pages, grouped under the top-level "About" entry. */
export const ABOUT_ITEMS: readonly {
  href: string;
  label: string;
  summary: string;
  eyebrow: string;
  icon: NavMegaIconId;
  accent: string;
}[] = [
  {
    href: '/about',
    label: 'Why Chivox',
    summary: '20 years of speech assessment and voice AI R&D.',
    eyebrow: 'Company',
    icon: 'english',
    accent: 'from-emerald-500/15 to-emerald-500/0',
  },
  {
    href: '/faq',
    label: 'FAQ',
    summary: 'Integration speed, languages, streaming, accuracy, pricing.',
    eyebrow: 'Answers',
    icon: 'faq',
    accent: 'from-sky-500/15 to-sky-500/0',
  },
  {
    href: '/blog',
    label: 'Blog',
    summary:
      'Deep dives on speech evidence, tutor loops, Mandarin tone feedback, and production speech APIs.',
    eyebrow: 'Insights',
    icon: 'docs',
    accent: 'from-violet-500/15 to-violet-500/0',
  },
] as const;

const SECONDARY_NAV_GROUPS = [
  { label: 'Developers', eyebrow: 'build, integrate & operate', items: DEVELOPER_ITEMS },
  { label: 'About', eyebrow: 'company', items: ABOUT_ITEMS },
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
      href="/dashboard"
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  /** Only one desktop mega-menu open at a time — avoids Products/Solutions stacking. */
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRaf = useRef<number | null>(null);

  const openNavMenu = (id: string) => {
    if (menuCloseTimer.current) {
      clearTimeout(menuCloseTimer.current);
      menuCloseTimer.current = null;
    }
    setOpenMenu(id);
  };

  const scheduleCloseNavMenu = () => {
    if (menuCloseTimer.current) clearTimeout(menuCloseTimer.current);
    menuCloseTimer.current = setTimeout(() => {
      menuCloseTimer.current = null;
      setOpenMenu(null);
    }, 100);
  };

  useEffect(() => {
    return () => {
      if (menuCloseTimer.current) clearTimeout(menuCloseTimer.current);
    };
  }, []);

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

  // Track the visible section so the corresponding pill lights up.
  // We pick the section whose top has just crossed a probe line just
  // below the sticky nav. This is more robust than IntersectionObserver
  // for tall sections and small viewports, because there's *always*
  // exactly one match no matter the layout.
  useEffect(() => {
    if (!onLanding) return;
    const ids = NAV_ITEMS.filter((i) => !i.external && i.href.startsWith('#')).map(
      (i) => i.href.slice(1),
    );
    if (ids.length === 0) return;

    let raf = 0;
    const probeOffset = 120; // px below viewport top — accounts for sticky nav

    const compute = () => {
      raf = 0;
      const probe = window.scrollY + probeOffset;
      let currentId: string | null = null;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= probe) {
          currentId = id;
        }
      }
      // Fallback: if none has crossed yet, light up the first one.
      setActive(currentId ? `#${currentId}` : `#${ids[0]}`);
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(compute);
    };

    compute();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [onLanding]);

  // Close contact modal on Escape.
  useEffect(() => {
    if (!contactOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContactOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [contactOpen]);

  // Pricing / other CTAs open the same in-page contact form via custom event.
  useEffect(() => {
    const onOpen = () => setContactOpen(true);
    window.addEventListener(OPEN_CONTACT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_CONTACT_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  const anchorHref = (hash: string) => (onLanding ? hash : `/${hash}`);
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
              className="shrink-0 rounded-lg outline-offset-2 focus-visible:ring-2 focus-visible:ring-zinc-400/40"
              aria-label="Chivox MCP home"
            >
              <ChivoxMcpBrand compact={scrolled} />
            </Link>

            <nav
              className={cn(
                'hidden md:flex items-center justify-end flex-1 min-w-0 font-medium tracking-[-0.01em] text-zinc-800',
                'transition-[font-size,gap] duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
                scrolled ? 'text-[13px] gap-0' : 'text-[14.5px] gap-0.5 lg:gap-1',
              )}
              aria-label="Page sections"
            >
              {NAV_GROUPS.map((group) => {
                const isGroupActive = group.items.some((item) => pathname.startsWith(item.href));
                const isOpen = openMenu === group.label;
                return (
                  <div
                    key={group.label}
                    className="relative"
                    onMouseEnter={() => openNavMenu(group.label)}
                    onMouseLeave={scheduleCloseNavMenu}
                    onFocusCapture={() => openNavMenu(group.label)}
                    onBlurCapture={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                        scheduleCloseNavMenu();
                      }
                    }}
                  >
                    <button
                      type="button"
                      className={navTriggerClass(scrolled, isGroupActive || isOpen)}
                      aria-haspopup="menu"
                      aria-expanded={isOpen}
                    >
                      {group.label}
                      <ChevronDown
                        className={cn(
                          'h-3.5 w-3.5 opacity-60 transition-transform duration-200',
                          isOpen && 'rotate-180',
                        )}
                      />
                    </button>
                    <div
                      role="menu"
                      className={cn(
                        'absolute left-0 top-full z-50 w-[360px] origin-top-left overflow-hidden rounded-2xl border border-emerald-500/[0.16] pt-3 transition-[opacity,transform] duration-150',
                        isOpen
                          ? 'visible opacity-100 translate-y-0 pointer-events-auto'
                          : 'invisible opacity-0 -translate-y-1 pointer-events-none',
                      )}
                      style={NAV_PANEL_SURFACE}
                    >
                      <span
                        aria-hidden
                        className="absolute top-[6px] left-7 h-3 w-3 rotate-45 border-l border-t border-emerald-500/[0.18]"
                        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(252,248,240,0.98))' }}
                      />
                      <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
                        <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-emerald-700/85">/{group.label}</span>
                        <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-400">{group.label === 'Products' ? 'assessment suite' : 'agent patterns'}</span>
                      </div>
                      <div className="px-2 pt-1 pb-3">
                      {group.items.map((item) => {
                        const isOn = pathname.startsWith(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            role="menuitem"
                            aria-current={isOn ? 'page' : undefined}
                            className={navMenuItemClass(isOn)}
                          >
                            <span aria-hidden className={navIconTileClass(item.accent)}>
                              <NavMegaIcon id={item.icon} />
                            </span>
                            <div className="min-w-0 flex-1 pr-4">
                              <div className="flex items-baseline justify-between gap-2">
                                <span className="text-[14px] font-semibold tracking-[-0.005em] text-zinc-900">{item.label}</span>
                                {isOn ? (
                                  <span className="text-[10px] font-mono text-emerald-700">● current</span>
                                ) : (
                                  <span className="text-[9.5px] font-mono uppercase tracking-[0.16em] text-zinc-400 transition-colors group-hover/item:text-emerald-700/80">{item.eyebrow}</span>
                                )}
                              </div>
                              <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">{item.summary}</p>
                            </div>
                            <ArrowUpRight
                              className={cn(
                                'absolute right-2.5 bottom-2.5 h-3.5 w-3.5 text-zinc-400 transition-all duration-300',
                                'group-hover/item:text-emerald-700 group-hover/item:translate-x-[2px] group-hover/item:-translate-y-[2px]',
                                isOn && 'opacity-0',
                              )}
                            />
                          </Link>
                        );
                      })}
                      </div>
                    </div>
                  </div>
                );
              })}

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

              {SECONDARY_NAV_GROUPS.map((group) => {
                const isOpen = openMenu === group.label;
                return (
                  <div
                    key={group.label}
                    className="relative"
                    onMouseEnter={() => openNavMenu(group.label)}
                    onMouseLeave={scheduleCloseNavMenu}
                    onFocusCapture={() => openNavMenu(group.label)}
                    onBlurCapture={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                        scheduleCloseNavMenu();
                      }
                    }}
                  >
                    <button
                      type="button"
                      aria-haspopup="menu"
                      aria-expanded={isOpen}
                      className={navTriggerClass(scrolled, isOpen)}
                    >
                      {group.label}
                      <ChevronDown
                        className={cn(
                          'h-3.5 w-3.5 opacity-60 transition-transform duration-200',
                          isOpen && 'rotate-180',
                        )}
                      />
                    </button>
                    <div
                      role="menu"
                      className={cn(
                        'resources-pop absolute right-0 top-full z-50 w-[360px] origin-top-right overflow-hidden rounded-2xl border border-emerald-500/[0.16] pt-3 transition-[opacity,transform] duration-150',
                        isOpen
                          ? 'visible opacity-100 translate-y-0 pointer-events-auto'
                          : 'invisible opacity-0 -translate-y-1 pointer-events-none',
                      )}
                      style={NAV_PANEL_SURFACE}
                    >
                      <span
                        aria-hidden
                        className="absolute top-[6px] right-7 h-3 w-3 rotate-45 border-l border-t border-emerald-500/[0.18]"
                        style={{
                          background:
                            'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(252,248,240,0.98))',
                        }}
                      />
                      <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
                        <span className="text-[10px] font-mono tracking-[0.22em] uppercase text-emerald-700/85">
                          /{group.label}
                        </span>
                        <span className="text-[10px] font-mono tracking-[0.14em] uppercase text-zinc-400">
                          {group.eyebrow}
                        </span>
                      </div>
                      <div className="px-2 pt-1 pb-3">
                        {group.items.map((item, i) => {
                          const isOn = pathname.startsWith(item.href);
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              role="menuitem"
                              style={{ animationDelay: `${60 + i * 55}ms` }}
                              className={cn(navMenuItemClass(isOn), 'resources-row')}
                            >
                              <span aria-hidden className={navIconTileClass(item.accent)}>
                                <NavMegaIcon id={item.icon} />
                              </span>
                              <div className="min-w-0 flex-1 pr-4">
                                <div className="flex items-baseline justify-between gap-2">
                                  <span className="text-[14px] font-semibold text-zinc-900 tracking-[-0.005em]">
                                    {item.label}
                                  </span>
                                  {isOn ? (
                                    <span className="text-[10px] font-mono text-emerald-700">● current</span>
                                  ) : (
                                    <span className="text-[9.5px] font-mono uppercase tracking-[0.16em] text-zinc-400 group-hover/item:text-emerald-700/80 transition-colors">
                                      {item.eyebrow}
                                    </span>
                                  )}
                                </div>
                                <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">
                                  {item.summary}
                                </p>
                              </div>
                              <ArrowUpRight
                                className={cn(
                                  'absolute right-2.5 bottom-2.5 h-3.5 w-3.5 text-zinc-400 transition-all duration-300',
                                  'group-hover/item:text-emerald-700 group-hover/item:translate-x-[2px] group-hover/item:-translate-y-[2px]',
                                  isOn && 'opacity-0',
                                )}
                              />
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}

              <a
                href="https://github.com/chivox-developer/chivox-speech-eval-mcp"
                target="_blank"
                rel="noreferrer"
                aria-label="Chivox MCP on GitHub"
                title="GitHub"
                className={cn(
                  'inline-flex items-center justify-center rounded-full text-zinc-700 hover:text-zinc-900 hover:bg-zinc-900/[0.04] transition-all duration-300',
                  scrolled ? 'h-7 w-7' : 'h-8 w-8',
                )}
              >
                <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" aria-hidden>
                  <path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.6 1 1.6 1 .9 1.5 2.4 1.1 3 .8.1-.6.3-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.7 1a9.4 9.4 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.8v2.7c0 .3.2.6.7.5A10 10 0 0 0 12 2z" fill="currentColor" />
                </svg>
              </a>
            </nav>

            <div className="flex items-center gap-2 shrink-0 ml-auto md:ml-0">
              <button
                type="button"
                onClick={() => setContactOpen(true)}
                className={cn(
                  'hidden md:inline-flex items-center gap-1.5 text-sm font-medium rounded-full',
                  'border border-zinc-900/[0.12] bg-white/55 backdrop-blur-md text-zinc-800',
                  'hover:bg-white/85 hover:border-zinc-900/25 hover:text-zinc-900 hover:-translate-y-px',
                  'transition-[height,padding,box-shadow,transform,background-color,border-color] duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
                  'shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]',
                  scrolled ? 'h-[34px] px-3 text-[13px]' : 'h-10 px-3.5',
                )}
              >
                Contact
              </button>
              <button
                type="button"
                onClick={() => setMobileOpen((open) => !open)}
                aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={mobileOpen}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-900/[0.12] bg-white/65 text-zinc-800 shadow-sm md:hidden"
              >
                {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
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

      {mobileOpen && (
        <div className="fixed inset-0 z-[35] md:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-zinc-950/20 backdrop-blur-sm"
          />
          <nav
            aria-label="Mobile navigation"
            className="absolute inset-x-3 top-[84px] max-h-[calc(100vh-96px)] overflow-y-auto rounded-3xl border border-emerald-500/[0.18] bg-[#fffdf8]/95 p-4 shadow-[0_30px_70px_-28px_rgba(16,52,33,0.45)] backdrop-blur-2xl"
          >
            {[...NAV_GROUPS, ...SECONDARY_NAV_GROUPS].map((group) => (
              <div key={group.label} className="mb-5 last:mb-0">
                <div className="px-2 text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-700">/{group.label}</div>
                <div className="mt-2 grid gap-1">
                  {group.items.map((item) => (
                    <Link key={item.href} href={item.href} className="rounded-xl px-3 py-2.5 hover:bg-emerald-500/[0.07]">
                      <div className="text-[14px] font-semibold text-zinc-900">{item.label}</div>
                      <div className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">{item.summary}</div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            <div className="grid grid-cols-2 gap-2 border-t border-zinc-900/[0.08] pt-4">
              {NAV_ITEMS.map((item) => (
                <Link key={`${item.href}-${item.label}`} href={item.href} className="rounded-xl border border-zinc-900/[0.08] bg-white/65 px-3 py-2.5 text-[13px] font-semibold text-zinc-800">
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      )}

      {contactOpen && (
        <div className="fixed inset-0 z-[120]">
          <button
            type="button"
            aria-label="Close contact"
            onClick={() => setContactOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-6xl">
              <div
                className="relative rounded-3xl border border-emerald-500/[0.18] overflow-hidden"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(251,246,233,0.94) 100%)',
                  backdropFilter: 'blur(30px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(30px) saturate(180%)',
                  boxShadow:
                    'inset 0 1px 0 rgba(255,255,255,0.95), inset 0 0 0 1px rgba(255,255,255,0.55), 0 36px 80px -36px rgba(16,52,33,0.44), 0 12px 28px -18px rgba(16,185,129,0.22)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setContactOpen(false)}
                  aria-label="Close"
                  className="absolute right-4 top-4 z-20 h-9 w-9 rounded-full border border-zinc-900/10 bg-white/70 hover:bg-white text-zinc-900 flex items-center justify-center shadow-sm"
                >
                  ×
                </button>

                <div className="p-6 md:p-8">
                  <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
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
                            href="mailto:ming.zhao@chivox.com?subject=Chivox%20MCP%20inquiry"
                            className="inline-flex items-center gap-2 text-zinc-900 hover:text-emerald-700 transition-colors"
                          >
                            <Mail className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="font-medium">ming.zhao@chivox.com</span>
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
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ══ Back-to-overview breadcrumb — shown on sub-pages ═══════ */

function overviewCrumbs(current?: string) {
  const items: { label: string; href?: string }[] = [{ label: 'Home', href: '/' }];
  if (current) items.push({ label: current });
  return items;
}

export function BackToOverview({
  containerClassName,
  current,
}: {
  containerClassName?: string;
  current?: string;
} = {}) {
  return (
    <Suspense
      fallback={
        <BreadcrumbPill containerClassName={containerClassName} items={overviewCrumbs(current)} />
      }
    >
      <BackToOverviewInner containerClassName={containerClassName} current={current} />
    </Suspense>
  );
}

function BackToOverviewInner({
  containerClassName,
  current,
}: {
  containerClassName?: string;
  current?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const fallbackHref = from === 'dev' ? '/dashboard/overview' : '/';

  const handleBack = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    // Prefer true "go back" so docs opened from keys/overview/etc returns
    // to the exact previous page. If there's no reliable same-origin referrer
    // (direct open/new tab), fall back to a deterministic destination.
    const hasHistory = typeof window !== 'undefined' && window.history.length > 1;
    const referrer = typeof document !== 'undefined' ? document.referrer : '';
    const sameOriginReferrer =
      typeof window !== 'undefined' &&
      !!referrer &&
      referrer.startsWith(window.location.origin) &&
      !/\/(global\/docs|docs)(\?|#|$)/.test(referrer);

    if (hasHistory && sameOriginReferrer) {
      router.back();
      return;
    }
    router.push(fallbackHref);
  };

  return (
    <BreadcrumbPill
      containerClassName={containerClassName}
      items={overviewCrumbs(current)}
      backHref={fallbackHref}
      onBack={handleBack}
    />
  );
}

/* Shared pill shell so every back-link / breadcrumb reads as one family.
 * Hover model (identical on every page): hovering anywhere on the pill lifts
 * the shell (emerald border, brighter glass, soft green glow) and pre-tints
 * the back circle; hovering a segment link turns that segment emerald; and
 * hovering the back circle itself deepens it and nudges the arrow left. */
const CRUMB_PILL_CLASS = cn(
  'group/pill inline-flex items-center gap-1.5 rounded-full pl-2.5 pr-3.5 py-1.5',
  'text-[12.5px] font-medium text-zinc-700',
  'border border-zinc-900/[0.08] bg-white/55 backdrop-blur-md',
  'shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_1px_3px_rgba(24,24,27,0.04)]',
  'transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
  'hover:border-emerald-500/30 hover:bg-white/80',
  'hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_4px_14px_-6px_rgba(16,185,129,0.25)]',
);

function CrumbArrowIcon() {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all duration-300',
        'bg-zinc-900/[0.04] text-zinc-500',
        'group-hover/pill:bg-emerald-500/[0.08] group-hover/pill:text-emerald-700/80',
        // ! so the deeper back-hover tint beats the pill-hover pre-tint (equal
        // specificity otherwise — both variants are active while on the circle).
        'group-hover/back:bg-emerald-500/15! group-hover/back:text-emerald-700!',
      )}
    >
      <ArrowLeft className="h-3 w-3 transition-transform duration-300 group-hover/back:-translate-x-0.5" />
    </span>
  );
}

/* The one breadcrumb pill used on every sub-page: [← back] Home / … / Current.
 * Same shell, same inner format everywhere; vertical position is always pt-6
 * under the nav, and the container must match the page's own content column
 * width so the pill sits on its left edge (default fits max-w-6xl pages). */
export const CRUMB_CONTAINER_CLASS = 'container mx-auto px-6 max-w-6xl pt-6';

export function BreadcrumbPill({
  items,
  containerClassName = CRUMB_CONTAINER_CLASS,
  backHref,
  onBack,
}: {
  items: { label: string; href?: string }[];
  containerClassName?: string;
  backHref?: string;
  onBack?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  const back = backHref ?? items.find((item) => item.href)?.href ?? '/';
  return (
    <nav aria-label="Breadcrumb" className={containerClassName}>
      <div className={cn(CRUMB_PILL_CLASS, 'flex-wrap gap-2')}>
        <Link href={back} onClick={onBack} aria-label="Back" className="group/back -ml-0.5">
          <CrumbArrowIcon />
        </Link>
        {items.map((item, index) => (
          <Fragment key={`${item.label}-${index}`}>
            {index > 0 && (
              <span aria-hidden className="text-[10px] font-mono text-zinc-400">
                /
              </span>
            )}
            {item.href ? (
              <Link
                href={item.href}
                className="whitespace-nowrap transition-colors duration-300 hover:text-emerald-800"
              >
                {item.label}
              </Link>
            ) : (
              <span className="whitespace-nowrap text-zinc-500 transition-colors duration-300 group-hover/pill:text-zinc-600">
                {item.label}
              </span>
            )}
          </Fragment>
        ))}
      </div>
    </nav>
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
        className="absolute inset-0 opacity-[0.075]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,0,0,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.5) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage:
            'radial-gradient(ellipse 72% 58% at 50% 22%, black 38%, transparent 78%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 72% 58% at 50% 22%, black 38%, transparent 78%)',
        }}
      />
    </div>
  );
}

/* ══ Brand mark ══════════════════════════════════════════════ */

export function ChivoxMcpBrand({
  className,
  onWarm = false,
  compact = false,
}: {
  className?: string;
  onWarm?: boolean;
  /** Shrinks the mark + wordmark in sync with the condensed sticky nav. */
  compact?: boolean;
}) {
  return (
    <span className={cn('flex items-center gap-[5px] shrink-0 whitespace-nowrap', className)}>
      <span
        className={cn(
          'relative shrink-0 transition-[height,width] duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
          compact ? 'h-[2.7rem] w-[2.7rem]' : 'h-[3.6rem] w-[3.6rem]',
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand-mark-transparent.png" alt="" className="h-full w-full object-contain" />
      </span>
      <span
        className={cn(
          'font-bold tracking-[-0.02em] leading-none flex items-center gap-0.5',
          'transition-[font-size] duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
          compact ? 'text-[18px]' : 'text-[22px]',
        )}
      >
        <span className={onWarm ? 'text-zinc-900' : 'text-foreground'}>Chivox</span>
        <span className="bg-gradient-to-r from-[#1D72E8] to-[#F01681] bg-clip-text text-transparent">MCP</span>
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
  const [open, setOpen] = useState(false);

  return (
    <section
      id="contact"
      className="relative pt-12 md:pt-16 pb-20 md:pb-24 scroll-mt-28"
      style={{
        background:
          'linear-gradient(to bottom, rgba(251,246,233,0) 0%, rgba(16,185,129,0.05) 40%, rgba(245,158,11,0.04) 100%)',
      }}
    >
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-[11px] font-mono tracking-[0.22em] uppercase text-emerald-700 mb-3">
                /contact
              </div>
              <h2 className="heading-display text-3xl md:text-[40px] tracking-[-0.025em] leading-[1.08]">
                Let&rsquo;s build your voice agent together.
              </h2>
              <p className="text-muted-foreground text-[15px] leading-relaxed mt-4 max-w-xl">
                Tell us what you&rsquo;re building. We&rsquo;ll reply within one business day with
                pilot credits, pricing, or a deployment plan — whichever you need first.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              className={cn(
                'inline-flex items-center gap-2 h-11 px-5 rounded-full text-sm font-semibold',
                'border border-emerald-500/30 bg-white/70 backdrop-blur-sm text-emerald-800',
                'hover:bg-white hover:border-emerald-500/55 hover:-translate-y-px transition-all duration-200',
                'shadow-[0_10px_26px_-18px_rgba(16,185,129,0.55),inset_0_1px_0_rgba(255,255,255,0.8)]',
              )}
            >
              {open ? 'Hide contact form' : 'Contact us'}
              <ChevronDown
                className={cn('h-4 w-4 transition-transform', open && 'rotate-180')}
              />
            </button>
          </div>

          {open ? (
            <div className="mt-10 grid items-start gap-8 lg:grid-cols-12 lg:gap-12">
              <div className="lg:col-span-5">
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
                    href="mailto:ming.zhao@chivox.com?subject=Chivox%20MCP%20inquiry"
                    className="inline-flex items-center gap-2 text-zinc-900 hover:text-emerald-700 transition-colors"
                  >
                    <Mail className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="font-medium">ming.zhao@chivox.com</span>
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
          ) : null}
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
    source: `${pathname}#contact-modal`,
  });

  const inputClass =
    'w-full h-11 px-3.5 text-[14px] rounded-lg border border-zinc-900/[0.12] bg-white/70 backdrop-blur-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/15 transition-all disabled:opacity-60';

  const labelClass = 'block text-[12.5px] font-medium text-zinc-800 mb-1.5 tracking-[-0.005em]';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('idle');
    setErrorMsg('');
    startTransition(async () => {
      const result = await sendGlobalContactEmail({
        ...form,
        source: `${pathname}#contact-modal`,
      });
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
            href="mailto:ming.zhao@chivox.com"
            className="text-emerald-700 underline underline-offset-2 hover:no-underline"
          >
            ming.zhao@chivox.com
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
              source: `${pathname}#contact-modal`,
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
    window.location.href = `mailto:ming.zhao@chivox.com?subject=${subject}&body=${body}`;
  };

  return (
    <form onSubmit={submit} className="flex w-full max-w-[22rem] flex-col gap-1.5">
      <div className="flex h-11 w-full items-center gap-2 rounded-full border border-zinc-900/10 bg-white/70 p-1 pl-4 shadow-[0_8px_30px_-18px_rgba(39,39,42,0.45)] backdrop-blur-sm transition-all focus-within:border-emerald-600/35 focus-within:ring-4 focus-within:ring-emerald-500/10 hover:border-zinc-900/20">
        <input
          type="email"
          name="footer-subscribe-email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Work email"
          aria-label="Work email for product updates"
          autoComplete="email"
          className="min-w-0 flex-1 bg-transparent text-[13px] text-zinc-900 outline-none placeholder:text-zinc-500"
        />
        <button
          type="submit"
          aria-label="Open email to subscribe to product updates"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95"
        >
          <ArrowRight className="h-4 w-4" />
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

  return (
    <footer
      className="relative mt-16 overflow-hidden md:mt-20"
      style={{
        background:
          'linear-gradient(135deg, rgba(16,185,129,0.095) 0%, rgba(250,246,232,0.92) 48%, rgba(244,114,182,0.045) 100%)',
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

      <div className="container mx-auto max-w-7xl px-6 py-12 md:py-14 lg:px-8">
        <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-10 xl:gap-16">
          <div className="lg:col-span-4">
            <Link
              href="/"
              className="mb-5 inline-block rounded-lg outline-offset-2 focus-visible:ring-2 focus-visible:ring-zinc-400/30"
              aria-label="Chivox MCP"
            >
              <ChivoxMcpBrand onWarm compact />
            </Link>

            <p className="mb-7 max-w-sm text-[13px] leading-6 text-zinc-600">
              Speech assessment infrastructure for AI tutors, voice agents and language-learning products.
            </p>

            <div className="mb-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-zinc-800">
              Stay connected with us
            </div>
            <div className="mb-7 flex flex-wrap items-center gap-2">
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
              <SocialIcon label="GitHub" href="https://github.com/chivox-developer/chivox-speech-eval-mcp">
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
            </div>

            <div className="mb-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-zinc-800">
              Get product updates
            </div>

            <div className="mb-2">
              <FooterSubscribePill />
            </div>

            <p className="max-w-sm text-[11px] leading-relaxed text-zinc-500">
              A short note when something ships. No spam, unsubscribe anytime.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4 lg:col-span-8 lg:pt-1">
            <div>
              <div className="mb-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-zinc-800">
                Products
              </div>
              <ul className="flex flex-col gap-3 text-[13px] leading-5 text-zinc-600">
                <li><Link href="/products/english-speech-assessment" className="transition-colors hover:text-zinc-900">English assessment</Link></li>
                <li><Link href="/products/mandarin-chinese-assessment" className="transition-colors hover:text-zinc-900">Mandarin assessment</Link></li>
                <li><Link href="/products/kids-speech-assessment" className="transition-colors hover:text-zinc-900">Kids assessment</Link></li>
              </ul>
            </div>

            <div>
              <div className="mb-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-zinc-800">
                Solutions
              </div>
              <ul className="flex flex-col gap-3 text-[13px] leading-5 text-zinc-600">
                <li><Link href="/solutions/ai-language-tutor" className="transition-colors hover:text-zinc-900">AI language tutor</Link></li>
                <li><Link href="/solutions/voice-agent" className="transition-colors hover:text-zinc-900">Voice Agent</Link></li>
              </ul>
            </div>

            <div>
              <div className="mb-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-zinc-800">
                Developers
              </div>
              <ul className="flex flex-col gap-3 text-[13px] leading-5 text-zinc-600">
                <li><Link href="/docs" className="transition-colors hover:text-zinc-900">Documentation</Link></li>
                <li><Link href="/products/mcp-server" className="transition-colors hover:text-zinc-900">MCP server</Link></li>
                <li><Link href="/solutions/function-calling" className="transition-colors hover:text-zinc-900">Function calling API</Link></li>
                <li><Link href="/runtime" className="transition-colors hover:text-zinc-900">Runtime &amp; operations</Link></li>
              </ul>
            </div>

            <div>
              <div className="mb-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-zinc-800">
                About
              </div>
              <ul className="flex flex-col gap-3 text-[13px] leading-5 text-zinc-600">
                <li><Link href="/about" className="transition-colors hover:text-zinc-900">Why Chivox</Link></li>
                <li><Link href="/faq" className="transition-colors hover:text-zinc-900">FAQ</Link></li>
                <li><Link href="/blog" className="transition-colors hover:text-zinc-900">Blog</Link></li>
                <li><Link href="/about#customers" className="transition-colors hover:text-zinc-900">Customers</Link></li>
                <li>
                  <OpenContactButton className="text-left transition-colors hover:text-zinc-900">
                    Contact sales
                  </OpenContactButton>
                </li>
                <li>
                  <a
                    href="https://github.com/chivox-developer/chivox-speech-eval-mcp"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 transition-colors hover:text-zinc-900"
                  >
                    GitHub <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-zinc-900/10 pt-5 text-[11.5px] text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <span>Built by speech scientists. Trusted by 10k+ voice-AI builders.</span>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/legal/privacy" className="transition-colors hover:text-zinc-900">
              Privacy
            </Link>
            <Link href="/legal/terms" className="transition-colors hover:text-zinc-900">
              Terms
            </Link>
            <span>© {year} Chivox Inc.</span>
          </div>
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
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-900/15 bg-white/35 text-zinc-600 transition-all hover:-translate-y-0.5 hover:border-zinc-900/30 hover:bg-white/70 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/30"
    >
      {children}
    </a>
  );
}
