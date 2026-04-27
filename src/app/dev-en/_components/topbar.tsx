'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Moon, Search, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useLang } from '../_lib/use-lang';
import { openPalette } from '../_lib/ui-store';

type Crumb = { href?: string; en: string; zh: string };

/**
 * Pathname → breadcrumb trail. We resolve the deepest matching prefix and
 * build the trail from the tree — every intermediate segment also gets
 * registered here so the topbar stays consistent as the user drills down
 * into nested tabs (e.g. Billing → History, Settings → Members).
 */
const ROUTE_CRUMBS: Record<string, Crumb[]> = {
  '/dashboard/overview': [
    { en: 'Overview', zh: '概览' },
  ],
  '/dashboard/keys': [
    { en: 'API Keys', zh: 'API 密钥' },
  ],
  '/dashboard/usage': [
    { en: 'Usage', zh: '用量' },
  ],
  '/dashboard/billing': [
    { href: '/dashboard/billing', en: 'Billing', zh: '账单' },
    { en: 'Overview', zh: '概览' },
  ],
  '/dashboard/billing/history': [
    { href: '/dashboard/billing', en: 'Billing', zh: '账单' },
    { en: 'History', zh: '充值记录' },
  ],
  '/dashboard/billing/rates': [
    { href: '/dashboard/billing', en: 'Billing', zh: '账单' },
    { en: 'Rates', zh: '费率' },
  ],
  '/dashboard/settings': [
    { href: '/dashboard/settings', en: 'Settings', zh: '设置' },
    { en: 'Notifications', zh: '通知' },
  ],
  '/dashboard/settings/members': [
    { href: '/dashboard/settings', en: 'Settings', zh: '设置' },
    { en: 'Members', zh: '团队成员' },
  ],
};

function resolveCrumbs(pathname: string): Crumb[] {
  if (ROUTE_CRUMBS[pathname]) return ROUTE_CRUMBS[pathname];
  // Fallback — pick the longest registered prefix so unknown sub-routes
  // still show a reasonable trail instead of collapsing to "Dashboard".
  const keys = Object.keys(ROUTE_CRUMBS).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    if (pathname.startsWith(k + '/')) return ROUTE_CRUMBS[k];
  }
  return [];
}

/**
 * Sticky top bar following the 2025+ SaaS convention (Linear, Vercel,
 * PostHog, Supabase): thin bar, section breadcrumb on the left, utility
 * actions (Docs, Help, theme toggle) on the right. Now breadcrumb-aware
 * so Billing and Settings tabs render a "Dashboard › Billing › History"
 * trail instead of just "Billing".
 */
export function DevEnTopBar() {
  const pathname = usePathname() ?? '';
  const crumbs = resolveCrumbs(pathname);
  const { t } = useLang();

  return (
    <div className="sticky top-0 z-30 h-14 flex items-center gap-3 px-4 lg:px-6 bg-background/80 backdrop-blur-md border-b border-border/60">
      <div className="flex items-center gap-1.5 min-w-0 pl-10 lg:pl-0">
        <span className="text-[13px] text-muted-foreground hidden sm:inline">
          {t('Dashboard', '控制台')}
        </span>
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <span key={i} className="flex items-center gap-1.5 min-w-0">
              <ChevronRight className="h-3 w-3 text-border shrink-0 hidden sm:block" />
              {crumb.href && !isLast ? (
                <Link
                  href={crumb.href}
                  className="text-[13px] text-muted-foreground hover:text-foreground truncate"
                >
                  {t(crumb.en, crumb.zh)}
                </Link>
              ) : (
                <span
                  className={cn(
                    'text-[13px] truncate',
                    isLast
                      ? 'font-semibold tracking-[-0.01em] text-foreground'
                      : 'text-muted-foreground',
                  )}
                >
                  {t(crumb.en, crumb.zh)}
                </span>
              )}
            </span>
          );
        })}
      </div>

      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          onClick={openPalette}
          className="inline-flex items-center gap-2 h-8 px-2.5 rounded-md text-[12px] text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          aria-label={t('Open command palette (⌘K)', '打开命令面板 (⌘K)')}
          title={t('Search · ⌘K', '搜索 · ⌘K')}
        >
          <Search className="h-3.5 w-3.5" />
          <kbd className="hidden md:inline text-[10px] font-medium px-1 h-4 leading-[14px] rounded border border-border">
            ⌘K
          </kbd>
        </button>
        <Link
          href="/global/docs?from=dev"
          className="hidden md:inline-flex items-center h-8 px-2.5 rounded-md text-[12px] text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          title={t('Open product docs', '打开产品文档')}
        >
          {t('Docs', '文档')}
        </Link>
        <ThemeToggle />
      </div>
    </div>
  );
}

function readInitialTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  const stored = window.localStorage.getItem('dev-en:theme');
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Toggle between light and dark by flipping a `dark` class on <html>.
 * Persists to localStorage so the preference survives reloads.
 */
function ThemeToggle() {
  const [mode, setMode] = useState<'light' | 'dark'>(readInitialTheme);
  const { t } = useLang();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', mode === 'dark');
  }, [mode]);

  // Command palette toggles the theme by flipping the DOM class directly;
  // sync our local state when that happens so the icon matches.
  useEffect(() => {
    const sync = () => {
      const next = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      setMode((prev) => (prev === next ? prev : next));
    };
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const toggle = () => {
    const next = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('dev-en:theme', next);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
      aria-label={
        mode === 'dark'
          ? t('Switch to light mode', '切换到浅色模式')
          : t('Switch to dark mode', '切换到深色模式')
      }
      title={mode === 'dark' ? t('Light mode', '浅色模式') : t('Dark mode', '深色模式')}
    >
      {mode === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
    </button>
  );
}
