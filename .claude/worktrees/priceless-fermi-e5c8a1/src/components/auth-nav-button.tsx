'use client';

import { Link } from '@/i18n/routing';
import { useAuth } from '@/lib/auth-context';
import { LogIn, LayoutDashboard } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function AuthNavButton() {
  const { user, loading } = useAuth();
  const tNav = useTranslations('Navigation');
  const tAuth = useTranslations('Auth');

  if (loading) return null;

  if (user) {
    return (
      <Link
        href="/dashboard/keys"
        className="inline-flex items-center gap-1.5 h-8 px-3 text-sm font-medium rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors"
      >
        <LayoutDashboard className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{tAuth('console')}</span>
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      className="inline-flex items-center gap-1.5 h-9 px-4 text-sm font-semibold rounded-lg bg-foreground text-background hover:bg-foreground/85 transition-colors"
    >
      <LogIn className="h-3.5 w-3.5" />
      <span>{tNav('login')}</span>
    </Link>
  );
}
