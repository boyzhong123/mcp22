'use client';

import { Link, usePathname } from '@/i18n/routing';
import { useAuth } from '@/lib/auth-context';
import { Key, CreditCard, BarChart3, Receipt, LogOut, Menu, X, AudioWaveform } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useLocale } from 'next-intl';

export function DashboardSidebar() {
  const pathname = usePathname();
  const locale = useLocale();
  const isZh = locale.startsWith('zh');
  const navItems = [
    { href: '/dashboard/keys', icon: Key, label: isZh ? 'API Key 管理' : 'API Key Management' },
    { href: '/dashboard/plans', icon: CreditCard, label: isZh ? '会员套餐' : 'Plans' },
    { href: '/dashboard/usage', icon: BarChart3, label: isZh ? '用量统计' : 'Usage' },
    { href: '/dashboard/billing', icon: Receipt, label: isZh ? '费用账单' : 'Billing' },
  ];
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 h-9 w-9 rounded-lg border border-border bg-background flex items-center justify-center hover:bg-muted transition-colors"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-60 bg-foreground text-background flex flex-col transition-transform duration-200 lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-background/10">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-7 w-7 rounded-md bg-background flex items-center justify-center">
              <AudioWaveform className="h-4 w-4 text-foreground" strokeWidth={2.25} />
              <span className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400 ring-2 ring-foreground" />
            </div>
            <span className="font-semibold tracking-[-0.02em] text-sm flex items-baseline gap-1">
              <span>Chivox</span>
              <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent">MCP</span>
            </span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-background/60 hover:text-background transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-background/15 text-background font-medium'
                    : 'text-background/60 hover:text-background hover:bg-background/10'
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="border-t border-background/10 p-4">
          {user && (
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-background/50 truncate">{user.email}</p>
              </div>
              <button
                onClick={logout}
                className="shrink-0 h-8 w-8 rounded-lg flex items-center justify-center text-background/50 hover:text-background hover:bg-background/10 transition-colors"
                title={isZh ? '退出登录' : 'Log out'}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
