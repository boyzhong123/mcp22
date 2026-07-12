'use client';

import { usePathname } from 'next/navigation';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ReactNode } from 'react';

/**
 * Routes that ship the warm-cream English marketing UI (mostly under
 * `src/app/global/*`, plus thin re-export aliases like `/reasoning` →
 * `global/reasoning`). That palette is light-only; locking the document
 * theme prevents `next-themes` from re-applying `.dark` over hard-coded
 * zinc-on-cream typography after hydration.
 */
function isWarmCreamMarketingPath(pathname: string | null): boolean {
  if (!pathname) return false;
  const root = pathname.split('/').filter(Boolean)[0];
  if (!root) return false;
  return (
    root === 'global' ||
    root === 'reasoning' ||
    root === 'runtime' ||
    root === 'faq' ||
    root === 'demo' ||
    root === 'docs' ||
    root === 'about' ||
    root === 'products' ||
    root === 'solutions' ||
    root === 'pricing' ||
    root === 'blog' ||
    root === 'logo-lab'
  );
}

export function RootThemeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const forcedTheme = isWarmCreamMarketingPath(pathname) ? ('light' as const) : undefined;

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      forcedTheme={forcedTheme}
    >
      {children}
    </NextThemesProvider>
  );
}
