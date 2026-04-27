'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  AudioWaveform,
  BarChart3,
  BookOpen,
  ChevronsLeft,
  ChevronsRight,
  ExternalLink,
  Key,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  Search,
  Settings,
  User as UserIcon,
  X,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useMockAuth, type MockUser } from '../_lib/mock-auth';
import { useLang } from '../_lib/use-lang';
import { openPalette, toggleSidebar } from '../_lib/ui-store';
import { useUi } from '../_lib/use-ui-store';

type NavItem = {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  zhLabel: string;
};

// Flat five-item top-level nav — matches what OpenAI, Anthropic and Vercel
// ship in 2025. Team / Members and Top-ups / Rates live as tabs inside
// Settings and Billing respectively.
const NAV: NavItem[] = [
  { href: '/dashboard/overview', icon: LayoutDashboard, label: 'Overview', zhLabel: '概览' },
  { href: '/dashboard/keys', icon: Key, label: 'API Keys', zhLabel: 'API 密钥' },
  { href: '/dashboard/usage', icon: BarChart3, label: 'Usage', zhLabel: '用量' },
  { href: '/dashboard/billing', icon: Receipt, label: 'Billing', zhLabel: '账单' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings', zhLabel: '设置' },
];

// Keep a flat export for any caller outside this file.
export { NAV };

function isActiveHref(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + '/');
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '·';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function DevEnSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useMockAuth();
  const { t } = useLang();
  const [mobileOpen, setMobileOpen] = useState(false);
  const collapsed = useUi((s) => s.sidebarCollapsed);

  // ⌘B toggles the sidebar (Linear / Notion convention). We attach the
  // listener once at mount — keyboard shortcut conflicts get adjudicated
  // elsewhere (cmdk swallows keys when open).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 h-9 w-9 rounded-lg border border-border bg-background flex items-center justify-center hover:bg-muted transition-colors"
        aria-label="Open menu"
      >
        <Menu className="h-4 w-4" />
      </button>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 bg-[#0d0d0d] text-zinc-200 flex flex-col transition-[width,transform] duration-200 ease-out lg:translate-x-0 border-r border-white/5',
          // Mobile is always full width; desktop toggles between collapsed & expanded.
          collapsed ? 'lg:w-[60px] w-60' : 'w-60',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Brand row */}
        <div
          className={cn(
            'flex items-center h-14 border-b border-white/5',
            collapsed ? 'lg:justify-center lg:px-0 px-4 justify-between' : 'px-4 justify-between',
          )}
        >
          <Link
            href="/global"
            className={cn(
              'flex items-center gap-2.5 group flex-1 min-w-0',
              collapsed && 'lg:gap-0',
            )}
            aria-label="Chivox MCP"
          >
            <div className="relative h-7 w-7 rounded-md bg-white flex items-center justify-center ring-1 ring-white/10 shrink-0">
              <AudioWaveform className="h-4 w-4 text-[#0d0d0d]" strokeWidth={2.25} />
              <span className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400 ring-2 ring-[#0d0d0d]" />
            </div>
            <span
              className={cn(
                'font-semibold tracking-[-0.02em] text-[13px] flex items-baseline gap-1 text-white min-w-0',
                collapsed && 'lg:hidden',
              )}
            >
              <span>Chivox</span>
              <span className="bg-gradient-to-r from-indigo-300 via-sky-300 to-emerald-300 bg-clip-text text-transparent truncate">
                MCP
              </span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className={cn(
              'lg:hidden text-white/60 hover:text-white transition-colors',
              !mobileOpen && 'hidden',
            )}
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ⌘K launcher. Expanded = pill with kbd hints, collapsed = icon-only
            with tooltip. Keyboard-first dashboards are the 2025 baseline. */}
        <div className={cn('pt-3', collapsed ? 'lg:px-2 px-3' : 'px-3')}>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger
                onClick={openPalette}
                className="hidden lg:flex w-full h-9 items-center justify-center rounded-md bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 transition-colors ring-1 ring-inset ring-white/5"
                aria-label={t('Search (⌘K)', '搜索 (⌘K)')}
              >
                <Search className="h-3.5 w-3.5" />
              </TooltipTrigger>
              <TooltipContent side="right">
                {t('Search · ⌘K', '搜索 · ⌘K')}
              </TooltipContent>
            </Tooltip>
          ) : null}
          {!collapsed && (
            <button
              type="button"
              onClick={openPalette}
              className="w-full flex items-center gap-2 h-8 px-2.5 rounded-md bg-white/5 hover:bg-white/10 text-[12px] text-zinc-400 hover:text-zinc-200 transition-colors ring-1 ring-inset ring-white/5"
              aria-label={t('Search (⌘K)', '搜索 (⌘K)')}
            >
              <Search className="h-3.5 w-3.5" />
              <span>{t('Search…', '搜索…')}</span>
              <span className="ml-auto flex items-center gap-0.5">
                <kbd className="h-4 min-w-4 px-1 rounded bg-white/10 text-[10px] font-medium text-zinc-400">
                  ⌘
                </kbd>
                <kbd className="h-4 min-w-4 px-1 rounded bg-white/10 text-[10px] font-medium text-zinc-400">
                  K
                </kbd>
              </span>
            </button>
          )}
          {/* Mobile still shows the text-bearing search button even when
              "collapsed" is true (collapse only affects lg+ viewports). */}
          {collapsed && (
            <button
              type="button"
              onClick={openPalette}
              className="lg:hidden w-full flex items-center gap-2 h-8 px-2.5 rounded-md bg-white/5 hover:bg-white/10 text-[12px] text-zinc-400 hover:text-zinc-200 transition-colors ring-1 ring-inset ring-white/5"
              aria-label={t('Search (⌘K)', '搜索 (⌘K)')}
            >
              <Search className="h-3.5 w-3.5" />
              <span>{t('Search…', '搜索…')}</span>
            </button>
          )}
        </div>

        <nav
          className={cn(
            'flex-1 py-3 overflow-y-auto',
            collapsed ? 'lg:px-2 px-3' : 'px-3',
          )}
        >
          <div className="space-y-0.5">
            {NAV.map((item) => (
              <SidebarLink
                key={item.href}
                item={item}
                isActive={isActiveHref(pathname, item.href)}
                collapsed={collapsed}
                onNavigate={() => setMobileOpen(false)}
                label={t(item.label, item.zhLabel)}
              />
            ))}
          </div>

          {/* Resources — docs live inside the same app (not a third-party
              site), so we navigate same-tab via Next.js <Link> and skip the
              ExternalLink chevron. The `?from=dev` flag tells the docs shell
              to render a "Back to dashboard" link, and because it's same-tab
              navigation the browser Back button naturally returns here too. */}
          <div className="mt-4 pt-4 border-t border-white/5 space-y-0.5">
            <SidebarLink
              item={{
                href: '/global/docs?from=dev',
                icon: BookOpen,
                label: 'API Docs',
                zhLabel: 'API 文档',
              }}
              isActive={false}
              collapsed={collapsed}
              label={t('API Docs', 'API 文档')}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </nav>

        {/* Bottom footer: user chip + collapse toggle. Both collapse into
            icon-only affordances when the sidebar is compact. */}
        <div className="border-t border-white/5">
          {user && (
            <UserChip
              user={user}
              collapsed={collapsed}
              onLogout={handleLogout}
              closeMobile={() => setMobileOpen(false)}
            />
          )}

          {/* Desktop-only collapse toggle. On mobile the X button in the
              brand row handles closing; no collapsed state on small screens. */}
          <Tooltip>
            <TooltipTrigger
              onClick={toggleSidebar}
              className={cn(
                'hidden lg:flex w-full items-center gap-2 h-9 border-t border-white/5 text-[11px] text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.03] transition-colors',
                collapsed ? 'justify-center px-0' : 'px-3',
              )}
              aria-label={t('Toggle sidebar (⌘B)', '切换侧边栏 (⌘B)')}
            >
              {collapsed ? (
                <ChevronsRight className="h-3.5 w-3.5" />
              ) : (
                <>
                  <ChevronsLeft className="h-3.5 w-3.5" />
                  <span>{t('Collapse', '折叠')}</span>
                  <span className="ml-auto flex items-center gap-0.5">
                    <kbd className="h-4 min-w-4 px-1 rounded bg-white/10 text-[9px] font-medium">
                      ⌘
                    </kbd>
                    <kbd className="h-4 min-w-4 px-1 rounded bg-white/10 text-[9px] font-medium">
                      B
                    </kbd>
                  </span>
                </>
              )}
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right">
                {t('Expand sidebar · ⌘B', '展开侧边栏 · ⌘B')}
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </aside>
    </>
  );
}

function SidebarLink({
  item,
  isActive,
  collapsed,
  onNavigate,
  label,
  external,
}: {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
  label: string;
  external?: boolean;
}) {
  const Icon = item.icon;
  const content = (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        'group relative flex items-center gap-2.5 rounded-md text-[13px] transition-colors',
        collapsed ? 'lg:justify-center lg:px-0 lg:py-2 px-2.5 py-2' : 'px-2.5 py-2',
        isActive
          ? 'bg-white/[0.06] text-white font-medium'
          : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]',
      )}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-r bg-[var(--brand)]" />
      )}
      <Icon
        className={cn(
          'h-4 w-4 shrink-0 transition-colors',
          isActive ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300',
        )}
      />
      <span className={cn('flex-1 truncate', collapsed && 'lg:hidden')}>{label}</span>
      {external && (
        <ExternalLink
          className={cn(
            'h-3 w-3 text-zinc-600 group-hover:text-zinc-400',
            collapsed && 'lg:hidden',
          )}
        />
      )}
    </Link>
  );

  if (!collapsed) return content;

  return (
    <Tooltip>
      <TooltipTrigger render={content} />
      <TooltipContent side="right" className="hidden lg:block">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

function UserChip({
  user,
  collapsed,
  onLogout,
  closeMobile,
}: {
  user: MockUser;
  collapsed: boolean;
  onLogout: () => void;
  closeMobile: () => void;
}) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  // Close on outside click / Escape so the menu feels like a proper popover.
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const avatar = user.avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
  ) : (
    <div className="h-full w-full bg-gradient-to-br from-indigo-400 to-sky-500 flex items-center justify-center text-[11px] font-semibold text-white">
      {initialsOf(user.name)}
    </div>
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          'w-full flex items-center gap-2.5 transition-colors',
          collapsed ? 'lg:p-2 p-3 lg:justify-center' : 'p-3',
          open ? 'bg-white/[0.06]' : 'hover:bg-white/[0.04]',
        )}
      >
        <div className="h-7 w-7 shrink-0 rounded-full overflow-hidden ring-1 ring-white/10">
          {avatar}
        </div>
        <div className={cn('min-w-0 flex-1 text-left', collapsed && 'lg:hidden')}>
          <p className="text-[13px] font-medium text-zinc-100 truncate leading-tight">
            {user.name}
          </p>
          <p className="text-[11px] text-zinc-500 truncate leading-tight mt-0.5">
            {user.email}
          </p>
        </div>
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            'absolute z-50 bottom-full mb-2 rounded-lg border border-white/10 bg-[#141414] shadow-2xl shadow-black/60 py-1.5 w-56',
            collapsed ? 'lg:left-full lg:bottom-2 lg:ml-2 lg:mb-0 left-2' : 'left-2 right-2 w-auto',
          )}
        >
          <div className="px-3 py-2 flex items-center gap-2.5 border-b border-white/5 mb-1">
            <div className="h-9 w-9 shrink-0 rounded-full overflow-hidden ring-1 ring-white/10">
              {avatar}
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-zinc-100 truncate leading-tight">
                {user.name}
              </p>
              <p className="text-[11px] text-zinc-500 truncate leading-tight mt-0.5">
                {user.email}
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/profile"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              closeMobile();
            }}
            className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-zinc-200 hover:bg-white/[0.06]"
          >
            <UserIcon className="h-3.5 w-3.5 text-zinc-400" />
            {t('Personal profile', '个人资料')}
          </Link>
          <div className="my-1 border-t border-white/5" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-zinc-200 hover:bg-white/[0.06]"
          >
            <LogOut className="h-3.5 w-3.5 text-zinc-400" />
            {t('Log out', '退出登录')}
          </button>
        </div>
      )}
    </div>
  );
}
