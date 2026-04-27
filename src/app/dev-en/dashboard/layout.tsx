'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useMockAuth } from '../_lib/mock-auth';
import { DevEnSidebar } from '../_components/sidebar';
import { DevEnTopBar } from '../_components/topbar';
import { DevEnCommandPalette } from '../_components/command-palette';
import { useUi } from '../_lib/use-ui-store';

export default function DevEnDashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useMockAuth();
  const router = useRouter();
  const collapsed = useUi((s) => s.sidebarCollapsed);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="h-6 w-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  // 1. Canvas is pure `bg-background` (no muted tint). Cards get their own
  //    subtle contrast via border + optional bg-muted/40 instead of relying
  //    on an off-tone canvas. This matches the Linear/Vercel pattern where
  //    the page and cards share the same base and differentiate via borders.
  // 2. Max-width bumped from 1200 → 1360; modern dashboards optimise for
  //    14"+ laptops and widescreen desktops, and our data tables genuinely
  //    need the extra real estate.
  // 3. `main` pads left to match the sidebar's current width so content
  //    reflows when the sidebar collapses / expands.
  return (
    <div className="min-h-dvh bg-background">
      <DevEnSidebar />
      <main
        className={cn(
          'flex flex-col min-h-dvh transition-[padding] duration-200 ease-out',
          collapsed ? 'lg:pl-[60px]' : 'lg:pl-60',
        )}
      >
        <DevEnTopBar />
        <div className="flex-1 px-4 sm:px-6 lg:px-8 pt-6 pb-10 max-w-[1360px] w-full mx-auto">
          {children}
        </div>
      </main>
      <DevEnCommandPalette />
    </div>
  );
}
