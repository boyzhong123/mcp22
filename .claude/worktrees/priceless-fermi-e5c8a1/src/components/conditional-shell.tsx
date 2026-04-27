'use client';

import { usePathname } from '@/i18n/routing';
import { Navigation } from './navigation';
import { Footer } from './footer';

export function ConditionalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith('/dashboard');
  const isAuth = pathname === '/login' || pathname === '/register';

  if (isDashboard || isAuth) {
    return <>{children}</>;
  }

  return (
    <>
      <Navigation />
      <div className="flex-1">{children}</div>
      <Footer />
    </>
  );
}
